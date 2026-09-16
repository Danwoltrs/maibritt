import * as lamejs from '@breezystack/lamejs'

type Input = { channels: Float32Array[]; sampleRate: number }

function toInt16(f: Float32Array): Int16Array {
  const out = new Int16Array(f.length)
  for (let i = 0; i < f.length; i++) {
    const s = Math.max(-1, Math.min(1, f[i]))
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return out
}

self.onmessage = (e: MessageEvent<Input>) => {
  const { channels, sampleRate } = e.data
  const stereo = channels.length > 1
  const encoder = new lamejs.Mp3Encoder(stereo ? 2 : 1, sampleRate, 128)
  const left = toInt16(channels[0])
  const right = stereo ? toInt16(channels[1]) : undefined
  const parts: BlobPart[] = []
  const block = 1152
  for (let i = 0; i < left.length; i += block) {
    const chunk = right ? encoder.encodeBuffer(left.subarray(i, i + block), right.subarray(i, i + block)) : encoder.encodeBuffer(left.subarray(i, i + block))
    if (chunk.length) parts.push(new Uint8Array(chunk))
  }
  const tail = encoder.flush()
  if (tail.length) parts.push(new Uint8Array(tail))
  self.postMessage(new Blob(parts, { type: 'audio/mpeg' }))
}
