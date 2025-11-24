import { db } from '@/lib/db'
import { buildClassFilters, getFilterOptions, type AdminFilters } from '@/lib/admin-filters'
import { AdminFilterBar } from '@/components/admin/AdminFilterBar'

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Parse search params for filters
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

  // Get cascading filter options
  const filterOptions = await getFilterOptions(filters)

  const classWhere = buildClassFilters(filters)

  // Fetch courses with aggregated data (filtered by classes)
  const courses = await db.course.findMany({
    select: {
      id: true,
      code: true,
      title: true,
      subject: true,
      level: true,
      _count: {
        select: {
          classes: {
            where: classWhere,
          },
        },
      },
    },
    orderBy: { code: 'asc' },
  })

  // Fetch classes with full details (filtered)
  const classes = await db.class.findMany({
    where: classWhere,
    include: {
      course: true,
      professor: true,
      _count: {
        select: {
          enrollments: true,
          assessments: true,
        },
      },
    },
    orderBy: [{ year: 'desc' }, { term: 'desc' }],
  })

  // Calculate enrollments for each course
  const courseEnrollments = await Promise.all(
    courses.map(async (course) => {
      const enrollmentCount = await db.enrollment.count({
        where: {
          class: {
            courseId: course.id,
            ...classWhere,
          },
        },
      })
      return { courseId: course.id, count: enrollmentCount }
    })
  )

  const enrollmentMap = new Map(
    courseEnrollments.map((e) => [e.courseId, e.count])
  )

  // Filter courses that have matching classes
  const filteredCourses = courses.filter((c) => c._count.classes > 0)

  const hasFilters = Object.keys(classWhere).length > 0

  return (
    <div>
      {/* Filter Bar */}
      <div className="mb-4">
        <AdminFilterBar
          options={filterOptions}
          availableFilters={{
            showStudent: false,
            showTerm: true,
            showYear: true,
            showProfessor: true,
            showCourse: true,
            showClass: true,
            showAssessment: false,
          }}
        />
      </div>

      {/* Header */}
      <div className="mb-4">
        <h1 className="display-5 fw-bold text-primary mb-2">📚 Courses & Classes</h1>
        <p className="text-muted lead">
          View course catalog and class sections. Each class is a professor teaching a course in a specific term.
        </p>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button className="nav-link active" id="classes-tab" data-bs-toggle="pill" data-bs-target="#classes" type="button" role="tab">
            <span className="badge bg-primary me-2">{classes.length}</span>
            Classes
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link" id="courses-tab" data-bs-toggle="pill" data-bs-target="#courses" type="button" role="tab">
            <span className="badge bg-primary me-2">{hasFilters ? filteredCourses.length : courses.length}</span>
            Courses
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Classes Tab */}
        <div className="tab-pane fade show active" id="classes" role="tabpanel">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-1">Classes</h5>
              <p className="mb-0 small opacity-90">
                {hasFilters
                  ? 'Class sections matching your filters (professor teaching a course in a specific term)'
                  : 'All class sections - each represents a professor teaching a course in a specific term'}
              </p>
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
                        <th className="text-white">Class</th>
                        <th className="text-white">Course</th>
                        <th className="text-white">Professor</th>
                        <th className="text-white">Term</th>
                        <th className="text-white text-end">Students</th>
                        <th className="text-white text-end">Assessments</th>
                        <th className="text-white">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map((classItem) => (
                        <tr key={classItem.id}>
                          <td>
                            <div className="fw-semibold">{classItem.title}</div>
                            <div className="small text-muted">
                              <code className="text-primary">{classItem.classCode}</code>
                            </div>
                          </td>
                          <td>
                            <div className="fw-semibold">{classItem.course.code}</div>
                            <div className="small text-muted">{classItem.course.title}</div>
                          </td>
                          <td>
                            {classItem.professor.fullName || classItem.professor.email}
                          </td>
                          <td>
                            {classItem.term} {classItem.year}
                          </td>
                          <td className="text-end">
                            <span className="badge bg-info">{classItem._count.enrollments}</span>
                          </td>
                          <td className="text-end">
                            <span className="badge bg-info">{classItem._count.assessments}</span>
                          </td>
                          <td>
                            {classItem.isActive ? (
                              <span className="badge bg-success">Active</span>
                            ) : (
                              <span className="badge bg-secondary">Inactive</span>
                            )}
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

        {/* Courses Tab */}
        <div className="tab-pane fade" id="courses" role="tabpanel">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-1">Courses</h5>
              <p className="mb-0 small opacity-90">
                {hasFilters
                  ? 'Courses that have class sections matching your filters'
                  : 'All courses in the catalog with their total class sections and enrolled students'}
              </p>
            </div>
            <div className="card-body p-0">
              {(hasFilters ? filteredCourses : courses).length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p className="mb-0">
                    {hasFilters
                      ? 'No courses found with classes matching the selected filters'
                      : 'No courses in catalog'}
                  </p>
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th className="text-white">Code</th>
                        <th className="text-white">Title</th>
                        <th className="text-white">Subject</th>
                        <th className="text-white">Level</th>
                        <th className="text-white text-end">
                          {hasFilters ? 'Filtered ' : ''}Classes
                        </th>
                        <th className="text-white text-end">
                          {hasFilters ? 'Filtered ' : ''}Students
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(hasFilters ? filteredCourses : courses).map((course) => (
                        <tr key={course.id}>
                          <td>
                            <code className="text-primary fw-semibold">{course.code}</code>
                          </td>
                          <td className="fw-semibold">{course.title}</td>
                          <td className="text-muted">
                            {course.subject || 'N/A'}
                          </td>
                          <td>
                            {course.level ? (
                              <span className="badge bg-primary bg-opacity-10 text-primary border border-primary">
                                {course.level}
                              </span>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="text-end">
                            <span className="badge bg-info">{course._count.classes}</span>
                          </td>
                          <td className="text-end">
                            <span className="badge bg-info">{enrollmentMap.get(course.id) || 0}</span>
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
