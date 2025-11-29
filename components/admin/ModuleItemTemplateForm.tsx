'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ModuleItemType } from '@prisma/client'
import { AssessmentTemplateForm } from './AssessmentTemplateForm'

interface ModuleItemTemplateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ModuleItemFormData) => Promise<void>
  assessmentTemplates: Array<{ id: string; title: string; type: string; description: string | null }>
  courseId: string
  onAssessmentTemplateCreated?: () => Promise<void>
  initialData?: ModuleItemFormData
  mode?: 'create' | 'edit'
}

export interface ModuleItemFormData {
  itemType: ModuleItemType
  title: string
  assessmentTemplateId?: string
  externalUrl?: string
  pageContent?: string
  customDescription?: string
  orderIndex?: number
  isPublished?: boolean
  isRequired?: boolean
}

export function ModuleItemTemplateForm({
  open,
  onOpenChange,
  onSubmit,
  assessmentTemplates,
  courseId,
  onAssessmentTemplateCreated,
  initialData,
  mode = 'create',
}: ModuleItemTemplateFormProps) {
  const [loading, setLoading] = useState(false)
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [localTemplates, setLocalTemplates] = useState(assessmentTemplates)
  const [templateKey, setTemplateKey] = useState(0) // Force re-render key
  const [refreshing, setRefreshing] = useState(false) // Track when refreshing data
  const [formData, setFormData] = useState<ModuleItemFormData>(
    initialData || {
      itemType: 'PAGE',
      title: '',
      orderIndex: 0,
      isPublished: true,
      isRequired: true,
    }
  )

  // Update local templates when prop changes
  useEffect(() => {
    console.log('[ModuleItemTemplateForm useEffect] assessmentTemplates changed:', assessmentTemplates.length, assessmentTemplates.map(t => t.title))

    // Only update if server data has MORE items than our local state (server confirmed our optimistic add)
    // OR if it's the initial load
    setLocalTemplates(prev => {
      console.log('[ModuleItemTemplateForm useEffect] prev length:', prev.length, 'prop length:', assessmentTemplates.length)

      // If prop has more items, server has confirmed our update - accept it
      if (assessmentTemplates.length > prev.length) {
        console.log('[ModuleItemTemplateForm useEffect] Server has more items, updating')
        return assessmentTemplates
      }

      // If lengths are equal, check if content is different
      if (prev.length === assessmentTemplates.length) {
        const contentSame = prev.every((t, i) => t.id === assessmentTemplates[i]?.id)
        if (!contentSame) {
          console.log('[ModuleItemTemplateForm useEffect] Same length but different content, updating')
          return assessmentTemplates
        }
      }

      // Otherwise keep our optimistic local state
      console.log('[ModuleItemTemplateForm useEffect] Keeping local state (may have optimistic add)')
      return prev
    })

    setTemplateKey(prev => prev + 1) // Force Select to re-render
    setRefreshing(false) // Done refreshing
  }, [assessmentTemplates])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      alert('Failed to save module item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (newType: ModuleItemType) => {
    setFormData((prev) => ({
      ...prev,
      itemType: newType,
      // Clear conditional fields when type changes
      assessmentTemplateId: undefined,
      externalUrl: undefined,
      pageContent: undefined,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add Module Item' : 'Edit Module Item'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new item to this module template'
              : 'Update module item details'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Type Selector */}
          <div className="space-y-2">
            <Label>Item Type *</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={formData.itemType === 'PAGE' ? 'default' : 'outline'}
                onClick={() => handleTypeChange('PAGE')}
                className="w-full"
              >
                📄 Page
              </Button>
              <Button
                type="button"
                variant={formData.itemType === 'ASSESSMENT' ? 'default' : 'outline'}
                onClick={() => handleTypeChange('ASSESSMENT')}
                className="w-full"
              >
                📝 Assessment
              </Button>
              <Button
                type="button"
                variant={formData.itemType === 'EXTERNAL_LINK' ? 'default' : 'outline'}
                onClick={() => handleTypeChange('EXTERNAL_LINK')}
                className="w-full"
              >
                🔗 Link
              </Button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Course Welcome & Syllabus"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>

          {/* Conditional Fields Based on Type */}
          {formData.itemType === 'PAGE' && (
            <div className="space-y-2">
              <Label htmlFor="pageContent">Page Content</Label>
              <Textarea
                id="pageContent"
                placeholder="Enter page content (Markdown supported)..."
                value={formData.pageContent || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pageContent: e.target.value }))
                }
                rows={6}
              />
              <p className="text-sm text-muted-foreground">
                Supports Markdown formatting
              </p>
            </div>
          )}

          {formData.itemType === 'ASSESSMENT' && (
            <div className="space-y-2">
              <Label htmlFor="assessmentTemplateId">Link to Existing Assessment Template *</Label>
              {refreshing ? (
                <div className="flex items-center justify-center py-3 border rounded-md bg-muted/50">
                  <p className="text-sm text-muted-foreground">Loading templates...</p>
                </div>
              ) : (
                <Select
                  key={templateKey}
                  value={formData.assessmentTemplateId || ''}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, assessmentTemplateId: value }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an assessment template" />
                  </SelectTrigger>
                  <SelectContent>
                    {localTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title} ({template.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {localTemplates.length === 0
                    ? "No templates available. Create one using the button below."
                    : "Don't see your template? Create it using the button below."}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateTemplate(true)}
                disabled={loading}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Assessment Template
              </Button>

              {/* Editable Description */}
              {formData.assessmentTemplateId && (() => {
                const selectedTemplate = localTemplates.find(
                  (t) => t.id === formData.assessmentTemplateId
                )
                if (!selectedTemplate) return null

                const isDiscussion = selectedTemplate.type === 'DISCUSSION'
                const label = isDiscussion ? 'Discussion Prompt' : 'Description'
                const defaultDescription = selectedTemplate.description || ''

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
                        setFormData((prev) => ({ ...prev, customDescription: e.target.value }))
                      }
                      placeholder={
                        isDiscussion
                          ? 'Enter the discussion question or prompt...'
                          : 'Optional description for this assessment...'
                      }
                      className={isDiscussion ? 'border-purple-300 focus:border-purple-500' : ''}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.customDescription === undefined || formData.customDescription === defaultDescription
                        ? `Using template default. Edit to customize for this module.`
                        : `✏️ Customized (different from template default)`}
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
              <Label htmlFor="externalUrl">External URL *</Label>
              <Input
                id="externalUrl"
                type="url"
                placeholder="https://example.com/resource"
                value={formData.externalUrl || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, externalUrl: e.target.value }))
                }
                required
              />
            </div>
          )}

          {/* Order Index */}
          <div className="space-y-2">
            <Label htmlFor="orderIndex">Order Index</Label>
            <Input
              id="orderIndex"
              type="number"
              min="0"
              value={formData.orderIndex}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  orderIndex: parseInt(e.target.value) || 0,
                }))
              }
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isPublished: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300"
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
                  setFormData((prev) => ({ ...prev, isRequired: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300"
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
              {loading ? 'Saving...' : mode === 'create' ? 'Add Item' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Create Assessment Template Modal */}
      {showCreateTemplate && (
        <AssessmentTemplateForm
          courseId={courseId}
          onClose={() => setShowCreateTemplate(false)}
          onSave={async (newTemplate) => {
            console.log('[ModuleItemTemplateForm onSave] START - Received template:', newTemplate?.id, newTemplate?.title)

            // Optimistically add to local state IMMEDIATELY (if not duplicate)
            if (newTemplate) {
              console.log('[ModuleItemTemplateForm onSave] Before setState, localTemplates length:', localTemplates.length)

              setLocalTemplates(prev => {
                console.log('[ModuleItemTemplateForm onSave] Inside setState, prev length:', prev.length)

                // Check if already exists to prevent duplicates
                const exists = prev.some(t => t.id === newTemplate.id)
                if (exists) {
                  console.log('[ModuleItemTemplateForm onSave] Template', newTemplate.id, 'already exists, skipping')
                  return prev
                }

                const newList = [...prev, newTemplate]
                console.log('[ModuleItemTemplateForm onSave] Creating new list, new length:', newList.length)
                return newList
              })

              setTemplateKey(prev => {
                console.log('[ModuleItemTemplateForm onSave] Updating key from', prev, 'to', prev + 1)
                return prev + 1
              })
              setRefreshing(false)

              console.log('[ModuleItemTemplateForm onSave] After optimistic update')
            }

            // Still refresh from server for consistency
            if (onAssessmentTemplateCreated) {
              console.log('[ModuleItemTemplateForm onSave] Calling server refresh')
              await onAssessmentTemplateCreated()
              console.log('[ModuleItemTemplateForm onSave] Server refresh completed')
            }

            console.log('[ModuleItemTemplateForm onSave] END')
          }}
        />
      )}
    </Dialog>
  )
}
