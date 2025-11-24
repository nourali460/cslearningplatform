import { db } from '@/lib/db'
import {
  buildClassFilters,
  buildEnrollmentFilters,
  buildAssessmentFilters,
  buildSubmissionFilters,
  getFilterOptions,
  type AdminFilters,
} from '@/lib/admin-filters'
import { AdminFilterBar } from '@/components/admin/AdminFilterBar'

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const filters: AdminFilters = {
    term: params && typeof params.term === 'string' ? params.term : undefined,
    year: params && typeof params.year === 'string' ? parseInt(params.year) : undefined,
    professorId:
      params && typeof params.professorId === 'string' ? params.professorId : undefined,
    courseId: params && typeof params.courseId === 'string' ? params.courseId : undefined,
    classId: params && typeof params.classId === 'string' ? params.classId : undefined,
    studentId: params && typeof params.studentId === 'string' ? params.studentId : undefined,
    assessmentId: params && typeof params.assessmentId === 'string' ? params.assessmentId : undefined,
  }

  const filterOptions = await getFilterOptions(filters)

  const classWhere = buildClassFilters(filters)
  const enrollmentWhere = buildEnrollmentFilters(filters)
  const assessmentWhere = buildAssessmentFilters(filters)
  const submissionWhere = buildSubmissionFilters(filters)

  const [
    totalUsers,
    adminCount,
    professorCount,
    studentCount,
    totalCourses,
    totalClasses,
    totalEnrollments,
    totalAssessments,
    totalSubmissions,
    classes,
    allProfessors,
    allStudents,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: 'admin' } }),
    db.user.count({ where: { role: 'professor' } }),
    db.user.count({ where: { role: 'student' } }),
    db.course.count(),
    db.class.count({ where: classWhere }),
    db.enrollment.count({ where: enrollmentWhere }),
    db.assessment.count({ where: assessmentWhere }),
    db.assessmentSubmission.count({ where: submissionWhere }),
    db.class.findMany({
      where: classWhere,
      include: {
        professor: true,
        course: true,
        _count: {
          select: {
            enrollments: true,
            assessments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    db.user.findMany({
      where: { role: 'professor' },
      select: {
        id: true,
        _count: {
          select: {
            professorClasses: true,
          },
        },
      },
    }),
    db.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    }),
  ])

  const professorsWithNoClasses = allProfessors.filter(
    (prof) => prof._count.professorClasses === 0
  ).length

  const studentsWithNoEnrollments = allStudents.filter(
    (student) => student._count.enrollments === 0
  ).length

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="display-5 fw-bold text-primary mb-2">📊 Platform Overview</h1>
        <p className="text-muted lead">High-level platform snapshot. Use filters to view specific data.</p>
      </div>

      {/* Filter Bar */}
      <div className="mb-4">
        <AdminFilterBar options={filterOptions} />
      </div>

      {/* Statistics Cards */}
      <div className="row g-4 mb-4">
        {/* Total Users Card */}
        <div className="col-md-6 col-lg-3">
          <div className="card h-100 border-primary">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="card-subtitle text-muted mb-0">Total Users</h6>
                <span className="fs-4">👥</span>
              </div>
              <h2 className="card-title text-primary fw-bold mb-3">{totalUsers}</h2>
              <div className="small text-muted">
                <div className="d-flex justify-content-between mb-1">
                  <span>👑 Admins:</span>
                  <span className="fw-semibold">{adminCount}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>👨‍🏫 Professors:</span>
                  <span className="fw-semibold">{professorCount}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>🎓 Students:</span>
                  <span className="fw-semibold">{studentCount}</span>
                </div>
              </div>
              {(professorsWithNoClasses > 0 || studentsWithNoEnrollments > 0) && (
                <div className="mt-3 pt-3 border-top">
                  {professorsWithNoClasses > 0 && (
                    <div className="small text-warning mb-1">
                      ⚠️ {professorsWithNoClasses} professor{professorsWithNoClasses !== 1 ? 's' : ''} with 0 classes
                    </div>
                  )}
                  {studentsWithNoEnrollments > 0 && (
                    <div className="small text-warning">
                      ⚠️ {studentsWithNoEnrollments} student{studentsWithNoEnrollments !== 1 ? 's' : ''} not enrolled
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Courses Card */}
        <div className="col-md-6 col-lg-3">
          <div className="card h-100 border-info">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="card-subtitle text-muted mb-0">Courses</h6>
                <span className="fs-4">📚</span>
              </div>
              <h2 className="card-title text-info fw-bold mb-1">{totalCourses}</h2>
              <p className="small text-muted mb-0">In catalog</p>
            </div>
          </div>
        </div>

        {/* Classes Card */}
        <div className="col-md-6 col-lg-3">
          <div className="card h-100 border-success">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="card-subtitle text-muted mb-0">
                  {Object.keys(classWhere).length > 0 ? 'Filtered' : 'Active'} Classes
                </h6>
                <span className="fs-4">🏫</span>
              </div>
              <h2 className="card-title text-success fw-bold mb-1">{totalClasses}</h2>
              <p className="small text-muted mb-0">{totalEnrollments} enrollments</p>
            </div>
          </div>
        </div>

        {/* Assessments Card */}
        <div className="col-md-6 col-lg-3">
          <div className="card h-100 border-warning">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="card-subtitle text-muted mb-0">Assessments</h6>
                <span className="fs-4">📝</span>
              </div>
              <h2 className="card-title text-warning fw-bold mb-1">{totalAssessments}</h2>
              <p className="small text-muted mb-0">{totalSubmissions} submissions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Classes Table */}
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">
            {Object.keys(classWhere).length > 0 ? '🔍 Filtered Classes' : '🕒 Recent Classes'}
          </h5>
        </div>
        <div className="card-body p-0">
          {classes.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <p className="mb-0">No classes found matching the selected filters</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th className="text-white">Class Code</th>
                    <th className="text-white">Title</th>
                    <th className="text-white">Term</th>
                    <th className="text-white">Year</th>
                    <th className="text-white">Professor</th>
                    <th className="text-white text-end">Enrollments</th>
                    <th className="text-white text-end">Assessments</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((classItem) => (
                    <tr key={classItem.id}>
                      <td><code className="text-primary fw-semibold">{classItem.classCode}</code></td>
                      <td className="fw-semibold">{classItem.title}</td>
                      <td>{classItem.term}</td>
                      <td>{classItem.year}</td>
                      <td className="text-muted">
                        {classItem.professor.fullName || classItem.professor.email}
                      </td>
                      <td className="text-end">
                        <span className="badge bg-info">{classItem._count.enrollments}</span>
                      </td>
                      <td className="text-end">
                        <span className="badge bg-warning text-dark">{classItem._count.assessments}</span>
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
  )
}
