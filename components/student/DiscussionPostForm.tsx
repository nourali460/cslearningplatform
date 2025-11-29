'use client'

import { useState, useMemo } from 'react'
import { Send, Loader2, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { FileAttachmentInput, type Attachment } from '@/components/FileAttachmentInput'

interface DiscussionPostFormProps {
  assessmentId: string
  onPostCreated: () => void
}

export function DiscussionPostForm({
  assessmentId,
  onPostCreated,
}: DiscussionPostFormProps) {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
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
      setError('Please enter your post content')
      return
    }

    if (plainTextLength < 50) {
      setError('Post content must be at least 50 characters')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/student/assessments/${assessmentId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          attachmentIds: attachments.map(a => a.id),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create post')
      }

      setSuccess(true)
      setContent('')
      setAttachments([])

      // Auto-refresh after 2 seconds
      setTimeout(() => {
        onPostCreated()
      }, 2000)
    } catch (error) {
      console.error('Error creating post:', error)
      setError(error instanceof Error ? error.message : 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Your Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Share your thoughts and ideas... Use the toolbar to format your post."
              disabled={isSubmitting}
              minHeight={250}
              maxHeight={500}
              showCharacterCount={false}
            />
            <div className="flex justify-between items-center mt-2">
              <span className={`text-sm ${plainTextLength < 50 ? 'text-warning' : 'text-foreground-secondary'}`}>
                {plainTextLength} characters{plainTextLength < 50 && ' (minimum 50 recommended)'}
              </span>
              {plainTextLength > 0 && (
                <span className="text-xs text-foreground-secondary">
                  ⚠️ You can only post once
                </span>
              )}
            </div>
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Attachments (Optional)
            </label>
            <FileAttachmentInput
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              maxFiles={3}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="p-3 bg-error/10 border border-error rounded-lg">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-success/10 border border-success rounded-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <p className="text-sm text-success font-medium">
                Post created successfully! Now reply to your classmates to complete the discussion.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || plainTextLength === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
