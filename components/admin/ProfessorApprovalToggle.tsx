'use client'

import { useState } from 'react'

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
      <div className="d-flex align-items-center gap-2">
        <div className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">Updating...</span>
        </div>
        <span className="small text-muted">Updating...</span>
      </div>
    )
  }

  return (
    <div className="d-flex align-items-center gap-2">
      {isApproved ? (
        <>
          <span className="badge bg-success">
            <i className="bi bi-check-circle-fill me-1"></i>
            Active
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={handleToggle}
            title="Deactivate professor"
          >
            <i className="bi bi-x-circle me-1"></i>
            Deactivate
          </button>
        </>
      ) : (
        <>
          <span className="badge bg-warning text-dark">
            <i className="bi bi-exclamation-circle-fill me-1"></i>
            Inactive
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-success"
            onClick={handleToggle}
            title="Activate professor"
          >
            <i className="bi bi-check-circle me-1"></i>
            Activate
          </button>
        </>
      )}
    </div>
  )
}
