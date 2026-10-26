import { useState } from 'react'
import ReelCineHandoff from './ReelCineHandoff'
import ReelPilotDesk from './ReelPilotDesk'
import type { FormEvent } from 'react'
import {
  createReelPitchPacket, reelPitchFilename, reelPitchJson,
  REEL_LANES, REEL_OFFICES, REEL_REFERENCES,
} from './reelNetwork'
import type {
  ReelClaimClass, ReelFormat, ReelPitchInput, ReelPitchPacket, ReelOffice,
} from './reelNetwork'
import './reel-network.css'

const starter:ReelPitchInput={
  title:'The First Transmission',show:'REEL Originals',
  creatorCredit:'Independent creator',
  concept:'A short original pilot introducing a fictional world or a creative project, with clear labeling of synthetic scenes and human production approval.',
  format:'series',claimClass:'fiction',sourceWorld:'Original work',
}
type OfficeFilter='all'|ReelOffice['gate']
const sections:readonly {id:OfficeFilter,name:string}[]=[
  {id:'all',name:'All offices'},{id:'creative',name:'Development'},
  {id:'review',name:'Review'},{id:'production',name:'Production'},
  {id:'release',name:'Programming'},
]

function downloadText(data:string,name:string) {
  const link=document.createElement('a')
  const objectUrl=URL.createObjectURL(new Blob([data],{type:'application/json'}))
  link.href=objectUrl
  link.download=name
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(()=>URL.revokeObjectURL(objectUrl),0)
}

/**
 * REEL is a creator production planning surface, not an automatic AI workflow.
 * Rights, generation, reviews, and publishing require their own native owners.
 */
