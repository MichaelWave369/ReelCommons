/**
 * REEL Originals Pilot 001: original scripted PREPRODUCTION materials.
 * Inspired by the historical Parallax Network launch-pilot concept.
 * NOT an existing rendered film, native CineSwarm plan, licensed release,
 * published RCTV channel, authenticated rights receipt, or budget approval.
 */
import type {ReelPitchInput} from './reelNetwork'

export const REEL_PILOT_SCHEMA='REEL_ORIGINAL_PILOT_PREPRODUCTION_V1' as const
export const REEL_PILOT_STATUS='PREPRODUCTION_DRAFT_NOT_RENDERED' as const

export interface PilotShot {
  id:string
  startSeconds:number
  durationSeconds:number
  name:string
  purpose:string
  camera:string
  imagePrompt:string
  voiceover:string
  musicAndSound:string
  transition:string
  rightsNote:string
}
export interface PilotReviewGate {
  id:'creative'|'sources'|'voices'|'music'|'claims'|'models'|'editorial'|'release'
  label:string
  reviewerRole:string
  acceptanceCriterion:string
}
export interface PilotPreproductionPacket {
  schema:typeof REEL_PILOT_SCHEMA
  id:'REEL-P001'
  title:string
  show:'REEL Originals'
  contentClass:'fiction'
  legacyInspiration:string
  status:typeof REEL_PILOT_STATUS
  createdUtc:string
  pilotDurationSeconds:number
  disclosure:string
  concept:string
  credits:{
    creativeDirection:'human review pending'
    narrationArtist:'unassigned'
    musicAuthor:'unassigned'
    visualAssets:'uncreated'
  }
  shots:PilotShot[]
  reviewGates:{
    id:PilotReviewGate['id']
    label:string
    status:'not_reviewed'
    releaseAuthority:false
  }[]
  authority:{
    aiAgentsExecuted:false
    assetsRendered:false
    visualQCCompleted:false
    provenanceReceiptIssued:false
    rightsVerified:false
    humanReleaseAuthorized:false
    published:false
    rctvChannelAssigned:false
    cineSwarmPlanSubmitted:false
  }
  handoff:{
    existingPitchSchema:'REEL_NETWORK_PITCH_PACKET_V1'
    thisPackageIsNativeCineSwarmPlan:false
    recommendedTools:string[]
    nextStep:string
  }
}

