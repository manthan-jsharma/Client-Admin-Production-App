/**
 * Storage Service
 *
 * Provider: Vercel Blob (production) / Mock (development without BLOB_READ_WRITE_TOKEN)
 *
 * Required env var:
 *   BLOB_READ_WRITE_TOKEN — from Vercel dashboard → Storage → Blob → your store
 *
 * Usage:
 *   const storage = getStorageService()
 *   const result = await storage.upload({ file, filename, contentType })
 *   // result.url is the public Vercel Blob URL — store this directly in the DB
 */

import { put, del } from '@vercel/blob';

export interface UploadOptions {
  file: File | Buffer;
  filename: string;
  contentType?: string;
  folder?: string; // e.g. 'chat', 'projects', 'profiles'
}

export interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

// ─── Vercel Blob ──────────────────────────────────────────────────────────────

class VercelBlobStorageService {
  async upload(options: UploadOptions): Promise<UploadResponse> {
    try {
      const buffer =
        options.file instanceof File
          ? Buffer.from(await options.file.arrayBuffer())
          : options.file;

      const pathname = options.folder
        ? `${options.folder}/${Date.now()}-${options.filename}`
        : `${Date.now()}-${options.filename}`;

      const blob = await put(pathname, buffer, {
        access: 'public',
        contentType: options.contentType,
        addRandomSuffix: false,
      });

      return { success: true, url: blob.url };
    } catch (error) {
      console.error('[vercel-blob] upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /** For Vercel Blob, the stored value IS the URL — return as-is. */
  getUrl(url: string): string {
    return url;
  }

  /** Delete by the full Vercel Blob URL. */
  async delete(url: string): Promise<boolean> {
    try {
      await del(url);
      return true;
    } catch (error) {
      console.error('[vercel-blob] delete error:', error);
      return false;
    }
  }
}

// ─── Mock (no env var set) ────────────────────────────────────────────────────

class MockStorageService {
  private store = new Map<string, Buffer>();

  async upload(options: UploadOptions): Promise<UploadResponse> {
    const key = `${options.folder ?? 'mock'}/${Date.now()}-${options.filename}`;
    const buffer =
      options.file instanceof File
        ? Buffer.from(await options.file.arrayBuffer())
        : options.file;
    this.store.set(key, buffer);
    console.log('[mock-storage] stored:', key);
    return { success: true, url: `mock://${key}` };
  }

  getUrl(url: string): string {
    return url;
  }

  async delete(url: string): Promise<boolean> {
    const key = url.replace('mock://', '');
    return this.store.delete(key);
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export type StorageService = VercelBlobStorageService | MockStorageService;

export function getStorageService(): StorageService {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return new VercelBlobStorageService();
  }
  console.warn('[storage] BLOB_READ_WRITE_TOKEN not set — using mock storage');
  return new MockStorageService();
}

// ─── File validation utilities ────────────────────────────────────────────────

export const FileValidation = {
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedDocumentTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],

  isValidType(type: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(type);
  },

  isValidSize(sizeBytes: number, maxMB: number): boolean {
    return sizeBytes <= maxMB * 1024 * 1024;
  },

  getCategory(type: string): 'image' | 'document' | 'video' | 'audio' | 'unknown' {
    if (this.isValidType(type, this.allowedImageTypes)) return 'image';
    if (this.isValidType(type, this.allowedDocumentTypes)) return 'document';
    if (this.isValidType(type, this.allowedVideoTypes)) return 'video';
    if (this.isValidType(type, this.allowedAudioTypes)) return 'audio';
    return 'unknown';
  },
};
