import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { BookOpen, Users, FileText, Layers, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CourseModuleManager } from '@/components/admin/CourseModuleManager'
import { CourseAssessmentTemplatesList } from '@/components/admin/CourseAssessmentTemplatesList'

interface CourseDetailPageProps {
  params: {
    courseId: string
  }
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  // Await params in Next.js 15
  const { courseId } = await params

  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    redirect('/')
  }

  // Fetch course with all related data
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      _count: {
        select: {
          classes: true,
          assessmentTemplates: true,
          moduleTemplates: true,
        },
      },
      classes: {
        include: {
          professor: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      assessmentTemplates: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      moduleTemplates: {
        include: {
          items: {
            include: {
              assessmentTemplate: true,
            },
            orderBy: {
              orderIndex: 'asc',
            },
          },
        },
        orderBy: {
          orderIndex: 'asc',
        },
      },
    },
  })

  if (!course) {
    notFound()
  }

  // Calculate total enrollments across all classes
  const totalEnrollments = course.classes.reduce((sum, cls) => sum + cls._count.enrollments, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/admin/courses">
            <Button variant="ghost" size="sm">
              ← Back to Courses
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
          {course.code}: {course.title}
        </h1>
        {course.description && (
          <p className="text-foreground-secondary">{course.description}</p>
        )}
      </div>

      {/* Compact Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border-l-4 border-l-accent-purple bg-background-secondary/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-accent-purple" />
            <span className="text-xs text-foreground-tertiary">Classes</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{course._count.classes}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Active</div>
        </div>

        <div className="border-l-4 border-l-success bg-background-secondary/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-success" />
            <span className="text-xs text-foreground-tertiary">Students</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{totalEnrollments}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Enrolled</div>
        </div>

        <div className="border-l-4 border-l-accent-orange bg-background-secondary/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="h-4 w-4 text-accent-orange" />
            <span className="text-xs text-foreground-tertiary">Modules</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{course._count.moduleTemplates}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Templates</div>
        </div>

        <div className="border-l-4 border-l-info bg-background-secondary/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-info" />
            <span className="text-xs text-foreground-tertiary">Assessments</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{course._count.assessmentTemplates}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Templates</div>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="templates">Assessment Templates</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Course Information */}
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>Basic course details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Course Code</label>
                  <div className="font-semibold">{course.code}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Title</label>
                  <div className="font-semibold">{course.title}</div>
                </div>
                {course.subject && (
                  <div>
                    <label className="text-xs text-muted-foreground">Subject</label>
                    <div className="font-semibold">{course.subject}</div>
                  </div>
                )}
                {course.level && (
                  <div>
                    <label className="text-xs text-muted-foreground">Level</label>
                    <div className="font-semibold">{course.level}</div>
                  </div>
                )}
              </div>
              {course.description && (
                <div>
                  <label className="text-xs text-muted-foreground">Description</label>
                  <div className="text-sm text-foreground-secondary">{course.description}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Classes */}
          <Card>
            <CardHeader>
              <CardTitle>Active Classes</CardTitle>
              <CardDescription>
                Professors who have adopted this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              {course.classes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No classes have been created from this course yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {course.classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="border border-border rounded-lg p-3 bg-background-secondary/30 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-accent-purple truncate">
                            {cls.term} {cls.year} - Section {cls.section}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {cls.professor.fullName || cls.professor.email}
                          </div>
                        </div>
                        <Badge variant="info" className="text-xs">
                          {cls._count.enrollments}
                        </Badge>
                      </div>
                      <code className="text-xs px-1.5 py-0.5 bg-muted rounded">
                        {cls.classCode}
                      </code>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-6">
          <CourseModuleManager courseId={courseId} />
        </TabsContent>

        {/* Assessment Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Templates</CardTitle>
              <CardDescription>
                Reusable assessment templates linked to this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseAssessmentTemplatesList
                courseId={courseId}
                templates={course.assessmentTemplates.map(t => ({
                  id: t.id,
                  type: t.type,
                  title: t.title,
                  description: t.description,
                  isActive: t.isActive,
                  defaultMaxPoints: Number(t.defaultMaxPoints),
                  defaultSubmissionType: t.defaultSubmissionType,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
