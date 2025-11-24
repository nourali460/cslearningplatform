import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './lib/jwt'

const PUBLIC_ROUTES = [
  '/',
  '/sign-in',
  '/sign-up',
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/init-admin',
  '/api/seed',
  '/api/validate-class-code',
]

const PUBLIC_PREFIXES = [
  '/api/webhooks',
]

/**
 * Check if a path is public (doesn't require authentication)
 */
function isPublicPath(pathname: string): boolean {
  // Exact match
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true
  }

  // Prefix match
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return true
    }
  }

  return false
}

/**
 * Middleware to protect routes with JWT authentication
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Get session cookie
  const sessionCookie = request.cookies.get('session')

  // No session cookie - redirect to sign-in
  if (!sessionCookie?.value) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Verify JWT token
  const payload = await verifyToken(sessionCookie.value)

  // Invalid token - clear cookie and redirect to sign-in
  if (!payload) {
    const response = NextResponse.redirect(new URL('/sign-in', request.url))
    response.cookies.delete('session')
    return response
  }

  // Token valid - allow request
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
