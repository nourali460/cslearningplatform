'use client'

import { Layers, Pencil, Trash2, Plus, Eye, EyeOff, Lock, MoreVertical } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ModuleProgressBadge } from './ModuleCompletionBadge'
import { ModuleItemRow } from './ModuleItemRow'
import { cn } from '@/lib/utils'

interface ModuleItem {
  id: string
  title: string
  itemType: 'PAGE' | 'ASSESSMENT' | 'EXTERNAL_LINK'
  isPublished: boolean
  isRequired: boolean
  orderIndex: number
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

interface Module {
  id: string
  title: string
  description?: string | null
  orderIndex: number
  isPublished: boolean
  unlockAt?: Date | string | null
  items: ModuleItem[]
  _count?: {
    items: number
    completions?: number
  }
  completedItems?: number // For student view
}

interface ModuleAccordionProps {
  modules: Module[]
  onEditModule?: (module: Module) => void
  onDeleteModule?: (moduleId: string, title: string) => void
  onAddItem?: (module: Module) => void
  onEditItem?: (module: Module, item: ModuleItem) => void
  onDeleteItem?: (moduleId: string, itemId: string) => void
  role?: 'student' | 'professor' | 'admin'
  showCompletion?: boolean
}

export function ModuleAccordion({
  modules,
  onEditModule,
  onDeleteModule,
  onAddItem,
  onEditItem,
  onDeleteItem,
  role = 'professor',
  showCompletion = false
}: ModuleAccordionProps) {
  const handleDeleteModule = async (module: Module) => {
    if (!onDeleteModule) return
    if (!confirm(`Are you sure you want to delete "${module.title}"? This will also delete all items in this module.`)) {
      return
    }
    onDeleteModule(module.id, module.title)
  }

  const handleDeleteItem = async (moduleId: string, itemId: string, title: string) => {
    if (!onDeleteItem) return
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }
    onDeleteItem(moduleId, itemId)
  }

  const isModuleLocked = (unlockAt: Date | string | null | undefined) => {
    if (!unlockAt) return false
    return new Date(unlockAt) > new Date()
  }

  if (modules.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
        <Layers className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold">No modules yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by creating your first module
        </p>
      </div>
    )
  }

  return (
    <Accordion type="multiple" className="space-y-4">
      {modules
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((module) => {
          const locked = isModuleLocked(module.unlockAt)
          const completedItems = module.completedItems || 0
          const totalItems = module.items.length

          return (
            <AccordionItem
              key={module.id}
              value={module.id}
              className="border rounded-lg bg-white shadow-sm overflow-hidden"
            >
              <div className="relative">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                  <div className="flex items-center justify-between w-full pr-12">
                    <div className="flex items-center gap-3 flex-1">
                      <Layers className="h-5 w-5 text-accent-purple flex-shrink-0" />

                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold">{module.title}</h3>

                          {!module.isPublished && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <EyeOff size={12} />
                              Draft
                            </Badge>
                          )}

                          {locked && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Lock size={12} />
                              Locked
                            </Badge>
                          )}
                        </div>

                        {module.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {module.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>

                          {showCompletion && (
                            <>
                              <span>•</span>
                              <ModuleProgressBadge
                                completed={completedItems}
                                total={totalItems}
                              />
                            </>
                          )}

                          {module.unlockAt && (
                            <>
                              <span>•</span>
                              <span>
                                Unlocks: {new Date(module.unlockAt).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                {/* Module Actions (for professor/admin) - Positioned outside AccordionTrigger */}
                {(role === 'professor' || role === 'admin') && (onEditModule || onDeleteModule) && (
                  <div className="absolute right-12 top-4 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Module actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEditModule && (
                          <DropdownMenuItem onClick={() => onEditModule(module)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Module
                          </DropdownMenuItem>
                        )}
                        {onDeleteModule && (
                          <DropdownMenuItem
                            onClick={() => handleDeleteModule(module)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Module
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              <AccordionContent className="px-6 pb-4">
                <div className="space-y-2">
                  {/* Add Item Button (for professor/admin) */}
                  {(role === 'professor' || role === 'admin') && onAddItem && (
                    <Button
                      onClick={() => onAddItem(module)}
                      className="w-full"
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  )}

                  {/* Module Items */}
                  {module.items.length === 0 ? (
                    <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed">
                      <p className="text-sm text-muted-foreground">
                        No items in this module yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {module.items
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((item) => (
                          <ModuleItemRow
                            key={item.id}
                            item={item}
                            onEdit={onEditItem ? () => onEditItem(module, item) : undefined}
                            onDelete={onDeleteItem ? () => handleDeleteItem(module.id, item.id, item.title) : undefined}
                            role={role}
                            showCompletion={showCompletion}
                            completed={false} // TODO: Add actual completion tracking
                          />
                        ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
    </Accordion>
  )
}
