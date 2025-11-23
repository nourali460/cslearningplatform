import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Separator } from '@/components/ui/separator'
import { requireProfessor } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireProfessor()

  if (!user) {
    redirect('/')
  }

  const navItems = [
    { href: '/professor', label: 'Dashboard' },
    { href: '/professor/classes', label: 'My Classes' },
    { href: '/professor/assessments', label: 'Assessments' },
    { href: '/professor/grading', label: 'Grading' },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Left Sidebar */}
      <aside className="w-64 border-r bg-muted/40 p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Professor Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">CS Learning Platform</p>
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
            <div className="text-xs text-muted-foreground mb-2">Logged in as:</div>
            <div className="text-sm font-medium mb-2">{user.fullName || user.email}</div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
