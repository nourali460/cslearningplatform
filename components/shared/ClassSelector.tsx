'use client'

import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface ClassOption {
  id: string
  courseCode: string
  courseTitle: string
  sectionNumber: string
  semester: string
  year: number
}

interface ClassSelectorProps {
  value: string
  onValueChange: (classId: string) => void
  required?: boolean
  label?: string
  placeholder?: string
}

export function ClassSelector({
  value,
  onValueChange,
  required = false,
  label = 'Class',
  placeholder = 'Select a class',
}: ClassSelectorProps) {
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/professor/classes')
      if (!response.ok) {
        throw new Error('Failed to load classes')
      }

      const data = await response.json()
      // Transform API response to match component interface
      setClasses((data.classes || []).map((cls: any) => ({
        id: cls.id,
        courseCode: cls.course.code,
        courseTitle: cls.course.title,
        sectionNumber: cls.section,
        semester: cls.term,
        year: cls.year,
      })))
    } catch (err) {
      console.error('Error loading classes:', err)
      setError('Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-md bg-muted/30">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading classes...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-md bg-red-50">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button
            onClick={loadClasses}
            className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (classes.length === 0) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-md bg-muted/30">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            No classes available
          </p>
          <p className="text-xs text-muted-foreground text-center max-w-sm">
            You need to have at least one class to create assessments. Please contact an administrator or create a class first.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="classId">
        {label} {required && <span className="text-error">*</span>}
      </Label>
      <Select value={value} onValueChange={onValueChange} required={required}>
        <SelectTrigger id="classId">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {classes.map((cls) => (
            <SelectItem key={cls.id} value={cls.id}>
              <div className="flex flex-col gap-0.5">
                <div className="font-medium">
                  {cls.courseCode} - {cls.courseTitle}
                </div>
                <div className="text-xs text-muted-foreground">
                  Section {cls.sectionNumber} • {cls.semester} {cls.year}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        💡 Assessments will be created for this specific class section
      </p>
    </div>
  )
}
