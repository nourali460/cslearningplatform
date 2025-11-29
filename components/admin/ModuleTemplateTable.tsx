'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Layers } from 'lucide-react'

interface ModuleTemplate {
  id: string
  title: string
  description?: string | null
  orderIndex: number
  isActive: boolean
  course: {
    id: string
    code: string
    title: string
  }
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
    } | null
    externalUrl?: string | null
    pageContent?: string | null
  }>
  createdAt: string
}

interface ModuleTemplateTableProps {
  templates: ModuleTemplate[]
  onEdit: (template: ModuleTemplate) => void
  onDelete: (id: string) => void
  onManageItems: (template: ModuleTemplate) => void
}

export function ModuleTemplateTable({
  templates,
  onEdit,
  onDelete,
  onManageItems,
}: ModuleTemplateTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return
    }

    setDeletingId(id)
    try {
      await onDelete(id)
    } catch (error) {
      console.error('Error deleting module template:', error)
      alert('Failed to delete module template')
    } finally {
      setDeletingId(null)
    }
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
        <Layers className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No module templates</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new module template.
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Module Title</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{template.title}</div>
                  {template.description && (
                    <div className="text-sm text-gray-500 line-clamp-1">
                      {template.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-mono text-sm">{template.course.code}</div>
                  <div className="text-sm text-gray-500 line-clamp-1">
                    {template.course.title}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {template.items.length} item{template.items.length !== 1 ? 's' : ''}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600">{template.orderIndex}</span>
              </TableCell>
              <TableCell>
                {template.isActive ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="default">Inactive</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onManageItems(template)}
                    title="Manage items"
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(template)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id, template.title)}
                    disabled={deletingId === template.id}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
