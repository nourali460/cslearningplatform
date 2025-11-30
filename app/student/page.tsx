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

      {/* Compact Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border-l-4 border-l-accent-purple bg-background-secondary/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-accent-purple" />
            <span className="text-xs text-foreground-tertiary">Classes</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{totalClasses}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Active</div>
        </div>

        <div className="border-l-4 border-l-success bg-background-secondary/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-success" />
            <span className="text-xs text-foreground-tertiary">Submissions</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{totalSubmissions}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{gradedSubmissions.length} graded</div>
        </div>

        <div className="border-l-4 border-l-accent-orange bg-background-secondary/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-accent-orange" />
            <span className="text-xs text-foreground-tertiary">Average</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{averageScore.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground mt-0.5">Graded work</div>
        </div>

        <div className="border-l-4 border-l-info bg-background-secondary/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-info" />
            <span className="text-xs text-foreground-tertiary">Completion</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{completionRate.toFixed(0)}%</div>
          <div className="text-xs text-muted-foreground mt-0.5">Done</div>
        </div>
      </div>

      {/* Enrolled Classes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">My Classes</CardTitle>
              <CardDescription className="text-xs">Your enrollments</CardDescription>
            </div>
            <Button asChild size="sm">
              <Link href="/student/enroll">
                <Plus className="h-3 w-3 mr-1.5" />
                Enroll
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {enrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <BookOpen className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">You are not enrolled in any classes yet.</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/student/enroll">
                  <Plus className="h-3 w-3 mr-1.5" />
                  Enroll in Your First Class
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="border border-border rounded-lg p-3 bg-background-secondary/30 hover:shadow-sm transition-shadow">
                  <div className="font-semibold text-sm text-accent-purple mb-1.5 leading-tight">
                    {enrollment.class.course.code}: {enrollment.class.course.title}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {enrollment.class.term} {enrollment.class.year} • Sec {enrollment.class.section} • {enrollment.class.professor.fullName || enrollment.class.professor.email}
                  </div>
                  <div className="flex items-center justify-between">
                    <code className="text-xs px-1.5 py-0.5 bg-muted rounded">{enrollment.class.classCode}</code>
                    <Badge variant="info" className="text-xs px-2 py-0">
                      {enrollment.class._count.assessments}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        {enrollments.length > 0 && (
          <CardFooter className="pt-3 pb-4 justify-end">
            <Button asChild variant="ghost" size="sm">
              <Link href="/student/classes">
                View All
                <ArrowRight className="h-3 w-3 ml-1.5" />
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
