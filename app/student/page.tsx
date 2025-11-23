import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function StudentDashboard() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'student') {
    redirect('/')
  }

  // Fetch student's enrollments and classes
  const enrollments = await db.enrollment.findMany({
    where: {
      studentId: user.id
    },
    include: {
      class: {
        include: {
          course: true,
          professor: true,
          _count: {
            select: {
              assessments: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Fetch student's submissions
  const submissions = await db.assessmentSubmission.findMany({
    where: {
      studentId: user.id
    },
    include: {
      assessment: {
        include: {
          class: {
            include: {
              course: true
            }
          }
        }
      }
    },
    orderBy: { submittedAt: 'desc' }
  })

  // Get upcoming assessments (assessments without submissions)
  const enrolledClassIds = enrollments.map(e => e.class.id)
  const submittedAssessmentIds = submissions.map(s => s.assessmentId)

  const upcomingAssessments = await db.assessment.findMany({
    where: {
      classId: {
        in: enrolledClassIds
      },
      id: {
        notIn: submittedAssessmentIds
      }
    },
    include: {
      class: {
        include: {
          course: true
        }
      }
    },
    orderBy: { dueAt: 'asc' },
    take: 5
  })

  // Calculate statistics
  const totalClasses = enrollments.length
  const totalSubmissions = submissions.length
  const gradedSubmissions = submissions.filter(s => s.status === 'graded')
  const averageScore = gradedSubmissions.length > 0
    ? gradedSubmissions.reduce((sum, s) => sum + (Number(s.totalScore) || 0), 0) / gradedSubmissions.length
    : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user.fullName || user.email}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enrolled Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <div className="text-xs text-muted-foreground mt-1">Active enrollments</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
            <div className="text-xs text-muted-foreground mt-1">{gradedSubmissions.length} graded</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground mt-1">Across graded work</div>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Classes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>
                Your current enrollments
              </CardDescription>
            </div>
            <Link href="/student/enroll">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Enroll in Class
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm mb-4">You are not enrolled in any classes yet.</p>
              <Link href="/student/enroll">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Enroll in Your First Class
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{enrollment.class.course.code}: {enrollment.class.course.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {enrollment.class.term} {enrollment.class.year} · Section {enrollment.class.section} · {enrollment.class.classCode}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Professor: {enrollment.class.professor.fullName || enrollment.class.professor.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{enrollment.class._count.assessments} assessments</div>
                      <div className="text-xs text-muted-foreground capitalize">{enrollment.status}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming Assessments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assessments</CardTitle>
            <CardDescription>
              Assignments you haven't submitted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAssessments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No upcoming assessments.</p>
            ) : (
              <div className="space-y-3">
                {upcomingAssessments.map((assessment) => (
                  <div key={assessment.id} className="border-b pb-3 last:border-b-0">
                    <div className="font-medium">{assessment.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {assessment.class.course.code} · {assessment.class.classCode}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {assessment.dueAt ? `Due: ${new Date(assessment.dueAt).toLocaleDateString()}` : 'No due date'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>
              Your latest assignment submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No submissions yet.</p>
            ) : (
              <div className="space-y-3">
                {submissions.slice(0, 5).map((submission) => (
                  <div key={submission.id} className="border-b pb-3 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{submission.assessment.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {submission.assessment.class.course.code}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {submission.totalScore ? `${submission.totalScore}/${submission.assessment.maxPoints}` : 'Pending'}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {submission.status || 'submitted'}
                        </div>
                      </div>
                    </div>
                    {submission.feedback && (
                      <div className="text-xs text-muted-foreground mt-2 italic">
                        {submission.feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
