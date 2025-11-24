'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Copy, Eye, FileText } from 'lucide-react'
import { AssessmentTypeIcon, AssessmentTypeBadge } from '@/components/student/AssessmentTypeIcon'
import { CreateAssessmentModal } from '@/components/professor/CreateAssessmentModal'

type Assessment = {
  id: string
  title: string
  type: string
  submissionType: string
  maxPoints: number
  dueAt: string | null
  stats: {
    totalSubmissions: number
    gradedSubmissions: number
    pendingSubmissions: number
    lateSubmissions: number
    averageScore: number | null
  }
  rubric: any | null
}

type Class = {
  id: string
  classCode: string
  title: string
  course: {
    code: string
    title: string
  }
}

export default function AssessmentsPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null)

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    if (selectedClassId) {
      fetchAssessments()
    }
  }, [selectedClassId])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/professor/classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
        if (data.classes.length > 0) {
          setSelectedClassId(data.classes[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAssessments = async () => {
    if (!selectedClassId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/professor/classes/${selectedClassId}/assessments`)
      if (response.ok) {
        const data = await response.json()
        setAssessments(data.assessments || [])
      }
    } catch (error) {
      console.error('Error fetching assessments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (assessmentId: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return

    try {
      const response = await fetch(`/api/professor/assessments/${assessmentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Assessment deleted successfully')
        fetchAssessments()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete assessment')
      }
    } catch (error) {
      console.error('Error deleting assessment:', error)
      alert('Failed to delete assessment')
    }
  }

  const handleDuplicate = async (assessmentId: string) => {
    try {
      const response = await fetch(`/api/professor/assessments/${assessmentId}/duplicate`, {
        method: 'POST',
      })

      if (response.ok) {
        alert('Assessment duplicated successfully')
        fetchAssessments()
      } else {
        alert('Failed to duplicate assessment')
      }
    } catch (error) {
      console.error('Error duplicating assessment:', error)
      alert('Failed to duplicate assessment')
    }
  }

  const handleEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment)
    setShowModal(true)
  }

  const handleCreate = () => {
    setEditingAssessment(null)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingAssessment(null)
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId)

  // Group assessments by type
  const assessmentsByType = assessments.reduce((acc, assessment) => {
    if (!acc[assessment.type]) {
      acc[assessment.type] = []
    }
    acc[assessment.type].push(assessment)
    return acc
  }, {} as Record<string, Assessment[]>)

  const totalAssessments = assessments.length
  const totalPending = assessments.reduce((sum, a) => sum + a.stats.pendingSubmissions, 0)
  const avgCompletion =
    assessments.length > 0
      ? (assessments.reduce((sum, a) => sum + a.stats.gradedSubmissions, 0) /
          assessments.reduce((sum, a) => sum + a.stats.totalSubmissions, 1)) *
        100
      : 0

  if (loading && classes.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="display-5 fw-bold text-primary mb-2">📋 Assessments</h1>
        <p className="text-muted lead">Create and manage assignments for your classes</p>
      </div>

      {/* Class Selector */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Select Class</label>
              <select
                className="form-select form-select-lg"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.classCode} - {classItem.course.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6 text-end">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleCreate}
                disabled={!selectedClassId}
              >
                <Plus size={20} className="me-2" />
                Create Assessment
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedClass && (
        <>
          {/* Statistics Cards */}
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #0d6efd' }}>
                <div className="card-body">
                  <h6 className="card-subtitle text-muted mb-2 small">Total Assessments</h6>
                  <h2 className="card-title mb-0">{totalAssessments}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #ffc107' }}>
                <div className="card-body">
                  <h6 className="card-subtitle text-muted mb-2 small">Pending Submissions</h6>
                  <h2 className="card-title mb-0">{totalPending}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #198754' }}>
                <div className="card-body">
                  <h6 className="card-subtitle text-muted mb-2 small">Completion Rate</h6>
                  <h2 className="card-title mb-0">{avgCompletion.toFixed(0)}%</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Assessments by Type */}
          {assessments.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <FileText size={64} className="text-muted mb-3" />
                <h3 className="h5 text-muted">No Assessments Yet</h3>
                <p className="text-muted mb-3">
                  Create your first assessment for {selectedClass.course.title}
                </p>
                <button className="btn btn-primary" onClick={handleCreate}>
                  <Plus size={18} className="me-2" />
                  Create Assessment
                </button>
              </div>
            </div>
          ) : (
            Object.entries(assessmentsByType).map(([type, typeAssessments]) => (
              <div key={type} className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white border-bottom">
                  <h5 className="card-title mb-0 fw-bold d-flex align-items-center">
                    <AssessmentTypeIcon type={type as any} size={24} />
                    <span className="ms-2">{type.replace('_', ' ')}</span>
                    <span className="badge bg-secondary ms-2">{typeAssessments.length}</span>
                  </h5>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="py-3">Title</th>
                          <th className="py-3">Due Date</th>
                          <th className="py-3 text-center">Points</th>
                          <th className="py-3 text-center">Submissions</th>
                          <th className="py-3 text-center">Graded</th>
                          <th className="py-3 text-center">Pending</th>
                          <th className="py-3 text-center">Avg Score</th>
                          <th className="py-3 text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {typeAssessments.map((assessment) => (
                          <tr key={assessment.id}>
                            <td className="py-3">
                              <div className="fw-semibold">{assessment.title}</div>
                              {assessment.rubric && (
                                <small className="text-muted">
                                  <i className="bi bi-ui-checks me-1"></i>
                                  Has Rubric
                                </small>
                              )}
                            </td>
                            <td className="py-3">
                              {assessment.dueAt ? (
                                <small>
                                  {new Date(assessment.dueAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </small>
                              ) : (
                                <small className="text-muted">No due date</small>
                              )}
                            </td>
                            <td className="py-3 text-center">
                              <span className="badge bg-info">{assessment.maxPoints}</span>
                            </td>
                            <td className="py-3 text-center">{assessment.stats.totalSubmissions}</td>
                            <td className="py-3 text-center">
                              <span className="badge bg-success">{assessment.stats.gradedSubmissions}</span>
                            </td>
                            <td className="py-3 text-center">
                              <span className="badge bg-warning text-dark">
                                {assessment.stats.pendingSubmissions}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              {assessment.stats.averageScore !== null
                                ? `${assessment.stats.averageScore.toFixed(1)}%`
                                : '-'}
                            </td>
                            <td className="py-3 text-end">
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary" title="View Submissions">
                                  <Eye size={14} />
                                </button>
                                <button
                                  className="btn btn-outline-secondary"
                                  title="Edit"
                                  onClick={() => handleEdit(assessment)}
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  className="btn btn-outline-info"
                                  title="Duplicate"
                                  onClick={() => handleDuplicate(assessment.id)}
                                >
                                  <Copy size={14} />
                                </button>
                                <button
                                  className="btn btn-outline-danger"
                                  title="Delete"
                                  onClick={() => handleDelete(assessment.id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* Create/Edit Assessment Modal */}
      {showModal && selectedClassId && (
        <CreateAssessmentModal
          classId={selectedClassId}
          assessment={editingAssessment}
          onClose={handleModalClose}
          onSuccess={fetchAssessments}
        />
      )}
    </div>
  )
}
