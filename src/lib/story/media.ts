export function readImageSize(source: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read this photo'))
    }
    img.src = url
  })
}

export function readAudioDuration(source: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source)
    const audio = document.createElement('audio')
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      const d = audio.duration
      URL.revokeObjectURL(url)
      // Chrome reports Infinity for some webm blobs; callers pass a known duration then.
      resolve(Number.isFinite(d) ? d : 0)
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read this recording'))
    }
    audio.src = url
  })
}

export async function captureVideoPoster(file: File): Promise<{ poster: Blob | null; durationSec: number }> {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('Could not read this video'))
      video.src = url
    })
    const durationSec = Number.isFinite(video.duration) ? video.duration : 0
    try {
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve()
        video.onerror = () => reject(new Error('seek failed'))
        video.currentTime = Math.min(1, durationSec / 2 || 0)
      })
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      if (!canvas.width || !canvas.height) return { poster: null, durationSec }
      canvas.getContext('2d')!.drawImage(video, 0, 0)
      const poster = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
      return { poster, durationSec }
    } catch {
      return { poster: null, durationSec }
    }
  } finally {
    URL.revokeObjectURL(url)
    video.removeAttribute('src')
  }
}
