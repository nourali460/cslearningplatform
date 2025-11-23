import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { db } from '@/lib/db'
import { buildClassFilters, type AdminFilters } from '@/lib/admin-filters'

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
  }

  // Check if "No Course" filter is selected
  const isNoCourseFilter = filters.courseId === 'no-course'

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Courses & Classes</h1>
        <p className="text-muted-foreground mt-2">
          View course catalog and class sections. Each class is a professor teaching a course in a specific term.
        </p>
      </div>

      {/* No Course Filter Notice */}
      {isNoCourseFilter && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              The "No Course" filter only applies to the <strong>People</strong> page to show students with no enrollments.
              {' '}On this page, you're viewing all courses and classes.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="classes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="classes">
            Classes ({classes.length})
          </TabsTrigger>
          <TabsTrigger value="courses">
            Courses ({hasFilters ? filteredCourses.length : courses.length})
          </TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>Classes</CardTitle>
              <CardDescription>
                {hasFilters
                  ? 'Class sections matching your filters (professor teaching a course in a specific term)'
                  : 'All class sections - each represents a professor teaching a course in a specific term'}
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
                        <th className="pb-3 font-medium">Class</th>
                        <th className="pb-3 font-medium">Course</th>
                        <th className="pb-3 font-medium">Professor</th>
                        <th className="pb-3 font-medium">Term</th>
                        <th className="pb-3 font-medium text-right">Students</th>
                        <th className="pb-3 font-medium text-right">Assessments</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map((classItem) => (
                        <tr key={classItem.id} className="border-b">
                          <td className="py-3">
                            <div className="font-medium">{classItem.title}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {classItem.classCode}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="font-medium">{classItem.course.code}</div>
                            <div className="text-xs text-muted-foreground">
                              {classItem.course.title}
                            </div>
                          </td>
                          <td className="py-3">
                            {classItem.professor.fullName || classItem.professor.email}
                          </td>
                          <td className="py-3">
                            {classItem.term} {classItem.year}
                          </td>
                          <td className="py-3 text-right">
                            {classItem._count.enrollments}
                          </td>
                          <td className="py-3 text-right">
                            {classItem._count.assessments}
                          </td>
                          <td className="py-3">
                            {classItem.isActive ? (
                              <Badge variant="default">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Courses</CardTitle>
              <CardDescription>
                {hasFilters
                  ? 'Courses that have class sections matching your filters'
                  : 'All courses in the catalog with their total class sections and enrolled students'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(hasFilters ? filteredCourses : courses).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {hasFilters
                    ? 'No courses found with classes matching the selected filters'
                    : 'No courses in catalog'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Code</th>
                        <th className="pb-3 font-medium">Title</th>
                        <th className="pb-3 font-medium">Subject</th>
                        <th className="pb-3 font-medium">Level</th>
                        <th className="pb-3 font-medium text-right">
                          {hasFilters ? 'Filtered ' : ''}Classes
                        </th>
                        <th className="pb-3 font-medium text-right">
                          {hasFilters ? 'Filtered ' : ''}Students
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(hasFilters ? filteredCourses : courses).map((course) => (
                        <tr key={course.id} className="border-b">
                          <td className="py-3 font-mono font-medium">
                            {course.code}
                          </td>
                          <td className="py-3">{course.title}</td>
                          <td className="py-3 text-muted-foreground">
                            {course.subject || 'N/A'}
                          </td>
                          <td className="py-3">
                            {course.level ? (
                              <Badge variant="outline">{course.level}</Badge>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {course._count.classes}
                          </td>
                          <td className="py-3 text-right">
                            {enrollmentMap.get(course.id) || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
