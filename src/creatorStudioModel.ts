/**
 * RCTV v3.2 Creator Studio.
 * Explicitly user-recorded local media, NOT a ParaCut RenderPlan, PHIAudio
 * engine receipt, WaveForge release, or approval for RCTV channel playback.
 */
export const CREATOR_STUDIO_SCHEMA = 'RCTV_CREATOR_LOCAL_EPISODE_V1'
export const CREATOR_STUDIO_PROVENANCE = 'USER_RECORDED_LOCAL_UNVERIFIED'
export type CaptureMode = 'microphone' | 'camera-microphone'
export interface CreatorProjectInput {
  title: string
  show: string
  description: string
  notes: string
  mode: CaptureMode
}
export interface CreatorLocalEpisode {
  schema: typeof CREATOR_STUDIO_SCHEMA
  provenance: typeof CREATOR_STUDIO_PROVENANCE
  permissions: {
    recordedWithExplicitUserAction: true
    published: false
    rightsVerified: false
    localOnly: true
    networkAuthority: false
    autoImportAuthority: false
  }
  episode: {
    title: string
    show: string
    description: string
    notes: string
    captureMode: CaptureMode
  }
  output: {
    mediaFilename: string
    mimeType: string
    byteLength: number
    // Explicitly no file payload: the browser cannot hand a Blob to an unrelated origin.
    bytesIncludedInManifest: false
  }
  recordedUtc: string
  handoff: {
    targetSuggestion: 'ParaCut'
    status: 'REFERENCE_ONLY_NOT_NATIVE_PARACUT_DRAFT'
    nextAction: string
  }
  notice: string
}
function cleanText(raw:string,limit:number):string {
  return raw.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,limit)
}
export function safeStudioFilename(title:string,ext:string):string {
  const slug=title.normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
    .slice(0,58).replace(/-+$/g,'') || 'rctv-episode'
  return slug+'.'+(ext==='mp4'?'mp4':ext==='ogg'?'ogg':'webm')
}
export function supportedRecordingMime(mode:CaptureMode, supported:(mime:string)=>boolean):string|null {
  const choices=mode==='microphone'
    ? ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg']
    : ['video/webm;codecs=vp8,opus','video/webm','video/mp4']
  return choices.find((mime)=>supported(mime))??null
}
export function recordingExtension(mime:string):'webm'|'ogg'|'mp4' {
  return mime.startsWith('video/mp4')?'mp4':mime.startsWith('audio/ogg')?'ogg':'webm'
}
export function creatorEpisodeManifest(
  draft: CreatorProjectInput, output:{mediaFilename:string,mimeType:string,byteLength:number},
  recordedUtc:string,
):CreatorLocalEpisode {
  const title=cleanText(draft.title,120)
  const show=cleanText(draft.show,100)
  if(!title||!show||!Number.isInteger(output.byteLength)||output.byteLength<=0 ||
    output.byteLength>3_000_000_000 || !/^(audio|video)\/(webm|ogg|mp4)(;.*)?$/.test(output.mimeType) ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,100}$/.test(output.mediaFilename) ||
    !Number.isFinite(Date.parse(recordedUtc)) ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(recordedUtc) ||
    !(['microphone','camera-microphone'] as string[]).includes(draft.mode)) {
    throw new Error('Episode details or recording metadata are invalid.')
  }
  if(draft.mode==='microphone'&&!output.mimeType.startsWith('audio/')) {
    throw new Error('Audio-only capture must produce an audio file.')
  }
  if(draft.mode==='camera-microphone'&&!output.mimeType.startsWith('video/')) {
    throw new Error('Camera capture must produce a video file.')
  }
  return {
    schema:CREATOR_STUDIO_SCHEMA,provenance:CREATOR_STUDIO_PROVENANCE,
    permissions:{recordedWithExplicitUserAction:true,published:false,rightsVerified:false,
      localOnly:true,networkAuthority:false,autoImportAuthority:false},
    episode:{title,show,description:cleanText(draft.description,800),
      notes:cleanText(draft.notes,2400),captureMode:draft.mode},
    output:{...output,bytesIncludedInManifest:false},
    recordedUtc,
    handoff:{
      targetSuggestion:'ParaCut',
      status:'REFERENCE_ONLY_NOT_NATIVE_PARACUT_DRAFT',
      nextAction:'Download the recorded media file separately. Import that local file into ParaCut using its own verified importer; use these metadata fields for titles and show notes. No cross-origin automatic import or RenderPlan is claimed.',
    },
    notice:'Self-reported local recording. This is NOT proof of source ownership or license, not a ParaCut RenderPlan, PHIAudio render receipt, WaveForgeStudio release artifact, live broadcast, published feed or approved RCTV channel.',
  }
}
export function exportCreatorEpisodeManifest(manifest:CreatorLocalEpisode):string {
  return JSON.stringify(manifest,null,2)
}
