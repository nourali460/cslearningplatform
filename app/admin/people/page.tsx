import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { db } from '@/lib/db'
import { buildClassFilters, buildEnrollmentFilters, type AdminFilters } from '@/lib/admin-filters'
import { ProfessorApprovalToggle } from '@/components/admin/ProfessorApprovalToggle'

export default async function PeoplePage({
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

  const classWhere = buildClassFilters(filters)
  const enrollmentWhere = buildEnrollmentFilters(filters)

  // Fetch all users with filtered activity counts
  const [allStudents, professors, admins] = await Promise.all([
    db.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: {
              where: enrollmentWhere,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.user.findMany({
      where: { role: 'professor' },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        isApproved: true,
        createdAt: true,
        _count: {
          select: {
            professorClasses: {
              where: classWhere,
            },
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
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Filter students based on "No Course" selection
  const isNoCourseFilter = filters.courseId === 'no-course'
  const students = isNoCourseFilter
    ? allStudents.filter((student) => student._count.enrollments === 0)
    : allStudents.filter((student) => student._count.enrollments > 0)

  const hasFilters = Object.keys(classWhere).length > 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">People</h1>
        <p className="text-muted-foreground mt-2">
          View and manage platform users. Use "No Course" filter to find students not enrolled in any classes.
        </p>
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">
            Students ({students.length})
          </TabsTrigger>
          <TabsTrigger value="professors">
            Professors ({professors.length})
          </TabsTrigger>
          <TabsTrigger value="admins">
            Admins ({admins.length})
          </TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                {isNoCourseFilter
                  ? 'Students not enrolled in any classes'
                  : `Students enrolled in classes${hasFilters ? ' (enrollment counts filtered by active filters)' : ''}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">
                          {hasFilters ? 'Filtered ' : ''}Enrollments
                        </th>
                        <th className="pb-3 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="border-b">
                          <td className="py-3">
                            {student.fullName || 'N/A'}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {student.email}
                          </td>
                          <td className="py-3">
                            {student._count.enrollments}
                          </td>
                          <td className="py-3 text-sm text-muted-foreground">
                            {new Date(student.createdAt).toLocaleDateString()}
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

        {/* Professors Tab */}
        <TabsContent value="professors">
          <Card>
            <CardHeader>
              <CardTitle>Professors</CardTitle>
              <CardDescription>
                Professors registered on the platform
                {hasFilters && ' (teaching counts filtered by active filters)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {professors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No professors found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Username</th>
                        <th className="pb-3 font-medium">
                          {hasFilters ? 'Filtered ' : ''}Classes Teaching
                        </th>
                        <th className="pb-3 font-medium">Approval Status</th>
                        <th className="pb-3 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {professors.map((professor) => (
                        <tr key={professor.id} className="border-b">
                          <td className="py-3">
                            {professor.fullName || 'N/A'}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {professor.email}
                          </td>
                          <td className="py-3 font-mono text-sm">
                            {professor.username || <span className="text-muted-foreground italic">Not set</span>}
                          </td>
                          <td className="py-3">
                            {professor._count.professorClasses}
                          </td>
                          <td className="py-3">
                            <ProfessorApprovalToggle
                              userId={professor.id}
                              currentStatus={professor.isApproved}
                              professorName={professor.fullName || professor.email}
                            />
                          </td>
                          <td className="py-3 text-sm text-muted-foreground">
                            {new Date(professor.createdAt).toLocaleDateString()}
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

        {/* Admins Tab */}
        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle>Administrators</CardTitle>
              <CardDescription>
                Platform administrators with full access
              </CardDescription>
            </CardHeader>
            <CardContent>
              {admins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No administrators found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Access Level</th>
                        <th className="pb-3 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <tr key={admin.id} className="border-b">
                          <td className="py-3">
                            {admin.fullName || 'N/A'}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {admin.email}
                          </td>
                          <td className="py-3">
                            <Badge variant="default">Full Access</Badge>
                          </td>
                          <td className="py-3 text-sm text-muted-foreground">
                            {new Date(admin.createdAt).toLocaleDateString()}
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
