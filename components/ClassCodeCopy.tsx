'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Copy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function ClassCodeCopy({ classCode }: { classCode: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(classCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="font-mono text-sm">
        {classCode}
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-8 px-2"
        title="Copy class code"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
