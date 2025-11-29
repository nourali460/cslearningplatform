'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

type AssessmentTemplate = {
  id: string
  title: string
  description: string | null
  type: string
  defaultMaxPoints: number | string
  defaultSubmissionType: string
  isActive: boolean
}

type Props = {
  template?: AssessmentTemplate | null
  courseId?: string
  onClose: () => void
  onSave: (newTemplate?: AssessmentTemplate) => Promise<void>
}

const ASSESSMENT_TYPES = [
  { value: 'INTERACTIVE_LESSON', label: 'Interactive Lesson' },
  { value: 'LAB', label: 'Lab' },
  { value: 'EXAM', label: 'Exam' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'DISCUSSION', label: 'Discussion' },
]

const SUBMISSION_TYPES = [
  { value: 'TEXT', label: 'Text Only' },
  { value: 'FILE', label: 'File Only' },
  { value: 'BOTH', label: 'Text and Files' },
  { value: 'NONE', label: 'No Submission' },
]

export function AssessmentTemplateForm({ template, courseId, onClose, onSave }: Props) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: template?.title || '',
    description: template?.description || '',
    type: template?.type || 'LAB',
    defaultMaxPoints: template?.defaultMaxPoints ? Number(template.defaultMaxPoints) : 100,
    defaultSubmissionType: template?.defaultSubmissionType || 'BOTH',
    isActive: template?.isActive ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditMode = !!template

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (formData.defaultMaxPoints <= 0) {
      newErrors.defaultMaxPoints = 'Max points must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSaving(true)
    try {
      const url = isEditMode
        ? `/api/admin/templates/${template.id}`
        : '/api/admin/templates'

      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: courseId || null,
          title: formData.title,
          description: formData.description || null,
          type: formData.type,
          defaultMaxPoints: formData.defaultMaxPoints,
          defaultSubmissionType: formData.defaultSubmissionType,
          isActive: formData.isActive,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[AssessmentTemplateForm] Created/Updated template:', result.template)

        // Pass the newly created/updated template to parent for optimistic update
        await onSave(result.template)

        // Close modal and show success (non-blocking)
        onClose()
        setTimeout(() => {
          alert(`Template ${isEditMode ? 'updated' : 'created'} successfully!`)
        }, 100)
      } else {
        const error = await response.json()
        alert(`Failed to ${isEditMode ? 'update' : 'create'} template: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Assessment Template' : 'Create Assessment Template'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the assessment template details below.'
              : 'Create a reusable template for assessments across courses.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-error">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Basic Lab Exercise"
                className={errors.title ? 'border-error' : ''}
              />
              {errors.title && (
                <p className="text-sm text-error">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                {formData.type === 'DISCUSSION' ? 'Discussion Prompt / Question' : 'Description'}
                {formData.type === 'DISCUSSION' && <span className="text-error"> *</span>}
              </Label>
              {formData.type === 'DISCUSSION' ? (
                <RichTextEditor
                  value={formData.description || ''}
                  onChange={(value) => handleChange('description', value)}
                  placeholder="Enter the discussion question or prompt that students will respond to... Use formatting to make it clear and engaging!"
                  minHeight={200}
                  maxHeight={400}
                  showCharacterCount={false}
                />
              ) : (
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Optional description of this template..."
                />
              )}
              {formData.type === 'DISCUSSION' && (
                <p className="text-sm text-muted-foreground">
                  💡 This prompt will be displayed to students when they view the discussion. Make it clear and engaging!
                </p>
              )}
              {formData.type === 'DISCUSSION' && !formData.description && (
                <p className="text-sm text-warning">
                  A discussion prompt is highly recommended for discussion assignments
                </p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Type <span className="text-error">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ASSESSMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Default Max Points */}
            <div className="space-y-2">
              <Label htmlFor="defaultMaxPoints">
                Default Max Points <span className="text-error">*</span>
              </Label>
              <Input
                id="defaultMaxPoints"
                type="number"
                min="1"
                step="0.5"
                value={formData.defaultMaxPoints}
                onChange={(e) => handleChange('defaultMaxPoints', Number(e.target.value))}
                className={errors.defaultMaxPoints ? 'border-error' : ''}
              />
              {errors.defaultMaxPoints && (
                <p className="text-sm text-error">{errors.defaultMaxPoints}</p>
              )}
            </div>

            {/* Submission Type */}
            <div className="space-y-2">
              <Label htmlFor="submissionType">
                Default Submission Type <span className="text-error">*</span>
              </Label>
              <Select
                value={formData.defaultSubmissionType}
                onValueChange={(value) => handleChange('defaultSubmissionType', value)}
              >
                <SelectTrigger id="submissionType">
                  <SelectValue placeholder="Select submission type" />
                </SelectTrigger>
                <SelectContent>
                  {SUBMISSION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleChange('isActive', checked)}
              />
              <Label htmlFor="isActive" className="font-normal cursor-pointer">
                Active (available for use in courses)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isEditMode ? 'Update Template' : 'Create Template'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
