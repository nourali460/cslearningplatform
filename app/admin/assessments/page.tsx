import { db } from '@/lib/db'
import {
  buildAssessmentFilters,
  buildSubmissionFilters,
  getFilterOptions,
  type AdminFilters,
} from '@/lib/admin-filters'
import { AdminFilterBar } from '@/components/admin/AdminFilterBar'

export default async function AdminAssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Parse search params for filters
  const params = await searchParams
  const filters: AdminFilters = {
    term: params && typeof params.term === 'string' ? params.term : undefined,
    year: params && typeof params.year === 'string' ? parseInt(params.year) : undefined,
    professorId:
      params && typeof params.professorId === 'string' ? params.professorId : undefined,
    courseId: params && typeof params.courseId === 'string' ? params.courseId : undefined,
    classId: params && typeof params.classId === 'string' ? params.classId : undefined,
    studentId: params && typeof params.studentId === 'string' ? params.studentId : undefined,
    assessmentId:
      params && typeof params.assessmentId === 'string' ? params.assessmentId : undefined,
  }

  // Get cascading filter options
  const filterOptions = await getFilterOptions(filters)

  const assessmentWhere = buildAssessmentFilters(filters)
  const submissionWhere = buildSubmissionFilters(filters)

  const [assessments, submissions] = await Promise.all([
    db.assessment.findMany({
      where: assessmentWhere,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        class: {
          include: {
            course: {
              select: {
                code: true,
                title: true,
              },
            },
            professor: {
              select: {
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    }),
    // Individual submissions with student data
    db.assessmentSubmission.findMany({
      where: submissionWhere,
      orderBy: {
        submittedAt: 'desc',
      },
      include: {
        assessment: {
          include: {
            class: {
              include: {
                course: {
                  select: {
                    code: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
        student: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    }),
  ])

  const hasFilters = Object.keys(assessmentWhere).length > 0 || filters.studentId !== undefined || filters.assessmentId !== undefined

  return (
    <div>
      {/* Filter Bar */}
      <div className="mb-4">
        <AdminFilterBar
          options={filterOptions}
          availableFilters={{
            showStudent: true,
            showTerm: true,
            showYear: true,
            showProfessor: true,
            showCourse: true,
            showClass: true,
            showAssessment: true,
          }}
        />
      </div>

      {/* Header */}
      <div className="mb-4">
        <h1 className="display-5 fw-bold text-primary mb-2">📝 Assessments & Grades</h1>
        <p className="text-muted lead">
          View assessments and grading statistics. Filters affect which class assessments are shown.
        </p>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button className="nav-link active" id="assessments-tab" data-bs-toggle="pill" data-bs-target="#assessments" type="button" role="tab">
            <span className="badge bg-primary me-2">{assessments.length}</span>
            Assessments
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link" id="submissions-tab" data-bs-toggle="pill" data-bs-target="#submissions" type="button" role="tab">
            Submissions & Grades
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Assessments Tab */}
        <div className="tab-pane fade show active" id="assessments" role="tabpanel">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-1">Assessments</h5>
              <p className="mb-0 small opacity-90">
                {hasFilters
                  ? 'Assessments from classes matching your filters'
                  : 'All assignments, labs, and exams across all classes'}
              </p>
            </div>
            <div className="card-body p-0">
              {assessments.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p className="mb-0">No assessments found matching the selected filters</p>
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th className="text-white">Title</th>
                        <th className="text-white">Class</th>
                        <th className="text-white">Professor</th>
                        <th className="text-white">Due Date</th>
                        <th className="text-white">Points</th>
                        <th className="text-white">Submissions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessments.map((assessment) => (
                        <tr key={assessment.id}>
                          <td>
                            <div className="fw-semibold">{assessment.title}</div>
                            <div className="small text-muted">{assessment.slug}</div>
                          </td>
                          <td>
                            <div className="fw-semibold">{assessment.class.course.code}</div>
                            <div className="small text-muted">
                              <code className="text-primary">{assessment.class.classCode}</code>
                            </div>
                          </td>
                          <td className="small">
                            {assessment.class.professor.fullName || 'N/A'}
                          </td>
                          <td className="small">
                            {assessment.dueAt ? (
                              <div>
                                <div>{new Date(assessment.dueAt).toLocaleDateString()}</div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                  {new Date(assessment.dueAt).toLocaleTimeString(
                                    [],
                                    {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted">No due date</span>
                            )}
                          </td>
                          <td>
                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary">
                              {assessment.maxPoints.toString()} pts
                            </span>
                          </td>
                          <td className="small">
                            <span className="badge bg-info">{assessment._count.submissions}</span> submissions
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submissions & Grades Tab */}
        <div className="tab-pane fade" id="submissions" role="tabpanel">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-1">Submissions & Grades</h5>
              <p className="mb-0 small opacity-90">
                Individual student submissions and grades
                {hasFilters && ' (filtered)'}
              </p>
            </div>
            <div className="card-body p-0">
              {submissions.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p className="mb-0">No submissions found matching the selected filters</p>
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th className="text-white">Student</th>
                        <th className="text-white">Assessment</th>
                        <th className="text-white">Course / Class</th>
                        <th className="text-white">Score</th>
                        <th className="text-white">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((submission) => (
                        <tr key={submission.id}>
                          <td>
                            <div className="fw-semibold">
                              {submission.student.fullName || 'N/A'}
                            </div>
                            <div className="small text-muted">
                              {submission.student.email}
                            </div>
                          </td>
                          <td>
                            <div className="fw-semibold">
                              {submission.assessment.title}
                            </div>
                          </td>
                          <td>
                            <div className="fw-semibold">
                              {submission.assessment.class.course.code}
                            </div>
                            <div className="small text-muted">
                              <code className="text-primary">{submission.assessment.class.classCode}</code>
                            </div>
                          </td>
                          <td>
                            {submission.totalScore !== null ? (
                              <div>
                                <span className="fw-semibold">
                                  {submission.totalScore.toString()}
                                </span>
                                <span className="small text-muted">
                                  {' '}
                                  / {submission.assessment.maxPoints.toString()}
                                </span>
                              </div>
                            ) : (
                              <span className="badge bg-warning text-dark">Pending</span>
                            )}
                          </td>
                          <td className="small text-muted">
                            <div>{new Date(submission.submittedAt).toLocaleDateString()}</div>
                            <div style={{ fontSize: '0.75rem' }}>
                              {new Date(submission.submittedAt).toLocaleTimeString(
                                [],
                                { hour: '2-digit', minute: '2-digit' }
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
