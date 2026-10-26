import {useState} from 'react'
import ReelFirstShotHandoff from './ReelFirstShotHandoff'
import ReelMediaDesk from './ReelMediaDesk'
import {
  pilotMarkdown,pilotPreproductionPacket,pilotShotsCsv,
  pilotSrt,pilotTimecode,REEL_PILOT_DURATION,REEL_PILOT_GATES,
  REEL_PILOT_PITCH,REEL_PILOT_SHOTS,
} from './reelPilot'
import type {ReelPitchInput} from './reelNetwork'
import type {PilotPreproductionPacket} from './reelPilot'
import './reel-pilot.css'

interface Props {
  onUsePitch:(input:ReelPitchInput)=>void
}
function saveText(text:string,filename:string,mimeType:string) {
  const url=URL.createObjectURL(new Blob([text],{type:mimeType}))
  const anchor=document.createElement('a')
  anchor.href=url
  anchor.download=filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(()=>URL.revokeObjectURL(url),0)
}

/** Preproduction interactive storyboard. No native model calls, media or publishing. */
export default function ReelPilotDesk({onUsePitch}:Props) {
  const [activeId,setActiveId]=useState(REEL_PILOT_SHOTS[0].id)
  const [producerNotes,setProducerNotes]=useState('')
  const [preparedKit,setPreparedKit]=useState<PilotPreproductionPacket|null>(null)
  const [reviewed,setReviewed]=useState<string[]>([])
  const [status,setStatus]=useState('')
  const [scriptVisible,setScriptVisible]=useState(false)
  const selected=REEL_PILOT_SHOTS.find(s=>s.id===activeId)??REEL_PILOT_SHOTS[0]

  function exportDraft() {
    try {
      const packet=pilotPreproductionPacket(new Date().toISOString(),producerNotes)
      setPreparedKit(packet)
      saveText(JSON.stringify(packet,null,2),'reel-p001-preproduction.json','application/json')
      setStatus('Draft preproduction packet downloaded. All eight release gates remain NOT REVIEWED in the packet, regardless of local checklist marks.')
    }catch(error) {
      setStatus(error instanceof Error?error.message:'Could not export draft.')
    }
  }
  function usePitch() {
    onUsePitch(REEL_PILOT_PITCH)
    setStatus('Pilot idea transferred to the REEL pitch form. Prepare and download its separate CineSwarm-compatible REEL pitch for the test-only native validation step.')
  }
  function toggleGate(id:string) {
    setReviewed((list)=>list.includes(id)?list.filter(value=>value!==id):[...list,id])
    setStatus('Local checklist mark updated for personal planning only. No rights, editorial or release approval was granted.')
  }

  return <section className="rpilot" aria-labelledby="rpilot-title">
    <div className="rpilot-hero">
      <div>
        <span className="rpilot-kicker">REEL ORIGINALS / PILOT 001 / IN DEVELOPMENT</span>
        <h3 id="rpilot-title">The First Transmission</h3>
        <p className="rpilot-intro">Before the first REEL channel goes on air, we give it a story worth making. Eight original cinematic beats introduce new worlds, human creativity, responsible AI assistance and a network built around transparent credits.</p>
        <div className="rpilot-tags">
          <span>FICTION / SYMBOLIC</span><span>74-SECOND PROPOSED CUT</span>
          <span>8 ORIGINAL SHOTS</span><span>UNREVIEWED · NOT RENDERED</span>
        </div>
        <div className="rpilot-actions">
          <button type="button" onClick={usePitch}>◈ Send concept to REEL Pitch Desk</button>
          <button type="button" onClick={()=>saveText(pilotMarkdown(),'reel-p001-script.md','text/markdown')}>↓ Download script</button>
          <button type="button" onClick={()=>saveText(pilotSrt(),'reel-p001-captions.srt','text/plain')}>↓ Download captions</button>
        </div>
      </div>
      <div className="rpilot-art" aria-hidden="true">
        <div className="rpilot-art-glow"/>
        <div className="rpilot-frame"><span>01</span><strong>REEL</strong><small>THE FIRST TRANSMISSION</small></div>
        <div className="rpilot-art-label">STORYBOARD PREVIEW / NO VIDEO PRODUCED</div>
      </div>
    </div>
    <div className="rpilot-progress">
      <div><strong>SCREENPLAY</strong><span>DRAFT READY</span></div>
      <div><strong>STORYBOARD</strong><span>8 SHOTS PLANNED</span></div>
      <div><strong>CINESWARM</strong><span>NO REAL RENDER SUBMITTED</span></div>
      <div><strong>REEL CHANNEL</strong><span>NOT PUBLISHED</span></div>
    </div>
    <div className="rpilot-headline">
      <div><span>01 / SHOT-BY-SHOT PREPRODUCTION</span><h4>Director's storyboard</h4>
        <p>Each panel is authored production direction, not AI output or a video thumbnail.</p></div>
      <span className="rpilot-total">{pilotTimecode(REEL_PILOT_DURATION)} PROPOSED</span>
    </div>
    <div className="rpilot-workspace">
      <div className="rpilot-shotlist" role="group" aria-label="Select pilot storyboard shot">
        {REEL_PILOT_SHOTS.map((s,index)=><button type="button" key={s.id}
          onClick={()=>setActiveId(s.id)} aria-pressed={activeId===s.id}
          className={activeId===s.id?'rpilot-current':''}>
          <span className="rpilot-num">SHOT {String(index+1).padStart(2,'0')}</span>
          <span className="rpilot-shot-name">{s.name}</span>
          <span className="rpilot-time">{pilotTimecode(s.startSeconds)} · {s.durationSeconds}s</span>
        </button>)}
      </div>
      <article className="rpilot-shot-detail" aria-live="polite">
        <div className="rpilot-detail-top"><span>{selected.id} · {pilotTimecode(selected.startSeconds)}–{pilotTimecode(selected.startSeconds+selected.durationSeconds)}</span><b>PROPOSED SHOT</b></div>
        <h5>{selected.name}</h5>
        <p className="rpilot-intent">{selected.purpose}</p>
        <blockquote>{selected.voiceover}</blockquote>
        <div className="rpilot-detail-grid">
          <div><strong>CAMERA</strong><p>{selected.camera}</p></div>
          <div><strong>SOUND / PHIBOX</strong><p>{selected.musicAndSound}</p></div>
          <div><strong>POST / PARACUT</strong><p>{selected.transition}</p></div>
          <div><strong>RIGHTS NOTE</strong><p>{selected.rightsNote}</p></div>
        </div>
        <details>
          <summary>Show original CineSwarm visual direction prompt</summary>
          <p>{selected.imagePrompt}</p>
          <small>Reference creative text only. No model/provider or GPU workflow is selected; nothing has rendered.</small>
        </details>
      </article>
    </div>
    <div className="rpilot-headline">
      <div><span>02 / EDITORIAL</span><h4>Script and subtitle tools</h4>
        <p>The narration below is original draft dialogue, not recorded audio.</p></div>
      <button type="button" aria-expanded={scriptVisible} onClick={()=>setScriptVisible(!scriptVisible)}>
        {scriptVisible?'− Hide full narration':'＋ Read full narration'}
      </button>
    </div>
    {scriptVisible&&<div className="rpilot-script">
      {REEL_PILOT_SHOTS.map(s=><p key={s.id}><span>{pilotTimecode(s.startSeconds)}</span><strong>{s.voiceover}</strong></p>)}
    </div>}
    <div className="rpilot-headline">
      <div><span>03 / REVIEW GATES</span><h4>Human production checklist</h4>
        <p>These marks are personal planning reminders. They do not create approvals, copyright clearance or authenticated review records.</p></div>
    </div>
    <div className="rpilot-gates">
      {REEL_PILOT_GATES.map(g=><label key={g.id}>
        <input type="checkbox" checked={reviewed.includes(g.id)}
          onChange={()=>toggleGate(g.id)}/>
        <span><strong>{g.label}</strong><small>{g.reviewerRole}: {g.acceptanceCriterion}</small></span>
      </label>)}
    </div>
    <div className="rpilot-export">
      <div>
        <h4>04 / Export production materials</h4>
        <p>Your script, subtitle timing and storyboard are ready to review. No release receipt, native production plan, finished video or approved channel is part of these downloads.</p>
        <label>PRODUCER NOTES · LOCAL TO THIS VISIT
          <textarea rows={3} maxLength={2000} value={producerNotes}
            placeholder="Creative revisions, visual continuity, sound cues and concerns…"
            onChange={event=>{setProducerNotes(event.target.value);setPreparedKit(null)}}/>
        </label>
      </div>
      <div className="rpilot-export-buttons">
        <button type="button" onClick={exportDraft}>↓ Download preproduction JSON</button>
        <button type="button" onClick={()=>saveText(pilotShotsCsv(),'reel-p001-shots.csv','text/csv')}>↓ Download shot list CSV</button>
        <button type="button" onClick={()=>saveText(pilotMarkdown(),'reel-p001-script.md','text/markdown')}>↓ Download full script</button>
        <button type="button" onClick={()=>saveText(pilotSrt(),'reel-p001-captions.srt','text/plain')}>↓ Download subtitle timing</button>
      </div>
    </div>
    {status&&<p className="rpilot-status" role="status">{status}</p>}
    <ReelFirstShotHandoff key={preparedKit?.createdUtc??'no-kit'} preparedKit={preparedKit} />
    <ReelMediaDesk key={preparedKit?.createdUtc??'no-kit'} activeKit={preparedKit} />
    <p className="rpilot-disclaimer">Historically inspired by the original network roadmap's “Welcome to Parallax Network” pilot concept. This is a <strong>new REEL script</strong>, not recovered original scenes or assets. Production must pass independent CineSwarm model/runtime qualification, genuine shot review, credit and rights verification, ParaCut finishing, and human publication approval before any program appears on RCTV. No external media automatically loads.</p>
  </section>
}
