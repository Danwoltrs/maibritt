'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

type Media = HTMLMediaElement
type Wired = { gain: GainNode | null }

type SoundContextValue = {
  begun: boolean
  muted: boolean
  begin: () => void
  toggleMuted: () => void
  register: (el: Media) => () => void
  play: (el: Media) => Promise<void>
  stop: (el: Media) => void
}

const SoundContext = createContext<SoundContextValue | null>(null)

const FADE_MS = 1000

export function SoundProvider({ children }: { children: ReactNode }) {
  const [begun, setBegun] = useState(false)
  const [muted, setMuted] = useState(false)
  const mutedRef = useRef(false)
  const elements = useRef(new Map<Media, Wired>())
  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const currentRef = useRef<Media | null>(null)
  const fadeTimers = useRef(new Map<Media, number>())

  const wire = useCallback((el: Media) => {
    const ctx = ctxRef.current
    const entry = elements.current.get(el)
    if (!ctx || !masterRef.current || !entry || entry.gain) return
    try {
      const source = ctx.createMediaElementSource(el)
      const gain = ctx.createGain()
      source.connect(gain).connect(masterRef.current)
      entry.gain = gain
    } catch {
      entry.gain = null
    }
  }, [])

  const register = useCallback(
    (el: Media) => {
      elements.current.set(el, { gain: null })
      if (ctxRef.current) wire(el)
      return () => {
        elements.current.delete(el)
      }
    },
    [wire]
  )

  const begin = useCallback(() => {
    if (!ctxRef.current) {
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new Ctx()
        const master = ctx.createGain()
        // Honour a mute chosen before the story began, otherwise the graph
        // would come up at full volume while the label still says "Sound off".
        master.gain.value = mutedRef.current ? 0 : 1
        master.connect(ctx.destination)
        ctxRef.current = ctx
        masterRef.current = master
        elements.current.forEach((_, el) => wire(el))
      } catch {
        ctxRef.current = null
      }
    }
    ctxRef.current?.resume().catch(() => {})
    // Inside the tap: touch every element once so browsers allow later playback.
    // The flag marks this silent nudge so players (e.g. a video's poster and
    // play button) can ignore the play event it produces.
    elements.current.forEach((_, el) => {
      el.dataset.unlocking = '1'
      const p = el.play()
      if (p && typeof p.then === 'function') {
        p.then(() => {
          el.pause()
          el.currentTime = 0
        })
          .catch(() => {})
          .finally(() => {
            delete el.dataset.unlocking
          })
      } else {
        delete el.dataset.unlocking
      }
    })
    setBegun(true)
  }, [wire])

  const rampTo = useCallback((el: Media, target: number, onDone?: () => void) => {
    const entry = elements.current.get(el)
    const ctx = ctxRef.current
    const existing = fadeTimers.current.get(el)
    if (existing) window.clearInterval(existing)
    if (entry?.gain && ctx) {
      const now = ctx.currentTime
      entry.gain.gain.cancelScheduledValues(now)
      entry.gain.gain.setValueAtTime(entry.gain.gain.value, now)
      entry.gain.gain.linearRampToValueAtTime(target, now + FADE_MS / 1000)
      if (onDone) fadeTimers.current.set(el, window.setTimeout(onDone, FADE_MS) as unknown as number)
      return
    }
    // Fallback: ramp element.volume (ignored on iOS, where the fade becomes a plain stop).
    const start = el.volume
    const steps = 20
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      el.volume = Math.max(0, Math.min(1, start + ((target - start) * i) / steps))
      if (i >= steps) {
        window.clearInterval(id)
        fadeTimers.current.delete(el)
        onDone?.()
      }
    }, FADE_MS / steps)
    fadeTimers.current.set(el, id)
  }, [])

  const stop = useCallback(
    (el: Media) => {
      if (el.paused) return
      rampTo(el, 0, () => {
        el.pause()
        const entry = elements.current.get(el)
        if (entry?.gain) entry.gain.gain.value = 1
        else el.volume = 1
      })
      if (currentRef.current === el) currentRef.current = null
    },
    [rampTo]
  )

  const play = useCallback(
    async (el: Media) => {
      if (mutedRef.current) return
      if (currentRef.current && currentRef.current !== el) stop(currentRef.current)
      currentRef.current = el
      const entry = elements.current.get(el)
      if (entry?.gain) entry.gain.gain.value = 0
      else el.volume = 0
      try {
        await el.play()
        rampTo(el, 1)
      } catch {
        // Browser refused (no gesture yet): leave the element paused.
      }
    },
    [rampTo, stop]
  )

  const toggleMuted = useCallback(() => {
    const next = !mutedRef.current
    mutedRef.current = next
    setMuted(next)
    if (masterRef.current) masterRef.current.gain.value = next ? 0 : 1
    // Always mirror the choice onto the element itself. Harmless when the Web
    // Audio gain is doing the work, and it is the only thing that can undo a
    // mute chosen before the story began (when no gain nodes existed yet).
    elements.current.forEach((_, el) => {
      el.muted = next
    })
  }, [])

  const value = useMemo<SoundContextValue>(
    () => ({ begun, muted, begin, toggleMuted, register, play, stop }),
    [begun, muted, begin, toggleMuted, register, play, stop]
  )

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext)
  if (!ctx) throw new Error('useSound must be used inside SoundProvider')
  return ctx
}
