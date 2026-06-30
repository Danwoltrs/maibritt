import { describe, it, expect, vi, beforeEach } from 'vitest'
import { filesToUploadedImages } from './imageFiles'

beforeEach(() => {
  // jsdom does not implement URL.createObjectURL — provide a deterministic stub
  ;(URL as unknown as { createObjectURL: (f: File) => string }).createObjectURL =
    vi.fn((file: File) => `blob:mock-${file.name}`)
})

describe('filesToUploadedImages', () => {
  it('maps each file to an UploadedImage with a preview url, preserving order', () => {
    const a = new File(['a'], 'a.jpg', { type: 'image/jpeg' })
    const b = new File(['b'], 'b.png', { type: 'image/png' })

    const result = filesToUploadedImages([a, b])

    expect(result).toHaveLength(2)
    expect(result[0].file).toBe(a)
    expect(result[0].preview).toBe('blob:mock-a.jpg')
    expect(result[1].file).toBe(b)
    expect(result[1].preview).toBe('blob:mock-b.png')
  })

  it('returns an empty array for empty input', () => {
    expect(filesToUploadedImages([])).toEqual([])
  })
})
