import {useEffect,useRef,useState} from 'react'
import type {ChangeEvent} from 'react'
import type {PilotPreproductionPacket} from './reelPilot'
import {
  REEL_MEDIA_MAX_BYTES,REEL_EVIDENCE_MAX_BYTES,verifyReelMediaIntake,
} from './reelMediaIntake'
import type {ReelMediaIntakeResult} from './reelMediaIntake'
import './reel-media-desk.css'

interface Props {
  activeKit:PilotPreproductionPacket|null
}

/**
 * Local-first human editorial preview. Does not read arbitrary files,
 * call CineSwarm localhost, upload media, or generate a ParaCut project.
 */
export default function ReelMediaDesk({activeKit}:Props) {
  const [evidenceFile,setEvidenceFile]=useState<File|null>(null)
  const [videoFile,setVideoFile]=useState<File|null>(null)
  const [result,setResult]=useState<ReelMediaIntakeResult|null>(null)
  const [previewUrl,setPreviewUrl]=useState<string|null>(null)
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const urlRef=useRef<string|null>(null)
  useEffect(()=>{
    return ()=>{
      if(urlRef.current)URL.revokeObjectURL(urlRef.current)
      urlRef.current=null
    }
  },[])
  function resetPreview(){
    if(urlRef.current)URL.revokeObjectURL(urlRef.current)
    urlRef.current=null
    setPreviewUrl(null)
    setResult(null)
    setError('')
  }
  function chooseEvidence(event:ChangeEvent<HTMLInputElement>){
    const selected=event.target.files?.[0]??null
    resetPreview()
    setEvidenceFile(selected)
  }
  function chooseVideo(event:ChangeEvent<HTMLInputElement>){
    const selected=event.target.files?.[0]??null
    resetPreview()
    setVideoFile(selected)
  }
  async function inspect(){
    resetPreview()
    if(!evidenceFile||!videoFile){
      setError('Choose an evidence JSON file AND the exact CineSwarm master MP4.')
      return
    }
    if(evidenceFile.size>REEL_EVIDENCE_MAX_BYTES){
      setError('Evidence JSON exceeds 64 KiB.')
      return
    }
    if(videoFile.size>REEL_MEDIA_MAX_BYTES){
      setError('Selected MP4 exceeds the 256 MiB in-browser verification limit.')
      return
    }
    setBusy(true)
    try{
      const checked=await verifyReelMediaIntake(
        await evidenceFile.text(), videoFile, activeKit,
      )
      const url=URL.createObjectURL(videoFile)
      urlRef.current=url
      setPreviewUrl(url)
      setResult(checked)
    }catch(reason){
      setError(reason instanceof Error?reason.message:'Local media evidence inspection failed.')
    }finally{
      setBusy(false)
    }
  }

  return <section className="remd" aria-labelledby="remd-title">
    <header className="remd-head">
      <span>REEL P001 · ACTUAL MEDIA / EDITORIAL INTAKE</span>
      <h4 id="remd-title">The First Real Shot: Evidence &amp; Preview Desk</h4>
      <p>When CineSwarm has genuinely finished Shot 001, bring its existing <strong>Wan 2.1 master MP4</strong> and the <strong>separately exported local evidence JSON</strong> here. This browser hashes the MP4 bytes and compares them against the sidecar before enabling a local preview. No automatic imports, uploads, network submissions or broadcasting.</p>
    </header>
    <div className="remd-steps">
      <div>
        <b>01 · Native evidence</b>
        <p>After a real completed job, use the master artifact UUID reported by CineSwarm, then run the *separate* offline evidence exporter on your local workstation.</p>
        <code>python -m cineswarm.reel_media_evidence --data-root ./parallax-cineswarm-data --artifact-id &lt;REAL-MASTER-UUID&gt; --out reel-p001-shot-one-evidence.json</code>
        <small>No native software is installed or started by this web page.</small>
      </div>
      <div>
        <b>02 · Select both local files</b>
        <p>The JSON is a record of CineSwarm's previous checks, but it is unsigned. The MP4 itself must match the exact recorded master hash.</p>
        <label>EVIDENCE JSON
          <input type="file" accept=".json,application/json" onChange={chooseEvidence} disabled={busy}
            aria-label="Select local CineSwarm media evidence JSON"/>
        </label>
        <label>ACTUAL MASTER MP4
          <input type="file" accept=".mp4,video/mp4" onChange={chooseVideo} disabled={busy}
            aria-label="Select actual local CineSwarm master MP4 file"/>
        </label>
      </div>
      <div>
        <b>03 · Review, then edit</b>
        <p>A valid match enables a manual local preview with native browser controls. Download/import the very same master into ParaCut using ParaCut's own file picker when you're ready.</p>
        <button type="button" disabled={busy||!evidenceFile||!videoFile}
          onClick={inspect}>{busy?'Checking actual MP4 bytes…':'Verify selected MP4 against evidence'}</button>
        <small>256 MiB media limit in this browser · WebCrypto SHA-256 · no server upload</small>
      </div>
    </div>
    {error&&<p role="alert" className="remd-error">{error}</p>}
    {result&&previewUrl&&<div className="remd-result" role="status">
      <div className="remd-result-summary">
        <span>LOCAL MEDIA HASH MATCH / NO PUBLIC RELEASE</span>
        <h5>One original shot, available for human editorial review</h5>
        <p><strong>Actual selected MP4:</strong> {videoFile?.name} · {(result.mediaBytes/1048576).toFixed(2)} MiB</p>
        <p><strong>SHA-256:</strong> <code>{result.mediaHash}</code></p>
        <p><strong>Source correlation:</strong> {result.sourceMatch==='MATCHED_ACTIVE_PILOT_KIT'
          ? 'Matches the exact currently exported REEL pilot kit'
          : 'No linked pilot kit in this browser; origin is not independently authenticated'}</p>
        <p><strong>Claimed native render:</strong> {result.modelBackend} · native 832×480/16fps, scaled delivery master 1280×720/24fps</p>
        <p><strong>CineSwarm human QC record (unsigned export):</strong> {result.reviewLabel}
          {result.reviewClaimExactHash?' · Exact-hash decision recorded in sidecar':''}</p>
        {result.reviewLabel==='REJECT'&&<p className="remd-warning">This master was marked REJECT in the local evidence. Do not use it as approved footage.</p>}
        <p><strong>Rights and release:</strong> UNVERIFIED / NOT AUTHORIZED, regardless of QC review.</p>
      </div>
      <video src={previewUrl} controls playsInline preload="metadata"
        aria-label="Manually playable local master MP4 shot preview"/>
      <p>Preview only. If the browser cannot decode the codec, the hash match may still be valid. Nothing is uploaded to REEL, CineSwarm or ParaCut.</p>
      <a href="https://github.com/MichaelWave369/paracut" target="_blank"
        rel="noopener noreferrer">Open ParaCut project for manual editing ↗</a>
    </div>}
    <p className="remd-boundary"><strong>No movie has been generated by this web feature.</strong> A genuine render must have occurred separately before evidence is available. An unsigned JSON file cannot authenticate a renderer, and an MP4 hash match proves only that the chosen bytes match its digest. CineSwarm's existing exact-hash QC review is separate from the publisher's rights, music, voice consent and RCTV-channel release decisions.</p>
  </section>
}
