/**
 * REEL v3.8 · read-only browser inspection of the local CineSwarm Launchpad report.
 *
 * The JSON is an UNSIGNED USER-CONTROLLED FILE. Its contents are self-reported
 * observations, never proof of GPU access, weights, licenses or a completed job.
 * The public web app must not run commands, contact localhost, fetch models,
 * mint release authority or start inference.
 */
import type {PilotPreproductionPacket} from './reelPilot'
import {sha256ReelJson} from './reelNativePreview'

export const REEL_LAUNCHPAD_SCHEMA='REEL_P001_LOCAL_LAUNCHPAD_DIAGNOSTIC_V1'
export const REEL_LAUNCHPAD_MAX_BYTES=128*1024
const SHA=/^[a-f0-9]{64}$/
type Rec=Record<string,unknown>
const record=(value:unknown):value is Rec=>
  typeof value==='object'&&value!==null&&!Array.isArray(value)
const keys=(value:Rec,expected:string[])=>
  Object.keys(value).length===expected.length&&expected.every(k=>Object.hasOwn(value,k))
const str=(v:unknown,max=512):v is string=>typeof v==='string'&&v.length<=max
const qty=(v:unknown,max=1000000000):v is number=>
  typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max
function requireValid(ok:boolean,reason:string):asserts ok {
  if(!ok)throw new Error('REEL Launchpad diagnostic rejected: '+reason)
}
export interface ReadinessStep {
  id:string
  label:string
  state:'ready'|'blocked'|'not-checked'
  instruction:string
}
export interface LaunchpadResult {
  source:'MATCHED_CURRENT_PILOT_KIT'|'UNLINKED_UNSIGNED_REPORT'
  platform:string
  summary:'LOCAL_CHECKS_REPORTED_PASSED'|'BLOCKED_OR_NOT_OBSERVED'
  planHash:string|null
  sourceHash:string|null
  freeSingleGpuMiB:number
  freeRamMiB:number
  freeDiskMiB:number
  steps:ReadinessStep[]
  firstAction:string
  publicationAuthorized:false
  modelExecuted:false
  modelDownloaded:false
}
const step=(id:string,label:string,state:ReadinessStep['state'],instruction:string):ReadinessStep=>
  ({id,label,state,instruction})

