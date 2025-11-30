'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Loader2, FileText, Shield, GraduationCap } from 'lucide-react'
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

interface PageTemplate {
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

interface PageAssessment {
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

function PageTemplatesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [userRole, setUserRole] = useState<'admin' | 'professor' | null>(null)
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<PageTemplate[]>([])
  const [assessments, setAssessments] = useState<PageAssessment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PageTemplate | null>(null)
  const [editingAssessment, setEditingAssessment] = useState<PageAssessment | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state - unified for both roles
  const [formData, setFormData] = useState({
    scopeId: '', // courseId for admin, classId for professor
    title: '',
    pageContent: '',
    isActive: true, // For admin templates
    isPublished: true, // For professor assessments
    includeInGradebook: false, // PAGE items default to NOT being in gradebook
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
        // Admin: Fetch PAGE templates
        const templatesRes = await fetch('/api/admin/templates?type=PAGE')
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
        // Professor: Fetch PAGE assessments
        const assessmentsRes = await fetch('/api/professor/assessments?type=PAGE')
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
      pageContent: '',
      isActive: true,
      isPublished: true,
      includeInGradebook: false,
    })
    setShowModal(true)
  }

  const handleEditTemplate = (template: PageTemplate) => {
    setEditingTemplate(template)
    setEditingAssessment(null)
    setFormData({
      scopeId: template.course.id,
      title: template.title,
      pageContent: template.description || '',
      isActive: template.isActive,
      isPublished: true,
      includeInGradebook: template.defaultIncludeInGradebook ?? false,
    })
    setShowModal(true)
  }

  const handleEditAssessment = (assessment: PageAssessment) => {
    setEditingTemplate(null)
    setEditingAssessment(assessment)
    setFormData({
      scopeId: assessment.class.id,
      title: assessment.title,
      pageContent: assessment.description || '',
      isActive: true,
      isPublished: assessment.isPublished,
      includeInGradebook: assessment.includeInGradebook ?? false,
    })
    setShowModal(true)
  }

  const handleDelete = async (item: PageTemplate | PageAssessment) => {
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
        alert(data.error || `Failed to delete ${userRole === 'admin' ? 'template' : 'page'}`)
      }
    } catch (error) {
      console.error(`Error deleting ${userRole === 'admin' ? 'template' : 'page'}:`, error)
      alert(`Failed to delete ${userRole === 'admin' ? 'template' : 'page'}`)
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
            description: formData.pageContent,
            type: 'PAGE',
            defaultMaxPoints: 0,
            defaultSubmissionType: 'NONE',
            isActive: formData.isActive,
            defaultIncludeInGradebook: formData.includeInGradebook,
          }),
        })

        if (res.ok) {
          setShowModal(false)
          await loadData()
        } else {
          const data = await res.json()
          console.error('API Error Response:', data)
          alert(data.error || data.details || 'Failed to save template')
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
            description: formData.pageContent,
            type: 'PAGE',
            maxPoints: 0,
            submissionType: 'NONE',
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
          alert(data.error || 'Failed to save page')
        }
      }
    } catch (error) {
      console.error(`Error saving ${userRole === 'admin' ? 'template' : 'page'}:`, error)
      alert(`Failed to save ${userRole === 'admin' ? 'template' : 'page'}: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
  const itemLabel = isAdmin ? 'template' : 'page'

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
          {isAdmin ? 'Creating course templates' : 'Creating class pages'}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-accent-purple" />
            📄 {isAdmin ? 'Page Templates' : 'Pages'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? 'Create and manage page content templates for course modules'
              : 'Create and manage page content for your classes'}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create {isAdmin ? 'Page Template' : 'Page'}
        </Button>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No page {itemLabel}s yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Create your first page {itemLabel} to get started
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create {isAdmin ? 'Page Template' : 'Page'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {items.length} Page {itemLabel}{items.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>{isAdmin ? 'Course' : 'Class'}</TableHead>
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
                ? `Edit ${isAdmin ? 'Page Template' : 'Page'}`
                : `Create ${isAdmin ? 'Page Template' : 'Page'}`}
            </DialogTitle>
            <DialogDescription>
              {(editingTemplate || editingAssessment)
                ? `Update the ${isAdmin ? 'page template' : 'page'} details`
                : `Create a new ${isAdmin ? 'page template' : 'page'} with rich content`}
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
                placeholder="e.g., Course Syllabus, Week 1 Overview, Academic Integrity Policy"
                required
              />
            </div>

            {/* Page Content (Rich Text Editor) */}
            <div className="space-y-2">
              <Label htmlFor="pageContent">
                Page Content <span className="text-error">*</span>
              </Label>
              <RichTextEditor
                value={formData.pageContent}
                onChange={(value) => setFormData({ ...formData, pageContent: value })}
                placeholder="Enter the page content that students will see. You can use rich text formatting, add links, images, and more..."
              />
              <p className="text-xs text-muted-foreground">
                💡 This content will be displayed to students when they access the page in a module
              </p>
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
              ⚠️ PAGE items are typically informational and not graded. Leave unchecked unless you want to grade this content.
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
                      ? `Update ${isAdmin ? 'Template' : 'Page'}`
                      : `Create ${isAdmin ? 'Template' : 'Page'}`}
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

export default function PageTemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-accent-purple" />
        </div>
      }
    >
      <PageTemplatesContent />
    </Suspense>
  )
}
