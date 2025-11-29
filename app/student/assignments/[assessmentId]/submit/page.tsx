'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, FileText, Construction } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SubmitAssessmentPage() {
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
          <CardTitle className="text-2xl mb-2">Coming Soon: Lab Submission</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            The lab submission interface is currently under development.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            For now, please check with your instructor for alternative submission methods.
          </p>
          <Button
            onClick={() => router.push('/student/assignments')}
            variant="outline"
          >
            Return to Assignments
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
