import { useEffect, useState } from 'react'
import type { KeyboardEvent } from 'react'
import {
  REVIEWED_BRIDGE_ROSTER, loadBridgeMedia, moveBridgeStation,
  reviewedBridgeReceipt, reviewedMediaUrl, unloadBridgeMedia,
} from './reviewedPlaybackBridge'
import type { BridgeSelection, ReviewedBridgeId } from './reviewedPlaybackBridge'
import type { OpenStream } from './openStreams'
import PlaybackTrustGate from './PlaybackTrustGate'
import { auditCheckedInPlayback } from './playbackTrustGate'
import {
  createSignalState, observeSignal, selectSignalStation,
  signalMessage, signalSessionReceipt,
} from './signalRecovery'
import type { SignalEvent } from './signalRecovery'
import './reviewed-playback-bridge.css'
import './signal-recovery.css'

interface Props {
  /** Incremented whenever the original RCTV player or Couch Mode takes control. */
  resetToken: number
  /** Unloads the original Open Streams player before mounting any bridge media. */
  onRequestMediaLoad: () => void
  /** Shared source-owned selection; no playback is started by this prop. */
  selectedSourceId?: string
  /** Incremented only by an explicit user click in the Unified TV Home. */
  openRequestToken?: number
  onSelectSource?: (source: OpenStream) => void
}
const initial: BridgeSelection = { selectedId: 'nasa-iss', loadedId: null }

