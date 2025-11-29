'use client'

import { useState, useMemo } from 'react'
import {
  MessageSquare,
  ThumbsUp,
  Pin,
  ChevronDown,
  ChevronUp,
  User,
  Send,
  Loader2,
  CheckCircle,
  Paperclip,
  Download,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { SafeHTML } from '@/components/ui/safe-html'

interface FileAttachment {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
}

interface DiscussionReply {
  id: string
  content: string
  createdAt: string
  attachments?: FileAttachment[]
  author: {
    id: string
    fullName?: string
    email?: string
  }
}

interface DiscussionPost {
  id: string
  content: string
  createdAt: string
  isPinned: boolean
  likeCount: number
  attachments?: FileAttachment[]
  student: {
    id: string
    fullName?: string
    email?: string
  }
  replies: DiscussionReply[]
  _count: {
    replies: number
  }
}

interface StudentDiscussionPostProps {
  post: DiscussionPost
  currentStudentId: string
  allowReplies: boolean
  showAnonymous: boolean
  onReplyCreated: () => void
}

function AttachmentList({ attachments }: { attachments: FileAttachment[] }) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType === 'application/pdf') return '📄'
    if (
      mimeType === 'application/msword' ||
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
      return '📝'
    if (mimeType.startsWith('text/')) return '📃'
    return '📎'
  }

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center gap-1 text-xs text-foreground-secondary">
        <Paperclip className="h-3 w-3" />
        <span>Attachments ({attachments.length})</span>
      </div>
      <div className="space-y-2">
        {attachments.map((file) => (
          <a
            key={file.id}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-background-secondary rounded-lg border border-border hover:border-accent-purple/40 transition-colors group"
          >
            <span className="text-xl flex-shrink-0">{getFileIcon(file.mimeType)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {file.fileName}
              </p>
              <p className="text-xs text-foreground-secondary">
                {formatFileSize(file.fileSize)}
              </p>
            </div>
            <Download className="h-4 w-4 text-foreground-secondary group-hover:text-accent-purple transition-colors flex-shrink-0" />
          </a>
        ))}
      </div>
    </div>
  )
}

export function StudentDiscussionPost({
  post,
  currentStudentId,
  allowReplies,
  showAnonymous,
  onReplyCreated,
}: StudentDiscussionPostProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [replySuccess, setReplySuccess] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  const isOwnPost = post.student.id === currentStudentId

  // Calculate plain text length from HTML content for reply
  const replyPlainTextLength = useMemo(() => {
    const temp = document.createElement('div')
    temp.innerHTML = replyContent
    return temp.textContent?.trim().length || 0
  }, [replyContent])

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (replyPlainTextLength === 0) return

    setIsSubmittingReply(true)
    setReplyError(null)
    setReplySuccess(false)

    try {
      const response = await fetch(`/api/student/discussions/${post.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create reply')
      }

      setReplySuccess(true)
      setReplyContent('')

      // Auto-refresh after 1.5 seconds
      setTimeout(() => {
        setShowReplyForm(false)
        setReplySuccess(false)
        onReplyCreated()
      }, 1500)
    } catch (error) {
      console.error('Error creating reply:', error)
      setReplyError(error instanceof Error ? error.message : 'Failed to create reply')
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const getAuthorDisplay = (author: { fullName?: string; email?: string }) => {
    if (showAnonymous) {
      return 'Anonymous Student'
    }
    return author.fullName || author.email || 'Student'
  }

  return (
    <Card className={post.isPinned ? 'border-accent-purple' : ''}>
      <CardHeader className={post.isPinned ? 'bg-accent-purple/5' : 'bg-background-secondary/30'}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Author Info */}
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-accent-orange/10 flex items-center justify-center">
                <User size={16} className="text-accent-orange" />
              </div>
              <div>
                <p className="font-semibold">
                  {getAuthorDisplay(post.student)}
                  {isOwnPost && <span className="text-sm text-foreground-secondary ml-2">(You)</span>}
                </p>
                <p className="text-xs text-foreground-secondary">
                  Posted {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {post.isPinned && (
                <Badge variant="purple" className="flex items-center gap-1">
                  <Pin size={12} />
                  Pinned by Instructor
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-4">
          {/* Post Content */}
          <div className="mb-4">
            <SafeHTML html={post.content} />
          </div>

          {/* Attachments */}
          {post.attachments && post.attachments.length > 0 && (
            <AttachmentList attachments={post.attachments} />
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-foreground-secondary mb-4 pb-4 border-b">
            <div className="flex items-center gap-1">
              <MessageSquare size={14} />
              <span>{post._count.replies} replies</span>
            </div>
            {post.likeCount > 0 && (
              <div className="flex items-center gap-1">
                <ThumbsUp size={14} />
                <span>{post.likeCount} likes</span>
              </div>
            )}
            {allowReplies && !isOwnPost && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="ml-auto border-accent-purple/20 text-accent-purple hover:bg-accent-purple/10 hover:border-accent-purple/40 transition-colors"
              >
                <MessageSquare size={14} className="mr-2" />
                Reply
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && allowReplies && (
            <div className="mb-4 p-4 bg-background-secondary/30 rounded-lg">
              <form onSubmit={handleReplySubmit} className="space-y-3">
                <RichTextEditor
                  value={replyContent}
                  onChange={setReplyContent}
                  placeholder="Write your reply... Use the toolbar to format your response."
                  disabled={isSubmittingReply}
                  minHeight={150}
                  maxHeight={400}
                  showCharacterCount={false}
                />

                {replyError && (
                  <div className="p-2 bg-error/10 border border-error rounded-lg">
                    <p className="text-sm text-error">{replyError}</p>
                  </div>
                )}

                {replySuccess && (
                  <div className="p-2 bg-success/10 border border-success rounded-lg flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <p className="text-sm text-success font-medium">
                      Reply posted successfully!
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowReplyForm(false)
                      setReplyContent('')
                    }}
                    disabled={isSubmittingReply}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmittingReply || replyPlainTextLength === 0}
                  >
                    {isSubmittingReply ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Post Reply
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Replies */}
          {post.replies.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Replies</h4>
              {post.replies.map((reply) => (
                <div
                  key={reply.id}
                  className="pl-4 border-l-2 border-border-secondary py-2"
                >
                  <div className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded-full bg-background-secondary flex items-center justify-center flex-shrink-0">
                      <User size={12} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-sm">
                          {getAuthorDisplay(reply.author)}
                        </span>
                        <span className="text-xs text-foreground-secondary">
                          {new Date(reply.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm mt-1">
                        <SafeHTML html={reply.content} />
                      </div>
                      {/* Reply Attachments */}
                      {reply.attachments && reply.attachments.length > 0 && (
                        <div className="mt-2">
                          <AttachmentList attachments={reply.attachments} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {post.replies.length === 0 && (
            <div className="text-center py-4 text-foreground-secondary text-sm">
              No replies yet
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
