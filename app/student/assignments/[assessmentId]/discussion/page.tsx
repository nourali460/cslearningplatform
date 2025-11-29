'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, MessageSquare, CheckCircle, Circle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DiscussionPostForm } from '@/components/student/DiscussionPostForm'
import { StudentDiscussionPost } from '@/components/student/StudentDiscussionPost'
import { SafeHTML } from '@/components/ui/safe-html'

interface DiscussionReply {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    fullName?: string
    email?: string
  }
}

interface DiscussionPost {
  id: string
  content: string
  createdAt: string
  isPinned: boolean
  likeCount: number
  student: {
    id: string
    fullName?: string
    email?: string
  }
  replies: DiscussionReply[]
  _count: {
    replies: number
  }
}

export default function StudentDiscussionPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params?.assessmentId as string

  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<DiscussionPost[]>([])
  const [assessment, setAssessment] = useState<any>(null)
  const [requirePost, setRequirePost] = useState(false)
  const [currentStudentId, setCurrentStudentId] = useState<string>('')
  const [replyCount, setReplyCount] = useState(0)

  useEffect(() => {
    if (assessmentId) {
      fetchCurrentStudent()
      fetchDiscussions()
    }
  }, [assessmentId])

  const fetchCurrentStudent = async () => {
    try {
      const response = await fetch('/api/student/whoami')
      if (response.ok) {
        const data = await response.json()
        setCurrentStudentId(data.user.id)
      }
    } catch (error) {
      console.error('Error fetching current student:', error)
    }
  }

  const fetchDiscussions = async () => {
    if (!assessmentId) return

    try {
      const response = await fetch(`/api/student/assessments/${assessmentId}/discussions`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
        setAssessment(data.assessment)
        setRequirePost(data.requirePost || false)
        setReplyCount(data.replyCount || 0)
      } else {
        console.error('Failed to fetch discussions')
      }
    } catch (error) {
      console.error('Error fetching discussions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePostCreated = () => {
    setRequirePost(false)
    fetchDiscussions()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Check if student has already posted
  const studentPost = posts.find((p) => p.student.id === currentStudentId)
  const minimumReplies = assessment?.minimumReplyCount || 1
  const meetsRequirements = studentPost && replyCount >= minimumReplies

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/student/assignments/${assessmentId}`)}
          className="mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Assignment Details
        </Button>

        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="h-8 w-8 text-accent-purple" />
          <div>
            <h1 className="text-3xl font-bold">{assessment?.title || 'Discussion'}</h1>
            <p className="text-muted-foreground">
              Participate in the class discussion
            </p>
          </div>
        </div>

        {/* Assessment Info */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="purple">Discussion</Badge>
          <Badge variant="outline">{assessment?.maxPoints || 0} points</Badge>
          {assessment?.minimumReplyCount && (
            <Badge variant="info">
              {assessment.minimumReplyCount} replies required
            </Badge>
          )}
          {assessment?.requirePostBeforeViewing && (
            <Badge variant="warning">
              Post before viewing others
            </Badge>
          )}
        </div>
      </div>

      {/* Discussion Prompt */}
      {(assessment?.customDescription || assessment?.description) && (
        <Card className="mb-6 border-l-4 border-l-accent-purple">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Discussion Prompt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg">
              <SafeHTML html={assessment.customDescription || assessment.description} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Tracker */}
      {studentPost && (
        <Card className={`mb-6 ${meetsRequirements ? 'border-l-4 border-l-success' : 'border-l-4 border-l-warning'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {meetsRequirements ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <AlertCircle className="h-5 w-5 text-warning" />
              )}
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-success" size={20} />
              <div>
                <div className="font-medium">Initial post created ✓</div>
                <div className="text-sm text-muted-foreground">Great job sharing your thoughts!</div>
              </div>
            </div>

            {assessment?.allowPeerReplies && (
              <div className="flex items-center gap-3">
                {replyCount >= minimumReplies ? (
                  <CheckCircle className="text-success" size={20} />
                ) : (
                  <Circle className="text-muted-foreground" size={20} />
                )}
                <div>
                  <div className="font-medium">
                    Reply to {minimumReplies} peer{minimumReplies !== 1 ? 's' : ''}
                    {replyCount >= minimumReplies && ' ✓'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Progress: {replyCount} / {minimumReplies} replies
                    {replyCount < minimumReplies && ` — ${minimumReplies - replyCount} more needed`}
                  </div>
                </div>
              </div>
            )}

            {meetsRequirements && (
              <div className="p-3 bg-success/10 rounded-lg">
                <p className="text-sm text-success font-medium">
                  🎉 Discussion requirements completed! You've earned full credit.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Require Post Notice */}
      {requirePost && (
        <Card className="mb-6 border-l-4 border-l-warning">
          <CardContent className="py-4">
            <h3 className="font-semibold mb-2">Post Required</h3>
            <p className="text-sm text-muted-foreground">
              You must create your own post before viewing other students' posts.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create Post Form (if student hasn't posted yet) */}
      {!studentPost && (
        <div className="mb-6">
          <DiscussionPostForm
            assessmentId={assessmentId}
            onPostCreated={handlePostCreated}
          />
        </div>
      )}

      {/* Student's Own Post */}
      {studentPost && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Post</h2>
          <StudentDiscussionPost
            post={studentPost}
            currentStudentId={currentStudentId}
            allowReplies={false}
            showAnonymous={assessment?.allowAnonymous || false}
            onReplyCreated={fetchDiscussions}
          />
        </div>
      )}

      {/* Discussion Posts */}
      {!requirePost && (
        <Card>
          <CardHeader>
            <CardTitle>Class Discussion</CardTitle>
            <CardDescription>
              {posts.filter((p) => p.student.id !== currentStudentId).length} post
              {posts.filter((p) => p.student.id !== currentStudentId).length !== 1
                ? 's'
                : ''}{' '}
              from classmates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {posts.filter((p) => p.student.id !== currentStudentId).length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground">
                  Be the first to share your thoughts!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts
                  .filter((p) => p.student.id !== currentStudentId)
                  .map((post) => (
                    <StudentDiscussionPost
                      key={post.id}
                      post={post}
                      currentStudentId={currentStudentId}
                      allowReplies={assessment?.allowPeerReplies !== false}
                      showAnonymous={assessment?.allowAnonymous || false}
                      onReplyCreated={fetchDiscussions}
                    />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
