import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, FileText, TrendingUp, Plus, Calendar, Award } from 'lucide-react'

export default async function StudentDashboard() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'student') {
    redirect('/')
  }

  // Fetch student's enrollments and classes
  const enrollments = await db.enrollment.findMany({
    where: {
      studentId: user.id,
    },
    include: {
      class: {
        include: {
          course: true,
          professor: true,
          _count: {
            select: {
              assessments: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Fetch student's submissions
  const submissions = await db.assessmentSubmission.findMany({
    where: {
      studentId: user.id,
    },
    include: {
      assessment: {
        include: {
          class: {
            include: {
              course: true,
            },
          },
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  })

  // Get upcoming assessments (assessments without submissions)
  const enrolledClassIds = enrollments.map((e) => e.class.id)
  const submittedAssessmentIds = submissions.map((s) => s.assessmentId)

  const upcomingAssessments = await db.assessment.findMany({
    where: {
      classId: {
        in: enrolledClassIds,
      },
      id: {
        notIn: submittedAssessmentIds,
      },
    },
    include: {
      class: {
        include: {
          course: true,
        },
      },
    },
    orderBy: { dueAt: 'asc' },
    take: 5,
  })

  // Calculate statistics
  const totalClasses = enrollments.length
  const totalSubmissions = submissions.length
  const gradedSubmissions = submissions.filter((s) => s.status === 'GRADED')
  const averageScore =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (Number(s.totalScore) || 0), 0) /
        gradedSubmissions.length
      : 0

  // Calculate completion rate
  const totalAssessments = enrollments.reduce(
    (sum, e) => sum + e.class._count.assessments,
    0
  )
  const completionRate =
    totalAssessments > 0 ? (totalSubmissions / totalAssessments) * 100 : 0

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="display-5 fw-bold text-primary mb-2">📊 Dashboard</h1>
        <p className="text-muted lead">
          Welcome back, {user.fullName || user.email}!
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <BookOpen className="text-primary me-2" size={20} />
                <h6 className="card-subtitle text-muted mb-0">Enrolled Classes</h6>
              </div>
              <h2 className="card-title mb-1">{totalClasses}</h2>
              <p className="card-text small text-muted mb-0">Active enrollments</p>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <FileText className="text-success me-2" size={20} />
                <h6 className="card-subtitle text-muted mb-0">Submissions</h6>
              </div>
              <h2 className="card-title mb-1">{totalSubmissions}</h2>
              <p className="card-text small text-muted mb-0">
                {gradedSubmissions.length} graded
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <TrendingUp className="text-warning me-2" size={20} />
                <h6 className="card-subtitle text-muted mb-0">Average Score</h6>
              </div>
              <h2 className="card-title mb-1">{averageScore.toFixed(1)}%</h2>
              <p className="card-text small text-muted mb-0">Across graded work</p>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <Award className="text-info me-2" size={20} />
                <h6 className="card-subtitle text-muted mb-0">Completion</h6>
              </div>
              <h2 className="card-title mb-1">{completionRate.toFixed(0)}%</h2>
              <p className="card-text small text-muted mb-0">Assignments completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Classes */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="card-title mb-1">📚 My Classes</h5>
              <p className="card-text small text-muted mb-0">Your current enrollments</p>
            </div>
            <Link href="/student/enroll" className="btn btn-primary btn-sm">
              <Plus size={16} className="me-1" />
              Enroll in Class
            </Link>
          </div>
        </div>
        <div className="card-body">
          {enrollments.length === 0 ? (
            <div className="text-center py-5">
              <BookOpen size={48} className="text-muted mb-3" />
              <p className="text-muted mb-3">You are not enrolled in any classes yet.</p>
              <Link href="/student/enroll" className="btn btn-outline-primary">
                <Plus size={16} className="me-1" />
                Enroll in Your First Class
              </Link>
            </div>
          ) : (
            <div className="row g-3">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="col-md-6">
                  <div className="card border hover-shadow h-100">
                    <div className="card-body">
                      <h6 className="card-title fw-bold text-primary mb-2">
                        {enrollment.class.course.code}: {enrollment.class.course.title}
                      </h6>
                      <div className="small text-muted mb-2">
                        <div>
                          {enrollment.class.term} {enrollment.class.year} · Section{' '}
                          {enrollment.class.section}
                        </div>
                        <div>
                          Professor: {enrollment.class.professor.fullName || enrollment.class.professor.email}
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <code className="small text-primary">{enrollment.class.classCode}</code>
                        <span className="badge bg-info">
                          {enrollment.class._count.assessments} assessments
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {enrollments.length > 0 && (
          <div className="card-footer bg-transparent border-top-0 text-end">
            <Link href="/student/classes" className="btn btn-sm btn-link">
              View All Classes →
            </Link>
          </div>
        )}
      </div>

      <div className="row g-4">
        {/* Upcoming Assessments */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom">
              <h5 className="card-title mb-1">📅 Upcoming Assessments</h5>
              <p className="card-text small text-muted mb-0">
                Assignments you haven't submitted yet
              </p>
            </div>
            <div className="card-body">
              {upcomingAssessments.length === 0 ? (
                <div className="text-center py-4">
                  <Calendar size={32} className="text-muted mb-2" />
                  <p className="text-muted small mb-0">No upcoming assessments.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {upcomingAssessments.map((assessment) => (
                    <div key={assessment.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{assessment.title}</h6>
                          <div className="small text-muted">
                            {assessment.class.course.code} · {assessment.class.classCode}
                          </div>
                          {assessment.dueAt && (
                            <div className="small text-warning mt-1">
                              <Calendar size={12} className="me-1" />
                              Due: {new Date(assessment.dueAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                          )}
                        </div>
                        <span className="badge bg-secondary">Pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {upcomingAssessments.length > 0 && (
              <div className="card-footer bg-transparent border-top-0 text-end">
                <Link href="/student/assignments" className="btn btn-sm btn-link">
                  View All Assignments →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom">
              <h5 className="card-title mb-1">📤 Recent Submissions</h5>
              <p className="card-text small text-muted mb-0">
                Your latest assignment submissions
              </p>
            </div>
            <div className="card-body">
              {submissions.length === 0 ? (
                <div className="text-center py-4">
                  <FileText size={32} className="text-muted mb-2" />
                  <p className="text-muted small mb-0">No submissions yet.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {submissions.slice(0, 5).map((submission) => (
                    <div key={submission.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{submission.assessment.title}</h6>
                          <div className="small text-muted">
                            {submission.assessment.class.course.code}
                          </div>
                        </div>
                        <div className="text-end">
                          {submission.totalScore !== null ? (
                            <div>
                              <span className="fw-bold">
                                {Number(submission.totalScore).toFixed(1)}
                              </span>
                              <span className="text-muted">
                                /{Number(submission.assessment.maxPoints).toFixed(0)}
                              </span>
                            </div>
                          ) : (
                            <span className="badge bg-warning text-dark">Pending</span>
                          )}
                          <div className="small text-muted text-capitalize">
                            {submission.status?.toLowerCase()}
                          </div>
                        </div>
                      </div>
                      {submission.feedback && (
                        <div className="small text-muted fst-italic border-start border-3 border-info ps-2 mt-2">
                          {submission.feedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {submissions.length > 0 && (
              <div className="card-footer bg-transparent border-top-0 text-end">
                <Link href="/student/assignments" className="btn btn-sm btn-link">
                  View All Submissions →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
