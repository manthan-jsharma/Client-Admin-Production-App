'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, ExternalLink, FileText, Image, Video, Music, CheckCircle2, AlertCircle } from 'lucide-react';

interface FileUploadFieldProps {
  /** Current stored URL (Vercel Blob URL or empty string) */
  value: string;
  /** Called with the new Vercel Blob URL after a successful upload, or '' on clear */
  onChange: (url: string) => void;
  /** Folder sent to POST /api/upload (e.g. "projects", "deliveries") */
  folder: string;
  /** Native accept string e.g. "image/*" or ".pdf,application/pdf" */
  accept?: string;
  /** Max file size in MB shown in hint text (default 100) */
  maxSizeMB?: number;
  label?: string;
  /** Short description shown under the label */
  hint?: string;
  disabled?: boolean;
  className?: string;
}

function fileIcon(url: string) {
  const lower = url.toLowerCase();
  if (/\.(jpg|jpeg|png|webp|gif)/.test(lower)) return <Image className="w-3.5 h-3.5" />;
  if (/\.(mp4|webm|mov|ogg)/.test(lower)) return <Video className="w-3.5 h-3.5" />;
  if (/\.(mp3|wav|ogg|webm)/.test(lower)) return <Music className="w-3.5 h-3.5" />;
  return <FileText className="w-3.5 h-3.5" />;
}

function shortUrl(url: string) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/');
    return parts[parts.length - 1] || url;
  } catch {
    return url.length > 40 ? url.slice(0, 37) + '…' : url;
  }
}

export function FileUploadField({
  value,
  onChange,
  folder,
  accept,
  maxSizeMB = 100,
  label,
  hint,
  disabled = false,
  className = '',
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsUploading(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const result = await res.json();

      if (result.success && result.data?.url) {
        onChange(result.data.url);
      } else {
        setError(result.error ?? 'Upload failed');
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setIsUploading(false);
      // Reset so the same file can be re-uploaded
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const isMock = value.startsWith('mock://');

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-300 block">
          {label}
        </label>
      )}

      {/* Current file display */}
      {value && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/60 border border-slate-600/60 rounded-xl text-xs">
          <span className="text-slate-400 flex-shrink-0">{fileIcon(value)}</span>
          <span className="text-slate-300 flex-1 truncate font-mono">{shortUrl(value)}</span>
          {!isMock && (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex-shrink-0 transition-colors"
              title="Open file"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {!disabled && (
            <button
              type="button"
              onClick={() => { onChange(''); setError(null); }}
              className="text-slate-500 hover:text-red-400 flex-shrink-0 transition-colors"
              title="Remove file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Upload button */}
      {!disabled && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all w-full justify-center ${
            isUploading
              ? 'border-blue-500/30 bg-blue-500/10 text-blue-400 cursor-wait'
              : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200 hover:border-slate-500'
          }`}
        >
          {isUploading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              {value ? 'Replace file' : 'Upload file'}
            </>
          )}
        </button>
      )}

      {hint && !error && (
        <p className="text-[11px] text-slate-600">{hint} · Max {maxSizeMB} MB</p>
      )}

      {error && (
        <p className="text-[11px] text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
