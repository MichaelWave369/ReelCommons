/**
 * REEL Network v3.3: public-facing production identity for ReelCommons.
 *
 * CineSwarm / Parallax historical contracts are unchanged. These entries are
 * only local planning metadata: not active agents, real published programs,
 * approved media sources, proof of rights, or CineSwarm production plans.
 */
export const REEL_NETWORK_SCHEMA = 'REEL_NETWORK_PITCH_PACKET_V1' as const
export const REEL_NETWORK_PROVENANCE = 'CREATOR_AUTHORED_UNREVIEWED_DRAFT' as const
export type ReelFormat =
  | 'series' | 'film' | 'game-review' | 'music' | 'podcast'
  | 'documentary' | 'comedy' | 'experimental'
export type ReelClaimClass =
  | 'fiction' | 'opinion' | 'documentary' | 'educational' | 'symbolic'
export interface ReelLane {
  id: ReelFormat
  name: string
  short: string
  description: string
  symbol: string
  futureChannel: string
}
export interface ReelOffice {
  id: string
  name: string
  output: string
  gate: 'creative' | 'review' | 'production' | 'release'
  description: string
}
export const REEL_LANES: readonly ReelLane[] = [
  {id:'series',name:'REEL Originals',short:'Series',symbol:'◈',
    description:'Serialized science fiction, adventure, animation and original narrative worlds',
    futureChannel:'Reserved concept · no channel assigned'},
  {id:'film',name:'REEL Cinema',short:'Films',symbol:'▣',
    description:'Short films, animation, visual experiments and feature-development projects',
    futureChannel:'Reserved concept · no channel assigned'},
  {id:'game-review',name:'REEL Games',short:'Games',symbol:'◆',
    description:'Game reviews, original game-world adaptations and developer showcases',
    futureChannel:'Reserved concept · no channel assigned'},
  {id:'music',name:'REEL Music',short:'Music',symbol:'♫',
    description:'Original music videos, DJ sessions, scores and live performances',
    futureChannel:'Reserved concept · no channel assigned'},
  {id:'podcast',name:'REEL Voices',short:'Podcasts',symbol:'◉',
    description:'Original podcasts, interviews, talk shows and creator conversations',
    futureChannel:'Reserved concept · no channel assigned'},
  {id:'documentary',name:'REEL Docs',short:'Documentaries',symbol:'◇',
    description:'Evidence-aware explainers, science, history and grounded documentary work',
    futureChannel:'Reserved concept · no channel assigned'},
  {id:'comedy',name:'REEL Comedy',short:'Comedy',symbol:'✳',
    description:'Sketches, satirical shows and absurd original characters',
    futureChannel:'Reserved concept · no channel assigned'},
  {id:'experimental',name:'REEL After Hours',short:'Experimental',symbol:'∞',
    description:'Abstract visuals, shorts, interactive stories and unconventional formats',
    futureChannel:'Reserved concept · no channel assigned'},
] as const

export const REEL_OFFICES: readonly ReelOffice[] = [
  {id:'intake',name:'Intake & World Packets',gate:'creative',
    output:'Format brief, audience and source-world notes',
    description:'Receive a creator pitch or explicitly licensed world for consideration'},
  {id:'rights',name:'Rights & Provenance',gate:'review',
    output:'Human-reviewed licenses, consent and attribution plan',
    description:'Independently evaluate adaptation permissions, music, imagery, voices and game IP'},
  {id:'development',name:'Development & Showrunner',gate:'creative',
    output:'Season arc, continuity bible and episode outline',
    description:'Define a coherent show rather than generating disconnected clips'},
  {id:'writers',name:'Writers’ Room',gate:'creative',
    output:'Script, scene beats, dialogue and revision notes',
    description:'Develop the story with factual and symbolic claim labels'},
  {id:'research',name:'Research & Claim Audit',gate:'review',
    output:'Citations, uncertainty, claim posture and correction notes',
    description:'Keep documentaries and public factual claims distinguishable from fiction'},
  {id:'direction',name:'Visual & Audio Direction',gate:'creative',
    output:'Shot board, visual language, voice and music direction',
    description:'Connect creative direction to approved source materials and rights'},
  {id:'production',name:'CineSwarm Production',gate:'production',
    output:'Proposed shot plan for a separately approved CineSwarm runtime',
    description:'Plan agent-assisted media work; actual execution requires a native plan and local human authority'},
  {id:'editing',name:'ParaCut & WaveForge Post',gate:'production',
    output:'Edit package, native verified RenderPlan and optional release-reference chain',
    description:'Human-directed editing, export and separately verified interop intake'},
  {id:'quality',name:'Quality & Continuity',gate:'review',
    output:'Media QC, provenance checks and human acceptance record',
    description:'Inspect the real produced files and exact evidence; generation success is not publication'},
  {id:'programming',name:'REEL Programming Desk',gate:'release',
    output:'Proposed show slot, attribution and audience labeling',
    description:'Stage a programming decision without inventing an on-air slot or a public channel'},
  {id:'release',name:'Human Release Gate',gate:'release',
    output:'Human publisher authorization, public content receipt and approved distribution',
    description:'Only separately reviewed original media can reach a real published REEL channel'},
] as const

