import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { LiveSource } from './liveTv'
import { randomRemoteIndex, remoteSlotLabel, shortcutRemoteIndex, sourceScopeLabel, wrapRemoteIndex } from './remoteNavigation'
import './living-room.css'

interface Props {
  sources: readonly LiveSource[]
  favorites: readonly string[]
  onFavoriteToggle: (id: string) => void
  onClose: () => void
}

export default function LivingRoom({ sources, favorites, onFavoriteToggle, onClose }: Props) {
  const [index, setIndex] = useState(0)
  const modalRef = useRef<HTMLDivElement>(null)
  const lastFocusRef = useRef<HTMLElement | null>(null)
  const active = sources[index] ?? null

  useEffect(() => {
    const lastFocus = document.activeElement
    if (lastFocus instanceof HTMLElement) lastFocusRef.current = lastFocus
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    modalRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      lastFocusRef.current?.focus()
    }
  }, [])

  function move(direction: 'next' | 'previous' | 'first' | 'last') {
    setIndex((previous) => wrapRemoteIndex(previous, sources.length, direction))
  }

  function shortcutKey(event: KeyboardEvent<HTMLDivElement>) {
    const key = event.key
    if (key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (key === 'Tab') {
      const focusable = Array.from(modalRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]') ?? [])
        .filter((element) => element.getClientRects().length > 0)
      if (!focusable.length) { event.preventDefault(); return }
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === modalRef.current)) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus()
      }
      return
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || !active) return
    // The mode owns the keyboard while visible; link/button Enter and Space remain native.
    const direction = key === 'ArrowRight' || key === 'ArrowDown' ? 'next'
      : key === 'ArrowLeft' || key === 'ArrowUp' ? 'previous'
      : key === 'Home' ? 'first'
      : key === 'End' ? 'last'
      : null
    if (direction) {
      event.preventDefault()
      move(direction)
      return
    }
    const slot = shortcutRemoteIndex(key, sources.length)
    if (slot !== null) {
      event.preventDefault()
      setIndex(slot)
      return
    }
    if (key.toLocaleLowerCase() === 'f' && !event.shiftKey) {
      event.preventDefault()
      onFavoriteToggle(active.id)
    }
  }

  return <div className="rc-room-overlay" role="presentation" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose()
  }}>
    <div className="rc-room" ref={modalRef} tabIndex={-1} role="dialog" aria-modal="true"
      aria-labelledby="rc-room-title" aria-describedby="rc-room-description" onKeyDown={shortcutKey}>
      <div className="rc-room-header">
        <div className="rc-room-brand"><span className="rc-room-brand-mark">▶</span><div><span>RCTV</span><small>THE COMMON SCREEN · LIVING ROOM MODE</small></div></div>
        <div className="rc-room-header-right">
          <span className="rc-room-live-indicator"><i aria-hidden="true" /> OFFICIAL TV DIRECTORY</span>
          <button type="button" className="rc-room-close" onClick={onClose} aria-label="Exit Living Room Mode">✕ <span>Exit room</span></button>
        </div>
      </div>

      <div className="rc-room-main">
        <div className="rc-room-screen-col">
          <div className={'rc-room-screen rc-room-tone-' + (active?.accent ?? 'blue')}>
            <div className="rc-room-bezel">
              <span>RCTV / DIRECTORY SLOT {active ? remoteSlotLabel(index) : '--'}</span>
              <span>NOT A VIDEO PLAYER</span>
            </div>
            {active ? <div className="rc-room-signal">
              <div className="rc-room-screen-orbit rc-room-screen-orbit-1" /><div className="rc-room-screen-orbit rc-room-screen-orbit-2" />
              <span className="rc-room-symbol" aria-hidden="true">{active.icon}</span>
              <div className="rc-room-signal-copy">
                <span className="rc-room-signal-heading">{sourceScopeLabel(active)}</span>
                <strong>{active.shortName}</strong>
                <span>{active.headline}</span>
              </div>
              <div className="rc-room-faux-scan" aria-hidden="true"/>
            </div> : <div className="rc-room-no-sources">No destinations match these filters. Exit the room and clear your filters.</div>}
            <div className="rc-room-bezel rc-room-bezel-bottom"><span>RCTV · EXPLORE, DON'T RESTREAM</span><span>DIR {active ? remoteSlotLabel(index) : '--'}</span></div>
          </div>
          <div className="rc-room-controller" aria-label="Remote controls">
            <button type="button" aria-label="Previous directory destination" onClick={() => move('previous')} disabled={sources.length < 2}>◀ <span>Previous</span></button>
            <button type="button" aria-label="Random different destination" onClick={() => setIndex((previous) => randomRemoteIndex(previous, sources.length))} disabled={sources.length < 2}>✳ <span>Surprise me</span></button>
            <button type="button" aria-label="Next directory destination" onClick={() => move('next')} disabled={sources.length < 2}><span>Next</span> ▶</button>
          </div>
          <p id="rc-room-description" className="rc-room-disclaimer">This is a <strong>remote-friendly discovery interface</strong>, not an embedded livestream, an EPG, or proof of live availability. Choose a destination to open the provider's own site in a new tab.</p>
        </div>

        <div className="rc-room-info">
          <div className="rc-room-info-top">
            <div><span className="rc-room-eyebrow">YOUR CHANNEL-SURFING DIRECTORY</span><h1 id="rc-room-title">{active ? active.name : 'No destinations'}</h1></div>
            <span className="rc-room-number">{active ? remoteSlotLabel(index) : '--'} <small>/ {String(sources.length).padStart(2, '0')}</small></span>
          </div>

          {active && <>
            <div className="rc-room-type">{active.kind === 'fast' ? 'FAST · AD-SUPPORTED INTERNET TV' : active.kind === 'public' ? 'PUBLIC · FREE PROGRAMMING' : 'FTA / OTA · ANTENNA RECEPTION'}</div>
            <p className="rc-room-description">{active.description}</p>
            <div className="rc-room-properties">
              <div><span>ACCESS</span><strong>{active.access}</strong></div>
              <div><span>REGIONAL LIMITATIONS</span><strong>{active.regionNote}</strong></div>
              <div><span>ACCOUNT / DEVICE</span><strong>{active.accountNote}</strong></div>
              <div><span>EVIDENCE</span><strong>{active.verifiedSource}</strong></div>
            </div>
            <div className="rc-room-actions">
              <a href={active.url} target="_blank" rel="noopener noreferrer" className="rc-room-launch">
                {active.kind === 'antenna' ? 'Open official antenna map ↗' : 'Open official streaming guide ↗'}
              </a>
              <button type="button" className={'rc-room-favorite' + (favorites.includes(active.id) ? ' active' : '')}
                aria-pressed={favorites.includes(active.id)} onClick={() => onFavoriteToggle(active.id)}>
                {favorites.includes(active.id) ? '★ Favorited' : '☆ Add favorite'}
              </button>
            </div>
          </>}
          <div className="rc-room-keys"><strong>REMOTE SHORTCUTS</strong><p>← / → browse · ↑ / ↓ browse · Home / End jump · 1–9 choose a directory slot · F favorite · Esc exit</p><small>Directory slot numbers are not actual broadcast or cable channel numbers.</small></div>
        </div>
      </div>

      <div className="rc-room-rail">
        <div className="rc-room-rail-head"><span>CHANNEL-SURFING DIRECTORY</span><span>{sources.length} OFFICIAL DESTINATIONS</span></div>
        <div className="rc-room-rail-inner" role="group" aria-label="Choose directory slot">
          {sources.map((source, slot) => <button key={source.id} type="button" aria-pressed={slot === index}
            className={slot === index ? 'active' : ''} onClick={() => setIndex(slot)}>
            <span className="rc-room-rail-number">{remoteSlotLabel(slot)}</span>
            <span className="rc-room-rail-symbol" aria-hidden="true">{source.icon}</span>
            <span className="rc-room-rail-name">{source.name}</span>
            {favorites.includes(source.id) && <span className="rc-room-rail-star" aria-label="Favorite">★</span>}
          </button>)}
        </div>
      </div>
      <div className="rc-room-footer"><span>ReelCommons is independent. Services own their content and delivery.</span><span>© 2026 THE COMMON SCREEN / v0.7</span></div>
    </div>
  </div>
}
