'use client'

import { useState, useEffect } from 'react'
import { GraduationCap, Users } from 'lucide-react'
import { PasswordManager } from '@/components/admin/PasswordManager'

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
    <div>
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="h2 fw-bold text-primary mb-2">
          <GraduationCap className="me-2" style={{ display: 'inline', marginTop: '-4px' }} />
          Students
        </h1>
        <p className="text-muted mb-0">
          View and manage students enrolled in your classes
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>{error}</div>
        </div>
      )}

      {/* Class Selector */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-6">
              <label htmlFor="classSelect" className="form-label fw-semibold">
                <Users size={18} className="me-1" style={{ marginTop: '-2px' }} />
                Select a Class
              </label>
              {loading ? (
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading classes...</span>
                </div>
              ) : classes.length === 0 ? (
                <div className="alert alert-info mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  You don't have any classes yet. Create a class from the Available Courses page.
                </div>
              ) : (
                <select
                  id="classSelect"
                  className="form-select"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">-- Choose a class --</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.classCode} - {classItem.course.code} ({classItem.term} {classItem.year})
                    </option>
                  ))}
                </select>
              )}
            </div>
            {classInfo && (
              <div className="col-md-6 text-md-end">
                <div className="text-muted small">
                  <strong>{students.length}</strong> student{students.length !== 1 ? 's' : ''} enrolled
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loadingStudents && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading students...</span>
          </div>
          <p className="text-muted mt-3">Loading students...</p>
        </div>
      )}

      {/* Students Table */}
      {!loadingStudents && classInfo && (
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="card-title mb-1">
              <i className="bi bi-people-fill me-2"></i>
              Enrolled Students - {classInfo.courseCode}
            </h5>
            <p className="mb-0 small opacity-90">
              {classInfo.classCode} • {classInfo.term} {classInfo.year} • Section {classInfo.section}
            </p>
          </div>
          <div className="card-body p-0">
            {students.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <GraduationCap size={64} className="mb-3 opacity-25" />
                <p className="mb-0">No students enrolled in this class yet.</p>
                <p className="small">Students can enroll using the class code: <code className="badge bg-primary">{classInfo.classCode}</code></p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr className="border-bottom">
                      <th className="py-3">Full Name</th>
                      <th className="py-3">Email</th>
                      <th className="py-3">School ID</th>
                      <th className="py-3">Password</th>
                      <th className="py-3">Enrollment Status</th>
                      <th className="py-3">Enrolled Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.enrollmentId}>
                        <td className="py-3">
                          <div className="d-flex align-items-center">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                              style={{ width: '32px', height: '32px', fontSize: '14px', fontWeight: 'bold' }}>
                              {(student.fullName || student.email).charAt(0).toUpperCase()}
                            </div>
                            <span className="fw-semibold">{student.fullName || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <a href={`mailto:${student.email}`} className="text-decoration-none">
                            {student.email}
                          </a>
                        </td>
                        <td className="py-3">
                          {student.schoolId ? (
                            <code className="badge bg-secondary">{student.schoolId}</code>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="py-3">
                          <PasswordManager
                            userId={student.id}
                            initialPassword={student.password}
                            userName={student.fullName || student.email}
                            userRole="student"
                          />
                        </td>
                        <td className="py-3">
                          <span className={`badge ${
                            student.enrollmentStatus === 'active' ? 'bg-success' :
                            student.enrollmentStatus === 'dropped' ? 'bg-danger' :
                            'bg-secondary'
                          }`}>
                            {student.enrollmentStatus || 'active'}
                          </span>
                        </td>
                        <td className="py-3 text-muted small">
                          {new Date(student.enrolledAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State - No Class Selected */}
      {!loadingStudents && !classInfo && !loading && classes.length > 0 && (
        <div className="text-center py-5">
          <Users size={64} className="text-muted mb-3 opacity-25" />
          <h3 className="h5 text-muted">Select a class to view students</h3>
          <p className="text-muted">Choose a class from the dropdown above to see enrolled students.</p>
        </div>
      )}
    </div>
  )
}
