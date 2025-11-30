'use client'

import { useState, useEffect } from 'react'
import { FileText, AlertTriangle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  classId: string
  assessment?: any // For editing existing assessment
  onClose: () => void
  onSuccess: (newAssessment?: any) => Promise<void>
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
    isPublished: assessment?.isPublished !== undefined ? assessment.isPublished : true,
    includeInGradebook: assessment?.includeInGradebook !== undefined ? assessment.includeInGradebook : ((assessment?.type || 'LAB') !== 'PAGE'), // Default false for PAGE, true for others
    moduleId: '', // ✅ NEW: Required module selection
  })

  const [rubrics, setRubrics] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const isEditing = !!assessment

  useEffect(() => {
    // Fetch available rubrics for this class
    // For now, we'll skip this as rubrics management will be added later
    setRubrics([])

    // Fetch available modules for this class
    const fetchModules = async () => {
      try {
        const response = await fetch(`/api/professor/classes/${classId}/modules`)
        if (response.ok) {
          const data = await response.json()
          setModules(data.modules || [])
        }
      } catch (error) {
        console.error('Error fetching modules:', error)
      }
    }
    fetchModules()
  }, [classId])

  // Auto-update includeInGradebook when type changes
  useEffect(() => {
    if (formData.type === 'PAGE' && formData.includeInGradebook) {
      // Auto-uncheck when switching to PAGE type
      setFormData(prev => ({ ...prev, includeInGradebook: false }))
    } else if (formData.type !== 'PAGE' && !formData.includeInGradebook && !assessment) {
      // Auto-check when switching away from PAGE type (only for new assessments)
      setFormData(prev => ({ ...prev, includeInGradebook: true }))
    }
  }, [formData.type, assessment])

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
        const result = await response.json()
        console.log('[CreateAssessmentModal] Created/Updated assessment:', result.assessment)

        // ✅ NEW: If creating (not editing), automatically add to selected module
        if (!isEditing && formData.moduleId) {
          try {
            const moduleItemResponse = await fetch(
              `/api/professor/classes/${classId}/modules/${formData.moduleId}/items`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  itemType: 'ASSESSMENT',
                  title: result.assessment.title,
                  assessmentId: result.assessment.id,
                  customDescription: result.assessment.description || '',
                  orderIndex: 0,
                  isPublished: result.assessment.isPublished,
                  isRequired: true,
                }),
              }
            )

            if (!moduleItemResponse.ok) {
              const error = await moduleItemResponse.json()
              console.error('Failed to add assessment to module:', error)
              alert(
                `Assessment created but failed to add to module: ${error.error}. You can manually add it from the Modules page.`
              )
            } else {
              console.log('[CreateAssessmentModal] Assessment successfully added to module')
            }
          } catch (error) {
            console.error('Error adding assessment to module:', error)
            alert('Assessment created but failed to add to module. You can manually add it from the Modules page.')
          }
        }

        // Pass the newly created/updated assessment to parent for optimistic update
        await onSuccess(result.assessment)

        // Close modal
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
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5" />
            {isEditing ? 'Edit Assessment' : 'Create New Assessment'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the assessment details below' : 'Fill in the details to create a new assessment'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Title <span className="text-error">*</span>
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Lab 1: Binary Search Implementation"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Description</label>
              <Textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the assessment objectives and requirements..."
              />
            </div>

            {/* ✅ NEW: Module Selection (only when creating) */}
            {!isEditing && (
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Module <span className="text-error">*</span>
                </label>
                {modules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-md bg-muted/30">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      No modules available
                    </p>
                    <p className="text-xs text-muted-foreground text-center max-w-sm">
                      Create a module first before adding assessments. All assessments must be in a module for students to see them.
                    </p>
                  </div>
                ) : (
                  <>
                    <Select
                      value={formData.moduleId}
                      onValueChange={(val) => setFormData({ ...formData, moduleId: val })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a module for this assessment" />
                      </SelectTrigger>
                      <SelectContent>
                        {modules.map((module: any) => (
                          <SelectItem key={module.id} value={module.id}>
                            {module.title}
                            {!module.isPublished && ' (Draft)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Students can only see assessments that are in published modules
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Assessment Type and Submission Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assessment Type */}
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Assessment Type <span className="text-error">*</span>
                </label>
                <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTERACTIVE_LESSON">📖 Interactive Lesson</SelectItem>
                    <SelectItem value="LAB">🧪 Lab</SelectItem>
                    <SelectItem value="EXAM">📝 Exam</SelectItem>
                    <SelectItem value="QUIZ">❓ Quiz</SelectItem>
                    <SelectItem value="DISCUSSION">💬 Discussion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submission Type */}
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Submission Type <span className="text-error">*</span>
                </label>
                <Select value={formData.submissionType} onValueChange={(val) => setFormData({ ...formData, submissionType: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOTH">📄 Text & Files</SelectItem>
                    <SelectItem value="TEXT">📝 Text Only</SelectItem>
                    <SelectItem value="FILE">📁 Files Only</SelectItem>
                    <SelectItem value="NONE">❌ No Submission Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Max Points and Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Max Points */}
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Max Points <span className="text-error">*</span>
                </label>
                <Input
                  type="number"
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
              <div>
                <label className="text-sm font-semibold mb-2 block">Due Date & Time</label>
                <Input
                  type="datetime-local"
                  value={formData.dueAt}
                  onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                />
              </div>
            </div>

            {/* Multiple Attempts */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="allowMultipleAttempts"
                checked={formData.allowMultipleAttempts}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    allowMultipleAttempts: checked === true,
                  })
                }
              />
              <label
                htmlFor="allowMultipleAttempts"
                className="text-sm font-medium cursor-pointer"
              >
                Allow Multiple Attempts
              </label>
            </div>

            {/* Max Attempts */}
            {formData.allowMultipleAttempts && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Max Attempts</label>
                  <Input
                    type="number"
                    value={formData.maxAttempts}
                    onChange={(e) =>
                      setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 1 })
                    }
                    min="1"
                  />
                </div>
              </div>
            )}

            {/* Order Index */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Order Index
                  <span className="text-muted-foreground text-xs ml-2">(for sorting)</span>
                </label>
                <Input
                  type="number"
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
            </div>

            {/* Rubric (if available) */}
            {rubrics.length > 0 && (
              <div>
                <label className="text-sm font-semibold mb-2 block">Grading Rubric (Optional)</label>
                <Select value={formData.rubricId} onValueChange={(val) => setFormData({ ...formData, rubricId: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="No Rubric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Rubric</SelectItem>
                    {rubrics.map((rubric) => (
                      <SelectItem key={rubric.id} value={rubric.id}>
                        {rubric.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Publish Status */}
            <div className="border-t pt-4 mt-2">
              <div className="flex items-start gap-3 p-3 bg-background-secondary/50 rounded-lg">
                <Checkbox
                  id="isPublished"
                  checked={formData.isPublished}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      isPublished: checked === true,
                    })
                  }
                />
                <div className="flex-1">
                  <label
                    htmlFor="isPublished"
                    className="text-sm font-medium cursor-pointer block mb-1"
                  >
                    Publish Assessment
                  </label>
                  <p className="text-xs text-foreground-secondary">
                    {formData.isPublished
                      ? isEditing
                        ? '✓ Students can see this assessment in published modules'
                        : '✓ Students will see this assessment in the selected module'
                      : '⚠️ Assessment will remain hidden from students even in modules'}
                  </p>
                </div>
              </div>

              {/* Include in Gradebook */}
              <div className="flex items-start gap-3 p-3 bg-background-secondary/50 rounded-lg mt-3">
                <Checkbox
                  id="includeInGradebook"
                  checked={formData.includeInGradebook}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      includeInGradebook: checked === true,
                    })
                  }
                />
                <div className="flex-1">
                  <label
                    htmlFor="includeInGradebook"
                    className="text-sm font-medium cursor-pointer block mb-1"
                  >
                    Include in Gradebook
                  </label>
                  <p className="text-xs text-foreground-secondary">
                    {formData.includeInGradebook
                      ? '✓ This assessment will appear as a gradebook column'
                      : formData.type === 'PAGE'
                      ? '⚠️ PAGE content is typically informational and not graded'
                      : '⚠️ This assessment will not contribute to student grades'}
                  </p>
                </div>
              </div>
            </div>
              </div>

          {isEditing && assessment._count?.submissions > 0 && (
            <Card className="border-l-4 border-l-warning bg-warning/10">
              <CardContent className="flex items-center gap-2 py-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div className="text-sm">
                  <strong>Warning:</strong> This assessment has {assessment._count.submissions}{' '}
                  submission(s). Changes may affect existing submissions.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{isEditing ? 'Update Assessment' : 'Create Assessment'}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
