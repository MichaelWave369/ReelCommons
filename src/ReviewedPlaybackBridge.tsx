import { useEffect, useState } from 'react'
import type { KeyboardEvent } from 'react'
import {
  REVIEWED_BRIDGE_ROSTER, loadBridgeMedia, moveBridgeStation,
  reviewedBridgeReceipt, reviewedMediaUrl, unloadBridgeMedia,
} from './reviewedPlaybackBridge'
import type { BridgeSelection, ReviewedBridgeId } from './reviewedPlaybackBridge'
import './reviewed-playback-bridge.css'

interface Props {
  /** Incremented whenever the original RCTV player or Couch Mode takes control. */
  resetToken: number
  /** Unloads the original Open Streams player before mounting any bridge media. */
  onRequestMediaLoad: () => void
}
const initial: BridgeSelection = { selectedId: 'nasa-iss', loadedId: null }

export default function ReviewedPlaybackBridge({ resetToken, onRequestMediaLoad }: Props) {
  const [opened, setOpened] = useState(false)
  const [state, setState] = useState<BridgeSelection>(initial)
  const [message, setMessage] = useState('')
  useEffect(() => {
    setState((current) => unloadBridgeMedia(current))
    setMessage('')
  }, [resetToken])

  const current = REVIEWED_BRIDGE_ROSTER.find((item) => item.id === state.selectedId)
  const mediaUrl = current ? reviewedMediaUrl(current.id) : null
  const loaded = opened && state.loadedId === current?.id && mediaUrl !== null

  function selectStation(id: ReviewedBridgeId) {
    setState((currentState) => moveBridgeStation(currentState, id))
    setMessage('Channel selected. The previous player was unloaded.')
  }
  function shift(delta: -1 | 1) {
    const index = REVIEWED_BRIDGE_ROSTER.findIndex((item) => item.id === state.selectedId)
    if (index < 0 || REVIEWED_BRIDGE_ROSTER.length < 2) return
    const next = (index + delta + REVIEWED_BRIDGE_ROSTER.length) % REVIEWED_BRIDGE_ROSTER.length
    selectStation(REVIEWED_BRIDGE_ROSTER[next].id)
  }
  function load() {
    if (!mediaUrl) return
    onRequestMediaLoad()
    setState((currentState) => loadBridgeMedia(currentState))
    setMessage(current?.mode === 'published-audio'
      ? 'Broadcaster audio controls loaded. Press Play to start listening.'
      : 'YouTube embedded player loaded on demand. Live status is controlled by the provider.')
  }
  function stop() {
    setState((currentState) => unloadBridgeMedia(currentState))
    setMessage('Media element unloaded. No background playback remains in this desk.')
  }
  function close() {
    setOpened(false)
    stop()
  }
  function downloadReview() {
    if (!current) return
    const receipt = reviewedBridgeReceipt(current.id)
    if (!receipt) return
    const url = URL.createObjectURL(new Blob([receipt], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'rctv-reviewed-' + current.id + '.json'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    setMessage('Source-review metadata exported. It does not establish that playback succeeded.')
  }
  function handleKey(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget || event.altKey || event.metaKey ||
        event.ctrlKey || event.shiftKey) return
    if (event.key === 'ArrowLeft') {event.preventDefault(); shift(-1)}
    if (event.key === 'ArrowRight') {event.preventDefault(); shift(1)}
  }

  return <section className="rpb" aria-labelledby="rpb-title">
    <div className="rpb-intro">
      <div>
        <span className="rpb-kicker">RCTV v2.4 · REVIEWED PLAYBACK BRIDGE</span>
        <h2 id="rpb-title">The World Screen.</h2>
        <p>One careful step beyond directory links. Try the existing reviewed NASA YouTube embed or KEXP published audio URL, or visit official broadcaster sites for other stations. This is a separate, fixed RCTV source roster, never an importer for IPTV-org streams.</p>
      </div>
      <button type="button" aria-expanded={opened} aria-controls="rpb-panel" onClick={() => {
        if (opened) close()
        else { setOpened(true); setMessage('') }
      }}>{opened ? '■ Close & unload desk' : '▣ Open Reviewed Player Desk'}</button>
    </div>
    <div className="rpb-boundary"><strong>REVIEWED METHOD ≠ BROADCAST LICENSE</strong>
      <p>No autoplay, no viewer tracking, no DRM bypass, no proxy and no HLS/M3U import. The original 50 numbered channels, World TV Passport, and IPTV-org catalog are unchanged. Provider controls availability, embed policy, audio access and geographic restrictions.</p>
    </div>
    {opened && <div id="rpb-panel" className="rpb-panel">
      <div className="rpb-roster" role="group" aria-label="Reviewed source selection">
        {REVIEWED_BRIDGE_ROSTER.map((item) => <button type="button" key={item.id}
          className={item.id === state.selectedId ? 'selected' : ''}
          aria-pressed={item.id === state.selectedId} onClick={() => selectStation(item.id)}>
          <span>{item.mode === 'youtube-video' ? 'REVIEWED VIDEO' : item.mode === 'published-audio' ? 'PUBLISHED AUDIO' : 'OFFICIAL WEBSITE ONLY'}</span>
          <strong>{item.source.name}</strong>
        </button>)}
      </div>
      <div className="rpb-stage" tabIndex={0} onKeyDown={handleKey}
        aria-label="Reviewed playback desk. Focus this panel for left and right arrow key channel switching.">
        <div className="rpb-stage-meta"><span>RCTV / TRUSTED SOURCE</span><span>{current?.mode === 'youtube-video' ? 'VIDEO' : current?.mode === 'published-audio' ? 'RADIO' : 'SITE LINK'}</span></div>
        <div className="rpb-screen">
          {current && loaded && mediaUrl && current.mode === 'youtube-video' ? <iframe
            key={current.id} title={'Reviewed official YouTube player for ' + current.source.name}
            src={mediaUrl} referrerPolicy="strict-origin-when-cross-origin"
            allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen /> :
          current && loaded && mediaUrl && current.mode === 'published-audio' ? <div className="rpb-audio">
            <span aria-hidden="true">♫</span><strong>{current.source.name}</strong>
            <p>KEXP's published AAC URL. Press Play yourself to listen; listening restrictions may apply.</p>
            <audio key={current.id} src={mediaUrl} controls preload="none"
              aria-label={'Broadcaster audio player: ' + current.source.name}
              onError={() => setMessage('Audio could not load here. Use the broadcaster’s official listening page.')}/>
          </div> :
          <div className="rpb-standby">
            <span aria-hidden="true">{current?.source.icon ?? '◉'}</span>
            <strong>{current?.source.name ?? 'No source'}</strong>
            <p>{mediaUrl
              ? 'On standby. Load this reviewed media route explicitly, then use its player controls.'
              : 'This source only opens on its official broadcaster website. No inline feed is approved here.'}</p>
            <b>STANDBY · NO MEDIA LOADED</b>
          </div>}
        </div>
        <div className="rpb-actions">
          <button type="button" onClick={() => shift(-1)} disabled={REVIEWED_BRIDGE_ROSTER.length < 2}>← CH−</button>
          <button type="button" onClick={() => shift(1)} disabled={REVIEWED_BRIDGE_ROSTER.length < 2}>CH+ →</button>
          {mediaUrl && !loaded && <button type="button" className="rpb-load" onClick={load}>
            ▶ {current?.mode === 'published-audio' ? 'Load KEXP audio controls' : 'Load official YouTube embed'}
          </button>}
          {loaded && <button type="button" className="rpb-stop" onClick={stop}>■ Stop / unload</button>}
          {current && <a href={current.source.officialUrl} target="_blank" rel="noopener noreferrer">↗ Open official broadcaster</a>}
        </div>
        {current && <div className="rpb-ledger">
          <strong>PLAYBACK EVIDENCE / TRUST LEDGER</strong>
          <p>{current.review}</p>
          <p><b>Source:</b> {current.source.sourceEvidence}. <b>Access:</b> {current.source.region}</p>
          <p><b>Method:</b> {current.mode === 'youtube-video' ? 'Platform-supported opt-in YouTube embed' :
            current.mode === 'published-audio' ? 'Publisher-listed direct AAC audio (manual Play)' :
            'Official website redirect only'}. No claim of current stream availability or redistribution permission.</p>
          <button type="button" onClick={downloadReview}>↓ Export source-review receipt</button>
        </div>}
        <p className="rpb-keyboard">Focus the stage for ← / → channel switching. Switching stations, Stop, closing the desk, or switching to the original RCTV player removes loaded media from this desk.</p>
        {message && <div role="status" className="rpb-notice">{message}</div>}
      </div>
    </div>}
    <p className="rpb-footer">This bridge is deliberately not connected to imported channel lists or EPG feeds. New inline sources require separate human verification of source identity, player permissions, usage terms and user-visible fallback.</p>
  </section>
}
