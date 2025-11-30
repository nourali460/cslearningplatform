'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { ModuleItemRow } from './ModuleItemRow'

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
  items: ModuleItem[]
}

interface DraggableModuleItemsProps {
  module: Module
  items: ModuleItem[]
  onEdit?: (module: Module, item: ModuleItem) => void
  onDelete?: (moduleId: string, itemId: string, title: string) => void
  onReorder: (moduleId: string, itemIds: string[]) => Promise<void>
  role?: 'student' | 'professor' | 'admin'
  showCompletion?: boolean
}

interface SortableItemProps {
  id: string
  item: ModuleItem
  module: Module
  onEdit?: (module: Module, item: ModuleItem) => void
  onDelete?: (moduleId: string, itemId: string, title: string) => void
  role?: 'student' | 'professor' | 'admin'
  showCompletion?: boolean
}

function SortableItem({
  id,
  item,
  module,
  onEdit,
  onDelete,
  role,
  showCompletion,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 group">
      {/* Drag Handle - Only show for professor/admin */}
      {(role === 'professor' || role === 'admin') && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {/* Module Item Row */}
      <div className="flex-1">
        <ModuleItemRow
          item={item}
          onEdit={onEdit ? () => onEdit(module, item) : undefined}
          onDelete={onDelete ? () => onDelete(module.id, item.id, item.title) : undefined}
          role={role}
          showCompletion={showCompletion}
          completed={false}
        />
      </div>
    </div>
  )
}

export function DraggableModuleItems({
  module,
  items: initialItems,
  onEdit,
  onDelete,
  onReorder,
  role,
  showCompletion,
}: DraggableModuleItemsProps) {
  const [items, setItems] = useState(initialItems)
  const [isReordering, setIsReordering] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    const newItems = arrayMove(items, oldIndex, newIndex)
    setItems(newItems)

    // Persist the new order to the backend
    try {
      setIsReordering(true)
      const itemIds = newItems.map((item) => item.id)
      await onReorder(module.id, itemIds)
    } catch (error) {
      console.error('Error reordering items:', error)
      // Revert on error
      setItems(items)
      alert('Failed to reorder items. Please try again.')
    } finally {
      setIsReordering(false)
    }
  }

  // If items change externally, update local state
  if (JSON.stringify(initialItems.map(i => i.id)) !== JSON.stringify(items.map(i => i.id))) {
    setItems(initialItems)
  }

  const sortedItems = [...items].sort((a, b) => a.orderIndex - b.orderIndex)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sortedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {sortedItems.map((item) => (
            <SortableItem
              key={item.id}
              id={item.id}
              item={item}
              module={module}
              onEdit={onEdit}
              onDelete={onDelete}
              role={role}
              showCompletion={showCompletion}
            />
          ))}
        </div>
      </SortableContext>

      {isReordering && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Saving order...</span>
        </div>
      )}
    </DndContext>
  )
}
