'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Layers, Calendar, Award, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AssessmentTypeBadge } from './AssessmentTypeIcon'
import Link from 'next/link'

interface Assessment {
  id: string
  title: string
  type: string
  dueAt: string | null
  maxPoints: number
  submission: {
    id: string
    status: string
    totalScore: number | null
    isLate: boolean
  } | null
  status: string
  isOverdue: boolean
  isPending: boolean
  isSubmitted: boolean
  isGraded: boolean
}

interface Module {
  id: string
  title: string
  description?: string | null
  orderIndex: number
  isPublished: boolean
  assessments: Assessment[]
}

interface Class {
  id: string
  title: string
  classCode: string
  course: {
    code: string
    title: string
  }
}

interface ModuleWithClass {
  module: Module
  class: Class
}

interface ModuleAssignmentsViewProps {
  modulesByClass: ModuleWithClass[]
}

export function ModuleAssignmentsView({ modulesByClass }: ModuleAssignmentsViewProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modulesByClass.map((m) => m.module.id))
  )

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const getAssessmentStatusBadge = (assignment: Assessment) => {
    if (assignment.isOverdue) {
      return <Badge variant="error">Overdue</Badge>
    }
    if (assignment.isGraded) {
      return <Badge variant="success">Graded</Badge>
    }
    if (assignment.isSubmitted) {
      return <Badge variant="info">Submitted</Badge>
    }
    return <Badge variant="outline">Not Started</Badge>
  }

  const getDaysUntilDue = (dueAt: string | null) => {
    if (!dueAt) return null
    const now = new Date()
    const dueDate = new Date(dueAt)
    const diffTime = dueDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return null
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `Due in ${diffDays} days`
  }

  const getModuleProgress = (module: Module) => {
    if (module.assessments.length === 0) return 0
    const completed = module.assessments.filter((a) => a.isGraded || a.isSubmitted).length
    return Math.round((completed / module.assessments.length) * 100)
  }

  return (
    <div className="space-y-3">
      {modulesByClass.map(({ module, class: classInfo }) => {
        const isExpanded = expandedModules.has(module.id)
        const progress = getModuleProgress(module)

        return (
          <Card key={module.id} className="overflow-hidden">
            <CardHeader
              className="bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors pb-3"
              onClick={() => toggleModule(module.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Class Info */}
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {classInfo.course.code} • {classInfo.classCode}
                    </Badge>
                  </div>

                  {/* Module Title */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <Layers className="h-4 w-4 text-accent-purple flex-shrink-0" />
                    <h3 className="text-base font-bold truncate">{module.title}</h3>
                  </div>

                  {/* Module Description */}
                  {module.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {module.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {module.assessments.filter((a) => a.isGraded || a.isSubmitted).length} /{' '}
                        {module.assessments.length} assignments completed
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-accent-purple h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expand/Collapse Button */}
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
              </div>
            </CardHeader>

            {/* Assignments List */}
            {isExpanded && (
              <CardContent className="pt-3">
                {module.assessments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No assignments in this module yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {module.assessments
                      .sort((a, b) => {
                        // Sort by due date, then by title
                        if (a.dueAt && b.dueAt) {
                          return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
                        }
                        if (a.dueAt) return -1
                        if (b.dueAt) return 1
                        return a.title.localeCompare(b.title)
                      })
                      .map((assignment) => {
                        const daysUntilDue = getDaysUntilDue(assignment.dueAt)

                        return (
                          <div
                            key={`${module.id}-${assignment.id}`}
                            className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              {/* Assignment Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <AssessmentTypeBadge type={assignment.type as any} />
                                  {getAssessmentStatusBadge(assignment)}
                                </div>

                                <h4 className="text-sm font-medium mb-1.5">{assignment.title}</h4>

                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                  {/* Due Date */}
                                  {assignment.dueAt && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      <span>
                                        {new Date(assignment.dueAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                        })}
                                      </span>
                                      {daysUntilDue && (
                                        <span
                                          className={
                                            assignment.isOverdue
                                              ? 'text-error font-medium ml-1'
                                              : daysUntilDue.includes('today') ||
                                                  daysUntilDue.includes('tomorrow')
                                                ? 'text-warning font-medium ml-1'
                                                : 'text-info ml-1'
                                          }
                                        >
                                          ({daysUntilDue})
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Points */}
                                  <div className="flex items-center gap-1">
                                    <Award className="h-4 w-4" />
                                    <span>{Number(assignment.maxPoints).toFixed(0)} pts</span>
                                  </div>

                                  {/* Score (if graded) */}
                                  {assignment.isGraded && assignment.submission?.totalScore !== null && (
                                    <div className="flex items-center gap-1 font-semibold text-success">
                                      <CheckCircle className="h-4 w-4" />
                                      <span>
                                        {Number(assignment.submission.totalScore).toFixed(1)} /{' '}
                                        {Number(assignment.maxPoints).toFixed(0)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Action Button */}
                              <Button asChild size="sm" variant={assignment.isPending ? 'default' : 'outline'}>
                                <Link href={`/student/assignments/${assignment.id}`}>
                                  {assignment.isPending
                                    ? 'Start'
                                    : assignment.isGraded
                                      ? 'View'
                                      : 'Continue'}
                                </Link>
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}

      {modulesByClass.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No modules with assignments yet</h3>
            <p className="text-muted-foreground">
              Your instructors haven't added any modules with assignments yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
