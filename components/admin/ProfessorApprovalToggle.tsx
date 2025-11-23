'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type ProfessorApprovalToggleProps = {
  userId: string
  currentStatus: boolean
  professorName: string
}

export function ProfessorApprovalToggle({
  userId,
  currentStatus,
  professorName,
}: ProfessorApprovalToggleProps) {
  const [isApproved, setIsApproved] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    const newStatus = !isApproved

    try {
      const response = await fetch('/api/admin/approve-professor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, isApproved: newStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error updating approval:', data.error)
        alert(`Error: ${data.error}`)
        return
      }

      setIsApproved(newStatus)
    } catch (error) {
      console.error('Error updating approval:', error)
      alert('Failed to update approval status')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Updating...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {isApproved ? (
        <>
          <Badge variant="default" className="bg-green-600">
            <Check className="mr-1 h-3 w-3" />
            Approved
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Revoke approval"
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <X className="mr-1 h-3 w-3" />
            Pending
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
            title="Approve professor"
          >
            <Check className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  )
}
