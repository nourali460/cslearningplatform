'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Loader2, BookOpen, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

type AssessmentTemplate = {
  id: string
  title: string
  description: string | null
  type: string
  defaultMaxPoints: number | string
  defaultSubmissionType: string
  isActive: boolean
}

type Props = {
  classId: string
  courseId: string
  className: string
  onClose: () => void
  onAssessmentAdded: () => void
}

export function AssessmentTemplateLibrary({ classId, courseId, className, onClose, onAssessmentAdded }: Props) {
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([])
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    fetchTemplates()
  }, [courseId])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/professor/templates?courseId=${courseId}`)
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

  const handleAddTemplate = async (templateId: string) => {
    setAdding(templateId)
    try {
      const response = await fetch(`/api/professor/classes/${classId}/assessments/from-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      })

      if (response.ok) {
        onAssessmentAdded()
        onClose()
      } else {
        const errorData = await response.json()
        alert(`Failed to add assessment: ${errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      alert('Failed to add assessment')
    } finally {
      setAdding(null)
    }
  }

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const filteredTemplates = filterType === 'all'
    ? templates
    : templates.filter((t) => t.type === filterType)

  const uniqueTypes = Array.from(new Set(templates.map((t) => t.type)))

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-5 w-5" />
            Assessment Template Library
          </DialogTitle>
          <DialogDescription>
            Add assessments to {className}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">Filter by Type</label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {formatType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent-orange mb-4" />
              <p className="text-muted-foreground">Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card className="border-l-4 border-l-info bg-info/10">
              <CardContent className="flex items-center gap-2 py-4">
                <AlertCircle className="h-5 w-5 text-info" />
                <div className="text-sm">
                  No templates available{filterType !== 'all' ? ' for this type' : ''}. Contact your admin to create assessment templates.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h6 className="font-semibold text-base mb-2">{template.title}</h6>
                        <div className="flex gap-2 mb-2">
                          <Badge variant="default">
                            {formatType(template.type)}
                          </Badge>
                          <Badge variant="info">
                            {template.defaultMaxPoints} points
                          </Badge>
                        </div>
                        {template.description && (
                          <p className="text-muted-foreground text-sm">{template.description}</p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleAddTemplate(template.id)}
                        disabled={adding !== null}
                        className="shrink-0"
                      >
                        {adding === template.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
