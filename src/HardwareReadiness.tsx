import { useMemo, useState } from 'react'
import type { DiagnosticReport } from './deviceDiagnostics'
import {
  candidateKey, EMPTY_OPERATOR_CLAIMS, evaluateReadiness, readinessReceipt,
} from './hardwareReadiness'
import type { BroadcastClaim, InterfaceClaim, OperatorClaims } from './hardwareReadiness'
import './hardware-readiness.css'

const INTERFACES: { value: InterfaceClaim; label: string }[] = [
  { value: 'UNKNOWN', label: 'Unknown / undocumented' },
  { value: 'WINDOWS_BDA', label: 'Windows BDA (claimed)' },
  { value: 'SAT_IP', label: 'SAT>IP (claimed)' },
  { value: 'VENDOR_SDK', label: 'Manufacturer SDK (claimed)' },
  { value: 'SDR', label: 'SDR driver / IQ interface (claimed)' },
  { value: 'OTHER', label: 'Other / proprietary (claimed)' },
]
const STANDARDS: { value: BroadcastClaim; label: string }[] = [
  { value: 'UNKNOWN', label: 'Unknown / not documented' },
  { value: 'ATSC_1', label: 'ATSC 1.0' }, { value: 'ATSC_3', label: 'ATSC 3.0' },
  { value: 'DVB_S', label: 'DVB-S' }, { value: 'DVB_S2', label: 'DVB-S2' },
  { value: 'DVB_T', label: 'DVB-T' }, { value: 'DVB_T2', label: 'DVB-T2' },
  { value: 'DVB_C', label: 'DVB-C' }, { value: 'SDR_NON_TV', label: 'SDR / no TV standard verified' },
  { value: 'OTHER', label: 'Other / unknown variant' },
]
export default function HardwareReadiness({ report }: { report: DiagnosticReport | null }) {
  const [candidateIdentity, setCandidateIdentity] = useState('')
  const [claims, setClaims] = useState<OperatorClaims>({ ...EMPTY_OPERATOR_CLAIMS })
  const [notice, setNotice] = useState('')
  const [displayReceipt, setDisplayReceipt] = useState(false)
  const selected = report?.devices.find((candidate) => candidateKey(candidate) === candidateIdentity) ?? null
  const evaluation = useMemo(() => evaluateReadiness(report, selected, claims), [report, selected, claims])
  const receipt = useMemo(() => readinessReceipt(report, selected, claims, evaluation), [report, selected, claims, evaluation])

  function setClaim<K extends keyof OperatorClaims>(key: K, value: OperatorClaims[K]) {
    setClaims((current) => ({ ...current, [key]: value }))
    setNotice('')
  }
  function reset() {
    setClaims({ ...EMPTY_OPERATOR_CLAIMS })
    setCandidateIdentity('')
    setNotice('Readiness worksheet reset in this browser tab.')
    setDisplayReceipt(false)
  }
  function exportPacket() {
    const blob = new Blob([receipt], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'rctv-unverified-adapter-research-packet.json'
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('Saved an UNVERIFIED research packet locally. No compatibility or signal lock was certified.')
  }
  async function copyPacket() {
    try { await navigator.clipboard.writeText(receipt); setNotice('Unverified adapter research packet copied.') }
    catch { setNotice('Clipboard unavailable. Expand the preview to select the packet text manually.') }
  }
  return <section className="gate-panel" aria-labelledby="gate-title">
    <div className="gate-head">
      <div><span className="gate-overline">RCTV v1.2 · HARDWARE REALITY GATE</span><h2 id="gate-title">From device name to adapter plan.</h2>
        <p>Use the imported Windows diagnostics as a starting point. Add operator-researched details and find what would still need evidence before writing any real tuner driver.</p>
      </div>
      <span className="gate-label">NO AUTOMATIC APPROVAL</span>
    </div>
    <div className="gate-truth"><strong>Every import is an unverified claim.</strong> Even a Windows report labeled “OK” is not a device attestation. The checklist can prepare documentation for human review, but it cannot prove tuner compatibility, RF measurements, decoded channels, or reception rights.</div>
    <div className="gate-layout">
      <div className="gate-form">
        <h3><span>01</span> Choose a possible device</h3>
        <label className="gate-field">Candidate from current Windows report
          <select value={selected ? candidateKey(selected) : ''} onChange={(event) => {setCandidateIdentity(event.target.value); setNotice('')}}>
            <option value="">No candidate selected</option>
            {(report?.devices ?? []).map((candidate, i) => <option key={candidateKey(candidate) + i} value={candidateKey(candidate)}>
              {candidate.name} · {candidate.deviceClass}
            </option>)}
          </select>
        </label>
        <p className="gate-helper">{report ? report.source === 'SYNTHETIC_DEMO'
          ? 'Synthetic reports can illustrate the worksheet but cannot qualify for actual adapter review.'
          : 'This inventory is imported JSON; source and device identity have not been independently authenticated.'
          : 'Import a current diagnostics JSON above first. You may explore the unfilled worksheet meanwhile.'}</p>
        <h3><span>02</span> Operator-researched details</h3>
        <label className="gate-field">Model label from product documentation
          <input value={claims.modelLabel} maxLength={110} placeholder="Exact tuner model, not serial number"
            onChange={(event) => setClaim('modelLabel', event.target.value)} />
        </label>
        <div className="gate-fields">
          <label className="gate-field">Proposed driver interface
            <select value={claims.interfaceClaim} onChange={(event) => setClaim('interfaceClaim', event.target.value as InterfaceClaim)}>
              {INTERFACES.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
            </select>
          </label>
          <label className="gate-field">Proposed signal standard
            <select value={claims.broadcastClaim} onChange={(event) => setClaim('broadcastClaim', event.target.value as BroadcastClaim)}>
              {STANDARDS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
            </select>
          </label>
        </div>
        <label className="gate-field">Manufacturer documentation reference (optional)
          <input value={claims.driverReference} maxLength={150} placeholder="Document title or public manufacturer URL"
            onChange={(event) => setClaim('driverReference', event.target.value)} />
        </label>
        <p className="gate-helper">The dropdowns are descriptions you supply, not checks against Windows APIs or official manufacturer catalogs. Never paste device IDs, serials, keys or other private details.</p>
        <h3><span>03</span> Explicit operator acknowledgements</h3>
        <label className="gate-check"><input type="checkbox" checked={claims.canAccessHardware}
          onChange={(e) => setClaim('canAccessHardware', e.target.checked)} />
          <span>I can physically access this equipment for a future, separately authorized test.</span>
        </label>
        <label className="gate-check"><input type="checkbox" checked={claims.rightsAcknowledged}
          onChange={(e) => setClaim('rightsAcknowledged', e.target.checked)} />
          <span>I intend to test only signals and media I am permitted to receive and use.</span>
        </label>
        <div className="gate-actions"><button type="button" onClick={exportPacket}>↓ Export research packet</button>
          <button type="button" onClick={reset}>Reset worksheet</button></div>
        {notice && <p className="gate-notice" role="status">{notice}</p>}
      </div>
      <div className="gate-readout">
        <h3><span>04</span> Evidence-first readiness assessment</h3>
        <div className={'gate-decision ' + (evaluation.gate === 'REVIEW_PACKET_PREPARED' ? 'prepared' : '')}>
          <small>ADAPTER PLANNING STATUS · NOT RF READINESS</small>
          <strong>{evaluation.headline}</strong>
          <p>{evaluation.recommendedNextAction}</p>
        </div>
        <div className="gate-steps">
          {evaluation.steps.map((step) => <div key={step.id} className={'gate-step ' + step.state}>
            <span className="gate-step-symbol" aria-hidden="true">{step.state === 'reported' ? '▣' : step.state === 'operator-claimed' ? '✎' : step.state === 'blocked' ? '×' : '○'}</span>
            <div><strong>{step.name}</strong><p>{step.description}</p></div>
            <small>{step.state === 'operator-claimed' ? 'SELF-REPORTED' : step.state === 'reported' ? 'IMPORTED OS CLAIM' : step.state === 'blocked' ? 'BLOCKED' : 'MISSING'}</small>
          </div>)}
        </div>
        <div className="gate-limits"><strong>AUTHORITY CEILING</strong><p>Verified tuner: <b>NO</b> · Observed RF lock: <b>NO</b> · Verified video playback: <b>NO</b>. No checkboxes, model labels, or imported reports can change this ceiling in v1.2.</p></div>
        <button type="button" className="gate-expand" aria-expanded={displayReceipt} onClick={() => setDisplayReceipt((v) => !v)}>{displayReceipt ? '− Hide packet preview' : '+ Preview exported packet'}</button>
        {displayReceipt && <div className="gate-packet"><pre>{receipt}</pre><button type="button" onClick={copyPacket}>Copy packet text</button></div>}
      </div>
    </div>
    <p className="gate-footnote"><strong>Next real-world milestone:</strong> run Windows diagnostics on an actual connected device, verify the exact hardware model from manufacturer information, and determine which hardware API is appropriate. Design a device-specific opt-in telemetry adapter only after that evidence exists. This page does not install, probe or tune a receiver.</p>
  </section>
}
