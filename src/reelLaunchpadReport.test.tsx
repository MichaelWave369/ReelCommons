import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import ReelWindowsLaunchpad from './ReelWindowsLaunchpad'
import ReelPilotDesk from './ReelPilotDesk'
import {pilotPreproductionPacket} from './reelPilot'
import {sha256ReelJson} from './reelNativePreview'
import {
  inspectLaunchpadJson,REEL_LAUNCHPAD_MAX_BYTES,REEL_LAUNCHPAD_SCHEMA,
} from './reelLaunchpadReport'
import {CHANNEL_LINEUP} from './channelSurf'

const kit=pilotPreproductionPacket('2026-10-25T23:41:00.000Z')
async function diagnostic(){
  const sourceHash=await sha256ReelJson(kit)
  return {
    schema:REEL_LAUNCHPAD_SCHEMA,
    mode:'READ_ONLY_LOCAL_DIAGNOSTIC_NO_RENDER',
    platform:{system:'Windows',release:'11'},
    prerequisites:{
      python:{status:'FOUND',executable:'C:\\Python312\\python.exe',version:'3.12.4',minimum:'3.11'},
      ffmpeg:{status:'MISSING',executable:null as string|null},
      ffprobe:{status:'MISSING',executable:null as string|null},
      nvidiaSmi:{status:'MISSING',executable:null as string|null},
      gpus:[] as Array<Record<string,unknown>>,
      nvidiaDriver:null as string|null,
      availableResources:{
        status:'BLOCKED',bestSingleGpuFreeMiB:0,freeRamMiB:28000,
        totalRamMiB:32768,freeDiskMiB:41000,
        required:{singleGpuFreeMiB:9216,ramFreeMiB:16384,diskFreeMiB:20480},
      },
      wanSource:{status:'MISSING',configured:false,path:null as string|null,generatePyPresent:false},
      wanCheckpoint:{
        status:'MISSING_OR_EMPTY',configured:false,path:null as string|null,
        directoryHasFiles:false,pinnedDigestConfigured:false,
      },
      checkpointHash:{status:'NOT_CHECKED',reason:'Run -CheckModelHash'} as Record<string,unknown>,
      torchCuda:{status:'NOT_CHECKED',reason:'Use -ProbeTorch'} as Record<string,unknown>,
    },
    pilot:{
      status:'VALID_UNREVIEWED_PREPRODUCTION',sourceHash,
      nativePlanHash:'a'.repeat(64),shotId:'reel-p001-s01',
    },
    readiness:{
      status:'NOT_CONFIRMED',allRequiredChecksObserved:false,
      modelLicenseReviewed:false,creativeApprovalGranted:false,
      gpuExecutionAuthorized:false,actualModelInferenceCompleted:false,
      publicReleaseAuthorized:false,
    },
    nextActions:['Find FFmpeg and official model checkpoint.'],
    authoredFor:'REEL Originals Pilot 001 / The First Transmission / first eight-second shot',
    networkUsed:false,modelDownloaded:false,gpuInferenceStarted:false,
  }
}
async function ready(){
  const item=await diagnostic()
  item.prerequisites.ffmpeg={status:'FOUND',executable:'C:\\ffmpeg\\bin\\ffmpeg.exe'}
  item.prerequisites.ffprobe={status:'FOUND',executable:'C:\\ffmpeg\\bin\\ffprobe.exe'}
  item.prerequisites.nvidiaSmi={status:'FOUND',executable:'C:\\System32\\nvidia-smi.exe'}
  item.prerequisites.gpus=[{
    name:'NVIDIA RTX 5070',vramFreeMiB:10040,index:0,vramTotalMiB:12288,
  }]
  item.prerequisites.nvidiaDriver='test driver'
  item.prerequisites.availableResources.status='POSSIBLE'
  item.prerequisites.availableResources.bestSingleGpuFreeMiB=10040
  item.prerequisites.wanSource={
    status:'FOUND',configured:true,path:'D:\\Wan2.1',generatePyPresent:true,
  }
  item.prerequisites.wanCheckpoint={
    status:'FOUND_UNVERIFIED',configured:true,path:'D:\\Wan-model',
    directoryHasFiles:true,pinnedDigestConfigured:true,
  }
  item.prerequisites.checkpointHash={
    status:'MATCH',observedSha256:'b'.repeat(64),pinnedSha256:'b'.repeat(64),
  }
  item.prerequisites.torchCuda={
    status:'AVAILABLE',cudaAvailable:true,deviceCount:1,
    torchVersion:'2.9.0',torchCuda:'12.8',
    devices:[{name:'RTX 5070',totalMiB:12288,computeCapability:'12.0'}],
    note:'Torch device only',
  }
  item.readiness.status='TECHNICAL_PROBES_PASSED_NEEDS_HUMAN_REVIEW'
  item.readiness.allRequiredChecksObserved=true
  item.nextActions=['Review model terms and decide whether to authorize a local render.']
  return item
}

