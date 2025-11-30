'use client'

import { useState } from 'react'
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

interface ModuleItemTemplateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ModuleItemFormData) => Promise<void>
  assessmentTemplates: Array<{ id: string; title: string; type: string; description: string | null }>
  courseId: string
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
  initialData,
  mode = 'create',
}: ModuleItemTemplateFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ModuleItemFormData>(
    initialData || {
      itemType: 'PAGE',
      title: '',
      orderIndex: 0,
      isPublished: true,
      isRequired: true,
    }
  )

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
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-md bg-muted/30">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                📄 PAGE content has moved!
              </p>
              <p className="text-xs text-muted-foreground text-center max-w-md mb-4">
                To add page content to modules, use the <strong>ASSESSMENT</strong> type and link to a PAGE template. Create PAGE templates in the <strong>📄 Page Templates</strong> section.
              </p>
              <p className="text-xs text-info">
                💡 This ensures consistent page content across all classes
              </p>
            </div>
          )}

          {formData.itemType === 'ASSESSMENT' && (
            <div className="space-y-2">
              <Label htmlFor="assessmentTemplateId">Link to Existing Assessment Template *</Label>
              {assessmentTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-md bg-muted/30">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    No assessment templates available
                  </p>
                  <p className="text-xs text-muted-foreground text-center max-w-sm">
                    Create assessment templates in the <strong>Assessment Templates</strong> tab first, then return here to add them to modules.
                  </p>
                </div>
              ) : (
                <Select
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
                    {assessmentTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title} ({template.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Editable Description */}
              {formData.assessmentTemplateId && (() => {
                const selectedTemplate = assessmentTemplates.find(
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
    </Dialog>
  )
}
