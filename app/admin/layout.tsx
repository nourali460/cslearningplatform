import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Separator } from '@/components/ui/separator'
import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminFilterBar } from '@/components/admin/AdminFilterBar'
import { getFilterOptions, type AdminFilters } from '@/lib/admin-filters'

export default async function AdminLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await requireAdmin()

  if (!user) {
    redirect('/')
  }

  // Parse search params for filters
  const params = await searchParams
  const filters: AdminFilters = {
    term: params && typeof params.term === 'string' ? params.term : undefined,
    year: params && typeof params.year === 'string' ? parseInt(params.year) : undefined,
    professorId:
      params && typeof params.professorId === 'string' ? params.professorId : undefined,
    courseId: params && typeof params.courseId === 'string' ? params.courseId : undefined,
    classId: params && typeof params.classId === 'string' ? params.classId : undefined,
    studentId: params && typeof params.studentId === 'string' ? params.studentId : undefined,
    assessmentId:
      params && typeof params.assessmentId === 'string' ? params.assessmentId : undefined,
  }

  // Get cascading filter options
  const filterOptions = await getFilterOptions(filters)

  const navItems = [
    { href: '/admin/overview', label: 'Overview' },
    { href: '/admin/people', label: 'People' },
    { href: '/admin/courses', label: 'Courses & Classes' },
    { href: '/admin/assessments', label: 'Assessments & Grades' },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Left Sidebar */}
      <aside className="w-64 border-r bg-muted/40 p-6">
        <div className="mb-8">
          <Link href="/admin/overview">
            <h1 className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors">
              Admin Panel
            </h1>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            CS Learning Platform
          </p>
        </div>

        <Separator className="mb-6" />

        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Separator className="my-6" />

        <div className="space-y-2">
          <div className="px-3">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto p-8 space-y-6">
          {/* Global Filter Bar */}
          <AdminFilterBar options={filterOptions} />

          {/* Page Content */}
          {children}
        </div>
      </main>
    </div>
  )
}
