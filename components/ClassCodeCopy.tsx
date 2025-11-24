'use client'

import { useState } from 'react'

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
    <div className="d-flex align-items-center gap-2">
      <code className="badge bg-primary fs-6 font-monospace">
        {classCode}
      </code>
      <button
        type="button"
        className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-primary'}`}
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy class code'}
      >
        {copied ? (
          <>
            <i className="bi bi-check2 me-1"></i>
            Copied
          </>
        ) : (
          <>
            <i className="bi bi-clipboard me-1"></i>
            Copy
          </>
        )}
      </button>
    </div>
  )
}
