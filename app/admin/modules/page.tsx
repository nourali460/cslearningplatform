'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import {
  ModuleTemplateForm,
  ModuleTemplateFormData,
} from '@/components/admin/ModuleTemplateForm'
import {
  ModuleItemTemplateForm,
  ModuleItemFormData,
} from '@/components/admin/ModuleItemTemplateForm'
import { ModuleAccordion } from '@/components/modules/ModuleAccordion'

interface Course {
  id: string
  code: string
  title: string
}

interface AssessmentTemplate {
  id: string
  title: string
  type: string
  description: string | null
}

interface ModuleTemplate {
  id: string
  title: string
  description?: string | null
  orderIndex: number
  isActive: boolean
  course: Course
  items: Array<{
    id: string
    title: string
    itemType: string
    orderIndex: number
    isPublished: boolean
    isRequired: boolean
    assessmentTemplate?: {
      id: string
      title: string
      type: string
      description: string | null
    } | null
    externalUrl?: string | null
    pageContent?: string | null
    customDescription?: string | null
  }>
  createdAt: string
}

export default function AdminModulesPage() {
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [moduleTemplates, setModuleTemplates] = useState<ModuleTemplate[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [assessmentTemplates, setAssessmentTemplates] = useState<AssessmentTemplate[]>([])

  // Modal states
  const [showCreateModule, setShowCreateModule] = useState(false)
  const [showEditModule, setShowEditModule] = useState(false)
  const [showCreateItem, setShowCreateItem] = useState(false)
  const [showEditItem, setShowEditItem] = useState(false)

  // Selected data
  const [selectedModule, setSelectedModule] = useState<ModuleTemplate | null>(null)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // Fetch initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [coursesRes, templatesRes] = await Promise.all([
        fetch('/api/admin/courses'),
        fetch('/api/admin/module-templates'),
      ])

      if (coursesRes.ok && templatesRes.ok) {
        const coursesData = await coursesRes.json()
        const templatesData = await templatesRes.json()
        setCourses(coursesData.courses || [])
        setModuleTemplates(templatesData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Filter templates by course
  const filteredTemplates =
    selectedCourse === 'all'
      ? moduleTemplates
      : moduleTemplates.filter((t) => t.course.id === selectedCourse)

  // Module CRUD operations
  const handleCreateModule = async (data: ModuleTemplateFormData) => {
    const res = await fetch('/api/admin/module-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) throw new Error('Failed to create module template')

    await loadData()
  }

  const handleEditModule = async (data: ModuleTemplateFormData) => {
    if (!selectedModule) return

    const res = await fetch(`/api/admin/module-templates/${selectedModule.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) throw new Error('Failed to update module template')

    await loadData()
  }

  const handleDeleteModule = async (id: string, title: string) => {
    const res = await fetch(`/api/admin/module-templates/${id}`, {
      method: 'DELETE',
    })

    if (!res.ok) throw new Error('Failed to delete module template')

    await loadData()
  }

  const loadAssessmentTemplates = async (courseId: string) => {
    try {
      const res = await fetch(`/api/admin/templates?courseId=${courseId}`)
      if (res.ok) {
        const data = await res.json()
        setAssessmentTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error loading assessment templates:', error)
    }
  }

  // Item CRUD operations
  const handleCreateItem = async (data: ModuleItemFormData) => {
    if (!selectedModule) return

    const res = await fetch(`/api/admin/module-templates/${selectedModule.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) throw new Error('Failed to create item')

    await loadData() // Refresh data
  }

  const handleEditItem = async (data: ModuleItemFormData) => {
    if (!selectedModule || !selectedItem) return

    const res = await fetch(
      `/api/admin/module-templates/${selectedModule.id}/items/${selectedItem.id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    )

    if (!res.ok) throw new Error('Failed to update item')

    await loadData() // Refresh data
  }

  const handleDeleteItem = async (moduleId: string, itemId: string) => {
    const res = await fetch(`/api/admin/module-templates/${moduleId}/items/${itemId}`, {
      method: 'DELETE',
    })

    if (!res.ok) throw new Error('Failed to delete item')

    await loadData() // Refresh data
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Module Templates</h1>
        <p className="text-gray-600">
          Create reusable module templates that will be cloned when professors adopt courses
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.code} - {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-sm text-gray-600">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
          </div>
        </div>

        <Button onClick={() => setShowCreateModule(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Module Template
        </Button>
      </div>

      {/* Module Templates Accordion */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-gray-600">No module templates found for this filter.</p>
        </div>
      ) : (
        <ModuleAccordion
          modules={filteredTemplates.map((template) => ({
            ...template,
            isPublished: template.isActive, // Map isActive to isPublished for consistency
          }))}
          onEditModule={(module) => {
            setSelectedModule(module as ModuleTemplate)
            setShowEditModule(true)
          }}
          onDeleteModule={handleDeleteModule}
          onAddItem={(module) => {
            const template = module as ModuleTemplate
            setSelectedModule(template)
            loadAssessmentTemplates(template.course.id)
            setShowCreateItem(true)
          }}
          onEditItem={(module, item) => {
            const template = module as ModuleTemplate
            setSelectedModule(template)
            setSelectedItem(item)
            loadAssessmentTemplates(template.course.id)
            setShowEditItem(true)
          }}
          onDeleteItem={handleDeleteItem}
          role="admin"
          showCompletion={false}
        />
      )}

      {/* Create Module Modal */}
      <ModuleTemplateForm
        open={showCreateModule}
        onOpenChange={setShowCreateModule}
        onSubmit={handleCreateModule}
        courses={courses}
        mode="create"
      />

      {/* Edit Module Modal */}
      {selectedModule && (
        <ModuleTemplateForm
          open={showEditModule}
          onOpenChange={setShowEditModule}
          onSubmit={handleEditModule}
          courses={courses}
          initialData={{
            courseId: selectedModule.course.id,
            title: selectedModule.title,
            description: selectedModule.description || '',
            orderIndex: selectedModule.orderIndex,
            isActive: selectedModule.isActive,
          }}
          mode="edit"
        />
      )}

      {/* Create Item Modal */}
      {selectedModule && (
        <ModuleItemTemplateForm
          open={showCreateItem}
          onOpenChange={setShowCreateItem}
          onSubmit={handleCreateItem}
          assessmentTemplates={assessmentTemplates}
          courseId={selectedModule.course.id}
          onAssessmentTemplateCreated={async () =>
            await loadAssessmentTemplates(selectedModule.course.id)
          }
          mode="create"
        />
      )}

      {/* Edit Item Modal */}
      {selectedModule && selectedItem && (
        <ModuleItemTemplateForm
          open={showEditItem}
          onOpenChange={setShowEditItem}
          onSubmit={handleEditItem}
          assessmentTemplates={assessmentTemplates}
          courseId={selectedModule.course.id}
          onAssessmentTemplateCreated={async () =>
            await loadAssessmentTemplates(selectedModule.course.id)
          }
          initialData={selectedItem}
          mode="edit"
        />
      )}

    </div>
  )
}
