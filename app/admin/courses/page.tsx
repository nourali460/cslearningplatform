import { db } from "@/lib/db";
import {
  buildClassFilters,
  getFilterOptions,
  type AdminFilters,
} from "@/lib/admin-filters";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { CoursesPageActions } from "@/components/admin/CoursesPageActions";
import { CourseTemplateButton } from "@/components/admin/CourseTemplateButton";
import { BookOpen, School, GraduationCap, Layers, Award, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Parse search params for filters
  const params = await searchParams;
  const filters: AdminFilters = {
    term: params && typeof params.term === "string" ? params.term : undefined,
    year:
      params && typeof params.year === "string"
        ? parseInt(params.year)
        : undefined,
    professorId:
      params && typeof params.professorId === "string"
        ? params.professorId
        : undefined,
    courseId:
      params && typeof params.courseId === "string"
        ? params.courseId
        : undefined,
    classId:
      params && typeof params.classId === "string"
        ? params.classId
        : undefined,
    studentId:
      params && typeof params.studentId === "string"
        ? params.studentId
        : undefined,
    assessmentId:
      params && typeof params.assessmentId === "string"
        ? params.assessmentId
        : undefined,
  };

  // Get cascading filter options
  const filterOptions = await getFilterOptions(filters);

  const classWhere = buildClassFilters(filters);

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
          assessmentTemplates: true,
        },
      },
    },
    orderBy: { code: "asc" },
  });

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
    orderBy: [{ year: "desc" }, { term: "desc" }],
  });

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
      });
      return { courseId: course.id, count: enrollmentCount };
    })
  );

  const enrollmentMap = new Map(
    courseEnrollments.map((e) => [e.courseId, e.count])
  );

  // Filter courses that have matching classes
  const filteredCourses = courses.filter((c) => c._count.classes > 0);

  const hasFilters = Object.keys(classWhere).length > 0;

  return (
    <div className="space-y-8">
      {/* Filter Bar */}
      <AdminFilterBar
        options={filterOptions}
        availableFilters={{
          showStudent: false,
          showTerm: true,
          showYear: true,
          showProfessor: true,
          showCourse: true,
          showClass: true,
          showAssessment: false,
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
            Courses & Classes
          </h1>
          <p className="text-foreground-secondary">
            View course catalog and class sections. Each class is a professor
            teaching a course in a specific term.
          </p>
        </div>
        <CoursesPageActions />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="classes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="classes" className="gap-2">
            <School className="h-4 w-4" />
            Classes
            <Badge variant="default" className="ml-1">
              {classes.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="courses" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Courses
            <Badge variant="default" className="ml-1">
              {hasFilters ? filteredCourses.length : courses.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5 text-accent-orange" />
                Classes
              </CardTitle>
              <CardDescription>
                {hasFilters
                  ? "Class sections matching your filters (professor teaching a course in a specific term)"
                  : "All class sections - each represents a professor teaching a course in a specific term"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {classes.length === 0 ? (
                <div className="text-center py-12 text-foreground-tertiary">
                  <p className="mb-0">
                    No classes found matching the selected filters
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Professor</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead className="text-right">Students</TableHead>
                      <TableHead className="text-right">Assessments</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((classItem) => (
                      <TableRow key={classItem.id}>
                        <TableCell>
                          <div className="font-medium">{classItem.title}</div>
                          <div className="text-sm mt-1">
                            <code className="text-xs font-mono font-semibold text-accent-orange bg-accent-orange/10 px-2 py-1 rounded-lg">
                              {classItem.classCode}
                            </code>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {classItem.course.code}
                          </div>
                          <div className="text-sm text-foreground-secondary">
                            {classItem.course.title}
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground-secondary">
                          {classItem.professor.fullName ||
                            classItem.professor.email}
                        </TableCell>
                        <TableCell>
                          {classItem.term} {classItem.year}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="info">
                            {classItem._count.enrollments}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="info">
                            {classItem._count.assessments}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {classItem.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="default">Inactive</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          {(hasFilters ? filteredCourses : courses).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
                <h5 className="text-lg font-semibold text-foreground mb-2">
                  No courses found
                </h5>
                <p className="text-sm text-muted-foreground text-center">
                  {hasFilters
                    ? "No courses found with classes matching the selected filters"
                    : "No courses in catalog"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(hasFilters ? filteredCourses : courses).map((course) => (
                <Link key={course.id} href={`/admin/courses/${course.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="purple" className="font-mono text-xs">
                          {course.code}
                        </Badge>
                        {course.level && (
                          <Badge variant="outline" className="text-xs">
                            {course.level}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base font-bold text-accent-purple leading-tight">
                        {course.title}
                      </CardTitle>
                      {course.subject && (
                        <CardDescription className="text-xs">
                          {course.subject}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <School className="h-3 w-3 text-accent-purple" />
                            <span className="text-xs text-muted-foreground">Classes</span>
                          </div>
                          <div className="text-lg font-bold text-foreground">
                            {course._count.classes}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Users className="h-3 w-3 text-success" />
                            <span className="text-xs text-muted-foreground">Students</span>
                          </div>
                          <div className="text-lg font-bold text-foreground">
                            {enrollmentMap.get(course.id) || 0}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Award className="h-3 w-3 text-info" />
                            <span className="text-xs text-muted-foreground">Templates</span>
                          </div>
                          <div className="text-lg font-bold text-foreground">
                            {course._count.assessmentTemplates}
                          </div>
                        </div>
                      </div>

                      {/* Action Footer */}
                      <div className="pt-2 border-t border-border flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Click to manage
                        </span>
                        <ArrowRight className="h-4 w-4 text-accent-orange" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
