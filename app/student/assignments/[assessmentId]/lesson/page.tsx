'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, BookOpen, Construction } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params?.assessmentId as string

  const [loading, setLoading] = useState(true)
  const [assessment, setAssessment] = useState<any>(null)

  useEffect(() => {
    if (assessmentId) {
      fetchAssessment()
    }
  }, [assessmentId])

  const fetchAssessment = async () => {
    try {
      const response = await fetch(`/api/student/assessments/${assessmentId}`)
      if (response.ok) {
        const data = await response.json()
        setAssessment(data.assessment)
      }
    } catch (error) {
      console.error('Error fetching assessment:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent-purple" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => router.push(`/student/assignments/${assessmentId}`)}
        className="mb-4"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Assignment
      </Button>

      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-warning/10 rounded-full">
              <Construction className="h-12 w-12 text-warning" />
            </div>
          </div>
          <CardTitle className="text-2xl mb-2">
            {assessment ? (
              <>
                📖 {assessment.title}
              </>
            ) : (
              '📖 Interactive Lesson'
            )}
          </CardTitle>
          {assessment?.dueAt && (
            <p className="text-sm text-muted-foreground">
              Due: {new Date(assessment.dueAt).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="font-semibold mb-2">🚧 Feature Under Development</p>
            <p className="text-sm text-muted-foreground">
              <strong>Interactive Lesson</strong> - This feature allows you to complete guided learning modules with interactive elements, embedded videos, code demonstrations, and knowledge checks.
            </p>
          </div>

          <p className="text-muted-foreground">
            This assessment type is currently under development. Please contact your instructor for alternative learning materials or resources.
          </p>

          {assessment?.description && (
            <div className="text-left bg-background-secondary/30 p-4 rounded-lg">
              <p className="text-sm font-semibold mb-2">Assignment Description:</p>
              <p className="text-sm text-muted-foreground">{assessment.description}</p>
            </div>
          )}

          <div className="flex gap-3 justify-center pt-4">
            <Button
              onClick={() => router.push(`/student/assignments/${assessmentId}`)}
              variant="outline"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Assignment
            </Button>
            <Button
              onClick={() => router.push('/student/assignments')}
            >
              Return to All Assignments
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
