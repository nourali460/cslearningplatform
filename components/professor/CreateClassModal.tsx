'use client'

import { useState, useEffect } from 'react'
import { Calendar, Hash, BookOpen, X } from 'lucide-react'

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
  course: {
    id: string
  }
  term: string
  year: number
  section: string
}

interface CreateClassModalProps {
  course: Course
  professorSchoolId: string
  existingClasses: ProfessorClass[]
  onClose: () => void
  onSuccess: () => void
}

const TERMS = ['Fall', 'Spring', 'Summer', 'Winter'] as const
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR + i)

export function CreateClassModal({
  course,
  professorSchoolId,
  existingClasses,
  onClose,
  onSuccess,
}: CreateClassModalProps) {
  const [term, setTerm] = useState<string>('')
  const [year, setYear] = useState<number>(CURRENT_YEAR)
  const [section, setSection] = useState<string>('1')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [classCodePreview, setClassCodePreview] = useState<string>('')
  const [isDuplicate, setIsDuplicate] = useState(false)

  // Generate class code preview and check for duplicates
  useEffect(() => {
    if (term && year && section && /^\d{1,2}$/.test(section)) {
      const termAbbr: Record<string, string> = {
        Fall: 'FA',
        Spring: 'SP',
        Summer: 'SU',
        Winter: 'WI',
      }
      const yearShort = year.toString().slice(-2)
      const sectionPadded = section.padStart(2, '0')
      const preview = `${professorSchoolId}-${course.code}-${termAbbr[term]}${yearShort}-${sectionPadded}`
      setClassCodePreview(preview.toUpperCase())

      // Check if this combination already exists
      const duplicate = existingClasses.some(
        (cls) =>
          cls.course.id === course.id &&
          cls.term === term &&
          cls.year === year &&
          cls.section.padStart(2, '0') === sectionPadded
      )
      setIsDuplicate(duplicate)

      if (duplicate) {
        setError(
          `You already created this class (${course.code} - ${term} ${year}, Section ${sectionPadded}). Each course/term/year/section combination can only be created once.`
        )
      } else {
        setError(null)
      }
    } else {
      setClassCodePreview('')
      setIsDuplicate(false)
      setError(null)
    }
  }, [term, year, section, professorSchoolId, course.code, course.id, existingClasses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check for duplicate before submitting
    if (isDuplicate) {
      setError(
        `You already created this class (${course.code} - ${term} ${year}, Section ${section.padStart(2, '0')}). Each course/term/year/section combination can only be created once.`
      )
      return
    }

    setError(null)

    // Validation
    if (!term) {
      setError('Please select a term')
      return
    }

    if (!section || !/^\d{1,2}$/.test(section)) {
      setError('Section must be a 1-2 digit number')
      return
    }

    const sectionNum = parseInt(section, 10)
    if (sectionNum < 1 || sectionNum > 99) {
      setError('Section must be between 1 and 99')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch('/api/professor/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id,
          term,
          year,
          section,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create class')
      }

      // Success!
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg">
          {/* Modal Header */}
          <div className="modal-header bg-primary text-white border-0">
            <div>
              <h5 className="modal-title fw-bold mb-1">
                <BookOpen size={20} className="me-2" style={{ display: 'inline', marginTop: '-4px' }} />
                Create New Class
              </h5>
              <p className="mb-0 small opacity-75">
                {course.code} - {course.title}
              </p>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={isSubmitting}
            ></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4">
            {/* Course Info Card */}
            <div className="card bg-light border-0 mb-4">
              <div className="card-body">
                <div>
                  <span className="badge bg-primary mb-2">{course.code}</span>
                  <h6 className="fw-bold mb-1">{course.title}</h6>
                  {course.subject && (
                    <p className="text-muted small mb-2">
                      <i className="bi bi-tag-fill me-1"></i>
                      {course.subject}
                    </p>
                  )}
                  <p className="text-muted small mb-0">
                    {course.description || 'No description available.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <div>{error}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Term Selection */}
                <div className="col-md-4">
                  <label className="form-label fw-semibold">
                    <Calendar size={16} className="me-1" style={{ marginTop: '-2px' }} />
                    Term <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select term...</option>
                    {TERMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Selection */}
                <div className="col-md-4">
                  <label className="form-label fw-semibold">
                    <Calendar size={16} className="me-1" style={{ marginTop: '-2px' }} />
                    Year <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value, 10))}
                    required
                    disabled={isSubmitting}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section Input */}
                <div className="col-md-4">
                  <label className="form-label fw-semibold">
                    <Hash size={16} className="me-1" style={{ marginTop: '-2px' }} />
                    Section <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g., 1"
                    min="1"
                    max="99"
                    required
                    disabled={isSubmitting}
                  />
                  <div className="form-text">1-2 digit number (1-99)</div>
                </div>
              </div>

              {/* Class Code Preview */}
              {classCodePreview && (
                <div className="mt-4">
                  <div className="card border-primary">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-primary fw-bold mb-1">
                            <i className="bi bi-code-square me-2"></i>
                            Class Code Preview
                          </h6>
                          <p className="text-muted small mb-0">
                            Students will use this code to enroll in your class
                          </p>
                        </div>
                        <div>
                          <span className="badge bg-primary fs-5 px-3 py-2 font-monospace">
                            {classCodePreview}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="alert alert-info mt-4 mb-0" role="alert">
                <i className="bi bi-info-circle me-2"></i>
                <strong>What happens next?</strong> When you create this class, a unique class code
                will be generated. Share this code with your students so they can enroll.
              </div>
            </form>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer border-0 bg-light">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !term || !section || !/^\d{1,2}$/.test(section) || isDuplicate}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating Class...
                </>
              ) : isDuplicate ? (
                <>
                  <i className="bi bi-exclamation-circle me-2"></i>
                  Already Created
                </>
              ) : (
                <>
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Class
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
