'use client'

import { useState, useEffect } from 'react'
import { Layers, Calendar, Lock } from 'lucide-react'
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
import { Card, CardContent } from '@/components/ui/card'

interface ModuleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ModuleFormData) => Promise<void>
  initialData?: ModuleFormData
  mode?: 'create' | 'edit'
  classId: string
}

export interface ModuleFormData {
  title: string
  description?: string
  orderIndex?: number
  isPublished?: boolean
  unlockAt?: string
  prerequisiteIds?: string[]
}

export function ModuleForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = 'create',
  classId,
}: ModuleFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ModuleFormData>(
    initialData || {
      title: '',
      description: '',
      orderIndex: 0,
      isPublished: true,
      unlockAt: '',
      prerequisiteIds: [],
    }
  )

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title) {
      setError('Module title is required')
      return
    }

    setLoading(true)

    try {
      await onSubmit(formData)
      onOpenChange(false)
      // Reset form if creating
      if (mode === 'create') {
        setFormData({
          title: '',
          description: '',
          orderIndex: 0,
          isPublished: true,
          unlockAt: '',
          prerequisiteIds: [],
        })
      }
    } catch (error) {
      console.error('Error submitting module:', error)
      setError(error instanceof Error ? error.message : 'Failed to save module')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers size={20} />
            {mode === 'create' ? 'Create Module' : 'Edit Module'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new module to organize your course content'
              : 'Update module details'}
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
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Module Title <span className="text-error">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Week 1: Introduction to Java"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What will students learn in this module?"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                Display order (0 = first)
              </p>
            </div>

            {/* Unlock Date */}
            <div className="space-y-2">
              <Label htmlFor="unlockAt" className="flex items-center gap-1">
                <Calendar size={14} />
                Unlock Date (Optional)
              </Label>
              <Input
                id="unlockAt"
                type="datetime-local"
                value={formData.unlockAt || ''}
                onChange={(e) =>
                  setFormData({ ...formData, unlockAt: e.target.value })
                }
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to unlock immediately
              </p>
            </div>
          </div>

          {/* Published Checkbox */}
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

          {/* Info Box */}
          <Card className="border-l-4 border-l-info bg-info/10">
            <CardContent className="py-3">
              <p className="text-sm">
                <strong>Tip:</strong> After creating a module, you can add pages,
                assessments, and external links to organize your content.
              </p>
            </CardContent>
          </Card>

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
                ? 'Create Module'
                : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
