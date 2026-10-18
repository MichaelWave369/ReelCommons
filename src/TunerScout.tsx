import { useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  DEMO_SCOUT_REPORT, MAX_SCOUT_JSON_BYTES, parseScoutReport, scoutEvidenceReceipt,
} from './tunerScout'
import type { ScoutReport } from './tunerScout'
import './tuner-scout.css'

const powershellScan = 'py .\\companion\\tuner_scout.py --scan --out .\\rctv-tuner-inventory.json'
const powershellDemo = 'py .\\companion\\tuner_scout.py --demo --out .\\rctv-tuner-inventory-demo.json'

export default function TunerScout() {
  const [report, setReport] = useState<ScoutReport | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [importLabel, setImportLabel] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  async function copy(text: string, item: string) {
    try { await navigator.clipboard.writeText(text); setError(''); setNotice(item + ' copied to clipboard.') }
    catch { setError('Clipboard unavailable. Select the command shown below and copy it manually.') }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(''); setNotice(''); setReport(null)
    if (file.size > MAX_SCOUT_JSON_BYTES) { setError('Maximum device inventory file size is 80 KB.'); return }
    try {
      const parsed = parseScoutReport(await file.text())
      setReport(parsed)
      setImportLabel(file.name.slice(0, 130))
      setNotice('Local JSON imported. Source and device names are user-supplied claims; no RF hardware was directly verified.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not read this tuner inventory report.')
    }
  }
  function demo() {
    setReport(parseScoutReport(JSON.stringify(DEMO_SCOUT_REPORT)))
    setImportLabel('Built-in generated example')
    setError('')
    setNotice('This is an invented receiver inventory for the tutorial. No hardware was scanned.')
  }
  function exportReceipt() {
    if (!report) return
    const file = new Blob([scoutEvidenceReceipt(report)], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(file)
    link.href = url
    link.download = 'rctv-unverified-tuner-inventory-receipt.json'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('Downloaded an unverified inventory receipt. No hardware compatibility or RF lock has been proven.')
  }

  return <section className="scout-page wrap" aria-labelledby="scout-heading">
    <div className="eyebrow">RCTV ENGINEERING / EXPERIMENT 010 · WINDOWS COMPANION</div>
    <div className="scout-hero">
      <div>
        <span className="scout-kicker"><span/>THE LOCAL BRIDGE BEGINS HERE</span>
        <h1 id="scout-heading">Meet your tuner.<br/><em>Trust the evidence.</em></h1>
        <p>Discover possible broadcast-tuner and SDR devices with an optional, read-only Windows companion. Export a tiny local inventory, then import it here. Nothing tunes, records, transmits or opens a network port.</p>
        <div className="scout-tags"><span>OPT-IN WINDOWS SCAN</span><span>NO PORTS</span><span>NO DEVICE IDS</span><span>NO RF CLAIMS</span></div>
      </div>
      <div className="scout-hero-art" aria-hidden="true"><div className="scout-orbit"><div className="scout-orbit-core"/></div><strong>RCTV</strong><span>HARDWARE<br/>SCOUT v1.0</span></div>
    </div>
    <div className="scout-honesty"><strong>Hardware candidates, not confirmed receivers.</strong> A matching Windows Plug-and-Play name is a hint, not a verified tuner, driver, lock, frequency, or video stream. Reports are generated on your PC and manually imported; this public website cannot authenticate where user-supplied JSON originated.</div>

    <div className="scout-columns">
      <div className="scout-panel">
        <div className="scout-section-head"><span>01</span><div><h2>Run the local companion</h2><p>Python standard library only. No installer and no administrator rights requested.</p></div></div>
        <div className="scout-instructions">
          <p>On a Windows PC with Python 3.10+ installed, download or clone the ReelCommons repository, open PowerShell in the repo's root directory, and run one of these commands.</p>
          <div className="scout-command">
            <div><strong>Read-only present-device scan</strong><button onClick={() => copy(powershellScan, 'Scan command')}>Copy</button></div>
            <code>{powershellScan}</code>
          </div>
          <div className="scout-command">
            <div><strong>Generated demo (no Windows scan)</strong><button onClick={() => copy(powershellDemo, 'Demo command')}>Copy</button></div>
            <code>{powershellDemo}</code>
          </div>
          <a href="https://github.com/MichaelWave369/ReelCommons/blob/main/companion/tuner_scout.py" target="_blank" rel="noopener noreferrer" className="scout-source-link">Review companion source on GitHub ↗</a>
          <p className="scout-footnote">The companion reads present PnP display names and Windows-reported classes/status only. It filters likely TV tuners and SDRs, excludes instance IDs and serials, and writes JSON solely to the output file you specify. The scan runs only when you execute the command. It makes no automatic changes to devices.</p>
          <p className="scout-footnote">This is an opt-in command-line utility. GitHub Pages cannot execute it on your machine. The GitHub link points to main and will include the script after this feature is merged.</p>
        </div>
        <div className="scout-section-head scout-secondary-head"><span>02</span><div><h2>Bring the report into RCTV</h2><p>Local browser import. No report upload or cloud storage.</p></div></div>
        <label className="scout-import">
          <strong>↑ Choose tuner inventory JSON</strong>
          <span>80 KB maximum · local file only</span>
          <input type="file" accept=".json,application/json" onChange={importFile} aria-label="Import RCTV tuner scout inventory JSON"/>
        </label>
        <div className="scout-actions"><button type="button" onClick={demo}>✳ Explore synthetic demo</button><button type="button" onClick={() => { setReport(null); setImportLabel(''); setError(''); setNotice('Report cleared from this tab.') }} disabled={!report}>Clear report</button></div>
        {error && <div className="scout-message error" role="alert">{error}</div>}
        {notice && <div className="scout-message" role="status">{notice}</div>}
      </div>
      <div className="scout-panel">
        <div className="scout-section-head"><span>03</span><div><h2>Inventory evidence desk</h2><p>What the file says, not what the hardware proves.</p></div></div>
        {!report ? <div className="scout-empty"><span aria-hidden="true">◎</span><h3>No report imported.</h3><p>Load the synthetic example immediately, or run the optional Windows scan and open its output here.</p></div> : <>
          <div className={'scout-source-state ' + (report.source === 'SYNTHETIC_DEMO' ? 'demo' : '')}>
            <div><span>USER-SUPPLIED SOURCE CLAIM</span><strong>{report.source === 'SYNTHETIC_DEMO' ? 'SYNTHETIC INVENTORY' : 'WINDOWS PNP INVENTORY FILE'}</strong><p>{importLabel} · {new Date(report.generatedAt).toLocaleString()}</p></div>
            <span aria-hidden="true">▣</span>
          </div>
          <div className="scout-stats"><div><span>Matching candidates</span><strong>{report.devices.length}</strong></div><div><span>Hardware RF locks</span><strong>NONE OBSERVED</strong></div><div><span>Tuned frequencies</span><strong>NOT SCANNED</strong></div><div><span>Transport decoding</span><strong>NOT TESTED</strong></div></div>
          {report.truncated && <div className="scout-message warning">Candidate list was capped at 32 entries. More matching devices may exist.</div>}
          {report.devices.length === 0 ? <div className="scout-empty"><h3>No matching names found.</h3><p>This does not prove the computer has no tuner. Check drivers and compatibility independently.</p></div> : <div className="scout-device-list">{report.devices.map((device, n) => <article key={device.name + device.deviceClass + n}>
            <div><span className="scout-device-glyph" aria-hidden="true">{device.candidateType === 'POSSIBLE_SDR' ? '⌁' : '▣'}</span><div><h3>{device.name}</h3><p>{device.candidateType === 'POSSIBLE_SDR' ? 'Possible software-defined radio' : 'Possible TV broadcast tuner'}</p></div></div>
            <div className="scout-device-data"><span>Windows class: {device.deviceClass}</span><span>Reported PnP status: {device.pnpStatus}</span></div>
          </article>)}</div>}
          <button className="scout-expand" aria-expanded={showDetails} type="button" onClick={() => setShowDetails((v) => !v)}>{showDetails ? '− Hide provenance details' : '+ Show provenance details'}</button>
          {showDetails && <div className="scout-provenance"><p>{report.disclosure}</p><p>Imported inventory source: {report.source}. This value can be edited by anyone who possesses the JSON; the public website therefore treats it only as a claim.</p><p>Hardware RF lock observed: NO. Signal measured: NO. Transport decoded: NO. Reception rights verified: NO.</p></div>}
          <button className="scout-receipt" type="button" onClick={exportReceipt}>↓ Export inventory evidence receipt</button>
        </>}
      </div>
    </div>
    <div className="scout-next"><strong>NEXT ENGINEERING RUNG</strong><p>Once compatible hardware is identified, we can research driver-specific, strictly opt-in telemetry with a separate local trust boundary. That would be a new review and a new test gate, never silently promoted from this inventory.</p></div>
  </section>
}
