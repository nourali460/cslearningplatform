'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { X, Search } from 'lucide-react'

type FilterOption = {
  terms: string[]
  years: number[]
  professors: { id: string; name: string }[]
  courses: { id: string; code: string; title: string }[]
  classes: { id: string; code: string; title: string }[]
  students: { id: string; name: string }[]
  assessments: { id: string; title: string; courseCode: string }[]
}

type AvailableFilters = {
  showStudent?: boolean
  showTerm?: boolean
  showYear?: boolean
  showProfessor?: boolean
  showCourse?: boolean
  showClass?: boolean
  showAssessment?: boolean
}

export function AdminFilterBar({
  options,
  availableFilters = {
    showStudent: true,
    showTerm: true,
    showYear: true,
    showProfessor: true,
    showCourse: true,
    showClass: true,
    showAssessment: true,
  }
}: {
  options?: FilterOption
  availableFilters?: AvailableFilters
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [studentSearch, setStudentSearch] = useState('')
  const [professorSearch, setProfessorSearch] = useState('')
  const [assessmentSearch, setAssessmentSearch] = useState('')

  const currentTerm = searchParams.get('term') || ''
  const currentYear = searchParams.get('year') || ''
  const currentProfessor = searchParams.get('professorId') || ''
  const currentCourse = searchParams.get('courseId') || ''
  const currentClass = searchParams.get('classId') || ''
  const currentStudent = searchParams.get('studentId') || ''
  const currentAssessment = searchParams.get('assessmentId') || ''

  // Provide defaults if options is undefined
  const terms = options?.terms || []
  const years = options?.years || []
  const professors = options?.professors || []
  const courses = options?.courses || []
  const classes = options?.classes || []
  const students = options?.students || []
  const assessments = options?.assessments || []

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  const clearAllFilters = () => {
    router.push(pathname)
  }

  const hasActiveFilters =
    currentTerm || currentYear || currentProfessor || currentCourse || currentClass || currentStudent || currentAssessment

  // Filter functions for searchable dropdowns
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const filteredProfessors = professors.filter((prof) =>
    prof.name.toLowerCase().includes(professorSearch.toLowerCase())
  )

  const filteredAssessments = assessments.filter((assessment) =>
    assessment.title.toLowerCase().includes(assessmentSearch.toLowerCase()) ||
    assessment.courseCode.toLowerCase().includes(assessmentSearch.toLowerCase())
  )

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="mb-0 fw-semibold text-primary">
            <i className="bi bi-funnel me-2"></i>
            Filters
          </h6>
          {hasActiveFilters && (
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={clearAllFilters}
            >
              <X className="me-1" size={16} />
              Clear All
            </button>
          )}
        </div>

        <div className="row g-3">
          {/* Row 1 */}
          {/* Student Filter (Searchable Dropdown) */}
          {availableFilters.showStudent && (
          <div className="col-md-4">
            <label className="form-label small fw-semibold text-muted mb-2">Student</label>
            <div className="dropdown w-100">
              <button
                className="btn btn-outline-secondary dropdown-toggle w-100 text-start"
                type="button"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                onClick={() => setStudentSearch('')}
              >
                {currentStudent
                  ? students.find((student) => student.id === currentStudent)?.name || 'All Students'
                  : 'All Students'}
              </button>
              <div className="dropdown-menu w-100 p-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <div className="input-group input-group-sm mb-2">
                  <span className="input-group-text">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <button
                  className="dropdown-item"
                  onClick={() => updateFilter('studentId', '')}
                >
                  {!currentStudent && <span className="text-primary me-2">✓</span>}
                  All Students
                </button>
                {filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    className="dropdown-item"
                    onClick={() => updateFilter('studentId', student.id)}
                  >
                    {currentStudent === student.id && <span className="text-primary me-2">✓</span>}
                    {student.name}
                  </button>
                ))}
                {filteredStudents.length === 0 && (
                  <div className="text-muted text-center py-2 small">No students found</div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Term Filter */}
          {availableFilters.showTerm && (
          <div className="col-md-4">
            <label className="form-label small fw-semibold text-muted mb-2">Term</label>
            <select
              className="form-select"
              value={currentTerm || 'all'}
              onChange={(e) => updateFilter('term', e.target.value)}
            >
              <option value="all">All Terms</option>
              {terms.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>
          )}

          {/* Year Filter */}
          {availableFilters.showYear && (
          <div className="col-md-4">
            <label className="form-label small fw-semibold text-muted mb-2">Year</label>
            <select
              className="form-select"
              value={currentYear || 'all'}
              onChange={(e) => updateFilter('year', e.target.value)}
            >
              <option value="all">All Years</option>
              {years.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          )}

          {/* Row 2 */}
          {/* Professor Filter (Searchable Dropdown) */}
          {availableFilters.showProfessor && (
          <div className="col-md-4">
            <label className="form-label small fw-semibold text-muted mb-2">Professor</label>
            <div className="dropdown w-100">
              <button
                className="btn btn-outline-secondary dropdown-toggle w-100 text-start"
                type="button"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                onClick={() => setProfessorSearch('')}
              >
                {currentProfessor
                  ? professors.find((prof) => prof.id === currentProfessor)?.name || 'All Professors'
                  : 'All Professors'}
              </button>
              <div className="dropdown-menu w-100 p-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <div className="input-group input-group-sm mb-2">
                  <span className="input-group-text">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search professors..."
                    value={professorSearch}
                    onChange={(e) => setProfessorSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <button
                  className="dropdown-item"
                  onClick={() => updateFilter('professorId', '')}
                >
                  {!currentProfessor && <span className="text-primary me-2">✓</span>}
                  All Professors
                </button>
                {filteredProfessors.map((prof) => (
                  <button
                    key={prof.id}
                    className="dropdown-item"
                    onClick={() => updateFilter('professorId', prof.id)}
                  >
                    {currentProfessor === prof.id && <span className="text-primary me-2">✓</span>}
                    {prof.name}
                  </button>
                ))}
                {filteredProfessors.length === 0 && (
                  <div className="text-muted text-center py-2 small">No professors found</div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Course Filter */}
          {availableFilters.showCourse && (
          <div className="col-md-4">
            <label className="form-label small fw-semibold text-muted mb-2">Course</label>
            <select
              className="form-select"
              value={currentCourse || 'all'}
              onChange={(e) => updateFilter('courseId', e.target.value)}
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
          </div>
          )}

          {/* Class Filter */}
          {availableFilters.showClass && (
          <div className="col-md-4">
            <label className="form-label small fw-semibold text-muted mb-2">Class</label>
            <select
              className="form-select"
              value={currentClass || 'all'}
              onChange={(e) => updateFilter('classId', e.target.value)}
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.code}
                </option>
              ))}
            </select>
          </div>
          )}

          {/* Row 3 */}
          {/* Assessment Filter (Searchable Dropdown) */}
          {availableFilters.showAssessment && (
          <div className="col-md-4">
            <label className="form-label small fw-semibold text-muted mb-2">Assessment</label>
            <div className="dropdown w-100">
              <button
                className="btn btn-outline-secondary dropdown-toggle w-100 text-start"
                type="button"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                onClick={() => setAssessmentSearch('')}
              >
                {currentAssessment
                  ? (() => {
                      const assessment = assessments.find((a) => a.id === currentAssessment)
                      return assessment
                        ? `${assessment.courseCode}: ${assessment.title}`
                        : 'All Assessments'
                    })()
                  : 'All Assessments'}
              </button>
              <div className="dropdown-menu w-100 p-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <div className="input-group input-group-sm mb-2">
                  <span className="input-group-text">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search assessments..."
                    value={assessmentSearch}
                    onChange={(e) => setAssessmentSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <button
                  className="dropdown-item"
                  onClick={() => updateFilter('assessmentId', '')}
                >
                  {!currentAssessment && <span className="text-primary me-2">✓</span>}
                  All Assessments
                </button>
                {filteredAssessments.map((assessment) => (
                  <button
                    key={assessment.id}
                    className="dropdown-item"
                    onClick={() => updateFilter('assessmentId', assessment.id)}
                  >
                    {currentAssessment === assessment.id && <span className="text-primary me-2">✓</span>}
                    <div>
                      <div className="fw-semibold">{assessment.title}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {assessment.courseCode}
                      </div>
                    </div>
                  </button>
                ))}
                {filteredAssessments.length === 0 && (
                  <div className="text-muted text-center py-2 small">No assessments found</div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
