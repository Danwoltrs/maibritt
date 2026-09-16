export async function encodeMp3(recording: Blob): Promise<{ mp3: Blob; durationSec: number }> {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new Ctx()
  try {
    const buffer = await ctx.decodeAudioData(await recording.arrayBuffer())
    const channels: Float32Array[] = []
    for (let c = 0; c < Math.min(2, buffer.numberOfChannels); c++) channels.push(buffer.getChannelData(c))
    const worker = new Worker(new URL('./mp3.worker.ts', import.meta.url))
    const mp3 = await new Promise<Blob>((resolve, reject) => {
      worker.onmessage = (e: MessageEvent<Blob>) => resolve(e.data)
      worker.onerror = () => reject(new Error('Could not prepare the recording'))
      worker.postMessage({ channels, sampleRate: buffer.sampleRate })
    })
    worker.terminate()
    return { mp3, durationSec: buffer.duration }
  } finally {
    void ctx.close()
  }
}
