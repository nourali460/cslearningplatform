'use client'

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  Link2,
  Code,
  Code2,
  Quote,
  Undo,
  Redo,
  Image as ImageIcon,
  Upload,
  Type,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

// Initialize lowlight for code syntax highlighting
const lowlight = createLowlight(common)

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
  minHeight?: number // in pixels
  maxHeight?: number // in pixels
  showCharacterCount?: boolean
}

/**
 * RichTextEditor Component
 *
 * A fully-featured rich text editor built with TipTap for internal testing.
 * Supports formatting, lists, headings, links, images, code blocks, and more.
 *
 * @param value - HTML string representing the editor content
 * @param onChange - Callback when content changes (receives HTML string)
 * @param placeholder - Placeholder text when editor is empty
 * @param disabled - Disables editing when true
 * @param minHeight - Minimum editor height in pixels (default: 200)
 * @param maxHeight - Maximum editor height in pixels (default: 600)
 * @param showCharacterCount - Show character count in bottom-right (default: true)
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  disabled = false,
  minHeight = 200,
  maxHeight = 600,
  showCharacterCount = true,
}: RichTextEditorProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [showImageUrlDialog, setShowImageUrlDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false, // Prevent SSR hydration mismatch
    extensions: [
      StarterKit.configure({
        // Configure heading levels
        heading: {
          levels: [1, 2],
        },
        // Use custom code block with syntax highlighting
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-accent-purple underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CharacterCount,
      Placeholder.configure({
        placeholder,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-background-secondary p-4 rounded-lg font-mono text-sm',
        },
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: `focus:outline-none px-4 py-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:my-1 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3 [&_p]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-border-secondary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-2 [&_code]:bg-background-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono`,
        style: `min-height: ${minHeight}px; max-height: ${maxHeight}px; overflow-y: auto;`,
      },
    },
  })

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  // Update editable state when disabled prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [disabled, editor])

  const handleInsertLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    setLinkUrl(previousUrl || '')
    setShowLinkDialog(true)
  }, [editor])

  const confirmInsertLink = useCallback(() => {
    if (!editor) return

    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run()
    }
    setShowLinkDialog(false)
    setLinkUrl('')
  }, [editor, linkUrl])

  const handleInsertImageUrl = useCallback(() => {
    setImageUrl('')
    setShowImageUrlDialog(true)
  }, [])

  const confirmInsertImageUrl = useCallback(() => {
    if (!editor || !imageUrl) return

    editor.chain().focus().setImage({ src: imageUrl }).run()
    setShowImageUrlDialog(false)
    setImageUrl('')
  }, [editor, imageUrl])

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file || !editor) return

      // Validate file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      try {
        // Insert a placeholder while uploading
        const placeholderUrl = URL.createObjectURL(file)
        editor.chain().focus().setImage({ src: placeholderUrl }).run()

        // Upload to server
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        const { url } = await response.json()

        // Replace placeholder with actual URL
        const { state } = editor
        const { doc } = state
        let foundPlaceholder = false

        doc.descendants((node, pos) => {
          if (foundPlaceholder) return false
          if (node.type.name === 'image' && node.attrs.src === placeholderUrl) {
            editor
              .chain()
              .focus()
              .setNodeSelection(pos)
              .updateAttributes('image', { src: url })
              .run()
            foundPlaceholder = true
            return false
          }
        })

        // Cleanup object URL
        URL.revokeObjectURL(placeholderUrl)

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } catch (error) {
        console.error('Image upload error:', error)
        alert(
          `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`
        )

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [editor]
  )

  if (!editor) {
    return null
  }

  return (
    <div className="border border-border rounded-lg bg-background focus-within:ring-2 focus-within:ring-accent-purple/20 focus-within:border-accent-purple transition-all">
      {/* Toolbar */}
      <div className="border-b border-border p-2 flex flex-wrap gap-1">
        {/* Text Formatting Group */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            disabled={disabled}
            tooltip="Bold (Cmd+B)"
            aria-label="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            disabled={disabled}
            tooltip="Italic (Cmd+I)"
            aria-label="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            disabled={disabled}
            tooltip="Underline (Cmd+U)"
            aria-label="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Lists Group */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            disabled={disabled}
            tooltip="Bullet List"
            aria-label="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            disabled={disabled}
            tooltip="Numbered List"
            aria-label="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Headings Group */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border">
          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive('paragraph')}
            disabled={disabled}
            tooltip="Normal Text"
            aria-label="Normal Text"
          >
            <Type className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            disabled={disabled}
            tooltip="Heading 1"
            aria-label="Heading 1"
          >
            <span className="text-sm font-bold">H1</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            disabled={disabled}
            tooltip="Heading 2"
            aria-label="Heading 2"
          >
            <span className="text-sm font-bold">H2</span>
          </ToolbarButton>
        </div>

        {/* Alignment Group */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            disabled={disabled}
            tooltip="Align Left"
            aria-label="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            disabled={disabled}
            tooltip="Align Center"
            aria-label="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Links & Code Group */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border">
          <ToolbarButton
            onClick={handleInsertLink}
            isActive={editor.isActive('link')}
            disabled={disabled}
            tooltip="Insert Link"
            aria-label="Insert Link"
          >
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            disabled={disabled}
            tooltip="Inline Code"
            aria-label="Inline Code"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            disabled={disabled}
            tooltip="Code Block"
            aria-label="Code Block"
          >
            <Code2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            disabled={disabled}
            tooltip="Quote"
            aria-label="Quote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Image Group */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border">
          <ToolbarButton
            onClick={handleInsertImageUrl}
            disabled={disabled}
            tooltip="Insert Image URL"
            aria-label="Insert Image URL"
          >
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            tooltip="Upload Image"
            aria-label="Upload Image"
          >
            <Upload className="h-4 w-4" />
          </ToolbarButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={disabled}
          />
        </div>

        {/* History Group */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            tooltip="Undo"
            aria-label="Undo"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            tooltip="Redo"
            aria-label="Redo"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Area */}
      <EditorContent editor={editor} />

      {/* Character Counter */}
      {showCharacterCount && (
        <div className="px-4 py-2 text-xs text-foreground-tertiary text-right border-t border-border bg-background-secondary/30">
          {editor.storage.characterCount.characters()} characters
        </div>
      )}

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
            <DialogDescription>
              Enter the URL you want to link to. Leave empty to remove the link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    confirmInsertLink()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmInsertLink}>Insert Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image URL Dialog */}
      <Dialog open={showImageUrlDialog} onOpenChange={setShowImageUrlDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image URL</DialogTitle>
            <DialogDescription>
              Enter the URL of the image you want to insert.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    confirmInsertImageUrl()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageUrlDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmInsertImageUrl} disabled={!imageUrl}>
              Insert Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Toolbar Button Component
interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  tooltip?: string
  'aria-label': string
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  children,
  tooltip,
  'aria-label': ariaLabel,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={tooltip}
      className={`
        p-2 rounded hover:bg-background-secondary transition-colors
        ${isActive ? 'bg-background-secondary text-accent-purple' : 'text-foreground'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-accent-purple/30
      `}
    >
      {children}
    </button>
  )
}
