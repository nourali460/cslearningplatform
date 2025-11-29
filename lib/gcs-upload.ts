import { Storage } from '@google-cloud/storage'

/**
 * Google Cloud Storage Upload Utility
 *
 * Handles file uploads to GCS bucket with user-based folder structure.
 * Files are stored as: uploads/{userId}/{timestamp}-{filename}
 */

// Initialize GCS client
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: process.env.GCS_SERVICE_ACCOUNT_EMAIL && process.env.GCS_PRIVATE_KEY
    ? {
        client_email: process.env.GCS_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }
    : undefined,
})

const bucketName = process.env.GCS_BUCKET_NAME || 'cslearningplatformbucket'
const bucket = storage.bucket(bucketName)

export interface UploadResult {
  gcsPath: string
  publicUrl: string
  fileName: string
  fileSize: number
  mimeType: string
}

/**
 * Upload a file to Google Cloud Storage
 *
 * @param file - The file buffer to upload
 * @param fileName - Original filename
 * @param mimeType - MIME type of the file
 * @param userId - User ID for folder structure
 * @returns Upload result with GCS path and public URL
 */
export async function uploadToGCS(
  file: Buffer,
  fileName: string,
  mimeType: string,
  userId: string
): Promise<UploadResult> {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const gcsPath = `uploads/${userId}/${timestamp}-${sanitizedFileName}`

    // Create a file reference in the bucket
    const fileRef = bucket.file(gcsPath)

    // Upload the file
    await fileRef.save(file, {
      metadata: {
        contentType: mimeType,
        metadata: {
          uploadedBy: userId,
          originalName: fileName,
        },
      },
      public: true, // Make file publicly accessible
    })

    // Generate public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsPath}`

    return {
      gcsPath,
      publicUrl,
      fileName: sanitizedFileName,
      fileSize: file.length,
      mimeType,
    }
  } catch (error) {
    console.error('Error uploading to GCS:', error)
    throw new Error(`Failed to upload file to Google Cloud Storage: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete a file from Google Cloud Storage
 *
 * @param gcsPath - Full path of the file in GCS
 * @returns True if deleted successfully
 */
export async function deleteFromGCS(gcsPath: string): Promise<boolean> {
  try {
    const fileRef = bucket.file(gcsPath)
    await fileRef.delete()
    return true
  } catch (error) {
    console.error('Error deleting from GCS:', error)
    return false
  }
}

/**
 * Check if a file exists in GCS
 *
 * @param gcsPath - Full path of the file in GCS
 * @returns True if file exists
 */
export async function fileExists(gcsPath: string): Promise<boolean> {
  try {
    const fileRef = bucket.file(gcsPath)
    const [exists] = await fileRef.exists()
    return exists
  } catch (error) {
    console.error('Error checking file existence:', error)
    return false
  }
}

/**
 * Get file metadata from GCS
 *
 * @param gcsPath - Full path of the file in GCS
 * @returns File metadata
 */
export async function getFileMetadata(gcsPath: string) {
  try {
    const fileRef = bucket.file(gcsPath)
    const [metadata] = await fileRef.getMetadata()
    return metadata
  } catch (error) {
    console.error('Error getting file metadata:', error)
    throw error
  }
}
