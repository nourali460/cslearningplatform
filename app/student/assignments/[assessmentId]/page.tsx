'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  FileText,
  BookOpen,
  ClipboardList,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AssessmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params?.assessmentId as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (assessmentId) {
      fetchAssessmentDetails()
    }
  }, [assessmentId])

  const fetchAssessmentDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/student/assessments/${assessmentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch assessment details')
      }
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleEnterAssignment = () => {
    const { assessment } = data

    // Route based on assessment type
    switch (assessment.type) {
      case 'DISCUSSION':
        router.push(`/student/assignments/${assessmentId}/discussion`)
        break
      case 'QUIZ':
      case 'EXAM':
        router.push(`/student/assignments/${assessmentId}/take`)
        break
      case 'LAB':
        router.push(`/student/assignments/${assessmentId}/submit`)
        break
      case 'INTERACTIVE_LESSON':
        router.push(`/student/assignments/${assessmentId}/lesson`)
        break
      default:
        router.push(`/student/assignments/${assessmentId}/submit`)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DISCUSSION':
        return <MessageSquare className="h-6 w-6" />
      case 'QUIZ':
      case 'EXAM':
        return <ClipboardList className="h-6 w-6" />
      case 'LAB':
        return <FileText className="h-6 w-6" />
      case 'INTERACTIVE_LESSON':
        return <BookOpen className="h-6 w-6" />
      default:
        return <FileText className="h-6 w-6" />
    }
  }

  const getStatusBadge = () => {
    if (!data) return null
    const { status } = data

    if (status.isOverdue) {
      return (
        <Badge variant="error" className="flex items-center gap-1">
          <AlertCircle size={14} />
          Overdue
        </Badge>
      )
    }
    if (status.isGraded) {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle size={14} />
          Graded
        </Badge>
      )
    }
    if (status.isSubmitted) {
      return (
        <Badge variant="info" className="flex items-center gap-1">
          <CheckCircle size={14} />
          Submitted
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Clock size={14} />
        Not Started
      </Badge>
    )
  }

  const getButtonText = () => {
    if (!data) return 'Continue'
    const { assessment, status } = data

    if (status.isGraded) return 'View Feedback'
    if (status.isSubmitted) return 'View Submission'

    switch (assessment.type) {
      case 'DISCUSSION':
        return 'Enter Discussion Board'
      case 'QUIZ':
      case 'EXAM':
        return status.isPending ? 'Take Assessment' : 'Continue Assessment'
      case 'LAB':
        return status.isPending ? 'Submit Lab' : 'View Submission'
      case 'INTERACTIVE_LESSON':
        return 'Start Lesson'
      default:
        return 'Start Assignment'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent-purple" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card className="border-error">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-error mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Assignment</h3>
            <p className="text-muted-foreground mb-4">
              {error || 'Assignment not found or you do not have access to it.'}
            </p>
            <Button onClick={() => router.push('/student/assignments')}>
              Back to Assignments
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { assessment, submission, status, discussionData } = data

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/student/assignments')}
        className="mb-4"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Assignments
      </Button>

      {/* Assignment Header */}
      <div className="mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-accent-purple/10 rounded-lg text-accent-purple">
            {getTypeIcon(assessment.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="purple">
                {assessment.type.replace(/_/g, ' ')}
              </Badge>
              {getStatusBadge()}
            </div>
            <h1 className="text-3xl font-bold mb-2">{assessment.title}</h1>
            <p className="text-muted-foreground">
              {assessment.class.course.code} • {assessment.class.classCode} • {assessment.class.professor.fullName}
            </p>
          </div>
        </div>
      </div>

      {/* Assignment Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Due Date */}
        {assessment.dueAt && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Due Date</div>
                  <div className="font-semibold">
                    {new Date(assessment.dueAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(assessment.dueAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Points */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground mb-1">Points Available</div>
                <div className="font-semibold text-2xl">
                  {Number(assessment.maxPoints).toFixed(0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score (if graded) */}
        {status.isGraded && submission?.totalScore !== null && (
          <Card className="border-l-4 border-l-success">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Your Score</div>
                  <div className="font-semibold text-2xl text-success">
                    {Number(submission.totalScore).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {((Number(submission.totalScore) / Number(assessment.maxPoints)) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Description / Instructions */}
      {assessment.description && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{assessment.description}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discussion-Specific Requirements */}
      {assessment.type === 'DISCUSSION' && discussionData && (
        <Card className="mb-6 border-l-4 border-l-accent-purple">
          <CardHeader>
            <CardTitle>Discussion Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className={discussionData.hasPosted ? 'text-success' : 'text-muted-foreground'} size={20} />
              <div>
                <div className="font-medium">
                  {discussionData.hasPosted ? 'Initial post created ✓' : 'Create your initial post'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Share your thoughts and answer the discussion prompt
                </div>
              </div>
            </div>

            {discussionData.allowPeerReplies && (
              <div className="flex items-start gap-3">
                <CheckCircle
                  className={discussionData.meetsRequirements ? 'text-success' : 'text-muted-foreground'}
                  size={20}
                />
                <div>
                  <div className="font-medium">
                    Reply to {discussionData.minimumReplies} peer{discussionData.minimumReplies !== 1 ? 's' : ''}
                    {discussionData.replyCount >= discussionData.minimumReplies && ' ✓'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Progress: {discussionData.replyCount} / {discussionData.minimumReplies} replies
                  </div>
                </div>
              </div>
            )}

            {discussionData.requirePostBeforeViewing && !discussionData.hasPosted && (
              <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                <AlertCircle className="text-warning" size={20} />
                <div className="text-sm">
                  <strong>Note:</strong> You must create your post before you can view other students' posts.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submission Status */}
      {submission && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submission Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-semibold">{status.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted:</span>
                <span>
                  {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {submission.isLate && <Badge variant="warning" className="ml-2">Late</Badge>}
                </span>
              </div>
              {submission.attemptNumber > 1 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attempt:</span>
                  <span>{submission.attemptNumber}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleEnterAssignment}
            className="w-full"
            size="lg"
            disabled={status.isOverdue && !submission}
          >
            {getButtonText()}
          </Button>
          {status.isOverdue && !submission && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              This assignment is overdue and no longer accepting submissions
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
