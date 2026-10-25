import { useState } from 'react'
import { auditCheckedInPlayback } from './playbackTrustGate'
import { signalMessage, signalSessionReceipt } from './signalRecovery'
import type { SignalState } from './signalRecovery'
import type { OpenStream } from './openStreams'
import './signal-diagnostic-panel.css'

interface Props {
  source: OpenStream
  signal: SignalState
  loaded: boolean
  context: 'Channel Desk' | 'Couch Mode'
  onReport: (event: 'report-working' | 'report-failed') => void
}

/** One shared read-only diagnostic surface for the two original RCTV players. */
export default function SignalDiagnosticPanel({
  source, signal, loaded, context, onReport,
}: Props) {
  const [notice, setNotice] = useState('')
  const ownsSource = signal.sourceId === source.id
  const isReviewed = ownsSource && source.playback !== 'official'
  const isActive = isReviewed && loaded
  const canReport = isActive && signal.phase !== 'standby'

  function downloadReceipt() {
    if (!isReviewed) return
    const packet = signalSessionReceipt(
      signal, new Date().toISOString(), auditCheckedInPlayback().status,
    )
    const url = URL.createObjectURL(new Blob([packet], {type:'application/json'}))
    const link = document.createElement('a')
    link.href = url
    link.download = 'rctv-' + context.toLowerCase().replaceAll(' ','-') +
      '-signal-' + signal.sourceId + '.json'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    setNotice('Session-only diagnostic receipt saved locally. No player URL or viewing history included.')
  }
  return <section className="sdp" aria-label={context + ' signal and recovery diagnostics'}>
    <div className="sdp-heading">
      <div><span>RCTV v2.9 · {context.toUpperCase()} SIGNAL</span>
        <strong>Signal & Recovery</strong></div>
      <b>{isReviewed ? signal.phase.replaceAll('-',' ').toUpperCase() : 'OFFICIAL SITE ONLY'}</b>
    </div>
    <p className="sdp-status" role="status">{isReviewed ? signalMessage(signal) :
      'This station opens on the original broadcaster website. RCTV does not have an approved inline player to diagnose.'}</p>
    <div className="sdp-actions">
      <a href={source.officialUrl} target="_blank" rel="noopener noreferrer">↗ Recover on official broadcaster</a>
      {isReviewed && <button type="button" onClick={downloadReceipt}>↓ Export signal receipt</button>}
    </div>
    {canReport && <div className="sdp-reports" role="group" aria-label="Manual signal check">
      <button type="button" onClick={() => onReport('report-working')}>
        ✓ I can {source.playback === 'youtube-embed' ? 'see the video' : 'hear audio'}
      </button>
      <button type="button" onClick={() => onReport('report-failed')}>! Not working here</button>
    </div>}
    {isReviewed && <p className="sdp-count">Loads requested in this desk: <strong>{signal.loadCount}</strong>
      {' · '}Manual report: <strong>{signal.selfReported === 'none' ? 'none' : signal.selfReported}</strong></p>}
    <p className="sdp-caveat">Only browser events and optional personal reports are shown. YouTube iframe load is not proof of video playback, audio events do not prove audible sound, and no status is sent to a server. Stop/unload or switch channels to reset the active observation. Official access and terms remain publisher-controlled.</p>
    {notice && <p className="sdp-notice" role="status">{notice}</p>}
  </section>
}
