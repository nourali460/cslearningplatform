import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ClassCodeCopy } from '@/components/ClassCodeCopy'

export default async function ProfessorDashboard() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'professor') {
    redirect('/')
  }

  // Fetch professor's classes with details
  const classes = await db.class.findMany({
    where: {
      professorId: user.id
    },
    include: {
      course: true,
      _count: {
        select: {
          enrollments: true,
          assessments: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Calculate statistics
  const totalClasses = classes.length
  const totalEnrollments = classes.reduce((sum, cls) => sum + cls._count.enrollments, 0)
  const totalAssessments = classes.reduce((sum, cls) => sum + cls._count.assessments, 0)

  // Get recent submissions for professor's classes
  const recentSubmissions = await db.assessmentSubmission.findMany({
    where: {
      assessment: {
        class: {
          professorId: user.id
        }
      }
    },
    include: {
      student: true,
      assessment: {
        include: {
          class: true
        }
      }
    },
    orderBy: { submittedAt: 'desc' },
    take: 5
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Professor Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user.fullName || user.email}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <div className="text-xs text-muted-foreground mt-1">Active classes</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments}</div>
            <div className="text-xs text-muted-foreground mt-1">Across all classes</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssessments}</div>
            <div className="text-xs text-muted-foreground mt-1">Total assignments</div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Classes</CardTitle>
          <CardDescription>
            Classes you are teaching this term
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No classes assigned yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Class Code</th>
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium">Term</th>
                    <th className="pb-3 font-medium">Section</th>
                    <th className="pb-3 font-medium text-right">Students</th>
                    <th className="pb-3 font-medium text-right">Assessments</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((classItem) => (
                    <tr key={classItem.id} className="border-b">
                      <td className="py-3">
                        <ClassCodeCopy classCode={classItem.classCode} />
                      </td>
                      <td className="py-3">{classItem.title}</td>
                      <td className="py-3">{classItem.term} {classItem.year}</td>
                      <td className="py-3">{classItem.section || '-'}</td>
                      <td className="py-3 text-right">{classItem._count.enrollments}</td>
                      <td className="py-3 text-right">{classItem._count.assessments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>
            Latest student submissions across your classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentSubmissions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                  <div>
                    <div className="font-medium">{submission.student.fullName || submission.student.email}</div>
                    <div className="text-sm text-muted-foreground">
                      {submission.assessment.title} · {submission.assessment.class.classCode}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {submission.totalScore ? `${submission.totalScore}/${submission.assessment.maxPoints}` : 'Not graded'}
                    </div>
                    <div className="text-xs text-muted-foreground">{submission.status || 'submitted'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
