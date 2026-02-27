'use client'

import { useState, useCallback } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useDropzone } from 'react-dropzone'
import { X, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StorageService } from '@/services/storage.service'

type WidthClass = 'w-full' | 'w-2/3' | 'w-1/2' | 'w-1/3'

const WIDTH_OPTIONS: { label: string; value: WidthClass }[] = [
  { label: 'Full', value: 'w-full' },
  { label: '2/3', value: 'w-2/3' },
  { label: '1/2', value: 'w-1/2' },
  { label: '1/3', value: 'w-1/3' },
]

/**
 * Node view for inline image blocks with caption and width controls.
 * Expected node attributes: src, caption, widthClass.
 */
export default function ImageUploadView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const [hovered, setHovered] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { src, caption, widthClass } = node.attrs as {
    src: string
    caption: string
    widthClass: WidthClass
  }

  const currentWidth: WidthClass = widthClass || 'w-full'

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setUploading(true)
      setUploadError(null)

      try {
        const result = await StorageService.uploadSingleImage(file, 'journal')
        updateAttributes({ src: result.urls.display })
      } catch {
        setUploadError('Upload failed. Please try again.')
      } finally {
        setUploading(false)
      }
    },
    [updateAttributes]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: false,
    disabled: uploading,
  })

  return (
    <NodeViewWrapper
      data-type="image-upload"
      contentEditable={false}
      className="my-4"
    >
      <div
        className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {!src ? (
          /* --- Dropzone state --- */
          <div
            {...getRootProps()}
            className={[
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
              isDragActive
                ? 'border-stone-500 bg-stone-100'
                : 'border-stone-300 bg-stone-50 hover:border-stone-400',
              uploading ? 'pointer-events-none opacity-60' : '',
            ].join(' ')}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
            ) : (
              <Upload className="h-6 w-6 text-stone-400" />
            )}
            <p className="text-sm text-stone-500">
              {uploading
                ? 'Uploading…'
                : isDragActive
                ? 'Drop image here'
                : 'Drag an image or click to upload'}
            </p>
            {uploadError && (
              <p className="text-xs text-red-500">{uploadError}</p>
            )}
          </div>
        ) : (
          /* --- Image + controls state --- */
          <div className="flex flex-col items-start gap-2">
            {/* Width selector */}
            <div className="flex gap-1">
              {WIDTH_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  size="sm"
                  variant={currentWidth === opt.value ? 'default' : 'outline'}
                  className="h-6 px-2 text-xs"
                  onClick={() => updateAttributes({ widthClass: opt.value })}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {/* Image */}
            <img
              src={src}
              alt={caption || 'Inline image'}
              className={`rounded-md object-cover ${currentWidth}`}
            />

            {/* Caption input */}
            <Input
              value={caption || ''}
              onChange={(e) => updateAttributes({ caption: e.target.value })}
              placeholder="Add a caption…"
              className="max-w-md text-xs text-stone-500"
            />
          </div>
        )}

        {/* Delete button — shown on hover whenever there is a src */}
        {hovered && src && (
          <button
            type="button"
            onClick={deleteNode}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow transition-opacity hover:bg-red-600"
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </NodeViewWrapper>
  )
}
