'use client'

import { sanitizeHtml } from '@/lib/sanitize-html'
import { useMemo } from 'react'

interface SafeHTMLProps {
  html: string
  className?: string
}

/**
 * SafeHTML Component
 *
 * Renders HTML content safely by sanitizing it before display.
 * Use this component for displaying user-generated rich text content
 * from the RichTextEditor (discussion posts, replies, prompts, etc.)
 *
 * Features:
 * - Automatic HTML sanitization via DOMPurify
 * - XSS protection
 * - Styled rendering of HTML elements (lists, headings, code, etc.)
 * - Backward compatible with plain text (renders as-is)
 *
 * @param html - The HTML string to render (can be plain text)
 * @param className - Optional additional CSS classes
 */
export function SafeHTML({ html, className = '' }: SafeHTMLProps) {
  // Memoize sanitization to avoid re-computing on every render
  const sanitizedHtml = useMemo(() => sanitizeHtml(html), [html])

  return (
    <div
      className={`safe-html-content ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      style={{
        // Base styling for rich text content
        lineHeight: '1.6',
      }}
    />
  )
}

/**
 * Global styles for rich text content rendering
 * These styles match the TipTap editor styling for consistency
 *
 * Add to your globals.css or apply via Tailwind:
 *
 * .safe-html-content ul { @apply list-disc pl-6 my-2; }
 * .safe-html-content ol { @apply list-decimal pl-6 my-2; }
 * .safe-html-content li { @apply my-1; }
 * .safe-html-content h1 { @apply text-2xl font-bold my-4; }
 * .safe-html-content h2 { @apply text-xl font-bold my-3; }
 * .safe-html-content p { @apply my-2; }
 * .safe-html-content blockquote { @apply border-l-4 border-muted pl-4 italic my-2; }
 * .safe-html-content code { @apply bg-muted px-1.5 py-0.5 rounded text-sm font-mono; }
 * .safe-html-content pre { @apply bg-muted p-4 rounded-lg my-2 overflow-x-auto; }
 * .safe-html-content a { @apply text-accent-purple underline cursor-pointer hover:text-accent-purple/80; }
 * .safe-html-content img { @apply max-w-full h-auto rounded-lg my-2; }
 * .safe-html-content strong { @apply font-bold; }
 * .safe-html-content em { @apply italic; }
 * .safe-html-content u { @apply underline; }
 */
