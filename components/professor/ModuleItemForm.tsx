'use client'

import { useState, useEffect } from 'react'
import { FileText, ClipboardList, Link2, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { ModuleItemType } from '@prisma/client'
import { CreateAssessmentModal } from './CreateAssessmentModal'

interface ModuleItemFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ModuleItemFormData) => Promise<void>
  assessments: Array<{ id: string; title: string; type: string; description: string | null }>
  classId: string
  currentModuleId?: string // ✅ NEW: Current module (for edit mode)
  onAssessmentCreated?: () => Promise<void>
  initialData?: ModuleItemFormData
  mode?: 'create' | 'edit'
}

export interface ModuleItemFormData {
  itemType: ModuleItemType
  title: string
  assessmentId?: string
  externalUrl?: string
  pageContent?: string
  customDescription?: string
  orderIndex?: number
  isPublished?: boolean
  isRequired?: boolean
  newModuleId?: string // ✅ NEW: For moving item to different module
}

export function ModuleItemForm({
  open,
  onOpenChange,
  onSubmit,
  assessments,
  classId,
  currentModuleId, // ✅ NEW
  onAssessmentCreated,
  initialData,
  mode = 'create',
}: ModuleItemFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateAssessment, setShowCreateAssessment] = useState(false)
  const [showEditAssessment, setShowEditAssessment] = useState(false) // ✅ NEW: For inline editing
  const [localAssessments, setLocalAssessments] = useState(assessments)
  const [assessmentKey, setAssessmentKey] = useState(0) // Force re-render key
  const [refreshing, setRefreshing] = useState(false) // Track when refreshing data
  const [modules, setModules] = useState<any[]>([]) // ✅ NEW: Available modules
  const [formData, setFormData] = useState<ModuleItemFormData>(
    initialData || {
      itemType: 'PAGE',
      title: '',
      orderIndex: 0,
      isPublished: true,
      isRequired: true,
    }
  )

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  // ✅ NEW: Fetch modules for move functionality (only in edit mode)
  useEffect(() => {
    if (mode === 'edit' && classId) {
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
    }
  }, [mode, classId])

  // Update local assessments when prop changes
  useEffect(() => {
    console.log('[ModuleItemForm useEffect] assessments changed:', assessments.length, assessments.map(a => a.title))

    // Only update if server data has MORE items than our local state (server confirmed our optimistic add)
    // OR if it's the initial load
    setLocalAssessments(prev => {
      console.log('[ModuleItemForm useEffect] prev length:', prev.length, 'prop length:', assessments.length)

      // If prop has more items, server has confirmed our update - accept it
      if (assessments.length > prev.length) {
        console.log('[ModuleItemForm useEffect] Server has more items, updating')
        return assessments
      }

      // If lengths are equal, check if content is different
      if (prev.length === assessments.length) {
        const contentSame = prev.every((a, i) => a.id === assessments[i]?.id)
        if (!contentSame) {
          console.log('[ModuleItemForm useEffect] Same length but different content, updating')
          return assessments
        }
      }

      // Otherwise keep our optimistic local state
      console.log('[ModuleItemForm useEffect] Keeping local state (may have optimistic add)')
      return prev
    })

    setAssessmentKey(prev => prev + 1) // Force Select to re-render
    setRefreshing(false) // Done refreshing
  }, [assessments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title) {
      setError('Item title is required')
      return
    }

    // Type-specific validation
    if (formData.itemType === 'ASSESSMENT' && !formData.assessmentId) {
      setError('Please select an assessment')
      return
    }

    if (formData.itemType === 'EXTERNAL_LINK' && !formData.externalUrl) {
      setError('Please enter a URL')
      return
    }

    setLoading(true)

    try {
      await onSubmit(formData)
      onOpenChange(false)
      // Reset form if creating
      if (mode === 'create') {
        setFormData({
          itemType: 'PAGE',
          title: '',
          orderIndex: 0,
          isPublished: true,
          isRequired: true,
        })
      }
    } catch (error) {
      console.error('Error submitting module item:', error)
      setError(
        error instanceof Error ? error.message : 'Failed to save module item'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (newType: ModuleItemType) => {
    setFormData({
      ...formData,
      itemType: newType,
      // Clear conditional fields when type changes
      assessmentId: undefined,
      externalUrl: undefined,
      pageContent: undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add Module Item' : 'Edit Module Item'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add content to this module'
              : 'Update module item details'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Card className="border-l-4 border-l-error bg-error/10">
            <CardContent className="py-3">
              <p className="text-sm text-error">{error}</p>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Type Selector */}
          <div className="space-y-2">
            <Label>Item Type *</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={formData.itemType === 'PAGE' ? 'default' : 'outline'}
                onClick={() => handleTypeChange('PAGE')}
                className="w-full flex items-center gap-2"
                disabled={loading}
              >
                <FileText size={16} />
                Page
              </Button>
              <Button
                type="button"
                variant={
                  formData.itemType === 'ASSESSMENT' ? 'default' : 'outline'
                }
                onClick={() => handleTypeChange('ASSESSMENT')}
                className="w-full flex items-center gap-2"
                disabled={loading}
              >
                <ClipboardList size={16} />
                Assessment
              </Button>
              <Button
                type="button"
                variant={
                  formData.itemType === 'EXTERNAL_LINK' ? 'default' : 'outline'
                }
                onClick={() => handleTypeChange('EXTERNAL_LINK')}
                className="w-full flex items-center gap-2"
                disabled={loading}
              >
                <Link2 size={16} />
                Link
              </Button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-error">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Course Welcome & Syllabus"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          {/* ✅ NEW: Module Selector (only in edit mode) */}
          {mode === 'edit' && modules.length > 0 && currentModuleId && (
            <div className="space-y-2">
              <Label htmlFor="moduleId">Module Location</Label>
              <Select
                value={formData.newModuleId || currentModuleId}
                onValueChange={(value) =>
                  setFormData({ ...formData, newModuleId: value })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module: any) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                      {module.id === currentModuleId && ' (current)'}
                      {!module.isPublished && ' (draft)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.newModuleId && formData.newModuleId !== currentModuleId && (
                <p className="text-xs text-warning flex items-center gap-1">
                  ⚠️ This item will be moved to a different module. Students will see it in the new location.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Change which module this item appears in
              </p>
            </div>
          )}

          {/* Conditional Fields Based on Type */}
          {formData.itemType === 'PAGE' && (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-md bg-muted/30">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                📄 PAGE content has moved!
              </p>
              <p className="text-xs text-muted-foreground text-center max-w-md mb-4">
                To add page content to modules, first adopt a PAGE template from the Assessment Library, then use the <strong>ASSESSMENT</strong> type to link it here.
              </p>
              <p className="text-xs text-info">
                💡 This ensures page content stays consistent and can be updated across all your classes
              </p>
            </div>
          )}

          {formData.itemType === 'ASSESSMENT' && (
            <div className="space-y-2">
              <Label htmlFor="assessmentId">
                Link to Existing Assessment <span className="text-error">*</span>
              </Label>
              {refreshing ? (
                <div className="flex items-center justify-center py-3 border rounded-md bg-muted/50">
                  <p className="text-sm text-muted-foreground">Loading assessments...</p>
                </div>
              ) : (
                <Select
                  key={assessmentKey}
                  value={formData.assessmentId || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, assessmentId: value })
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an assessment" />
                  </SelectTrigger>
                  <SelectContent>
                    {localAssessments.map((assessment) => (
                      <SelectItem key={assessment.id} value={assessment.id}>
                        {assessment.title} ({assessment.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {localAssessments.length === 0
                    ? "No assessments available. Create one using the button below."
                    : "Don't see your assessment? Create it using the button below."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateAssessment(true)}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New
                </Button>
                {/* ✅ NEW: Edit Assessment Details Button */}
                {formData.assessmentId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditAssessment(true)}
                    disabled={loading}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Edit Details
                  </Button>
                )}
              </div>

              {/* Editable Description */}
              {formData.assessmentId && (() => {
                const selectedAssessment = localAssessments.find(
                  (a) => a.id === formData.assessmentId
                )
                if (!selectedAssessment) return null

                const isDiscussion = selectedAssessment.type === 'DISCUSSION'
                const defaultDescription = selectedAssessment.description || ''

                return (
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="customDescription">
                      {isDiscussion ? '💬 Discussion Prompt' : '📝 Description'}
                      {isDiscussion && <span className="text-error"> *</span>}
                    </Label>
                    <Textarea
                      id="customDescription"
                      rows={isDiscussion ? 6 : 4}
                      value={formData.customDescription ?? defaultDescription}
                      onChange={(e) =>
                        setFormData({ ...formData, customDescription: e.target.value })
                      }
                      placeholder={
                        isDiscussion
                          ? 'Enter the discussion question or prompt...'
                          : 'Optional description for this assessment...'
                      }
                      className={isDiscussion ? 'border-purple-300 focus:border-purple-500' : ''}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.customDescription === undefined || formData.customDescription === defaultDescription
                        ? `Using assessment default. Edit to customize for this module.`
                        : `✏️ Customized (different from assessment default)`}
                    </p>
                    {isDiscussion && (
                      <p className="text-sm text-purple-600">
                        💡 This prompt will be shown to students when they start the discussion
                      </p>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {formData.itemType === 'EXTERNAL_LINK' && (
            <div className="space-y-2">
              <Label htmlFor="externalUrl">
                External URL <span className="text-error">*</span>
              </Label>
              <Input
                id="externalUrl"
                type="url"
                placeholder="https://example.com/resource"
                value={formData.externalUrl || ''}
                onChange={(e) =>
                  setFormData({ ...formData, externalUrl: e.target.value })
                }
                disabled={loading}
              />
            </div>
          )}

          {/* Order Index */}
          <div className="space-y-2">
            <Label htmlFor="orderIndex">Order</Label>
            <Input
              id="orderIndex"
              type="number"
              min="0"
              value={formData.orderIndex}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  orderIndex: parseInt(e.target.value) || 0,
                })
              }
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Display order within module (0 = first)
            </p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) =>
                  setFormData({ ...formData, isPublished: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
                disabled={loading}
              />
              <Label htmlFor="isPublished" className="cursor-pointer">
                Published (visible to students)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRequired"
                checked={formData.isRequired}
                onChange={(e) =>
                  setFormData({ ...formData, isRequired: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
                disabled={loading}
              />
              <Label htmlFor="isRequired" className="cursor-pointer">
                Required for module completion
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? 'Saving...'
                : mode === 'create'
                ? 'Add Item'
                : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Create Assessment Modal */}
      {showCreateAssessment && classId && (
        <CreateAssessmentModal
          classId={classId}
          onClose={() => setShowCreateAssessment(false)}
          onSuccess={async (newAssessment) => {
            console.log('[ModuleItemForm] Received new assessment:', newAssessment)

            // Optimistically add to local state IMMEDIATELY (if not duplicate)
            if (newAssessment) {
              setLocalAssessments(prev => {
                // Check if already exists to prevent duplicates
                const exists = prev.some(a => a.id === newAssessment.id)
                if (exists) {
                  console.log('[ModuleItemForm] Assessment already exists, skipping')
                  return prev
                }
                console.log('[ModuleItemForm] Adding to local assessments, current count:', prev.length)
                return [...prev, newAssessment]
              })
              setAssessmentKey(prev => prev + 1)
              setRefreshing(false)
            }

            // Still refresh from server for consistency
            if (onAssessmentCreated) {
              console.log('[ModuleItemForm] Calling server refresh')
              await onAssessmentCreated()
            }
          }}
        />
      )}

      {/* ✅ NEW: Edit Assessment Modal */}
      {showEditAssessment && formData.assessmentId && classId && (() => {
        const selectedAssessment = localAssessments.find(
          (a) => a.id === formData.assessmentId
        )
        if (!selectedAssessment) return null

        return (
          <CreateAssessmentModal
            classId={classId}
            assessment={selectedAssessment} // Pass assessment for edit mode
            onClose={() => setShowEditAssessment(false)}
            onSuccess={async (updatedAssessment) => {
              console.log('[ModuleItemForm] Assessment updated:', updatedAssessment)

              // Update local state with edited assessment
              if (updatedAssessment) {
                setLocalAssessments(prev =>
                  prev.map(a => a.id === updatedAssessment.id ? updatedAssessment : a)
                )
                setAssessmentKey(prev => prev + 1)
              }

              // Refresh from server
              if (onAssessmentCreated) {
                await onAssessmentCreated()
              }
            }}
          />
        )
      })()}
    </Dialog>
  )
}