export const REEL_REFERENCES = {
  legacyNetwork:'https://github.com/MichaelWave369/parallax-network',
  cineswarm:'https://github.com/MichaelWave369/CineSwarm',
  paracut:'https://github.com/MichaelWave369/paracut',
  waveforge:'https://github.com/MichaelWave369/WaveForgeStudio',
  phibox:'https://github.com/MichaelWave369/PhiBox',
  creatorStudio:'ReelCommons/RCTV Creator Studio',
} as const

export interface ReelPitchInput {
  title:string
  concept:string
  show:string
  creatorCredit:string
  format:ReelFormat
  claimClass:ReelClaimClass
  sourceWorld:string
}
export interface ReelPitchPacket {
  schema:typeof REEL_NETWORK_SCHEMA
  provenance:typeof REEL_NETWORK_PROVENANCE
  network:'REEL'
  hostProject:'ReelCommons'
  originPipeline:'Parallax Creative Stack / CineSwarm'
  createdUtc:string
  pitch:ReelPitchInput
  workOrders: {
    officeId:string
    office:string
    proposedOutput:string
    state:'not_started'
    executionAuthorized:false
  }[]
  review:{
    creatorRights:'unverified'
    sourceLicense:'unverified'
    likenessConsent:'unverified'
    claims:'not_audited'
    humanAccepted:false
    humanReleaseAuthorized:false
    publicationStatus:'not_published'
  }
  authority:{
    localPlanningOnly:true
    cinemaProductionTriggered:false
    videoRendered:false
    autoImport:false
    broadcastAuthorized:false
    networkPublishingAuthorized:false
    knownChannelNumber:null
  }
  nextStep:string
}

function sanitize(value:string,max:number) {
  return value.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max)
}
export function validateReelPitch(input:ReelPitchInput): ReelPitchInput {
  if (!REEL_LANES.some((lane)=>lane.id===input.format) ||
    !(['fiction','opinion','documentary','educational','symbolic'] as string[]).includes(input.claimClass)) {
    throw new Error('Choose a supported program format and content classification.')
  }
  const cleaned:ReelPitchInput={
    format:input.format,claimClass:input.claimClass,
    title:sanitize(input.title,120),
    show:sanitize(input.show,100),
    concept:sanitize(input.concept,1200),
    creatorCredit:sanitize(input.creatorCredit,100),
    sourceWorld:sanitize(input.sourceWorld,160),
  }
  if (!cleaned.title || !cleaned.concept || !cleaned.creatorCredit || !cleaned.show) {
    throw new Error('Title, show, creator credit and original concept are required.')
  }
  return cleaned
}
export function createReelPitchPacket(
  input:ReelPitchInput,createdUtc:string,
):ReelPitchPacket {
  const pitch=validateReelPitch(input)
  if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(createdUtc)||
      !Number.isFinite(Date.parse(createdUtc))) {
    throw new Error('An explicit valid UTC creation date is required.')
  }
  return {
    schema:REEL_NETWORK_SCHEMA,
    provenance:REEL_NETWORK_PROVENANCE,
    network:'REEL',
    hostProject:'ReelCommons',
    originPipeline:'Parallax Creative Stack / CineSwarm',
    createdUtc,pitch,
    workOrders:REEL_OFFICES.map((office)=>({
      officeId:office.id,office:office.name,proposedOutput:office.output,
      state:'not_started' as const,executionAuthorized:false as const,
    })),
    review:{creatorRights:'unverified',sourceLicense:'unverified',
      likenessConsent:'unverified',claims:'not_audited',humanAccepted:false,
      humanReleaseAuthorized:false,publicationStatus:'not_published'},
    authority:{localPlanningOnly:true,cinemaProductionTriggered:false,
      videoRendered:false,autoImport:false,broadcastAuthorized:false,
      networkPublishingAuthorized:false,knownChannelNumber:null},
    nextStep:'Human creator reviews this draft, source rights and consent. To produce media, independently open the authorized CineSwarm or ParaCut workflow, build a native verified plan, and approve operations there. This REEL JSON is NOT a CineSwarm-native production plan, not a WaveForge release receipt, and not a published media asset.',
  }
}
export function reelPitchJson(packet:ReelPitchPacket):string {
  return JSON.stringify(packet,null,2)
}
export function reelPitchFilename(title:string):string {
  const cleaned=title.normalize('NFKD').toLowerCase()
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,54)
    .replace(/-+$/,'')||'untitled'
  return 'reel-pitch-'+cleaned+'.json'
}
