'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  courseId: string
  courseName: string
}

export function CourseTemplateButton({ courseId, courseName }: Props) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/admin/courses/${courseId}/templates`)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      title="Manage Templates"
    >
      <Settings className="h-3 w-3 mr-1" />
      Templates
    </Button>
  )
}
