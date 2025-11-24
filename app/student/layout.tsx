'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'
import { useEffect, useState } from 'react'

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Fetch user info
    fetch('/api/student/whoami')
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(() => {
        window.location.href = '/sign-in'
      })
  }, [])

  const navItems = [
    { href: '/student', label: 'Dashboard', icon: '📊' },
    { href: '/student/classes', label: 'My Classes', icon: '📚' },
    { href: '/student/assignments', label: 'Assignments', icon: '📋' },
    { href: '/student/grades', label: 'Grades', icon: '📈' },
  ]

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-md-3 col-lg-2 student-sidebar">
          <div className="p-4">
            {/* Brand */}
            <Link href="/student" className="text-decoration-none">
              <h2 className="text-white fw-bold mb-1">Student Portal</h2>
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

            {/* User Info */}
            <div className="mt-auto">
              <div className="small text-white-50 mb-2">Logged in as:</div>
              <div className="small text-white mb-3">{user.fullName || user.email}</div>
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
