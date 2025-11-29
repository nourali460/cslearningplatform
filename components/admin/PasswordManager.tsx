'use client'

import { useState } from 'react'
import { Copy, RefreshCw, CheckCircle } from 'lucide-react'

type PasswordManagerProps = {
  userId: string
  initialPassword: string
  userName: string
  userRole: 'student' | 'professor'
  managerRole: 'admin' | 'professor' // Who is using this component
}

export function PasswordManager({ userId, initialPassword, userName, userRole, managerRole }: PasswordManagerProps) {
  const [password, setPassword] = useState(initialPassword)
  const [copied, setCopied] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = async () => {
    if (!confirm(`Are you sure you want to regenerate the password for ${userName}? The old password will no longer work.`)) {
      return
    }

    setIsRegenerating(true)
    try {
      // Use correct endpoint based on who is managing passwords
      const endpoint = managerRole === 'admin'
        ? '/api/admin/regenerate-password'
        : '/api/professor/students/regenerate-password'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to regenerate password')
        setIsRegenerating(false)
        return
      }

      setPassword(data.newPassword)
      setCopied(false)
      alert(`New password generated: ${data.newPassword}\n\nPlease copy and share with ${userName}.`)
    } catch (error) {
      console.error('Error regenerating password:', error)
      alert('An error occurred while regenerating the password')
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <div className="d-flex align-items-center gap-2">
      <code className="text-primary fw-bold" style={{ fontSize: '0.9rem', letterSpacing: '0.05em' }}>
        {password}
      </code>
      <button
        className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-primary'}`}
        onClick={handleCopy}
        title="Copy password"
        style={{ padding: '0.25rem 0.5rem' }}
      >
        {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
      </button>
      <button
        className="btn btn-sm btn-outline-warning"
        onClick={handleRegenerate}
        disabled={isRegenerating}
        title="Regenerate password"
        style={{ padding: '0.25rem 0.5rem' }}
      >
        {isRegenerating ? (
          <span className="spinner-border spinner-border-sm" role="status" style={{ width: '14px', height: '14px' }}></span>
        ) : (
          <RefreshCw size={14} />
        )}
      </button>
    </div>
  )
}
