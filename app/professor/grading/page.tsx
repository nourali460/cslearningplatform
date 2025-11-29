'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Clock, CheckCircle, AlertCircle, FileText, Grid, List, Loader2 } from 'lucide-react'
import { AssessmentTypeBadge } from '@/components/student/AssessmentTypeIcon'
import { GradeCell } from '@/components/professor/GradeCell'
import { IndividualGradingModal } from '@/components/professor/IndividualGradingModal'
import { GradebookModal } from '@/components/professor/GradebookModal'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'

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
    moduleItems?: Array<{
      id: string
      module: {
        id: string
        title: string
        orderIndex: number
      }
    }>
  }
  submissionText: string | null
  submissionFiles: any
  feedback: string | null
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
  const [showGradebookModal, setShowGradebookModal] = useState(false)

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
      // Fetch assessments and submissions for the main view
      fetchAssessments()
      fetchSubmissions()
    }
  }, [selectedClassId, fetchSubmissions, fetchAssessments])

  useEffect(() => {
    if (showGradebookModal && selectedClassId) {
      // Fetch gradebook data when modal is opened
      fetchGradebook()
    }
  }, [showGradebookModal, selectedClassId, fetchGradebook])

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
    : assessments.filter(a => a && a.type === categoryFilter)

  // Filter submissions by category and search term (for individual view)
  const filteredSubmissions = submissions.filter((sub) => {
    // Safety check
    if (!sub.assessment || !sub.student) return false

    // Category filter
    const matchesCategory = categoryFilter === 'all' || sub.assessment.type === categoryFilter

    // Search filter
    const studentName = sub.student.fullName || sub.student.email || ''
    const assessmentTitle = sub.assessment.title || ''
    const matchesSearch =
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessmentTitle.toLowerCase().includes(searchTerm.toLowerCase())

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
        return <Badge variant="success">Graded</Badge>
      case 'SUBMITTED':
        return <Badge variant="warning">Pending</Badge>
      case 'DRAFT':
        return <Badge>Draft</Badge>
      case 'RETURNED':
        return <Badge variant="info">Returned</Badge>
      default:
        return <Badge>{status}</Badge>
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent-orange" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Grading</h1>
        <p className="text-foreground-secondary">Grade student submissions and manage your gradebook</p>
      </div>

      {/* View Mode Toggle & Class Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-1">
              <label className="text-sm font-medium mb-2 block">Gradebook</label>
              <Button
                className="w-full"
                onClick={() => {
                  setSelectedSubmission(null) // Close individual modal if open
                  setShowGradebookModal(true)
                }}
                disabled={!selectedClassId}
              >
                <Grid className="mr-2 h-4 w-4" />
                View All Grades
              </Button>
            </div>

            <div className="md:col-span-1">
              <label className="text-sm font-medium mb-2 block">Select Class</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.classCode} - {classItem.course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-1">
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select
                value={categoryFilter}
                onValueChange={(value) => {
                  setCategoryFilter(value)
                  setAssessmentFilter('all')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="INTERACTIVE_LESSON">Interactive Lesson</SelectItem>
                  <SelectItem value="LAB">Lab</SelectItem>
                  <SelectItem value="EXAM">Exam</SelectItem>
                  <SelectItem value="QUIZ">Quiz</SelectItem>
                  <SelectItem value="DISCUSSION">Discussion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-1">
              <label className="text-sm font-medium mb-2 block">Assessment</label>
              <Select value={assessmentFilter} onValueChange={setAssessmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Assessments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assessments</SelectItem>
                  {filteredAssessments.map((assessment) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      {assessment.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-1">
              <label className="text-sm font-medium mb-2 block">Status Filter</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="SUBMITTED">Pending Only</SelectItem>
                  <SelectItem value="GRADED">Graded Only</SelectItem>
                  <SelectItem value="DRAFT">Drafts</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-1">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-accent-purple">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground-secondary">
                  Total Submissions
                </CardTitle>
                <FileText className="h-5 w-5 text-accent-purple" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{totalSubmissions}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent-orange">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground-secondary">
                  Pending
                </CardTitle>
                <Clock className="h-5 w-5 text-accent-orange" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{pendingSubmissions}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-success">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground-secondary">
                  Graded
                </CardTitle>
                <CheckCircle className="h-5 w-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{gradedSubmissions}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-error">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground-secondary">
                  Late Submissions
                </CardTitle>
                <AlertCircle className="h-5 w-5 text-error" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{lateSubmissions}</div>
              </CardContent>
            </Card>
          </div>

          {/* Submissions Queue */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Queue</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <FileText size={64} className="text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Submissions Found</h3>
                  <p className="text-muted-foreground">
                    {statusFilter === 'SUBMITTED'
                      ? 'All submissions have been graded!'
                      : 'No submissions match your filters.'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div className="font-semibold">
                            {submission.student.fullName || submission.student.email}
                          </div>
                          <div className="text-sm text-muted-foreground">{submission.student.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{submission.assessment.title}</div>
                          <div className="flex gap-2 mt-1">
                            {submission.assessment.moduleItems && submission.assessment.moduleItems.length > 0 && (
                              <Badge variant="purple" className="text-xs">
                                Module {submission.assessment.moduleItems[0].module.orderIndex + 1}
                              </Badge>
                            )}
                            {submission.isLate && (
                              <Badge variant="error" className="text-xs">Late</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <AssessmentTypeBadge type={submission.assessment.type as any} />
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(submission.status)}</TableCell>
                        <TableCell className="text-center">
                          {submission.totalScore !== null ? (
                            <span className="font-semibold">
                              {Number(submission.totalScore).toFixed(1)} /{' '}
                              {Number(submission.assessment.maxPoints).toFixed(0)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Not graded</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setShowGradebookModal(false) // Close gradebook modal if open
                              setSelectedSubmission(submission)
                            }}
                          >
                            {submission.status === 'GRADED' ? 'View' : 'Grade'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Gradebook Modal */}
      {showGradebookModal && selectedClass && (
        <GradebookModal
          classTitle={`${selectedClass.course.title} - ${selectedClass.classCode}`}
          gradebookStudents={gradebookStudents}
          assessments={assessments}
          onClose={() => setShowGradebookModal(false)}
          onGradeUpdate={handleGradeUpdate}
        />
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
