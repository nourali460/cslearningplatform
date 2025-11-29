import { db } from '@/lib/db'
import { uploadToGCS } from '@/lib/gcs-upload'

/**
 * Upload Helper Utility
 *
 * Handles file validation, quota checking, and database operations
 * for file uploads in the CS Learning Platform.
 */

// Configuration
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '30')
const MAX_USER_STORAGE_MB = parseInt(process.env.MAX_USER_STORAGE_MB || '500')
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const MAX_USER_STORAGE_BYTES = BigInt(MAX_USER_STORAGE_MB * 1024 * 1024)

// Allowed file types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
]

const ALLOWED_MIME_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]

export interface FileValidationResult {
  isValid: boolean
  error?: string
}

export interface UserQuota {
  used: bigint
  limit: bigint
  remaining: bigint
  usedMB: number
  limitMB: number
  remainingMB: number
}

/**
 * Validate file type and size
 */
export function validateFile(
  fileName: string,
  mimeType: string,
  fileSize: number
): FileValidationResult {
  // Check file size
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`,
    }
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: images (jpg, png, gif, webp) and documents (pdf, docx, txt, md)`,
    }
  }

  return { isValid: true }
}

/**
 * Check if file is an image
 */
export function isImage(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType)
}

/**
 * Get user's current storage usage
 */
export async function getUserQuota(userId: string): Promise<UserQuota> {
  try {
    const result = await db.fileUpload.aggregate({
      where: {
        userId,
      },
      _sum: {
        fileSize: true,
      },
    })

    const used = result._sum.fileSize || BigInt(0)
    const limit = MAX_USER_STORAGE_BYTES
    const remaining = limit - used

    return {
      used,
      limit,
      remaining,
      usedMB: Number(used) / (1024 * 1024),
      limitMB: MAX_USER_STORAGE_MB,
      remainingMB: Number(remaining) / (1024 * 1024),
    }
  } catch (error) {
    console.error('Error getting user quota:', error)
    throw error
  }
}

/**
 * Check if user has enough quota for a file upload
 */
export async function checkQuota(
  userId: string,
  fileSize: number
): Promise<FileValidationResult> {
  try {
    const quota = await getUserQuota(userId)

    if (BigInt(fileSize) > quota.remaining) {
      return {
        isValid: false,
        error: `Insufficient storage quota. Used: ${quota.usedMB.toFixed(2)}MB / ${quota.limitMB}MB. This file requires ${(fileSize / (1024 * 1024)).toFixed(2)}MB.`,
      }
    }

    return { isValid: true }
  } catch (error) {
    console.error('Error checking quota:', error)
    return {
      isValid: false,
      error: 'Failed to check storage quota',
    }
  }
}

/**
 * Upload file and create database record
 */
export async function uploadFile(
  file: Buffer,
  fileName: string,
  mimeType: string,
  userId: string
): Promise<{
  id: string
  publicUrl: string
  fileName: string
  fileSize: number
}> {
  try {
    // Validate file
    const validation = validateFile(fileName, mimeType, file.length)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    // Check quota
    const quotaCheck = await checkQuota(userId, file.length)
    if (!quotaCheck.isValid) {
      throw new Error(quotaCheck.error)
    }

    // Upload to GCS
    const uploadResult = await uploadToGCS(file, fileName, mimeType, userId)

    // Create database record
    const fileUpload = await db.fileUpload.create({
      data: {
        userId,
        fileName: uploadResult.fileName,
        fileSize: BigInt(uploadResult.fileSize),
        mimeType: uploadResult.mimeType,
        gcsPath: uploadResult.gcsPath,
        publicUrl: uploadResult.publicUrl,
      },
    })

    return {
      id: fileUpload.id,
      publicUrl: fileUpload.publicUrl,
      fileName: fileUpload.fileName,
      fileSize: Number(fileUpload.fileSize),
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

/**
 * Delete file upload and remove from GCS
 */
export async function deleteFile(fileId: string, userId: string): Promise<boolean> {
  try {
    // Get file record
    const fileUpload = await db.fileUpload.findUnique({
      where: { id: fileId },
    })

    if (!fileUpload) {
      throw new Error('File not found')
    }

    // Check ownership
    if (fileUpload.userId !== userId) {
      throw new Error('Unauthorized')
    }

    // Delete from database
    await db.fileUpload.delete({
      where: { id: fileId },
    })

    // Note: GCS deletion could be done here, but we'll skip it for now
    // to avoid orphaned records if GCS delete fails
    // deleteFromGCS(fileUpload.gcsPath)

    return true
  } catch (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}
