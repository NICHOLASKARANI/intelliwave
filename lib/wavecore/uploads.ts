import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

interface UploadResult {
  success: boolean
  url: string
  fileName: string
  fileSize: number
}

// Local file upload for Vercel (use S3/Cloudinary for production scale)
export async function saveUploadedFile(
  file: File,
  organizationId: string,
  category: string
): Promise<UploadResult> {
  try {
    // Create tenant-scoped path: uploads/{orgId}/{category}/{timestamp}-{random}-{filename}
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileExt = path.extname(file.name)
    const randomName = crypto.randomBytes(8).toString('hex')
    const safeName = `${Date.now()}-${randomName}${fileExt}`
    const relativePath = `uploads/${organizationId}/${category}/${safeName}`

    // In production, upload to S3/Cloudinary instead of filesystem
    // For Vercel serverless, use Vercel Blob or S3
    const fullPath = path.join(process.cwd(), 'public', relativePath)

    await mkdir(path.dirname(fullPath), { recursive: true })
    await writeFile(fullPath, buffer)

    return {
      success: true,
      url: `/${relativePath}`,
      fileName: file.name,
      fileSize: file.size,
    }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, url: '', fileName: '', fileSize: 0 }
  }
}

// Allowed file types
export const allowedFileTypes = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]

export const maxFileSize = 10 * 1024 * 1024 // 10MB

export function isAllowedFile(file: File): { allowed: boolean; error?: string } {
  if (!allowedFileTypes.includes(file.type)) {
    return { allowed: false, error: 'File type not allowed' }
  }
  if (file.size > maxFileSize) {
    return { allowed: false, error: 'File too large (max 10MB)' }
  }
  return { allowed: true }
}