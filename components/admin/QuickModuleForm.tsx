'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Layers, Loader2 } from 'lucide-react'

interface QuickModuleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  onSuccess?: () => void
}

export function QuickModuleForm({ open, onOpenChange, courseId, onSuccess }: QuickModuleFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isActive: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/admin/module-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          isActive: formData.isActive,
          orderIndex: 0, // Will be auto-set to end of list by backend
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create module template')
      }

      // Success!
      onSuccess?.()

      // Close modal and reset form
      onOpenChange(false)
      setFormData({
        title: '',
        description: '',
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
            <Layers className="h-5 w-5 text-accent-orange" />
            Create Module Template
          </DialogTitle>
          <DialogDescription>
            Add a new module to this course. You can add items (pages, assessments, links) after creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Module Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1.5">
              Module Title <span className="text-error">*</span>
            </label>
            <Input
              id="title"
              placeholder="Week 1: Introduction to Programming"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              Give this module a clear, descriptive title
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1.5">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Learn the fundamental concepts of programming..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional description to help students understand this module
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
                Active modules will be cloned when professors adopt this course
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
                  <Layers className="h-4 w-4 mr-2" />
                  Create Module
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
