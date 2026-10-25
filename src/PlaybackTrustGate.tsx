import { useMemo, useState } from 'react'
import {
  TRUST_GATE_DECLARATIONS, TRUST_GATE_POLICY_REVISION, auditCheckedInPlayback,
  trustGateReport,
} from './playbackTrustGate'
import type { TrustGateDeclaration } from './playbackTrustGate'
import { REVIEWED_BRIDGE_ROSTER } from './reviewedPlaybackBridge'
import './playback-trust-gate.css'

const reportFilename = 'rctv-playback-trust-gate-v1.json'
const reviewedById = new Map<string, (typeof REVIEWED_BRIDGE_ROSTER)[number]>(
  REVIEWED_BRIDGE_ROSTER.map((row) => [row.id, row]),
)

/**
 * Visibility does not affect playback; no broadcaster or media URL is fetched.
 * This reads only built-in source declarations, never untrusted user drafts.
 */
export default function PlaybackTrustGate() {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('nasa-iss')
  const [notice, setNotice] = useState('')
  const audit = useMemo(() => auditCheckedInPlayback(), [])
  const selected = TRUST_GATE_DECLARATIONS.find(({ id }) => id === selectedId) ?? null
  const reviewed = selected ? reviewedById.get(selected.id) : null

  function download() {
    const text = trustGateReport(audit)
    const url = URL.createObjectURL(new Blob([text], {type: 'application/json'}))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = reportFilename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    setNotice('Exported code-consistency results. No media URLs, viewer history or source credentials included.')
  }
  function role(row: TrustGateDeclaration): string {
    if (row.mode === 'youtube-embed') return 'REVIEWED EMBED METHOD'
    if (row.mode === 'published-audio') return 'PUBLISHER-LISTED AUDIO'
    return 'OFFICIAL SITE ONLY'
  }

  return <section className="ptg" aria-labelledby="ptg-title">
    <div className="ptg-header">
      <div>
        <span className="ptg-kicker">RCTV v2.7 · PLAYBACK TRUST GATE</span>
        <h3 id="ptg-title">Inspect the actual playback policy.</h3>
        <p>This is a deterministic audit of the app's checked-in source declarations. It can flag software-policy mismatches, not establish broadcast rights or test whether a feed is online.</p>
      </div>
      <button type="button" aria-expanded={open} aria-controls="ptg-panel"
        onClick={() => setOpen((value) => !value)}>
        {open ? '− Hide trust gate report' : '＋ Open Playback Trust Gate'}
      </button>
    </div>
    <div className="ptg-banner">
      <strong>CONFIGURATION CHECK ≠ BROADCAST AUTHORIZATION</strong>
      <p>No imported source, IPTV-org listing, playlist or local review receipt is trusted by this report. The check uses source-controlled declarations only; playback still requires exact hardcoded routes and a direct user click.</p>
    </div>
    {open && <div className="ptg-panel" id="ptg-panel">
      <div className="ptg-stats">
        <div><strong>{audit.checkedSources}</strong><span>source-controlled destinations</span></div>
        <div><strong>{audit.reviewedMediaRoutes}</strong><span>configured inline routes</span></div>
        <div><strong>{audit.directoryOnly}</strong><span>no inline media route</span></div>
        <div><strong>{audit.issues.length}</strong><span>code-policy discrepancies</span></div>
      </div>
      <div className={'ptg-result' + (audit.issues.length ? ' has-issues' : '')} role="status">
        <strong>{audit.status === 'code-consistent' ? 'CODE CONFIGURATION MATCHES REVIEWED MANIFEST' : 'ENGINEERING REVIEW REQUIRED'}</strong>
        <p>{audit.status === 'code-consistent'
          ? 'The checked-in media modes and exact route allowlist agree with the policy manifest. This is NOT a real-time permission, legal or availability check.'
          : 'The checked-in channel configuration differs from the declared trust policy. Review the discrepancies before deploying playback changes.'}</p>
      </div>
      {audit.issues.length > 0 && <ul className="ptg-errors">
        {audit.issues.slice(0, 20).map((issue, i) =>
          <li key={issue.sourceId + issue.code + i}>{issue.sourceId}: {issue.code.replaceAll('_', ' ').toLowerCase()}</li>)}
        {audit.issues.length > 20 && <li>Additional discrepancies are included in the exported report.</li>}
      </ul>}
      <div className="ptg-entries">
        <div className="ptg-roster" role="group" aria-label="Declared reviewed sources">
          {TRUST_GATE_DECLARATIONS.map((row) =>
            <button type="button" key={row.id} aria-pressed={row.id === selected?.id}
              className={row.id === selected?.id ? 'active' : ''}
              onClick={() => setSelectedId(row.id)}>
              <span>{role(row)}</span>
              <strong>{reviewed?.id === row.id ? reviewed.source.name : REVIEWED_BRIDGE_ROSTER.find((item) => item.id === row.id)?.source.name ?? row.id}</strong>
            </button>)}
        </div>
        <div className="ptg-detail">
          {selected && <>
            <span className="ptg-kicker">SOURCE-CONTROLLED POLICY ENTRY</span>
            <h4>{reviewed?.source.name ?? selected.id}</h4>
            <dl>
              <div><dt>Policy source ID</dt><dd>{selected.id}</dd></div>
              <div><dt>Playback decision</dt><dd>{role(selected)}</dd></div>
              <div><dt>Source configuration</dt><dd>{selected.mediaRoute ? 'Exact inline route checked in code' : 'Official external website only'}</dd></div>
              <div><dt>Policy revision</dt><dd>{TRUST_GATE_POLICY_REVISION} (code revision label, not a publisher verification date)</dd></div>
            </dl>
            <strong>Review evidence already in source code</strong>
            <p>{selected.evidence}</p>
            <strong>Limits and usage boundary</strong>
            <p>{selected.boundary}</p>
            <p>The actual media endpoint is intentionally omitted from this dashboard and its exported report. The trusted source module controls that separately.</p>
          </>}
        </div>
      </div>
      <div className="ptg-export">
        <button type="button" onClick={download}>↓ Export playback policy audit JSON</button>
        <p>Receipt: <code>RCTV_PLAYBACK_TRUST_GATE_V1</code>. Software-only consistency report, no source credentials or direct media URLs.</p>
      </div>
      {notice && <p className="ptg-notice" role="status">{notice}</p>}
    </div>}
  </section>
}
