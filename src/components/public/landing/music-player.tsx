'use client'

import { cn } from '@/lib/utils/cn'

import { useLandingAudio } from './audio-context'
import { Pause, Play, Volume, VolumeOff } from './icons'

/**
 * Reproductor flotante (esquina inferior derecha). Un disco de vinilo que gira
 * mientras suena, el título de la canción y el botón de silencio. Si el archivo
 * no existe todavía (404), no se muestra nada.
 */
export function MusicPlayer() {
  const { available, playing, muted, title, toggle, toggleMute } = useLandingAudio()

  if (!available) return null

  return (
    <div
      className={cn('landing-player', playing && 'is-playing', muted && 'is-muted')}
      role="group"
      aria-label="Música de la invitación"
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pausar la música' : 'Reproducir la música'}
        aria-pressed={playing}
        className="landing-player-disc"
      >
        <span aria-hidden className="landing-player-ring" />
        <svg viewBox="0 0 64 64" aria-hidden className="landing-disc">
          <circle cx="32" cy="32" r="31" fill="var(--color-ink)" />
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--color-gold)" strokeOpacity="0.28" strokeWidth="0.8" />
          <circle cx="32" cy="32" r="22" fill="none" stroke="var(--color-gold)" strokeOpacity="0.18" strokeWidth="0.8" />
          <circle cx="32" cy="32" r="18" fill="none" stroke="var(--color-gold)" strokeOpacity="0.28" strokeWidth="0.8" />
          <circle cx="32" cy="32" r="14" fill="none" stroke="var(--color-gold)" strokeOpacity="0.18" strokeWidth="0.8" />
          <circle cx="32" cy="32" r="9.5" fill="var(--color-gold)" />
          <circle cx="32" cy="32" r="2.2" fill="var(--color-ink)" />
        </svg>
        <span className="landing-player-icon">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
        </span>
      </button>

      <div className="landing-player-body">
        <span aria-hidden className="landing-eq">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="landing-player-title">
          {title ?? (playing ? 'Sonando' : 'Nuestra canción')}
        </span>
      </div>

      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? 'Activar el sonido' : 'Silenciar la música'}
        aria-pressed={muted}
        className="landing-player-mute"
      >
        {muted ? <VolumeOff className="h-[1.1rem] w-[1.1rem]" /> : <Volume className="h-[1.1rem] w-[1.1rem]" />}
      </button>
    </div>
  )
}
