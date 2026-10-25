import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import ReelNetwork from './ReelNetwork'
import UnifiedTvHub from './UnifiedTvHub'
import {
  REEL_LANES,REEL_OFFICES,REEL_NETWORK_SCHEMA,REEL_NETWORK_PROVENANCE,
  REEL_REFERENCES,createReelPitchPacket,reelPitchFilename,reelPitchJson,
  validateReelPitch,
} from './reelNetwork'
import type {ReelPitchInput} from './reelNetwork'
import {CHANNEL_LINEUP} from './channelSurf'
import {playableUrl} from './openStreams'

const pitch:ReelPitchInput={
  title:'Episode 001',show:'REEL Voices',concept:'A new original podcast',
  creatorCredit:'Guest creator',format:'podcast',claimClass:'opinion',
  sourceWorld:'Original ideas',
}
const timestamp='2026-10-25T23:40:00.000Z'
const nasa=CHANNEL_LINEUP.find(x=>x.source.id==='nasa-iss')!.source

describe('REEL Network foundation · private creative work orders',()=>{
  it('offers eight visibly conceptual programming lanes without inventing any licensed channels',()=>{
    expect(REEL_LANES).toHaveLength(8)
    expect(new Set(REEL_LANES.map(x=>x.id)).size).toBe(8)
    expect(REEL_LANES.map(x=>x.id)).toEqual([
      'series','film','game-review','music','podcast','documentary','comedy','experimental',
    ])
    expect(REEL_LANES.every(x=>x.futureChannel.includes('no channel assigned'))).toBe(true)
    expect(CHANNEL_LINEUP).toHaveLength(50)
    expect(CHANNEL_LINEUP.some(x=>x.source.id==='reel-originals')).toBe(false)
    expect(CHANNEL_LINEUP.every(x=>x.source.playback==='official'||playableUrl(x.source)!==null)).toBe(true)
  })
  it('maps studio office responsibilities but does not claim that agents have executed',()=>{
    expect(REEL_OFFICES.length).toBeGreaterThan(8)
    expect(new Set(REEL_OFFICES.map(x=>x.id)).size).toBe(REEL_OFFICES.length)
    expect(REEL_OFFICES.map(x=>x.id)).toContain('production')
    expect(REEL_OFFICES.map(x=>x.id)).toContain('rights')
    expect(REEL_OFFICES.map(x=>x.id)).toContain('release')
    const packet=createReelPitchPacket(pitch,timestamp)
    expect(packet.workOrders).toHaveLength(REEL_OFFICES.length)
    expect(packet.workOrders.every(x=>x.state==='not_started'&&x.executionAuthorized===false))
      .toBe(true)
    expect(packet.workOrders.find(x=>x.officeId==='production')?.office).toContain('CineSwarm')
  })
  it('exports a local planning packet with neither public approval nor fake CineSwarm authority',()=>{
    const packet=createReelPitchPacket(pitch,timestamp)
    expect(packet.schema).toBe(REEL_NETWORK_SCHEMA)
    expect(packet.provenance).toBe(REEL_NETWORK_PROVENANCE)
    expect(packet.network).toBe('REEL')
    expect(packet.hostProject).toBe('ReelCommons')
    expect(packet.originPipeline).toContain('CineSwarm')
    expect(packet.pitch).toEqual(pitch)
    expect(packet.review).toMatchObject({
      creatorRights:'unverified',sourceLicense:'unverified',
      claims:'not_audited',humanAccepted:false,
      humanReleaseAuthorized:false,publicationStatus:'not_published',
    })
    expect(packet.authority).toEqual({
      localPlanningOnly:true,cinemaProductionTriggered:false,
      videoRendered:false,autoImport:false,broadcastAuthorized:false,
      networkPublishingAuthorized:false,knownChannelNumber:null,
    })
    expect(packet.nextStep).toContain('NOT a CineSwarm-native production plan')
    const json=reelPitchJson(packet)
    expect(JSON.parse(json)).toEqual(packet)
    for(const forbidden of ['streamguys1.com','youtube-nocookie.com','api_key',
      'bearer_token','webhook_url','approved_channel_url']) {
      expect(json).not.toContain(forbidden)
    }
  })
  it('accepts only validated program formats/classes and bounded text',()=>{
    expect(()=>validateReelPitch({...pitch,title:' '})).toThrow('required')
    expect(()=>validateReelPitch({...pitch,concept:' '})).toThrow('required')
    expect(()=>validateReelPitch({...pitch,creatorCredit:' '})).toThrow('required')
    expect(()=>validateReelPitch({...pitch,format:'hls-stream' as ReelPitchInput['format']}))
      .toThrow('supported')
    expect(()=>validateReelPitch({...pitch,claimClass:'verified-true' as ReelPitchInput['claimClass']}))
      .toThrow('supported')
    const cleaned=validateReelPitch({...pitch,title:' Hi\u0000 there '.repeat(80),
      concept:'A'.repeat(4000)})
    expect(cleaned.title.length).toBeLessThanOrEqual(120)
    expect(cleaned.concept.length).toBe(1200)
    expect(cleaned.title).not.toContain('\u0000')
    expect(()=>createReelPitchPacket(pitch,'yesterday')).toThrow()
  })
  it('makes downloads deterministic and safe, not executable file types',()=>{
    expect(reelPitchFilename('Our SHOW! Ep#1')).toBe('reel-pitch-our-show-ep-1.json')
    expect(reelPitchFilename('../../secrets')).toBe('reel-pitch-secrets.json')
    expect(reelPitchFilename('$$$$')).toBe('reel-pitch-untitled.json')
    expect(reelPitchFilename('x'.repeat(300)).length).toBeLessThan(90)
  })
  it('renders a cinematic network pitch with no media loading or fake on-air output',()=>{
    const html=renderToStaticMarkup(<ReelNetwork/>)
    expect(html).toContain('REEL')
    expect(html).toContain('Our shows. Our worlds. Our network.')
    expect(html).toContain('PRODUCTION / NOT ON AIR')
    expect(html).toContain('REEL Voices')
    expect(html).toContain('CineSwarm Production')
    expect(html).toContain('PUBLIC REEL EPISODES VERIFIED HERE')
    expect(html).toContain('Open pitch desk')
    expect(html).not.toContain('<audio')
    expect(html).not.toContain('<video')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('autoplay=')
    expect(html).not.toContain('getUserMedia(')
    expect(html).not.toContain('approved and released')
  })
  it('includes REEL as a fifth navigation choice without changing original station',()=>{
    const html=renderToStaticMarkup(<UnifiedTvHub selected={nasa} favoriteIds={[]}
      recentIds={[]} onSelect={()=>{}} onOpenMain={()=>{}} onOpenCouch={()=>{}}
      onOpenReviewed={()=>{}} onOpenStudio={()=>{}} onOpenNetwork={()=>{}}/>)
    expect(html).toContain('REEL Network')
    expect(html).toContain('05 · PRODUCE')
    expect(html).toContain('CH 013')
    expect(html).toContain('Creator Studio')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('<audio')
  })
  it('grounds references in separately existing creative repos, not live agent APIs',()=>{
    expect(REEL_REFERENCES.cineswarm).toBe('https://github.com/MichaelWave369/CineSwarm')
    expect(REEL_REFERENCES.legacyNetwork).toBe('https://github.com/MichaelWave369/parallax-network')
    expect(REEL_REFERENCES.paracut).toContain('/paracut')
    expect(REEL_REFERENCES.waveforge).toContain('/WaveForgeStudio')
  })
})
