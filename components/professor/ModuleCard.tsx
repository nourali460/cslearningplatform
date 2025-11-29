'use client'

import { useState } from 'react'
import {
  Layers,
  FileText,
  ClipboardList,
  Link2,
  Pencil,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

interface ModuleCardProps {
  module: Module
  onEdit: () => void
  onDelete: () => void
  onManageItems: () => void
}

export function ModuleCard({
  module,
  onEdit,
  onDelete,
  onManageItems,
}: ModuleCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)

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
    const variants: Record<string, any> = {
      PAGE: 'default',
      ASSESSMENT: 'purple',
      EXTERNAL_LINK: 'info',
    }

    return (
      <Badge variant={variants[type]} className="text-xs">
        {type.replace('_', ' ')}
      </Badge>
    )
  }

  const isLocked =
    module.unlockAt && new Date(module.unlockAt) > new Date()

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-5 w-5 text-accent-purple" />
              <h3 className="text-lg font-bold">{module.title}</h3>
              {!module.isPublished && (
                <Badge variant="default" className="flex items-center gap-1">
                  <EyeOff size={12} />
                  Draft
                </Badge>
              )}
              {isLocked && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Lock size={12} />
                  Locked
                </Badge>
              )}
            </div>
            {module.description && (
              <p className="text-sm text-muted-foreground">
                {module.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>Order: {module.orderIndex}</span>
              <span>•</span>
              <span>{module.items.length} items</span>
              {module.unlockAt && (
                <>
                  <span>•</span>
                  <span>
                    Unlocks:{' '}
                    {new Date(module.unlockAt).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              title="Edit module"
            >
              <Pencil size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              title="Delete module"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-4">
          <div className="space-y-2">
            {/* Manage Items Button */}
            <Button
              onClick={onManageItems}
              className="w-full"
              variant="outline"
              size="sm"
            >
              <Layers className="h-4 w-4 mr-2" />
              Manage Items ({module.items.length})
            </Button>

            {/* Module Items Preview */}
            {module.items.length === 0 ? (
              <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed">
                <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground" />
                <h4 className="mt-2 text-sm font-semibold">No items yet</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Click Manage Items to add pages, assessments, or links
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {module.items
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .slice(0, 3)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 bg-background border rounded text-sm"
                    >
                      <div className="flex-shrink-0">
                        {getItemIcon(item.itemType)}
                      </div>
                      <span className="flex-1 truncate">{item.title}</span>
                      {getItemTypeBadge(item.itemType)}
                      {!item.isPublished && (
                        <Badge variant="default" className="text-xs">Draft</Badge>
                      )}
                    </div>
                  ))}
                {module.items.length > 3 && (
                  <div className="text-center py-1 text-sm text-muted-foreground">
                    +{module.items.length - 3} more items
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
