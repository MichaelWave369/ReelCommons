import {useState} from 'react'
import type {ChangeEvent} from 'react'
import type {PilotPreproductionPacket} from './reelPilot'
import {
  inspectLaunchpadJson,REEL_LAUNCHPAD_MAX_BYTES,
} from './reelLaunchpadReport'
import type {LaunchpadResult} from './reelLaunchpadReport'
import './reel-launchpad.css'

interface Props {activeKit:PilotPreproductionPacket|null}

/** Browser-local diagnostic viewer. Never communicates with a user's GPU. */
export default function ReelWindowsLaunchpad({activeKit}:Props){
  const [result,setResult]=useState<LaunchpadResult|null>(null)
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  async function inspect(event:ChangeEvent<HTMLInputElement>){
    const file=event.currentTarget.files?.[0]
    event.currentTarget.value=''
    setResult(null)
    setError('')
    if(!file)return
    if(file.size>REEL_LAUNCHPAD_MAX_BYTES){
      setError('Report rejected: the selected file exceeds 128 KiB.')
      return
    }
    setBusy(true)
    try{
      const report=await inspectLaunchpadJson(await file.text(),activeKit)
      setResult(report)
    }catch(reason){
      setError(reason instanceof Error?reason.message:'REEL could not read this local diagnostic.')
    }finally{setBusy(false)}
  }
  return <section className="rlp" aria-labelledby="rlp-title">
    <header className="rlp-head">
      <span>REEL ORIGINALS / P001 / GPU READINESS CONSOLE</span>
      <h4 id="rlp-title">Windows Launchpad · What's blocking our first render?</h4>
      <p>Inspect your real computer's preparation for <strong>The Unlit Screen</strong>.
        The Windows diagnostic runs locally in a CineSwarm checkout. This website
        only reads the JSON you explicitly select. It can't see your hardware or run video generation.</p>
    </header>
    <div className="rlp-workflow">
      <article>
        <strong>01 · Export REEL's pilot</strong>
        <p>Use <b>Download preproduction JSON</b> above. Keep that file on your computer so
          CineSwarm can match its exact original eight-scene storyboard.</p>
        <small>{activeKit?'PILOT EXPORTED THIS BROWSER VISIT':'NO CURRENT PILOT EXPORT · LOCAL DIAGNOSTICS STILL ACCEPTED'}</small>
      </article>
      <article>
        <strong>02 · Run the local Launchpad</strong>
        <p>In a local <a href="https://github.com/MichaelWave369/CineSwarm" target="_blank"
          rel="noopener noreferrer">CineSwarm checkout</a>, open PowerShell and run:</p>
        <code>.\tools\REEL-Launchpad.ps1 -SaveReport</code>
        <p>To explicitly inspect checkpoint bytes and PyTorch CUDA visibility, use:</p>
        <code>.\tools\REEL-Launchpad.ps1 -CheckModelHash -ProbeTorch -SaveReport</code>
        <small>Neither command downloads models or starts a render. A local checkout and Python are required.</small>
      </article>
      <article>
        <strong>03 · Inspect the returned file</strong>
        <p>Select the new diagnostic JSON from Downloads. REEL checks its structure,
          reported resource limits and any current pilot-kit hash match.</p>
        <label className="rlp-import">LOCAL REEL DIAGNOSTIC JSON
          <input type="file" accept=".json,application/json" disabled={busy}
            aria-label="Choose local REEL Windows Launchpad diagnostic JSON"
            onChange={inspect}/>
        </label>
        <small>No uploads, tokens, localhost calls, GPU access or remote execution.</small>
      </article>
    </div>
    {error&&<p role="alert" className="rlp-error">{error}</p>}
    {result&&<div className="rlp-results" role="status">
      <div className="rlp-results-heading">
        <span>READ-ONLY LOCAL FILE / UNSIGNED DIAGNOSTICS</span>
        <h5>{result.summary==='LOCAL_CHECKS_REPORTED_PASSED'
          ?'Technical checks reported passed. Human review still required.'
          :'Production prerequisites are incomplete or not fully observed.'}</h5>
        <p><strong>Source correlation:</strong> {result.source==='MATCHED_CURRENT_PILOT_KIT'
          ? 'Diagnostic refers to the exact pilot kit exported during this visit'
          : 'This report is not linked to the current browser pilot kit. Its origin is not authenticated.'}</p>
      </div>
      <div className="rlp-stats">
        <div><b>{(result.freeSingleGpuMiB/1024).toFixed(1)} GiB</b><small>Most free VRAM on ONE GPU</small></div>
        <div><b>{(result.freeRamMiB/1024).toFixed(1)} GiB</b><small>Available system RAM</small></div>
        <div><b>{(result.freeDiskMiB/1024).toFixed(1)} GiB</b><small>Free local disk</small></div>
      </div>
      <h6>Reported workstation checklist</h6>
      <div className="rlp-checklist">
        {result.steps.map(item=><div key={item.id} className="rlp-check">
          <div>
            <strong>{item.label}</strong>
            <span className={'rlp-state rlp-'+item.state}>
              {item.state==='ready'?'REPORTED OK':
                item.state==='not-checked'?'NOT CHECKED':'NEEDS ATTENTION'}
            </span>
          </div>
          {item.state!=='ready'&&<p>{item.instruction}</p>}
        </div>)}
      </div>
      <div className="rlp-next">
        <strong>First recommended action</strong>
        <p>{result.firstAction}</p>
      </div>
      {result.planHash&&<details className="rlp-plan">
        <summary>Show locally reported first-shot production plan hash</summary>
        <code>{result.planHash}</code>
        <p>This is the source-bound candidate hash, not a production authorization or signed receipt.
          Only you can explicitly approve a future local render after reviewing the model license and workload.</p>
      </details>}
      <p className="rlp-privacy">The report can contain local file paths and NVIDIA device data,
        though this page intentionally does not display those paths. Review the downloaded JSON
        before sharing it. Its claims are editable and unsigned, even when every technical status says passed.</p>
    </div>}
    <div className="rlp-end">
      <strong>What happens after the checks?</strong>
      <p>Review the native <code>reel_render_session</code> guide and use its explicit human-approved
        one-shot command on your own PC. A successful real render provides the MP4 and evidence
        files for the REEL preview and ParaCut import desks below. No original episode
        or RCTV channel is published automatically.</p>
      <a href="https://github.com/MichaelWave369/CineSwarm/blob/main/docs/REEL_P001_WINDOWS_LAUNCHPAD.md"
        target="_blank" rel="noopener noreferrer">Windows setup and actual native-render instructions ↗</a>
    </div>
  </section>
}
