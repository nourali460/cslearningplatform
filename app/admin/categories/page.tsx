'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Filter, FileType, Loader2 } from 'lucide-react'
import { AssessmentTemplateForm } from '@/components/admin/AssessmentTemplateForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

type AssessmentTemplate = {
  id: string
  title: string
  description: string | null
  type: string
  defaultMaxPoints: number | string
  defaultSubmissionType: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const ASSESSMENT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'INTERACTIVE_LESSON', label: 'Interactive Lesson' },
  { value: 'LAB', label: 'Lab' },
  { value: 'EXAM', label: 'Exam' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'DISCUSSION', label: 'Discussion' },
]

const ACTIVE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'true', label: 'Active Only' },
  { value: 'false', label: 'Inactive Only' },
]

export default function CategoriesPage() {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<AssessmentTemplate | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [typeFilter, activeFilter])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (activeFilter !== 'all') params.append('active', activeFilter)

      const response = await fetch(`/api/admin/templates?${params.toString()}`)

      // Check if redirected to login
      if (response.redirected && response.url.includes('/sign-in')) {
        alert('Session expired. Please refresh the page and log in again.')
        window.location.href = '/sign-in'
        return
      }

      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      } else {
        let errorMessage = response.statusText
        try {
          const contentType = response.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.details || errorMessage
          }
        } catch {
          // Failed to parse error response, use default message
        }
        alert(`Failed to fetch templates: ${errorMessage}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      alert(`Failed to fetch templates: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClick = () => {
    setEditingTemplate(null)
    setShowForm(true)
  }

  const handleEditClick = (template: AssessmentTemplate) => {
    setEditingTemplate(template)
    setShowForm(true)
  }

  const handleDeleteClick = async (template: AssessmentTemplate) => {
    if (
      !confirm(
        `Are you sure you want to delete "${template.title}"? This action cannot be undone.`
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/admin/templates/${template.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Template deleted successfully')
        await fetchTemplates()
      } else {
        let errorMessage = 'Failed to delete template'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // Use default error message
        }
        alert(errorMessage)
      }
    } catch (err) {
      alert('Failed to delete template')
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingTemplate(null)
  }

  const handleFormSave = async () => {
    await fetchTemplates()
  }

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const formatSubmissionType = (type: string) => {
    switch (type) {
      case 'TEXT':
        return 'Text Only'
      case 'FILE':
        return 'File Only'
      case 'BOTH':
        return 'Text and Files'
      case 'NONE':
        return 'No Submission'
      default:
        return type
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
            Assessment Template Library
          </h1>
          <p className="text-foreground-secondary">
            Manage reusable assessment templates (categories)
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-accent-orange" />
            Filters
          </CardTitle>
          <div className="text-sm text-foreground-secondary">
            Showing {templates.length} template{templates.length !== 1 ? 's' : ''}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type-filter" className="text-xs text-foreground-tertiary uppercase tracking-wide">
                Type
              </Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type-filter">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {ASSESSMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-xs text-foreground-tertiary uppercase tracking-wide">
                Status
              </Label>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVE_FILTERS.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileType className="h-5 w-5 text-accent-purple" />
            Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent-orange" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-foreground-tertiary mb-4">No templates found</p>
              <Button onClick={handleCreateClick}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Max Points</TableHead>
                  <TableHead>Submission Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="font-medium">{template.title}</div>
                      {template.description && (
                        <div className="text-sm text-foreground-tertiary truncate max-w-sm">
                          {template.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="purple">{formatType(template.type)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="info">{template.defaultMaxPoints}</Badge>
                    </TableCell>
                    <TableCell className="text-foreground-secondary">
                      {formatSubmissionType(template.defaultSubmissionType)}
                    </TableCell>
                    <TableCell>
                      {template.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="warning">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(template)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(template)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <AssessmentTemplateForm
          template={editingTemplate}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}
    </div>
  )
}
