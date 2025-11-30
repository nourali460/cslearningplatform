'use client'

import { useRouter } from 'next/navigation'
import { Award, MessageSquare, FlaskConical, HelpCircle, FileText, BookOpenCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface AssessmentTemplate {
  id: string
  type: string
  title: string
  description: string | null
  isActive: boolean
  defaultMaxPoints: number
  defaultSubmissionType: string
}

interface CourseAssessmentTemplatesListProps {
  courseId: string
  templates: AssessmentTemplate[]
}

const TYPE_ROUTES: Record<string, string> = {
  'DISCUSSION': '/admin/templates/discussion',
  'LAB': '/admin/templates/lab',
  'QUIZ': '/admin/templates/quiz',
  'EXAM': '/admin/templates/exam',
  'INTERACTIVE_LESSON': '/admin/templates/lesson',
  'PAGE': '/admin/templates/page',
}

const TYPE_INFO: Record<string, { icon: any; label: string; emoji: string }> = {
  'DISCUSSION': { icon: MessageSquare, label: 'Discussion', emoji: '💬' },
  'LAB': { icon: FlaskConical, label: 'Lab', emoji: '🧪' },
  'QUIZ': { icon: HelpCircle, label: 'Quiz', emoji: '❓' },
  'EXAM': { icon: FileText, label: 'Exam', emoji: '📝' },
  'INTERACTIVE_LESSON': { icon: BookOpenCheck, label: 'Lesson', emoji: '📖' },
  'PAGE': { icon: FileText, label: 'Page', emoji: '📄' },
}

export function CourseAssessmentTemplatesList({ courseId, templates }: CourseAssessmentTemplatesListProps) {
  const router = useRouter()

  const handleEditTemplate = (template: AssessmentTemplate) => {
    const path = TYPE_ROUTES[template.type]
    if (path) {
      router.push(`${path}?edit=${template.id}`)
    }
  }

  const handleCreateTemplate = (type: string) => {
    const path = TYPE_ROUTES[type]
    if (path) {
      router.push(`${path}?courseId=${courseId}`)
    }
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h5 className="text-lg font-semibold mb-2">No templates yet</h5>
        <p className="text-sm text-muted-foreground mb-6">
          Create assessment templates on the type-specific pages.
        </p>

        {/* Quick Links to Create Templates */}
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.entries(TYPE_INFO).map(([type, info]) => {
            const Icon = info.icon
            return (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => handleCreateTemplate(type)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {info.emoji} Create {info.label}
              </Button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Info Banner */}
      <div className="bg-info/10 border border-info/20 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <Award className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground mb-1">
              Viewing Assessment Templates
            </p>
            <p className="text-xs text-muted-foreground">
              Templates are created on type-specific pages. Click Edit to modify a template on its dedicated page.
            </p>
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-3">
        {templates.map((template) => {
          const typeInfo = TYPE_INFO[template.type] || { icon: Award, label: template.type, emoji: '📋' }
          const Icon = typeInfo.icon

          return (
            <div
              key={template.id}
              className="border border-border rounded-lg p-4 bg-background-secondary/30 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-accent-purple" />
                    <Badge variant="info" className="text-xs">
                      {typeInfo.emoji} {typeInfo.label}
                    </Badge>
                    {!template.isActive && (
                      <Badge variant="outline" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-semibold mb-1">{template.title}</h4>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {template.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Max Points: {Number(template.defaultMaxPoints).toFixed(0)}</span>
                    <span>Submission: {template.defaultSubmissionType}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditTemplate(template)}
                >
                  Edit
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create More Templates */}
      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground mb-3">Create more templates:</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TYPE_INFO).map(([type, info]) => {
            const Icon = info.icon
            return (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => handleCreateTemplate(type)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {info.emoji} {info.label}
              </Button>
            )
          })}
        </div>
      </div>
    </>
  )
}
