'use client'

import { FileText, ClipboardList, Link2, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ModuleCompletionBadge } from './ModuleCompletionBadge'
import { cn } from '@/lib/utils'

interface ModuleItemRowProps {
  item: {
    id: string
    title: string
    itemType: 'PAGE' | 'ASSESSMENT' | 'EXTERNAL_LINK'
    isPublished: boolean
    isRequired: boolean
    assessment?: {
      id: string
      title: string
      type: string
      maxPoints?: number
      dueAt?: Date | string | null
    } | null
    externalUrl?: string | null
    pageContent?: string | null
  }
  onEdit?: () => void
  onDelete?: () => void
  showCompletion?: boolean
  completed?: boolean
  role?: 'student' | 'professor' | 'admin'
}

export function ModuleItemRow({
  item,
  onEdit,
  onDelete,
  showCompletion = false,
  completed = false,
  role = 'professor'
}: ModuleItemRowProps) {
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'PAGE':
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'ASSESSMENT':
        return <ClipboardList className="h-4 w-4 text-purple-600" />
      case 'EXTERNAL_LINK':
        return <Link2 className="h-4 w-4 text-green-600" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getItemTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      PAGE: 'default',
      ASSESSMENT: 'purple',
      EXTERNAL_LINK: 'info',
    }

    const labels: Record<string, string> = {
      PAGE: 'Page',
      ASSESSMENT: 'Assessment',
      EXTERNAL_LINK: 'Link',
    }

    return (
      <Badge variant={variants[type]} className="text-xs">
        {labels[type]}
      </Badge>
    )
  }

  const formatDueDate = (date: Date | string | null | undefined) => {
    if (!date) return null
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const dueDate = item.assessment?.dueAt ? formatDueDate(item.assessment.dueAt) : null
  const points = item.assessment?.maxPoints

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 border-l-4 rounded-lg transition-colors',
        item.itemType === 'PAGE' && 'border-l-blue-600 hover:bg-blue-50',
        item.itemType === 'ASSESSMENT' && 'border-l-purple-600 hover:bg-purple-50',
        item.itemType === 'EXTERNAL_LINK' && 'border-l-green-600 hover:bg-green-50',
        !item.isPublished && 'bg-gray-50'
      )}
    >
      {/* Completion Indicator (for students) */}
      {showCompletion && (
        <div className="flex-shrink-0">
          <ModuleCompletionBadge completed={completed} size="sm" />
        </div>
      )}

      {/* Item Icon */}
      <div className="flex-shrink-0">
        {getItemIcon(item.itemType)}
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            'font-medium',
            !item.isPublished && 'text-gray-500'
          )}>
            {item.title}
          </span>
          {getItemTypeBadge(item.itemType)}
          {!item.isPublished && (
            <Badge variant="default" className="text-xs">Unpublished</Badge>
          )}
          {item.isRequired && (
            <Badge variant="destructive" className="text-xs">Required</Badge>
          )}
        </div>

        {/* Subtext: Assessment details or URL */}
        {item.itemType === 'ASSESSMENT' && item.assessment && (
          <div className="text-sm text-muted-foreground mt-1">
            {item.assessment.type.replace('_', ' ')}
            {dueDate && <span> • Due {dueDate}</span>}
            {points !== undefined && <span> • {points} pts</span>}
          </div>
        )}
        {item.itemType === 'EXTERNAL_LINK' && item.externalUrl && (
          <div className="text-sm text-muted-foreground mt-1 truncate">
            {item.externalUrl}
          </div>
        )}
      </div>

      {/* Points Badge (for assessments) */}
      {item.itemType === 'ASSESSMENT' && points !== undefined && (
        <div className="flex-shrink-0">
          <Badge variant="outline" className="text-xs">
            {points} pts
          </Badge>
        </div>
      )}

      {/* Actions Menu (for professor/admin) */}
      {(role === 'professor' || role === 'admin') && (onEdit || onDelete) && (
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
