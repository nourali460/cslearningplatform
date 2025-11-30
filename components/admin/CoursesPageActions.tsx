'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleCourseCreateModal } from './SimpleCourseCreateModal'

type Props = {
  onCourseCreated?: () => void
}

export function CoursesPageActions({ onCourseCreated }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Button onClick={() => setShowModal(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Create Course
      </Button>

      <SimpleCourseCreateModal
        open={showModal}
        onOpenChange={setShowModal}
      />
    </>
  )
}
