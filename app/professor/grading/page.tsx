'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Clock, CheckCircle, AlertCircle, FileText, Grid, List } from 'lucide-react'
import { AssessmentTypeBadge } from '@/components/student/AssessmentTypeIcon'
import { GradeCell } from '@/components/professor/GradeCell'
import { IndividualGradingModal } from '@/components/professor/IndividualGradingModal'

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
}

type GradebookStudent = {
  student: {
    id: string
    fullName: string | null
    email: string
  }
  grades: Record<string, {
    submissionId: string
    score: number | null
    status: string
    isLate: boolean
  }>
  categoryPercentages: Record<string, number>
  categoryStats: Record<string, { earned: number; possible: number; count: number }>
  overallPercentage: number
  totalEarned: number
  totalPossible: number
}

type Assessment = {
  id: string
  title: string
  type: string
  maxPoints: number
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

export default function GradingPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [viewMode, setViewMode] = useState<'individual' | 'grid'>('individual')

  // Individual view state
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [assessmentFilter, setAssessmentFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Grid view state
  const [gradebookStudents, setGradebookStudents] = useState<GradebookStudent[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [debugLog, setDebugLog] = useState<string[]>([])

  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

  const addDebugLog = (message: string) => {
    setDebugLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`])
    console.log(message)
  }

  const fetchClasses = useCallback(async () => {
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
  }, [])

  const fetchAssessments = useCallback(async () => {
    if (!selectedClassId) return

    try {
      const response = await fetch(`/api/professor/classes/${selectedClassId}/assessments`)
      if (response.ok) {
        const data = await response.json()
        setAssessments(data.assessments || [])
      }
    } catch (error) {
      console.error('Error fetching assessments:', error)
    }
  }, [selectedClassId])

  const fetchSubmissions = useCallback(async () => {
    if (!selectedClassId) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (assessmentFilter !== 'all') {
        params.append('assessmentId', assessmentFilter)
      }

      const response = await fetch(
        `/api/professor/classes/${selectedClassId}/submissions?${params}`
      )
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedClassId, statusFilter, assessmentFilter])

  const fetchGradebook = useCallback(async () => {
    if (!selectedClassId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/professor/classes/${selectedClassId}/gradebook`)
      if (response.ok) {
        const data = await response.json()
        setGradebookStudents(data.students || [])
        setAssessments(data.assessments || [])
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch gradebook:', response.status, errorData)
        alert(`Failed to load gradebook: ${errorData.details || errorData.error}`)
      }
    } catch (error) {
      console.error('Error fetching gradebook:', error)
      alert(`Error loading gradebook: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [selectedClassId])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    if (selectedClassId) {
      // Fetch assessments for both views
      fetchAssessments()

      if (viewMode === 'individual') {
        fetchSubmissions()
      } else {
        fetchGradebook()
      }
    }
  }, [selectedClassId, viewMode, fetchSubmissions, fetchGradebook, fetchAssessments])

  const handleGradeUpdate = async (
    submissionId: string | null,
    studentId: string,
    assessmentId: string,
    newScore: number,
    assessmentMaxPoints: number
  ): Promise<void> => {
    const score = newScore

    if (isNaN(score)) {
      return // Don't update if invalid number
    }

    if (score < 0 || score > assessmentMaxPoints) {
      alert(`Score must be between 0 and ${assessmentMaxPoints}`)
      return
    }

    try {
      addDebugLog(`Updating: score=${score}, assessment=${assessmentId.substring(0,8)}`)
      console.log('Updating grade:', { assessmentId, studentId, score })

      // Use new endpoint that handles both creating and updating grades
      const response = await fetch(`/api/professor/assessments/${assessmentId}/students/${studentId}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualScore: score }),
      })

      if (response.ok) {
        const data = await response.json()
        addDebugLog(`✓ Grade saved: ${score}`)
        console.log('Grade updated successfully:', data)

        // Update local state instead of full refresh for better UX
        setGradebookStudents((prev) => {
          const updated = prev.map((student) => {
            if (student.student.id === studentId) {
              const updatedGrades = { ...student.grades }

              // Ensure grade object exists
              if (!updatedGrades[assessmentId]) {
                updatedGrades[assessmentId] = {
                  submissionId: data.submission?.id || null,
                  score: null,
                  status: 'NOT_SUBMITTED',
                  isLate: false,
                }
              }

              // Update the grade - create a NEW object to trigger re-render
              updatedGrades[assessmentId] = {
                ...updatedGrades[assessmentId],
                score: score,
                status: 'GRADED',
                submissionId: data.submission?.id || updatedGrades[assessmentId].submissionId,
              }

              // Recalculate category stats
              const statsByType: Record<string, { earned: number; possible: number; count: number }> = {}
              assessments.forEach((assessment) => {
                const type = assessment.type
                if (!statsByType[type]) {
                  statsByType[type] = { earned: 0, possible: 0, count: 0 }
                }

                const grade = updatedGrades[assessment.id]
                if (grade && grade.score !== null) {
                  statsByType[type].earned += grade.score
                  statsByType[type].possible += Number(assessment.maxPoints)
                  statsByType[type].count += 1
                }
              })

              let totalEarned = 0
              let totalPossible = 0
              Object.values(statsByType).forEach((stats) => {
                totalEarned += stats.earned
                totalPossible += stats.possible
              })

              const overallPercentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0

              const categoryPercentages: Record<string, number> = {}
              Object.entries(statsByType).forEach(([type, stats]) => {
                categoryPercentages[type] = stats.possible > 0 ? (stats.earned / stats.possible) * 100 : 0
              })

              const updatedStudent = {
                ...student,
                grades: updatedGrades,
                categoryStats: statsByType,
                categoryPercentages,
                overallPercentage,
                totalEarned,
                totalPossible,
              }

              console.log('State updated for student:', {
                studentId,
                assessmentId,
                newScore: updatedStudent.grades[assessmentId].score,
                overallPercentage: updatedStudent.overallPercentage
              })

              return updatedStudent
            }
            return student
          })

          addDebugLog(`State updated - new score in state: ${score}`)
          console.log('Full state after update:', updated.find(s => s.student.id === studentId)?.grades[assessmentId])
          return updated
        })
      } else {
        const error = await response.json()
        const errorMsg = error.details || error.error || 'Unknown error'
        addDebugLog(`✗ Failed: ${errorMsg}`)
        console.error('Grade update failed:', error)
        console.error('Full error object:', JSON.stringify(error, null, 2))
        console.error('Response status:', response.status)
        alert(`Failed to update grade: ${errorMsg}`)
        fetchGradebook() // Refresh on error
      }
    } catch (error) {
      addDebugLog(`✗ Error: ${error instanceof Error ? error.message : 'Unknown'}`)
      console.error('Error updating grade:', error)
      alert('Failed to update grade: ' + (error instanceof Error ? error.message : 'Unknown error'))
      fetchGradebook() // Refresh on error
    }
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId)

  // Filter assessments by category (for individual view)
  const filteredAssessments = categoryFilter === 'all'
    ? assessments
    : assessments.filter(a => a.type === categoryFilter)

  // Filter submissions by category and search term (for individual view)
  const filteredSubmissions = submissions.filter((sub) => {
    // Category filter
    const matchesCategory = categoryFilter === 'all' || sub.assessment.type === categoryFilter

    // Search filter
    const studentName = sub.student.fullName || sub.student.email
    const matchesSearch =
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.assessment.title.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesCategory && matchesSearch
  })

  // Calculate statistics for individual view
  const totalSubmissions = filteredSubmissions.length
  const pendingSubmissions = filteredSubmissions.filter((s) => s.status === 'SUBMITTED').length
  const gradedSubmissions = filteredSubmissions.filter((s) => s.status === 'GRADED').length
  const lateSubmissions = filteredSubmissions.filter((s) => s.isLate).length

  // Group assessments by type for grid view
  const assessmentsByType: Record<string, Assessment[]> = {}
  assessments.forEach((assessment) => {
    if (!assessmentsByType[assessment.type]) {
      assessmentsByType[assessment.type] = []
    }
    assessmentsByType[assessment.type].push(assessment)
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'GRADED':
        return <span className="badge bg-success">Graded</span>
      case 'SUBMITTED':
        return <span className="badge bg-warning text-dark">Pending</span>
      case 'DRAFT':
        return <span className="badge bg-secondary">Draft</span>
      case 'RETURNED':
        return <span className="badge bg-info">Returned</span>
      default:
        return <span className="badge bg-secondary">{status}</span>
    }
  }

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-success'
    if (percentage >= 80) return 'text-primary'
    if (percentage >= 70) return 'text-warning'
    return 'text-danger'
  }

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
        <h1 className="display-5 fw-bold text-primary mb-2">✅ Grading</h1>
        <p className="text-muted lead">Grade student submissions and manage your gradebook</p>
      </div>

      {/* View Mode Toggle & Class Selector */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row align-items-center g-3">
            <div className="col-md-3">
              <label className="form-label fw-semibold">View Mode</label>
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn ${viewMode === 'individual' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setViewMode('individual')}
                >
                  <List size={16} className="me-1" />
                  Individual Grades
                </button>
                <button
                  type="button"
                  className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid size={16} className="me-1" />
                  All Grades
                </button>
              </div>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Select Class</label>
              <select
                className="form-select"
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

            {viewMode === 'individual' && (
              <>
                <div className="col-md-2">
                  <label className="form-label fw-semibold">Category</label>
                  <select
                    className="form-select"
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value)
                      setAssessmentFilter('all') // Reset assessment filter when category changes
                    }}
                  >
                    <option value="all">All Categories</option>
                    <option value="INTERACTIVE_LESSON">Interactive Lesson</option>
                    <option value="LAB">Lab</option>
                    <option value="EXAM">Exam</option>
                    <option value="QUIZ">Quiz</option>
                    <option value="DISCUSSION">Discussion</option>
                  </select>
                </div>

                <div className="col-md-2">
                  <label className="form-label fw-semibold">Assessment</label>
                  <select
                    className="form-select"
                    value={assessmentFilter}
                    onChange={(e) => setAssessmentFilter(e.target.value)}
                  >
                    <option value="all">All Assessments</option>
                    {filteredAssessments.map((assessment) => (
                      <option key={assessment.id} value={assessment.id}>
                        {assessment.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-2">
                  <label className="form-label fw-semibold">Status Filter</label>
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="SUBMITTED">Pending Only</option>
                    <option value="GRADED">Graded Only</option>
                    <option value="DRAFT">Drafts</option>
                    <option value="RETURNED">Returned</option>
                  </select>
                </div>

                <div className="col-md-2">
                  <label className="form-label fw-semibold">Search</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {selectedClass && viewMode === 'individual' && (
        <>
          {/* Statistics Cards */}
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #0d6efd' }}>
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2">
                    <FileText className="text-primary me-2" size={20} />
                    <h6 className="card-subtitle text-muted mb-0 small">Total Submissions</h6>
                  </div>
                  <h2 className="card-title mb-0">{totalSubmissions}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #ffc107' }}>
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2">
                    <Clock className="text-warning me-2" size={20} />
                    <h6 className="card-subtitle text-muted mb-0 small">Pending</h6>
                  </div>
                  <h2 className="card-title mb-0">{pendingSubmissions}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #198754' }}>
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2">
                    <CheckCircle className="text-success me-2" size={20} />
                    <h6 className="card-subtitle text-muted mb-0 small">Graded</h6>
                  </div>
                  <h2 className="card-title mb-0">{gradedSubmissions}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #dc3545' }}>
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2">
                    <AlertCircle className="text-danger me-2" size={20} />
                    <h6 className="card-subtitle text-muted mb-0 small">Late Submissions</h6>
                  </div>
                  <h2 className="card-title mb-0">{lateSubmissions}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions Queue */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom">
              <h5 className="card-title mb-0 fw-bold">Submission Queue</h5>
            </div>
            <div className="card-body p-0">
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-5">
                  <FileText size={64} className="text-muted mb-3" />
                  <h3 className="h5 text-muted">No Submissions Found</h3>
                  <p className="text-muted mb-0">
                    {statusFilter === 'SUBMITTED'
                      ? 'All submissions have been graded!'
                      : 'No submissions match your filters.'}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="py-3">Student</th>
                        <th className="py-3">Assessment</th>
                        <th className="py-3">Type</th>
                        <th className="py-3">Submitted</th>
                        <th className="py-3 text-center">Status</th>
                        <th className="py-3 text-center">Score</th>
                        <th className="py-3 text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.map((submission) => (
                        <tr key={submission.id}>
                          <td className="py-3">
                            <div className="fw-semibold">
                              {submission.student.fullName || submission.student.email}
                            </div>
                            <small className="text-muted">{submission.student.email}</small>
                          </td>
                          <td className="py-3">
                            <div className="fw-semibold">{submission.assessment.title}</div>
                            {submission.isLate && (
                              <span className="badge bg-danger small">Late</span>
                            )}
                          </td>
                          <td className="py-3">
                            <AssessmentTypeBadge type={submission.assessment.type as any} />
                          </td>
                          <td className="py-3">
                            <small>
                              {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </small>
                          </td>
                          <td className="py-3 text-center">{getStatusBadge(submission.status)}</td>
                          <td className="py-3 text-center">
                            {submission.totalScore !== null ? (
                              <span className="fw-semibold">
                                {Number(submission.totalScore).toFixed(1)} /{' '}
                                {Number(submission.assessment.maxPoints).toFixed(0)}
                              </span>
                            ) : (
                              <span className="text-muted">Not graded</span>
                            )}
                          </td>
                          <td className="py-3 text-end">
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              {submission.status === 'GRADED' ? 'View' : 'Grade'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {selectedClass && viewMode === 'grid' && (
        <>
          {/* Debug Log */}
          {debugLog.length > 0 && (
            <div className="alert alert-info mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>Debug Log:</strong>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setDebugLog([])}
                >
                  Clear
                </button>
              </div>
              {debugLog.map((log, idx) => (
                <div key={idx} className="small font-monospace">{log}</div>
              ))}
            </div>
          )}

          <div className="card border-0 shadow-lg">
            <div className="card-header bg-primary text-white py-3">
              <h5 className="card-title mb-1 fw-bold">
                <i className="bi bi-table me-2"></i>
                Gradebook - {selectedClass.course.title}
              </h5>
              <small className="opacity-90">
                <i className="bi bi-info-circle me-1"></i>
                Click any cell to edit • Press Enter to save • Yellow = Late submission
              </small>
            </div>
          <div className="card-body p-0">
            {assessments.length === 0 ? (
              <div className="text-center py-5">
                <FileText size={64} className="text-muted mb-3" />
                <h3 className="h5 text-muted">No Assessments Found</h3>
                <p className="text-muted mb-3">
                  This class doesn't have any assessments yet. Create some assessments to start grading!
                </p>
                <a href="/professor/assessments" className="btn btn-primary">
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Assessment
                </a>
              </div>
            ) : (
            <div className="table-responsive" style={{ maxHeight: '75vh', overflowY: 'auto', overflowX: 'auto' }}>
              <table className="table table-hover table-bordered mb-0" style={{ fontSize: '0.875rem' }}>
                <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr className="border-bottom border-2">
                    <th
                      rowSpan={2}
                      className="align-middle text-start fw-bold border-end border-3"
                      style={{
                        position: 'sticky',
                        left: 0,
                        backgroundColor: '#f8f9fa',
                        minWidth: '220px',
                        maxWidth: '300px',
                        padding: '16px 12px',
                        zIndex: 11,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <i className="bi bi-person-fill me-2 text-primary"></i>
                      Student Name
                    </th>
                    {Object.entries(assessmentsByType).map(([type, typeAssessments]) => (
                      <th
                        key={type}
                        colSpan={typeAssessments.length + 1}
                        className="text-center fw-bold text-uppercase bg-primary text-white border-start border-3"
                        style={{
                          padding: '12px 8px',
                          fontSize: '0.85rem',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {type.replace('_', ' ')}
                      </th>
                    ))}
                    <th
                      rowSpan={2}
                      className="align-middle text-center fw-bold bg-success text-white border-start border-3"
                      style={{
                        minWidth: '120px',
                        padding: '16px 8px',
                      }}
                    >
                      <i className="bi bi-trophy-fill me-1"></i>
                      Overall<br />Grade
                    </th>
                  </tr>
                  <tr className="table-light">
                    {Object.entries(assessmentsByType).map(([type, typeAssessments]) => (
                      <React.Fragment key={`${type}-headers`}>
                        {typeAssessments.map((assessment, idx) => (
                          <th
                            key={assessment.id}
                            className={`text-center ${idx === 0 ? 'border-start border-3' : ''}`}
                            style={{
                              minWidth: '100px',
                              maxWidth: '140px',
                              padding: '10px 8px',
                              fontSize: '0.75rem',
                            }}
                          >
                            <div
                              title={assessment.title}
                              className="fw-semibold text-truncate"
                              style={{ maxWidth: '120px', margin: '0 auto' }}
                            >
                              {assessment.title.substring(0, 15)}
                              {assessment.title.length > 15 ? '...' : ''}
                            </div>
                            <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                              <i className="bi bi-star-fill me-1"></i>
                              {assessment.maxPoints} pts
                            </div>
                          </th>
                        ))}
                        <th
                          className="text-center fw-bold bg-light border-start border-2"
                          style={{
                            minWidth: '85px',
                            padding: '10px 6px',
                            fontSize: '0.8rem'
                          }}
                        >
                          <i className="bi bi-calculator me-1"></i>
                          Category<br />Avg
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gradebookStudents.map((studentData, studentIdx) => (
                    <tr key={studentData.student.id} className={studentIdx % 2 === 0 ? '' : 'table-active'}>
                      <td
                        className="fw-semibold text-start border-end border-3"
                        style={{
                          position: 'sticky',
                          left: 0,
                          backgroundColor: studentIdx % 2 === 0 ? 'white' : '#f8f9fa',
                          padding: '12px 12px',
                          zIndex: 1,
                          minWidth: '220px',
                          maxWidth: '300px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={studentData.student.fullName || studentData.student.email}
                      >
                        <i className="bi bi-person-circle me-2 text-muted"></i>
                        {studentData.student.fullName || studentData.student.email}
                      </td>
                      {Object.entries(assessmentsByType).map(([type, typeAssessments]) => (
                        <React.Fragment key={`${studentData.student.id}-${type}`}>
                          {typeAssessments.map((assessment, idx) => {
                            const grade = studentData.grades[assessment.id]

                            return (
                              <td
                                key={`${studentData.student.id}-${assessment.id}`}
                                className={`text-center align-middle ${idx === 0 ? 'border-start border-3' : ''}`}
                                style={{
                                  padding: '6px',
                                }}
                              >
                                {grade ? (
                                  <GradeCell
                                    studentId={studentData.student.id}
                                    studentName={studentData.student.fullName || studentData.student.email}
                                    assessmentId={assessment.id}
                                    assessmentTitle={assessment.title}
                                    submissionId={grade.submissionId}
                                    initialScore={grade.score}
                                    maxPoints={Number(assessment.maxPoints)}
                                    isLate={grade.isLate}
                                    onUpdate={handleGradeUpdate}
                                  />
                                ) : (
                                  <span className="text-muted fw-light">-</span>
                                )}
                              </td>
                            )
                          })}
                          <td
                            className={`text-center fw-bold ${getGradeColor(studentData.categoryPercentages[type] || 0)}`}
                            style={{
                              backgroundColor: '#f8f9fa',
                              borderLeft: '2px solid #dee2e6',
                              padding: '8px 4px',
                              fontSize: '0.9rem',
                            }}
                          >
                            {studentData.categoryStats[type]?.count > 0
                              ? `${studentData.categoryPercentages[type].toFixed(1)}%`
                              : '-'}
                          </td>
                        </React.Fragment>
                      ))}
                      <td
                        className={`text-center fw-bold ${getGradeColor(studentData.overallPercentage)}`}
                        style={{
                          backgroundColor: '#f0f0f0',
                          borderLeft: '3px solid #dee2e6',
                          padding: '8px 4px',
                          fontSize: '1rem',
                        }}
                      >
                        {studentData.overallPercentage.toFixed(1)}%
                        <br />
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {studentData.totalEarned.toFixed(1)}/{studentData.totalPossible.toFixed(0)}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
          <div className="card-footer bg-light text-center">
            <small className="text-muted">
              <strong>Tip:</strong> Yellow cells indicate late submissions •
              Press Enter or click outside to save changes
            </small>
          </div>
        </div>
        </>
      )}

      {/* Individual Grading Modal */}
      {selectedSubmission && (
        <IndividualGradingModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onNext={() => {
            const currentIndex = filteredSubmissions.findIndex(s => s.id === selectedSubmission.id)
            if (currentIndex < filteredSubmissions.length - 1) {
              setSelectedSubmission(filteredSubmissions[currentIndex + 1])
            }
          }}
          onPrevious={() => {
            const currentIndex = filteredSubmissions.findIndex(s => s.id === selectedSubmission.id)
            if (currentIndex > 0) {
              setSelectedSubmission(filteredSubmissions[currentIndex - 1])
            }
          }}
          onSave={() => {
            // Refresh submissions after saving
            fetchSubmissions()
          }}
          hasNext={(() => {
            const currentIndex = filteredSubmissions.findIndex(s => s.id === selectedSubmission.id)
            return currentIndex < filteredSubmissions.length - 1
          })()}
          hasPrevious={(() => {
            const currentIndex = filteredSubmissions.findIndex(s => s.id === selectedSubmission.id)
            return currentIndex > 0
          })()}
        />
      )}
    </div>
  )
}
