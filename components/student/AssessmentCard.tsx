import Link from 'next/link'
import { Calendar, Clock, Award, CheckCircle, AlertCircle } from 'lucide-react'
import { AssessmentTypeBadge } from './AssessmentTypeIcon'

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
      return <span className="badge bg-danger">Overdue</span>
    }
    if (assignment.isGraded) {
      return <span className="badge bg-success">Graded</span>
    }
    if (assignment.isSubmitted) {
      return <span className="badge bg-primary">Submitted</span>
    }
    return <span className="badge bg-secondary">Not Started</span>
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
    <div className="card h-100 border-0 shadow-sm hover-shadow">
      {/* Card Header */}
      <div className="card-header bg-white border-bottom">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <AssessmentTypeBadge type={assignment.type} />
          {getStatusBadge()}
        </div>
        <h5 className="card-title mb-1">{assignment.title}</h5>
        <p className="text-muted small mb-0">
          {assignment.class.course.code} • {assignment.class.classCode}
        </p>
      </div>

      {/* Card Body */}
      <div className="card-body">
        {/* Due Date */}
        {assignment.dueAt && (
          <div className="mb-3">
            <div className="d-flex align-items-center text-muted small">
              <Calendar size={14} className="me-2" />
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
              <div
                className={`small mt-1 ${
                  assignment.isOverdue
                    ? 'text-danger'
                    : daysUntilDue.includes('today') || daysUntilDue.includes('tomorrow')
                      ? 'text-warning'
                      : 'text-info'
                }`}
              >
                <Clock size={14} className="me-1" />
                {daysUntilDue}
              </div>
            )}
          </div>
        )}

        {/* Points */}
        <div className="mb-3">
          <div className="d-flex align-items-center text-muted small">
            <Award size={14} className="me-2" />
            <span>{Number(assignment.maxPoints).toFixed(0)} points</span>
          </div>
        </div>

        {/* Submission Info */}
        {assignment.submission && (
          <div className="mt-3 pt-3 border-top">
            {assignment.isGraded && assignment.submission.totalScore !== null ? (
              <div>
                <div className="small text-muted mb-1">Your Score</div>
                <h4 className={`mb-0 ${getScoreColor()}`}>
                  {Number(assignment.submission.totalScore).toFixed(1)} /{' '}
                  {Number(assignment.maxPoints).toFixed(0)}
                  <span className="small ms-2">
                    (
                    {(
                      (Number(assignment.submission.totalScore) / Number(assignment.maxPoints)) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </h4>
              </div>
            ) : (
              <div className="small text-muted">
                <CheckCircle size={14} className="me-1" />
                Submitted on{' '}
                {new Date(assignment.submission.submittedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {assignment.submission.isLate && (
                  <span className="badge bg-warning text-dark ms-2">Late</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="card-footer bg-transparent border-top-0">
        <Link
          href={`/student/assignments/${assignment.id}`}
          className="btn btn-outline-primary w-100"
        >
          {assignment.isPending
            ? 'Start Assignment'
            : assignment.isGraded
              ? 'View Feedback'
              : 'View Submission'}
        </Link>
      </div>
    </div>
  )
}
