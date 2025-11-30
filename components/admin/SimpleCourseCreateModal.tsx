'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { BookOpen, Loader2 } from 'lucide-react'

interface SimpleCourseCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SimpleCourseCreateModal({ open, onOpenChange }: SimpleCourseCreateModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    subject: '',
    level: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code.trim(),
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          subject: formData.subject.trim() || undefined,
          level: formData.level.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create course')
      }

      // Success! Redirect to course detail page
      router.push(`/admin/courses/${data.course.id}`)
      router.refresh()

      // Close modal and reset form
      onOpenChange(false)
      setFormData({
        code: '',
        title: '',
        description: '',
        subject: '',
        level: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      code: '',
      title: '',
      description: '',
      subject: '',
      level: '',
    })
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-5 w-5 text-accent-purple" />
            Create New Course
          </DialogTitle>
          <DialogDescription>
            Add a new course to the catalog. You can add modules and templates after creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Required Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-1.5">
                Course Code <span className="text-error">*</span>
              </label>
              <Input
                id="code"
                placeholder="CS101"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Unique identifier (e.g., CS101, MATH201)
              </p>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1.5">
                Course Title <span className="text-error">*</span>
              </label>
              <Input
                id="title"
                placeholder="Introduction to Computer Science"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Full course name
              </p>
            </div>
          </div>

          {/* Optional Fields */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1.5">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="A comprehensive introduction to fundamental concepts..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional course description
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-1.5">
                Subject
              </label>
              <Input
                id="subject"
                placeholder="Computer Science"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional subject area
              </p>
            </div>

            <div>
              <label htmlFor="level" className="block text-sm font-medium mb-1.5">
                Level
              </label>
              <Input
                id="level"
                placeholder="100 or Introductory"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional course level
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
              disabled={loading || !formData.code.trim() || !formData.title.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Create Course
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
