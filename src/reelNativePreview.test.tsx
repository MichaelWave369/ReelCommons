import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import ReelCineHandoff from './ReelCineHandoff'
import {
  REEL_NATIVE_MAX_BYTES,REEL_NATIVE_PREVIEW_SCHEMA,
  inspectReelNativePreview,sha256ReelJson,canonicalReelJson,
} from './reelNativePreview'
import {createReelPitchPacket} from './reelNetwork'

const pitch=createReelPitchPacket({
  title:'Pilot',show:'REEL Originals',creatorCredit:'Original creator',
  concept:'An original short test story.',format:'series',
  claimClass:'fiction',sourceWorld:'Original work',
},'2026-10-25T23:00:00.000Z')

async function fixture(){
  const digest=await sha256ReelJson(pitch)
  const plan={
    schemaVersion:'production-plan/v1',
    projectId:'reel-dryrun-'+digest.slice(0,12),
    idempotencyKey:'reel-dryrun-'+digest.slice(0,32),
    lineage:{sourceSystem:'REEL_DRAFT',sourceHash:digest},
    shots:[{
      shotId:'reel-rehearsal-001',
      prompt:'TEST FIXTURE ONLY; no produced or licensed media. Original REEL creator concept, pending human rights and editorial review: '+pitch.pitch.concept,
      durationSeconds:1,
      delivery:{width:1280,height:720,fps:24,container:'mp4'},
      backendPreference:['deterministic-test'],conditioning:[],seed:369,
      acceptanceEligible:false,publicReleaseAuthorized:false,
    }],
  }
  return {
    schema:REEL_NATIVE_PREVIEW_SCHEMA,
    sourceSchema:'REEL_NETWORK_PITCH_PACKET_V1',
    inputHash:digest,outputPlanHash:await sha256ReelJson(plan),
    mode:'LOCAL_DRYRUN_ONLY',status:'VALIDATED_NOT_SUBMITTED',
    executionTriggered:false,mediaRendered:false,rightsVerified:false,
    humanReleaseAuthorized:false,publicationAuthorized:false,
    nativeTestPlan:plan,nextStep:'This is a local test-only plan.',
  }
}
describe('REEL v3.4 native dry-run preview inspector',()=>{
  it('shows clear no-broadcast preview instructions but never makes a media request',()=>{
    const html=renderToStaticMarkup(<ReelCineHandoff currentPitch={null}/>)
    expect(html).toContain('CineSwarm Production Handoff')
    expect(html).toContain('python -m cineswarm.reel_intake')
    expect(html).toContain('NO CURRENT PITCH SELECTED')
    expect(html).toContain('deterministic-test')
    expect(html).toContain('acceptanceEligible=false')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('<audio')
    expect(html).not.toContain('<video')
    expect(html).not.toContain('autoplay=')
  })
  it('uses stable recursive canonical JSON serialization for content-hash integrity',async()=>{
    const left={b:2,a:{d:'Ω',c:[true,null,'abc']}}
    const right={a:{c:[true,null,'abc'],d:'Ω'},b:2}
    expect(canonicalReelJson(left)).toBe('{"a":{"c":[true,null,"abc"],"d":"Ω"},"b":2}')
    expect(await sha256ReelJson(left)).toBe(await sha256ReelJson(right))
  })
  it('validates a test-only native plan against the precise current browser pitch',async()=>{
    const input=await fixture()
    const result=await inspectReelNativePreview(JSON.stringify(input),pitch)
    expect(result).toMatchObject({
      result:'MATCHED_CURRENT_LOCAL_PITCH',
      inputHash:input.inputHash,nativePlanHash:input.outputPlanHash,
      testBackend:'deterministic-test',permission:'NO_EXECUTION_OR_PUBLICATION',
      shotId:'reel-rehearsal-001',
    })
    const unrelated=await inspectReelNativePreview(JSON.stringify(input))
    expect(unrelated.result).toBe('UNLINKED_SOURCE_NOT_AUTHENTICATED')
    expect(unrelated.permission).toBe('NO_EXECUTION_OR_PUBLICATION')
  })
  it('rejects upgraded execution, fake approvals, release and real model injection',async()=>{
    for(const key of ['executionTriggered','mediaRendered','rightsVerified',
      'humanReleaseAuthorized','publicationAuthorized'] as const){
      const bad=await fixture()
      bad[key]=true
      await expect(inspectReelNativePreview(JSON.stringify(bad),pitch)).rejects.toThrow()
    }
    const newBackend=await fixture()
    newBackend.nativeTestPlan.shots[0].backendPreference=['wan22-ti2v-5b']
    newBackend.outputPlanHash=await sha256ReelJson(newBackend.nativeTestPlan)
    await expect(inspectReelNativePreview(JSON.stringify(newBackend),pitch))
      .rejects.toThrow('promote a real backend')
    const released=await fixture()
    released.nativeTestPlan.shots[0].publicReleaseAuthorized=true
    released.outputPlanHash=await sha256ReelJson(released.nativeTestPlan)
    await expect(inspectReelNativePreview(JSON.stringify(released),pitch)).rejects.toThrow()
  })
  it('refuses a forged input hash, changed prompt or altered native plan digest',async()=>{
    const altered=await fixture()
    altered.inputHash='0'.repeat(64)
    await expect(inspectReelNativePreview(JSON.stringify(altered),pitch)).rejects.toThrow()
    const changed=await fixture()
    changed.nativeTestPlan.shots[0].prompt='Different invented footage'
    changed.outputPlanHash=await sha256ReelJson(changed.nativeTestPlan)
    await expect(inspectReelNativePreview(JSON.stringify(changed),pitch)).rejects.toThrow()
    const corrupt=await fixture()
    corrupt.outputPlanHash='a'.repeat(64)
    await expect(inspectReelNativePreview(JSON.stringify(corrupt),pitch))
      .rejects.toThrow('SHA-256 mismatch')
  })
  it('rejects unrelated source packet and oversize locally imported file',async()=>{
    const input=await fixture()
    const otherPitch=createReelPitchPacket({
      ...pitch.pitch,concept:'Something else altogether.',
    },pitch.createdUtc)
    await expect(inspectReelNativePreview(JSON.stringify(input),otherPitch))
      .rejects.toThrow('not derived from the current REEL pitch')
    await expect(inspectReelNativePreview('x'.repeat(REEL_NATIVE_MAX_BYTES+1),pitch))
      .rejects.toThrow('64 KiB')
    await expect(inspectReelNativePreview('{bad',pitch)).rejects.toThrow('Not a valid')
    const extra=await fixture()
    await expect(inspectReelNativePreview(JSON.stringify({...extra,autoPublish:true}),pitch))
      .rejects.toThrow('unknown fields')
  })
})
