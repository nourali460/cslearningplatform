'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'

export default function EnrollPage() {
  const router = useRouter()
  const [classCode, setClassCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    title: string
    courseCode: string
    professorName: string
    term: string
    year: number
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await fetch('/api/enrollments/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classCode: classCode.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to enroll in class')
        return
      }

      // Success!
      setSuccess({
        title: data.enrollment.class.title,
        courseCode: data.enrollment.class.course.code,
        professorName: data.enrollment.class.professor.fullName,
        term: data.enrollment.class.term,
        year: data.enrollment.class.year,
      })
      setClassCode('')
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Enrollment error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/student">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Enroll in a Class</h1>
        <p className="text-muted-foreground mt-2">
          Enter the class code provided by your professor to join a class.
        </p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Class Enrollment Code</CardTitle>
            <CardDescription>
              Class codes are unique identifiers for each class section. Your
              professor will provide this code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-green-100 p-1">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900">
                        Successfully Enrolled!
                      </h3>
                      <p className="mt-1 text-sm text-green-800">
                        You have been enrolled in the following class:
                      </p>
                      <div className="mt-3 space-y-1 text-sm text-green-900">
                        <p className="font-medium">{success.title}</p>
                        <p>
                          {success.courseCode} • {success.term} {success.year}
                        </p>
                        <p>Professor: {success.professorName}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => router.push('/student')}>
                    Go to Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSuccess(null)
                      setError(null)
                    }}
                  >
                    Enroll in Another Class
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="classCode">Class Code</Label>
                  <Input
                    id="classCode"
                    type="text"
                    placeholder="e.g., CSLEARN-CS101-FA25-01"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    disabled={loading}
                    required
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    Class codes are case-sensitive. Please enter exactly as provided.
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm font-medium text-red-900">{error}</p>
                  </div>
                )}

                <Button type="submit" disabled={loading || !classCode.trim()}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? 'Enrolling...' : 'Enroll in Class'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Where do I find my class code?</strong>
              <br />
              Your professor will provide the class code via email, on your course
              syllabus, or through your learning management system.
            </p>
            <p>
              <strong>What if my code doesn't work?</strong>
              <br />
              Double-check that you entered the code exactly as provided (codes are
              case-sensitive). If you continue to have issues, contact your
              professor.
            </p>
            <p>
              <strong>Can I enroll in multiple classes?</strong>
              <br />
              Yes! After successfully enrolling, you can use the "Enroll in Another
              Class" button to add more classes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
