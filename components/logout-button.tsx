'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      router.push('/sign-in')
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center"
    >
      <span className="me-2">🚪</span>
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </button>
  )
}
