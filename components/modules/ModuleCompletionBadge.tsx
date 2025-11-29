'use client'

import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModuleCompletionBadgeProps {
  completed: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ModuleCompletionBadge({
  completed,
  className,
  size = 'md'
}: ModuleCompletionBadgeProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return completed ? (
    <CheckCircle2
      className={cn(
        'text-green-600',
        sizeClasses[size],
        className
      )}
    />
  ) : (
    <Circle
      className={cn(
        'text-gray-300',
        sizeClasses[size],
        className
      )}
    />
  )
}

interface ModuleProgressBadgeProps {
  completed: number
  total: number
  className?: string
}

export function ModuleProgressBadge({
  completed,
  total,
  className
}: ModuleProgressBadgeProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  const isComplete = completed === total && total > 0

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <ModuleCompletionBadge completed={isComplete} size="sm" />
      <span className="text-sm text-muted-foreground">
        {completed}/{total} completed
        {percentage > 0 && ` (${percentage}%)`}
      </span>
    </div>
  )
}
