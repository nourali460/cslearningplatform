import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { uploadFile } from '@/lib/upload-helper'

/**
 * POST /api/upload
 *
 * Upload a file (image or document) to Google Cloud Storage
 *
 * Request: multipart/form-data with 'file' field
 * Response: { id, url, fileName, fileSize }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Parse multipart/form-data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload file with validation and quota checking
    const result = await uploadFile(
      buffer,
      file.name,
      file.type,
      user.id
    )

    return NextResponse.json({
      success: true,
      id: result.id,
      url: result.publicUrl,
      fileName: result.fileName,
      fileSize: result.fileSize,
    })
  } catch (error) {
    console.error('Error in upload API:', error)

    // Return user-friendly error messages
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * GET /api/upload
 *
 * Get user's uploaded files
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get user's uploads
    const { db } = await import('@/lib/db')
    const uploads = await db.fileUpload.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        publicUrl: true,
        uploadedAt: true,
      },
    })

    return NextResponse.json({
      uploads: uploads.map(upload => ({
        ...upload,
        fileSize: Number(upload.fileSize),
      })),
    })
  } catch (error) {
    console.error('Error fetching uploads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch uploads' },
      { status: 500 }
    )
  }
}
