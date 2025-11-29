'use client'

import { useState } from 'react'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RotateCcw, Terminal } from 'lucide-react'

/**
 * Editor Lab Page
 *
 * Internal testing page for the RichTextEditor component.
 * Allows developers to test editor functionality with a title field,
 * character counting, and state reset/logging capabilities.
 *
 * Route: /admin/editor-lab
 */
export default function EditorLabPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleReset = () => {
    setTitle('')
    setContent('')
  }

  const handleLogValue = () => {
    console.group('📝 Editor Lab - Current Values')
    console.log('Title:', title)
    console.log('Content (HTML):', content)
    console.log('Content Length:', content.length)
    console.log('Title + Content:', { title, content })
    console.groupEnd()

    // Also show a browser alert for quick feedback
    alert(`Logged to console!\n\nTitle: "${title}"\nContent length: ${content.length} chars`)
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
          Editor Lab
        </h1>
        <p className="text-foreground-secondary">
          Internal page for testing the rich text editor component. Create and format content to verify all editor features are working correctly.
        </p>
      </div>

      {/* Main Editor Card */}
      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-accent-purple/5 to-accent-orange/5 rounded-t-lg -mx-6 -mt-6 px-6 pt-6 mb-6">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-accent-purple" />
            Content Editor
          </CardTitle>
          <CardDescription>
            Test all editor features including formatting, lists, links, images, and code blocks.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="content-title" className="text-base font-semibold">
              Title
            </Label>
            <Input
              id="content-title"
              type="text"
              placeholder="Enter a title for your content..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Rich Text Editor */}
          <div className="space-y-2">
            <Label htmlFor="content-editor" className="text-base font-semibold">
              Content
            </Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Start typing your content here..."
              minHeight={300}
              maxHeight={600}
              showCharacterCount={true}
            />
          </div>

          {/* Helper Text */}
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <p className="text-sm text-foreground-secondary">
              <strong>Quick Tips:</strong>
            </p>
            <ul className="text-sm text-foreground-secondary mt-2 space-y-1 list-disc list-inside">
              <li>Use <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Cmd/Ctrl + B</kbd> for bold</li>
              <li>Use <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Cmd/Ctrl + I</kbd> for italic</li>
              <li>Use <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Cmd/Ctrl + U</kbd> for underline</li>
              <li>Click the image icon to insert images by URL or upload files</li>
              <li>Select text before clicking link icon to create hyperlinks</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-4 bg-muted/30 border-t border-border rounded-b-lg -mx-6 -mb-6 px-6 py-4">
          {/* Character Count Display */}
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Total Length:</span>{' '}
            <span className="font-mono">{content.length}</span> characters
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleLogValue}
              className="gap-2 bg-accent-purple hover:bg-accent-purple/90"
            >
              <Terminal className="h-4 w-4" />
              Log Value
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* API Integration Reminder Card */}
      <Card className="border-l-4 border-l-accent-orange">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            🔌 API Integration Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">
              Image Upload Handler
            </p>
            <p className="text-sm text-foreground-secondary">
              The image upload button currently uses a stub. To enable real uploads,
              implement the <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">handleImageUpload</code> function
              in <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">RichTextEditor.tsx</code> to
              call your upload API endpoint.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">
              Save to Database
            </p>
            <p className="text-sm text-foreground-secondary">
              When ready to persist content, create an API endpoint (e.g., <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">POST /api/content</code>)
              and call it from this page with the title and content values.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Developer Info Card */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Developer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-foreground-secondary">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium text-foreground">Editor Library:</span> TipTap
            </div>
            <div>
              <span className="font-medium text-foreground">Component:</span> RichTextEditor
            </div>
            <div>
              <span className="font-medium text-foreground">Route:</span> /admin/editor-lab
            </div>
            <div>
              <span className="font-medium text-foreground">Type:</span> Client Component
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
