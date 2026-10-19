import { describe, expect, it } from 'vitest'
import { ALL_OPEN_STREAMS, CAMERA_COUNTS, CAMERA_STREAMS } from './cameraCatalog'
import { filterCameraScene, filterOpenStreams, playableUrl, readCommonsFavorites } from './openStreams'
describe('v1.4 original curated city and nature directory', () => {
  it('adds exactly 7 city and 13 nature stations without colliding with prior ids', () => {
    expect(CAMERA_COUNTS).toEqual({ cities: 7, nature: 13, total: 20 })
    expect(ALL_OPEN_STREAMS.length).toBe(50)
    expect(new Set(ALL_OPEN_STREAMS.map((c) => c.id)).size).toBe(50)
  })
  it('all added cameras point to actual official HTTPS publication destinations', () => {
    for (const item of CAMERA_STREAMS) {
      const uri = new URL(item.officialUrl)
      expect(uri.protocol).toBe('https:')
      expect(uri.username).toBe('')
      expect(uri.password).toBe('')
      expect(uri.hostname.replace(/^www\./, '')).toBe(item.officialDomain)
      expect(item.sourceEvidence).toBe(item.officialUrl)
      expect(item.place?.length).toBeGreaterThan(4)
      expect(item.cameraScene).toBeDefined()
      expect(item.cameraFormat).toBeDefined()
      expect(item.playbackNote.length).toBeGreaterThan(30)
    }
  })
  it('no camera URL can be silently upgraded to an iframe or audio player', () => {
    for (const item of CAMERA_STREAMS) {
      expect(item.playback).toBe('official')
      expect(playableUrl(item)).toBeNull()
      expect(playableUrl({ ...item, playback: 'youtube-embed', youtubeId: 'jKHvbJe9c_Y' })).toBeNull()
      expect(playableUrl({ ...item, playback: 'published-audio', audioUrl: 'https://kexp.streamguys1.com/kexp160.aac' })).toBeNull()
    }
  })
  it('separates continuously-listed video from NPS still-frame webcams and other mixed sources', () => {
    expect(CAMERA_STREAMS.find(x => x.id === 'grand-canyon-south-rim')?.cameraFormat).toBe('refreshed-still')
    expect(CAMERA_STREAMS.find(x => x.id === 'yellowstone-geysers')?.cameraFormat).toBe('mixed')
    expect(CAMERA_STREAMS.find(x => x.id === 'smithsonian-pandas')?.cameraFormat).toBe('mixed')
    expect(CAMERA_STREAMS.find(x => x.id === 'nyc-times-square')?.cameraFormat).toBe('video')
  })
  it('filters cities, park views and volcano stations independently from radio/video', () => {
    expect(filterOpenStreams(ALL_OPEN_STREAMS, 'city', '', [], false)).toHaveLength(7)
    expect(filterOpenStreams(ALL_OPEN_STREAMS, 'nature', '', [], false)).toHaveLength(13)
    expect(filterCameraScene(ALL_OPEN_STREAMS, 'volcanoes')).toHaveLength(2)
    expect(filterCameraScene(ALL_OPEN_STREAMS, 'national-parks')).toHaveLength(5)
    expect(filterCameraScene(ALL_OPEN_STREAMS, 'streets')).toHaveLength(4)
    expect(filterCameraScene(ALL_OPEN_STREAMS, 'ocean')).toHaveLength(2)
  })
  it('allows saved new cameras only if their catalog ids are known', () => {
    const data = readCommonsFavorites(JSON.stringify(['nyc-times-square','yosemite-valley','bogus']), ALL_OPEN_STREAMS)
    expect(data).toEqual(['nyc-times-square','yosemite-valley'])
    expect(filterOpenStreams(ALL_OPEN_STREAMS, 'nature','',data,true).map(x=>x.id)).toEqual(['yosemite-valley'])
  })
  it('keeps third-party ownership and camera refresh caveats visible', () => {
    const yosemite = CAMERA_STREAMS.find(c => c.id === 'yosemite-valley')!
    expect(yosemite.playbackNote).toContain('usage agreement')
    expect(yosemite.region).toContain('stale')
    const panda = CAMERA_STREAMS.find(c => c.id === 'smithsonian-pandas')!
    expect(panda.region).toContain('prerecorded')
    expect(panda.officialDomain).toBe('nationalzoo.si.edu')
  })
})
