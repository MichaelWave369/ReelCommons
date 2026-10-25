import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import CreatorStudio from './CreatorStudio'
import {
  CREATOR_STUDIO_PROVENANCE,CREATOR_STUDIO_SCHEMA,creatorEpisodeManifest,
  exportCreatorEpisodeManifest,recordingExtension,safeStudioFilename,
  supportedRecordingMime,
} from './creatorStudioModel'
import type {CreatorProjectInput} from './creatorStudioModel'

const draft:CreatorProjectInput={
  show:'Our RCTV Show',title:'Kickoff: Live From Home',
  description:'A self-owned original episode',notes:'00:00 Intro\n01:25 Conversation',
  mode:'microphone',
}

describe('RCTV v3.2 Creator Studio · local-first production',()=>{
  it('does not mount media inputs or request microphone permission before opening',()=>{
    const html=renderToStaticMarkup(<CreatorStudio/>)
    expect(html).toContain('Broadcasting &amp; Podcast Studio')
    expect(html).toContain('Open Creator Studio')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('OWNED MEDIA ONLY')
    expect(html).not.toContain('<audio')
    expect(html).not.toContain('<video')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('getUserMedia(')
    expect(html).not.toContain('MediaRecorder(')
  })
  it('selects only browser-supported MIME types with an honest unsupported fallback',()=>{
    expect(supportedRecordingMime('microphone',(mime)=>mime==='audio/webm'))
      .toBe('audio/webm')
    expect(supportedRecordingMime('microphone',(mime)=>mime==='audio/mp4'))
      .toBe('audio/mp4')
    expect(supportedRecordingMime('camera-microphone',(mime)=>mime==='video/mp4'))
      .toBe('video/mp4')
    expect(supportedRecordingMime('camera-microphone',(mime)=>mime==='audio/webm'))
      .toBeNull()
    expect(supportedRecordingMime('microphone',()=>false)).toBeNull()
    expect(recordingExtension('audio/mp4')).toBe('m4a')
    expect(recordingExtension('audio/ogg')).toBe('ogg')
    expect(recordingExtension('video/mp4')).toBe('mp4')
    expect(recordingExtension('video/webm')).toBe('webm')
  })
  it('generates safe bounded filenames without paths or pasted HTML',()=>{
    expect(safeStudioFilename('Episode 01: Hello?','webm')).toBe('episode-01-hello.webm')
    expect(safeStudioFilename('../../Downloads/<script>x</script>','m4a'))
      .toBe('downloads-script-x-script.m4a')
    expect(safeStudioFilename('%%%','ogg')).toBe('rctv-episode.ogg')
    expect(safeStudioFilename('a'.repeat(300),'webm').length).toBeLessThan(70)
  })
  it('exports a reference-only, explicit user-recorded episode not a forged ParaCut project',()=>{
    const manifest=creatorEpisodeManifest(
      draft,
      {mediaFilename:'kickoff-live-from-home.webm',mimeType:'audio/webm',
        byteLength:4096},
      '2026-10-25T23:00:00.000Z',
    )
    expect(manifest.schema).toBe(CREATOR_STUDIO_SCHEMA)
    expect(manifest.provenance).toBe(CREATOR_STUDIO_PROVENANCE)
    expect(manifest.permissions).toEqual({
      recordedWithExplicitUserAction:true,published:false,rightsVerified:false,
      localOnly:true,networkAuthority:false,autoImportAuthority:false,
    })
    expect(manifest.handoff).toMatchObject({
      targetSuggestion:'ParaCut',status:'REFERENCE_ONLY_NOT_NATIVE_PARACUT_DRAFT',
    })
    expect(manifest.output.bytesIncludedInManifest).toBe(false)
    const json=exportCreatorEpisodeManifest(manifest)
    expect(json).toContain('A self-owned original episode')
    expect(json).not.toContain('base64')
    expect(json).not.toContain('mediaRendered')
    expect(json).not.toContain('parallax.bridge.v2')
    expect(json).not.toContain('accessToken')
  })
  it('denies invalid/empty metadata and fake video manifests for audio-only captures',()=>{
    const file={mediaFilename:'take.webm',mimeType:'audio/webm',byteLength:100}
    expect(()=>creatorEpisodeManifest({...draft,title:'  '},file,'2026-10-25T23:00:00.000Z')).toThrow()
    expect(()=>creatorEpisodeManifest(draft,{...file,byteLength:0},'2026-10-25T23:00:00.000Z')).toThrow()
    expect(()=>creatorEpisodeManifest(draft,{...file,mediaFilename:'../evil.webm'},'2026-10-25T23:00:00.000Z')).toThrow()
    expect(()=>creatorEpisodeManifest(draft,{...file,mimeType:'text/html'},'2026-10-25T23:00:00.000Z')).toThrow()
    expect(()=>creatorEpisodeManifest(draft,{...file,mimeType:'video/webm'},'2026-10-25T23:00:00.000Z')).toThrow()
    expect(()=>creatorEpisodeManifest(draft,file,'not-a-date')).toThrow()
    expect(()=>creatorEpisodeManifest({...draft,mode:'camera-microphone'},file,'2026-10-25T23:00:00.000Z')).toThrow()
  })
  it('supports explicitly recorded video metadata without granting publishing authority',()=>{
    const manifest=creatorEpisodeManifest(
      {...draft,mode:'camera-microphone'},
      {mediaFilename:'my-video.mp4',mimeType:'video/mp4',byteLength:150_000},
      '2026-10-25T23:00:00.000Z',
    )
    expect(manifest.episode.captureMode).toBe('camera-microphone')
    expect(manifest.output.mediaFilename).toBe('my-video.mp4')
    expect(manifest.permissions.published).toBe(false)
    expect(manifest.permissions.rightsVerified).toBe(false)
  })
})
