'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Layers, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
    dueAt: string | null
  } | null
  externalUrl?: string | null
  pageContent?: string | null
  completions: any[]
}

interface Module {
  id: string
  title: string
  description?: string | null
  orderIndex: number
  isPublished: boolean
  unlockAt?: Date | null
  items: ModuleItem[]
  isLocked: boolean
  isCompleted: boolean
  progress: number
  completedItems: number
  totalItems: number
}

export default function StudentModulesPage() {
  const params = useParams()
  const classId = params?.classId as string

  const [loading, setLoading] = useState(true)
  const [modules, setModules] = useState<Module[]>([])

  useEffect(() => {
    if (classId) {
      fetchModules()
    }
  }, [classId])

  const fetchModules = async () => {
    if (!classId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/student/classes/${classId}/modules`)
      if (response.ok) {
        const data = await response.json()
        setModules(data.modules || [])
      } else {
        console.error('Failed to fetch modules')
      }
    } catch (error) {
      console.error('Error fetching modules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleItemComplete = async (itemId: string) => {
    try {
      const response = await fetch(`/api/student/module-items/${itemId}/complete`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()

        if (data.moduleCompleted) {
          alert('Module completed! 🎉')
        }

        // Refresh modules to update completion status
        await fetchModules()
      } else {
        const error = await response.json()
        console.error('Failed to mark item complete:', error)
      }
    } catch (error) {
      console.error('Error marking item complete:', error)
      throw error
    }
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Layers className="h-8 w-8 text-accent-purple" />
          <h1 className="text-3xl font-bold">Modules</h1>
        </div>
        <p className="text-muted-foreground">
          Complete course modules to track your progress
        </p>
      </div>

      {/* Overall Progress Summary */}
      {modules.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
            <CardDescription>
              {modules.filter((m) => m.isCompleted).length} / {modules.length} modules completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-accent-purple h-3 rounded-full transition-all"
                style={{
                  width: `${
                    (modules.filter((m) => m.isCompleted).length / modules.length) * 100
                  }%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modules List */}
      {modules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No modules yet</h3>
            <p className="text-muted-foreground">
              Your instructor hasn't added any modules to this class yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ModuleAccordion
          modules={modules}
          role="student"
          mode="student"
          showCompletion={true}
        />
      )}
    </div>
  )
}
