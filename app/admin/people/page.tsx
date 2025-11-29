import { db } from "@/lib/db";
import {
  buildClassFilters,
  buildEnrollmentFilters,
  getFilterOptions,
  type AdminFilters,
} from "@/lib/admin-filters";
import { ProfessorApprovalToggle } from "@/components/admin/ProfessorApprovalToggle";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { PasswordManager } from "@/components/admin/PasswordManager";
import { Users, GraduationCap, UserCheck, Crown, AlertCircle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function PeoplePage({
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

  // Build student where clause based on filters
  const studentWhere: any = { role: "student" };
  const professorWhere: any = { role: "professor" };

  // If filters are applied, we need to filter students/professors who have matching enrollments/classes
  if (Object.keys(enrollmentWhere).length > 0) {
    // Show only students with enrollments matching the filters
    studentWhere.enrollments = { some: enrollmentWhere };
  }

  if (Object.keys(classWhere).length > 0) {
    // Show only professors with classes matching the filters
    professorWhere.professorClasses = { some: classWhere };
  }

  const [students, professors, admins] = await Promise.all([
    db.user.findMany({
      where: studentWhere,
      select: {
        id: true,
        fullName: true,
        email: true,
        usernameSchoolId: true,
        password: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({
      where: professorWhere,
      select: {
        id: true,
        fullName: true,
        email: true,
        usernameSchoolId: true,
        password: true,
        isApproved: true,
        createdAt: true,
        _count: {
          select: {
            professorClasses: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({
      where: { role: "admin" },
      select: {
        id: true,
        fullName: true,
        email: true,
        usernameSchoolId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const hasFilters = Object.keys(classWhere).length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
          People Management
        </h1>
        <p className="text-foreground-secondary">
          View and manage platform users - students, professors, and admins.
        </p>
      </div>

      {/* Filter Bar */}
      <AdminFilterBar
        options={filterOptions}
        availableFilters={{
          showStudent: false,
          showTerm: true,
          showYear: true,
          showProfessor: false,
          showCourse: true,
          showClass: true,
          showAssessment: false,
        }}
      />

      {/* Security Warning */}
      {(students.length > 0 || professors.length > 0) && (
        <Card className="border-l-4 border-l-warning bg-warning/10">
          <CardContent className="py-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <strong>Password Security Notice:</strong> All user passwords are stored in plain text
                and visible in this interface for administrative purposes. Please ensure passwords are
                shared securely. You can regenerate passwords at any time using the refresh button.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="students" className="space-y-6">
        <TabsList>
          <TabsTrigger value="students" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Students
            <Badge variant="default" className="ml-1">
              {students.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="professors" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Professors
            <Badge variant="default" className="ml-1">
              {professors.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="admins" className="gap-2">
            <Crown className="h-4 w-4" />
            Admins
            <Badge variant="default" className="ml-1">
              {admins.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-accent-orange" />
                Students
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {students.length === 0 ? (
                <div className="text-center py-12 text-foreground-tertiary">
                  <p className="mb-0">No students found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>School ID</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead className="text-right">
                        {hasFilters ? "Filtered " : ""}Enrollments
                      </TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.fullName || "N/A"}
                        </TableCell>
                        <TableCell className="text-foreground-secondary">
                          {student.email}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono font-semibold text-accent-orange bg-accent-orange/10 px-2 py-1 rounded-lg">
                            {student.usernameSchoolId || "-"}
                          </code>
                        </TableCell>
                        <TableCell>
                          <PasswordManager
                            userId={student.id}
                            initialPassword={student.password}
                            userName={student.fullName || student.email}
                            userRole="student"
                            managerRole="admin"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="info">
                            {student._count.enrollments}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground-tertiary text-sm">
                          {new Date(student.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
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

        {/* Professors Tab */}
        <TabsContent value="professors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-accent-purple" />
                Professors
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {professors.length === 0 ? (
                <div className="text-center py-12 text-foreground-tertiary">
                  <p className="mb-0">No professors found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>School ID</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead className="text-right">
                        {hasFilters ? "Filtered " : ""}Classes Teaching
                      </TableHead>
                      <TableHead>Approval Status</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {professors.map((professor) => (
                      <TableRow key={professor.id}>
                        <TableCell className="font-medium">
                          {professor.fullName || "N/A"}
                        </TableCell>
                        <TableCell className="text-foreground-secondary">
                          {professor.email}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono font-semibold text-accent-orange bg-accent-orange/10 px-2 py-1 rounded-lg">
                            {professor.usernameSchoolId || "-"}
                          </code>
                        </TableCell>
                        <TableCell>
                          <PasswordManager
                            userId={professor.id}
                            initialPassword={professor.password}
                            userName={professor.fullName || professor.email}
                            userRole="professor"
                            managerRole="admin"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="info">
                            {professor._count.professorClasses}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ProfessorApprovalToggle
                            userId={professor.id}
                            currentStatus={professor.isApproved}
                            professorName={professor.fullName || professor.email}
                          />
                        </TableCell>
                        <TableCell className="text-foreground-tertiary text-sm">
                          {new Date(professor.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
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

        {/* Admins Tab */}
        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-warning" />
                Administrators
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {admins.length === 0 ? (
                <div className="text-center py-12 text-foreground-tertiary">
                  <p className="mb-0">No administrators found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>School ID</TableHead>
                      <TableHead>Access Level</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">
                          {admin.fullName || "N/A"}
                        </TableCell>
                        <TableCell className="text-foreground-secondary">
                          {admin.email}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono font-semibold text-accent-orange bg-accent-orange/10 px-2 py-1 rounded-lg">
                            {admin.usernameSchoolId || "-"}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="error">Full Access</Badge>
                        </TableCell>
                        <TableCell className="text-foreground-tertiary text-sm">
                          {new Date(admin.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
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
      </Tabs>
    </div>
  );
}
