import type { UploadedImage } from './types'

/** Max images per upload batch — mirrors the dropzone's react-dropzone maxFiles. */
export const MAX_IMAGE_COUNT = 20

/**
 * Convert picked/dropped File objects into the dialog's UploadedImage shape.
 * Shared by the dropzone (onDrop) and the quick-upload FAB (initialFiles).
 */
export function filesToUploadedImages(files: File[]): UploadedImage[] {
  return files.map((file) => ({ file, preview: URL.createObjectURL(file) }))
}
