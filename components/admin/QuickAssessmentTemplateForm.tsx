'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Award, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface QuickAssessmentTemplateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  onSuccess?: () => void
}

const ASSESSMENT_TYPES = [
  { value: 'INTERACTIVE_LESSON', label: 'Interactive Lesson', color: 'purple' },
  { value: 'LAB', label: 'Lab', color: 'info' },
  { value: 'EXAM', label: 'Exam', color: 'error' },
  { value: 'QUIZ', label: 'Quiz', color: 'warning' },
  { value: 'DISCUSSION', label: 'Discussion', color: 'success' },
] as const

const SUBMISSION_TYPES = [
  { value: 'TEXT', label: 'Text Only' },
  { value: 'FILE', label: 'File Only' },
  { value: 'BOTH', label: 'Text & File' },
  { value: 'NONE', label: 'No Submission' },
] as const

export function QuickAssessmentTemplateForm({
  open,
  onOpenChange,
  courseId,
  onSuccess,
}: QuickAssessmentTemplateFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'LAB' as const,
    defaultMaxPoints: '100',
    defaultSubmissionType: 'BOTH' as const,
    isActive: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          type: formData.type,
          defaultMaxPoints: parseFloat(formData.defaultMaxPoints),
          defaultSubmissionType: formData.defaultSubmissionType,
          isActive: formData.isActive,
          orderIndex: 0,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create assessment template')
      }

      // Success!
      onSuccess?.()

      // Close modal and reset form
      onOpenChange(false)
      setFormData({
        title: '',
        description: '',
        type: 'LAB',
        defaultMaxPoints: '100',
        defaultSubmissionType: 'BOTH',
        isActive: true,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      title: '',
      description: '',
      type: 'LAB',
      defaultMaxPoints: '100',
      defaultSubmissionType: 'BOTH',
      isActive: true,
    })
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-info" />
            Create Assessment Template
          </DialogTitle>
          <DialogDescription>
            Create a reusable assessment template for this course.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1.5">
              Title <span className="text-error">*</span>
            </label>
            <Input
              id="title"
              placeholder="Lab 1: Variables and Data Types"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              autoFocus
            />
          </div>

          {/* Type and Points Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-1.5">
                Type <span className="text-error">*</span>
              </label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSESSMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Badge variant={type.color as any} className="text-xs">
                          {type.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="points" className="block text-sm font-medium mb-1.5">
                Max Points <span className="text-error">*</span>
              </label>
              <Input
                id="points"
                type="number"
                min="1"
                step="0.5"
                placeholder="100"
                value={formData.defaultMaxPoints}
                onChange={(e) =>
                  setFormData({ ...formData, defaultMaxPoints: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Submission Type */}
          <div>
            <label htmlFor="submission" className="block text-sm font-medium mb-1.5">
              Submission Type <span className="text-error">*</span>
            </label>
            <Select
              value={formData.defaultSubmissionType}
              onValueChange={(value: any) =>
                setFormData({ ...formData, defaultSubmissionType: value })
              }
            >
              <SelectTrigger id="submission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBMISSION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              How students will submit this assessment
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1.5">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Students will practice creating variables and using different data types..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional description for this assessment
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-start gap-3 p-3 bg-background-secondary/30 rounded-lg border border-border">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked === true })
              }
            />
            <div className="flex-1">
              <label
                htmlFor="isActive"
                className="text-sm font-medium cursor-pointer block"
              >
                Active
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Active templates are available when professors adopt this course
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-3">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Award className="h-4 w-4 mr-2" />
                  Create Template
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
