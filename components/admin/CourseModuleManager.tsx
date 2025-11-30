'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, Layers } from 'lucide-react'
import {
  ModuleTemplateForm,
  ModuleTemplateFormData,
} from './ModuleTemplateForm'
import {
  ModuleItemTemplateForm,
  ModuleItemFormData,
} from './ModuleItemTemplateForm'
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

interface CourseModuleManagerProps {
  courseId: string
}

export function CourseModuleManager({ courseId }: CourseModuleManagerProps) {
  const [loading, setLoading] = useState(true)
  const [moduleTemplates, setModuleTemplates] = useState<ModuleTemplate[]>([])
  const [assessmentTemplates, setAssessmentTemplates] = useState<AssessmentTemplate[]>([])
  const [course, setCourse] = useState<Course | null>(null)

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
  }, [courseId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Fetch course data
      const courseRes = await fetch(`/api/admin/courses/${courseId}`)
      if (courseRes.ok) {
        const courseData = await courseRes.json()
        setCourse(courseData.course)
      }

      // Fetch module templates
      const templatesRes = await fetch(`/api/admin/module-templates?courseId=${courseId}`)
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json()
        setModuleTemplates(templatesData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAssessmentTemplates = async () => {
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

  // Handle module CRUD
  const handleCreateModule = () => {
    setShowCreateModule(true)
  }

  const handleEditModule = (module: ModuleTemplate) => {
    setSelectedModule(module)
    setShowEditModule(true)
  }

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module template? This will also delete all items in the module.')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/module-templates/${moduleId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await loadData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete module template')
      }
    } catch (error) {
      console.error('Error deleting module:', error)
      alert('Failed to delete module template')
    }
  }

  const handleSaveModule = async (data: ModuleTemplateFormData) => {
    try {
      const url = selectedModule
        ? `/api/admin/module-templates/${selectedModule.id}`
        : '/api/admin/module-templates'

      const res = await fetch(url, {
        method: selectedModule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setShowCreateModule(false)
        setShowEditModule(false)
        setSelectedModule(null)
        await loadData()
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save module template')
      }
    } catch (error) {
      console.error('Error saving module:', error)
      throw error
    }
  }

  // Handle module item CRUD
  const handleCreateItem = (module: ModuleTemplate) => {
    setSelectedModule(module)
    setShowCreateItem(true)
    loadAssessmentTemplates()
  }

  const handleEditItem = (module: ModuleTemplate, item: any) => {
    setSelectedModule(module)
    setSelectedItem(item)
    setShowEditItem(true)
    loadAssessmentTemplates()
  }

  const handleDeleteItem = async (moduleId: string, itemId: string) => {
    if (!confirm('Are you sure you want to delete this module item?')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/module-templates/${moduleId}/items/${itemId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await loadData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete module item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete module item')
    }
  }

  const handleSaveItem = async (data: ModuleItemFormData) => {
    if (!selectedModule) return

    try {
      const url = selectedItem
        ? `/api/admin/module-templates/${selectedModule.id}/items/${selectedItem.id}`
        : `/api/admin/module-templates/${selectedModule.id}/items`

      const res = await fetch(url, {
        method: selectedItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        // Close modals and clear selection
        setShowCreateItem(false)
        setShowEditItem(false)
        setSelectedModule(null)
        setSelectedItem(null)
        // Reload data to show new/updated item
        await loadData()
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save module item')
      }
    } catch (error) {
      console.error('Error saving item:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent-purple" />
      </div>
    )
  }

  if (moduleTemplates.length === 0) {
    return (
      <div className="text-center py-12">
        <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h5 className="text-lg font-semibold mb-2">No modules yet</h5>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first module template to structure this course.
        </p>
        <Button onClick={handleCreateModule}>
          <Plus className="h-4 w-4 mr-2" />
          Create Module
        </Button>

        {/* Create Module Modal */}
        {showCreateModule && course && (
          <ModuleTemplateForm
            mode="create"
            open={showCreateModule}
            onOpenChange={setShowCreateModule}
            onSubmit={handleSaveModule}
            courses={[course]}
            initialData={{
              courseId,
              title: '',
              description: '',
              orderIndex: 0,
              isActive: true,
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {moduleTemplates.length} module{moduleTemplates.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={handleCreateModule} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Module
        </Button>
      </div>

      {/* Module Accordion */}
      <ModuleAccordion
        modules={moduleTemplates}
        onEditModule={handleEditModule}
        onDeleteModule={handleDeleteModule}
        onAddItem={handleCreateItem}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
        role="admin"
        mode="admin"
      />

      {/* Create Module Modal */}
      {showCreateModule && course && (
        <ModuleTemplateForm
          mode="create"
          open={showCreateModule}
          onOpenChange={setShowCreateModule}
          onSubmit={handleSaveModule}
          courses={[course]}
          initialData={{
            courseId,
            title: '',
            description: '',
            orderIndex: 0,
            isActive: true,
          }}
        />
      )}

      {/* Edit Module Modal */}
      {showEditModule && selectedModule && course && (
        <ModuleTemplateForm
          mode="edit"
          open={showEditModule}
          onOpenChange={setShowEditModule}
          onSubmit={handleSaveModule}
          courses={[course]}
          initialData={{
            courseId,
            title: selectedModule.title,
            description: selectedModule.description || '',
            orderIndex: selectedModule.orderIndex,
            isActive: selectedModule.isActive,
          }}
        />
      )}

      {/* Create Item Modal */}
      {showCreateItem && selectedModule && (
        <ModuleItemTemplateForm
          mode="create"
          open={showCreateItem}
          onOpenChange={(open) => {
            setShowCreateItem(open)
            if (!open) setSelectedModule(null)
          }}
          onSubmit={handleSaveItem}
          courseId={courseId}
          assessmentTemplates={assessmentTemplates}
        />
      )}

      {/* Edit Item Modal */}
      {showEditItem && selectedModule && selectedItem && (
        <ModuleItemTemplateForm
          mode="edit"
          open={showEditItem}
          onOpenChange={setShowEditItem}
          onSubmit={handleSaveItem}
          courseId={courseId}
          initialData={{
            title: selectedItem.title,
            itemType: selectedItem.itemType,
            orderIndex: selectedItem.orderIndex,
            isPublished: selectedItem.isPublished,
            isRequired: selectedItem.isRequired,
            assessmentTemplateId: selectedItem.assessmentTemplate?.id,
            customDescription: selectedItem.customDescription,
            externalUrl: selectedItem.externalUrl,
            pageContent: selectedItem.pageContent,
          }}
          assessmentTemplates={assessmentTemplates}
        />
      )}
    </div>
  )
}