export async function inspectLaunchpadJson(text:string,kit?:PilotPreproductionPacket|null):Promise<LaunchpadResult> {
  requireValid(new TextEncoder().encode(text).length<=REEL_LAUNCHPAD_MAX_BYTES,
    'file exceeds 128 KiB')
  let raw:unknown
  try{raw=JSON.parse(text)}catch{throw new Error('Invalid JSON: export the native REEL Launchpad diagnostic')}
  requireValid(record(raw)&&keys(raw,[
    'schema','mode','platform','prerequisites','pilot','readiness','nextActions',
    'authoredFor','networkUsed','modelDownloaded','gpuInferenceStarted',
  ]),'missing or unknown top-level fields')
  requireValid(raw.schema===REEL_LAUNCHPAD_SCHEMA&&raw.mode==='READ_ONLY_LOCAL_DIAGNOSTIC_NO_RENDER',
    'wrong schema or diagnostic mode')
  requireValid(raw.networkUsed===false&&raw.modelDownloaded===false&&raw.gpuInferenceStarted===false,
    'unsigned file claimed network, model download or inference activity')
  requireValid(raw.authoredFor==='REEL Originals Pilot 001 / The First Transmission / first eight-second shot',
    'unexpected production identity')
  requireValid(record(raw.platform)&&keys(raw.platform,['system','release'])&&
    str(raw.platform.system,60)&&str(raw.platform.release,60),'platform details are invalid')
  requireValid(Array.isArray(raw.nextActions)&&raw.nextActions.length<=20&&
    raw.nextActions.every(v=>str(v,1000)),'actions exceed bounded diagnostic format')
  const checks=raw.prerequisites
  requireValid(record(checks)&&keys(checks,[
    'python','ffmpeg','ffprobe','nvidiaSmi','gpus','nvidiaDriver','availableResources',
    'wanSource','wanCheckpoint','checkpointHash','torchCuda',
  ]),'unknown or missing native prerequisites')
  const toolStatuses:Record<string,'FOUND'|'MISSING'>={}
  for(const name of ['ffmpeg','ffprobe','nvidiaSmi']){
    const v=checks[name]
    requireValid(record(v)&&keys(v,['status','executable'])&&
      (v.status==='FOUND'||v.status==='MISSING')&&
      (v.executable===null||str(v.executable,2048)),
      name+' has malformed tool observation')
    requireValid((v.status==='FOUND')===(typeof v.executable==='string'&&v.executable.length>0),
      name+' existence conflicts with executable')
    toolStatuses[name]=v.status as 'FOUND'|'MISSING'
  }
  const py=checks.python
  requireValid(record(py)&&keys(py,['status','executable','version','minimum'])&&
    (py.status==='FOUND'||py.status==='BLOCKED')&&
    str(py.executable,2048)&&str(py.version,100)&&py.minimum==='3.11',
    'Python compatibility report is malformed')
  requireValid(Array.isArray(checks.gpus)&&checks.gpus.length<=16&&
    checks.gpus.every(g=>record(g)&&
      qty(g.vramFreeMiB,1048576)&&
      str(g.name,200)), 'NVIDIA GPU observations are malformed')
  requireValid(checks.nvidiaDriver===null||str(checks.nvidiaDriver,128),
    'NVIDIA driver observation is malformed')
  if(toolStatuses.nvidiaSmi!=='FOUND')
    requireValid(checks.gpus.length===0,'NVIDIA devices claimed without nvidia-smi')
  const resources=checks.availableResources
  requireValid(record(resources)&&keys(resources,[
    'status','bestSingleGpuFreeMiB','freeRamMiB','totalRamMiB','freeDiskMiB','required',
  ])&&(resources.status==='POSSIBLE'||resources.status==='BLOCKED')&&
    qty(resources.bestSingleGpuFreeMiB,1048576)&&
    qty(resources.freeRamMiB)&&qty(resources.totalRamMiB)&&
    qty(resources.freeDiskMiB)&&resources.freeRamMiB<=resources.totalRamMiB&&
    record(resources.required)&&keys(resources.required,[
      'singleGpuFreeMiB','ramFreeMiB','diskFreeMiB',
    ])&&resources.required.singleGpuFreeMiB===9216&&
    resources.required.ramFreeMiB===16384&&resources.required.diskFreeMiB===20480,
    'resource report or numeric limits are invalid')
  const gpus=checks.gpus as Rec[]
  const actualMax=Math.max(0,...gpus.map(g=>Number(g.vramFreeMiB)))
  requireValid(resources.bestSingleGpuFreeMiB===actualMax,
    'cannot combine GPUs or invent free VRAM')
  const fits=actualMax>=9216&&resources.freeRamMiB>=16384&&resources.freeDiskMiB>=20480
  requireValid((resources.status==='POSSIBLE')===fits,
    'GPU/RAM/disk assessment contradicts reported quantities')
  const source=checks.wanSource
  const checkpoint=checks.wanCheckpoint
  requireValid(record(source)&&keys(source,['status','configured','path','generatePyPresent'])&&
    (source.status==='FOUND'||source.status==='MISSING')&&
    typeof source.configured==='boolean'&&typeof source.generatePyPresent==='boolean'&&
    (source.path===null||str(source.path,2048))&&
    (source.status==='FOUND')===source.generatePyPresent,
    'Wan source observation is invalid')
  requireValid(record(checkpoint)&&keys(checkpoint,[
    'status','configured','path','directoryHasFiles','pinnedDigestConfigured',
  ])&&
    (checkpoint.status==='FOUND_UNVERIFIED'||checkpoint.status==='MISSING_OR_EMPTY')&&
    typeof checkpoint.configured==='boolean'&&
    typeof checkpoint.directoryHasFiles==='boolean'&&
    typeof checkpoint.pinnedDigestConfigured==='boolean'&&
    (checkpoint.path===null||str(checkpoint.path,2048))&&
    (checkpoint.status==='FOUND_UNVERIFIED')===checkpoint.directoryHasFiles,
    'Wan checkpoint presence is invalid')
  const hash=checks.checkpointHash
  requireValid(record(hash)&&
    (hash.status==='MATCH'||hash.status==='MISMATCH'
      ? keys(hash,['status','observedSha256','pinnedSha256'])&&
        str(hash.observedSha256,64)&&SHA.test(hash.observedSha256)&&
        str(hash.pinnedSha256,64)&&SHA.test(hash.pinnedSha256)&&
        ((hash.status==='MATCH')===(hash.observedSha256===hash.pinnedSha256))&&
        checkpoint.directoryHasFiles===true&&checkpoint.pinnedDigestConfigured===true
      : (hash.status==='NOT_CHECKED'||hash.status==='BLOCKED')&&
        keys(hash,['status','reason'])&&str(hash.reason,400)),
    'checkpoint hash status is internally inconsistent')
  const torch=checks.torchCuda
  requireValid(record(torch)&&
    (torch.status==='AVAILABLE'
      ? typeof torch.cudaAvailable==='boolean'&&torch.cudaAvailable===true&&
        qty(torch.deviceCount,128)&&torch.deviceCount>0&&
        Array.isArray(torch.devices)&&torch.devices.length<=8
      : (torch.status==='BLOCKED'||torch.status==='NOT_CHECKED')&&
        str(torch.reason,200)),
    'PyTorch/CUDA report has invalid shape')
  const pilot=raw.pilot
  requireValid(record(pilot)&&
    ['NOT_PROVIDED','INVALID','VALID_UNREVIEWED_PREPRODUCTION'].includes(String(pilot.status))&&
    pilot.shotId==='reel-p001-s01'&&
    (pilot.status==='VALID_UNREVIEWED_PREPRODUCTION'
      ? str(pilot.sourceHash,64)&&SHA.test(pilot.sourceHash)&&
        str(pilot.nativePlanHash,64)&&SHA.test(pilot.nativePlanHash)
      : pilot.sourceHash===null&&pilot.nativePlanHash===null),
    'pilot source and plan hashes are invalid')
  const readiness=raw.readiness
  requireValid(record(readiness)&&keys(readiness,[
    'status','allRequiredChecksObserved','modelLicenseReviewed','creativeApprovalGranted',
    'gpuExecutionAuthorized','actualModelInferenceCompleted','publicReleaseAuthorized',
  ])&&
    ['TECHNICAL_PROBES_PASSED_NEEDS_HUMAN_REVIEW','NOT_CONFIRMED'].includes(String(readiness.status))&&
    typeof readiness.allRequiredChecksObserved==='boolean'&&
    readiness.modelLicenseReviewed===false&&readiness.creativeApprovalGranted===false&&
    readiness.gpuExecutionAuthorized===false&&
    readiness.actualModelInferenceCompleted===false&&readiness.publicReleaseAuthorized===false,
    'human authority or release flag was promoted')
  const actuallyPassed=py.status==='FOUND'&&
    toolStatuses.ffmpeg==='FOUND'&&toolStatuses.ffprobe==='FOUND'&&
    resources.status==='POSSIBLE'&&source.status==='FOUND'&&
    checkpoint.status==='FOUND_UNVERIFIED'&&hash.status==='MATCH'&&
    torch.status==='AVAILABLE'&&pilot.status==='VALID_UNREVIEWED_PREPRODUCTION'
  requireValid(readiness.allRequiredChecksObserved===actuallyPassed&&
    (readiness.status==='TECHNICAL_PROBES_PASSED_NEEDS_HUMAN_REVIEW')===actuallyPassed,
    'claimed pass does not match underlying technical observations')
  const currentSourceHash=kit?await sha256ReelJson(kit):null
  if(kit&&pilot.status==='VALID_UNREVIEWED_PREPRODUCTION')
    requireValid(currentSourceHash===pilot.sourceHash,
      'this diagnostic does not match the active REEL pilot kit')
  const matched=Boolean(kit&&currentSourceHash===pilot.sourceHash)
  const actions:ReadinessStep[]=[
    step('python','Python 3.11+',py.status==='FOUND'?'ready':'blocked',
      'Install Python 3.11+ from the official Python source. Use that same interpreter in CineSwarm.'),
    step('ffmpeg','FFmpeg and FFprobe',
      toolStatuses.ffmpeg==='FOUND'&&toolStatuses.ffprobe==='FOUND'?'ready':'blocked',
      'Install FFmpeg and FFprobe command-line binaries and make both available on your Windows PATH.'),
    step('gpu','Single-GPU free VRAM',
      !gpus.length?'blocked':actualMax>=9216?'ready':'blocked',
      'Check nvidia-smi on your PC. Free at least 9216 MiB VRAM on one NVIDIA GPU. Do not add memory across cards.'),
    step('resources','RAM and disk',
      resources.freeRamMiB>=16384&&resources.freeDiskMiB>=20480?'ready':'blocked',
      'Free at least 16384 MiB system RAM and 20480 MiB local disk space.'),
    step('source','Wan 2.1 source',source.status==='FOUND'?'ready':'blocked',
      'Separately install official Wan2.1 source containing generate.py. Set CINESWARM_WAN21_REPO to that folder.'),
    step('weights','Wan T2V 1.3B weights',
      checkpoint.status==='FOUND_UNVERIFIED'?'ready':'blocked',
      'Review the official Wan2.1 T2V 1.3B model license, obtain authentic weights, then set CINESWARM_WAN21_CHECKPOINT.'),
    step('hash','Pinned model checksum',hash.status==='MATCH'?'ready':
      hash.status==='NOT_CHECKED'?'not-checked':'blocked',
      hash.status==='MISMATCH'?'Check the actual checkpoint bytes and pinned digest. Do not bypass an SHA-256 mismatch.':
        'Pin the actual local checkpoint directory SHA-256 and rerun the Launchpad with -CheckModelHash.'),
    step('torch','PyTorch CUDA visibility',torch.status==='AVAILABLE'?'ready':
      torch.status==='NOT_CHECKED'?'not-checked':'blocked',
      'Install an NVIDIA-driver-compatible CUDA PyTorch build and Wan source dependencies, then use -ProbeTorch.'),
    step('pilot','Pilot 001 source packet',pilot.status==='VALID_UNREVIEWED_PREPRODUCTION'?'ready':'blocked',
      'Download reel-p001-preproduction.json from the REEL storyboard and pass -PilotPath when running the Windows Launchpad.'),
  ]
  const first=actions.find(a=>a.state==='blocked')??actions.find(a=>a.state==='not-checked')
  return {
    source:matched?'MATCHED_CURRENT_PILOT_KIT':'UNLINKED_UNSIGNED_REPORT',
    platform:String(raw.platform.system)+' '+String(raw.platform.release),
    summary:actuallyPassed?'LOCAL_CHECKS_REPORTED_PASSED':'BLOCKED_OR_NOT_OBSERVED',
    planHash:pilot.status==='VALID_UNREVIEWED_PREPRODUCTION'?String(pilot.nativePlanHash):null,
    sourceHash:pilot.status==='VALID_UNREVIEWED_PREPRODUCTION'?String(pilot.sourceHash):null,
    freeSingleGpuMiB:actualMax,
    freeRamMiB:Number(resources.freeRamMiB),
    freeDiskMiB:Number(resources.freeDiskMiB),
    steps:actions,
    firstAction:first?first.instruction:
      'Run the native one-shot preflight and review actual model terms and GPU workload. No production or publishing authority has been granted.',
    publicationAuthorized:false,modelExecuted:false,modelDownloaded:false,
  }
}
