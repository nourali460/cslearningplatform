'use client'

import { useState } from 'react'
import {
  MessageSquare,
  ThumbsUp,
  Pin,
  ChevronDown,
  ChevronUp,
  User,
  Reply,
  Paperclip,
  Download,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SafeHTML } from '@/components/ui/safe-html'
import { ProfessorDiscussionReply } from './ProfessorDiscussionReply'

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
    fullName: string
    email: string
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
    fullName: string
    email: string
  }
  replies: DiscussionReply[]
  _count: {
    replies: number
  }
}

interface DiscussionPostCardProps {
  post: DiscussionPost
  onTogglePin: (postId: string) => void
  onReplyCreated?: () => void
  minimumReplyCount?: number
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

export function DiscussionPostCard({
  post,
  onTogglePin,
  onReplyCreated,
  minimumReplyCount = 1,
}: DiscussionPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showReplyForm, setShowReplyForm] = useState(false)

  const meetsRequirements = post._count.replies >= minimumReplyCount

  return (
    <Card className={`overflow-hidden ${post.isPinned ? 'border-accent-purple' : ''}`}>
      <CardHeader className={post.isPinned ? 'bg-accent-purple/5' : 'bg-background-secondary/30'}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Student Info */}
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-accent-orange/10 flex items-center justify-center">
                <User size={16} className="text-accent-orange" />
              </div>
              <div>
                <p className="font-semibold">{post.student.fullName}</p>
                <p className="text-xs text-foreground-secondary">{post.student.email}</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {post.isPinned && (
                <Badge variant="purple" className="flex items-center gap-1">
                  <Pin size={12} />
                  Pinned
                </Badge>
              )}
              {meetsRequirements ? (
                <Badge variant="success" className="flex items-center gap-1">
                  Complete ({post._count.replies} replies)
                </Badge>
              ) : (
                <Badge variant="warning" className="flex items-center gap-1">
                  Incomplete ({post._count.replies}/{minimumReplyCount} replies)
                </Badge>
              )}
              <span className="text-xs text-foreground-secondary">
                Posted {new Date(post.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant={post.isPinned ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTogglePin(post.id)}
              title={post.isPinned ? 'Unpin post' : 'Pin post'}
            >
              <Pin size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="ml-auto border-accent-purple/20 text-accent-purple hover:bg-accent-purple/10 hover:border-accent-purple/40 transition-colors"
            >
              <Reply size={14} className="mr-2" />
              Reply as Professor
            </Button>
          </div>

          {/* Replies */}
          {post.replies.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Replies</h4>
              {post.replies.map((reply) => (
                <div
                  key={reply.id}
                  className="pl-4 border-l-2 border-border-secondary py-2"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div className="h-6 w-6 rounded-full bg-background-secondary flex items-center justify-center flex-shrink-0">
                      <User size={12} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-sm">
                          {reply.author.fullName}
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

          {/* Professor Reply Form */}
          {showReplyForm && onReplyCreated && (
            <div className="mt-4">
              <ProfessorDiscussionReply
                postId={post.id}
                onReplyCreated={() => {
                  setShowReplyForm(false)
                  onReplyCreated()
                }}
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
