import * as tus from 'tus-js-client'
import { supabase } from '@/lib/supabase'
import { config } from '@/lib/config'
import { StorageService } from './storage.service'
import { createEmptyDocument } from '@/lib/story/document'
import { readImageSize, readAudioDuration, captureVideoPoster } from '@/lib/story/media'
import type { StoryDocument, ImageRef, AudioRef } from '@/lib/story/types'

const BUCKET = 'story'

function uniqueName(extension: string): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`
}

// Cached after the first successful read so autosaves don't do two round
// trips (select id, then update) on every call.
let cachedRowId: string | null = null

async function getRowId(): Promise<string> {
  if (cachedRowId) return cachedRowId
  const { data, error } = await supabase.from('story').select('id').limit(1).single()
  if (error) throw error
  const id = data.id as string
  cachedRowId = id
  return id
}

export class StoryService {
  static async getPublished(): Promise<StoryDocument | null> {
    const { data, error } = await supabase.from('story').select('published').limit(1).maybeSingle()
    if (error) throw error
    return (data?.published as StoryDocument | null) ?? null
  }

  static async getDraft(): Promise<StoryDocument> {
    const { data, error } = await supabase.from('story').select('draft').limit(1).maybeSingle()
    if (error) throw error
    return (data?.draft as StoryDocument | null) ?? createEmptyDocument()
  }

  static async saveDraft(document: StoryDocument): Promise<void> {
    const id = await getRowId()
    const { error } = await supabase
      .from('story')
      .update({ draft: document, draft_updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }

  static async uploadPhotos(files: File[], onProgress?: (pct: number) => void): Promise<ImageRef[]> {
    const sizes = await Promise.all(files.map((f) => readImageSize(f)))
    const results = await StorageService.uploadImages(files, BUCKET, (p) => onProgress?.(p.percentage))
    return results.map((r, i) => ({
      url: r.urls.display,
      thumbnailUrl: r.urls.thumbnail,
      width: sizes[i].width,
      height: sizes[i].height,
    }))
  }

  static async uploadPosterBlob(blob: Blob): Promise<ImageRef> {
    const file = new File([blob], 'poster.jpg', { type: 'image/jpeg' })
    const [ref] = await this.uploadPhotos([file])
    return ref
  }

  static async uploadAudio(blob: Blob, extension: string, knownDurationSec?: number): Promise<AudioRef> {
    const path = `audio/${uniqueName(extension)}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
      cacheControl: '3600',
      upsert: false,
      contentType: blob.type || 'audio/mpeg',
    })
    if (error) throw error
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const measured = knownDurationSec && knownDurationSec > 0 ? knownDurationSec : await readAudioDuration(blob)
    return { url: data.publicUrl, durationSec: Math.round(measured * 10) / 10, transcript: '' }
  }

  static async uploadVideo(
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<{ url: string; durationSec: number; poster: ImageRef | null }> {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) throw new Error('You are not signed in')

    const extension = (file.name.split('.').pop() || 'mp4').toLowerCase()
    const objectName = `video/${uniqueName(extension)}`

    await new Promise<void>((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: `${config.supabase.url}/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: { authorization: `Bearer ${token}`, 'x-upsert': 'false' },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        chunkSize: 6 * 1024 * 1024,
        metadata: {
          bucketName: BUCKET,
          objectName,
          contentType: file.type || 'video/mp4',
          cacheControl: '3600',
        },
        onError: (err) => reject(err),
        onProgress: (sent, total) => onProgress?.(Math.round((sent / total) * 100)),
        onSuccess: () => resolve(),
      })
      upload
        .findPreviousUploads()
        .then((previous) => {
          if (previous.length) upload.resumeFromPreviousUpload(previous[0])
          upload.start()
        })
        .catch(() => upload.start())
    })

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectName)
    const { poster, durationSec } = await captureVideoPoster(file)
    const posterRef = poster ? await this.uploadPosterBlob(poster) : null
    return { url: data.publicUrl, durationSec: Math.round(durationSec), poster: posterRef }
  }
}
