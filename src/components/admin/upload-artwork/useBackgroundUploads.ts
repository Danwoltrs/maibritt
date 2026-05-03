import { useCallback, useRef, useState } from 'react'
import { ArtworkService, type ArtworkCreateData, type ArtworkUpdateData } from '@/services/artwork.service'

export type UploadState =
  | { status: 'idle' }
  | { status: 'queued' }
  | { status: 'uploading'; progress: number }
  | { status: 'uploaded'; artworkId: string }
  | { status: 'failed'; error: string; attempts: number }

const IDLE: UploadState = { status: 'idle' }
const MAX_ATTEMPTS = 3
const CONCURRENCY = 2
const RETRY_DELAYS_MS = [1_000, 3_000]

export interface UseBackgroundUploadsApi {
  startUpload: (index: number, payload: ArtworkCreateData) => void
  retry: (index: number) => void
  updateUploaded: (index: number, payload: ArtworkUpdateData) => void
  getState: (index: number) => UploadState
  pendingCount: number
  failedCount: number
  uploadedCount: number
  allDone: boolean
}

interface QueueEntry {
  index: number
  payload: ArtworkCreateData
  attempt: number
}

export function useBackgroundUploads(): UseBackgroundUploadsApi {
  const [states, setStates] = useState<Record<number, UploadState>>({})
  const queueRef = useRef<QueueEntry[]>([])
  const inFlightRef = useRef(0)
  const lastPayloadRef = useRef<Record<number, ArtworkCreateData>>({})

  const setState = useCallback((index: number, next: UploadState) => {
    setStates((prev) => ({ ...prev, [index]: next }))
  }, [])

  const drain = useCallback(() => {
    while (inFlightRef.current < CONCURRENCY && queueRef.current.length > 0) {
      const entry = queueRef.current.shift()!
      inFlightRef.current += 1
      setState(entry.index, { status: 'uploading', progress: 0 })

      ArtworkService.createArtwork(entry.payload, (progress) => {
        setState(entry.index, { status: 'uploading', progress: progress.percentage })
      })
        .then((artwork: { id: string }) => {
          setState(entry.index, { status: 'uploaded', artworkId: artwork.id })
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Upload failed'
          const isRetryable = isRetryableError(err)
          if (isRetryable && entry.attempt < MAX_ATTEMPTS) {
            const delay = RETRY_DELAYS_MS[entry.attempt - 1] ?? 3_000
            setTimeout(() => {
              queueRef.current.push({ ...entry, attempt: entry.attempt + 1 })
              drain()
            }, delay)
          } else {
            setState(entry.index, {
              status: 'failed',
              error: message,
              attempts: entry.attempt,
            })
          }
        })
        .finally(() => {
          inFlightRef.current -= 1
          drain()
        })
    }
  }, [setState])

  const startUpload = useCallback(
    (index: number, payload: ArtworkCreateData) => {
      lastPayloadRef.current[index] = payload
      setState(index, { status: 'queued' })
      queueRef.current.push({ index, payload, attempt: 1 })
      drain()
    },
    [drain, setState]
  )

  const retry = useCallback(
    (index: number) => {
      const payload = lastPayloadRef.current[index]
      if (!payload) return
      setState(index, { status: 'queued' })
      queueRef.current.push({ index, payload, attempt: 1 })
      drain()
    },
    [drain, setState]
  )

  const updateUploaded = useCallback(
    (index: number, payload: ArtworkUpdateData) => {
      const current = states[index]
      if (current?.status !== 'uploaded') return
      const artworkId = current.artworkId
      ArtworkService.updateArtwork(artworkId, payload).catch((err) => {
        const message = err instanceof Error ? err.message : 'Update failed'
        setState(index, { status: 'failed', error: message, attempts: 1 })
      })
    },
    [setState, states]
  )

  const getState = useCallback(
    (index: number): UploadState => states[index] ?? IDLE,
    [states]
  )

  const values = Object.values(states)
  const pendingCount = values.filter(
    (s) => s.status === 'queued' || s.status === 'uploading'
  ).length
  const failedCount = values.filter((s) => s.status === 'failed').length
  const uploadedCount = values.filter((s) => s.status === 'uploaded').length
  const startedCount = values.length
  const allDone =
    startedCount > 0 && pendingCount === 0 && failedCount === 0

  return {
    startUpload,
    retry,
    updateUploaded,
    getState,
    pendingCount,
    failedCount,
    uploadedCount,
    allDone,
  }
}

function isRetryableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return true
  const anyErr = err as { status?: number; statusCode?: number; message?: string }
  const status = anyErr.status ?? anyErr.statusCode
  if (typeof status === 'number') {
    if (status >= 400 && status < 500) return false
    return true
  }
  return true
}
