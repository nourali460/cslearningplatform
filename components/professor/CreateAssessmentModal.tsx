'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type Props = {
  classId: string
  assessment?: any // For editing existing assessment
  onClose: () => void
  onSuccess: () => void
}

export function CreateAssessmentModal({ classId, assessment, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    title: assessment?.title || '',
    description: assessment?.description || '',
    type: assessment?.type || 'LAB',
    submissionType: assessment?.submissionType || 'BOTH',
    maxPoints: assessment?.maxPoints || 100,
    dueAt: assessment?.dueAt
      ? new Date(assessment.dueAt).toISOString().slice(0, 16)
      : '',
    allowMultipleAttempts: assessment?.allowMultipleAttempts || false,
    maxAttempts: assessment?.maxAttempts || 1,
    orderIndex: assessment?.orderIndex || null,
    rubricId: assessment?.rubricId || '',
  })

  const [rubrics, setRubrics] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const isEditing = !!assessment

  useEffect(() => {
    // Fetch available rubrics for this class
    // For now, we'll skip this as rubrics management will be added later
    setRubrics([])
  }, [classId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEditing
        ? `/api/professor/assessments/${assessment.id}`
        : `/api/professor/classes/${classId}/assessments`

      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxPoints: parseFloat(formData.maxPoints.toString()),
          dueAt: formData.dueAt || null,
          rubricId: formData.rubricId || null,
        }),
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save assessment')
      }
    } catch (error) {
      console.error('Error saving assessment:', error)
      alert('Failed to save assessment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              {isEditing ? 'Edit Assessment' : 'Create New Assessment'}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                {/* Title */}
                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., Lab 1: Binary Search Implementation"
                  />
                </div>

                {/* Description */}
                <div className="col-12">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the assessment objectives and requirements..."
                  />
                </div>

                {/* Assessment Type */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Assessment Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="INTERACTIVE_LESSON">📖 Interactive Lesson</option>
                    <option value="LAB">🧪 Lab</option>
                    <option value="EXAM">📝 Exam</option>
                    <option value="QUIZ">❓ Quiz</option>
                    <option value="DISCUSSION">💬 Discussion</option>
                  </select>
                </div>

                {/* Submission Type */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Submission Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.submissionType}
                    onChange={(e) =>
                      setFormData({ ...formData, submissionType: e.target.value })
                    }
                    required
                  >
                    <option value="BOTH">📄 Text & Files</option>
                    <option value="TEXT">📝 Text Only</option>
                    <option value="FILE">📁 Files Only</option>
                    <option value="NONE">❌ No Submission Required</option>
                  </select>
                </div>

                {/* Max Points */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Max Points <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.maxPoints}
                    onChange={(e) =>
                      setFormData({ ...formData, maxPoints: parseFloat(e.target.value) || 0 })
                    }
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Due Date */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Due Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.dueAt}
                    onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                  />
                </div>

                {/* Multiple Attempts */}
                <div className="col-12">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="allowMultipleAttempts"
                      checked={formData.allowMultipleAttempts}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          allowMultipleAttempts: e.target.checked,
                        })
                      }
                    />
                    <label className="form-check-label" htmlFor="allowMultipleAttempts">
                      Allow Multiple Attempts
                    </label>
                  </div>
                </div>

                {/* Max Attempts */}
                {formData.allowMultipleAttempts && (
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Max Attempts</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.maxAttempts}
                      onChange={(e) =>
                        setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 1 })
                      }
                      min="1"
                    />
                  </div>
                )}

                {/* Order Index */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Order Index
                    <small className="text-muted ms-2">(for sorting)</small>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.orderIndex || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        orderIndex: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="Optional"
                  />
                </div>

                {/* Rubric (if available) */}
                {rubrics.length > 0 && (
                  <div className="col-12">
                    <label className="form-label fw-semibold">Grading Rubric (Optional)</label>
                    <select
                      className="form-select"
                      value={formData.rubricId}
                      onChange={(e) => setFormData({ ...formData, rubricId: e.target.value })}
                    >
                      <option value="">No Rubric</option>
                      {rubrics.map((rubric) => (
                        <option key={rubric.id} value={rubric.id}>
                          {rubric.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {isEditing && assessment._count?.submissions > 0 && (
                <div className="alert alert-warning mt-3 mb-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Warning:</strong> This assessment has {assessment._count.submissions}{' '}
                  submission(s). Changes may affect existing submissions.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  <>{isEditing ? 'Update Assessment' : 'Create Assessment'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
