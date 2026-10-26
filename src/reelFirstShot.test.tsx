import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import ReelFirstShotHandoff from './ReelFirstShotHandoff'
import ReelPilotDesk from './ReelPilotDesk'
import {pilotPreproductionPacket} from './reelPilot'
import {sha256ReelJson} from './reelNativePreview'
import {
  inspectReelFirstShot,REEL_FIRST_SHOT_MAX_BYTES,
  REEL_FIRST_SHOT_PREFLIGHT_SCHEMA,
} from './reelFirstShot'
import {CHANNEL_LINEUP} from './channelSurf'

const kit=pilotPreproductionPacket('2026-10-25T23:41:00.000Z')
async function nativeEnvelope() {
  const sourceHash=await sha256ReelJson(kit)
  const nativeCandidatePlan={
    schemaVersion:'production-plan/v1',
    projectId:'reel-p001-'+sourceHash.slice(0,12),
    idempotencyKey:'p001-s01-wan21-'+sourceHash.slice(0,32),
    lineage:{sourceSystem:'REEL_P001',sourceHash},
    shots:[{
      shotId:'reel-p001-s01',
      prompt:kit.shots[0].imagePrompt,
      durationSeconds:8,
      delivery:{width:1280,height:720,fps:24,container:'mp4'},
      backendPreference:['wan21-t2v-1.3b'],conditioning:[] as unknown[],seed:369,
      acceptanceEligible:true,publicReleaseAuthorized:false,
    }],
  }
  return {
    schema:REEL_FIRST_SHOT_PREFLIGHT_SCHEMA,
    mode:'OFFLINE_REAL_SHOT_CANDIDATE_NOT_SUBMITTED',
    status:'AWAITING_MANUAL_PRODUCTION_APPROVAL',
    sourceHash,nativePlanHash:await sha256ReelJson(nativeCandidatePlan),
    shotSourceId:'P001-S01',scriptedDurationSeconds:8,
    modelBackend:'wan21-t2v-1.3b',nativeResolution:[832,480],
    nativeFps:16,deliveryResolution:[1280,720],deliveryFps:24,native720p:false,
    gpuModelExecuted:false,mediaRendered:false,assetHashVerified:false,
    rightsVerified:false,humanProductionApprovalGranted:false,
    publicReleaseAuthorized:false,coordinatorContacted:false,
    modelDownloaded:false,nativeCandidatePlan,
    readiness:{status:'NOT_CHECKED',localHardwareObserved:false,
      modelHashVerified:false,schedulerViable:false,
      reason:'Run --check-local on an authorized local workstation for observed readiness.'},
  }
}
describe('REEL v3.6 · first real shot preflight, never an executed movie',()=>{
  it('shows local-first production guidance without installing a model or fetching media',()=>{
    const html=renderToStaticMarkup(<ReelFirstShotHandoff preparedKit={null}/>)
    expect(html).toContain('First-Frame Production Preflight')
    expect(html).toContain('Wan 2.1')
    expect(html).toContain('python -m cineswarm.reel_shot_one')
    expect(html).toContain('--check-local')
    expect(html).toContain('NO CURRENT KIT EXPORTED')
    expect(html).not.toContain('<audio')
    expect(html).not.toContain('<video')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('autoplay=')
  })
  it('accepts the exact original eight-second first-shot Wan21 candidate and correlates active kit hash',async()=>{
    const input=await nativeEnvelope()
    const result=await inspectReelFirstShot(JSON.stringify(input),kit)
    expect(result).toMatchObject({
      origin:'MATCHED_ACTIVE_PILOT_KIT',
      reportedReadiness:'NOT_CHECKED',
      backend:'wan21-t2v-1.3b',
      shotId:'reel-p001-s01',
      native:'832×480 / 16 fps',
      delivery:'1280×720 / 24 fps (scaled)',
      status:'NEEDS_HUMAN_AUTHORIZATION_NO_RENDER',
    })
    const unlinked=await inspectReelFirstShot(JSON.stringify(input))
    expect(unlinked.origin).toBe('UNLINKED_EDITABLE_LOCAL_FILE')
  })
  it('rejects fake rendered media, model permissions, rights and release',async()=>{
    for(const field of [
      'gpuModelExecuted','mediaRendered','assetHashVerified',
      'rightsVerified','humanProductionApprovalGranted',
      'publicReleaseAuthorized','coordinatorContacted','modelDownloaded',
    ] as const){
      const input=await nativeEnvelope()
      input[field]=true
      await expect(inspectReelFirstShot(JSON.stringify(input),kit)).rejects.toThrow()
    }
  })
  it('rejects model swap, fake test-only backend, release, resolution and conditioning',async()=>{
    const badBackend=await nativeEnvelope()
    badBackend.nativeCandidatePlan.shots[0].backendPreference=['unreviewed-provider']
    badBackend.nativePlanHash=await sha256ReelJson(badBackend.nativeCandidatePlan)
    await expect(inspectReelFirstShot(JSON.stringify(badBackend),kit)).rejects.toThrow('Native plan')
    const badRelease=await nativeEnvelope()
    badRelease.nativeCandidatePlan.shots[0].publicReleaseAuthorized=true
    badRelease.nativePlanHash=await sha256ReelJson(badRelease.nativeCandidatePlan)
    await expect(inspectReelFirstShot(JSON.stringify(badRelease),kit)).rejects.toThrow()
    const conditioned=await nativeEnvelope()
    conditioned.nativeCandidatePlan.shots[0].conditioning=['user/path.mp4']
    conditioned.nativePlanHash=await sha256ReelJson(conditioned.nativeCandidatePlan)
    await expect(inspectReelFirstShot(JSON.stringify(conditioned),kit)).rejects.toThrow()
    const fake4k=await nativeEnvelope()
    fake4k.nativeResolution=[3840,2160]
    await expect(inspectReelFirstShot(JSON.stringify(fake4k),kit)).rejects.toThrow()
  })
  it('rejects corrupt hashes, fabricated source packets, extra fields or nonstandard shot counts',async()=>{
    const corrupt=await nativeEnvelope()
    corrupt.nativePlanHash='1'.repeat(64)
    await expect(inspectReelFirstShot(JSON.stringify(corrupt),kit))
      .rejects.toThrow('SHA-256')
    const forged=await nativeEnvelope()
    forged.sourceHash='0'.repeat(64)
    await expect(inspectReelFirstShot(JSON.stringify(forged),kit)).rejects.toThrow()
    const other=await nativeEnvelope()
    const unrelated=pilotPreproductionPacket('2026-10-25T23:42:00.000Z')
    await expect(inspectReelFirstShot(JSON.stringify(other),unrelated))
      .rejects.toThrow('does not match the current REEL pilot kit')
    const extra=await nativeEnvelope()
    await expect(inspectReelFirstShot(JSON.stringify({...extra,autoExecute:true}),kit))
      .rejects.toThrow('unknown fields')
    const over=await nativeEnvelope()
    await expect(inspectReelFirstShot(JSON.stringify(over)+' '.repeat(REEL_FIRST_SHOT_MAX_BYTES),kit))
      .rejects.toThrow('128 KiB')
  })
  it('validates reported local readiness but does not convert it into real execution permission',async()=>{
    const passed=await nativeEnvelope()
    passed.readiness={
      status:'OPERATOR_REVIEW_REQUIRED',localHardwareObserved:true,
      modelHashVerified:true,schedulerViable:true,
      modelLicenseReviewed:false,humanProductionApprovalGranted:false,
      reason:'Pinned checkpoint fits local declared scheduler; still requires human review.',
    } as typeof passed.readiness
    const result=await inspectReelFirstShot(JSON.stringify(passed),kit)
    expect(result.reportedReadiness).toBe('OPERATOR_REVIEW_REQUIRED')
    expect(result.status).toBe('NEEDS_HUMAN_AUTHORIZATION_NO_RENDER')
    const fake=await nativeEnvelope()
    fake.readiness.status='OPERATOR_REVIEW_REQUIRED'
    await expect(inspectReelFirstShot(JSON.stringify(fake),kit)).rejects.toThrow()
  })
  it('shows first shot from existing pilot desk, with 50 third-party channels untouched',()=>{
    const html=renderToStaticMarkup(<ReelPilotDesk onUsePitch={()=>{}}/>)
    expect(html).toContain('First-Frame Production Preflight')
    expect(html).toContain('Download preproduction JSON')
    expect(html).not.toContain('<video')
    expect(html).not.toContain('<iframe')
    expect(CHANNEL_LINEUP).toHaveLength(50)
    expect(CHANNEL_LINEUP.some(x=>x.source.id==='reel-p001-s01')).toBe(false)
  })
})
