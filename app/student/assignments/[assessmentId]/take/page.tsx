'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, ClipboardList, Construction } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TakeAssessmentPage() {
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
                {assessment.type === 'QUIZ' ? '❓' : '📝'} {assessment.title}
              </>
            ) : (
              'Assessment'
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
              {assessment?.type === 'QUIZ' ? (
                <>
                  <strong>Quiz</strong> - This feature will allow you to answer multiple-choice, short-answer, and coding questions with automatic grading and instant feedback upon submission.
                </>
              ) : assessment?.type === 'EXAM' ? (
                <>
                  <strong>Exam</strong> - This feature will provide a timed, proctored exam interface with various question types including multiple-choice, essays, and coding problems. Includes time tracking and secure submission.
                </>
              ) : (
                <>
                  <strong>{assessment?.type}</strong> - This assessment interface is under development.
                </>
              )}
            </p>
          </div>

          <p className="text-muted-foreground">
            This assessment type is currently under development. Please contact your instructor for the {assessment?.type === 'QUIZ' ? 'quiz link' : assessment?.type === 'EXAM' ? 'exam instructions and location' : 'assessment details'} or alternative format.
          </p>

          {assessment?.description && (
            <div className="text-left bg-background-secondary/30 p-4 rounded-lg">
              <p className="text-sm font-semibold mb-2">Assessment Description:</p>
              <p className="text-sm text-muted-foreground">{assessment.description}</p>
            </div>
          )}

          <div className="flex gap-2 justify-center text-sm text-muted-foreground">
            {assessment?.maxPoints && (
              <span>Points: <strong>{assessment.maxPoints}</strong></span>
            )}
            {assessment?.allowMultipleAttempts && (
              <>
                <span>•</span>
                <span>Attempts: <strong>{assessment.maxAttempts || 'Unlimited'}</strong></span>
              </>
            )}
          </div>

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
