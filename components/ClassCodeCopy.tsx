'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Check } from 'lucide-react'

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
    <div className="flex items-center gap-3">
      <Badge variant="purple" className="font-mono text-sm px-3 py-1">
        {classCode}
      </Badge>
      <Button
        type="button"
        size="sm"
        variant={copied ? 'success' : 'outline'}
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy class code'}
      >
        {copied ? (
          <>
            <Check className="mr-1 h-3 w-3" />
            Copied
          </>
        ) : (
          <>
            <Copy className="mr-1 h-3 w-3" />
            Copy
          </>
        )}
      </Button>
    </div>
  )
}
