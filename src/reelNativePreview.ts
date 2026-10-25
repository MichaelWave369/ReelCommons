/**
 * REEL v3.4 · browser-side inspection of the independent CineSwarm receiver's
 * LOCAL test-only preview. This does not attest signatures or authorize jobs.
 */
import type { ReelPitchPacket } from './reelNetwork'

export const REEL_NATIVE_PREVIEW_SCHEMA='REEL_CINESWARM_DRYRUN_PREVIEW_V1'
export const REEL_NATIVE_MAX_BYTES=64*1024

export interface NativePreviewInspection {
  result:'MATCHED_CURRENT_LOCAL_PITCH'|'UNLINKED_SOURCE_NOT_AUTHENTICATED'
  inputHash:string
  nativePlanHash:string
  shotId:string
  testBackend:'deterministic-test'
  permission:'NO_EXECUTION_OR_PUBLICATION'
}
const HEX=/^[0-9a-f]{64}$/
const exact=(object:Record<string,unknown>,allowed:string[]):boolean=>
  Object.keys(object).length===allowed.length&&allowed.every((key)=>Object.hasOwn(object,key))
const isRecord=(value:unknown):value is Record<string,unknown> =>
  typeof value==='object'&&value!==null&&!Array.isArray(value)
const equal=(a:unknown,b:unknown)=>a===b

export function canonicalReelJson(value:unknown):string {
  // Matches Python's sort_keys=True, separators=(",", ":"), ensure_ascii=False
  if(Array.isArray(value))return '['+value.map(canonicalReelJson).join(',')+']'
  if(isRecord(value))return '{'+Object.keys(value).sort().map((key)=>
    JSON.stringify(key)+':'+canonicalReelJson(value[key])).join(',')+'}'
  if(value===null||typeof value==='string'||typeof value==='number'&&Number.isFinite(value)||typeof value==='boolean')
    return JSON.stringify(value)
  throw new Error('Unsupported value in canonical REEL JSON')
}
export async function sha256ReelJson(value:unknown):Promise<string> {
  if(typeof crypto==='undefined'||!crypto.subtle)throw new Error('SHA-256 not available in this browser context')
  const bytes=new TextEncoder().encode(canonicalReelJson(value))
  const digest=await crypto.subtle.digest('SHA-256',bytes)
  return [...new Uint8Array(digest)].map((byte)=>byte.toString(16).padStart(2,'0')).join('')
}

function parseDraftPlan(value:unknown,inputHash:string):Record<string,unknown> {
  if(!isRecord(value)||!exact(value,['schemaVersion','projectId','idempotencyKey','lineage','shots']))
    throw new Error('Preview must contain only the expected native test plan fields')
  if(value.schemaVersion!=='production-plan/v1'||
    value.projectId!=='reel-dryrun-'+inputHash.slice(0,12)||
    value.idempotencyKey!=='reel-dryrun-'+inputHash.slice(0,32)||
    !isRecord(value.lineage)||
    !exact(value.lineage,['sourceSystem','sourceHash'])||
    value.lineage.sourceSystem!=='REEL_DRAFT'||
    value.lineage.sourceHash!==inputHash) {
    throw new Error('Preview native plan lineage differs from the REEL dry-run contract')
  }
  if(!Array.isArray(value.shots)||value.shots.length!==1||!isRecord(value.shots[0]))
    throw new Error('Only one native test-only rehearsal shot is permitted')
  const shot=value.shots[0]
  if(!exact(shot,['shotId','prompt','durationSeconds','delivery','backendPreference',
    'conditioning','seed','acceptanceEligible','publicReleaseAuthorized'])||
    shot.shotId!=='reel-rehearsal-001'||
    typeof shot.prompt!=='string'||shot.prompt.length>20000||
    !shot.prompt.startsWith('TEST FIXTURE ONLY; no produced or licensed media. Original REEL creator concept, pending human rights and editorial review: ')||
    shot.durationSeconds!==1||
    !isRecord(shot.delivery)||
    !exact(shot.delivery,['width','height','fps','container'])||
    shot.delivery.width!==1280||shot.delivery.height!==720||
    shot.delivery.fps!==24||shot.delivery.container!=='mp4'||
    !Array.isArray(shot.backendPreference)||shot.backendPreference.length!==1||
    shot.backendPreference[0]!=='deterministic-test'||
    !Array.isArray(shot.conditioning)||shot.conditioning.length!==0||
    shot.seed!==369||shot.acceptanceEligible!==false||
    shot.publicReleaseAuthorized!==false) {
    throw new Error('Preview attempted to promote a real backend, media conditioning or release authority')
  }
  return value
}

export async function inspectReelNativePreview(
  jsonText:string, currentPitch?:ReelPitchPacket|null,
):Promise<NativePreviewInspection> {
  if(new TextEncoder().encode(jsonText).length>REEL_NATIVE_MAX_BYTES)
    throw new Error('Native preview exceeds the 64 KiB local inspection limit')
  let raw:unknown
  try{raw=JSON.parse(jsonText)}catch{throw new Error('Not a valid CineSwarm JSON preview')}
  if(!isRecord(raw)||!exact(raw,['schema','sourceSchema','inputHash','outputPlanHash','mode',
    'status','executionTriggered','mediaRendered','rightsVerified',
    'humanReleaseAuthorized','publicationAuthorized','nativeTestPlan','nextStep']))
    throw new Error('Native preview schema is missing or contains unknown fields')
  if(raw.schema!==REEL_NATIVE_PREVIEW_SCHEMA||
    raw.sourceSchema!=='REEL_NETWORK_PITCH_PACKET_V1'||
    raw.mode!=='LOCAL_DRYRUN_ONLY'||raw.status!=='VALIDATED_NOT_SUBMITTED'||
    !HEX.test(String(raw.inputHash))||!HEX.test(String(raw.outputPlanHash))||
    !equal(raw.executionTriggered,false)||!equal(raw.mediaRendered,false)||
    !equal(raw.rightsVerified,false)||!equal(raw.humanReleaseAuthorized,false)||
    !equal(raw.publicationAuthorized,false)||
    typeof raw.nextStep!=='string'||raw.nextStep.length>1200)
    throw new Error('Preview cannot claim execution, verified rights or broadcast authority')
  const inputHash=String(raw.inputHash)
  const nativePlanHash=String(raw.outputPlanHash)
  const plan=parseDraftPlan(raw.nativeTestPlan,inputHash)
  const observedHash=await sha256ReelJson(plan)
  if(observedHash!==nativePlanHash)throw new Error('Native test plan SHA-256 mismatch')
  if(currentPitch) {
    const currentHash=await sha256ReelJson(currentPitch)
    if(currentHash!==inputHash)throw new Error('Native preview is not derived from the current REEL pitch packet')
    const shots=plan.shots as Record<string,unknown>[]
    const expectedPrompt='TEST FIXTURE ONLY; no produced or licensed media. Original REEL creator concept, pending human rights and editorial review: '+currentPitch.pitch.concept
    if(shots[0].prompt!==expectedPrompt)throw new Error('The native plan concept differs from the current pitch')
  }
  return {
    result:currentPitch?'MATCHED_CURRENT_LOCAL_PITCH':'UNLINKED_SOURCE_NOT_AUTHENTICATED',
    inputHash,nativePlanHash,shotId:'reel-rehearsal-001',
    testBackend:'deterministic-test',permission:'NO_EXECUTION_OR_PUBLICATION',
  }
}
