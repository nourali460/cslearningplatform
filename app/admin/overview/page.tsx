import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { db } from '@/lib/db'
import {
  buildClassFilters,
  buildEnrollmentFilters,
  buildAssessmentFilters,
  buildSubmissionFilters,
  type AdminFilters,
} from '@/lib/admin-filters'

export default async function OverviewPage({
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
  }

  // Check if "No Course" filter is selected
  const isNoCourseFilter = filters.courseId === 'no-course'

  const classWhere = buildClassFilters(filters)
  const enrollmentWhere = buildEnrollmentFilters(filters)
  const assessmentWhere = buildAssessmentFilters(filters)
  const submissionWhere = buildSubmissionFilters(filters)

  // Fetch all statistics
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
    // Fetch all professors with their class count
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
    // Fetch all students with their enrollment count
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

  // Count professors with 0 classes
  const professorsWithNoClasses = allProfessors.filter(
    (prof) => prof._count.professorClasses === 0
  ).length

  // Count students with 0 enrollments
  const studentsWithNoEnrollments = allStudents.filter(
    (student) => student._count.enrollments === 0
  ).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-2">
          High-level platform snapshot. Use filters to view specific term, year, professor, or course data.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {adminCount} admin · {professorCount} professors · {studentCount}{' '}
              students
            </div>
            {professorsWithNoClasses > 0 && (
              <div className="text-xs text-orange-600 mt-1">
                {professorsWithNoClasses} professor{professorsWithNoClasses !== 1 ? 's' : ''} teaching 0 classes
              </div>
            )}
            {studentsWithNoEnrollments > 0 && (
              <div className="text-xs text-orange-600 mt-1">
                {studentsWithNoEnrollments} student{studentsWithNoEnrollments !== 1 ? 's' : ''} not enrolled
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourses}</div>
            <div className="text-xs text-muted-foreground mt-1">In catalog</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {Object.keys(classWhere).length > 0 ? 'Filtered' : 'Active'} Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalEnrollments} enrollments
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssessments}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalSubmissions} submissions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {Object.keys(classWhere).length > 0 ? 'Filtered' : 'Recent'} Classes
          </CardTitle>
          <CardDescription>
            {Object.keys(classWhere).length > 0
              ? 'Classes matching your filter criteria'
              : 'Most recently created classes'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No classes found matching the selected filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Class Code</th>
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium">Term</th>
                    <th className="pb-3 font-medium">Year</th>
                    <th className="pb-3 font-medium">Professor</th>
                    <th className="pb-3 font-medium text-right">Enrollments</th>
                    <th className="pb-3 font-medium text-right">Assessments</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((classItem) => (
                    <tr key={classItem.id} className="border-b">
                      <td className="py-3 font-mono text-sm">
                        {classItem.classCode}
                      </td>
                      <td className="py-3">{classItem.title}</td>
                      <td className="py-3">{classItem.term}</td>
                      <td className="py-3">{classItem.year}</td>
                      <td className="py-3">
                        {classItem.professor.fullName ||
                          classItem.professor.email}
                      </td>
                      <td className="py-3 text-right">
                        {classItem._count.enrollments}
                      </td>
                      <td className="py-3 text-right">
                        {classItem._count.assessments}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
