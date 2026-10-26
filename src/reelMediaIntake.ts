/**
 * REEL P001 v3.7 · independently hash the user's selected master MP4.
 *
 * The companion CineSwarm JSON is UNSIGNED and editable. Its receipts,
 * observed ffprobe and review status are *claims* made by the exporting
 * process, not authenticated on the public GitHub Pages browser.
 * The comparison DOES prove the selected MP4's bytes match the stated digest.
 */
import type {PilotPreproductionPacket} from './reelPilot'
import {sha256ReelJson} from './reelNativePreview'

export const REEL_MEDIA_EVIDENCE_SCHEMA = 'REEL_P001_REAL_MEDIA_EVIDENCE_V1'
export const REEL_MEDIA_MAX_BYTES = 256*1024*1024
export const REEL_EVIDENCE_MAX_BYTES = 64*1024
const SHA=/^[0-9a-f]{64}$/
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
type Obj=Record<string,unknown>
function record(v:unknown):v is Obj {
  return typeof v==='object'&&v!==null&&!Array.isArray(v)
}
function exact(o:Obj, keys:string[]) {
  return Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k))
}
function verifiedMedia(value:unknown,role:'master'|'native',size:number[]) {
  if(!record(value)||!exact(value,[
    'artifactId','sha256','sizeBytes','role','width','height','fps','durationSeconds',
  ])||
    !UUID.test(String(value.artifactId))||
    typeof value.sha256!=='string'||!SHA.test(value.sha256)||
    !Number.isSafeInteger(value.sizeBytes)||Number(value.sizeBytes)<=0||
    value.role!==role||
    value.width!==size[0]||value.height!==size[1]||value.fps!==size[2]||
    typeof value.durationSeconds!=='number'||
    !Number.isFinite(value.durationSeconds)||
    value.durationSeconds<=0||value.durationSeconds>30) {
      throw new Error('Unsigned evidence has invalid '+role+' MP4 provenance')
  }
  return value
}

export interface ReelMediaIntakeResult {
  mediaHash:string
  mediaBytes:number
  nativeHashClaim:string
  sourceHash:string
  planHash:string
  modelBackend:'wan21-t2v-1.3b'
  reviewLabel:'PENDING_REVIEW'|'ACCEPT'|'REJECT'|'REVISION_REQUESTED'
  reviewClaimExactHash:boolean
  sourceMatch:'MATCHED_ACTIVE_PILOT_KIT'|'UNLINKED_UNSIGNED_SOURCE'
  status:'SELECTED_MP4_BYTES_MATCH_UNSIGNED_LOCAL_EVIDENCE'
  publicationAuthority:false
}

