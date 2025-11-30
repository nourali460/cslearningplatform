'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Loader2, MessageSquare, Shield, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { ClassSelector } from '@/components/shared/ClassSelector'

interface Course {
  id: string
  code: string
  title: string
}

interface DiscussionTemplate {
  id: string
  title: string
  description: string | null
  defaultMaxPoints: number
  isActive: boolean
  defaultIncludeInGradebook: boolean
  createdAt: string
  course: {
    id: string
    code: string
    title: string
  }
}

interface DiscussionAssessment {
  id: string
  title: string
  description: string | null
  maxPoints: number
  isPublished: boolean
  includeInGradebook: boolean
  createdAt: string
  class: {
    id: string
    sectionNumber: string
    semester: string
    year: number
    course: {
      code: string
      title: string
    }
  }
}

function DiscussionTemplatesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [userRole, setUserRole] = useState<'admin' | 'professor' | null>(null)
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<DiscussionTemplate[]>([])
  const [assessments, setAssessments] = useState<DiscussionAssessment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DiscussionTemplate | null>(null)
  const [editingAssessment, setEditingAssessment] = useState<DiscussionAssessment | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state - unified for both roles
  const [formData, setFormData] = useState({
    scopeId: '', // courseId for admin, classId for professor
    title: '',
    description: '',
    discussionPrompt: '',
    maxPoints: 100,
    isActive: true, // For admin templates
    isPublished: true, // For professor assessments
    includeInGradebook: true, // Discussions are typically graded
  })

  // Detect user role on mount
  useEffect(() => {
    detectRole()
  }, [])

  // Load data when role is detected
  useEffect(() => {
    if (userRole) {
      loadData()
    }
  }, [userRole])

  const detectRole = async () => {
    let adminStatus = 0
    let profStatus = 0

    try {
      // Try admin first
      const adminRes = await fetch('/api/admin/whoami')
      adminStatus = adminRes.status
      if (adminRes.ok) {
        setUserRole('admin')
        return
      }
    } catch (error) {
      console.error('Error checking admin role:', error)
    }

    try {
      // Try professor
      const profRes = await fetch('/api/professor/profile')
      profStatus = profRes.status
      if (profRes.ok) {
        setUserRole('professor')
        return
      }
    } catch (error) {
      console.error('Error checking professor role:', error)
    }

    // Treat 401 (Unauthorized) and 403 (Forbidden) as "not this role"
    const isNotAdmin = adminStatus === 401 || adminStatus === 403
    const isNotProfessor = profStatus === 401 || profStatus === 403

    if (isNotAdmin && isNotProfessor) {
      console.log('Not authenticated as admin or professor - redirecting to sign-in')
      router.push('/sign-in')
    } else {
      // Other error - don't log out, just log the issue
      console.error('Unable to detect role - admin status:', adminStatus, 'professor status:', profStatus)
      console.error('Not redirecting to sign-in to prevent unexpected logouts')
    }
  }

  const loadData = async () => {
    if (!userRole) return

    try {
      setLoading(true)

      if (userRole === 'admin') {
        // Admin: Fetch discussion templates
        const templatesRes = await fetch('/api/admin/templates?type=DISCUSSION')
        if (templatesRes.ok) {
          const data = await templatesRes.json()
          setTemplates(data.templates || [])
        }

        // Fetch courses
        const coursesRes = await fetch('/api/admin/courses')
        if (coursesRes.ok) {
          const data = await coursesRes.json()
          setCourses(data.courses || [])
        }
      } else {
        // Professor: Fetch discussion assessments
        const assessmentsRes = await fetch('/api/professor/assessments?type=DISCUSSION')
        if (assessmentsRes.ok) {
          const data = await assessmentsRes.json()
          setAssessments(data.assessments || [])
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingTemplate(null)
    setEditingAssessment(null)
    setFormData({
      scopeId: '',
      title: '',
      description: '',
      discussionPrompt: '',
      maxPoints: 100,
      isActive: true,
      isPublished: true,
      includeInGradebook: true,
    })
    setShowModal(true)
  }

  const handleEditTemplate = (template: DiscussionTemplate) => {
    setEditingTemplate(template)
    setEditingAssessment(null)
    setFormData({
      scopeId: template.course.id,
      title: template.title,
      description: template.description || '',
      discussionPrompt: template.description || '',
      maxPoints: Number(template.defaultMaxPoints),
      isActive: template.isActive,
      isPublished: true,
      includeInGradebook: template.defaultIncludeInGradebook ?? true,
    })
    setShowModal(true)
  }

  const handleEditAssessment = (assessment: DiscussionAssessment) => {
    setEditingTemplate(null)
    setEditingAssessment(assessment)
    setFormData({
      scopeId: assessment.class.id,
      title: assessment.title,
      description: assessment.description || '',
      discussionPrompt: assessment.description || '',
      maxPoints: Number(assessment.maxPoints),
      isActive: true,
      isPublished: assessment.isPublished,
      includeInGradebook: assessment.includeInGradebook ?? true,
    })
    setShowModal(true)
  }

  const handleDelete = async (item: DiscussionTemplate | DiscussionAssessment) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) {
      return
    }

    try {
      const url = userRole === 'admin'
        ? `/api/admin/templates/${item.id}`
        : `/api/professor/assessments/${item.id}`

      const res = await fetch(url, {
        method: 'DELETE',
      })

      if (res.ok) {
        await loadData()
      } else {
        const data = await res.json()
        alert(data.error || `Failed to delete ${userRole === 'admin' ? 'template' : 'assessment'}`)
      }
    } catch (error) {
      console.error(`Error deleting ${userRole === 'admin' ? 'template' : 'assessment'}:`, error)
      alert(`Failed to delete ${userRole === 'admin' ? 'template' : 'assessment'}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (userRole === 'admin') {
        // Admin: Create/update template
        const url = editingTemplate
          ? `/api/admin/templates/${editingTemplate.id}`
          : '/api/admin/templates'

        const res = await fetch(url, {
          method: editingTemplate ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: formData.scopeId,
            title: formData.title,
            description: formData.discussionPrompt,
            type: 'DISCUSSION',
            defaultMaxPoints: formData.maxPoints,
            defaultSubmissionType: 'TEXT',
            isActive: formData.isActive,
            defaultIncludeInGradebook: formData.includeInGradebook,
          }),
        })

        if (res.ok) {
          setShowModal(false)
          await loadData()
        } else {
          const data = await res.json()
          alert(data.error || 'Failed to save template')
        }
      } else {
        // Professor: Create/update assessment
        const url = editingAssessment
          ? `/api/professor/assessments/${editingAssessment.id}`
          : '/api/professor/assessments'

        const res = await fetch(url, {
          method: editingAssessment ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId: formData.scopeId,
            title: formData.title,
            description: formData.discussionPrompt,
            type: 'DISCUSSION',
            maxPoints: formData.maxPoints,
            submissionType: 'TEXT',
            isPublished: formData.isPublished,
            includeInGradebook: formData.includeInGradebook,
            allowMultipleAttempts: false,
            maxAttempts: 1,
          }),
        })

        if (res.ok) {
          setShowModal(false)
          await loadData()
        } else {
          const data = await res.json()
          alert(data.error || 'Failed to save assessment')
        }
      }
    } catch (error) {
      console.error(`Error saving ${userRole === 'admin' ? 'template' : 'assessment'}:`, error)
      alert(`Failed to save ${userRole === 'admin' ? 'template' : 'assessment'}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent-purple" />
      </div>
    )
  }

  const isAdmin = userRole === 'admin'
  const items = isAdmin ? templates : assessments
  const itemLabel = isAdmin ? 'template' : 'discussion'

  return (
    <div className="space-y-6">
      {/* Role Indicator Badge */}
      <div className="flex items-center gap-2">
        <Badge variant={isAdmin ? 'default' : 'outline'} className="text-sm">
          {isAdmin ? (
            <>
              <Shield className="h-3 w-3 mr-1" />
              Admin Mode
            </>
          ) : (
            <>
              <GraduationCap className="h-3 w-3 mr-1" />
              Professor Mode
            </>
          )}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {isAdmin ? 'Creating course templates' : 'Creating class assessments'}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-accent-purple" />
            💬 {isAdmin ? 'Discussion Templates' : 'Discussions'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? 'Create and manage discussion templates with custom prompts and requirements'
              : 'Create and manage discussion assessments for your classes'}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create {isAdmin ? 'Discussion Template' : 'Discussion'}
        </Button>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No discussion {itemLabel}s yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Create your first discussion {itemLabel} to get started
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create {isAdmin ? 'Discussion Template' : 'Discussion'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {items.length} Discussion {itemLabel}{items.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>{isAdmin ? 'Course' : 'Class'}</TableHead>
                  <TableHead>Max Points</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isAdmin
                  ? templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.title}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{template.course.code}</span>
                            <span className="text-xs text-muted-foreground">{template.course.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>{template.defaultMaxPoints}</TableCell>
                        <TableCell>
                          <Badge variant={template.isActive ? 'default' : 'outline'}>
                            {template.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(template.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(template)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  : assessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.title}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {assessment.class.course.code} - Section {assessment.class.sectionNumber}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {assessment.class.semester} {assessment.class.year}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{assessment.maxPoints}</TableCell>
                        <TableCell>
                          <Badge variant={assessment.isPublished ? 'default' : 'outline'}>
                            {assessment.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(assessment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAssessment(assessment)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(assessment)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {(editingTemplate || editingAssessment)
                ? `Edit ${isAdmin ? 'Discussion Template' : 'Discussion'}`
                : `Create ${isAdmin ? 'Discussion Template' : 'Discussion'}`}
            </DialogTitle>
            <DialogDescription>
              {(editingTemplate || editingAssessment)
                ? `Update the ${isAdmin ? 'discussion template' : 'discussion'} details`
                : `Create a new ${isAdmin ? 'discussion template' : 'discussion'} with a custom prompt`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Course/Class Selection */}
            {isAdmin ? (
              <div className="space-y-2">
                <Label htmlFor="scopeId">
                  Course <span className="text-error">*</span>
                </Label>
                <Select
                  value={formData.scopeId}
                  onValueChange={(value) => setFormData({ ...formData, scopeId: value })}
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
                <p className="text-xs text-muted-foreground">
                  This template will be available when creating modules for this course
                </p>
              </div>
            ) : (
              <ClassSelector
                value={formData.scopeId}
                onValueChange={(value) => setFormData({ ...formData, scopeId: value })}
                required
              />
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-error">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Week 1 Discussion: Course Introductions"
                required
              />
            </div>

            {/* Discussion Prompt (Rich Text Editor) */}
            <div className="space-y-2">
              <Label htmlFor="discussionPrompt">
                Discussion Prompt <span className="text-error">*</span>
              </Label>
              <RichTextEditor
                value={formData.discussionPrompt}
                onChange={(value) => setFormData({ ...formData, discussionPrompt: value })}
                placeholder="Enter the discussion prompt that students will see. You can use rich text formatting, add links, images, and more..."
              />
              <p className="text-xs text-muted-foreground">
                💡 This prompt will be displayed to students when they access the discussion
              </p>
            </div>

            {/* Max Points */}
            <div className="space-y-2">
              <Label htmlFor="maxPoints">
                Max Points <span className="text-error">*</span>
              </Label>
              <Input
                id="maxPoints"
                type="number"
                min="0"
                step="0.01"
                value={formData.maxPoints}
                onChange={(e) =>
                  setFormData({ ...formData, maxPoints: parseFloat(e.target.value) || 0 })
                }
                required
              />
            </div>

            {/* Admin: Active Status, Professor: Published Status */}
            {isAdmin ? (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active (available for use in modules)
                </Label>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isPublished" className="cursor-pointer">
                  Published (visible to students)
                </Label>
              </div>
            )}

            {/* Include in Gradebook */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeInGradebook"
                checked={formData.includeInGradebook}
                onChange={(e) => setFormData({ ...formData, includeInGradebook: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="includeInGradebook" className="cursor-pointer">
                Include in gradebook {isAdmin ? 'by default' : ''}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground -mt-2 ml-6">
              {isAdmin
                ? 'When professors adopt this template, assessments will be included in gradebook calculations'
                : 'This discussion will appear as a gradebook column'}
            </p>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    {(editingTemplate || editingAssessment)
                      ? `Update ${isAdmin ? 'Template' : 'Discussion'}`
                      : `Create ${isAdmin ? 'Template' : 'Discussion'}`}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function DiscussionTemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-accent-purple" />
        </div>
      }
    >
      <DiscussionTemplatesContent />
    </Suspense>
  )
}
