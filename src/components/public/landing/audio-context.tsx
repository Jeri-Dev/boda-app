'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

const MUTED_KEY = 'nb-music-muted'
const TARGET_VOLUME = 0.55

type AudioState = {
  /** The file exists and can be played (`null` while still probing). */
  available: boolean | null
  playing: boolean
  muted: boolean
  title: string | null
  /** Start playback — call synchronously inside a user gesture (autoplay policy). */
  start: () => void
  /** Play / pause. */
  toggle: () => void
  toggleMute: () => void
}

const AudioContext = createContext<AudioState | null>(null)

/**
 * Owns the single `<audio>` element of the landing so the envelope intro (the
 * tap that opens the invitation) can start the music inside the user gesture,
 * and the floating player can control it from anywhere on the page.
 *
 * The file is PROBED with a HEAD request before the element gets a `src`:
 * `available` stays `null` meanwhile, flips to `false` when the song has not
 * been uploaded yet (the player then never renders — no dead control, no 404
 * noise), and to `true` otherwise. Probing in an effect (instead of relying on
 * the element's `error` event) avoids the hydration race where a 404 fires
 * before React attaches the handler. The mute preference is remembered per
 * device in localStorage.
 */
export function AudioProvider({
  src,
  title,
  children,
}: {
  src: string
  title: string | null
  children: ReactNode
}) {
  const ref = useRef<HTMLAudioElement | null>(null)
  const fade = useRef<number | null>(null)
  const wantsPlay = useRef(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    try {
      setMuted(localStorage.getItem(MUTED_KEY) === '1')
    } catch {
      /* storage blocked — default unmuted */
    }
  }, [])

  useEffect(() => {
    let active = true
    fetch(src, { method: 'HEAD', cache: 'no-store' })
      .then((r) => {
        const type = r.headers.get('content-type') ?? ''
        if (active) setAvailable(r.ok && !type.includes('text/html'))
      })
      .catch(() => active && setAvailable(false))
    return () => {
      active = false
    }
  }, [src])

  const stopFade = () => {
    if (fade.current) {
      window.clearInterval(fade.current)
      fade.current = null
    }
  }

  /** Ramp the volume in over ~2s so the song never starts abruptly. */
  const fadeIn = useCallback((el: HTMLAudioElement) => {
    stopFade()
    el.volume = 0
    const step = TARGET_VOLUME / 20
    fade.current = window.setInterval(() => {
      const next = Math.min(TARGET_VOLUME, el.volume + step)
      el.volume = next
      if (next >= TARGET_VOLUME) stopFade()
    }, 100)
  }, [])

  const play = useCallback(
    (el: HTMLAudioElement) => {
      el.muted = muted
      const p = el.play()
      if (p && typeof p.then === 'function') {
        p.then(() => {
          setPlaying(true)
          fadeIn(el)
        }).catch(() => setPlaying(false))
      } else {
        setPlaying(true)
        fadeIn(el)
      }
    },
    [muted, fadeIn],
  )

  const start = useCallback(() => {
    const el = ref.current
    if (!el || available === false) return
    // Still probing: remember the intent and play as soon as the src lands.
    if (available === null) {
      wantsPlay.current = true
      return
    }
    play(el)
  }, [available, play])

  // The probe resolved after an early tap (e.g. a fast reader): honour it.
  useEffect(() => {
    const el = ref.current
    if (available && wantsPlay.current && el) {
      wantsPlay.current = false
      play(el)
    }
  }, [available, play])

  const toggle = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (el.paused) start()
    else {
      stopFade()
      el.pause()
      setPlaying(false)
    }
  }, [start])

  const toggleMute = useCallback(() => {
    const el = ref.current
    setMuted((prev) => {
      const next = !prev
      if (el) el.muted = next
      try {
        localStorage.setItem(MUTED_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  useEffect(() => () => stopFade(), [])

  const value = useMemo<AudioState>(
    () => ({ available, playing, muted, title, start, toggle, toggleMute }),
    [available, playing, muted, title, start, toggle, toggleMute],
  )

  return (
    <AudioContext.Provider value={value}>
      {children}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- background music, no speech. */}
      <audio
        ref={ref}
        src={available ? src : undefined}
        loop
        preload="auto"
        onError={() => setAvailable(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
    </AudioContext.Provider>
  )
}

export function useLandingAudio(): AudioState {
  const ctx = useContext(AudioContext)
  if (!ctx) {
    throw new Error('useLandingAudio must be used inside <AudioProvider>')
  }
  return ctx
}
