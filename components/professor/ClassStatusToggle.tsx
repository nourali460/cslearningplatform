'use client'

import { useState } from 'react'
import { Archive, ArchiveRestore } from 'lucide-react'

export function ClassStatusToggle({
  classId,
  isActive,
  onToggle,
}: {
  classId: string
  isActive: boolean
  onToggle?: () => void
}) {
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (loading) return

    const confirmMessage = isActive
      ? 'Are you sure you want to mark this class as past? Students will still be able to view it, but it will be archived.'
      : 'Are you sure you want to mark this class as active?'

    if (!confirm(confirmMessage)) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/professor/toggle-class-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        if (onToggle) {
          onToggle()
        } else {
          window.location.reload()
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update class status')
      }
    } catch (error) {
      console.error('Error toggling class status:', error)
      alert('Failed to update class status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`btn btn-sm ${
        isActive ? 'btn-outline-secondary' : 'btn-outline-success'
      }`}
      title={isActive ? 'Mark as past' : 'Mark as active'}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">Loading...</span>
        </span>
      ) : isActive ? (
        <>
          <Archive size={14} className="me-1" />
          Archive
        </>
      ) : (
        <>
          <ArchiveRestore size={14} className="me-1" />
          Restore
        </>
      )}
    </button>
  )
}
