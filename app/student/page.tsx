import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, FileText, TrendingUp, Plus, Calendar, Award, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Dashboard</h1>
        <p className="text-foreground-secondary">
          Welcome back, {user.fullName || user.email}!
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-accent-purple">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground-secondary">
              Enrolled Classes
            </CardTitle>
            <BookOpen className="h-5 w-5 text-accent-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalClasses}</div>
            <p className="text-xs text-muted-foreground mt-1">Active enrollments</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground-secondary">
              Submissions
            </CardTitle>
            <FileText className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalSubmissions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {gradedSubmissions.length} graded
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent-orange">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground-secondary">
              Average Score
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-accent-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{averageScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Across graded work</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground-secondary">
              Completion
            </CardTitle>
            <Award className="h-5 w-5 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{completionRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Assignments completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Classes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>Your current enrollments</CardDescription>
            </div>
            <Button asChild size="sm">
              <Link href="/student/enroll">
                <Plus className="h-4 w-4 mr-2" />
                Enroll in Class
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">You are not enrolled in any classes yet.</p>
              <Button asChild variant="outline">
                <Link href="/student/enroll">
                  <Plus className="h-4 w-4 mr-2" />
                  Enroll in Your First Class
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <h6 className="font-semibold text-accent-purple mb-2">
                      {enrollment.class.course.code}: {enrollment.class.course.title}
                    </h6>
                    <div className="text-sm text-muted-foreground space-y-1 mb-3">
                      <div>
                        {enrollment.class.term} {enrollment.class.year} · Section{' '}
                        {enrollment.class.section}
                      </div>
                      <div>
                        Professor: {enrollment.class.professor.fullName || enrollment.class.professor.email}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <code className="text-xs px-2 py-1 bg-muted rounded-lg">{enrollment.class.classCode}</code>
                      <Badge variant="info">
                        {enrollment.class._count.assessments} assessments
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        {enrollments.length > 0 && (
          <CardFooter className="justify-end">
            <Button asChild variant="ghost" size="sm">
              <Link href="/student/classes">
                View All Classes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Assessments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assessments</CardTitle>
            <CardDescription>Assignments you haven't submitted yet</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAssessments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming assessments.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAssessments.map((assessment) => (
                  <div key={assessment.id} className="flex items-start justify-between gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="flex-1">
                      <h6 className="font-medium text-foreground mb-1">{assessment.title}</h6>
                      <div className="text-sm text-muted-foreground">
                        {assessment.class.course.code} · {assessment.class.classCode}
                      </div>
                      {assessment.dueAt && (
                        <div className="flex items-center gap-1 text-xs text-warning mt-1.5">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(assessment.dueAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      )}
                    </div>
                    <Badge>Pending</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {upcomingAssessments.length > 0 && (
            <CardFooter className="justify-end">
              <Button asChild variant="ghost" size="sm">
                <Link href="/student/assignments">
                  Modules
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Recent Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Your latest assignment submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No submissions yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.slice(0, 5).map((submission) => (
                  <div key={submission.id} className="pb-4 border-b last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h6 className="font-medium text-foreground mb-1">{submission.assessment.title}</h6>
                        <div className="text-sm text-muted-foreground">
                          {submission.assessment.class.course.code}
                        </div>
                      </div>
                      <div className="text-right">
                        {submission.totalScore !== null ? (
                          <div className="text-sm">
                            <span className="font-bold text-foreground">
                              {Number(submission.totalScore).toFixed(1)}
                            </span>
                            <span className="text-muted-foreground">
                              /{Number(submission.assessment.maxPoints).toFixed(0)}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                        <div className="text-xs text-muted-foreground capitalize mt-1">
                          {submission.status?.toLowerCase()}
                        </div>
                      </div>
                    </div>
                    {submission.feedback && (
                      <div className="text-sm text-muted-foreground italic border-l-2 border-info pl-3 mt-2">
                        {submission.feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {submissions.length > 0 && (
            <CardFooter className="justify-end">
              <Button asChild variant="ghost" size="sm">
                <Link href="/student/assignments">
                  Modules
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
