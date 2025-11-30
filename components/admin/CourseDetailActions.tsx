'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Layers, Award } from 'lucide-react'
import { QuickModuleForm } from './QuickModuleForm'
import { QuickAssessmentTemplateForm } from './QuickAssessmentTemplateForm'

interface CourseDetailActionsProps {
  courseId: string
  type: 'module' | 'template'
}

export function CourseDetailActions({ courseId, type }: CourseDetailActionsProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  const handleSuccess = () => {
    router.refresh() // Reload server component data
  }

  if (type === 'module') {
    return (
      <>
        <Button onClick={() => setShowModal(true)}>
          <Layers className="h-4 w-4 mr-2" />
          Create Module
        </Button>
        <QuickModuleForm
          open={showModal}
          onOpenChange={setShowModal}
          courseId={courseId}
          onSuccess={handleSuccess}
        />
      </>
    )
  }

  return (
    <>
      <Button onClick={() => setShowModal(true)}>
        <Award className="h-4 w-4 mr-2" />
        Create Template
      </Button>
      <QuickAssessmentTemplateForm
        open={showModal}
        onOpenChange={setShowModal}
        courseId={courseId}
        onSuccess={handleSuccess}
      />
    </>
  )
}
