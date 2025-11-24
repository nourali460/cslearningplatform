'use client'

import { useState, useEffect, useRef } from 'react'

type Props = {
  studentId: string
  studentName: string
  assessmentId: string
  assessmentTitle: string
  submissionId: string | null
  initialScore: number | null
  maxPoints: number
  isLate: boolean
  onUpdate: (submissionId: string | null, studentId: string, assessmentId: string, newScore: number, maxPoints: number) => Promise<void>
}

export function GradeCell({
  studentId,
  studentName,
  assessmentId,
  assessmentTitle,
  submissionId,
  initialScore,
  maxPoints,
  isLate,
  onUpdate
}: Props) {
  const [value, setValue] = useState(initialScore !== null ? String(initialScore) : '')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update value when initialScore changes (after save or refetch)
  useEffect(() => {
    if (!isEditing) {
      setValue(initialScore !== null ? String(initialScore) : '')
    }
  }, [initialScore, isEditing])

  const handleSave = async () => {
    const newScore = parseFloat(value)

    if (isNaN(newScore) || value.trim() === '') {
      // Reset to original value if invalid
      setValue(initialScore !== null ? String(initialScore) : '')
      setIsEditing(false)
      return
    }

    if (newScore < 0 || newScore > maxPoints) {
      alert(`Score must be between 0 and ${maxPoints}`)
      setValue(initialScore !== null ? String(initialScore) : '')
      setIsEditing(false)
      return
    }

    // Only save if changed
    if (newScore === initialScore) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onUpdate(submissionId, studentId, assessmentId, newScore, maxPoints)
      // Value will be updated via useEffect when initialScore prop changes
    } catch (error) {
      console.error('Failed to save grade:', error)
      // Reset to original value on error
      setValue(initialScore !== null ? String(initialScore) : '')
    } finally {
      setIsSaving(false)
      setIsEditing(false)
    }
  }

  return (
    <input
      ref={inputRef}
      type="number"
      className={`form-control form-control-sm text-center ${isLate ? 'border-warning' : ''}`}
      style={{
        width: '80px',
        padding: '6px 8px',
        fontSize: '0.875rem',
        backgroundColor: isSaving ? '#ffc107' : (isEditing ? '#d1e7ff' : (isLate ? '#fff3cd' : 'white')),
        margin: '0 auto',
        fontWeight: initialScore !== null ? '600' : 'normal',
        cursor: isSaving ? 'wait' : 'text'
      }}
      value={value}
      disabled={isSaving}
      onFocus={() => setIsEditing(true)}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        } else if (e.key === 'Escape') {
          setValue(initialScore !== null ? String(initialScore) : '')
          setIsEditing(false)
          e.currentTarget.blur()
        }
      }}
      min="0"
      max={maxPoints}
      step="0.1"
      placeholder="-"
      title={`${studentName} - ${assessmentTitle}`}
    />
  )
}
