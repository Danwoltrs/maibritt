'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { encodeMp3 } from './encodeMp3'

export type RecorderState = 'idle' | 'requesting' | 'recording' | 'processing' | 'done' | 'unsupported' | 'denied' | 'error'

export type RecorderResult = { mp3: Blob; durationSec: number; url: string }

const BARS = 48

export function useRecorder() {
  const [state, setState] = useState<RecorderState>('idle')
  const [seconds, setSeconds] = useState(0)
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0))
  const [result, setResult] = useState<RecorderResult | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<number | null>(null)
  const raf = useRef<number | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined')) setState('unsupported')
  }, [])

  const cleanup = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current)
    if (raf.current) cancelAnimationFrame(raf.current)
    timer.current = null
    raf.current = null
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    if (ctxRef.current && ctxRef.current.state !== 'closed') void ctxRef.current.close()
    ctxRef.current = null
  }, [])

  const start = useCallback(async () => {
    setState('requesting')
    setResult(null)
    setSeconds(0)
    chunks.current = []
    try {
      // Created synchronously, inside the click handler's user gesture, and resumed
      // right away — Safari/iOS starts a new AudioContext 'suspended' otherwise, and
      // the analyser would never pull from the mic source (silent, flat level bars).
      // Stashed in a ref immediately so an unmount or failure while getUserMedia is
      // still pending can still find and close it (cleanup() is the one close path).
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new Ctx()
      ctxRef.current = ctx
      void ctx.resume()

      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      // She can walk away while the browser is still asking for the microphone.
      // If permission arrives after that, hand it straight back: starting a
      // recorder now would leave the mic on with nothing on screen to stop it.
      if (!mounted.current) {
        s.getTracks().forEach((t) => t.stop())
        cleanup()
        return
      }
      stream.current = s
      const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find((m) => MediaRecorder.isTypeSupported(m))
      const rec = new MediaRecorder(s, mime ? { mimeType: mime } : undefined)
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data)
      rec.onstop = async () => {
        const raw = new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' })
        cleanup()
        setState('processing')
        try {
          const { mp3, durationSec } = await encodeMp3(raw)
          setResult({ mp3, durationSec, url: URL.createObjectURL(mp3) })
          setState('done')
        } catch {
          setState('error')
        }
      }
      recorder.current = rec
      rec.start(1000)

      const node = ctx.createAnalyser()
      node.fftSize = 256
      ctx.createMediaStreamSource(s).connect(node)
      const data = new Uint8Array(node.frequencyBinCount)
      const tick = () => {
        node.getByteTimeDomainData(data)
        let peak = 0
        for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128) / 128)
        setLevels((prev) => [...prev.slice(1), Math.min(1, peak * 1.6)])
        raf.current = requestAnimationFrame(tick)
      }
      raf.current = requestAnimationFrame(tick)

      const startedAt = Date.now()
      timer.current = window.setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 250)
      setState('recording')
    } catch (err) {
      cleanup()
      setState(err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError') ? 'denied' : 'error')
    }
  }, [cleanup])

  const stop = useCallback(() => {
    if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop()
  }, [])

  const reset = useCallback(() => {
    cleanup()
    if (result) URL.revokeObjectURL(result.url)
    setResult(null)
    setSeconds(0)
    setLevels(Array(BARS).fill(0))
    setState('idle')
  }, [cleanup, result])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      cleanup()
    }
  }, [cleanup])

  return { state, seconds, levels, result, start, stop, reset }
}
