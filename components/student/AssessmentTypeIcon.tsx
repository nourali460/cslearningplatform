type AssessmentType = 'INTERACTIVE_LESSON' | 'LAB' | 'EXAM' | 'QUIZ' | 'DISCUSSION'

export function AssessmentTypeIcon({
  type,
  size = 20,
}: {
  type: AssessmentType
  size?: number
}) {
  const icons = {
    INTERACTIVE_LESSON: '📖',
    LAB: '🧪',
    EXAM: '📝',
    QUIZ: '❓',
    DISCUSSION: '💬',
  }

  const colors = {
    INTERACTIVE_LESSON: 'text-primary',
    LAB: 'text-success',
    EXAM: 'text-danger',
    QUIZ: 'text-warning',
    DISCUSSION: 'text-info',
  }

  const bgColors = {
    INTERACTIVE_LESSON: 'bg-primary',
    LAB: 'bg-success',
    EXAM: 'bg-danger',
    QUIZ: 'bg-warning',
    DISCUSSION: 'bg-info',
  }

  const names = {
    INTERACTIVE_LESSON: 'Lesson',
    LAB: 'Lab',
    EXAM: 'Exam',
    QUIZ: 'Quiz',
    DISCUSSION: 'Discussion',
  }

  return (
    <span className={`me-1 ${colors[type]}`} style={{ fontSize: `${size}px` }}>
      {icons[type]}
    </span>
  )
}

export function AssessmentTypeBadge({ type }: { type: AssessmentType }) {
  const icons = {
    INTERACTIVE_LESSON: '📖',
    LAB: '🧪',
    EXAM: '📝',
    QUIZ: '❓',
    DISCUSSION: '💬',
  }

  const bgColors = {
    INTERACTIVE_LESSON: 'bg-primary',
    LAB: 'bg-success',
    EXAM: 'bg-danger',
    QUIZ: 'bg-warning text-dark',
    DISCUSSION: 'bg-info',
  }

  const names = {
    INTERACTIVE_LESSON: 'Lesson',
    LAB: 'Lab',
    EXAM: 'Exam',
    QUIZ: 'Quiz',
    DISCUSSION: 'Discussion',
  }

  return (
    <span className={`badge ${bgColors[type]}`}>
      {icons[type]} {names[type]}
    </span>
  )
}

export function getAssessmentTypeName(type: AssessmentType): string {
  const names = {
    INTERACTIVE_LESSON: 'Interactive Lesson',
    LAB: 'Lab',
    EXAM: 'Exam',
    QUIZ: 'Quiz',
    DISCUSSION: 'Discussion',
  }
  return names[type]
}

export function getAssessmentTypeIcon(type: AssessmentType): string {
  const icons = {
    INTERACTIVE_LESSON: '📖',
    LAB: '🧪',
    EXAM: '📝',
    QUIZ: '❓',
    DISCUSSION: '💬',
  }
  return icons[type]
}
