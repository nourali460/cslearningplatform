import DOMPurify from 'isomorphic-dompurify'

/**
 * Configuration for allowed HTML tags and attributes
 * Used for sanitizing rich text content from TipTap editor
 */
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  'h1',
  'h2',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'a',
  'img',
]

const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class']

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Can be used on both client and server side (isomorphic)
 *
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return ''
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Remove any tags not in the allowed list
    KEEP_CONTENT: true,
    // Don't allow data URIs in images (potential XSS vector)
    ALLOW_DATA_ATTR: false,
    // Return HTML string, not DOM nodes
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  })
}

/**
 * Sanitizes HTML and strips it to plain text
 * Useful for previews, notifications, or character counting
 *
 * @param html - HTML string to convert to plain text
 * @returns Plain text without HTML tags
 */
export function htmlToPlainText(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  // First sanitize to be safe
  const clean = sanitizeHtml(html)

  // Remove all HTML tags
  const text = clean.replace(/<[^>]*>/g, '')

  // Decode HTML entities
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

/**
 * Validates HTML content length after sanitization
 * Used for API validation to ensure content meets requirements
 *
 * @param html - HTML string to validate
 * @param minLength - Minimum required length (default: 0)
 * @param maxLength - Maximum allowed length (default: 10000)
 * @returns Object with validation result and sanitized content
 */
export function validateHtmlContent(
  html: string,
  minLength: number = 0,
  maxLength: number = 10000
): {
  isValid: boolean
  sanitized: string
  length: number
  error?: string
} {
  // Sanitize first
  const sanitized = sanitizeHtml(html)

  // Get plain text length for validation
  const plainText = sanitized.replace(/<[^>]*>/g, '').trim()
  const length = plainText.length

  if (length < minLength) {
    return {
      isValid: false,
      sanitized,
      length,
      error: `Content must be at least ${minLength} characters`,
    }
  }

  if (length > maxLength) {
    return {
      isValid: false,
      sanitized,
      length,
      error: `Content must not exceed ${maxLength} characters`,
    }
  }

  return {
    isValid: true,
    sanitized,
    length,
  }
}
