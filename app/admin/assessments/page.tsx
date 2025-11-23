import { db } from '@/lib/db'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  buildAssessmentFilters,
  buildSubmissionFilters,
  type AdminFilters,
} from '@/lib/admin-filters'

export default async function AdminAssessmentsPage({
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
    studentId: params && typeof params.studentId === 'string' ? params.studentId : undefined,
    assessmentId:
      params && typeof params.assessmentId === 'string' ? params.assessmentId : undefined,
  }

  // Check if "No Course" filter is selected
  const isNoCourseFilter = filters.courseId === 'no-course'

  const assessmentWhere = buildAssessmentFilters(filters)
  const submissionWhere = buildSubmissionFilters(filters)

  const [assessments, submissions] = await Promise.all([
    db.assessment.findMany({
      where: assessmentWhere,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        class: {
          include: {
            course: {
              select: {
                code: true,
                title: true,
              },
            },
            professor: {
              select: {
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    }),
    // Individual submissions with student data
    db.assessmentSubmission.findMany({
      where: submissionWhere,
      orderBy: {
        submittedAt: 'desc',
      },
      include: {
        assessment: {
          include: {
            class: {
              include: {
                course: {
                  select: {
                    code: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
        student: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    }),
  ])

  const hasFilters = Object.keys(assessmentWhere).length > 0 || filters.studentId !== undefined || filters.assessmentId !== undefined

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Assessments & Grades
        </h1>
        <p className="text-muted-foreground mt-2">
          View assessments and grading statistics. Filters affect which class assessments are shown.
        </p>
      </div>

      {/* No Course Filter Notice */}
      {isNoCourseFilter && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              The "No Course" filter only applies to the <strong>People</strong> page to show students with no enrollments.
              {' '}On this page, you're viewing all assessments and submissions.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="assessments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assessments">
            Assessments ({assessments.length})
          </TabsTrigger>
          <TabsTrigger value="submissions">Submissions & Grades</TabsTrigger>
        </TabsList>

        {/* Assessments Tab */}
        <TabsContent value="assessments">
          <Card>
            <CardHeader>
              <CardTitle>Assessments</CardTitle>
              <CardDescription>
                {hasFilters
                  ? 'Assessments from classes matching your filters'
                  : 'All assignments, labs, and exams across all classes'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No assessments found matching the selected filters
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Professor</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Submissions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {assessment.title}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {assessment.slug}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {assessment.class.course.code}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {assessment.class.classCode}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {assessment.class.professor.fullName || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {assessment.dueAt ? (
                            <div>
                              {new Date(assessment.dueAt).toLocaleDateString()}
                              <div className="text-xs text-muted-foreground">
                                {new Date(assessment.dueAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              No due date
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {assessment.maxPoints.toString()} pts
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {assessment._count.submissions} submissions
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submissions & Grades Tab */}
        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>Submissions & Grades</CardTitle>
              <CardDescription>
                Individual student submissions and grades
                {hasFilters && ' (filtered)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No submissions found matching the selected filters
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Course / Class</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Submitted At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {submission.student.fullName || 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {submission.student.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {submission.assessment.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {submission.assessment.class.course.code}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {submission.assessment.class.classCode}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {submission.totalScore !== null ? (
                            <div>
                              <span className="font-medium">
                                {submission.totalScore.toString()}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {' '}
                                / {submission.assessment.maxPoints.toString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Pending</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                          <div className="text-xs">
                            {new Date(submission.submittedAt).toLocaleTimeString(
                              [],
                              { hour: '2-digit', minute: '2-digit' }
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
