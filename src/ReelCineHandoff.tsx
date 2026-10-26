import {useState} from 'react'
import type {ChangeEvent} from 'react'
import type {ReelPitchPacket} from './reelNetwork'
import {
  inspectReelNativePreview,REEL_NATIVE_MAX_BYTES,
} from './reelNativePreview'
import type {NativePreviewInspection} from './reelNativePreview'
import './reel-handoff.css'

interface Props {
  currentPitch:ReelPitchPacket|null
}

/** Inspection, not upload. CineSwarm remains a separate user-owned native app. */
export default function ReelCineHandoff({currentPitch}:Props) {
  const [inspection,setInspection]=useState<NativePreviewInspection|null>(null)
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const [filename,setFilename]=useState('')
  async function readPreview(event:ChangeEvent<HTMLInputElement>) {
    const file=event.currentTarget.files?.[0]
    event.currentTarget.value=''
    setInspection(null)
    setError('')
    setFilename('')
    if(!file)return
    if(file.size>REEL_NATIVE_MAX_BYTES){
      setError('Preview rejected: local file exceeds 64 KiB.')
      return
    }
    setBusy(true)
    try {
      const result=await inspectReelNativePreview(await file.text(),currentPitch)
      setInspection(result)
      setFilename(file.name.slice(0,100))
    }catch(reason) {
      setError(reason instanceof Error?reason.message:'Could not inspect the native preview.')
    }finally{
      setBusy(false)
    }
  }
  return <section className="reel-handoff" aria-labelledby="reel-handoff-title">
    <div className="reel-handoff-head">
      <div>
        <span>REEL v3.4 · NATIVE CREATIVE BRIDGE</span>
        <h3 id="reel-handoff-title">CineSwarm Production Handoff</h3>
        <p>Connect the browser pitch to our real native CineSwarm engine through an explicit, offline, test-only review step. The website never calls your local coordinator.</p>
      </div>
      <a href="https://github.com/MichaelWave369/CineSwarm/blob/main/docs/REEL_DRYRUN_INTAKE.md"
        target="_blank" rel="noopener noreferrer">Native receiver guide ↗</a>
    </div>
    <div className="reel-handoff-steps">
      <article><strong>01 · REEL PITCH</strong>
        <p>Prepare and download your local pitch JSON above. All eleven office tasks remain not started; rights and release remain unverified.</p>
        <small>{currentPitch?'LOCAL PITCH PREPARED THIS VISIT':'NO CURRENT PITCH SELECTED'}</small>
      </article>
      <article><strong>02 · NATIVE VALIDATION</strong>
        <p>On your own machine with CineSwarm installed, validate that downloaded JSON using its independently tested native receiver.</p>
        <code>python -m cineswarm.reel_intake reel-pitch.json --out reel-preview.json</code>
        <small>Replace reel-pitch.json with the actual downloaded filename. Output does not submit a job.</small>
      </article>
      <article><strong>03 · INSPECT RETURN</strong>
        <p>Bring the resulting test-only preview back here to check its native production-plan shape and SHA-256 integrity in this browser.</p>
        <label className="reel-handoff-import">
          <span>{busy?'Inspecting file…':'Choose local CineSwarm preview JSON'}</span>
          <input type="file" accept=".json,application/json" disabled={busy}
            onChange={readPreview} aria-label="Choose local CineSwarm dry-run preview JSON"/>
        </label>
        <small>Reads local JSON only. No upload, posting, execution or publishing.</small>
      </article>
    </div>
    {error&&<p className="reel-handoff-error" role="alert">{error}</p>}
    {inspection&&<div className="reel-handoff-result" role="status">
      <span>LOCAL NATIVE PREVIEW · SHA-256 SELF-CONSISTENT</span>
      <h4>{filename}: test fixture plan accepted for inspection</h4>
      <p><strong>Origin correlation:</strong> {inspection.result==='MATCHED_CURRENT_LOCAL_PITCH'
        ? 'Matches the current REEL pitch in this browser'
        : 'Current REEL source packet not supplied, origin cannot be authenticated'}</p>
      <p><strong>Only backend:</strong> {inspection.testBackend} · <strong>Shot:</strong> {inspection.shotId}</p>
      <p><strong>Input digest:</strong> <code>{inspection.inputHash}</code></p>
      <p><strong>Test-plan digest:</strong> <code>{inspection.nativePlanHash}</code></p>
      <p><strong>Authority:</strong> none. No GPU execution, approved rights, produced video, on-air channel, or publisher authorization can be inferred from this editable file.</p>
    </div>}
    <p className="reel-handoff-warning">
      SHA-256 integrity means the JSON hashes match the supplied content; it is not an authenticated
      CineSwarm receipt or evidence an AI model ran. The only generated native plan uses the
      <strong> deterministic-test</strong> backend, a one-second fixture, and
      <strong> acceptanceEligible=false</strong>. Actual films require a separately reviewed production plan,
      approved resources, QC and human publication authority.
    </p>
  </section>
}
