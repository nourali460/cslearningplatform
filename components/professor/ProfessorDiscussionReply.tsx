'use client'

import { useState, useMemo } from 'react'
import { Send, Loader2, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/admin/RichTextEditor'

interface ProfessorDiscussionReplyProps {
  postId: string
  onReplyCreated: () => void
  onCancel?: () => void
}

/**
 * ProfessorDiscussionReply Component
 *
 * Allows professors to reply to student discussion posts using rich text.
 * Professor replies are visually distinguished from student replies.
 */
export function ProfessorDiscussionReply({
  postId,
  onReplyCreated,
  onCancel,
}: ProfessorDiscussionReplyProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Calculate plain text length from HTML content
  const plainTextLength = useMemo(() => {
    const temp = document.createElement('div')
    temp.innerHTML = content
    return temp.textContent?.trim().length || 0
  }, [content])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (plainTextLength === 0) {
      setError('Please enter your reply content')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/professor/discussions/${postId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create reply')
      }

      setSuccess(true)
      setContent('')

      // Auto-refresh after 1.5 seconds
      setTimeout(() => {
        setSuccess(false)
        onReplyCreated()
      }, 1500)
    } catch (error) {
      console.error('Error creating professor reply:', error)
      setError(error instanceof Error ? error.message : 'Failed to create reply')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 bg-accent-purple/5 border border-accent-purple/20 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-accent-purple" />
          <span className="text-sm font-semibold text-accent-purple">
            Professor Reply
          </span>
        </div>

        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Write your reply as a professor... Use formatting to make your response clear and helpful."
          disabled={isSubmitting}
          minHeight={150}
          maxHeight={400}
          showCharacterCount={false}
        />

        {error && (
          <div className="p-2 bg-error/10 border border-error rounded-lg">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-2 bg-success/10 border border-success rounded-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <p className="text-sm text-success font-medium">
              Reply posted successfully!
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || plainTextLength === 0}
            className="bg-accent-purple hover:bg-accent-purple/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Post as Professor
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
