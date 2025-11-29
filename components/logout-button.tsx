'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    console.log('Logout button clicked!')
    setIsLoading(true)
    try {
      console.log('Calling logout API...')
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      console.log('Logout response:', response.status)
      console.log('Redirecting to sign-in...')
      router.push('/sign-in')
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      variant="outline"
      className="w-full"
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </Button>
  )
}
