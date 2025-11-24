'use client'

import { useState, useEffect } from 'react'
import { Library, CheckCircle, Search, Filter, BookOpen, Archive } from 'lucide-react'
import { CreateClassModal } from '@/components/professor/CreateClassModal'
import { ClassCodeCopy } from '@/components/ClassCodeCopy'
import { ClassStatusToggle } from '@/components/professor/ClassStatusToggle'

interface Course {
  id: string
  code: string
  title: string
  description: string | null
  subject: string | null
  level: string | null
}

interface ProfessorClass {
  id: string
  classCode: string
  title: string
  term: string
  year: number
  section: string | null
  isActive: boolean
  course: Course
  _count: {
    enrollments: number
    assessments: number
  }
  createdAt: string
}

export default function AvailableCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [myClasses, setMyClasses] = useState<ProfessorClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [professorSchoolId, setProfessorSchoolId] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [classFilter, setClassFilter] = useState<'all' | 'active' | 'past'>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        fetchCourses(),
        fetchMyClasses(),
        fetchProfessorProfile(),
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    const response = await fetch('/api/courses')
    if (!response.ok) {
      throw new Error('Failed to fetch courses')
    }
    const data = await response.json()
    setCourses(data.courses || [])
  }

  const fetchMyClasses = async () => {
    const response = await fetch('/api/professor/classes')
    if (!response.ok) {
      throw new Error('Failed to fetch your classes')
    }
    const data = await response.json()
    setMyClasses(data.classes || [])
  }

  const fetchProfessorProfile = async () => {
    try {
      const response = await fetch('/api/professor/profile')
      if (response.ok) {
        const data = await response.json()
        setProfessorSchoolId(data.professor.schoolId || '')
      }
    } catch (err) {
      console.error('Failed to fetch professor profile:', err)
    }
  }

  const handleClassCreated = () => {
    setSuccessMessage('Class created successfully! You can now view it in "My Classes" below.')
    setTimeout(() => setSuccessMessage(null), 5000)
    fetchMyClasses()
  }

  // Get unique subjects and levels
  const subjects = Array.from(new Set(courses.map(c => c.subject).filter(Boolean))) as string[]
  const levels = Array.from(new Set(courses.map(c => c.level).filter(Boolean))) as string[]

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

    const matchesSubject = subjectFilter === 'all' || course.subject === subjectFilter
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter

    return matchesSearch && matchesSubject && matchesLevel
  })

  // Filter classes
  const activeClasses = myClasses.filter(c => c.isActive)
  const pastClasses = myClasses.filter(c => !c.isActive)
  const displayedClasses = classFilter === 'active' ? activeClasses :
                          classFilter === 'past' ? pastClasses : myClasses

  const hasActiveFilters = searchTerm || subjectFilter !== 'all' || levelFilter !== 'all'

  return (
    <div>
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="display-5 fw-bold text-primary mb-2">
          <Library className="me-2" style={{ display: 'inline', marginTop: '-4px' }} />
          Available Courses
        </h1>
        <p className="text-muted lead">
          Browse the course catalog and manage your classes
        </p>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="alert alert-success d-flex align-items-center alert-dismissible fade show" role="alert">
          <CheckCircle size={20} className="me-2" />
          <div>{successMessage}</div>
          <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)}></button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>{error}</div>
        </div>
      )}

      {/* My Classes Section */}
      {!loading && myClasses.length > 0 && (
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="h4 fw-bold text-primary mb-1">
                <BookOpen className="me-2" style={{ display: 'inline', marginTop: '-4px' }} />
                My Classes
              </h2>
              <p className="text-muted small mb-0">
                Classes you've created from the course catalog
              </p>
            </div>
          </div>

          {/* Class Filter Tabs */}
          <ul className="nav nav-pills mb-3">
            <li className="nav-item">
              <button
                className={`nav-link ${classFilter === 'all' ? 'active' : ''}`}
                onClick={() => setClassFilter('all')}
              >
                All <span className="badge bg-primary ms-2">{myClasses.length}</span>
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${classFilter === 'active' ? 'active' : ''}`}
                onClick={() => setClassFilter('active')}
              >
                Active <span className="badge bg-success ms-2">{activeClasses.length}</span>
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${classFilter === 'past' ? 'active' : ''}`}
                onClick={() => setClassFilter('past')}
              >
                Past <span className="badge bg-secondary ms-2">{pastClasses.length}</span>
              </button>
            </li>
          </ul>

          {/* Active Classes */}
          {(classFilter === 'all' || classFilter === 'active') && activeClasses.length > 0 && (
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-header bg-success text-white">
                <h6 className="mb-0 fw-semibold">Active Classes</h6>
              </div>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="py-3">Class Code</th>
                      <th className="py-3">Course</th>
                      <th className="py-3">Term</th>
                      <th className="py-3">Section</th>
                      <th className="py-3 text-center">Students</th>
                      <th className="py-3 text-center">Assessments</th>
                      <th className="py-3 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeClasses.map((classItem) => (
                      <tr key={classItem.id}>
                        <td className="py-3">
                          <ClassCodeCopy classCode={classItem.classCode} />
                        </td>
                        <td className="py-3">
                          <div className="fw-semibold">{classItem.course.code}</div>
                          <div className="text-muted small">{classItem.course.title}</div>
                        </td>
                        <td className="py-3">
                          {classItem.term} {classItem.year}
                        </td>
                        <td className="py-3">
                          <span className="badge bg-secondary">Section {classItem.section}</span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="badge bg-info">{classItem._count.enrollments}</span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="badge bg-info">{classItem._count.assessments}</span>
                        </td>
                        <td className="py-3 text-end">
                          <ClassStatusToggle
                            classId={classItem.id}
                            isActive={classItem.isActive}
                            onToggle={fetchData}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Past Classes */}
          {(classFilter === 'all' || classFilter === 'past') && pastClasses.length > 0 && (
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-header bg-secondary text-white">
                <h6 className="mb-0 fw-semibold">Past Classes</h6>
              </div>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="py-3">Class Code</th>
                      <th className="py-3">Course</th>
                      <th className="py-3">Term</th>
                      <th className="py-3">Section</th>
                      <th className="py-3 text-center">Students</th>
                      <th className="py-3 text-center">Assessments</th>
                      <th className="py-3 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastClasses.map((classItem) => (
                      <tr key={classItem.id} className="table-secondary">
                        <td className="py-3">
                          <ClassCodeCopy classCode={classItem.classCode} />
                        </td>
                        <td className="py-3">
                          <div className="fw-semibold">{classItem.course.code}</div>
                          <div className="text-muted small">{classItem.course.title}</div>
                        </td>
                        <td className="py-3">
                          {classItem.term} {classItem.year}
                        </td>
                        <td className="py-3">
                          <span className="badge bg-secondary">Section {classItem.section}</span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="badge bg-secondary">{classItem._count.enrollments}</span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="badge bg-secondary">{classItem._count.assessments}</span>
                        </td>
                        <td className="py-3 text-end">
                          <ClassStatusToggle
                            classId={classItem.id}
                            isActive={classItem.isActive}
                            onToggle={fetchData}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {displayedClasses.length === 0 && (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-4">
                <p className="text-muted mb-0">
                  {classFilter === 'active' ? 'No active classes found.' :
                   classFilter === 'past' ? 'No past classes found.' :
                   'No classes found.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Course Catalog Section */}
      <div className="mb-4">
        <h2 className="h4 fw-bold text-primary mb-2">
          <i className="bi bi-grid-3x3-gap-fill me-2"></i>
          Course Catalog
        </h2>
        <p className="text-muted mb-0">
          Browse and adopt courses to create new classes
        </p>
      </div>

      {/* Search and Filters */}
      {!loading && courses.length > 0 && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3">
              {/* Search */}
              <div className="col-md-5">
                <div className="input-group">
                  <span className="input-group-text">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search courses by code, title, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Subject Filter */}
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                >
                  <option value="all">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level Filter */}
              <div className="col-md-2">
                <select
                  className="form-select"
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                >
                  <option value="all">All Levels</option>
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="col-md-2">
                  <button
                    className="btn btn-outline-danger w-100"
                    onClick={() => {
                      setSearchTerm('')
                      setSubjectFilter('all')
                      setLevelFilter('all')
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>

            {/* Filter Stats */}
            {hasActiveFilters && (
              <div className="mt-3">
                <small className="text-muted">
                  Showing {filteredCourses.length} of {courses.length} courses
                </small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading courses...</span>
          </div>
          <p className="text-muted mt-3">Loading courses...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        /* Empty State */
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <Filter size={64} className="text-muted mb-3" />
            <h3 className="h5 text-muted">No courses found</h3>
            <p className="text-muted mb-3">
              {hasActiveFilters
                ? 'Try adjusting your filters or search term.'
                : 'There are no courses in the catalog at this time.'}
            </p>
            {hasActiveFilters && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSearchTerm('')
                  setSubjectFilter('all')
                  setLevelFilter('all')
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Course Cards Grid */
        <>
          <div className="row g-4 mb-4">
            {filteredCourses.map((course) => (
              <div key={course.id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0 hover-shadow" style={{ borderLeft: '4px solid #0d6efd' }}>
                  <div className="card-body d-flex flex-column">
                    {/* Course Code Badge */}
                    <div className="mb-3">
                      <span className="badge bg-primary fs-6">{course.code}</span>
                      {course.level && (
                        <span className="badge bg-info ms-2">{course.level}</span>
                      )}
                    </div>

                    {/* Course Title */}
                    <h5 className="card-title fw-bold mb-2">{course.title}</h5>

                    {/* Course Subject */}
                    {course.subject && (
                      <p className="text-muted small mb-2">
                        <i className="bi bi-tag-fill me-1"></i>
                        {course.subject}
                      </p>
                    )}

                    {/* Course Description */}
                    <p className="card-text text-muted small mb-4 flex-grow-1">
                      {course.description || 'No description available.'}
                    </p>

                    {/* Adopt Button */}
                    <button
                      className="btn btn-primary w-100"
                      onClick={() => setSelectedCourse(course)}
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      Adopt Course
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Course Statistics */}
          <div className="card border-0 bg-light">
            <div className="card-body text-center py-3">
              <div className="row">
                <div className="col-md-4">
                  <div className="h4 fw-bold text-primary mb-1">{courses.length}</div>
                  <div className="text-muted small">Total Courses</div>
                </div>
                <div className="col-md-4">
                  <div className="h4 fw-bold text-success mb-1">{subjects.length}</div>
                  <div className="text-muted small">Subjects</div>
                </div>
                <div className="col-md-4">
                  <div className="h4 fw-bold text-info mb-1">{myClasses.length}</div>
                  <div className="text-muted small">My Classes</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Class Creation Modal */}
      {selectedCourse && professorSchoolId && (
        <CreateClassModal
          course={selectedCourse}
          professorSchoolId={professorSchoolId}
          existingClasses={myClasses}
          onClose={() => setSelectedCourse(null)}
          onSuccess={handleClassCreated}
        />
      )}
    </div>
  )
}
