/**
 * REEL P001 Wan2.1 offline preflight local file inspector.
 * Never authorizes rendering, source rights, external media or publication.
 * SHA-256 verifies local JSON consistency, not authenticity of an operator.
 */
import type {PilotPreproductionPacket} from './reelPilot'
import {sha256ReelJson} from './reelNativePreview'

export const REEL_FIRST_SHOT_PREFLIGHT_SCHEMA = 'REEL_P001_WAN21_PRODUCTION_PREFLIGHT_V1'
export const REEL_FIRST_SHOT_MAX_BYTES = 128*1024
const SHA_RE=/^[0-9a-f]{64}$/

type RecordLike=Record<string,unknown>
const obj=(v:unknown):v is RecordLike=>
  v!==null&&typeof v==='object'&&!Array.isArray(v)
const sameKeys=(value:RecordLike, keys:string[]) =>
  Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k))
const numbers=(value:unknown,expected:number[]) =>
  Array.isArray(value)&&value.length===expected.length&&value.every((x,i)=>x===expected[i])

export interface ReelFirstShotResult {
  origin:'MATCHED_ACTIVE_PILOT_KIT'|'UNLINKED_EDITABLE_LOCAL_FILE'
  reportedReadiness:string
  sourceHash:string
  candidateHash:string
  backend:'wan21-t2v-1.3b'
  shotId:'reel-p001-s01'
  native:'832×480 / 16 fps'
  delivery:'1280×720 / 24 fps (scaled)'
  status:'NEEDS_HUMAN_AUTHORIZATION_NO_RENDER'
}