describe('REEL 3.8 · Windows Launchpad diagnostics, local and unsigned',()=>{
  it('shows instructions without loading a remote video or contacting the PC',()=>{
    const html=renderToStaticMarkup(<ReelWindowsLaunchpad activeKit={null}/>)
    expect(html).toContain('Windows Launchpad')
    expect(html).toContain('REEL-Launchpad.ps1')
    expect(html).toContain('-CheckModelHash -ProbeTorch -SaveReport')
    expect(html).toContain('NO CURRENT PILOT EXPORT')
    expect(html).toContain('Choose local REEL Windows Launchpad diagnostic JSON')
    expect(html).not.toContain('<video')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('autoplay=')
  })
  it('accepts a bounded blocked Windows diagnostic but never calls it executed media',async()=>{
    const item=await diagnostic()
    const result=await inspectLaunchpadJson(JSON.stringify(item),kit)
    expect(result.summary).toBe('BLOCKED_OR_NOT_OBSERVED')
    expect(result.source).toBe('MATCHED_CURRENT_PILOT_KIT')
    expect(result.planHash).toBe(item.pilot.nativePlanHash)
    expect(result.freeSingleGpuMiB).toBe(0)
    expect(result.steps).toHaveLength(9)
    expect(result.firstAction).toContain('FFmpeg')
    expect(result.publicationAuthorized).toBe(false)
    expect(result.modelExecuted).toBe(false)
    expect(result.modelDownloaded).toBe(false)
    expect((await inspectLaunchpadJson(JSON.stringify(item))).source)
      .toBe('UNLINKED_UNSIGNED_REPORT')
  })
  it('reports all prerequisites passed only as technical observations',async()=>{
    const report=await ready()
    const result=await inspectLaunchpadJson(JSON.stringify(report),kit)
    expect(result.summary).toBe('LOCAL_CHECKS_REPORTED_PASSED')
    expect(result.firstAction).toContain('native one-shot preflight')
    expect(result.steps.every(s=>s.state==='ready')).toBe(true)
    expect(result.freeSingleGpuMiB).toBe(10040)
    expect(result.publicationAuthorized).toBe(false)
    expect(result.modelExecuted).toBe(false)
  })
  it('rejects forged render/publication or a fake technical pass',async()=>{
    for(const flag of ['modelLicenseReviewed','creativeApprovalGranted',
      'gpuExecutionAuthorized','actualModelInferenceCompleted',
      'publicReleaseAuthorized'] as const){
      const item=await diagnostic()
      item.readiness[flag]=true
      await expect(inspectLaunchpadJson(JSON.stringify(item),kit)).rejects.toThrow('authority')
    }
    for(const flag of ['networkUsed','modelDownloaded','gpuInferenceStarted'] as const){
      const item=await diagnostic()
      item[flag]=true
      await expect(inspectLaunchpadJson(JSON.stringify(item),kit)).rejects.toThrow()
    }
    const fake=await diagnostic()
    fake.readiness.status='TECHNICAL_PROBES_PASSED_NEEDS_HUMAN_REVIEW'
    fake.readiness.allRequiredChecksObserved=true
    await expect(inspectLaunchpadJson(JSON.stringify(fake),kit)).rejects.toThrow()
  })
  it('never sums two underqualified GPU devices to meet the one-device floor',async()=>{
    const report=await diagnostic()
    report.prerequisites.nvidiaSmi={status:'FOUND',executable:'C:\\nvidia-smi.exe'}
    report.prerequisites.gpus=[
      {name:'RTX 3060',vramFreeMiB:7900,index:0},
      {name:'RTX 3060',vramFreeMiB:7900,index:1},
    ]
    report.prerequisites.availableResources.bestSingleGpuFreeMiB=7900
    const result=await inspectLaunchpadJson(JSON.stringify(report),kit)
    expect(result.freeSingleGpuMiB).toBe(7900)
    expect(result.steps.find(s=>s.id==='gpu')?.state).toBe('blocked')
    report.prerequisites.availableResources.bestSingleGpuFreeMiB=15800
    await expect(inspectLaunchpadJson(JSON.stringify(report),kit))
      .rejects.toThrow('cannot combine GPUs')
  })
  it('rejects changed source packet, contradictory hash claim and invented checkpoint approval',async()=>{
    const item=await ready()
    const other=pilotPreproductionPacket('2026-10-26T23:41:00.000Z')
    await expect(inspectLaunchpadJson(JSON.stringify(item),other))
      .rejects.toThrow('does not match')
    item.prerequisites.checkpointHash.observedSha256='0'.repeat(64)
    await expect(inspectLaunchpadJson(JSON.stringify(item),kit))
      .rejects.toThrow('internally inconsistent')
    const malformed=await diagnostic()
    malformed.prerequisites.wanCheckpoint.status='FOUND_UNVERIFIED'
    await expect(inspectLaunchpadJson(JSON.stringify(malformed),kit))
      .rejects.toThrow('checkpoint presence')
  })
  it('rejects malformed JSON, unknown keys and overlarge reports',async()=>{
    const item=await diagnostic()
    await expect(inspectLaunchpadJson('not json',kit)).rejects.toThrow('Invalid JSON')
    await expect(inspectLaunchpadJson(JSON.stringify({...item,publishNow:true}),kit))
      .rejects.toThrow('top-level fields')
    await expect(inspectLaunchpadJson(JSON.stringify(item)+' '.repeat(REEL_LAUNCHPAD_MAX_BYTES),kit))
      .rejects.toThrow('128 KiB')
  })
  it('is part of the actual REEL Pilot 001 page with immutable RCTV 50-channel rules',()=>{
    const html=renderToStaticMarkup(<ReelPilotDesk onUsePitch={()=>{}}/>)
    expect(html).toContain('Windows Launchpad')
    expect(html).toContain('First-Frame Production Preflight')
    expect(html).toContain('Evidence &amp; Preview Desk')
    expect(html).not.toContain('<video')
    expect(CHANNEL_LINEUP).toHaveLength(50)
    expect(CHANNEL_LINEUP.some(x=>x.source.id==='reel-p001-s01')).toBe(false)
  })
})
