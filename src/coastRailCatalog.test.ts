import { describe, expect, it } from 'vitest'
import { ALL_OPEN_STREAMS } from './cameraCatalog'
import { COAST_RAIL_COUNTS, COAST_RAIL_STREAMS } from './coastRailCatalog'
import {
  filterCameraScene, filterOpenStreams, playableUrl, readCommonsFavorites,
} from './openStreams'
describe('v1.6: official coastline, port, rail and mountain view catalog', () => {
  it('adds exactly 16 destinations, four in each new wing, for 50 total sources', () => {
    expect(COAST_RAIL_COUNTS).toEqual({ beaches: 4, harbors: 4, trains: 4, mountains: 4, total: 16 })
    expect(ALL_OPEN_STREAMS).toHaveLength(50)
    expect(new Set(ALL_OPEN_STREAMS.map(x => x.id)).size).toBe(50)
  })
  it('uses HTTPS official operator sites, no credentials or hidden stream routes', () => {
    for (const source of COAST_RAIL_STREAMS) {
      const parsed = new URL(source.officialUrl)
      expect(parsed.protocol).toBe('https:')
      expect(parsed.username).toBe('')
      expect(parsed.password).toBe('')
      expect(parsed.hostname.replace(/^www\./,'')).toBe(source.officialDomain)
      expect(source.sourceEvidence).toBe(source.officialUrl)
      expect(source.place?.length).toBeGreaterThan(4)
    }
  })
  it('never silently embeds, streams, proxies or plays a new third-party camera', () => {
    for (const source of COAST_RAIL_STREAMS) {
      expect(source.playback).toBe('official')
      expect(playableUrl(source)).toBeNull()
      expect(playableUrl({...source, playback:'youtube-embed', youtubeId:'jKHvbJe9c_Y'})).toBeNull()
      expect(playableUrl({...source, playback:'published-audio', audioUrl:'https://kexp.streamguys1.com/kexp160.aac'})).toBeNull()
    }
  })
  it('tracks four camera formats and scenes, with no automatic uptime certification', () => {
    expect(filterCameraScene(ALL_OPEN_STREAMS, 'beaches')).toHaveLength(4)
    expect(filterCameraScene(ALL_OPEN_STREAMS, 'harbors')).toHaveLength(4)
    expect(filterCameraScene(ALL_OPEN_STREAMS, 'railways')).toHaveLength(4)
    expect(filterCameraScene(ALL_OPEN_STREAMS, 'mountains')).toHaveLength(4)
    expect(COAST_RAIL_STREAMS.every(x => !!x.cameraFormat && !!x.region)).toBe(true)
  })
  it('distinguishes free railcam selections from paid premium cameras', () => {
    const vr = COAST_RAIL_STREAMS.find(x => x.id === 'train-virtualrailfan-free')!
    const rs = COAST_RAIL_STREAMS.find(x => x.id === 'train-railstream-free')!
    expect(vr.playbackNote).toContain('prohibits')
    expect(vr.region).toContain('Premium')
    expect(rs.region).toContain('free selection')
    expect(rs.playbackNote).toContain('Premium')
  })
  it('keeps old camera source availability and favorites while adding new entries', () => {
    expect(filterOpenStreams(ALL_OPEN_STREAMS, 'train','',[],false)).toHaveLength(4)
    expect(filterOpenStreams(ALL_OPEN_STREAMS, 'beach','Santa Monica',[],false)).toHaveLength(1)
    const saved = readCommonsFavorites(JSON.stringify(['new-orleans-bourbon','beach-huntington-pier','train-ashland-va','not-a-channel']), ALL_OPEN_STREAMS)
    expect(saved).toEqual(['new-orleans-bourbon','beach-huntington-pier','train-ashland-va'])
  })
  it('flags mountain snow/weather limits and official harbor cams without inventing access', () => {
    expect(COAST_RAIL_STREAMS.find(x => x.id === 'mountain-washington')?.region).toContain('Ice')
    expect(COAST_RAIL_STREAMS.find(x => x.id === 'harbor-los-angeles')?.officialDomain).toBe('portoflosangeles.org')
    expect(COAST_RAIL_STREAMS.find(x => x.id === 'beach-clearwater')?.cameraFormat).toBe('video')
  })
})
