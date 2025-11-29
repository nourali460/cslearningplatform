'use client'

import React, { useState } from 'react'
import { FileText, Table as TableIcon, User } from 'lucide-react'
import { GradeCell } from './GradeCell'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

// Tooltip component
function AssessmentTooltip({ title, children }: { title: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false)

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className="absolute z-[100] px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap pointer-events-none"
          style={{
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-8px)',
          }}
        >
          {title}
          <div
            className="absolute w-0 h-0"
            style={{
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #111827',
            }}
          />
        </div>
      )}
    </div>
  )
}

type GradebookStudent = {
  student: {
    id: string
    fullName: string | null
    email: string
  }
  grades: Record<string, {
    submissionId: string
    score: number | null
    status: string
    isLate: boolean
  }>
  categoryPercentages: Record<string, number>
  categoryStats: Record<string, { earned: number; possible: number; count: number }>
  overallPercentage: number
  totalEarned: number
  totalPossible: number
}

type Assessment = {
  id: string
  title: string
  type: string
  maxPoints: number
  module?: {
    id: string
    title: string
    orderIndex: number
  } | null
}

type Props = {
  classTitle: string
  gradebookStudents: GradebookStudent[]
  assessments: Assessment[]
  onClose: () => void
  onGradeUpdate: (
    submissionId: string | null,
    studentId: string,
    assessmentId: string,
    newScore: number,
    assessmentMaxPoints: number
  ) => Promise<void>
}

