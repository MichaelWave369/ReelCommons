import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { MAX_TS_BYTES, inspectTransportStream, transportEvidenceReceipt } from './transportInspector'
import type { TransportReport } from './transportInspector'
import { syntheticTransportFixture } from './syntheticTransport'
import './signal-bridge.css'

interface FileObservation {
  name: string
  fullSize: number
  analyzedSize: number
  truncated: boolean
  report: TransportReport
}
const clock = (stamp: string) => {
  const parsed = Date.parse(stamp)
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleString() : 'Unknown'
}
const pidHex = (pid: number): string => '0x' + pid.toString(16).toUpperCase().padStart(4, '0')

export default function SignalBridge() {
  const [observation, setObservation] = useState<FileObservation | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPids, setShowPids] = useState(false)

  async function inspectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true); setError(''); setNotice(''); setObservation(null)
    try {
      if (file.size < 564) throw new Error('The sample needs at least three complete 188-byte transport packets.')
      const buffer = await file.slice(0, MAX_TS_BYTES).arrayBuffer()
      const report = inspectTransportStream(new Uint8Array(buffer))
      setObservation({
        name: file.name.slice(0, 180), fullSize: file.size, analyzedSize: buffer.byteLength,
        truncated: file.size > MAX_TS_BYTES, report,
      })
      setNotice('Local MPEG-TS inspection completed. File bytes stayed on this device; no broadcaster identity or RF reception was verified.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not inspect that local transport file.')
    } finally {
      setBusy(false)
    }
  }

  function loadDemo() {
    setError(''); setNotice('')
    try {
      const fixture = syntheticTransportFixture()
      const report = inspectTransportStream(fixture, new Date().toISOString(), 'GENERATED_DEMO_BYTES')
      setObservation({ name: 'rctv-generated-demo.ts', fullSize: fixture.length, analyzedSize: fixture.length, truncated: false, report })
      setNotice('Loaded a generated MPEG-TS educational fixture. This sample never came from broadcast hardware or a real TV program.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not generate the sample.')
    }
  }
  function clearReport() {
    setObservation(null); setError(''); setNotice('The local inspection report was cleared from this tab.')
  }

  function exportReceipt() {
    if (!observation) return
    const { report, name, fullSize } = observation
    const content = transportEvidenceReceipt(report, name, fullSize)
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'rctv-ts-inspection.json'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('Downloaded a receipt of local transport bytes and parsed tables. No broadcast signal was verified.')
  }

  return <section className="sig-page wrap" aria-labelledby="sig-title">
    <div className="eyebrow">RCTV ENGINEERING / EXPERIMENT 009 · READ-ONLY</div>
    <div className="sig-hero">
      <div className="sig-hero-copy">
        <span className="sig-kicker"><span className="sig-led"/>THE SIGNAL BRIDGE · PHASE ONE</span>
        <h1 id="sig-title">Beyond simulation.<br/><em>Into the packets.</em></h1>
        <p>Inspect a real local MPEG transport-stream recording, or try a fully synthetic example. See synchronization, packet identifiers, PAT/PMT service maps and continuity indicators. No tuner, server, account or upload required.</p>
        <div className="sig-hero-tags"><span>188-BYTE MPEG-TS</span><span>LOCAL ONLY</span><span>CRC-VALIDATED PSI</span></div>
      </div>
      <div className="sig-graphic" aria-hidden="true">
        <div className="sig-radar"><div className="sig-radar-core"/><i/><i/><i/></div>
        <div className="sig-radar-title"><strong>TS</strong><span>BRIDGE</span></div>
        <div className="sig-bitstream">0100 0111 · PAT · PMT · PID · TS</div>
      </div>
    </div>
    <div className="sig-truth"><strong>Two different evidence levels.</strong> The FTA Simulator predicts a model lock; Signal Bridge reads the actual bytes in a user-selected file. Neither proves an antenna/satellite tuner locked onto a live RF signal or that the stream is legally playable. A synthetic demo isn't an observation at all.</div>

    <div className="sig-main">
      <div className="sig-side">
        <div className="sig-panel">
          <div className="sig-heading"><span>01</span><div><h2>Choose a source</h2><p>Nothing leaves your browser.</p></div></div>
          <label className={'sig-file-picker' + (busy ? ' disabled' : '')}>
            <span aria-hidden="true">↑</span><strong>{busy ? 'Inspecting…' : 'Inspect a local .ts file'}</strong>
            <small>Read-only · first 8 MiB maximum</small>
            <input type="file" accept=".ts,.m2t,.mpegts,video/mp2t,application/octet-stream" disabled={busy} onChange={inspectFile} aria-label="Choose a local 188-byte MPEG transport-stream file"/>
          </label>
          <div className="sig-secondary-actions">
            <button type="button" onClick={loadDemo} disabled={busy}>✳ Load synthetic demo</button>
            <button type="button" onClick={clearReport} disabled={!observation || busy}>✕ Clear report</button>
          </div>
          <div className="sig-limitations"><strong>SUPPORTED</strong><p>188-byte MPEG-TS packets, byte alignment, PAT and PMT with valid MPEG-2 CRC, declared elementary stream types, transport error flags, scrambling bits and continuity counter anomalies.</p><strong>NOT SUPPORTED YET</strong><p>192/204-byte transport variants, complete EPG or station-name discovery, CA decryption, video playback, device tuning, DVB frontend telemetry, advanced table versioning, or complete file analysis past the 8 MiB cap.</p></div>
          {error && <div className="sig-alert error" role="alert">{error}</div>}
          {notice && <div className="sig-alert" role="status">{notice}</div>}
        </div>
        <div className="sig-panel sig-pipeline">
          <div className="sig-heading"><span>02</span><div><h2>Evidence ladder</h2><p>Trust exactly what was measured.</p></div></div>
          <div className="sig-pipeline-rung"><span>1</span><div><strong>Simulated RF</strong><p>Mathematical assumptions, no signal.</p></div></div>
          <div className="sig-pipeline-rung current"><span>2</span><div><strong>Local TS file structure</strong><p>Packet bytes and checked program tables, origin not authenticated.</p></div></div>
          <div className="sig-pipeline-rung"><span>3</span><div><strong>Connected tuner observations</strong><p>Future local hardware read-only adapter with provenance.</p></div></div>
          <div className="sig-pipeline-rung"><span>4</span><div><strong>Verified decoding and playback</strong><p>Future opt-in, lawful, local playback with separate checks.</p></div></div>
        </div>
      </div>
      <div className="sig-results">
        <div className="sig-panel">
          <div className="sig-heading"><span>03</span><div><h2>Transport diagnostics</h2><p>Source: {observation?.name ?? 'Waiting for a file or demo'}.</p></div></div>
          {!observation ? <div className="sig-empty"><span aria-hidden="true">◎</span><h3>Awaiting transport bytes.</h3><p>Try the synthetic demo to explore the inspector instantly, or load a local MPEG-TS recording for file-derived evidence.</p></div> : <>
            <div className={'sig-source-status ' + (observation.report.provenance === 'GENERATED_DEMO_BYTES' ? 'demo' : '')}>
              <div><small>SOURCE PROVENANCE</small><strong>{observation.report.provenance === 'GENERATED_DEMO_BYTES' ? 'SYNTHETIC TEST FIXTURE' : 'USER-SELECTED LOCAL FILE'}</strong><p>{observation.truncated ? 'Only the first 8 MiB were analyzed.' : 'The supplied sample bytes were inspected.'} Not a tuner or station authenticity check.</p></div>
              <span aria-hidden="true">{observation.report.provenance === 'GENERATED_DEMO_BYTES' ? '✳' : '▣'}</span>
            </div>
            <div className="sig-stats">
              <div><small>188-BYTE PACKETS</small><strong>{observation.report.packets.toLocaleString()}</strong></div>
              <div><small>CRC-VALID PAT / PMT</small><strong>{observation.report.crcValidPatSections} / {observation.report.crcValidPmtSections}</strong></div>
              <div><small>PROGRAM ENTRIES</small><strong>{observation.report.programs.length}</strong></div>
              <div><small>SCRAMBLED PACKETS</small><strong>{observation.report.scrambledPackets.toLocaleString()}</strong></div>
            </div>
            <div className="sig-quality">
              <div><span>Continuity anomalies</span><strong>{observation.report.continuityAnomalies}</strong></div>
              <div><span>Transport-error flags</span><strong>{observation.report.transportErrors}</strong></div>
              <div><span>Invalid PSI CRC/sections</span><strong>{observation.report.invalidPsiSections}</strong></div>
              <div><span>Sync alignment offset</span><strong>{observation.report.alignmentOffset} bytes</strong></div>
              <div><span>Captured file size / sample</span><strong>{(observation.fullSize / (1024 * 1024)).toFixed(2)} / {(observation.analyzedSize / (1024 * 1024)).toFixed(2)} MiB</strong></div>
              <div><span>Local inspection time</span><strong>{clock(observation.report.observedAt)}</strong></div>
            </div>
            <div className="sig-section-title"><h3>Declared programs</h3><small>CRC-CHECKED PAT / PMT · NOT A LIST OF VERIFIED VIEWABLE CHANNELS</small></div>
            {observation.report.programs.length === 0 ? <div className="sig-no-programs">No CRC-valid PAT program mapping found in this sample. That does not establish that the complete file has no programs.</div> :
              <div className="sig-programs">{observation.report.programs.map((program) => <article key={program.number} className="sig-program">
                <div className="sig-program-head"><span>PROGRAM {program.number}</span><span>{program.pmtCrcValid ? 'CRC-VALID PMT' : 'PMT NOT FOUND / UNVERIFIED'}</span></div>
                <div className="sig-program-meta">PMT PID {pidHex(program.pmtPid)}{program.pcrPid !== null ? ' · PCR PID ' + pidHex(program.pcrPid) : ''}</div>
                {program.streams.length ? <div className="sig-stream-list">{program.streams.map((stream) => <div key={stream.pid + '-' + stream.typeId}><strong>{stream.codecHint}</strong><span>PID {pidHex(stream.pid)} · TYPE {pidHex(stream.typeId)}</span></div>)}</div> : <p className="sig-no-stream">No verified elementary-stream map in the inspected sample.</p>}
              </article>)}</div>}
            <button className="sig-expand" type="button" aria-expanded={showPids} onClick={() => setShowPids((v) => !v)}>{showPids ? '− Hide packet IDs' : '+ Inspect top packet IDs'}</button>
            {showPids && <div className="sig-pid-list">{observation.report.topPids.map((pid) =>
              <div key={pid.pid}><span>{pidHex(pid.pid)}{pid.pid === 0x1fff ? ' (null)' : ''}</span><span>{pid.packets} packet(s)</span><span>{pid.continuityAnomalies} CC issues</span></div>)}</div>}
            <div className="sig-warning-block"><strong>READING THE EVIDENCE</strong>{observation.report.warnings.map((warning, n) => <p key={n}>{warning}</p>)}</div>
            <div className="sig-export"><button type="button" onClick={exportReceipt}>↓ Export inspection receipt</button><small>The receipt includes only program maps, packet counts, local file metadata and limitations, not transport payloads.</small></div>
          </>}
        </div>
      </div>
    </div>
    <div className="sig-footer-note"><strong>WHAT COMES NEXT?</strong> A separately installed, explicitly authorized localhost tuner companion could someday produce read-only hardware observations. That will require device drivers, a secure local trust boundary, new tests, and an explicit distinction from arbitrary imported files. The public GitHub Pages app currently opens no devices or network ports.</div>
  </section>
}