export default function ReviewedPlaybackBridge({
  resetToken, onRequestMediaLoad, selectedSourceId = 'nasa-iss',
  openRequestToken = 0, onSelectSource,
}: Props) {
  const [opened, setOpened] = useState(false)
  const [state, setState] = useState<BridgeSelection>(initial)
  const [message, setMessage] = useState('')
  const [signal, setSignal] = useState(() => createSignalState('nasa-iss'))
  useEffect(() => {
    const desired = REVIEWED_BRIDGE_ROSTER.find((row) => row.id === selectedSourceId)
    setState((current) => desired
      ? moveBridgeStation(current, desired.id)
      : unloadBridgeMedia(current))
    setSignal((previous) => desired
      ? selectSignalStation(previous, desired.id)
      : observeSignal(previous, 'unload', previous.sourceId, previous.attempt))
    setMessage('')
  }, [resetToken, selectedSourceId])
  useEffect(() => {
    if (openRequestToken > 0) {
      setOpened(true)
      setMessage('Unified TV Home opened this desk. Playback is still on standby.')
    }
  }, [openRequestToken])

  const current = REVIEWED_BRIDGE_ROSTER.find((item) => item.id === state.selectedId)
  const mediaUrl = current ? reviewedMediaUrl(current.id) : null
  const loaded = opened && state.loadedId === current?.id && mediaUrl !== null
  const playbackAttempt = signal.attempt
  const signalDetail = signalMessage(signal)
  function receiveMediaEvent(event: SignalEvent, id: string, attempt: number) {
    setSignal((previous) => observeSignal(previous, event, id, attempt))
  }

  function selectStation(id: ReviewedBridgeId) {
    setState((currentState) => moveBridgeStation(currentState, id))
    setSignal((previous) => selectSignalStation(previous, id))
    const row = REVIEWED_BRIDGE_ROSTER.find((item) => item.id === id)
    if (row) onSelectSource?.(row.source)
    setMessage('Channel selected across RCTV. The previous player was unloaded.')
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
    setSignal((previous) => observeSignal(previous, 'load', previous.sourceId, previous.attempt))
    setMessage(current?.mode === 'published-audio'
      ? 'Broadcaster audio controls loaded. Press Play to start listening.'
      : 'YouTube embedded player loaded on demand. Live status is controlled by the provider.')
  }
  function stop() {
    setState((currentState) => unloadBridgeMedia(currentState))
    setSignal((previous) => observeSignal(previous, 'unload', previous.sourceId, previous.attempt))
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
  function exportSignal() {
    const payload = signalSessionReceipt(signal, new Date().toISOString(),
      auditCheckedInPlayback().status)
    const url = URL.createObjectURL(new Blob([payload], {type:'application/json'}))
    const link = document.createElement('a')
    link.href = url
    link.download = 'rctv-signal-session-' + signal.sourceId + '.json'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    setMessage('Exported a session-only observation receipt. No viewing history or media URLs were saved.')
  }
  function reportSignal(result: 'report-working' | 'report-failed') {
    receiveMediaEvent(result, signal.sourceId, signal.attempt)
    setMessage(result === 'report-working'
      ? 'Self-reported as working. This does not independently verify broadcaster playback.'
      : 'Self-reported as unavailable. Use Stop / unload or the official publisher link.')
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
        <span className="rpb-kicker">RCTV v3.1 · REVIEWED PLAYBACK BRIDGE</span>
        <h2 id="rpb-title" tabIndex={-1}>The World Screen.</h2>
        <p>The reviewed viewing surface now shares the selected source with the Unified TV Home. Try NASA's existing YouTube embed, KEXP audio, or official broadcaster sites. The seven-source roster is fixed and never accepts IPTV-org or imported stream URLs.</p>
      </div>
      <button type="button" aria-expanded={opened} aria-controls="rpb-panel" onClick={() => {
        if (opened) close()
        else { setOpened(true); setMessage('') }
      }}>{opened ? '■ Close & unload desk' : '▣ Open Reviewed Player Desk'}</button>
    </div>
    <div className="rpb-boundary"><strong>REVIEWED METHOD ≠ BROADCAST LICENSE</strong>
      <p>No autoplay, no viewer tracking, no DRM bypass, no proxy and no HLS/M3U import. The original 50 numbered channels, World TV Passport, and IPTV-org catalog are unchanged. Provider controls availability, embed policy, audio access and geographic restrictions.</p>
    </div>
    <PlaybackTrustGate />
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
            onLoad={() => receiveMediaEvent('frame-load', current.id, playbackAttempt)}
            allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen /> :
          current && loaded && mediaUrl && current.mode === 'published-audio' ? <div className="rpb-audio">
            <span aria-hidden="true">♫</span><strong>{current.source.name}</strong>
            <p>KEXP's published AAC URL. Press Play yourself to listen; listening restrictions may apply.</p>
            <audio key={current.id} src={mediaUrl} controls preload="none"
              onCanPlay={() => receiveMediaEvent('audio-canplay', current.id, playbackAttempt)}
              onPlaying={() => receiveMediaEvent('audio-playing', current.id, playbackAttempt)}
              onPause={() => receiveMediaEvent('audio-pause', current.id, playbackAttempt)}
              onWaiting={() => receiveMediaEvent('audio-waiting', current.id, playbackAttempt)}
              onStalled={() => receiveMediaEvent('audio-waiting', current.id, playbackAttempt)}
              aria-label={'Broadcaster audio player: ' + current.source.name}
              onError={() => {receiveMediaEvent('audio-error', current.id, playbackAttempt); setMessage('Audio could not load here. Use the broadcaster’s official listening page.')}}/>
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
        {current && <section className="rpb-signal" aria-labelledby="rpb-signal-title">
          <div className="rpb-signal-header">
            <div><span className="rpb-kicker">NEW · RCTV v2.8 / SIGNAL & RECOVERY</span>
              <h3 id="rpb-signal-title">Signal & Recovery Desk</h3>
              <p>Private, temporary observations. No stream checks or hidden connection attempts are made.</p></div>
            <strong>{signal.phase.replaceAll('-', ' ').toUpperCase()}</strong>
          </div>
          <p className="rpb-signal-detail" role="status">{signalDetail}</p>
          <div className="rpb-signal-metrics">
            <span><b>{signal.loadCount}</b> loads requested this desk session</span>
            <span><b>{signal.selfReported === 'none' ? 'NOT RATED' : signal.selfReported.toUpperCase()}</b> manually reported</span>
          </div>
          {loaded && mediaUrl && <div className="rpb-signal-actions" role="group" aria-label="Self-report playback status">
            <button type="button" onClick={() => reportSignal('report-working')}>✓ I can {current.mode === 'youtube-video' ? 'see the video' : 'hear the audio'}</button>
            <button type="button" onClick={() => reportSignal('report-failed')}>! Not working here</button>
          </div>}
          <div className="rpb-signal-recovery">
            <a href={current.source.officialUrl} rel="noopener noreferrer" target="_blank">↗ Recover on official broadcaster website</a>
            <button type="button" onClick={exportSignal}>↓ Export this session's diagnostic receipt</button>
          </div>
          <p className="rpb-signal-caveat">YouTube iframe-load confirms only that a document loaded, NOT that video played. Browser audio events do not prove sound was audible. All reports are self-reported. Nothing is auto-submitted, timed, tracked, or saved to local storage. Changing source or unloading resets the status.</p>
        </section>}
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
