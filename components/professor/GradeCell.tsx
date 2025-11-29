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
  onCellFocus?: (studentId: string, assessmentId: string) => void
  onCellBlur?: () => void
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
  onUpdate,
  onCellFocus,
  onCellBlur
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
    <div className="relative inline-block group">
      <input
        ref={inputRef}
        type="number"
        className={`form-control form-control-sm text-center transition-all duration-200 ${isLate ? 'border-warning' : ''}`}
        style={{
          width: '80px',
          padding: '6px 8px',
          fontSize: '0.875rem',
          backgroundColor: isSaving ? '#ffc107' : (isEditing ? '#e3f2fd' : (isLate ? '#fff3cd' : 'white')),
          margin: '0 auto',
          fontWeight: initialScore !== null ? '600' : 'normal',
          cursor: isSaving ? 'wait' : 'pointer',
          border: isEditing ? '2px solid #667eea' : '1px solid #dee2e6',
          borderRadius: '4px',
          outline: 'none',
        }}
        value={value}
        disabled={isSaving}
        onFocus={() => {
          setIsEditing(true)
          onCellFocus?.(studentId, assessmentId)
        }}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          handleSave()
          onCellBlur?.()
        }}
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
      {!isEditing && !isSaving && (
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            borderRadius: '4px',
          }}
        >
          <svg
            className="w-3 h-3 text-accent-purple/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </div>
      )}
    </div>
  )
}
