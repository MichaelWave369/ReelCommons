import {useState} from 'react'
import type {ChangeEvent} from 'react'
import type {PilotPreproductionPacket} from './reelPilot'
import {
  inspectReelFirstShot, REEL_FIRST_SHOT_MAX_BYTES,
} from './reelFirstShot'
import type {ReelFirstShotResult} from './reelFirstShot'
import './reel-first-shot.css'

interface Props {preparedKit:PilotPreproductionPacket|null}
/** Native preflight inspector, explicitly read-only and filesystem-local. */
export default function ReelFirstShotHandoff({preparedKit}:Props) {
  const [result,setResult]=useState<ReelFirstShotResult|null>(null)
  const [error,setError]=useState('')
  const [fileName,setFileName]=useState('')
  const [busy,setBusy]=useState(false)
  async function checkFile(event:ChangeEvent<HTMLInputElement>) {
    const file=event.currentTarget.files?.[0]
    event.currentTarget.value=''
    setResult(null)
    setError('')
    setFileName('')
    if(!file)return
    if(file.size>REEL_FIRST_SHOT_MAX_BYTES){
      setError('The selected file exceeds the 128 KiB local preflight limit.')
      return
    }
    setBusy(true)
    try{
      const verified=await inspectReelFirstShot(await file.text(),preparedKit)
      setResult(verified)
      setFileName(file.name.slice(0,110))
    }catch(reason){
      setError(reason instanceof Error?reason.message:'Could not inspect this first-shot preflight.')
    }finally{setBusy(false)}
  }
  return <section className="rfsh" aria-labelledby="rfsh-title">
    <div className="rfsh-title">
      <span>05 / ACTUAL VIDEO BACKEND PREPARATION</span>
      <h4 id="rfsh-title">P001-S01 · First-Frame Production Preflight</h4>
      <p>Our first real video candidate targets the eight-second <strong>Unlit Screen</strong> shot with CineSwarm's existing Wan 2.1 T2V 1.3B backend. Nothing here connects to your PC, installs a model, renders footage or launches a broadcaster.</p>
    </div>
    <div className="rfsh-steps">
      <div><b>01 · Download the pilot kit</b>
        <p>Use <strong>Download preproduction JSON</strong> above. That contains eight proposed shots; the native tool selects only the first, keeps all human approvals pending and binds its SHA-256 to this packet.</p>
        <small>{preparedKit?'KIT EXPORTED THIS BROWSER SESSION':'NO CURRENT KIT EXPORTED · RETURN TO THE EXPORT BUTTON ABOVE'}</small>
      </div>
      <div><b>02 · Check the native candidate</b>
        <p>On a local CineSwarm installation, use the separate offline native receiver and the downloaded file's actual name.</p>
        <code>python -m cineswarm.reel_shot_one reel-p001-preproduction.json --out p001-shot-one-preflight.json</code>
        <p>Optional <code>--check-local</code> probes your local GPU, pinned model files and SHA-256. It cannot grant production approval.</p>
        <small>Requires CineSwarm Python on your PC. GitHub Pages cannot run local model code.</small>
      </div>
      <div><b>03 · Inspect the returned JSON</b>
        <p>Import the locally produced preflight result for exact schema, output hash, first-shot model/rights protections and source-packet correlation.</p>
        <label>LOCAL PREFLIGHT FILE (JSON)
          <input type="file" accept=".json,application/json"
            onChange={checkFile} disabled={busy}
            aria-label="Select local CineSwarm first-shot preflight JSON"/>
        </label>
        <small>Local browser file read only. Nothing is uploaded or submitted.</small>
      </div>
    </div>
    {error&&<p className="rfsh-error" role="alert">{error}</p>}
    {result&&<div className="rfsh-result" role="status">
      <span>JSON SELF-CONSISTENT / NOT AN EXECUTION RECEIPT</span>
      <h5>{fileName}</h5>
      <p><strong>Source:</strong> {result.origin==='MATCHED_ACTIVE_PILOT_KIT'
        ? 'Matches the pilot kit exported in this visit'
        : 'Unlinked editable local file; source identity is NOT independently verified'}</p>
      <p><strong>Model readiness (self-reported JSON):</strong> {result.reportedReadiness}</p>
      <p><strong>Backend:</strong> {result.backend} · Shot {result.shotId}</p>
      <p><strong>Native media target:</strong> {result.native}</p>
      <p><strong>Delivery specification:</strong> {result.delivery}</p>
      <p><strong>SHA-256 source:</strong> <code>{result.sourceHash}</code></p>
      <p><strong>SHA-256 candidate:</strong> <code>{result.candidateHash}</code></p>
      <p><strong>Production status:</strong> {result.status}. No real render, artifact, model license approval, human QC or release is demonstrated.</p>
    </div>}
    <p className="rfsh-warning"><strong>One real shot at a time.</strong> The Wan 2.1 lane targets 832×480 at 16 fps, requiring at least 9216 MiB free VRAM on a single GPU plus the configured RAM/disk budget. Any 1280×720 file is a later scaled delivery master, not native HD. The local preflight reports conditions, but only a human can review license, source rights, budget and approve a separate actual CineSwarm job.</p>
    <a href="https://github.com/MichaelWave369/CineSwarm/blob/main/docs/REEL_P001_FIRST_SHOT.md"
      target="_blank" rel="noopener noreferrer">Read the real-model CineSwarm preflight guide ↗</a>
  </section>
}
