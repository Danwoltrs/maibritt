'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { StorageService } from '@/services/storage.service'

interface ImageBlockEditorProps {
  src: string
  alt: string
  caption: string
  onChange: (updates: { src?: string; alt?: string; caption?: string }) => void
}

export function ImageBlockEditor({ src, alt, caption, onChange }: ImageBlockEditorProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setUploading(true)
      setError(null)

      try {
        const result = await StorageService.uploadSingleImage(file, 'journal')
        onChange({ src: result.urls.display })
      } catch {
        setError('Upload failed. Please try again.')
      } finally {
        setUploading(false)
      }
    },
    [onChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: false,
    disabled: uploading,
  })

  if (!src) {
    return (
      <div
        {...getRootProps()}
        className={[
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors',
          isDragActive
            ? 'border-stone-500 bg-stone-100'
            : 'border-stone-300 bg-stone-50 hover:border-stone-400',
          uploading ? 'pointer-events-none opacity-60' : '',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
        ) : (
          <Upload className="h-5 w-5 text-stone-400" />
        )}
        <p className="text-xs text-stone-500">
          {uploading ? 'Uploading...' : isDragActive ? 'Drop image here' : 'Drag an image or click to upload'}
        </p>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative group">
        <img src={src} alt={alt || 'Image'} className="w-full rounded-lg object-cover max-h-80" />
        <button
          type="button"
          onClick={() => onChange({ src: '' })}
          className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          aria-label="Remove image"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <Input
        value={caption}
        onChange={(e) => onChange({ caption: e.target.value })}
        placeholder="Add a caption..."
        className="text-xs text-stone-500"
      />
    </div>
  )
}
