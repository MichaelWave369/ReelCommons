import { describe, expect, it } from 'vitest'
import {
  COMMONS_FAVORITES_KEY, filterOpenStreams, OPEN_STREAMS, playableUrl, playbackLabel, readCommonsFavorites,
} from './openStreams'
describe('RCTV Open Streams curated source integrity', () => {
  it('has four categories, HTTPS official destinations and no duplicated ids', () => {
    expect(new Set(OPEN_STREAMS.map((s) => s.id)).size).toBe(OPEN_STREAMS.length)
    expect(new Set(OPEN_STREAMS.map((s) => s.category))).toEqual(new Set(['tv','radio','earth','space']))
    for (const s of OPEN_STREAMS) {
      expect(s.officialUrl.startsWith('https://')).toBe(true)
      expect(s.sourceEvidence.length).toBeGreaterThan(8)
      expect(s.playbackNote.length).toBeGreaterThan(10)
    }
    expect(COMMONS_FAVORITES_KEY).toContain('open-streams')
  })
  it('enforces SomaFM official-player-only despite public audio endpoints', () => {
    const source = OPEN_STREAMS.find((s) => s.id === 'somafm')!
    expect(source.playback).toBe('official')
    expect(playableUrl(source)).toBeNull()
    expect(source.playbackNote).toContain('prohibits')
  })
  it('allows only the reviewed official NASA iframe and broadcaster-published KEXP AAC URL', () => {
    const iss = OPEN_STREAMS.find((s) => s.id === 'nasa-iss')!
    expect(playableUrl(iss)).toBe('https://www.youtube-nocookie.com/embed/jKHvbJe9c_Y?rel=0')
    expect(playbackLabel(iss)).toBe('OPTIONAL EMBED')
    const radio = OPEN_STREAMS.find((s) => s.id === 'kexp')!
    expect(playableUrl(radio)).toBe('https://kexp.streamguys1.com/kexp160.aac')
    expect(playbackLabel(radio)).toContain('AUDIO')
    expect(playableUrl({...radio,audioUrl:'https://evil.example/audio.mp3'})).toBeNull()
    expect(playableUrl({...iss, youtubeId:'abcdefghijk'})).toBeNull()
    expect(playableUrl({...iss, id:'other-id'})).toBeNull()
  })
  it('filters categories, search, and favorites without external discovery requests', () => {
    expect(filterOpenStreams(OPEN_STREAMS,'space','nasa',[],false).length).toBe(2)
    expect(filterOpenStreams(OPEN_STREAMS,'radio','music',[],false).length).toBeGreaterThan(1)
    expect(filterOpenStreams(OPEN_STREAMS,'all','',['kexp'],true).map(s=>s.id)).toEqual(['kexp'])
    expect(filterOpenStreams(OPEN_STREAMS,'earth','nothing-matches',[],false)).toHaveLength(0)
  })
  it('treats favorite storage as untrusted and bounds it to catalog ids', () => {
    expect(readCommonsFavorites('wrong-json')).toEqual([])
    expect(readCommonsFavorites(JSON.stringify(['kexp','kexp','somafm','bogus',true]))).toEqual(['kexp','somafm'])
  })
  it('never auto-loads third party media just from an arbitrary URL field', () => {
    for (const s of OPEN_STREAMS) {
      if (s.playback === 'official') expect(playableUrl(s)).toBeNull()
    }
    const source = OPEN_STREAMS.find(s => s.id === 'cbs-news')!
    expect(playableUrl({...source, playback:'published-audio', audioUrl:'https://music.evil.example/feed'})).toBeNull()
  })
})
