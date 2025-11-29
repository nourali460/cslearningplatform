'use client'

import React, { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Check, GripVertical, Loader2, ArrowUp, ArrowDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

type AssessmentTemplate = {
  id: string
  title: string
  description: string | null
  type: string
  defaultMaxPoints: number | string
  defaultSubmissionType: string
  isActive: boolean
}

type SelectedTemplate = {
  templateId: string
  template: AssessmentTemplate
  orderIndex: number
}

type CourseData = {
  code: string
  title: string
  description: string
  subject: string
  level: string
}

type Props = {
  onClose: () => void
  onSave: () => void
}

export function CourseFactoryWizard({ onClose, onSave }: Props) {
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1: Course Info
  const [courseData, setCourseData] = useState<CourseData>({
    code: '',
    title: '',
    description: '',
    subject: '',
    level: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Step 2: Template Selection
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([])
  const [selectedTemplates, setSelectedTemplates] = useState<SelectedTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const response = await fetch('/api/admin/templates?active=true')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      } else {
        let errorMessage = response.statusText
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.details || errorMessage
        } catch {
          // Use default error message
        }
        alert(`Failed to fetch templates: ${errorMessage}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      alert(`Failed to fetch templates: ${message}`)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}

    if (!courseData.code.trim()) {
      newErrors.code = 'Course code is required'
    }
    if (!courseData.title.trim()) {
      newErrors.title = 'Course title is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return
    }
    setCurrentStep(currentStep + 1)
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleCourseDataChange = (field: keyof CourseData, value: string) => {
    setCourseData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleTemplateToggle = (template: AssessmentTemplate) => {
    const isSelected = selectedTemplates.some((st) => st.templateId === template.id)

    if (isSelected) {
      setSelectedTemplates((prev) => prev.filter((st) => st.templateId !== template.id))
    } else {
      setSelectedTemplates((prev) => [
        ...prev,
        {
          templateId: template.id,
          template,
          orderIndex: prev.length,
        },
      ])
    }
  }

  const moveTemplate = (index: number, direction: 'up' | 'down') => {
    const newTemplates = [...selectedTemplates]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newTemplates.length) return

    // Swap
    const temp = newTemplates[index]
    newTemplates[index] = newTemplates[targetIndex]
    newTemplates[targetIndex] = temp

    // Update orderIndex
    newTemplates.forEach((st, idx) => {
      st.orderIndex = idx
    })

    setSelectedTemplates(newTemplates)
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      // Create course
      const courseResponse = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      })

      if (!courseResponse.ok) {
        const error = await courseResponse.json()
        alert(`Failed to create course: ${error.error}`)
        setSaving(false)
        return
      }

      const { course } = await courseResponse.json()

      // Link templates to course
      if (selectedTemplates.length > 0) {
        const linkPromises = selectedTemplates.map((st) =>
          fetch('/api/admin/courses/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courseId: course.id,
              assessmentTemplateId: st.templateId,
              orderIndex: st.orderIndex,
            }),
          })
        )

        await Promise.all(linkPromises)
      }

      alert('Course created successfully!')
      onSave()
      onClose()
    } catch (error) {
      console.error('Error creating course:', error)
      alert('Failed to create course')
    } finally {
      setSaving(false)
    }
  }

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Course Factory</DialogTitle>
          <DialogDescription>
            Step {currentStep} of 3: {currentStep === 1 ? 'Basic Info' : currentStep === 2 ? 'Select Templates' : 'Review & Create'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="w-full bg-background-secondary rounded-full h-1">
            <div
              className="bg-accent-orange rounded-full h-1 transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>

          {/* Step 1: Course Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Basic Course Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Course Code <span className="text-error">*</span>
                  </Label>
                  <Input
                    id="code"
                    placeholder="e.g., CS101"
                    value={courseData.code}
                    onChange={(e) => handleCourseDataChange('code', e.target.value)}
                    className={errors.code ? 'border-error' : ''}
                  />
                  {errors.code && <p className="text-sm text-error">{errors.code}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Course Title <span className="text-error">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Introduction to Computer Science"
                    value={courseData.title}
                    onChange={(e) => handleCourseDataChange('title', e.target.value)}
                    className={errors.title ? 'border-error' : ''}
                  />
                  {errors.title && <p className="text-sm text-error">{errors.title}</p>}
                </div>
                <div className="col-span-full space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    placeholder="Course description (optional)"
                    value={courseData.description}
                    onChange={(e) => handleCourseDataChange('description', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Computer Science"
                    value={courseData.subject}
                    onChange={(e) => handleCourseDataChange('subject', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Input
                    id="level"
                    placeholder="e.g., 100, Introductory, Advanced"
                    value={courseData.level}
                    onChange={(e) => handleCourseDataChange('level', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Templates */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Select Assessment Templates</h3>
                <p className="text-foreground-secondary text-sm">
                  Choose reusable assessment templates to include in this course. You can customize them later.
                </p>
              </div>

              {loadingTemplates ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-accent-orange" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => {
                    const isSelected = selectedTemplates.some((st) => st.templateId === template.id)
                    return (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'border-accent-orange bg-accent-orange/5' : 'hover:border-border-secondary'
                        }`}
                        onClick={() => handleTemplateToggle(template)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground mb-1">{template.title}</h4>
                              <Badge variant="purple">{formatType(template.type)}</Badge>
                            </div>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleTemplateToggle(template)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {template.description && (
                            <p className="text-sm text-foreground-secondary mb-2">{template.description}</p>
                          )}
                          <div className="text-sm text-foreground-tertiary">
                            {template.defaultMaxPoints} points • {template.defaultSubmissionType}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              <Card className="bg-background-secondary">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-foreground">
                    Selected: {selectedTemplates.length} template{selectedTemplates.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Review & Reorder */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Review & Reorder</h3>

              {/* Course Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Course Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-sm font-medium text-foreground-secondary">Code:</dt>
                    <dd className="col-span-2 text-sm text-foreground">{courseData.code}</dd>
                    <dt className="text-sm font-medium text-foreground-secondary">Title:</dt>
                    <dd className="col-span-2 text-sm text-foreground">{courseData.title}</dd>
                    {courseData.description && (
                      <>
                        <dt className="text-sm font-medium text-foreground-secondary">Description:</dt>
                        <dd className="col-span-2 text-sm text-foreground">{courseData.description}</dd>
                      </>
                    )}
                    {courseData.subject && (
                      <>
                        <dt className="text-sm font-medium text-foreground-secondary">Subject:</dt>
                        <dd className="col-span-2 text-sm text-foreground">{courseData.subject}</dd>
                      </>
                    )}
                    {courseData.level && (
                      <>
                        <dt className="text-sm font-medium text-foreground-secondary">Level:</dt>
                        <dd className="col-span-2 text-sm text-foreground">{courseData.level}</dd>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Assessment Templates ({selectedTemplates.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTemplates.length === 0 ? (
                    <p className="text-foreground-tertiary text-sm">No templates selected</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedTemplates.map((st, index) => (
                        <div
                          key={st.templateId}
                          className="flex items-center justify-between p-3 border border-border rounded-lg bg-background hover:bg-background-secondary transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <GripVertical className="h-4 w-4 text-foreground-tertiary" />
                            <div>
                              <div className="font-medium text-foreground">{st.template.title}</div>
                              <div className="text-sm text-foreground-tertiary">
                                {formatType(st.template.type)} • {st.template.defaultMaxPoints} pts
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveTemplate(index, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveTemplate(index, 'down')}
                              disabled={index === selectedTemplates.length - 1}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {currentStep < 3 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button variant="success" onClick={handleCreate} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Course
                    <Check className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
