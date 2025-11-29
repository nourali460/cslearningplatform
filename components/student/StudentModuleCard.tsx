'use client'

import { useState } from 'react'
import {
  Layers,
  FileText,
  ClipboardList,
  Link2,
  Lock,
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { PageContentModal } from './PageContentModal'

interface ModuleItem {
  id: string
  itemType: 'PAGE' | 'ASSESSMENT' | 'EXTERNAL_LINK'
  title: string
  orderIndex: number
  isPublished: boolean
  isRequired: boolean
  customDescription?: string | null
  assessment?: {
    id: string
    title: string
    type: string
    description: string | null
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

interface StudentModuleCardProps {
  module: Module
  classId: string
  onItemComplete: (itemId: string) => Promise<void>
}

export function StudentModuleCard({
  module,
  classId,
  onItemComplete,
}: StudentModuleCardProps) {
  const [isExpanded, setIsExpanded] = useState(!module.isLocked)
  const [completingItem, setCompletingItem] = useState<string | null>(null)
  const [pageModalOpen, setPageModalOpen] = useState(false)
  const [selectedPageItem, setSelectedPageItem] = useState<ModuleItem | null>(null)
  const router = useRouter()

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

  const handleItemClick = async (item: ModuleItem) => {
    if (module.isLocked) return

    if (item.itemType === 'ASSESSMENT' && item.assessment) {
      router.push(`/student/assignments/${item.assessment.id}`)
    } else if (item.itemType === 'EXTERNAL_LINK' && item.externalUrl) {
      window.open(item.externalUrl, '_blank')
      // Mark as complete
      await handleMarkComplete(item.id)
    } else if (item.itemType === 'PAGE') {
      // Open page content in modal
      setSelectedPageItem(item)
      setPageModalOpen(true)
    }
  }

  const handlePageModalClose = async () => {
    setPageModalOpen(false)
    // Mark as complete when modal is closed
    if (selectedPageItem) {
      await handleMarkComplete(selectedPageItem.id)
    }
    setSelectedPageItem(null)
  }

  const handleMarkComplete = async (itemId: string) => {
    setCompletingItem(itemId)
    try {
      await onItemComplete(itemId)
    } catch (error) {
      console.error('Error marking item complete:', error)
    } finally {
      setCompletingItem(null)
    }
  }

  return (
    <>
      {/* Page Content Modal */}
      {selectedPageItem && (
        <PageContentModal
          isOpen={pageModalOpen}
          onClose={handlePageModalClose}
          title={selectedPageItem.title}
          content={selectedPageItem.pageContent || 'No content available'}
        />
      )}

      <Card className={module.isLocked ? 'opacity-60' : ''}>
      <CardHeader className="bg-muted/30">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-5 w-5 text-accent-purple" />
              <h3 className="text-lg font-bold">{module.title}</h3>
              {module.isLocked && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Lock size={12} />
                  Locked
                </Badge>
              )}
              {module.isCompleted && (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle size={12} />
                  Completed
                </Badge>
              )}
            </div>
            {module.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {module.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                {module.completedItems} / {module.totalItems} items completed
              </span>
              <span>•</span>
              <span>{module.progress.toFixed(0)}% complete</span>
              {module.unlockAt && new Date(module.unlockAt) > new Date() && (
                <>
                  <span>•</span>
                  <span>
                    Unlocks: {new Date(module.unlockAt).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-3 w-full bg-muted rounded-full h-2">
              <div
                className="bg-accent-purple h-2 rounded-full transition-all"
                style={{ width: `${module.progress}%` }}
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={module.isLocked}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && !module.isLocked && (
        <CardContent className="pt-4">
          <div className="space-y-2">
            {module.items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items in this module yet
              </div>
            ) : (
              module.items
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((item) => {
                  const isCompleted = item.completions.length > 0

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors ${
                        isCompleted ? 'bg-success/5' : ''
                      }`}
                    >
                      {/* Completion Indicator */}
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>

                      {/* Item Icon */}
                      <div className="flex-shrink-0">
                        {getItemIcon(item.itemType)}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleItemClick(item)}
                            className="font-medium hover:underline text-left"
                          >
                            {item.title}
                          </button>
                          {!item.isRequired && (
                            <Badge variant="outline" className="text-xs">
                              Optional
                            </Badge>
                          )}
                          {item.itemType === 'ASSESSMENT' && item.assessment && (
                            <Badge variant="purple" className="text-xs">
                              {item.assessment.type}
                            </Badge>
                          )}
                        </div>

                        {/* Subtext */}
                        <div className="text-sm text-muted-foreground mt-1 space-y-1">
                          {item.itemType === 'ASSESSMENT' && item.assessment && (
                            <>
                              {/* Description preview for discussions */}
                              {item.assessment.type === 'DISCUSSION' && (item.customDescription || item.assessment.description) && (
                                <div className="line-clamp-2 text-purple-600">
                                  💬 {item.customDescription || item.assessment.description}
                                </div>
                              )}
                              {/* Due date */}
                              {item.assessment.dueAt && (
                                <div>
                                  Due: {new Date(item.assessment.dueAt).toLocaleString()}
                                </div>
                              )}
                            </>
                          )}
                      </div>

                      {/* Action Button */}
                      {item.itemType === 'EXTERNAL_LINK' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleItemClick(item)}
                          disabled={completingItem === item.id}
                        >
                          <ExternalLink size={16} />
                        </Button>
                      )}
                    </div>
                  )
                })
            )}
          </div>
        </CardContent>
      )}
    </Card>
    </>
  )
}
