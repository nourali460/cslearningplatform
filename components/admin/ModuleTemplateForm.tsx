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

interface ModuleTemplateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ModuleTemplateFormData) => Promise<void>
  courses: Array<{ id: string; code: string; title: string }>
  initialData?: ModuleTemplateFormData
  mode?: 'create' | 'edit'
}

export interface ModuleTemplateFormData {
  courseId: string
  title: string
  description?: string
  orderIndex?: number
  isActive?: boolean
}

export function ModuleTemplateForm({
  open,
  onOpenChange,
  onSubmit,
  courses,
  initialData,
  mode = 'create',
}: ModuleTemplateFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ModuleTemplateFormData>(
    initialData || {
      courseId: '',
      title: '',
      description: '',
      orderIndex: 0,
      isActive: true,
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
          courseId: '',
          title: '',
          description: '',
          orderIndex: 0,
          isActive: true,
        })
      }
    } catch (error) {
      console.error('Error submitting module template:', error)
      alert('Failed to save module template. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Module Template' : 'Edit Module Template'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a reusable module template for a course'
              : 'Update module template details'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course Selection (only for create mode) */}
          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="courseId">Course *</Label>
              <Select
                value={formData.courseId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, courseId: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Module Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Week 1: Introduction to Java"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this module..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
            />
          </div>

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
            <p className="text-sm text-muted-foreground">
              Lower numbers appear first (0, 1, 2, ...)
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active (will be cloned when professors adopt this course)
            </Label>
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
              {loading ? 'Saving...' : mode === 'create' ? 'Create Module' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