export async function verifyReelMediaIntake(
  sidecarJson:string, media:Blob,
  activeKit?:PilotPreproductionPacket|null,
):Promise<ReelMediaIntakeResult> {
  if(new TextEncoder().encode(sidecarJson).length>REEL_EVIDENCE_MAX_BYTES)
    throw new Error('Evidence JSON exceeds 64 KiB local inspection limit')
  if(media.size<16||media.size>REEL_MEDIA_MAX_BYTES)
    throw new Error('Selected master MP4 must be between 16 bytes and 256 MiB')
  let raw:unknown
  try{raw=JSON.parse(sidecarJson)}catch{throw new Error('Invalid CineSwarm evidence JSON')}
  if(!record(raw)||!exact(raw,[
    'schema','classification','shotId','lineage','model','master','native',
    'review','integrity','authority','notice',
  ])||raw.schema!==REEL_MEDIA_EVIDENCE_SCHEMA||
    raw.classification!=='LOCAL_UNSIGNED_MEDIA_EVIDENCE_NOT_PUBLIC_RELEASE'||
    raw.shotId!=='reel-p001-s01')
    throw new Error('Expected exact CineSwarm REEL P001 real-shot evidence envelope')
  if(!record(raw.lineage)||!exact(raw.lineage,[
    'sourceHash','planHash','jobId','taskId',
  ])||!SHA.test(String(raw.lineage.sourceHash))||
    !SHA.test(String(raw.lineage.planHash))||
    !UUID.test(String(raw.lineage.jobId))||
    !UUID.test(String(raw.lineage.taskId)))
    throw new Error('Real shot source/job lineage is missing or malformed')
  if(!record(raw.model)||!exact(raw.model,[
    'backendId','modelId','recordedCheckpointHash','runtimeCheckpointRecheckedOnExport',
  ])||raw.model.backendId!=='wan21-t2v-1.3b'||
    raw.model.modelId!=='Wan-AI/Wan2.1-T2V-1.3B'||
    !SHA.test(String(raw.model.recordedCheckpointHash))||
    raw.model.runtimeCheckpointRecheckedOnExport!==false)
    throw new Error('Wrong model or misleading checkpoint status')
  const master=verifiedMedia(raw.master,'master',[1280,720,24])
  const native=verifiedMedia(raw.native,'native',[832,480,16])
  if(master.sizeBytes!==media.size)
    throw new Error('Selected MP4 byte count disagrees with the evidence')
  if(master.sha256===native.sha256)
    throw new Error('Native 480p and scaled 720p files cannot have identical hashes')
  if(!record(raw.integrity)||!exact(raw.integrity,[
    'localReceiptChainVerified','receiptCount','receiptHeadHash',
    'masterMediaBytesRehashed','nativeMediaBytesRehashed','bothMediaProbesPassed',
    'signaturePresent',
  ])||raw.integrity.localReceiptChainVerified!==true||
    !Number.isSafeInteger(raw.integrity.receiptCount)||
    Number(raw.integrity.receiptCount)<1||
    !SHA.test(String(raw.integrity.receiptHeadHash))||
    raw.integrity.masterMediaBytesRehashed!==true||
    raw.integrity.nativeMediaBytesRehashed!==true||
    raw.integrity.bothMediaProbesPassed!==true||
    raw.integrity.signaturePresent!==false)
    throw new Error('Evidence is missing consistent unsigned local receipt assertions')
  if(!record(raw.authority)||!exact(raw.authority,[
    'sourceRightsVerified','musicRightsVerified','voiceConsentVerified',
    'publishingAuthorized','rctvChannelAssigned',
  ])||Object.values(raw.authority).some(v=>v!==false))
    throw new Error('REEL browser cannot accept permission or publishing claims')
  if(typeof raw.notice!=='string'||raw.notice.length<40||raw.notice.length>1500)
    throw new Error('Missing local unsigned-evidence disclosure')
  if(!record(raw.review)||!exact(raw.review,[
    'decision','exactHashDecisionRecorded',
  ])||!['PENDING_REVIEW','ACCEPT','REJECT','REVISION_REQUESTED'].includes(
    String(raw.review.decision)
  )||raw.review.exactHashDecisionRecorded!==(raw.review.decision!=='PENDING_REVIEW'))
    throw new Error('Human review status is inconsistent with claimed exact-hash decision')
  // Confirm an MP4 ISOBMFF file signature. No parsing or playback required.
  const prefix=new Uint8Array(await media.slice(0,16).arrayBuffer())
  const signature=String.fromCharCode(...prefix.slice(4,8))
  if(signature!=='ftyp')
    throw new Error('Selected file does not contain an MP4 ftyp box')
  if(typeof crypto==='undefined'||!crypto.subtle)
    throw new Error('WebCrypto SHA-256 unavailable in this browser')
  const digest=await crypto.subtle.digest('SHA-256',await media.arrayBuffer())
  const observed=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('')
  if(observed!==master.sha256)
    throw new Error('Selected MP4 SHA-256 differs from the CineSwarm evidence: do not import')
  if(activeKit){
    const kitHash=await sha256ReelJson(activeKit)
    if(raw.lineage.sourceHash!==kitHash)
      throw new Error('Rendered shot evidence does not match the current pilot kit')
  }
  return {
    mediaHash:observed,mediaBytes:media.size,
    nativeHashClaim:String(native.sha256),sourceHash:String(raw.lineage.sourceHash),
    planHash:String(raw.lineage.planHash),
    modelBackend:'wan21-t2v-1.3b',
    reviewLabel:raw.review.decision as ReelMediaIntakeResult['reviewLabel'],
    reviewClaimExactHash:Boolean(raw.review.exactHashDecisionRecorded),
    sourceMatch:activeKit?'MATCHED_ACTIVE_PILOT_KIT':'UNLINKED_UNSIGNED_SOURCE',
    status:'SELECTED_MP4_BYTES_MATCH_UNSIGNED_LOCAL_EVIDENCE',
    publicationAuthority:false,
  }
}
