'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin/overview', label: 'Overview', icon: '📊' },
    { href: '/admin/people', label: 'People', icon: '👥' },
    { href: '/admin/courses', label: 'Courses & Classes', icon: '📚' },
    { href: '/admin/assessments', label: 'Assessments & Grades', icon: '📝' },
  ]

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-md-3 col-lg-2 admin-sidebar">
          <div className="p-4">
            {/* Brand */}
            <Link href="/admin/overview" className="text-decoration-none">
              <h2 className="text-white fw-bold mb-1">Admin Panel</h2>
              <p className="text-white-50 small mb-0">CS Learning Platform</p>
            </Link>

            <hr className="border-white opacity-25 my-4" />

            {/* Navigation */}
            <nav className="nav flex-column">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link d-flex align-items-center ${
                    pathname === item.href ? 'active' : ''
                  }`}
                >
                  <span className="me-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            <hr className="border-white opacity-25 my-4" />

            {/* Logout */}
            <div className="mt-auto">
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
