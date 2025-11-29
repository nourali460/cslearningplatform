'use client'

import { FileText, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface PageContentModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  content: string
  onMarkComplete?: () => void
}

export function PageContentModal({
  isOpen,
  onClose,
  title,
  content,
  onMarkComplete,
}: PageContentModalProps) {
  const handleClose = () => {
    if (onMarkComplete) {
      onMarkComplete()
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent-purple" />
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6">
            <div className="prose prose-sm max-w-none">
              {/* Render content as markdown or HTML */}
              {content.startsWith('#') || content.includes('\n#') ? (
                // Simple markdown rendering
                <div
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: content
                      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
                      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mb-3">$1</h2>')
                      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mb-2">$1</h3>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.+?)\*/g, '<em>$1</em>')
                      .replace(/\n\n/g, '</p><p class="mb-3">'),
                  }}
                />
              ) : (
                // Plain text or HTML
                <div
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