/** Shot times describe *proposed edit* seconds, not measured produced footage. */
export const REEL_PILOT_SHOTS: readonly PilotShot[]=[
  {
    id:'P001-S01',startSeconds:0,durationSeconds:8,
    name:'The Unlit Screen',
    purpose:'Start in creative uncertainty; no borrowed footage.',
    camera:'Hold on black, then a restrained push into a single glowing point.',
    imagePrompt:'Original abstract cinematic scene. Almost-black empty theatre screen with one warm luminous point appearing center frame, slowly unfolding into a small field of light. Rich textured darkness, restrained film grain, high contrast, no text, no logos, no faces, no known fictional IP, subtle camera push.',
    voiceover:'Every story begins somewhere. Sometimes, with a single question.',
    musicAndSound:'Near silence; one softly pulsing synthesized note. No licensed samples.',
    transition:'Match light point into the next frame.',
    rightsNote:'Generate original abstract imagery and original synth audio; no stock footage assumed.',
  },
  {
    id:'P001-S02',startSeconds:8,durationSeconds:9,
    name:'Many Doors',
    purpose:'Introduce the network as an invitation into creator-owned worlds.',
    camera:'Slow lateral dolly across luminous rectangular portals.',
    imagePrompt:'An original impossible corridor of suspended picture-frame portals, each displaying abstract new unrecognizable landscapes: geometric blue desert, floating paper city, deep teal ocean of stars. Cinematic lateral dolly, elegant volumetric light, no existing film references, no actors, no trademarks, no text.',
    voiceover:'A question becomes a door. Behind every door, another world.',
    musicAndSound:'A rising three-note motif; delicate bell textures synthesized from scratch.',
    transition:'One bright portal becomes a script page.',
    rightsNote:'All worlds are new visual concepts; no recognizable franchise locations or characters.',
  },
  {
    id:'P001-S03',startSeconds:17,durationSeconds:10,
    name:'The Writers’ Room',
    purpose:'Present human story and design as the origin of creative work.',
    camera:'Overhead orbit above symbolic sketches, story beats and floating lines.',
    imagePrompt:'Symbolic original writers room: blank paper sheets, neutral pencil sketches, colored index cards with no legible words, animated connecting threads, a warm desk lamp illuminating a geometric story map. Macro cinematic overhead orbit, no real person, no readable copyrighted script, no logos.',
    voiceover:'Someone imagines a beginning. Someone gives it a voice. Together, we find its shape.',
    musicAndSound:'Soft finger percussion and original layered keys, leaving space for narration.',
    transition:'A pencil line becomes a sound waveform.',
    rightsNote:'Created props and placeholder pages only; review any visible text for accidental marks.',
  },
  {
    id:'P001-S04',startSeconds:27,durationSeconds:9,
    name:'Give It a Pulse',
    purpose:'Link sound design, music and maker tools to the narrative.',
    camera:'Glide through stylized original mixing controls and animated light waves.',
    imagePrompt:'Original music-production dreamscape: oscillating teal soundwaves, glass-like knobs and sliders, pulsing amber equalizer towers merging into a kaleidoscopic abstract visual rhythm. Cinematic tracking movement, no depiction of trademarked DAWs, brands or device UIs, no text.',
    voiceover:'A musician gives it rhythm. A builder gives it motion.',
    musicAndSound:'Introduce wholly original synth bass groove with soft kick; avoid existing songs or samples.',
    transition:'Waveform resolves into tiny shifting light points.',
    rightsNote:'Audio must be recorded/composed fresh or otherwise explicitly licensed before release.',
  },
  {
    id:'P001-S05',startSeconds:36,durationSeconds:11,
    name:'The Helpful Machine',
    purpose:'Show AI as an assistant rather than the editorial decision maker.',
    camera:'A gentle crane above a luminous desk of abstract work tiles.',
    imagePrompt:'Futuristic original creative workspace filled with hovering translucent scene cards, abstract synthetic composition tiles and a warm human-sized lamp at the control desk. One empty director chair; no real faces, no robotic sentient-character claim, no third-party trademarks. Slow cinematic crane, dusky gold and ocean teal.',
    voiceover:'Machines can help us make more. But the choices, the care, and the responsibility still belong to us.',
    musicAndSound:'Original warm chord swell over returning three-note motif; avoid synthetic impersonations.',
    transition:'A bright scene card folds into a translucent provenance ledger.',
    rightsNote:'AI assistance must be disclosed honestly in the eventual content receipt.',
  },
  {
    id:'P001-S06',startSeconds:47,durationSeconds:10,
    name:'Receipts in the Light',
    purpose:'Communicate provenance, rights and uncertainty without claiming certification.',
    camera:'Circular track around abstract transparent ledger panes.',
    imagePrompt:'An original abstract provenance metaphor: glowing translucent blank record cards connected by precise geometric light filaments. No readable claims, no counterfeit verification seals, no badges claiming approval, no institutional logos. Moody studio light, patient circular camera tracking.',
    voiceover:'We keep the sources close. We credit the hands behind the work. And we leave room to say what we do not know.',
    musicAndSound:'Drop percussion; intimate narration with a low steady synthesized pad.',
    transition:'Ledger lines form the contours of a new theatre.',
    rightsNote:'Display only symbolic record shapes, not fictional proof of a completed rights audit.',
  },
  {
    id:'P001-S07',startSeconds:57,durationSeconds:9,
    name:'The Commons Opens',
    purpose:'Invite collaboration across stories, audio, games and film.',
    camera:'Crane backward, revealing an open-air cinema of abstract creator worlds.',
    imagePrompt:'Original surreal open-air cinema at twilight built of softly glowing geometric arches, showing several self-created abstract visual worlds on blank floating screens. Inclusive human scale without showing identifiable people, no branded imagery or third-party fictional IP. Elegant slow crane backward, luminous clouds, emotionally hopeful.',
    voiceover:'Not one voice. Not one world. A commons for stories worth making together.',
    musicAndSound:'Original full motif, synth bass, luminous pads, gentle live-played percussion.',
    transition:'Fade naturally toward monochrome and a final wordmark placeholder.',
    rightsNote:'Do not insert existing creator worlds without explicit owner approval and credit.',
  },
  {
    id:'P001-S08',startSeconds:66,durationSeconds:8,
    name:'The First Transmission',
    purpose:'Conclude with an original network identity rather than a finished-broadcast claim.',
    camera:'Hold centered on a clean, originally designed title treatment.',
    imagePrompt:'Original abstract cinematic title-card environment: dark evergreen background with a subtle warm radial glow, four empty luminous rectangular panels aligning into a single central panel. Do not render text with the generative model; REEL wordmark and caption are added later by a human editor in ParaCut. Stable lockoff, no brands or other network marks.',
    voiceover:'Welcome to REEL. Our stories. Our worlds. Our network.',
    musicAndSound:'Resolve original three-note motif. Leave a clean final second for logo and silence.',
    transition:'Cut to black. Add any title text in verified postproduction, not the video generator.',
    rightsNote:'REEL public name and final marks need ordinary branding/rights review.',
  },
] as const

