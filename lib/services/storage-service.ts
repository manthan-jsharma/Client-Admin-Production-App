/**
 * Storage Service Adapter
 * Switch between mock implementation and real AWS S3/Vercel Blob
 */

export interface UploadOptions {
  file: File | Buffer
  filename: string
  contentType?: string
  metadata?: Record<string, string>
}

export interface UploadResponse {
  success: boolean
  url?: string
  key?: string
  error?: string
}

// Mock implementation (localStorage/memory)
class MockStorageService {
  private storage: Map<string, Buffer> = new Map()

  async upload(options: UploadOptions): Promise<UploadResponse> {
    try {
      const key = `mock_${Date.now()}_${options.filename}`
      
      if (options.file instanceof File) {
        const buffer = Buffer.from(await options.file.arrayBuffer())
        this.storage.set(key, buffer)
      } else {
        this.storage.set(key, options.file)
      }

      console.log('[MOCK STORAGE]', { key, filename: options.filename })

      return {
        success: true,
        key,
        url: `mock://${key}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  async getUrl(key: string): Promise<string> {
    return `mock://${key}`
  }

  async delete(key: string): Promise<boolean> {
    return this.storage.delete(key)
  }

  async getFile(key: string): Promise<Buffer | null> {
    return this.storage.get(key) || null
  }
}

// AWS S3 implementation (placeholder)
class S3StorageService {
  private bucketName: string
  private region: string

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET || 'placeholder-bucket'
    this.region = process.env.AWS_REGION || 'us-east-1'
  }

  async upload(options: UploadOptions): Promise<UploadResponse> {
    try {
      // TODO: Implement real AWS S3 upload
      // const s3 = new S3Client({ region: this.region })
      // const key = `uploads/${Date.now()}_${options.filename}`
      // 
      // const buffer = options.file instanceof File 
      //   ? Buffer.from(await options.file.arrayBuffer())
      //   : options.file
      //
      // const command = new PutObjectCommand({
      //   Bucket: this.bucketName,
      //   Key: key,
      //   Body: buffer,
      //   ContentType: options.contentType,
      //   Metadata: options.metadata,
      // })
      //
      // await s3.send(command)
      // const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`
      // 
      // return { success: true, url, key }

      return { 
        success: true, 
        url: 'https://placeholder-url.s3.amazonaws.com/file',
        key: 'placeholder-key'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  async getUrl(key: string): Promise<string> {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`
  }

  async delete(key: string): Promise<boolean> {
    try {
      // TODO: Implement real S3 delete
      // const s3 = new S3Client({ region: this.region })
      // await s3.send(new DeleteObjectCommand({
      //   Bucket: this.bucketName,
      //   Key: key,
      // }))
      return true
    } catch {
      return false
    }
  }
}

// Vercel Blob implementation (placeholder)
class VercelBlobStorageService {
  async upload(options: UploadOptions): Promise<UploadResponse> {
    try {
      // TODO: Implement real Vercel Blob upload
      // import { put } from '@vercel/blob'
      // 
      // const buffer = options.file instanceof File 
      //   ? Buffer.from(await options.file.arrayBuffer())
      //   : options.file
      //
      // const blob = await put(options.filename, buffer, {
      //   access: 'public',
      //   contentType: options.contentType,
      // })
      // 
      // return { success: true, url: blob.url, key: blob.filename }

      return { 
        success: true, 
        url: 'https://placeholder-blob.vercel.sh/file',
        key: 'placeholder-key'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  async getUrl(key: string): Promise<string> {
    return `https://placeholder-blob.vercel.sh/${key}`
  }

  async delete(key: string): Promise<boolean> {
    try {
      // TODO: Implement real delete
      return true
    } catch {
      return false
    }
  }
}

// Export factory function
export function getStorageService(): MockStorageService | S3StorageService | VercelBlobStorageService {
  const provider = process.env.NEXT_PUBLIC_STORAGE_PROVIDER || 'mock'

  switch (provider) {
    case 's3':
      return new S3StorageService()
    case 'vercel-blob':
      return new VercelBlobStorageService()
    case 'mock':
    default:
      return new MockStorageService()
  }
}

// File validation utilities
export const FileValidation = {
  maxFileSize: (bytes: number): number => bytes, // in bytes
  
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg'],

  isValidType(type: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(type)
  },

  isValidSize(size: number, maxSize: number): boolean {
    return size <= maxSize
  },

  getFileCategory(type: string): 'image' | 'document' | 'video' | 'audio' | 'unknown' {
    if (this.isValidType(type, this.allowedImageTypes)) return 'image'
    if (this.isValidType(type, this.allowedDocumentTypes)) return 'document'
    if (this.isValidType(type, this.allowedVideoTypes)) return 'video'
    if (this.isValidType(type, this.allowedAudioTypes)) return 'audio'
    return 'unknown'
  },
}
