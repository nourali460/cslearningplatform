'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Shared layout for template pages
 * Allows both admin and professor roles to access template creation pages
 * Overrides the parent admin layout's auth check
 */
export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    detectRole()
  }, [router])

  const detectRole = async () => {
    let adminStatus = 0
    let profStatus = 0

    try {
      // Try admin first
      const adminRes = await fetch('/api/admin/whoami')
      adminStatus = adminRes.status
      if (adminRes.ok) {
        setIsAuthenticated(true)
        setIsLoading(false)
        return
      }
    } catch (error) {
      console.error('Error checking admin role:', error)
    }

    try {
      // Try professor
      const profRes = await fetch('/api/professor/profile')
      profStatus = profRes.status
      if (profRes.ok) {
        setIsAuthenticated(true)
        setIsLoading(false)
        return
      }
    } catch (error) {
      console.error('Error checking professor role:', error)
    }

    // Treat 401 (Unauthorized) and 403 (Forbidden) as "not this role"
    const isNotAdmin = adminStatus === 401 || adminStatus === 403
    const isNotProfessor = profStatus === 401 || profStatus === 403

    if (isNotAdmin && isNotProfessor) {
      console.log('Not authenticated as admin or professor - redirecting to sign-in')
      router.push('/sign-in')
    } else {
      console.error('Unable to detect role - admin status:', adminStatus, 'professor status:', profStatus)
      console.error('Not redirecting to sign-in to prevent unexpected logouts')
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent-orange" />
          <p className="text-sm text-foreground-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Pass through children without additional wrapper
  // The parent layout (admin or professor) already provides the sidebar
  return <>{children}</>
}
