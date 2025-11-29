'use client'

import { useState, useEffect } from 'react'
import { Calendar, Hash, BookOpen, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Course {
  id: string
  code: string
  title: string
  description: string | null
  subject: string | null
  level: string | null
}

interface ProfessorClass {
  id: string
  course: {
    id: string
  }
  term: string
  year: number
  section: string | null
}

interface CreateClassModalProps {
  course: Course
  professorSchoolId: string
  existingClasses: ProfessorClass[]
  onClose: () => void
  onSuccess: () => void
}

const TERMS = ['Fall', 'Spring', 'Summer', 'Winter'] as const
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR + i)

export function CreateClassModal({
  course,
  professorSchoolId,
  existingClasses,
  onClose,
  onSuccess,
}: CreateClassModalProps) {
  const [term, setTerm] = useState<string>('')
  const [year, setYear] = useState<number>(CURRENT_YEAR)
  const [section, setSection] = useState<string>('1')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [classCodePreview, setClassCodePreview] = useState<string>('')
  const [isDuplicate, setIsDuplicate] = useState(false)

  // Generate class code preview and check for duplicates
  useEffect(() => {
    if (term && year && section && /^\d{1,2}$/.test(section)) {
      const termAbbr: Record<string, string> = {
        Fall: 'FA',
        Spring: 'SP',
        Summer: 'SU',
        Winter: 'WI',
      }
      const yearShort = year.toString().slice(-2)
      const sectionPadded = section.padStart(2, '0')
      const preview = `${professorSchoolId}-${course.code}-${termAbbr[term]}${yearShort}-${sectionPadded}`
      setClassCodePreview(preview.toUpperCase())

      // Check if this combination already exists
      const duplicate = existingClasses.some(
        (cls) =>
          cls.course.id === course.id &&
          cls.term === term &&
          cls.year === year &&
          cls.section?.padStart(2, '0') === sectionPadded
      )
      setIsDuplicate(duplicate)

      if (duplicate) {
        setError(
          `You already created this class (${course.code} - ${term} ${year}, Section ${sectionPadded}). Each course/term/year/section combination can only be created once.`
        )
      } else {
        setError(null)
      }
    } else {
      setClassCodePreview('')
      setIsDuplicate(false)
      setError(null)
    }
  }, [term, year, section, professorSchoolId, course.code, course.id, existingClasses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check for duplicate before submitting
    if (isDuplicate) {
      setError(
        `You already created this class (${course.code} - ${term} ${year}, Section ${section.padStart(2, '0')}). Each course/term/year/section combination can only be created once.`
      )
      return
    }

    setError(null)

    // Validation
    if (!term) {
      setError('Please select a term')
      return
    }

    if (!section || !/^\d{1,2}$/.test(section)) {
      setError('Section must be a 1-2 digit number')
      return
    }

    const sectionNum = parseInt(section, 10)
    if (sectionNum < 1 || sectionNum > 99) {
      setError('Section must be between 1 and 99')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch('/api/professor/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id,
          term,
          year,
          section,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create class')
      }

      // Success!
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen size={20} />
            Create New Class
          </DialogTitle>
          <DialogDescription>
            {course.code} - {course.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Course Info Card */}
          <Card className="bg-muted">
            <CardContent className="pt-6">
              <div>
                <Badge variant="purple" className="mb-2">{course.code}</Badge>
                <h3 className="font-bold mb-1">{course.title}</h3>
                {course.subject && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {course.subject}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {course.description || 'No description available.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Error Alert */}
          {error && (
            <Card className="border-l-4 border-l-error bg-error/10">
              <CardContent className="py-3">
                <p className="text-sm text-error">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Term Selection */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Calendar size={16} />
                  Term <span className="text-error">*</span>
                </label>
                <Select value={term} onValueChange={setTerm} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TERMS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Selection */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Calendar size={16} />
                  Year <span className="text-error">*</span>
                </label>
                <Select value={year.toString()} onValueChange={(val) => setYear(parseInt(val, 10))} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Section Input */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Hash size={16} />
                  Section <span className="text-error">*</span>
                </label>
                <Input
                  type="number"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g., 1"
                  min="1"
                  max="99"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-1">1-2 digit number (1-99)</p>
              </div>
            </div>

            {/* Class Code Preview */}
            {classCodePreview && (
              <Card className="border-l-4 border-l-accent-purple">
                <CardContent className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-accent-purple font-bold mb-1 flex items-center gap-2">
                        <Hash size={18} />
                        Class Code Preview
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Students will use this code to enroll in your class
                      </p>
                    </div>
                    <div>
                      <Badge variant="solid-purple" className="text-lg px-4 py-2 font-mono">
                        {classCodePreview}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Box */}
            <Card className="border-l-4 border-l-info bg-info/10">
              <CardContent className="py-3">
                <p className="text-sm">
                  <strong>What happens next?</strong> When you create this class, a unique class code
                  will be generated. Share this code with your students so they can enroll.
                </p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isDuplicate}
              >
                {isSubmitting ? 'Creating...' : 'Create Class'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
