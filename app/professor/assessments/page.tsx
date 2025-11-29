'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Copy, Eye, FileText, BookOpen, Loader2 } from 'lucide-react'
import { AssessmentTypeIcon, AssessmentTypeBadge } from '@/components/student/AssessmentTypeIcon'
import { CreateAssessmentModal } from '@/components/professor/CreateAssessmentModal'
import { AssessmentTemplateLibrary } from '@/components/professor/AssessmentTemplateLibrary'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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
  _count?: {
    submissions: number
    moduleItems: number
  }
  moduleItems?: Array<{
    id: string
    module: {
      id: string
      title: string
      isPublished: boolean
    }
  }>
}

type Class = {
  id: string
  classCode: string
  title: string
  course: {
    id: string
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
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false)

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
        await fetchAssessments()
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
        await fetchAssessments()
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent-orange" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Assessments</h1>
        <p className="text-foreground-secondary">Create and manage assignments for your classes</p>
      </div>

      {/* Class Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Class</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a class" />
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTemplateLibrary(true)}
                disabled={!selectedClassId}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Add from Library
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!selectedClassId}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Custom
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-accent-purple">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground-secondary">
                  Total Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{totalAssessments}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent-orange">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground-secondary">
                  Pending Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{totalPending}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-success">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground-secondary">
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{avgCompletion.toFixed(0)}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Assessments by Type */}
          {assessments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText size={64} className="text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Assessments Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first assessment for {selectedClass.course.title}
                </p>
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Assessment
                </Button>
              </CardContent>
            </Card>
          ) : (
            Object.entries(assessmentsByType).map(([type, typeAssessments]) => (
              <Card key={type} className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AssessmentTypeIcon type={type as any} size={24} />
                    <span>{type.replace('_', ' ')}</span>
                    <Badge>{typeAssessments.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-center">Points</TableHead>
                        <TableHead className="text-center">Submissions</TableHead>
                        <TableHead className="text-center">Graded</TableHead>
                        <TableHead className="text-center">Pending</TableHead>
                        <TableHead className="text-center">Avg Score</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {typeAssessments.map((assessment) => (
                        <TableRow key={assessment.id}>
                          <TableCell>
                            <div className="font-semibold">{assessment.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              {assessment.rubric && (
                                <span className="text-xs text-foreground-secondary">
                                  Has Rubric
                                </span>
                              )}
                              {assessment._count?.moduleItems > 0 ? (
                                <Badge variant="default" className="text-xs">
                                  📚 In {assessment._count.moduleItems} module{assessment._count.moduleItems > 1 ? 's' : ''}
                                </Badge>
                              ) : (
                                <Badge variant="warning" className="text-xs">
                                  ⚠️ Not in any module
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {assessment.dueAt ? (
                              <span className="text-sm">
                                {new Date(assessment.dueAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">No due date</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="info">{assessment.maxPoints}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{assessment.stats.totalSubmissions}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="success">{assessment.stats.gradedSubmissions}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="warning">{assessment.stats.pendingSubmissions}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {assessment.stats.averageScore !== null
                              ? `${assessment.stats.averageScore.toFixed(1)}%`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="outline" size="sm" title="View Submissions">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Edit"
                                onClick={() => handleEdit(assessment)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Duplicate"
                                onClick={() => handleDuplicate(assessment.id)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Delete"
                                onClick={() => handleDelete(assessment.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
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

      {/* Template Library Modal */}
      {showTemplateLibrary && selectedClassId && selectedClass && (
        <AssessmentTemplateLibrary
          classId={selectedClassId}
          courseId={selectedClass.course.id}
          className={`${selectedClass.classCode} - ${selectedClass.course.title}`}
          onClose={() => setShowTemplateLibrary(false)}
          onAssessmentAdded={async () => {
            setShowTemplateLibrary(false)
            await fetchAssessments()
          }}
        />
      )}
    </div>
  )
}
