# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a CS Learning Platform built with Next.js 15+ using the App Router architecture, React 19, TypeScript, and Tailwind CSS 4.

## Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Create production build
npm start        # Start production server
npm run lint     # Run ESLint
```

Alternative package managers (yarn, pnpm, bun) are supported.

## Tech Stack

- **Next.js 15+** - App Router (not Pages Router)
- **React 19** - Server Components by default
- **TypeScript 5.x** - Strict mode enabled
- **Tailwind CSS 4.x** - Utility-first styling with inline theme
- **ESLint 9.x** - Next.js recommended config

## Architecture

### App Router Structure

```
app/
├── layout.tsx        # Root layout with metadata and font configuration
├── page.tsx          # Home page (Server Component by default)
└── globals.css       # Global styles with Tailwind imports
```

- **File-based routing**: Files in `/app` directory create routes
- **Server Components**: Components are Server Components by default unless marked with `"use client"`
- **Layouts**: `layout.tsx` wraps child pages and persists across navigation
- **Pages**: `page.tsx` files define route content

### TypeScript Configuration

- **Path alias**: `@/*` maps to project root for cleaner imports
  ```typescript
  import { Component } from '@/app/components/Component'
  ```
- **Strict mode**: Enabled for type safety
- **Target**: ES2017

### Styling System

- **Tailwind CSS 4**: Uses inline theme configuration via `@theme inline` directive
- **Dark mode**: CSS custom properties with `prefers-color-scheme` media query
  - Theme colors: `--background`, `--foreground`
  - Access via Tailwind: `bg-background`, `text-foreground`
- **Fonts**: Geist Sans (body) and Geist Mono (code) loaded via `next/font/google`
  - Variables: `--font-geist-sans`, `--font-geist-mono`

## Key Conventions

### Component Patterns

- Server Components are the default (no `"use client"` needed)
- Use `"use client"` only when using:
  - React hooks (useState, useEffect, etc.)
  - Browser APIs
  - Event handlers
  - Context providers

### File Naming

- `layout.tsx` - Layout components
- `page.tsx` - Route pages
- `globals.css` - Global styles

### Metadata

Export metadata objects for SEO in layouts and pages:
```typescript
export const metadata: Metadata = {
  title: "Page Title",
  description: "Page description"
}
```

## Current State

This is a fresh Next.js project with minimal setup. Not yet implemented:
- Database integration
- Authentication/authorization
- API routes or Server Actions
- Custom component library
- State management
- Testing infrastructure
- Environment variables
