import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import ReelPilotDesk from './ReelPilotDesk'
import ReelNetwork from './ReelNetwork'
import {
  REEL_PILOT_DURATION,REEL_PILOT_GATES,REEL_PILOT_PITCH,REEL_PILOT_SCHEMA,
  REEL_PILOT_SHOTS,REEL_PILOT_STATUS,pilotMarkdown,pilotPreproductionPacket,
  pilotShotsCsv,pilotSrt,pilotTimecode,validatePilotTimeline,
} from './reelPilot'
import {CHANNEL_LINEUP} from './channelSurf'
import {playableUrl} from './openStreams'

const timestamp='2026-10-25T23:41:00.000Z'

describe('REEL Originals Pilot 001 · eight-shot preproduction',()=>{
  it('contains exactly eight consecutive, bounded and uniquely identified story beats',()=>{
    expect(REEL_PILOT_SHOTS).toHaveLength(8)
    expect(REEL_PILOT_SHOTS[0].startSeconds).toBe(0)
    expect(REEL_PILOT_SHOTS[7].startSeconds+REEL_PILOT_SHOTS[7].durationSeconds).toBe(REEL_PILOT_DURATION)
    expect(REEL_PILOT_DURATION).toBe(74)
    expect(validatePilotTimeline()).toBe(true)
    expect(new Set(REEL_PILOT_SHOTS.map(shot=>shot.id)).size).toBe(8)
    expect(REEL_PILOT_SHOTS.every(shot=>shot.durationSeconds<=60)).toBe(true)
    expect(REEL_PILOT_SHOTS.every(shot=>shot.voiceover.length>10&&shot.imagePrompt.length>30)).toBe(true)
    const broken=REEL_PILOT_SHOTS.map(x=>({...x}))
    broken[3].startSeconds=999
    expect(validatePilotTimeline(broken)).toBe(false)
    broken[3].startSeconds=27
    broken[5].durationSeconds=0
    expect(validatePilotTimeline(broken)).toBe(false)
  })
  it('produces consistent human-readable script and valid subtitle timing',()=>{
    expect(pilotTimecode(0)).toBe('00:00:00')
    expect(pilotTimecode(74)).toBe('00:01:14')
    expect(()=>pilotTimecode(-1)).toThrow()
    expect(()=>pilotTimecode(1.5)).toThrow()
    const script=pilotMarkdown()
    const srt=pilotSrt()
    expect(script).toContain('The First Transmission')
    expect(script).toContain('**Status:** Original preproduction draft, not rendered')
    expect(script).toContain('**Historic inspiration:**')
    expect(script).toContain('This is a NEW REEL adaptation')
    expect(script).toContain('### P001-S01 · 00:00:00–00:00:08')
    expect(script).toContain('### P001-S08 · 00:01:06–00:01:14')
    expect(srt).toContain('00:00:00,000 --> 00:00:08,000')
    expect(srt).toContain('00:01:06,000 --> 00:01:14,000')
    expect((srt.match(/ --> /g)??[])).toHaveLength(8)
    expect(srt).toContain(REEL_PILOT_SHOTS[7].voiceover)
    expect(REEL_PILOT_GATES).toHaveLength(8)
    expect((script.match(/- \[ \]/g)??[])).toHaveLength(8)
  })
  it('exports an editable production package while denying every approval or media claim',()=>{
    const packet=pilotPreproductionPacket(timestamp,'Human notes go here')
    expect(packet.schema).toBe(REEL_PILOT_SCHEMA)
    expect(packet.id).toBe('REEL-P001')
    expect(packet.status).toBe(REEL_PILOT_STATUS)
    expect(packet.pilotDurationSeconds).toBe(74)
    expect(packet.localProductionNotes).toBe('Human notes go here')
    expect(packet.shots).toEqual(REEL_PILOT_SHOTS)
    expect(packet.reviewGates.map(x=>x.id)).toEqual(REEL_PILOT_GATES.map(x=>x.id))
    expect(packet.reviewGates.every(x=>x.status==='not_reviewed'&&x.releaseAuthority===false)).toBe(true)
    expect(Object.values(packet.authority).every(x=>x===false)).toBe(true)
    expect(packet.handoff.thisPackageIsNativeCineSwarmPlan).toBe(false)
    expect(packet.handoff.existingPitchSchema).toBe('REEL_NETWORK_PITCH_PACKET_V1')
    expect(packet.credits.visualAssets).toBe('uncreated')
    expect(packet.credits.narrationArtist).toBe('unassigned')
    expect(packet.legacyInspiration).toContain('Newly authored REEL adaptation')
    const json=JSON.stringify(packet)
    for(const forbidden of ['"published":true','"rightsVerified":true',
      'youtube-nocookie.com','streamguys1.com','api_key','jobExecutionAccepted']){
      expect(json).not.toContain(forbidden)
    }
  })
  it('rejects invalid export notes and malformed timestamps',()=>{
    expect(()=>pilotPreproductionPacket('yesterday')).toThrow('date')
    expect(()=>pilotPreproductionPacket('2026-13-99T23:41:00.000Z')).toThrow()
    expect(()=>pilotPreproductionPacket(timestamp,'X'.repeat(2001))).toThrow('limit')
    expect(pilotPreproductionPacket(timestamp,'hello\u0000world').localProductionNotes).toBe('hello world')
  })
  it('exports a spreadsheet-readable quoted shot list from the SAME source timeline',()=>{
    const csv=pilotShotsCsv()
    expect(csv.split('\r\n').filter(Boolean)).toHaveLength(9)
    expect(csv).toContain('"P001-S01","0","8"')
    expect(csv).toContain('"P001-S08","66","8"')
    expect(csv).toContain('"voiceover"')
    for(const shot of REEL_PILOT_SHOTS){
      expect(csv).toContain(shot.voiceover)
      expect(csv).toContain(shot.imagePrompt)
    }
  })
  it('prepopulates the existing REEL pitch fields with a fictional original candidate',()=>{
    expect(REEL_PILOT_PITCH).toMatchObject({
      title:'The First Transmission',show:'REEL Originals',
      format:'series',claimClass:'fiction',
    })
    expect(REEL_PILOT_PITCH.concept).toContain('74-second')
    expect(REEL_PILOT_PITCH.concept.length).toBeLessThanOrEqual(1200)
  })
  it('renders the full storyboard but never fake video, audio or released channel',()=>{
    const html=renderToStaticMarkup(<ReelPilotDesk onUsePitch={()=>{}}/>)
    expect(html).toContain('REEL ORIGINALS / PILOT 001 / IN DEVELOPMENT')
    expect(html).toContain('The First Transmission')
    expect(html).toContain('SHOT 01')
    expect(html).toContain('SHOT 08')
    expect(html).toContain('NOT RENDERED')
    expect(html).toContain('Download preproduction JSON')
    expect(html).toContain('Send concept to REEL Pitch Desk')
    expect(html).toContain('Human production checklist')
    expect(html).toContain('aria-pressed="true"')
    expect(html).not.toContain('<video')
    expect(html).not.toContain('<audio')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('autoplay=')
    expect(html).not.toContain('on air now')
  })
  it('keeps the complete REEL page and original 50 official RCTV channel slots distinct',()=>{
    const html=renderToStaticMarkup(<ReelNetwork/>)
    expect(html).toContain('The First Transmission')
    expect(html).toContain('Director&#x27;s storyboard')
    expect(html).toContain('CineSwarm Production Handoff')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('<audio')
    expect(CHANNEL_LINEUP).toHaveLength(50)
    expect(CHANNEL_LINEUP.some(x=>x.source.id.startsWith('reel-'))).toBe(false)
    expect(CHANNEL_LINEUP.every(x=>x.source.playback==='official'||playableUrl(x.source)!==null)).toBe(true)
  })
})
