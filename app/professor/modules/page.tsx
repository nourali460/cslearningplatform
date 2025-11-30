'use client'

import { useEffect, useState } from 'react'
import { Layers, Loader2, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ModuleForm, ModuleFormData } from '@/components/professor/ModuleForm'
import { ModuleItemForm, ModuleItemFormData } from '@/components/professor/ModuleItemForm'
import { ModuleAccordion } from '@/components/modules/ModuleAccordion'

interface ModuleItem {
  id: string
  itemType: 'PAGE' | 'ASSESSMENT' | 'EXTERNAL_LINK'
  title: string
  orderIndex: number
  isPublished: boolean
  isRequired: boolean
  assessment?: {
    id: string
    title: string
    type: string
    maxPoints: number
  } | null
  externalUrl?: string | null
  pageContent?: string | null
}

interface Module {
  id: string
  title: string
  description?: string | null
  orderIndex: number
  isPublished: boolean
  unlockAt?: Date | null
  items: ModuleItem[]
  _count?: {
    items: number
    completions: number
  }
}

interface Assessment {
  id: string
  title: string
  type: string
}

interface Class {
  id: string
  classCode: string
  title: string
  course: {
    id: string
    code: string
    title: string
  }
}

export default function ProfessorModulesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [modules, setModules] = useState<Module[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [showCreateModule, setShowCreateModule] = useState(false)
  const [showEditModule, setShowEditModule] = useState(false)
  const [showCreateItem, setShowCreateItem] = useState(false)
  const [showEditItem, setShowEditItem] = useState(false)

  // Selected data
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [selectedItem, setSelectedItem] = useState<ModuleItem | null>(null)

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    if (selectedClassId) {
      fetchModules()
      fetchAssessments()
    }
  }, [selectedClassId])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/professor/classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
        if (data.classes.length > 0) {
          setSelectedClassId(data.classes[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchModules = async () => {
    if (!selectedClassId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/professor/classes/${selectedClassId}/modules`)
      if (response.ok) {
        const data = await response.json()
        setModules(data.modules || [])
      }
    } catch (error) {
      console.error('Error fetching modules:', error)
    } finally {
      setLoading(false)
    }
  }

  // Module CRUD operations
  const handleCreateModule = async (data: ModuleFormData) => {
    const response = await fetch(`/api/professor/classes/${selectedClassId}/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create module')
    }

    await fetchModules()
  }

  const handleEditModule = async (data: ModuleFormData) => {
    if (!selectedModule) return

    const response = await fetch(
      `/api/professor/classes/${selectedClassId}/modules/${selectedModule.id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update module')
    }

    await fetchModules()
    setSelectedModule(null)
  }

  const handleDeleteModule = async (moduleId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will also delete all items in this module.`)) {
      return
    }

    const response = await fetch(
      `/api/professor/classes/${selectedClassId}/modules/${moduleId}`,
      {
        method: 'DELETE',
      }
    )

    if (!response.ok) {
      const error = await response.json()
      alert(error.error || 'Failed to delete module')
      return
    }

    alert('Module deleted successfully')
    await fetchModules()
  }

  const fetchAssessments = async () => {
    if (!selectedClassId) return

    try {
      const response = await fetch(`/api/professor/classes/${selectedClassId}/assessments`)
      if (response.ok) {
        const data = await response.json()
        setAssessments(data.assessments || [])
      }
    } catch (error) {
      console.error('Error fetching assessments:', error)
    }
  }

  // Item CRUD operations
  const handleCreateItem = async (data: ModuleItemFormData) => {
    if (!selectedModule) return

    const response = await fetch(
      `/api/professor/classes/${selectedClassId}/modules/${selectedModule.id}/items`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('Create item error:', error)
      throw new Error(error.details || error.error || 'Failed to create item')
    }

    await fetchModules()
  }

  const handleEditItem = async (data: ModuleItemFormData) => {
    if (!selectedModule || !selectedItem) return

    const response = await fetch(
      `/api/professor/classes/${selectedClassId}/modules/${selectedModule.id}/items/${selectedItem.id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update item')
    }

    await fetchModules()
    setSelectedItem(null)
  }

  const handleDeleteItem = async (moduleId: string, itemId: string) => {
    const response = await fetch(
      `/api/professor/classes/${selectedClassId}/modules/${moduleId}/items/${itemId}`,
      {
        method: 'DELETE',
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete item')
    }

    await fetchModules()
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId)

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Layers className="h-8 w-8 text-accent-purple" />
          <h1 className="text-3xl font-bold">Modules</h1>
        </div>
        <p className="text-muted-foreground">
          Organize your course content into modules with pages, assessments, and external resources
        </p>
      </div>

      {/* Class Selector */}
      {classes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Classes</CardTitle>
            <CardDescription>
              You don't have any classes yet. Create a class to start managing modules.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 max-w-md">
                  <label className="text-sm font-medium mb-2 block">Select Class</label>
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.classCode} - {cls.course.code}: {cls.course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={() => setShowCreateModule(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Module
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Modules List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : modules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No modules yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by creating your first module
                </p>
                <Button onClick={() => setShowCreateModule(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Module
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ModuleAccordion
              modules={modules}
              onEditModule={(module) => {
                setSelectedModule(module)
                setShowEditModule(true)
              }}
              onDeleteModule={handleDeleteModule}
              onAddItem={(module) => {
                setSelectedModule(module)
                setShowCreateItem(true)
              }}
              onEditItem={(module, item) => {
                setSelectedModule(module)
                setSelectedItem(item)
                setShowEditItem(true)
              }}
              onDeleteItem={handleDeleteItem}
              role="professor"
              mode="professor"
              classId={selectedClassId}
              showCompletion={false}
            />
          )}
        </>
      )}

      {/* Create Module Modal */}
      {selectedClassId && (
        <ModuleForm
          open={showCreateModule}
          onOpenChange={setShowCreateModule}
          onSubmit={handleCreateModule}
          mode="create"
          classId={selectedClassId}
        />
      )}

      {/* Edit Module Modal */}
      {selectedModule && (
        <ModuleForm
          open={showEditModule}
          onOpenChange={setShowEditModule}
          onSubmit={handleEditModule}
          initialData={{
            title: selectedModule.title,
            description: selectedModule.description || '',
            orderIndex: selectedModule.orderIndex,
            isPublished: selectedModule.isPublished,
            unlockAt: selectedModule.unlockAt
              ? new Date(selectedModule.unlockAt).toISOString().slice(0, 16)
              : '',
          }}
          mode="edit"
          classId={selectedClassId}
        />
      )}

      {/* Create Item Modal */}
      {selectedModule && (
        <ModuleItemForm
          open={showCreateItem}
          onOpenChange={setShowCreateItem}
          onSubmit={handleCreateItem}
          assessments={assessments}
          classId={selectedClassId}
          onAssessmentCreated={fetchAssessments}
          mode="create"
        />
      )}

      {/* Edit Item Modal */}
      {selectedModule && selectedItem && (
        <ModuleItemForm
          open={showEditItem}
          onOpenChange={setShowEditItem}
          onSubmit={handleEditItem}
          assessments={assessments}
          classId={selectedClassId}
          onAssessmentCreated={fetchAssessments}
          initialData={{
            itemType: selectedItem.itemType,
            title: selectedItem.title,
            assessmentId: selectedItem.assessment?.id,
            externalUrl: selectedItem.externalUrl || undefined,
            pageContent: selectedItem.pageContent || undefined,
            orderIndex: selectedItem.orderIndex,
            isPublished: selectedItem.isPublished,
            isRequired: selectedItem.isRequired,
          }}
          mode="edit"
        />
      )}
    </div>
  )
}
