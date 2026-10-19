import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  compareDiagnosticReports, DIAGNOSTIC_DEMO, diagnosticReceipt,
  MAX_DIAGNOSTIC_BYTES, parseDiagnosticReport,
} from './deviceDiagnostics'
import type { DiagnosticReport, WindowsDiagnostic } from './deviceDiagnostics'
import HardwareReadiness from './HardwareReadiness'
import './device-diagnostics.css'

type SnapshotSlot = 'baseline' | 'current'
const scanCommand = 'py .\\companion\\device_diagnostics.py --scan --out .\\rctv-device-diagnostics.json'
const demoCommand = 'py .\\companion\\device_diagnostics.py --demo --out .\\rctv-device-diagnostics-demo.json'
const labels: Record<WindowsDiagnostic, string> = {
  WINDOWS_REPORTS_OK: 'Windows reports OK',
  WINDOWS_REPORTS_DEVICE_ISSUE: 'Windows reports a device issue',
  WINDOWS_STATUS_UNCERTAIN: 'Windows state uncertain',
}
export default function DeviceDiagnostics() {
  const [current, setCurrent] = useState<DiagnosticReport | null>(null)
  const [baseline, setBaseline] = useState<DiagnosticReport | null>(null)
  const [names, setNames] = useState({ current: '', baseline: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [details, setDetails] = useState(false)
  const changes = useMemo(
    () => baseline && current ? compareDiagnosticReports(baseline, current) : [],
    [baseline, current],
  )
  async function copy(command: string) {
    try { await navigator.clipboard.writeText(command); setNotice('PowerShell command copied. It will run only when you execute it locally.'); setError('') }
    catch { setError('Clipboard unavailable. Manually select and copy the shown command.') }
  }
  async function importReport(event: ChangeEvent<HTMLInputElement>, slot: SnapshotSlot) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(''); setNotice('')
    if (file.size > MAX_DIAGNOSTIC_BYTES) { setError('The diagnostics JSON exceeds 80 KB.'); return }
    try {
      const parsed = parseDiagnosticReport(await file.text())
      if (slot === 'baseline') setBaseline(parsed)
      else setCurrent(parsed)
      setNames((value) => ({ ...value, [slot]: file.name.slice(0, 130) }))
      setNotice('Imported an unverified ' + slot + ' report locally. No remote connection or RF telemetry was established.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not parse the diagnostic report.')
    }
  }
  function demo() {
    const old = parseDiagnosticReport(JSON.stringify({
      ...DIAGNOSTIC_DEMO,
      devices: [{ ...DIAGNOSTIC_DEMO.devices[0],
        windowsStatus: 'Unknown', configManagerErrorCode: null, diagnostic: 'WINDOWS_STATUS_UNCERTAIN' }],
    }))
    setBaseline(old)
    setCurrent(parseDiagnosticReport(JSON.stringify(DIAGNOSTIC_DEMO)))
    setNames({ baseline: 'Synthetic baseline', current: 'Synthetic follow-up' })
    setError('')
    setNotice('Loaded two synthetic examples. These results are fictional, not your PC.')
  }
  function download() {
    if (!current) return
    const url = URL.createObjectURL(new Blob([diagnosticReceipt(current)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'rctv-windows-device-diagnostics-unverified.json'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('Exported a report explicitly marked UNVERIFIED_USER_SUPPLIED_FILE.')
  }
  return <section className="diag-panel" aria-labelledby="diag-title">
    <div className="diag-head">
      <div><span className="diag-overline">RCTV v1.1 · WINDOWS DEVICE DIAGNOSTICS</span><h2 id="diag-title">Read the device ledger.</h2><p>Inspect Windows-reported PnP state and compare two snapshots, with no tuner commands, installs, background monitoring or network ports.</p></div>
      <span className="diag-safety-label">READ ONLY · OS METADATA</span>
    </div>
    <div className="diag-explainer"><strong>Important:</strong> Windows ConfigManager status reflects the operating system's view of a possible device. It does not test DVB/ATSC compatibility, signal strength, RF lock, video decoding, or reception rights. Importing JSON does not authenticate its source.</div>
    <div className="diag-grid">
      <div className="diag-column">
        <h3><span>01</span> Create a Windows report</h3>
        <p>From the ReelCommons repository folder on a Windows PC with Python 3.10+, run an explicit command:</p>
        <div className="diag-command"><div><strong>Read-only Windows diagnostics</strong><button type="button" onClick={() => copy(scanCommand)}>Copy</button></div><code>{scanCommand}</code></div>
        <div className="diag-command"><div><strong>Synthetic example (no device scan)</strong><button type="button" onClick={() => copy(demoCommand)}>Copy</button></div><code>{demoCommand}</code></div>
        <p className="diag-fine-print">Runs a fixed, read-only Windows CIM query for present PnP devices. Only matching candidate names, device class, Windows status and Configuration Manager error code enter the JSON. No device IDs or serial-number fields are requested. Friendly names can still contain unique details, so review the local export before sharing it.</p>
        <a href="https://github.com/MichaelWave369/ReelCommons/blob/main/companion/device_diagnostics.py" target="_blank" rel="noopener noreferrer" className="diag-source">Review the Python companion source ↗</a>
        <h3 className="diag-import-heading"><span>02</span> Load two snapshots</h3>
        <p>Import the old report as a baseline and the newer report as current. The app reads files in the browser only. A baseline is optional.</p>
        <div className="diag-import-grid">
          <label className="diag-file-picker"><strong>↑ Baseline JSON</strong><small>{names.baseline || 'Optional older snapshot'}</small><input type="file" accept=".json,application/json" aria-label="Import older device diagnostics baseline JSON" onChange={(event) => importReport(event, 'baseline')} /></label>
          <label className="diag-file-picker"><strong>↑ Current JSON</strong><small>{names.current || 'Latest snapshot'}</small><input type="file" accept=".json,application/json" aria-label="Import current device diagnostics JSON" onChange={(event) => importReport(event, 'current')} /></label>
        </div>
        <div className="diag-buttons"><button type="button" onClick={demo}>✳ Try two synthetic reports</button><button type="button" onClick={() => { setCurrent(null); setBaseline(null); setNames({current:'',baseline:''}); setNotice('Snapshots cleared from this tab.'); setError('') }} disabled={!current && !baseline}>Clear snapshots</button></div>
        {error && <div className="diag-notice bad" role="alert">{error}</div>}
        {notice && <div className="diag-notice" role="status">{notice}</div>}
      </div>
      <div className="diag-column">
        <h3><span>03</span> What Windows reports</h3>
        {!current ? <div className="diag-empty"><strong>No current report loaded.</strong><p>Import a report, or try the synthetic comparison to explore how this works without hardware.</p></div> : <>
          <div className={'diag-provenance ' + (current.source === 'SYNTHETIC_DEMO' ? 'synthetic' : '')}>
            <span>SOURCE CLAIM · NOT AUTHENTICATED</span>
            <strong>{current.source === 'SYNTHETIC_DEMO' ? 'SYNTHETIC DEMONSTRATION' : 'USER-IMPORTED WINDOWS CIM REPORT'}</strong>
            <p>Timestamp claimed: {new Date(current.generatedAt).toLocaleString()}</p>
          </div>
          <div className="diag-stats"><div><small>Possible devices</small><strong>{current.devices.length}</strong></div><div><small>Observed RF locks</small><strong>NONE</strong></div><div><small>Operating-system issues</small><strong>{current.devices.filter((d) => d.diagnostic === 'WINDOWS_REPORTS_DEVICE_ISSUE').length}</strong></div></div>
          {current.truncated && <div className="diag-notice bad">Report was capped at 32 name matches. More candidates may exist.</div>}
          {!current.devices.length && <div className="diag-empty"><p>No matching device names in this report. That does not prove no tuner is connected.</p></div>}
          <div className="diag-devices">
            {current.devices.map((d, i) => <article key={d.name + d.deviceClass + i}>
              <div className="diag-dev-name"><strong>{d.name}</strong><span className={d.diagnostic === 'WINDOWS_REPORTS_DEVICE_ISSUE' ? 'issue' : d.diagnostic === 'WINDOWS_REPORTS_OK' ? 'ok' : ''}>{labels[d.diagnostic]}</span></div>
              <p>{d.candidateType === 'POSSIBLE_SDR' ? 'Possible SDR' : 'Possible broadcast tuner'} · Windows class {d.deviceClass}</p>
              <p>Windows PnP: {d.windowsStatus} · ConfigManager code: {d.configManagerErrorCode ?? 'unreported'}</p>
            </article>)}
          </div>
          <button type="button" className="diag-expand" aria-expanded={details} onClick={() => setDetails((p) => !p)}>{details ? '− Hide source interpretation' : '+ Show evidence limitations'}</button>
          {details && <p className="diag-fine-print">{current.disclosure} This JSON can be modified by the sender. Device matching is based on Windows display names, not stable device identities.</p>}
          <button type="button" className="diag-export" onClick={download}>↓ Export unverified evidence receipt</button>
        </>}
        <h3 className="diag-compare-heading"><span>04</span> Compare the snapshots</h3>
        {!current || !baseline ? <p className="diag-fine-print">Load both snapshots to see reported name appearances/disappearances and Windows-state changes. No polling occurs.</p> :
          <div className="diag-compare">
            <p>Comparing <strong>{names.baseline || 'baseline'}</strong> with <strong>{names.current || 'current'}</strong> using display-name/class matching only. Differences could reflect renaming, duplicates, or metadata edits rather than device changes.</p>
            {!changes.length ? <div className="diag-no-changes">No matching-name or classified-state changes detected.</div> :
              <div className="diag-changes">{changes.map((change, i) => <div key={change.name + i}><strong>{change.name}</strong><span>{change.change.replaceAll('_', ' ')}</span><small>{change.from ? labels[change.from] : 'Not listed'} → {change.to ? labels[change.to] : 'Not listed'}</small></div>)}</div>}
          </div>}
      </div>
    </div>
    <HardwareReadiness key={current ? current.generatedAt + ':' + current.source + ':' + current.devices.map(d => d.name).join('|') : 'empty'} report={current} />
    <div className="diag-footer"><strong>NEXT GATE:</strong> A human-reviewed v1.2 adapter research packet comes before device-specific RF telemetry, actual tuning, or playback would require a separate opt-in hardware adapter and verification. None of that is performed by this release.</div>
  </section>
}
