'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FileText, Save, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ClassSelector } from '@/components/shared/ClassSelector'

interface Course {
  id: string
  code: string
  title: string
}

export default function ExamTemplatesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams?.get('courseId')
  const editId = searchParams?.get('edit')

  const [userRole, setUserRole] = useState<'admin' | 'professor' | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    scopeId: courseId || '',
    title: '',
    description: '',
    maxPoints: '100',
    submissionType: 'ONLINE',
    dueAt: '',
    includeInGradebook: true,
    isPublished: true,
  })

  const isAdmin = userRole === 'admin'

  // Detect user role
  useEffect(() => {
    detectRole()
  }, [])

  // Load courses (admin only)
  useEffect(() => {
    if (userRole === 'admin') {
      loadCourses()
    } else if (userRole === 'professor') {
      setLoading(false)
    }
  }, [userRole])

  const detectRole = async () => {
    let adminStatus = 0
    let profStatus = 0

    try {
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
      console.error('Unable to detect role - admin status:', adminStatus, 'professor status:', profStatus)
      console.error('Not redirecting to sign-in to prevent unexpected logouts')
    }
  }

  const loadCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/courses')
      if (!response.ok) {
        throw new Error('Failed to load courses')
      }
      const data = await response.json()
      setCourses(data.courses || [])
    } catch (err) {
      console.error('Error loading courses:', err)
      setError('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const endpoint = isAdmin ? '/api/admin/templates' : '/api/professor/assessments'
      const payload = isAdmin
        ? {
            courseId: formData.scopeId,
            type: 'EXAM',
            title: formData.title,
            description: formData.description || null,
            defaultMaxPoints: parseFloat(formData.maxPoints) || 100,
            defaultSubmissionType: formData.submissionType,
            defaultIncludeInGradebook: formData.includeInGradebook,
            isActive: formData.isPublished,
          }
        : {
            classId: formData.scopeId,
            type: 'EXAM',
            title: formData.title,
            description: formData.description || null,
            maxPoints: parseFloat(formData.maxPoints) || 100,
            submissionType: formData.submissionType,
            dueAt: formData.dueAt || null,
            includeInGradebook: formData.includeInGradebook,
            isPublished: formData.isPublished,
          }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create exam template')
      }

      // Success - navigate back
      if (isAdmin) {
        router.push(courseId ? `/admin/courses/${courseId}?tab=templates` : '/admin/courses')
      } else {
        router.push('/professor/assessments')
      }
    } catch (err) {
      console.error('Error saving exam template:', err)
      setError(err instanceof Error ? err.message : 'Failed to save exam template')
    } finally {
      setSaving(false)
    }
  }

  if (loading || userRole === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent-orange" />
          <p className="text-sm text-foreground-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-accent-purple" />
            📝 {editId ? 'Edit' : 'Create'} Exam Template
          </h1>
          <Badge variant={isAdmin ? 'info' : 'success'}>
            {isAdmin ? '👨‍💼 Admin Mode' : '👨‍🏫 Professor Mode'}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {isAdmin
            ? 'Create a reusable exam template for a course. This template can be used by all professors teaching this course.'
            : 'Create an exam assessment for your class. Configure time limits, security settings, and proctoring options.'}
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
          <CardDescription>
            {isAdmin
              ? 'Define the exam template settings. Professors can customize these when creating actual exams.'
              : 'Configure the exam for your students.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Scope Selector - Course (Admin) or Class (Professor) */}
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
                  <SelectTrigger id="scopeId">
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
                  💡 This template will be available for all classes of this course
                </p>
              </div>
            ) : (
              <ClassSelector
                value={formData.scopeId}
                onValueChange={(value) => setFormData({ ...formData, scopeId: value })}
                required
                label="Class"
                placeholder="Select a class"
              />
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Exam Title <span className="text-error">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Midterm Exam - Data Structures & Algorithms"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-purple"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the exam format, allowed materials, time limits, and any special instructions..."
              />
            </div>

            {/* Max Points */}
            <div className="space-y-2">
              <Label htmlFor="maxPoints">
                Maximum Points <span className="text-error">*</span>
              </Label>
              <Input
                id="maxPoints"
                type="number"
                min="0"
                step="0.01"
                value={formData.maxPoints}
                onChange={(e) => setFormData({ ...formData, maxPoints: e.target.value })}
                required
              />
            </div>

            {/* Submission Type */}
            <div className="space-y-2">
              <Label htmlFor="submissionType">
                Submission Type <span className="text-error">*</span>
              </Label>
              <Select
                value={formData.submissionType}
                onValueChange={(value) => setFormData({ ...formData, submissionType: value })}
                required
              >
                <SelectTrigger id="submissionType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">Online Exam</SelectItem>
                  <SelectItem value="FILE">File Upload</SelectItem>
                  <SelectItem value="TEXT">Text Submission</SelectItem>
                  <SelectItem value="NONE">No Submission</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date (Professor only) */}
            {!isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="dueAt">Exam Date & Time</Label>
                <Input
                  id="dueAt"
                  type="datetime-local"
                  value={formData.dueAt}
                  onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                />
              </div>
            )}

            {/* Include in Gradebook */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeInGradebook"
                checked={formData.includeInGradebook}
                onChange={(e) => setFormData({ ...formData, includeInGradebook: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="includeInGradebook" className="cursor-pointer">
                Include in gradebook
              </Label>
            </div>

            {/* Published Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="isPublished" className="cursor-pointer">
                {isAdmin ? 'Active template' : 'Publish to students'}
              </Label>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : editId ? 'Save Changes' : 'Create Exam'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Future Features Card */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">Planned Exam Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div>• Strict time limits with automatic submission</div>
            <div>• Proctoring integration (live or AI-powered)</div>
            <div>• Lockdown browser support</div>
            <div>• Exam session scheduling</div>
            <div>• Security features (disable copy/paste, prevent tab switching)</div>
            <div>• Late submission policies with penalties</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