export function GradebookModal({
  classTitle,
  gradebookStudents,
  assessments,
  onClose,
  onGradeUpdate,
}: Props) {
  // State for crosshairs highlighting
  const [activeCell, setActiveCell] = useState<{ studentId: string; assessmentId: string } | null>(null)

  // State for column sorting
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'due_date' | 'points' | 'type'>('default')

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-success'
    if (percentage >= 80) return 'text-info'
    if (percentage >= 70) return 'text-warning'
    return 'text-danger'
  }

  // Sort assessments based on selected criteria
  const sortedAssessments = [...assessments].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title)
      case 'points':
        return b.maxPoints - a.maxPoints // Descending
      case 'type':
        return a.type.localeCompare(b.type)
      case 'default':
      default:
        return 0 // Keep original order
    }
  })

  // Group assessments by type
  const assessmentsByType: Record<string, Assessment[]> = {}
  sortedAssessments.forEach((assessment) => {
    if (!assessmentsByType[assessment.type]) {
      assessmentsByType[assessment.type] = []
    }
    assessmentsByType[assessment.type].push(assessment)
  })

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!max-w-[98vw] !w-[98vw] !max-h-[98vh] !h-[98vh] flex flex-col p-0 sm:!max-w-[98vw] md:!max-w-[98vw] lg:!max-w-[98vw]">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between w-full">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <TableIcon className="h-5 w-5" />
                Complete Gradebook
              </DialogTitle>
              <DialogDescription className="mt-1">{classTitle}</DialogDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Sort by:</label>
                <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Order</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="points">Points (High-Low)</SelectItem>
                    <SelectItem value="type">Type (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {assessments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText size={64} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Assessments Found</h3>
              <p className="text-muted-foreground mb-6">
                This class doesn't have any assessments yet. Create some assessments to start grading!
              </p>
              <Button asChild>
                <Link href="/professor/assessments">Create Assessment</Link>
              </Button>
            </div>
          ) : (
            <div className="h-full overflow-auto w-full">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr className="border-b-2">
                    <th
                      rowSpan={2}
                      className="align-middle text-left font-bold border-r border-b border-border"
                      style={{
                        position: 'sticky',
                        left: 0,
                        backgroundColor: 'hsl(var(--muted))',
                        minWidth: '200px',
                        maxWidth: '280px',
                        padding: '12px 10px',
                        zIndex: 11,
                        whiteSpace: 'nowrap',
                        borderRight: '2px solid hsl(var(--border))'
                      }}
                    >
                      Student Name
                    </th>
                      {Object.entries(assessmentsByType).map(([type, typeAssessments]) => (
                        <th
                          key={type}
                          colSpan={typeAssessments.length + 1}
                          className="text-center font-bold uppercase text-white border-l-4 border-r border-b border-border"
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            padding: '8px 6px',
                            fontSize: '0.85rem',
                            letterSpacing: '0.5px',
                            borderLeft: '2px solid hsl(var(--border))'
                          }}
                        >
                          {type.replace('_', ' ')}
                        </th>
                      ))}
                      <th
                        rowSpan={2}
                        className="align-middle text-center font-bold bg-success text-white border-l-4 border-r border-b border-border"
                        style={{
                          minWidth: '120px',
                          padding: '12px 8px',
                          borderLeft: '3px solid hsl(var(--border))'
                        }}
                      >
                        Overall<br />Grade
                      </th>
                    </tr>
                    <tr className="bg-muted/50">
                      {Object.entries(assessmentsByType).map(([type, typeAssessments]) => (
                        <React.Fragment key={`${type}-headers`}>
                          {typeAssessments.map((assessment, idx) => (
                            <th
                              key={assessment.id}
                              className={`text-center border-r border-b border-border ${idx === 0 ? 'border-l' : ''}`}
                              style={{
                                minWidth: '100px',
                                maxWidth: '140px',
                                padding: '8px 6px',
                                fontSize: '0.75rem',
                                borderLeft: idx === 0 ? '2px solid hsl(var(--border))' : undefined
                              }}
                            >
                              <AssessmentTooltip title={assessment.title}>
                                <div
                                  className="font-semibold truncate"
                                  style={{ maxWidth: '120px', margin: '0 auto' }}
                                >
                                  {assessment.title.substring(0, 15)}
                                  {assessment.title.length > 15 ? '...' : ''}
                                </div>
                              </AssessmentTooltip>
                              {assessment.module && (
                                <div className="mt-1" style={{ fontSize: '0.65rem' }}>
                                  <span className="px-1.5 py-0.5 rounded text-xs bg-accent-purple/20 text-accent-purple">
                                    Module {assessment.module.orderIndex + 1}
                                  </span>
                                </div>
                              )}
                              <div className="text-muted-foreground mt-1" style={{ fontSize: '0.7rem' }}>
                                {assessment.maxPoints} pts
                              </div>
                            </th>
                          ))}
                          <th
                            className="text-center font-bold bg-muted border-l-2 border-r border-b border-border"
                            style={{
                              minWidth: '85px',
                              padding: '8px 6px',
                              fontSize: '0.8rem',
                              borderLeft: '2px solid hsl(var(--border))'
                            }}
                          >
                            Category<br />Avg
                          </th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gradebookStudents.map((studentData, studentIdx) => {
                      const isActiveRow = activeCell?.studentId === studentData.student.id
                      return (
                        <tr
                          key={studentData.student.id}
                          className={studentIdx % 2 === 0 ? '' : 'bg-muted/30'}
                          style={{
                            backgroundColor: isActiveRow ? 'rgba(102, 126, 234, 0.08)' : undefined,
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          <td
                            className="font-semibold text-left border-r border-b border-border"
                            style={{
                              position: 'sticky',
                              left: 0,
                              backgroundColor: isActiveRow
                                ? 'rgba(102, 126, 234, 0.12)'
                                : studentIdx % 2 === 0 ? 'white' : 'hsl(var(--muted) / 0.3)',
                              padding: '8px 10px',
                              zIndex: 5,
                              minWidth: '200px',
                              maxWidth: '280px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              transition: 'background-color 0.15s ease',
                              borderRight: '2px solid hsl(var(--border))'
                            }}
                            title={studentData.student.fullName || studentData.student.email}
                          >
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {studentData.student.fullName || studentData.student.email}
                            </div>
                          </td>
                        {Object.entries(assessmentsByType).map(([type, typeAssessments]) => (
                          <React.Fragment key={`${studentData.student.id}-${type}`}>
                            {typeAssessments.map((assessment, idx) => {
                              const grade = studentData.grades[assessment.id]
                              const isActiveColumn = activeCell?.assessmentId === assessment.id
                              const isActiveCell = isActiveRow && isActiveColumn

                              return (
                                <td
                                  key={`${studentData.student.id}-${assessment.id}`}
                                  className={`text-center align-middle border-r border-b border-border ${idx === 0 ? 'border-l' : ''}`}
                                  style={{
                                    padding: '4px',
                                    backgroundColor: isActiveColumn && !isActiveCell
                                      ? 'rgba(102, 126, 234, 0.06)'
                                      : undefined,
                                    transition: 'background-color 0.15s ease',
                                    boxShadow: isActiveCell ? 'inset 0 0 0 2px rgba(102, 126, 234, 0.3)' : undefined,
                                    borderLeft: idx === 0 ? '2px solid hsl(var(--border))' : undefined
                                  }}
                                >
                                  {grade ? (
                                    <GradeCell
                                      studentId={studentData.student.id}
                                      studentName={studentData.student.fullName || studentData.student.email}
                                      assessmentId={assessment.id}
                                      assessmentTitle={assessment.title}
                                      submissionId={grade.submissionId}
                                      initialScore={grade.score}
                                      maxPoints={Number(assessment.maxPoints)}
                                      isLate={grade.isLate}
                                      onUpdate={onGradeUpdate}
                                      onCellFocus={(sId, aId) => setActiveCell({ studentId: sId, assessmentId: aId })}
                                      onCellBlur={() => setActiveCell(null)}
                                    />
                                  ) : (
                                    <span className="text-muted-foreground font-light">-</span>
                                  )}
                                </td>
                              )
                            })}
                            <td
                              className={`text-center font-bold border-r border-b border-border ${getGradeColor(studentData.categoryPercentages[type] || 0)}`}
                              style={{
                                backgroundColor: 'hsl(var(--muted))',
                                borderLeft: '2px solid hsl(var(--border))',
                                padding: '6px 4px',
                                fontSize: '0.9rem',
                              }}
                            >
                              {studentData.categoryStats[type]?.count > 0
                                ? `${studentData.categoryPercentages[type].toFixed(1)}%`
                                : '-'}
                            </td>
                          </React.Fragment>
                        ))}
                        <td
                          className={`text-center font-bold border-r border-b border-border ${getGradeColor(studentData.overallPercentage)}`}
                          style={{
                            backgroundColor: 'hsl(var(--muted) / 0.5)',
                            borderLeft: '3px solid hsl(var(--border))',
                            padding: '6px 4px',
                            fontSize: '1rem',
                          }}
                        >
                          {studentData.overallPercentage.toFixed(1)}%
                          <br />
                          <small className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>
                            {studentData.totalEarned.toFixed(1)}/{studentData.totalPossible.toFixed(0)}
                          </small>
                        </td>
                      </tr>
                    )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30 shrink-0">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span><strong>Hover</strong> cells to edit</span>
            </div>
            <span>•</span>
            <span><strong>Hover</strong> assessment titles for full name</span>
            <span>•</span>
            <span><strong>Enter</strong> to save</span>
            <span>•</span>
            <span><strong className="text-warning">Yellow</strong> = Late submission</span>
          </div>
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
