'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Admin portal error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>
            An error occurred in the admin portal. This might be due to a database connection issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="font-mono text-sm text-destructive">
              {error.message || 'Unknown error occurred'}
            </p>
            {error.digest && (
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Troubleshooting steps:</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Check if the database is running and accessible</li>
              <li>Verify DATABASE_URL in your .env file is correct</li>
              <li>Check your terminal for detailed error logs</li>
              <li>Try visiting /api/health to test database connectivity</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" asChild>
              <a href="/api/health" target="_blank" rel="noopener noreferrer">
                Check Health
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/">Go Home</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
