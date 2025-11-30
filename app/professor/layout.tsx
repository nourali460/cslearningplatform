'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/navigation/Sidebar'
import { professorNavItems } from '@/lib/navigation'

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/professor/profile')
      .then((res) => res.json())
      .then((data) => {
        setUser({
          fullName: data.professor.fullName,
          email: data.professor.email,
          role: 'Professor',
        })
        setIsLoading(false)
      })
      .catch(() => {
        router.push('/sign-in')
      })
  }, [router])

  const handleLogout = async () => {
    console.log('Logout clicked from sidebar')
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      console.log('Logout response:', response.status)
      router.push('/sign-in')
    } catch (error) {
      console.error('Logout error:', error)
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

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        navItems={professorNavItems}
        user={user}
        onLogout={handleLogout}
        title="Professor Portal"
        subtitle="CS Learning Platform"
      />
      <main className="flex-1 overflow-y-auto">
        <div className="container-claude py-8">{children}</div>
      </main>
    </div>
  )
}
