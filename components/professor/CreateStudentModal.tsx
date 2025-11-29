'use client'

import { useState } from 'react'
import { UserPlus, Mail, User, Hash, Copy, CheckCircle, AlertCircle } from 'lucide-react'
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

interface ProfessorClass {
  id: string
  classCode: string
  title: string
  course: {
    code: string
    title: string
  }
  term: string
  year: number
}

interface CreateStudentModalProps {
  classes: ProfessorClass[]
  onClose: () => void
  onSuccess: () => void
}

interface CreatedStudent {
  id: string
  email: string
  fullName: string | null
  schoolId: string | null
  password: string
}

export function CreateStudentModal({
  classes,
  onClose,
  onSuccess,
}: CreateStudentModalProps) {
  const [classId, setClassId] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [fullName, setFullName] = useState<string>('')
  const [schoolId, setSchoolId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdStudent, setCreatedStudent] = useState<CreatedStudent | null>(null)
  const [passwordCopied, setPasswordCopied] = useState(false)

  const selectedClass = classes.find((c) => c.id === classId)

  const handleCopyPassword = () => {
    if (createdStudent) {
      navigator.clipboard.writeText(createdStudent.password)
      setPasswordCopied(true)
      setTimeout(() => setPasswordCopied(false), 2000)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!classId) {
      setError('Please select a class')
      return
    }

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    if (!fullName || fullName.trim().length === 0) {
      setError('Please enter the student\'s full name')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch('/api/professor/students/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId,
          email: email.trim().toLowerCase(),
          fullName: fullName.trim() || null,
          schoolId: schoolId.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create student')
      }

      // Success! Show the created student with password
      setCreatedStudent(data.student)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (createdStudent) {
      onSuccess() // Refresh the students list
    }
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus size={20} />
            Create New Student
          </DialogTitle>
          <DialogDescription>
            Create a student account and enroll them in your class
          </DialogDescription>
        </DialogHeader>

        {createdStudent ? (
          /* Success View - Show Created Student and Password */
          <div className="space-y-4">
            <Card className="border-l-4 border-l-success bg-success/10">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-success mb-1">
                      Student Created Successfully!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      The student has been created and enrolled in {selectedClass?.classCode}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student Details */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-base font-semibold">{createdStudent.email}</p>
                </div>

                {createdStudent.fullName && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-base font-semibold">{createdStudent.fullName}</p>
                  </div>
                )}

                {createdStudent.schoolId && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">School ID</label>
                    <p className="text-base font-semibold">{createdStudent.schoolId}</p>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Generated Password
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xl font-bold text-accent-purple bg-accent-purple/10 px-4 py-3 rounded border-2 border-accent-purple/20 tracking-wider">
                      {createdStudent.password}
                    </code>
                    <Button
                      variant={passwordCopied ? 'default' : 'outline'}
                      size="lg"
                      onClick={handleCopyPassword}
                    >
                      {passwordCopied ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warning */}
            <Card className="border-l-4 border-l-warning bg-warning/10">
              <CardContent className="py-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                  <p className="text-sm">
                    <strong>Important:</strong> Make sure to copy and securely share this password
                    with the student. You can regenerate it later if needed from the Students page.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Button */}
            <div className="flex justify-end pt-4">
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Form View - Create Student */
          <div className="space-y-4">
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
              {/* Class Selection */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Hash size={16} />
                  Select Class <span className="text-error">*</span>
                </label>
                <Select value={classId} onValueChange={setClassId} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.classCode} - {cls.course.code} ({cls.term} {cls.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  The student will be automatically enrolled in this class
                </p>
              </div>

              {/* Email Input */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Mail size={16} />
                  Email Address <span className="text-error">*</span>
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be the student's login email
                </p>
              </div>

              {/* Full Name Input */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-1">
                  <User size={16} />
                  Full Name <span className="text-error">*</span>
                </label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* School ID Input */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Hash size={16} />
                  School ID <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  type="text"
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  placeholder="12345678"
                  disabled={isSubmitting}
                />
              </div>

              {/* Info Box */}
              <Card className="border-l-4 border-l-info bg-info/10">
                <CardContent className="py-3">
                  <p className="text-sm">
                    <strong>What happens next?</strong> A unique password will be automatically
                    generated for this student. You'll be able to copy it and share it with them
                    securely.
                  </p>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Student'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
