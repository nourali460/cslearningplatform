import { db } from "@/lib/db";
import {
  buildClassFilters,
  buildEnrollmentFilters,
  buildAssessmentFilters,
  buildSubmissionFilters,
  getFilterOptions,
  type AdminFilters,
} from "@/lib/admin-filters";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import {
  Users,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  Crown,
  UserCheck,
  AlertTriangle,
  School,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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

  const filterOptions = await getFilterOptions(filters);

  const classWhere = buildClassFilters(filters);
  const enrollmentWhere = buildEnrollmentFilters(filters);
  const assessmentWhere = buildAssessmentFilters(filters);
  const submissionWhere = buildSubmissionFilters(filters);

  const [
    totalUsers,
    adminCount,
    professorCount,
    studentCount,
    totalCourses,
    totalClasses,
    totalEnrollments,
    totalAssessments,
    totalSubmissions,
    classes,
    allProfessors,
    allStudents,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "admin" } }),
    db.user.count({ where: { role: "professor" } }),
    db.user.count({ where: { role: "student" } }),
    db.course.count(),
    db.class.count({ where: classWhere }),
    db.enrollment.count({ where: enrollmentWhere }),
    db.assessment.count({ where: assessmentWhere }),
    db.assessmentSubmission.count({ where: submissionWhere }),
    db.class.findMany({
      where: classWhere,
      include: {
        professor: true,
        course: true,
        _count: {
          select: {
            enrollments: true,
            assessments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.user.findMany({
      where: { role: "professor" },
      select: {
        id: true,
        _count: {
          select: {
            professorClasses: true,
          },
        },
      },
    }),
    db.user.findMany({
      where: { role: "student" },
      select: {
        id: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    }),
  ]);

  const professorsWithNoClasses = allProfessors.filter(
    (prof) => prof._count.professorClasses === 0
  ).length;

  const studentsWithNoEnrollments = allStudents.filter(
    (student) => student._count.enrollments === 0
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">
          Platform Overview
        </h1>
        <p className="text-sm text-foreground-secondary">
          High-level platform snapshot. Use filters to view specific data.
        </p>
      </div>

      {/* Filter Bar */}
      <AdminFilterBar options={filterOptions} />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2 px-3">
            <CardTitle className="text-xs font-medium text-foreground-secondary">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-accent-orange" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-semibold text-foreground mb-2">
              {totalUsers}
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-foreground-tertiary">
                  <Crown className="h-3 w-3" />
                  <span>Admins:</span>
                </div>
                <span className="font-medium text-foreground">{adminCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-foreground-tertiary">
                  <UserCheck className="h-3 w-3" />
                  <span>Professors:</span>
                </div>
                <span className="font-medium text-foreground">
                  {professorCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-foreground-tertiary">
                  <GraduationCap className="h-3 w-3" />
                  <span>Students:</span>
                </div>
                <span className="font-medium text-foreground">{studentCount}</span>
              </div>
            </div>
            {(professorsWithNoClasses > 0 || studentsWithNoEnrollments > 0) && (
              <div className="mt-2 pt-2 border-t border-border space-y-1">
                {professorsWithNoClasses > 0 && (
                  <div className="flex items-start gap-1.5 text-xs text-warning">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span>
                      {professorsWithNoClasses} professor
                      {professorsWithNoClasses !== 1 ? "s" : ""} with 0 classes
                    </span>
                  </div>
                )}
                {studentsWithNoEnrollments > 0 && (
                  <div className="flex items-start gap-1.5 text-xs text-warning">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span>
                      {studentsWithNoEnrollments} student
                      {studentsWithNoEnrollments !== 1 ? "s" : ""} not enrolled
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Courses Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2 px-3">
            <CardTitle className="text-xs font-medium text-foreground-secondary">
              Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-accent-purple" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-semibold text-foreground mb-1">
              {totalCourses}
            </div>
            <p className="text-xs text-foreground-tertiary">In catalog</p>
          </CardContent>
        </Card>

        {/* Classes Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2 px-3">
            <CardTitle className="text-xs font-medium text-foreground-secondary">
              {Object.keys(classWhere).length > 0 ? "Filtered" : "Active"} Classes
            </CardTitle>
            <School className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-semibold text-foreground mb-1">
              {totalClasses}
            </div>
            <p className="text-xs text-foreground-tertiary">
              {totalEnrollments} enrollments
            </p>
          </CardContent>
        </Card>

        {/* Assessments Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2 px-3">
            <CardTitle className="text-xs font-medium text-foreground-secondary">
              Assessments
            </CardTitle>
            <FileText className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-semibold text-foreground mb-1">
              {totalAssessments}
            </div>
            <p className="text-xs text-foreground-tertiary">
              {totalSubmissions} submissions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Classes Table */}
      <Card>
        <CardHeader className="py-2 px-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ClipboardCheck className="h-4 w-4 text-accent-orange" />
            {Object.keys(classWhere).length > 0
              ? "Filtered Classes"
              : "Recent Classes"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {classes.length === 0 ? (
            <div className="text-center py-12 text-foreground-tertiary">
              <p className="mb-0">No classes found matching the selected filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead className="text-right">Enrollments</TableHead>
                  <TableHead className="text-right">Assessments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell>
                      <code className="text-xs font-mono font-semibold text-accent-orange bg-accent-orange/10 px-2 py-1 rounded-lg">
                        {classItem.classCode}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{classItem.title}</TableCell>
                    <TableCell>{classItem.term}</TableCell>
                    <TableCell>{classItem.year}</TableCell>
                    <TableCell className="text-foreground-secondary">
                      {classItem.professor.fullName || classItem.professor.email}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="info">{classItem._count.enrollments}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="warning">{classItem._count.assessments}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