export async function inspectReelFirstShot(
  source:string, activeKit?:PilotPreproductionPacket|null,
):Promise<ReelFirstShotResult> {
  if(new TextEncoder().encode(source).byteLength>REEL_FIRST_SHOT_MAX_BYTES)
    throw new Error('First-shot preflight exceeds 128 KiB')
  let value:unknown
  try{value=JSON.parse(source)}catch{throw new Error('The selected file is not valid JSON')}
  const keys=[
    'schema','mode','status','sourceHash','nativePlanHash','shotSourceId',
    'scriptedDurationSeconds','modelBackend','nativeResolution','nativeFps',
    'deliveryResolution','deliveryFps','native720p','gpuModelExecuted',
    'mediaRendered','assetHashVerified','rightsVerified',
    'humanProductionApprovalGranted','publicReleaseAuthorized',
    'coordinatorContacted','modelDownloaded','nativeCandidatePlan','readiness',
  ]
  if(!obj(value)||!sameKeys(value,keys))
    throw new Error('The first-shot preflight envelope has missing or unknown fields')
  if(value.schema!==REEL_FIRST_SHOT_PREFLIGHT_SCHEMA||
    value.mode!=='OFFLINE_REAL_SHOT_CANDIDATE_NOT_SUBMITTED'||
    value.status!=='AWAITING_MANUAL_PRODUCTION_APPROVAL'||
    typeof value.sourceHash!=='string'||!SHA_RE.test(value.sourceHash)||
    typeof value.nativePlanHash!=='string'||!SHA_RE.test(value.nativePlanHash)||
    value.shotSourceId!=='P001-S01'||
    value.scriptedDurationSeconds!==8||
    value.modelBackend!=='wan21-t2v-1.3b'||
    !numbers(value.nativeResolution,[832,480])||value.nativeFps!==16||
    !numbers(value.deliveryResolution,[1280,720])||value.deliveryFps!==24||
    value.native720p!==false ||
    value.gpuModelExecuted!==false||value.mediaRendered!==false||
    value.assetHashVerified!==false||value.rightsVerified!==false||
    value.humanProductionApprovalGranted!==false||value.publicReleaseAuthorized!==false||
    value.coordinatorContacted!==false||value.modelDownloaded!==false
  )throw new Error('Untrusted file tried to change shot/model identity, playback, execution or release claims')
  const plan=value.nativeCandidatePlan
  if(!obj(plan)||!sameKeys(plan,[
    'schemaVersion','projectId','idempotencyKey','lineage','shots',
  ])||
    plan.schemaVersion!=='production-plan/v1'||
    plan.projectId!=='reel-p001-'+value.sourceHash.slice(0,12)||
    plan.idempotencyKey!=='p001-s01-wan21-'+value.sourceHash.slice(0,32)||
    !obj(plan.lineage)||!sameKeys(plan.lineage,['sourceSystem','sourceHash'])||
    plan.lineage.sourceSystem!=='REEL_P001'||
    plan.lineage.sourceHash!==value.sourceHash||
    !Array.isArray(plan.shots)||plan.shots.length!==1||!obj(plan.shots[0])
  )throw new Error('Native production candidate has invalid REEL P001 lineage')
  const shot=plan.shots[0]
  if(!sameKeys(shot,[
    'shotId','prompt','durationSeconds','delivery','backendPreference',
    'conditioning','seed','acceptanceEligible','publicReleaseAuthorized',
  ])||
    shot.shotId!=='reel-p001-s01'||
    typeof shot.prompt!=='string'||shot.prompt.length===0||shot.prompt.length>20000||
    shot.durationSeconds!==8||
    !obj(shot.delivery)||!sameKeys(shot.delivery,['width','height','fps','container'])||
    shot.delivery.width!==1280||shot.delivery.height!==720||
    shot.delivery.fps!==24||shot.delivery.container!=='mp4'||
    !Array.isArray(shot.backendPreference)||shot.backendPreference.length!==1||
    shot.backendPreference[0]!=='wan21-t2v-1.3b'||
    !Array.isArray(shot.conditioning)||shot.conditioning.length!==0||
    shot.seed!==369||shot.acceptanceEligible!==true||
    shot.publicReleaseAuthorized!==false
  )throw new Error('Native plan changed first-shot constraints, backend or public release protection')

  const computedHash=await sha256ReelJson(plan)
  if(computedHash!==value.nativePlanHash)
    throw new Error('Native candidate SHA-256 does not match its claimed digest')

  if(!obj(value.readiness))throw new Error('Missing observed local readiness state')
  const readiness=value.readiness
  const validStates=[
    'NOT_CHECKED','BLOCKED_MODEL_NOT_CONFIGURED',
    'BLOCKED_MODEL_FILES_OR_CONFIGURATION','BLOCKED_CHECKPOINT_UNREADABLE',
    'BLOCKED_MODEL_HASH_MISMATCH','BLOCKED_HARDWARE_OR_MODEL_PROFILE',
    'OPERATOR_REVIEW_REQUIRED',
  ]
  if(typeof readiness.status!=='string'||!validStates.includes(readiness.status)||
    readiness.localHardwareObserved!== (readiness.status!=='NOT_CHECKED')||
    typeof readiness.modelHashVerified!=='boolean'||
    typeof readiness.schedulerViable!=='boolean'||
    typeof readiness.reason!=='string'||readiness.reason.length>2000
  )throw new Error('Local readiness state is inconsistent or unsupported')
  if(readiness.status==='OPERATOR_REVIEW_REQUIRED'&&
    (!readiness.modelHashVerified||!readiness.schedulerViable||
    readiness.modelLicenseReviewed!==false||
    readiness.humanProductionApprovalGranted!==false)) {
    throw new Error('Local readiness must never pre-authorize creative rights or execution')
  }
  if(readiness.status==='NOT_CHECKED'&&
    (readiness.modelHashVerified||readiness.schedulerViable))
    throw new Error('Unobserved model/hardware must remain unverified')

  if(activeKit){
    const liveHash=await sha256ReelJson(activeKit)
    if(liveHash!==value.sourceHash)
      throw new Error('First-shot output does not match the current REEL pilot kit')
    if(activeKit.shots[0].imagePrompt!==shot.prompt)
      throw new Error('Native shot prompt differs from the current pilot kit')
  }
  return {
    origin:activeKit?'MATCHED_ACTIVE_PILOT_KIT':'UNLINKED_EDITABLE_LOCAL_FILE',
    reportedReadiness:readiness.status,
    sourceHash:value.sourceHash,
    candidateHash:value.nativePlanHash,
    backend:'wan21-t2v-1.3b',
    shotId:'reel-p001-s01',
    native:'832×480 / 16 fps',
    delivery:'1280×720 / 24 fps (scaled)',
    status:'NEEDS_HUMAN_AUTHORIZATION_NO_RENDER',
  }
}
