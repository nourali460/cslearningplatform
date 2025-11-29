'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2, GripVertical, Edit } from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type AssessmentTemplate = {
  id: string
  courseId: string
  title: string
  description: string | null
  type: string
  defaultMaxPoints: number | string
  defaultSubmissionType: string
  orderIndex: number
  isActive: boolean
}

export default function CourseTemplatesPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<AssessmentTemplate | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'LAB',
    defaultMaxPoints: '100',
    defaultSubmissionType: 'BOTH',
  })

  useEffect(() => {
    fetchTemplates()
  }, [courseId])

  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        title: editingTemplate.title,
        description: editingTemplate.description || '',
        type: editingTemplate.type,
        defaultMaxPoints: String(editingTemplate.defaultMaxPoints),
        defaultSubmissionType: editingTemplate.defaultSubmissionType,
      })
      setShowCreateForm(true)
    }
  }, [editingTemplate])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/templates?courseId=${courseId}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      } else {
        const errorData = await response.json()
        alert(`Failed to load templates: ${errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      alert(`Failed to load templates: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a template title')
      return
    }

    setSaving(true)
    try {
      const url = editingTemplate
        ? `/api/admin/templates/${editingTemplate.id}`
        : '/api/admin/templates'
      const method = editingTemplate ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          ...formData,
          defaultMaxPoints: parseFloat(formData.defaultMaxPoints),
          orderIndex: editingTemplate ? editingTemplate.orderIndex : templates.length,
        }),
      })

      if (response.ok) {
        await fetchTemplates()
        resetForm()
      } else {
        const errorData = await response.json()
        alert(`Failed to save template: ${errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      alert('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchTemplates()
      } else {
        const errorData = await response.json()
        alert(`Failed to delete template: ${errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      alert('Failed to delete template')
    } finally {
      setSaving(false)
    }
  }

  const handleEditTemplate = (template: AssessmentTemplate) => {
    setEditingTemplate(template)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'LAB',
      defaultMaxPoints: '100',
      defaultSubmissionType: 'BOTH',
    })
    setShowCreateForm(false)
    setEditingTemplate(null)
  }

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back Button */}
      <BackButton href="/admin/courses" label="Back to Courses" className="mb-4" />

      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Course Assessment Templates</CardTitle>
          <CardDescription>Manage assessment templates for this course</CardDescription>
        </CardHeader>
      </Card>

      {/* Header with Create Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">
          Templates ({templates.length})
        </h2>
        <Button
          onClick={() => {
            resetForm()
            setShowCreateForm(!showCreateForm)
          }}
          disabled={saving}
        >
          <Plus className="h-4 w-4 mr-2" />
          {showCreateForm ? 'Cancel' : 'Create Template'}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              {editingTemplate ? 'Edit' : 'Create'} Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-error">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Lab 1: Introduction to Java"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the assessment"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">
                  Type <span className="text-error">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTERACTIVE_LESSON">Interactive Lesson</SelectItem>
                    <SelectItem value="LAB">Lab</SelectItem>
                    <SelectItem value="EXAM">Exam</SelectItem>
                    <SelectItem value="QUIZ">Quiz</SelectItem>
                    <SelectItem value="DISCUSSION">Discussion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">
                  Default Points <span className="text-error">*</span>
                </Label>
                <Input
                  id="points"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.defaultMaxPoints}
                  onChange={(e) => setFormData({ ...formData, defaultMaxPoints: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="submission">
                  Submission Type <span className="text-error">*</span>
                </Label>
                <Select
                  value={formData.defaultSubmissionType}
                  onValueChange={(value) => setFormData({ ...formData, defaultSubmissionType: value })}
                >
                  <SelectTrigger id="submission">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">Text Only</SelectItem>
                    <SelectItem value="FILE">File Only</SelectItem>
                    <SelectItem value="BOTH">Text & File</SelectItem>
                    <SelectItem value="NONE">No Submission</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveTemplate} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingTemplate ? 'Update' : 'Create'
                )}
              </Button>
              <Button variant="outline" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <Card>
        <CardContent className="p-6">
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No templates for this course yet. Click "Create Template" to add one.
              </p>
              <Button
                onClick={() => {
                  resetForm()
                  setShowCreateForm(true)
                }}
                disabled={saving}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-background hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{template.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="purple">{formatType(template.type)}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {template.defaultMaxPoints} pts • {template.defaultSubmissionType}
                        </span>
                      </div>
                      {template.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                      disabled={saving}
                      title="Edit"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      disabled={saving}
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
