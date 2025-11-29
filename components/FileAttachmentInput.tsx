'use client'

import { useState, useRef } from 'react'
import { X, Paperclip, FileText, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface Attachment {
  id: string
  url: string
  fileName: string
  fileSize: number
  mimeType: string
}

interface FileAttachmentInputProps {
  attachments: Attachment[]
  onAttachmentsChange: (attachments: Attachment[]) => void
  maxFiles?: number
  disabled?: boolean
}

/**
 * File Attachment Input Component
 *
 * Allows users to upload and manage file attachments.
 * Supports documents (PDF, DOCX, TXT, MD) with file size validation.
 */
export function FileAttachmentInput({
  attachments,
  onAttachmentsChange,
  maxFiles = 5,
  disabled = false,
}: FileAttachmentInputProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Check file count limit
    if (attachments.length + files.length > maxFiles) {
      alert(`You can only attach up to ${maxFiles} files`)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setUploading(true)
    const newAttachments: Attachment[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(`Uploading ${file.name} (${i + 1}/${files.length})...`)

        // Upload file
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || `Failed to upload ${file.name}`)
        }

        const result = await response.json()
        newAttachments.push({
          id: result.id,
          url: result.url,
          fileName: result.fileName,
          fileSize: result.fileSize,
          mimeType: file.type,
        })
      }

      // Update attachments
      onAttachmentsChange([...attachments, ...newAttachments])
    } catch (error) {
      console.error('Upload error:', error)
      alert(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setUploading(false)
      setUploadProgress('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter((att) => att.id !== id))
  }

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
    <div className="space-y-3">
      {/* Attachment List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 bg-background-secondary rounded-lg border border-border group"
            >
              <span className="text-2xl flex-shrink-0">
                {getFileIcon(attachment.mimeType)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {attachment.fileName}
                </p>
                <p className="text-xs text-foreground-secondary">
                  {formatFileSize(attachment.fileSize)}
                </p>
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(attachment.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {!disabled && attachments.length < maxFiles && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.md,image/*"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadProgress}
              </>
            ) : (
              <>
                <Paperclip className="h-4 w-4 mr-2" />
                Attach Files ({attachments.length}/{maxFiles})
              </>
            )}
          </Button>
          <p className="text-xs text-foreground-secondary mt-2 text-center">
            Supported: Images, PDF, DOCX, TXT, MD (max 30MB per file)
          </p>
        </div>
      )}
    </div>
  )
}
