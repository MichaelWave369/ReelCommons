import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import ReelMediaDesk from './ReelMediaDesk'
import ReelPilotDesk from './ReelPilotDesk'
import {
  REEL_MEDIA_EVIDENCE_SCHEMA,REEL_MEDIA_MAX_BYTES,
  verifyReelMediaIntake,
} from './reelMediaIntake'
import {sha256ReelJson} from './reelNativePreview'
import {pilotPreproductionPacket} from './reelPilot'
import {CHANNEL_LINEUP} from './channelSurf'

// Intentionally a 32-byte FAKE MP4 header for hashing tests, not generated footage.
const media=new Blob([
  new Uint8Array([0,0,0,24,102,116,121,112,105,115,111,109,0,0,0,0]),
  new TextEncoder().encode('FAKE_TEST_BYTES_NOT_REAL_MEDIA'),
],{type:'video/mp4'})
const kit=pilotPreproductionPacket('2026-10-25T23:41:00.000Z')
async function hash(blob:Blob):Promise<string>{
  const sha=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())
  return [...new Uint8Array(sha)].map(v=>v.toString(16).padStart(2,'0')).join('')
}
async function evidence(){
  const masterHash=await hash(media)
  return {
    schema:REEL_MEDIA_EVIDENCE_SCHEMA,
    classification:'LOCAL_UNSIGNED_MEDIA_EVIDENCE_NOT_PUBLIC_RELEASE',
    shotId:'reel-p001-s01',
    lineage:{
      sourceHash:await sha256ReelJson(kit),planHash:'c'.repeat(64),
      jobId:'11111111-1111-4111-8111-111111111111',
      taskId:'22222222-2222-4222-8222-222222222222',
    },
    model:{
      backendId:'wan21-t2v-1.3b',modelId:'Wan-AI/Wan2.1-T2V-1.3B',
      recordedCheckpointHash:'b'.repeat(64),runtimeCheckpointRecheckedOnExport:false,
    },
    master:{
      artifactId:'33333333-3333-4333-8333-333333333333',
      sha256:masterHash,sizeBytes:media.size,role:'master',
      width:1280,height:720,fps:24,durationSeconds:8,
    },
    native:{
      artifactId:'44444444-4444-4444-8444-444444444444',
      sha256:'e'.repeat(64),sizeBytes:4096,role:'native',
      width:832,height:480,fps:16,durationSeconds:8.063,
    },
    review:{decision:'PENDING_REVIEW',exactHashDecisionRecorded:false},
    integrity:{
      localReceiptChainVerified:true,receiptCount:8,receiptHeadHash:'f'.repeat(64),
      masterMediaBytesRehashed:true,nativeMediaBytesRehashed:true,
      bothMediaProbesPassed:true,signaturePresent:false,
    },
    authority:{
      sourceRightsVerified:false,musicRightsVerified:false,
      voiceConsentVerified:false,publishingAuthorized:false,
      rctvChannelAssigned:false,
    },
    notice:'Editable unsigned evidence from local CineSwarm database; not proof of copyright licenses, operator identity or publication.',
  }
}
describe('REEL v3.7 exact-hash real media editorial intake',()=>{
  it('requires two explicit files before even rendering any video element',()=>{
    const html=renderToStaticMarkup(<ReelMediaDesk activeKit={null}/>)
    expect(html).toContain('Evidence &amp; Preview Desk')
    expect(html).toContain('ACTUAL MASTER MP4')
    expect(html).toContain('CineSwarm media evidence JSON')
    expect(html).toContain('Verify selected MP4 against evidence')
    expect(html).toContain('disabled')
    expect(html).not.toContain('<video')
    expect(html).not.toContain('<audio')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('autoplay=')
    expect(html).not.toContain('blob:')
  })
  it('re-hashes selected bytes and correlates an exact local pilot kit, without release authorization',async()=>{
    const manifest=await evidence()
    const checked=await verifyReelMediaIntake(JSON.stringify(manifest),media,kit)
    expect(checked).toMatchObject({
      mediaHash:manifest.master.sha256,
      mediaBytes:media.size,
      nativeHashClaim:manifest.native.sha256,
      sourceHash:manifest.lineage.sourceHash,
      sourceMatch:'MATCHED_ACTIVE_PILOT_KIT',
      reviewLabel:'PENDING_REVIEW',
      status:'SELECTED_MP4_BYTES_MATCH_UNSIGNED_LOCAL_EVIDENCE',
      publicationAuthority:false,
    })
    expect((await verifyReelMediaIntake(JSON.stringify(manifest),media))
      .sourceMatch).toBe('UNLINKED_UNSIGNED_SOURCE')
  })
  it('rejects MP4 mismatch, non-MP4 byte signatures and sidecar manipulation',async()=>{
    const a=await evidence()
    const other=new Blob([new Uint8Array(await media.arrayBuffer()),new Uint8Array([9])],{type:'video/mp4'})
    await expect(verifyReelMediaIntake(JSON.stringify(a),other,kit))
      .rejects.toThrow('byte count')
    const corrupt={...a,master:{...a.master,sha256:'a'.repeat(64)}}
    await expect(verifyReelMediaIntake(JSON.stringify(corrupt),media,kit))
      .rejects.toThrow('SHA-256')
    const invalid=new Blob([new TextEncoder().encode('NOT_A_REAL_MP4_FILE_FILE_BYTES')])
    const b=await evidence()
    b.master.sha256=await hash(invalid)
    b.master.sizeBytes=invalid.size
    await expect(verifyReelMediaIntake(JSON.stringify(b),invalid,kit))
      .rejects.toThrow('ftyp')
  })
  it('denies forged local rights, publication, model identity and QC assertions',async()=>{
    const fields=[
      'sourceRightsVerified','musicRightsVerified','voiceConsentVerified',
      'publishingAuthorized','rctvChannelAssigned',
    ] as const
    for(const field of fields){
      const e=await evidence()
      e.authority[field]=true
      await expect(verifyReelMediaIntake(JSON.stringify(e),media,kit)).rejects.toThrow()
    }
    const forged=await evidence()
    forged.model.backendId='deterministic-test'
    await expect(verifyReelMediaIntake(JSON.stringify(forged),media,kit))
      .rejects.toThrow('Wrong model')
    const bad=await evidence()
    bad.integrity.signaturePresent=true
    await expect(verifyReelMediaIntake(JSON.stringify(bad),media,kit))
      .rejects.toThrow()
  })
  it('preserves review state, never promotes QC to publishing authority',async()=>{
    const approved=await evidence()
    approved.review.decision='ACCEPT'
    approved.review.exactHashDecisionRecorded=true
    const result=await verifyReelMediaIntake(JSON.stringify(approved),media,kit)
    expect(result.reviewLabel).toBe('ACCEPT')
    expect(result.publicationAuthority).toBe(false)
    const mismatched=await evidence()
    mismatched.review.decision='REJECT'
    await expect(verifyReelMediaIntake(JSON.stringify(mismatched),media,kit))
      .rejects.toThrow('Human review status')
  })
  it('refuses unrelated kit, unknown fields, excessive file size and fake native data',async()=>{
    const a=await evidence()
    const otherKit=pilotPreproductionPacket('2026-10-25T23:42:00.000Z')
    await expect(verifyReelMediaIntake(JSON.stringify(a),media,otherKit))
      .rejects.toThrow('does not match the current pilot kit')
    await expect(verifyReelMediaIntake(JSON.stringify({...a,hasBroadcast:true}),media,kit))
      .rejects.toThrow('evidence envelope')
    const bad=await evidence()
    bad.native.width=1280
    await expect(verifyReelMediaIntake(JSON.stringify(bad),media,kit))
      .rejects.toThrow('native')
    await expect(verifyReelMediaIntake(JSON.stringify(a),new Blob([
      new Uint8Array(REEL_MEDIA_MAX_BYTES+1),
    ]),kit)).rejects.toThrow('256 MiB')
  })
  it('keeps our RCTV official lineup frozen and pilot page free of auto-loaded media',()=>{
    const html=renderToStaticMarkup(<ReelPilotDesk onUsePitch={()=>{}}/>)
    expect(html).toContain('The First Real Shot')
    expect(html).not.toContain('<video')
    expect(CHANNEL_LINEUP).toHaveLength(50)
    expect(CHANNEL_LINEUP.some(x=>x.source.id==='reel-p001-s01')).toBe(false)
  })
})
