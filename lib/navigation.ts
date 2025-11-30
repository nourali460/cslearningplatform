import {
  BookOpen,
  ClipboardList,
  CheckSquare,
  Library,
  GraduationCap,
  Layers,
  MessageSquare,
  FileText,
  FlaskConical,
  HelpCircle,
  BookOpenCheck
} from 'lucide-react'

/**
 * Professor navigation items
 * Shared between professor layout and admin layout (when professor accesses templates)
 */
export const professorNavItems = [
  { href: '/professor', label: 'Dashboard', icon: BookOpen },
  { href: '/professor/courses', label: 'Available Courses', icon: Library },
  { href: '/professor/students', label: 'Students', icon: GraduationCap },
  { href: '/professor/modules', label: 'Modules', icon: Layers },
  { href: '/professor/assessments', label: 'Assessments', icon: ClipboardList },
  { href: '/admin/templates/discussion', label: 'Create Discussion', icon: MessageSquare },
  { href: '/admin/templates/page', label: 'Create Page', icon: FileText },
  { href: '/admin/templates/lab', label: 'Create Lab', icon: FlaskConical },
  { href: '/admin/templates/quiz', label: 'Create Quiz', icon: HelpCircle },
  { href: '/admin/templates/exam', label: 'Create Exam', icon: FileText },
  { href: '/admin/templates/lesson', label: 'Create Lesson', icon: BookOpenCheck },
  { href: '/professor/grading', label: 'Grading', icon: CheckSquare },
]
