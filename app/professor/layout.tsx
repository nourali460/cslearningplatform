'use client'

import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'
import { usePathname } from 'next/navigation'
import { BookOpen, ClipboardList, CheckSquare, Library, GraduationCap } from 'lucide-react'

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navItems = [
    { href: '/professor', label: 'Dashboard', icon: BookOpen },
    { href: '/professor/courses', label: 'Available Courses', icon: Library },
    { href: '/professor/students', label: 'Students', icon: GraduationCap },
    { href: '/professor/assessments', label: 'Assessments', icon: ClipboardList },
    { href: '/professor/grading', label: 'Grading', icon: CheckSquare },
  ]

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        {/* Left Sidebar */}
        <div className="col-md-3 col-lg-2" style={{
          background: 'linear-gradient(180deg, #0d6efd 0%, #084298 100%)',
          minHeight: '100vh',
          color: 'white'
        }}>
          <div className="p-4">
            {/* Header */}
            <div className="mb-4">
              <h1 className="h4 fw-bold mb-1">Professor Portal</h1>
              <p className="small mb-0 opacity-75">CS Learning Platform</p>
            </div>

            <hr className="border-white opacity-25 my-4" />

            {/* Navigation */}
            <nav className="mb-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`d-flex align-items-center text-decoration-none px-3 py-2 rounded mb-2 ${
                      isActive
                        ? 'bg-white text-primary fw-semibold'
                        : 'text-white'
                    }`}
                    style={{
                      transition: 'all 0.2s',
                      ...(isActive ? {} : { opacity: 0.9 })
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <Icon size={18} className="me-2" />
                    <span className="small">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <hr className="border-white opacity-25 my-4" />

            {/* User Info - This will be populated by getting the user from cookies/session */}
            <div className="px-3">
              <div className="small opacity-75 mb-2">Logged in as:</div>
              <div className="small fw-semibold mb-3">Professor</div>
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9 col-lg-10">
          <div className="p-4 p-md-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
