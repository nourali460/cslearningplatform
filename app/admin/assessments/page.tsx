import { db } from '@/lib/db'
import {
  buildAssessmentFilters,
  buildSubmissionFilters,
  getFilterOptions,
  type AdminFilters,
} from '@/lib/admin-filters'
import { AdminFilterBar } from '@/components/admin/AdminFilterBar'
import { FileText, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

  // Get cascading filter options
  const filterOptions = await getFilterOptions(filters)

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
      {/* Filter Bar */}
      <AdminFilterBar
        options={filterOptions}
        availableFilters={{
          showStudent: true,
          showTerm: true,
          showYear: true,
          showProfessor: true,
          showCourse: true,
          showClass: true,
          showAssessment: true,
        }}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
          Assessments & Grades
        </h1>
        <p className="text-foreground-secondary">
          View assessments and grading statistics. Filters affect which class assessments are shown.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="assessments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assessments" className="gap-2">
            <FileText className="h-4 w-4" />
            Assessments
            <Badge variant="default" className="ml-1">
              {assessments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="submissions" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Submissions & Grades
            <Badge variant="default" className="ml-1">
              {submissions.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent-orange" />
                Assessments
              </CardTitle>
              <CardDescription>
                {hasFilters
                  ? 'Assessments from classes matching your filters'
                  : 'All assignments, labs, and exams across all classes'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {assessments.length === 0 ? (
                <div className="text-center py-12 text-foreground-tertiary">
                  <p className="mb-0">No assessments found matching the selected filters</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Professor</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-right">Submissions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell>
                          <div className="font-medium">{assessment.title}</div>
                          <div className="text-sm text-foreground-tertiary">{assessment.slug}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{assessment.class.course.code}</div>
                          <div className="text-sm mt-1">
                            <code className="text-xs font-mono font-semibold text-accent-orange bg-accent-orange/10 px-2 py-1 rounded-lg">
                              {assessment.class.classCode}
                            </code>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground-secondary">
                          {assessment.class.professor.fullName || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {assessment.dueAt ? (
                            <div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-foreground-tertiary" />
                                <span>{new Date(assessment.dueAt).toLocaleDateString()}</span>
                              </div>
                              <div className="text-xs text-foreground-tertiary ml-5">
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
                            <span className="text-foreground-tertiary">No due date</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="purple">
                            {assessment.maxPoints.toString()} pts
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="info">
                            {assessment._count.submissions}
                          </Badge>
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
        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent-purple" />
                Submissions & Grades
              </CardTitle>
              <CardDescription>
                Individual student submissions and grades
                {hasFilters && ' (filtered)'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {submissions.length === 0 ? (
                <div className="text-center py-12 text-foreground-tertiary">
                  <p className="mb-0">No submissions found matching the selected filters</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Course / Class</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead>Submitted At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div className="font-medium">
                            {submission.student.fullName || 'N/A'}
                          </div>
                          <div className="text-sm text-foreground-tertiary">
                            {submission.student.email}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {submission.assessment.title}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {submission.assessment.class.course.code}
                          </div>
                          <div className="text-sm mt-1">
                            <code className="text-xs font-mono font-semibold text-accent-orange bg-accent-orange/10 px-2 py-1 rounded-lg">
                              {submission.assessment.class.classCode}
                            </code>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {submission.totalScore !== null ? (
                            <div className="flex items-center justify-end gap-1">
                              <span className="font-semibold">
                                {submission.totalScore.toString()}
                              </span>
                              <span className="text-foreground-tertiary">
                                / {submission.assessment.maxPoints.toString()}
                              </span>
                            </div>
                          ) : (
                            <Badge variant="warning">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>{new Date(submission.submittedAt).toLocaleDateString()}</div>
                          <div className="text-xs text-foreground-tertiary">
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
