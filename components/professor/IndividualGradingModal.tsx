'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, FileText, Clock, Loader2, User, Calendar, Award, Mail, Hash } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Submission = {
  id: string
  submittedAt: string
  totalScore: number | null
  status: string
  isLate: boolean
  student: {
    id: string
    fullName: string | null
    email: string
    usernameSchoolId: string | null
  }
  assessment: {
    id: string
    title: string
    type: string
    maxPoints: number
    dueAt: string | null
  }
  submissionText: string | null
  submissionFiles: any
  feedback: string | null
}

type RubricCriterion = {
  id: string
  title: string
  description: string | null
  maxPoints: number
  orderIndex: number
}

type Rubric = {
  id: string
  title: string
  description: string | null
  criteria: RubricCriterion[]
}

type SubmissionDetail = Submission & {
  assessment: Submission['assessment'] & {
    rubric: Rubric | null
  }
}

type Props = {
  submission: Submission
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
  onSave: () => void
  hasNext: boolean
  hasPrevious: boolean
}

export function IndividualGradingModal({
  submission,
  onClose,
  onNext,
  onPrevious,
  onSave,
  hasNext,
  hasPrevious,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submissionDetail, setSubmissionDetail] = useState<SubmissionDetail | null>(null)
  const [manualScore, setManualScore] = useState<string>('')
  const [feedback, setFeedback] = useState<string>('')
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchSubmissionDetail()
  }, [submission.id])

  const fetchSubmissionDetail = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/professor/submissions/${submission.id}`)
      if (response.ok) {
        const data = await response.json()
        setSubmissionDetail(data.submission)
        setManualScore(data.submission.totalScore?.toString() || '')
        setFeedback(data.submission.feedback || '')

        // Initialize rubric scores if rubric exists
        if (data.submission.assessment.rubric) {
          const scores: Record<string, number> = {}
          data.submission.assessment.rubric.criteria.forEach((criterion: RubricCriterion) => {
            scores[criterion.id] = 0
          })
          setRubricScores(scores)
        }
      }
    } catch (error) {
      console.error('Error fetching submission detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!submissionDetail) return

    setSaving(true)
    try {
      const finalScore = submissionDetail.assessment.rubric
        ? Object.values(rubricScores).reduce((sum, score) => sum + score, 0)
        : Number(manualScore)

      const response = await fetch(`/api/professor/submissions/${submission.id}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manualScore: finalScore,
          feedback: feedback,
        }),
      })

      if (response.ok) {
        onSave()
        alert('Grade saved successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to save grade: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving grade:', error)
      alert('Failed to save grade')
    } finally {
      setSaving(false)
    }
  }

  const handleRubricScoreChange = (criterionId: string, score: number) => {
    setRubricScores((prev) => ({
      ...prev,
      [criterionId]: score,
    }))
  }

  const totalRubricScore = Object.values(rubricScores).reduce((sum, score) => sum + score, 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'GRADED':
        return <Badge variant="success">Graded</Badge>
      case 'SUBMITTED':
        return <Badge variant="warning">Pending</Badge>
      case 'DRAFT':
        return <Badge>Draft</Badge>
      case 'RETURNED':
        return <Badge variant="info">Returned</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading || !submissionDetail) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-sm !w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-center text-base">Loading Submission</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent-purple to-accent-orange opacity-20 animate-pulse"></div>
              <Loader2 className="h-10 w-10 animate-spin text-accent-purple relative z-10" />
            </div>
            <p className="text-xs text-muted-foreground">Please wait...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="!max-w-[85vw] !w-[85vw] !h-[88vh] flex flex-col p-0 overflow-hidden sm:!max-w-[85vw] md:!max-w-[85vw] lg:!max-w-[85vw] gap-0">
        {/* Hidden title for accessibility */}
        <DialogHeader className="sr-only">
          <DialogTitle>{submissionDetail.assessment.title}</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="px-7 py-4 border-b border-border/40 bg-gradient-to-br from-accent-purple/[0.03] via-background to-accent-orange/[0.02] shrink-0">
          <div className="flex items-start justify-between mb-3.5">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-accent-purple/10 to-accent-purple/5 shadow-sm ring-1 ring-accent-purple/10">
                  <FileText className="h-5 w-5 text-accent-purple" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-foreground tracking-tight">
                    {submissionDetail.assessment.title}
                  </h2>
                  <div className="flex items-center gap-2.5 mt-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {submissionDetail.assessment.type.replace('_', ' ')}
                    </span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-xs font-semibold text-accent-purple">
                      {submissionDetail.assessment.maxPoints} points
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                disabled={!hasPrevious}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onNext}
                disabled={!hasNext}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Student Info Bar */}
          <div className="flex items-center flex-wrap gap-4 text-sm bg-card/40 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-border/30">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-accent-purple/10">
                <User className="h-3 w-3 text-accent-purple" />
              </div>
              <span className="font-semibold text-foreground text-sm">
                {submissionDetail.student.fullName || submissionDetail.student.email}
              </span>
            </div>
            <div className="h-3 w-px bg-border/50"></div>
            <div className="flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-muted-foreground/70" />
              <span className="text-muted-foreground text-xs">{submissionDetail.student.email}</span>
            </div>
            {submissionDetail.student.usernameSchoolId && (
              <>
                <div className="h-3 w-px bg-border/50"></div>
                <div className="flex items-center gap-1.5">
                  <Hash className="h-3 w-3 text-muted-foreground/70" />
                  <span className="text-muted-foreground text-xs">{submissionDetail.student.usernameSchoolId}</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-2.5 ml-auto flex-wrap">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-muted-foreground/70" />
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {new Date(submissionDetail.submittedAt).toLocaleString()}
                </span>
              </div>
              {submissionDetail.isLate && (
                <Badge variant="warning" className="shadow-sm">
                  <Clock className="h-3 w-3 mr-1" />
                  Late
                </Badge>
              )}
              {getStatusBadge(submissionDetail.status)}
            </div>
          </div>
        </div>

        {/* Body - Two Column Layout */}
        <div className="flex-1 overflow-hidden flex min-h-0 bg-gradient-to-br from-background via-muted/5 to-background">
          {/* Left: Submission Content */}
          <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-5 w-0.5 rounded-full bg-gradient-to-b from-accent-purple to-accent-orange"></div>
                <h3 className="text-base font-semibold text-foreground">Submission Content</h3>
              </div>

              {submissionDetail.submissionText ? (
                <div className="rounded-xl border border-border/40 bg-card shadow-sm p-6 hover:shadow-md transition-shadow">
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {submissionDetail.submissionText}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-border/30 bg-muted/20 p-8 text-center">
                  <div className="inline-flex p-3 rounded-xl bg-muted/50 mb-3">
                    <FileText className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No text submission provided</p>
                </div>
              )}

              {submissionDetail.submissionFiles && Array.isArray(submissionDetail.submissionFiles) && submissionDetail.submissionFiles.length > 0 && (
                <div className="mt-5 space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attached Files</h4>
                  <div className="space-y-2">
                    {submissionDetail.submissionFiles.map((file: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card hover:border-accent-purple/40 hover:bg-accent-purple/[0.02] transition-all shadow-sm hover:shadow-md group"
                      >
                        <div className="p-2 rounded-lg bg-gradient-to-br from-accent-purple/10 to-accent-purple/5 group-hover:from-accent-purple/15 group-hover:to-accent-purple/10 transition-all">
                          <FileText className="h-4 w-4 text-accent-purple" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{file.filename || `File ${idx + 1}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Grading Sidebar */}
          <div className="w-[440px] border-l border-border/40 bg-gradient-to-br from-muted/20 via-muted/10 to-background overflow-y-auto px-6 py-5 space-y-5">
            {/* Grading Section */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-purple/10 to-accent-purple/5 shadow-sm">
                  <Award className="h-4 w-4 text-accent-purple" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Grading</h3>
              </div>

              {submissionDetail.assessment.rubric ? (
                // Rubric Grading
                <div className="space-y-3.5">
                  <div className="rounded-lg border border-border/40 bg-card/60 backdrop-blur-sm p-3.5 shadow-sm">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      {submissionDetail.assessment.rubric.title}
                    </p>
                    {submissionDetail.assessment.rubric.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {submissionDetail.assessment.rubric.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {submissionDetail.assessment.rubric.criteria.map((criterion) => (
                      <div
                        key={criterion.id}
                        className="rounded-lg border border-border/40 bg-card/60 backdrop-blur-sm p-3.5 space-y-2.5 hover:border-accent-purple/40 hover:shadow-md transition-all group"
                      >
                        <div>
                          <label className="text-sm font-semibold text-foreground block">
                            {criterion.title}
                          </label>
                          {criterion.description && (
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {criterion.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Input
                            type="number"
                            min="0"
                            max={criterion.maxPoints}
                            step="0.5"
                            value={rubricScores[criterion.id] || 0}
                            onChange={(e) => handleRubricScoreChange(criterion.id, Number(e.target.value))}
                            className="w-20 text-center font-bold text-base h-9 rounded-lg"
                          />
                          <span className="text-sm font-medium text-muted-foreground">
                            / <span className="font-semibold text-foreground">{criterion.maxPoints}</span> pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Score */}
                  <div className="rounded-xl bg-gradient-to-br from-accent-purple/[0.08] to-accent-orange/[0.08] border-2 border-accent-purple/20 p-5 shadow-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Score</p>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-4xl font-bold bg-gradient-to-br from-accent-purple to-accent-orange bg-clip-text text-transparent">
                        {totalRubricScore}
                      </span>
                      <span className="text-xl font-semibold text-muted-foreground">
                        / {submissionDetail.assessment.maxPoints}
                      </span>
                    </div>
                    <div className="mt-2.5 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-purple to-accent-orange transition-all duration-500"
                        style={{ width: `${(totalRubricScore / submissionDetail.assessment.maxPoints) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                // Manual Score Input
                <div>
                  <div className="rounded-xl bg-gradient-to-br from-accent-purple/[0.08] to-accent-orange/[0.08] border-2 border-accent-purple/20 p-5 shadow-lg">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
                      Score
                    </label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min="0"
                        max={submissionDetail.assessment.maxPoints}
                        step="0.5"
                        value={manualScore}
                        onChange={(e) => setManualScore(e.target.value)}
                        className="w-24 text-center text-2xl font-bold h-12 rounded-lg"
                      />
                      <span className="text-xl font-semibold text-muted-foreground">
                        / {submissionDetail.assessment.maxPoints}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-purple to-accent-orange transition-all duration-500"
                        style={{ width: `${(Number(manualScore) / submissionDetail.assessment.maxPoints) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Feedback Section */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-3">Feedback</h3>
              <Textarea
                rows={8}
                placeholder="Write detailed feedback for the student..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="resize-none text-sm leading-relaxed rounded-lg border-border/40 shadow-sm focus:shadow-md transition-shadow"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-3.5 border-t border-border/40 bg-gradient-to-r from-muted/30 via-background to-muted/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Press</span>
            <kbd className="px-2 py-1 bg-muted/60 border border-border/50 rounded text-xs font-medium shadow-sm">
              Esc
            </kbd>
            <span>to close</span>
          </div>
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-9 px-5 rounded-lg hover:bg-muted/60 transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-w-[130px] h-9 px-5 rounded-lg bg-gradient-to-r from-accent-purple to-accent-orange hover:from-accent-purple/90 hover:to-accent-orange/90 shadow-md hover:shadow-lg transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Award className="h-4 w-4 mr-2" />
                  Save Grade
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
