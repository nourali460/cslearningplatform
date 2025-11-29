'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, FileText, Link2, ClipboardList, GripVertical } from 'lucide-react'

interface ModuleItemTemplate {
  id: string
  itemType: string
  title: string
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
}

interface ModuleItemTemplateListProps {
  items: ModuleItemTemplate[]
  onEdit: (item: ModuleItemTemplate) => void
  onDelete: (id: string) => void
  onReorder?: (items: Array<{ id: string; orderIndex: number }>) => void
}

export function ModuleItemTemplateList({
  items,
  onEdit,
  onDelete,
  onReorder,
}: ModuleItemTemplateListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    setDeletingId(id)
    try {
      await onDelete(id)
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    } finally {
      setDeletingId(null)
    }
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'PAGE':
        return <FileText className="h-4 w-4" />
      case 'ASSESSMENT':
        return <ClipboardList className="h-4 w-4" />
      case 'EXTERNAL_LINK':
        return <Link2 className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getItemTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      PAGE: 'default',
      ASSESSMENT: 'purple',
      EXTERNAL_LINK: 'info',
    }

    return (
      <Badge variant={variants[type] as any} className="text-xs">
        {type.replace('_', ' ')}
      </Badge>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
        <ClipboardList className="mx-auto h-10 w-10 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No items</h3>
        <p className="mt-1 text-sm text-gray-500">
          Add pages, assessments, or external links to this module.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* Drag Handle */}
            {onReorder && (
              <button
                className="cursor-grab hover:bg-gray-100 rounded p-1"
                title="Drag to reorder"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </button>
            )}

            {/* Item Icon */}
            <div className="flex-shrink-0">{getItemIcon(item.itemType)}</div>

            {/* Item Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.title}</span>
                {getItemTypeBadge(item.itemType)}
                {!item.isPublished && <Badge variant="default">Draft</Badge>}
                {!item.isRequired && <Badge variant="outline">Optional</Badge>}
              </div>

              {/* Subtext */}
              <div className="text-sm text-gray-500 mt-1">
                {item.itemType === 'ASSESSMENT' && item.assessmentTemplate && (
                  <div>
                    <div>
                      Assessment: {item.assessmentTemplate.title} ({item.assessmentTemplate.type})
                    </div>
                    {(item.customDescription || item.assessmentTemplate.description) && (
                      <div className={`text-xs mt-1 line-clamp-2 ${item.assessmentTemplate.type === 'DISCUSSION' ? 'text-purple-600' : 'text-gray-500'}`}>
                        {item.assessmentTemplate.type === 'DISCUSSION' && '💬 '}
                        {item.customDescription && item.customDescription !== item.assessmentTemplate.description && '✏️ '}
                        {item.customDescription || item.assessmentTemplate.description}
                      </div>
                    )}
                  </div>
                )}
                {item.itemType === 'EXTERNAL_LINK' && item.externalUrl && (
                  <span className="truncate block">{item.externalUrl}</span>
                )}
                {item.itemType === 'PAGE' && item.pageContent && (
                  <span className="line-clamp-1">
                    {item.pageContent.substring(0, 100)}...
                  </span>
                )}
              </div>
            </div>

            {/* Order Badge */}
            <div className="flex-shrink-0">
              <span className="text-xs text-gray-500">#{item.orderIndex}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(item)}
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(item.id, item.title)}
                disabled={deletingId === item.id}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
    </div>
  )
}