export const REEL_PILOT_GATES:readonly PilotReviewGate[]=[
  {id:'creative',label:'Creative direction',reviewerRole:'Human showrunner',
    acceptanceCriterion:'Confirm pilot concept, narrative, pacing and all eight story beats.'},
  {id:'sources',label:'World and visual rights',reviewerRole:'Rights reviewer',
    acceptanceCriterion:'Confirm each proposed image/video asset is original or properly cleared.'},
  {id:'voices',label:'Voice and likeness consent',reviewerRole:'Narration reviewer',
    acceptanceCriterion:'Use a consenting original narrator; do not clone a real person without authorization.'},
  {id:'music',label:'Original music and sound',reviewerRole:'Music rights reviewer',
    acceptanceCriterion:'Document original stems or licensed music, samples and sound effects.'},
  {id:'claims',label:'Disclosure and claim posture',reviewerRole:'Editorial / claim reviewer',
    acceptanceCriterion:'Mark synthetic scenes as fictional and factual statements as attributable or opinion.'},
  {id:'models',label:'Model and hardware qualification',reviewerRole:'CineSwarm operator',
    acceptanceCriterion:'Record approved model licenses, backend, checkpoint hashes, runtime resources and generation plan.'},
  {id:'editorial',label:'Rendered media and QC',reviewerRole:'Human editor',
    acceptanceCriterion:'Inspect actual clips, captions, audio intelligibility, credits and exact artifact hashes.'},
  {id:'release',label:'Publisher release and host',reviewerRole:'Authorized publisher',
    acceptanceCriterion:'Approve actual completed assets, rights receipts, source destination and distribution separately.'},
] as const

export const REEL_PILOT_PITCH:ReelPitchInput={
  show:'REEL Originals',
  title:'The First Transmission',
  creatorCredit:'Independent creator',
  format:'series',
  claimClass:'fiction',
  sourceWorld:'Original REEL network identity',
  concept:'A 74-second cinematic introductory short: from a single question to a new commons for creator-owned worlds. Eight original fictional scenes celebrate human-directed storytelling, music, AI-assisted production and visible provenance, ending with the REEL identity. This is a draft for rights and editorial review, not a released film.',
}
export const REEL_PILOT_DURATION=74

