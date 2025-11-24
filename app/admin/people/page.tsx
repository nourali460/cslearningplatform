import { db } from '@/lib/db'
import { buildClassFilters, buildEnrollmentFilters, getFilterOptions, type AdminFilters } from '@/lib/admin-filters'
import { ProfessorApprovalToggle } from '@/components/admin/ProfessorApprovalToggle'
import { AdminFilterBar } from '@/components/admin/AdminFilterBar'
import { PasswordManager } from '@/components/admin/PasswordManager'

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const filters: AdminFilters = {
    term: params && typeof params.term === 'string' ? params.term : undefined,
    year: params && typeof params.year === 'string' ? parseInt(params.year) : undefined,
    professorId: params && typeof params.professorId === 'string' ? params.professorId : undefined,
    courseId: params && typeof params.courseId === 'string' ? params.courseId : undefined,
    classId: params && typeof params.classId === 'string' ? params.classId : undefined,
    studentId: params && typeof params.studentId === 'string' ? params.studentId : undefined,
    assessmentId: params && typeof params.assessmentId === 'string' ? params.assessmentId : undefined,
  }

  const filterOptions = await getFilterOptions(filters)
  const classWhere = buildClassFilters(filters)
  const enrollmentWhere = buildEnrollmentFilters(filters)

  // Build student where clause based on filters
  const studentWhere: any = { role: 'student' }
  const professorWhere: any = { role: 'professor' }

  // If filters are applied, we need to filter students/professors who have matching enrollments/classes
  if (Object.keys(enrollmentWhere).length > 0) {
    // Show only students with enrollments matching the filters
    studentWhere.enrollments = { some: enrollmentWhere }
  }

  if (Object.keys(classWhere).length > 0) {
    // Show only professors with classes matching the filters
    professorWhere.professorClasses = { some: classWhere }
  }

  const [students, professors, admins] = await Promise.all([
    db.user.findMany({
      where: studentWhere,
      select: {
        id: true,
        fullName: true,
        email: true,
        usernameSchoolId: true,
        password: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.user.findMany({
      where: professorWhere,
      select: {
        id: true,
        fullName: true,
        email: true,
        usernameSchoolId: true,
        password: true,
        isApproved: true,
        createdAt: true,
        _count: {
          select: {
            professorClasses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        fullName: true,
        email: true,
        usernameSchoolId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const hasFilters = Object.keys(classWhere).length > 0

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="display-5 fw-bold text-primary mb-2">👥 People Management</h1>
        <p className="text-muted lead">View and manage platform users - students, professors, and admins.</p>
      </div>

      {/* Filter Bar */}
      <div className="mb-4">
        <AdminFilterBar
          options={filterOptions}
          availableFilters={{
            showStudent: false,
            showTerm: true,
            showYear: true,
            showProfessor: false,
            showCourse: true,
            showClass: true,
            showAssessment: false,
          }}
        />
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button className="nav-link active" id="students-tab" data-bs-toggle="pill" data-bs-target="#students" type="button" role="tab">
            <span className="badge bg-primary me-2">{students.length}</span>
            Students
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link" id="professors-tab" data-bs-toggle="pill" data-bs-target="#professors" type="button" role="tab">
            <span className="badge bg-primary me-2">{professors.length}</span>
            Professors
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link" id="admins-tab" data-bs-toggle="pill" data-bs-target="#admins" type="button" role="tab">
            <span className="badge bg-primary me-2">{admins.length}</span>
            Admins
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content" id="pills-tabContent">
        {/* Students Tab */}
        <div className="tab-pane fade show active" id="students" role="tabpanel" aria-labelledby="students-tab">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">📚 Students</h5>
            </div>
            <div className="card-body p-0">
              {students.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p className="mb-0">No students found</p>
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th className="text-white">Name</th>
                        <th className="text-white">Email</th>
                        <th className="text-white">School ID</th>
                        <th className="text-white">Password</th>
                        <th className="text-white">{hasFilters ? 'Filtered ' : ''}Enrollments</th>
                        <th className="text-white">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id}>
                          <td className="fw-semibold">{student.fullName || 'N/A'}</td>
                          <td className="text-muted">{student.email}</td>
                          <td><code className="text-primary">{student.usernameSchoolId || '-'}</code></td>
                          <td>
                            <PasswordManager
                              userId={student.id}
                              initialPassword={student.password}
                              userName={student.fullName || student.email}
                              userRole="student"
                            />
                          </td>
                          <td>
                            <span className="badge bg-info">{student._count.enrollments}</span>
                          </td>
                          <td className="text-muted small">
                            {new Date(student.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
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

        {/* Professors Tab */}
        <div className="tab-pane fade" id="professors" role="tabpanel" aria-labelledby="professors-tab">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">👨‍🏫 Professors</h5>
            </div>
            <div className="card-body p-0">
              {professors.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p className="mb-0">No professors found</p>
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th className="text-white">Name</th>
                        <th className="text-white">Email</th>
                        <th className="text-white">School ID</th>
                        <th className="text-white">Password</th>
                        <th className="text-white">{hasFilters ? 'Filtered ' : ''}Classes Teaching</th>
                        <th className="text-white">Approval Status</th>
                        <th className="text-white">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {professors.map((professor) => (
                        <tr key={professor.id}>
                          <td className="fw-semibold">{professor.fullName || 'N/A'}</td>
                          <td className="text-muted">{professor.email}</td>
                          <td><code className="text-primary">{professor.usernameSchoolId || '-'}</code></td>
                          <td>
                            <PasswordManager
                              userId={professor.id}
                              initialPassword={professor.password}
                              userName={professor.fullName || professor.email}
                              userRole="professor"
                            />
                          </td>
                          <td>
                            <span className="badge bg-info">{professor._count.professorClasses}</span>
                          </td>
                          <td>
                            <ProfessorApprovalToggle
                              userId={professor.id}
                              currentStatus={professor.isApproved}
                              professorName={professor.fullName || professor.email}
                            />
                          </td>
                          <td className="text-muted small">
                            {new Date(professor.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
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

        {/* Admins Tab */}
        <div className="tab-pane fade" id="admins" role="tabpanel" aria-labelledby="admins-tab">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">👑 Administrators</h5>
            </div>
            <div className="card-body p-0">
              {admins.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p className="mb-0">No administrators found</p>
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th className="text-white">Name</th>
                        <th className="text-white">Email</th>
                        <th className="text-white">School ID</th>
                        <th className="text-white">Access Level</th>
                        <th className="text-white">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <tr key={admin.id}>
                          <td className="fw-semibold">{admin.fullName || 'N/A'}</td>
                          <td className="text-muted">{admin.email}</td>
                          <td><code className="text-primary">{admin.usernameSchoolId || '-'}</code></td>
                          <td>
                            <span className="badge bg-danger">Full Access</span>
                          </td>
                          <td className="text-muted small">
                            {new Date(admin.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
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
