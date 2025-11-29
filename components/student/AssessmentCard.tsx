import Link from 'next/link'
import { Calendar, Clock, Award, CheckCircle, AlertCircle } from 'lucide-react'
import { AssessmentTypeBadge } from './AssessmentTypeIcon'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type AssessmentType = 'INTERACTIVE_LESSON' | 'LAB' | 'EXAM' | 'QUIZ' | 'DISCUSSION'
type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'GRADED' | 'RETURNED' | 'LATE'

type AssessmentCardProps = {
  assignment: {
    id: string
    title: string
    dueAt: string | null
    maxPoints: number
    type: AssessmentType
    class: {
      id: string
      classCode: string
      course: {
        code: string
        title: string
      }
    }
    submission: {
      id: string
      submittedAt: string
      status: SubmissionStatus
      totalScore: number | null
      isLate: boolean
      attemptNumber: number
    } | null
    status: string
    isOverdue: boolean
    isPending: boolean
    isSubmitted: boolean
    isGraded: boolean
  }
}

export function AssessmentCard({ assignment }: AssessmentCardProps) {
  const getStatusBadge = () => {
    if (assignment.isOverdue) {
      return <Badge variant="error">Overdue</Badge>
    }
    if (assignment.isGraded) {
      return <Badge variant="success">Graded</Badge>
    }
    if (assignment.isSubmitted) {
      return <Badge variant="info">Submitted</Badge>
    }
    return <Badge variant="default">Not Started</Badge>
  }

  const getDaysUntilDue = () => {
    if (!assignment.dueAt) return null
    const now = new Date()
    const dueDate = new Date(assignment.dueAt)
    const diffTime = dueDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return null
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `Due in ${diffDays} days`
  }

  const getScoreColor = () => {
    if (!assignment.submission?.totalScore) return ''
    const percentage =
      (Number(assignment.submission.totalScore) / Number(assignment.maxPoints)) * 100
    if (percentage >= 90) return 'text-success'
    if (percentage >= 80) return 'text-primary'
    if (percentage >= 70) return 'text-warning'
    return 'text-danger'
  }

  const daysUntilDue = getDaysUntilDue()

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-accent-purple/40">
      {/* Card Header */}
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-3">
          <AssessmentTypeBadge type={assignment.type} />
          {getStatusBadge()}
        </div>
        <h5 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">{assignment.title}</h5>
        <p className="text-sm text-muted-foreground">
          {assignment.class.course.code} • {assignment.class.classCode}
        </p>
      </CardHeader>

      {/* Card Body */}
      <CardContent className="flex-1 space-y-4">
        {/* Due Date */}
        {assignment.dueAt && (
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                {new Date(assignment.dueAt).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {' at '}
                {new Date(assignment.dueAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {daysUntilDue && (
              <div className="flex items-center text-xs">
                <Clock className="h-3 w-3 mr-1" />
                <span
                  className={
                    assignment.isOverdue
                      ? 'text-danger font-medium'
                      : daysUntilDue.includes('today') || daysUntilDue.includes('tomorrow')
                        ? 'text-warning font-medium'
                        : 'text-info'
                  }
                >
                  {daysUntilDue}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Points */}
        <div className="flex items-center text-sm text-muted-foreground">
          <Award className="h-4 w-4 mr-2" />
          <span>{Number(assignment.maxPoints).toFixed(0)} points</span>
        </div>

        {/* Submission Info */}
        {assignment.submission && (
          <div className="mt-4 pt-4 border-t border-border">
            {assignment.isGraded && assignment.submission.totalScore !== null ? (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Your Score</div>
                <div className={`text-2xl font-bold ${getScoreColor()}`}>
                  {Number(assignment.submission.totalScore).toFixed(1)} /{' '}
                  {Number(assignment.maxPoints).toFixed(0)}
                  <span className="text-sm ml-2 text-muted-foreground">
                    (
                    {(
                      (Number(assignment.submission.totalScore) / Number(assignment.maxPoints)) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-success" />
                <span>
                  Submitted on{' '}
                  {new Date(assignment.submission.submittedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                {assignment.submission.isLate && (
                  <Badge variant="warning" className="ml-2">Late</Badge>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Card Footer */}
      <CardFooter className="pt-4">
        <Button asChild className="w-full" variant={assignment.isPending ? 'default' : 'outline'}>
          <Link href={`/student/assignments/${assignment.id}`}>
            {assignment.isPending
              ? 'Start Assignment'
              : assignment.isGraded
                ? 'View Feedback'
                : 'View Submission'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