export function validatePilotTimeline(shots:readonly PilotShot[]=REEL_PILOT_SHOTS):boolean {
  if(!shots.length||shots.length>100)return false
  let expected=0
  const seen=new Set<string>()
  for(const shot of shots){
    if(!/^P001-S\d{2}$/.test(shot.id)||seen.has(shot.id)||
      !Number.isInteger(shot.startSeconds)||!Number.isInteger(shot.durationSeconds)||
      shot.startSeconds!==expected||shot.durationSeconds<=0||shot.durationSeconds>60||
      !shot.imagePrompt||shot.imagePrompt.length>20000||
      !shot.voiceover||shot.voiceover.length>2000){
      return false
    }
    seen.add(shot.id)
    expected+=shot.durationSeconds
  }
  return expected===REEL_PILOT_DURATION
}
export function pilotTimecode(seconds:number,sep=':'):string {
  if(!Number.isInteger(seconds)||seconds<0||seconds>36000)throw new Error('Invalid timecode')
  const h=String(Math.floor(seconds/3600)).padStart(2,'0')
  const m=String(Math.floor(seconds%3600/60)).padStart(2,'0')
  const s=String(seconds%60).padStart(2,'0')
  return h+sep+m+sep+s
}
export function pilotSrt():string {
  if(!validatePilotTimeline())throw new Error('Pilot timeline validation failed')
  return REEL_PILOT_SHOTS.map((s,i)=>[
    String(i+1),
    pilotTimecode(s.startSeconds)+',000 --> '+
      pilotTimecode(s.startSeconds+s.durationSeconds)+',000',
    s.voiceover,
  ].join('\n')).join('\n\n')+'\n'
}
export function pilotMarkdown():string {
  if(!validatePilotTimeline())throw new Error('Pilot timeline validation failed')
  const header=[
    '# REEL Originals · Pilot 001: The First Transmission',
    '',
    '**Status:** Original preproduction draft, not rendered, rights unreviewed, not on air.',
    '**Run time:** Proposed 74 seconds · Fictional/symbolic imagery · Eight shots.',
    '**Historic inspiration:** Old network roadmap Pilot 001, “Welcome to Parallax Network.” This is a NEW REEL adaptation, not recovered production footage.',
    '**AI disclosure:** Planned AI-assisted abstract visual concepts; final actual tool use requires an updated content receipt.',
    '',
    '## Script and shot direction',
  ]
  const scenes=REEL_PILOT_SHOTS.flatMap((shot)=>[
    '',
    '### '+shot.id+' · '+pilotTimecode(shot.startSeconds)+
      '–'+pilotTimecode(shot.startSeconds+shot.durationSeconds)+' · '+shot.name,
    '',
    '**Narration:** '+shot.voiceover,
    '',
    '**Purpose:** '+shot.purpose,
    '',
    '**Camera:** '+shot.camera,
    '',
    '**Visual / shot prompt:** '+shot.imagePrompt,
    '',
    '**Music & sound:** '+shot.musicAndSound,
    '',
    '**Transition:** '+shot.transition,
    '',
    '**Rights notes:** '+shot.rightsNote,
  ])
  const gates=['','## Human release checklist','',
    ...REEL_PILOT_GATES.map((g)=>'- [ ] '+g.label+' · '+g.reviewerRole+': '+g.acceptanceCriterion),
    '',
    '**Not a native CineSwarm production plan.** Each proposed shot requires a separate authorized native plan, qualified real backend and human review. No script or checkbox here authorizes GPU execution, copyright clearance, publication or an RCTV channel.',
    '',
  ]
  return [...header,...scenes,...gates].join('\n')
}
export function pilotShotsCsv():string {
  if(!validatePilotTimeline())throw new Error('Pilot timeline validation failed')
  const keys:(keyof PilotShot)[]=[
    'id','startSeconds','durationSeconds','name','purpose','camera',
    'imagePrompt','voiceover','musicAndSound','transition','rightsNote',
  ]
  function quoted(value:string|number):string {
    // CSV for spreadsheet review. Prefix data that could be evaluated as formula
    // even if a future editable shot uses unsafe text.
    let text=String(value)
    if(/^[\s]*[=+\-@\t\r\n]/.test(text))text="'"+text
    return '"'+text.replace(/"/g,'""')+'"'
  }
  return [keys.map(quoted).join(','),
    ...REEL_PILOT_SHOTS.map(shot=>keys.map(key=>quoted(shot[key])).join(',')),
  ].join('\r\n')+'\r\n'
}
export function pilotPreproductionPacket(
  createdUtc:string, localNotes:string='',
):PilotPreproductionPacket {
  if(!validatePilotTimeline())throw new Error('Pilot timeline validation failed')
  if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(createdUtc)||
      !Number.isFinite(Date.parse(createdUtc)))throw new Error('Invalid explicit UTC date')
  if(typeof localNotes!=='string'||localNotes.length>2000)
    throw new Error('Production notes exceed the local export limit')
  return {
    schema:REEL_PILOT_SCHEMA,id:'REEL-P001',
    title:REEL_PILOT_PITCH.title,show:'REEL Originals',
    contentClass:'fiction',
    legacyInspiration:'Historic Parallax Network roadmap Pilot 001: Welcome to Parallax Network. Newly authored REEL adaptation, not inherited finished media.',
    status:REEL_PILOT_STATUS,
    createdUtc,pilotDurationSeconds:REEL_PILOT_DURATION,
    disclosure:'Proposed AI-assisted fictional/symbolic visuals. Real media production and exact AI tool use have not been verified.',
    concept:REEL_PILOT_PITCH.concept,
    credits:{
      creativeDirection:'human review pending',
      narrationArtist:'unassigned',musicAuthor:'unassigned',
      visualAssets:'uncreated',
    },
    shots:REEL_PILOT_SHOTS.map(s=>({...s})),
    reviewGates:REEL_PILOT_GATES.map(g=>({
      id:g.id,label:g.label,status:'not_reviewed' as const,
      releaseAuthority:false as const,
    })),
    authority:{
      aiAgentsExecuted:false,assetsRendered:false,
      visualQCCompleted:false,provenanceReceiptIssued:false,
      rightsVerified:false,humanReleaseAuthorized:false,
      published:false,rctvChannelAssigned:false,cineSwarmPlanSubmitted:false,
    },
    handoff:{
      existingPitchSchema:'REEL_NETWORK_PITCH_PACKET_V1',
      thisPackageIsNativeCineSwarmPlan:false,
      recommendedTools:['CineSwarm','ParaCut','WaveForgeStudio','PhiBox','REEL Creator Studio'],
      nextStep:'Human review script, rights and scenes. Export a separate REEL pitch for the existing test-only CineSwarm native intake. Real shot rendering requires newly reviewed native production plans and qualified hardware; completing this package is not authority to publish.',
    },
  }
}
