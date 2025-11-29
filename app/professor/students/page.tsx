'use client'

import { useState, useEffect } from 'react'
import { GraduationCap, Users, Loader2, AlertCircle, UserPlus } from 'lucide-react'
import { PasswordManager } from '@/components/admin/PasswordManager'
import { CreateStudentModal } from '@/components/professor/CreateStudentModal'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface ProfessorClass {
  id: string
  classCode: string
  title: string
  term: string
  year: number
  section: string
  course: {
    code: string
    title: string
  }
}

interface Student {
  enrollmentId: string
  enrollmentStatus: string
  enrolledAt: string
  id: string
  fullName: string | null
  email: string
  schoolId: string | null
  password: string
  createdAt: string
}

interface ClassInfo {
  id: string
  title: string
  classCode: string
  term: string
  year: number
  section: string
  courseCode: string
  courseTitle: string
}

export default function ProfessorStudentsPage() {
  const [classes, setClasses] = useState<ProfessorClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents(selectedClassId)
    } else {
      setStudents([])
      setClassInfo(null)
    }
  }, [selectedClassId])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/professor/classes')
      if (!response.ok) {
        throw new Error('Failed to fetch classes')
      }

      const data = await response.json()
      setClasses(data.classes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async (classId: string) => {
    try {
      setLoadingStudents(true)
      setError(null)

      const response = await fetch(`/api/professor/classes/${classId}/students`)
      if (!response.ok) {
        throw new Error('Failed to fetch students')
      }

      const data = await response.json()
      setClassInfo(data.class)
      setStudents(data.students || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setStudents([])
      setClassInfo(null)
    } finally {
      setLoadingStudents(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2 flex items-center gap-2">
          <GraduationCap className="h-8 w-8" />
          Students
        </h1>
        <p className="text-foreground-secondary">
          View and manage students enrolled in your classes
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-l-4 border-l-error bg-error/10">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertCircle size={20} className="text-error" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Security Warning */}
      {classInfo && students.length > 0 && (
        <Card className="border-l-4 border-l-warning bg-warning/10">
          <CardContent className="py-3">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-warning mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <strong>Password Security Notice:</strong> Student passwords are visible to you as the professor.
                Please share passwords securely (e.g., in person, secure messaging). You can regenerate passwords
                at any time using the refresh button next to each password.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Class Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Users size={18} />
                Select a Class
              </label>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-accent-orange" />
                  <span className="text-sm text-muted-foreground">Loading classes...</span>
                </div>
              ) : classes.length === 0 ? (
                <Card className="border-l-4 border-l-info bg-info/10">
                  <CardContent className="py-3">
                    <p className="text-sm">
                      You don't have any classes yet. Create a class from the Available Courses page.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- Choose a class --" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.classCode} - {classItem.course.code} ({classItem.term} {classItem.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {classInfo && (
              <div className="flex items-center gap-3 justify-end">
                <div className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{students.length}</strong> student{students.length !== 1 ? 's' : ''} enrolled
                </div>
                <Button onClick={() => setShowCreateModal(true)} size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Student
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loadingStudents && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent-orange mb-4" />
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      )}

      {/* Students Table */}
      {!loadingStudents && classInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Enrolled Students - {classInfo.courseCode}
            </CardTitle>
            <CardDescription>
              {classInfo.classCode} • {classInfo.term} {classInfo.year} • Section {classInfo.section}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {students.length === 0 ? (
              <div className="text-center py-12 px-6">
                <GraduationCap size={64} className="text-muted-foreground mx-auto mb-4 opacity-25" />
                <p className="text-muted-foreground mb-2">No students enrolled in this class yet.</p>
                <div className="text-sm text-muted-foreground">
                  Students can enroll using the class code: <Badge variant="purple">{classInfo.classCode}</Badge>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>School ID</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Enrollment Status</TableHead>
                    <TableHead>Enrolled Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.enrollmentId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="bg-accent-purple text-white rounded-full flex items-center justify-center w-8 h-8 text-sm font-bold">
                            {(student.fullName || student.email).charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold">{student.fullName || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a href={`mailto:${student.email}`} className="text-accent-purple hover:underline">
                          {student.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        {student.schoolId ? (
                          <Badge>{student.schoolId}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <PasswordManager
                          userId={student.id}
                          initialPassword={student.password}
                          userName={student.fullName || student.email}
                          userRole="student"
                          managerRole="professor"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          student.enrollmentStatus === 'active' ? 'success' :
                          student.enrollmentStatus === 'dropped' ? 'error' :
                          'default'
                        }>
                          {student.enrollmentStatus || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(student.enrolledAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State - No Class Selected */}
      {!loadingStudents && !classInfo && !loading && classes.length > 0 && (
        <div className="text-center py-12">
          <Users size={64} className="text-muted-foreground mx-auto mb-4 opacity-25" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Select a class to view students</h3>
          <p className="text-muted-foreground">Choose a class from the dropdown above to see enrolled students.</p>
        </div>
      )}

      {/* Create Student Modal */}
      {showCreateModal && (
        <CreateStudentModal
          classes={classes}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            if (selectedClassId) {
              fetchStudents(selectedClassId)
            }
          }}
        />
      )}
    </div>
  )
}