export default function ReelNetwork() {
  const [deskOpen,setDeskOpen]=useState(false)
  const [officeFilter,setOfficeFilter]=useState<OfficeFilter>('all')
  const [draft,setDraft]=useState<ReelPitchInput>(starter)
  const [packet,setPacket]=useState<ReelPitchPacket|null>(null)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const shown=REEL_OFFICES.filter((office)=>officeFilter==='all'||office.gate===officeFilter)

  function change<K extends keyof ReelPitchInput>(key:K,value:ReelPitchInput[K]) {
    setDraft((current)=>({...current,[key]:value}))
    setPacket(null)
    setError('')
    setNotice('')
  }
  function prepare(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const draftPacket=createReelPitchPacket(draft,new Date().toISOString())
      setPacket(draftPacket)
      setError('')
      setNotice('Local pitch and office work orders prepared. No AI agent ran, no media rendered, and nothing was submitted or published.')
    } catch(reason) {
      setPacket(null)
      setError(reason instanceof Error?reason.message:'Could not prepare production packet.')
    }
  }
  function loadPilotConcept(input:ReelPitchInput) {
    setDraft({...input})
    setPacket(null)
    setDeskOpen(true)
    setError('')
    setNotice('Pilot 001 concept loaded into the REEL pitch form. Human review remains pending. Prepare the separate REEL pitch only after checking the details.')
    window.requestAnimationFrame(()=>{
      document.getElementById('reel-pitch-title')?.scrollIntoView({block:'start',behavior:'smooth'})
    })
  }
  function exportPacket() {
    if(!packet)return
    downloadText(reelPitchJson(packet),reelPitchFilename(packet.pitch.title))
    setNotice('Pitch planning JSON downloaded to your browser. It is not a native CineSwarm or Parallax production plan.')
  }

  return <section className="reel-net" id="reel-network" aria-labelledby="reel-net-title">
    <div className="reel-net-hero">
      <div className="reel-net-hero-copy">
        <span className="reel-net-eyebrow">A REEL COMMONS ORIGINAL · PILOT PRODUCTION LAB</span>
        <div className="reel-net-brand" aria-label="REEL Network"><span>R</span><span>E</span><span>E</span><span>L</span><small>NETWORK</small></div>
        <h2 id="reel-net-title" tabIndex={-1}>Our shows. Our worlds. Our network.</h2>
        <p>ReelCommons discovers the world's media. <strong>REEL</strong> is the home for our own: shows, films, game reviews, music, podcasts and CineSwarm-assisted originals.</p>
        <div className="reel-net-hero-actions">
          <button type="button" onClick={()=>{setDeskOpen(true);document.getElementById('reel-pitch-title')?.scrollIntoView({block:'nearest',behavior:'smooth'})}}>◆ Enter the REEL creative floor</button>
          <a href={REEL_REFERENCES.cineswarm} target="_blank" rel="noopener noreferrer">CineSwarm source ↗</a>
        </div>
      </div>
      <div className="reel-net-studio-art" aria-hidden="true">
        <div className="reel-net-onair"><span/> PRODUCTION / NOT ON AIR</div>
        <div className="reel-net-monitor"><strong>REEL</strong><span>STUDIO CONTROL</span><i>◈</i></div>
        <div className="reel-net-monitor-row"><span>IDEA</span><span>STORY</span><span>SHOT</span><span>EDIT</span><span>REVIEW</span><span>RELEASE</span></div>
      </div>
    </div>
    <div className="reel-net-boundary">
      <strong>REEL IS THE PUBLIC NETWORK IDENTITY. PARALLAX REMAINS OUR INTERNAL CREATIVE LINEAGE.</strong>
      <p>We are not affiliated with similarly named blockchain or Web3 projects. The existing Parallax Network and CineSwarm repositories retain their historical contracts. This surface is a real local planning tool, <b>not</b> proof that autonomous agents ran or that any program is publicly on air.</p>
    </div>
    <div className="reel-net-stats" aria-label="REEL current network scope">
      <div><strong>{REEL_LANES.length}</strong><span>PROGRAMMING CONCEPTS</span></div>
      <div><strong>{REEL_OFFICES.length}</strong><span>CREATIVE OFFICE ROLES</span></div>
      <div><strong>0</strong><span>PUBLIC REEL EPISODES VERIFIED HERE</span></div>
      <div><strong>HUMAN</strong><span>FINAL RELEASE AUTHORITY</span></div>
    </div>

    <div className="reel-net-section-head">
      <div><span>01 / PROGRAMMING</span><h3>The REEL channel slate</h3><p>These are proposed network lanes, not new playable channel slots or published catalogs.</p></div>
    </div>
    <div className="reel-net-lanes">
      {REEL_LANES.map((lane)=><button type="button" key={lane.id}
        aria-pressed={draft.format===lane.id}
        onClick={()=>{change('format',lane.id);setDeskOpen(true)}}>
        <span className="reel-net-lane-top"><span aria-hidden="true">{lane.symbol}</span><small>{lane.short}</small></span>
        <strong>{lane.name}</strong>
        <p>{lane.description}</p>
        <span className="reel-net-lane-status">◌ DEVELOPMENT CONCEPT</span>
      </button>)}
    </div>
    <ReelPilotDesk onUsePitch={loadPilotConcept} />
    <div className="reel-net-section-head">
      <div><span>02 / INTEROFFICE SWARM</span><h3>The creative offices</h3><p>CineSwarm works downstream of human-owned creative direction, source review and rights gates. The office cards describe deliverables, not active agent sessions.</p></div>
      <div className="reel-net-office-tabs" role="group" aria-label="Filter creative offices">
        {sections.map((item)=><button type="button" key={item.id}
          aria-pressed={officeFilter===item.id}
          onClick={()=>setOfficeFilter(item.id)}>{item.name}</button>)}
      </div>
    </div>
    <div className="reel-net-office-grid">
      {shown.map((office)=><article className="reel-net-office" key={office.id}>
        <span>{office.gate.toUpperCase()} / PLANNED ROLE</span>
        <h4>{office.name}</h4><p>{office.description}</p>
        <small>DELIVERABLE · {office.output}</small>
      </article>)}
    </div>
    <div className="reel-net-flow">
      <span>CREATOR & RIGHTS</span><b>→</b><span>WRITERS' ROOM</span><b>→</b>
      <span>CINESWARM</span><b>→</b><span>PARACUT + WAVEFORGE</span><b>→</b>
      <span>HUMAN GATES</span><b>→</b><span>REEL PROGRAMMING</span>
    </div>

    <div className="reel-net-section-head">
      <div><span>03 / THE PRODUCTION DESK</span><h3 id="reel-pitch-title">Build a show pitch packet</h3><p>Plan an episode and generate office work orders you can export. The packet stays inside this browser session until you download it.</p></div>
      <button type="button" aria-expanded={deskOpen} aria-controls="reel-net-pitch-desk"
        onClick={()=>setDeskOpen((v)=>!v)}>{deskOpen?'− Close pitch desk':'＋ Open pitch desk'}</button>
    </div>
    {deskOpen&&<div className="reel-net-pitch" id="reel-net-pitch-desk">
      <form onSubmit={prepare}>
        <div className="reel-net-pitch-grid">
          <label>PRODUCTION LANE
            <select value={draft.format} onChange={(e)=>change('format',e.target.value as ReelFormat)}>
              {REEL_LANES.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label>CONTENT CLASS
            <select value={draft.claimClass} onChange={(e)=>change('claimClass',e.target.value as ReelClaimClass)}>
              <option value="fiction">Fiction</option>
              <option value="opinion">Opinion / review</option>
              <option value="documentary">Documentary / factual</option>
              <option value="educational">Educational</option>
              <option value="symbolic">Symbolic / experimental</option>
            </select>
          </label>
          <label>SHOW / SERIES
            <input type="text" required maxLength={100} value={draft.show}
              onChange={(e)=>change('show',e.target.value)} />
          </label>
          <label>EPISODE OR PROJECT TITLE
            <input type="text" required maxLength={120} value={draft.title}
              onChange={(e)=>change('title',e.target.value)} />
          </label>
          <label>CREATOR CREDIT
            <input type="text" required maxLength={100} value={draft.creatorCredit}
              onChange={(e)=>change('creatorCredit',e.target.value)} />
          </label>
          <label>SOURCE WORLD / ORIGINAL IP
            <input type="text" maxLength={160} value={draft.sourceWorld}
              onChange={(e)=>change('sourceWorld',e.target.value)} />
          </label>
        </div>
        <label>THE CREATIVE CONCEPT
          <textarea required rows={5} maxLength={1200} value={draft.concept}
            onChange={(e)=>change('concept',e.target.value)} />
        </label>
        <button type="submit" className="reel-net-create">◇ Prepare local office work orders</button>
      </form>
      {error&&<p role="alert" className="reel-net-error">{error}</p>}
      {packet&&<div className="reel-net-packet" role="status">
        <div><span>PREPARED · UNREVIEWED DRAFT</span><h4>{packet.pitch.show}: {packet.pitch.title}</h4>
          <p>{packet.workOrders.length} proposed office tasks generated from checked-in roles. None have executed, rendered, passed rights review, or been scheduled.</p></div>
        <button type="button" onClick={exportPacket}>↓ Download REEL pitch JSON</button>
        <p>Receipt status: none · rights unverified · claims not audited · human approval pending · no channel assigned. This is not a CineSwarm native production plan or publish authorization.</p>
      </div>}
      {notice&&<p role="status" className="reel-net-notice">{notice}</p>}
    </div>}
    <ReelCineHandoff key={packet?.createdUtc??'no-current-pitch'} currentPitch={packet} />
    <div className="reel-net-links">
      <h3>Production roots / existing engines</h3>
      <div>
        <a href={REEL_REFERENCES.legacyNetwork} target="_blank" rel="noopener noreferrer"><b>Legacy Network</b><span>Original shows, rights and creator-swarm blueprint</span></a>
        <a href={REEL_REFERENCES.cineswarm} target="_blank" rel="noopener noreferrer"><b>CineSwarm</b><span>Local-first governed production engine</span></a>
        <a href={REEL_REFERENCES.paracut} target="_blank" rel="noopener noreferrer"><b>ParaCut</b><span>Editing, titles, render plans</span></a>
        <a href={REEL_REFERENCES.waveforge} target="_blank" rel="noopener noreferrer"><b>WaveForgeStudio</b><span>Verified creative handoff and release references</span></a>
        <a href={REEL_REFERENCES.phibox} target="_blank" rel="noopener noreferrer"><b>PhiBox</b><span>Original music and sound-production tools</span></a>
      </div>
      <p>Keep the first 50 official RCTV channels untouched. Real REEL Originals slots would be appended only after media hosting, source rights, AI disclosures, human review and code-approved publication. GitHub Pages alone is not a broadcast relay.</p>
    </div>
  </section>
}
