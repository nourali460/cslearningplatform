'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CourseFactoryWizard } from './CourseFactoryWizard'

type Props = {
  onCourseCreated?: () => void
}

export function CoursesPageActions({ onCourseCreated }: Props) {
  const [showWizard, setShowWizard] = useState(false)

  const handleCreate = () => {
    setShowWizard(true)
  }

  const handleClose = () => {
    setShowWizard(false)
  }

  const handleSave = () => {
    if (onCourseCreated) {
      onCourseCreated()
    }
    // Reload page to show new course
    window.location.reload()
  }

  return (
    <>
      <Button onClick={handleCreate}>
        <Plus className="h-4 w-4 mr-2" />
        Create Course
      </Button>

      {showWizard && <CourseFactoryWizard onClose={handleClose} onSave={handleSave} />}
    </>
  )
}
