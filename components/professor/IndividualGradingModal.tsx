'use client'

import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, FileText, Clock, AlertCircle } from 'lucide-react'

type Submission = {
  id: string
  submittedAt: string
  totalScore: number | null
  status: string
  isLate: boolean
  student: {
    id: string
    fullName: string | null
    email: string
    usernameSchoolId: string | null
  }
  assessment: {
    id: string
    title: string
    type: string
    maxPoints: number
    dueAt: string | null
  }
  submissionText: string | null
  submissionFiles: any
  feedback: string | null
}

type RubricCriterion = {
  id: string
  title: string
  description: string | null
  maxPoints: number
  orderIndex: number
}

type Rubric = {
  id: string
  title: string
  description: string | null
  criteria: RubricCriterion[]
}

type SubmissionDetail = Submission & {
  assessment: Submission['assessment'] & {
    rubric: Rubric | null
  }
}

type Props = {
  submission: Submission
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
  onSave: () => void
  hasNext: boolean
  hasPrevious: boolean
}

export function IndividualGradingModal({
  submission,
  onClose,
  onNext,
  onPrevious,
  onSave,
  hasNext,
  hasPrevious,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submissionDetail, setSubmissionDetail] = useState<SubmissionDetail | null>(null)
  const [manualScore, setManualScore] = useState<string>('')
  const [feedback, setFeedback] = useState<string>('')
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchSubmissionDetail()
  }, [submission.id])

  const fetchSubmissionDetail = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/professor/submissions/${submission.id}`)
      if (response.ok) {
        const data = await response.json()
        setSubmissionDetail(data.submission)
        setManualScore(data.submission.totalScore?.toString() || '')
        setFeedback(data.submission.feedback || '')

        // Initialize rubric scores if rubric exists
        if (data.submission.assessment.rubric) {
          const scores: Record<string, number> = {}
          data.submission.assessment.rubric.criteria.forEach((criterion: RubricCriterion) => {
            scores[criterion.id] = 0
          })
          setRubricScores(scores)
        }
      }
    } catch (error) {
      console.error('Error fetching submission detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!submissionDetail) return

    setSaving(true)
    try {
      const finalScore = submissionDetail.assessment.rubric
        ? Object.values(rubricScores).reduce((sum, score) => sum + score, 0)
        : Number(manualScore)

      const response = await fetch(`/api/professor/submissions/${submission.id}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manualScore: finalScore,
          feedback: feedback,
        }),
      })

      if (response.ok) {
        onSave()
        alert('Grade saved successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to save grade: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving grade:', error)
      alert('Failed to save grade')
    } finally {
      setSaving(false)
    }
  }

  const handleRubricScoreChange = (criterionId: string, score: number) => {
    setRubricScores((prev) => ({
      ...prev,
      [criterionId]: score,
    }))
  }

  const totalRubricScore = Object.values(rubricScores).reduce((sum, score) => sum + score, 0)

  if (loading || !submissionDetail) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-body text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header bg-primary text-white">
            <div>
              <h5 className="modal-title mb-1">
                <FileText size={20} className="me-2 d-inline" />
                {submissionDetail.assessment.title}
              </h5>
              <small className="opacity-90">
                {submissionDetail.student.fullName || submissionDetail.student.email}
              </small>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body">
            {/* Student & Assessment Info */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h6 className="text-muted mb-3">Student Information</h6>
                    <p className="mb-2">
                      <strong>Name:</strong> {submissionDetail.student.fullName || submissionDetail.student.email}
                    </p>
                    <p className="mb-2">
                      <strong>Email:</strong> {submissionDetail.student.email}
                    </p>
                    {submissionDetail.student.usernameSchoolId && (
                      <p className="mb-0">
                        <strong>School ID:</strong> {submissionDetail.student.usernameSchoolId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h6 className="text-muted mb-3">Submission Details</h6>
                    <p className="mb-2">
                      <strong>Type:</strong> {submissionDetail.assessment.type.replace('_', ' ')}
                    </p>
                    <p className="mb-2">
                      <strong>Max Points:</strong> {submissionDetail.assessment.maxPoints}
                    </p>
                    <p className="mb-2">
                      <strong>Submitted:</strong>{' '}
                      {new Date(submissionDetail.submittedAt).toLocaleString()}
                      {submissionDetail.isLate && (
                        <span className="badge bg-warning text-dark ms-2">
                          <Clock size={12} className="me-1" />
                          Late
                        </span>
                      )}
                    </p>
                    <p className="mb-0">
                      <strong>Status:</strong>{' '}
                      <span className={`badge ${
                        submissionDetail.status === 'GRADED' ? 'bg-success' :
                        submissionDetail.status === 'SUBMITTED' ? 'bg-warning text-dark' :
                        'bg-secondary'
                      }`}>
                        {submissionDetail.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Content */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-light">
                <h6 className="mb-0">Submission Content</h6>
              </div>
              <div className="card-body">
                {submissionDetail.submissionText ? (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Text Submission:</label>
                    <div className="p-3 bg-light rounded">
                      {submissionDetail.submissionText}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted">No text submission</p>
                )}

                {submissionDetail.submissionFiles && (
                  <div>
                    <label className="form-label fw-semibold">Files:</label>
                    <div className="list-group">
                      {Array.isArray(submissionDetail.submissionFiles) &&
                        submissionDetail.submissionFiles.map((file: any, idx: number) => (
                          <div key={idx} className="list-group-item">
                            <FileText size={16} className="me-2" />
                            {file.filename || `File ${idx + 1}`}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Grading Section */}
            {submissionDetail.assessment.rubric ? (
              // Rubric Grading
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-light">
                  <h6 className="mb-0">Rubric Grading: {submissionDetail.assessment.rubric.title}</h6>
                  {submissionDetail.assessment.rubric.description && (
                    <small className="text-muted">{submissionDetail.assessment.rubric.description}</small>
                  )}
                </div>
                <div className="card-body">
                  {submissionDetail.assessment.rubric.criteria.map((criterion) => (
                    <div key={criterion.id} className="mb-3 pb-3 border-bottom">
                      <div className="row align-items-center">
                        <div className="col-md-8">
                          <label className="form-label fw-semibold mb-1">{criterion.title}</label>
                          {criterion.description && (
                            <p className="text-muted small mb-0">{criterion.description}</p>
                          )}
                        </div>
                        <div className="col-md-4">
                          <div className="input-group">
                            <input
                              type="number"
                              className="form-control"
                              min="0"
                              max={criterion.maxPoints}
                              step="0.5"
                              value={rubricScores[criterion.id] || 0}
                              onChange={(e) =>
                                handleRubricScoreChange(criterion.id, Number(e.target.value))
                              }
                            />
                            <span className="input-group-text">/ {criterion.maxPoints}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-end">
                    <h5 className="mb-0">
                      Total Score: <span className="text-primary">{totalRubricScore}</span> /{' '}
                      {submissionDetail.assessment.maxPoints}
                    </h5>
                  </div>
                </div>
              </div>
            ) : (
              // Manual Score Input
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-light">
                  <h6 className="mb-0">Score</h6>
                </div>
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-md-4">
                      <label className="form-label">Manual Score:</label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          max={submissionDetail.assessment.maxPoints}
                          step="0.5"
                          value={manualScore}
                          onChange={(e) => setManualScore(e.target.value)}
                        />
                        <span className="input-group-text">/ {submissionDetail.assessment.maxPoints}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback Section */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-light">
                <h6 className="mb-0">Feedback</h6>
              </div>
              <div className="card-body">
                <textarea
                  className="form-control"
                  rows={5}
                  placeholder="Enter feedback for the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer d-flex justify-content-between">
            <div>
              <button
                className="btn btn-outline-secondary me-2"
                onClick={onPrevious}
                disabled={!hasPrevious}
              >
                <ChevronLeft size={16} className="me-1" />
                Previous
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={onNext}
                disabled={!hasNext}
              >
                Next
                <ChevronRight size={16} className="ms-1" />
              </button>
            </div>
            <div>
              <button className="btn btn-secondary me-2" onClick={onClose}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Grade'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
