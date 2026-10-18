import { describe, expect, it } from 'vitest'
import { filterLiveSources, isOfficialSourceUrl, liveSources, parseFavorites, pickSource } from './liveTv'

const all = { kind: 'all' as const, genre: 'all' as const, query: '', favoritesOnly: false, favorites: [] as string[] }

describe('FTA and official free live-source catalog', () => {
  it('uses official https sources only, with unique IDs and no stream manifests', () => {
    expect(new Set(liveSources.map((s) => s.id)).size).toBe(liveSources.length)
    expect(liveSources.every(isOfficialSourceUrl)).toBe(true)
    expect(liveSources.every((s) => !/\\.(m3u8?|mpd|ts)(\\?|$)/i.test(s.url))).toBe(true)
    expect(liveSources.every((s) => s.verifiedSource.length > 0)).toBe(true)
  })
  it('keeps over-the-air reception separate from internet FAST streaming', () => {
    expect(filterLiveSources(liveSources, { ...all, kind: 'antenna' }).map((s) => s.id)).toEqual(['fcc-ota'])
    expect(filterLiveSources(liveSources, { ...all, kind: 'fast' }).every((s) => s.kind === 'fast')).toBe(true)
    expect(filterLiveSources(liveSources, { ...all, kind: 'public' }).map((s) => s.id)).toEqual(['pbs-live', 'nasa-live'])
  })
  it('filters by genre, query and favorites together', () => {
    const found = filterLiveSources(liveSources, { ...all, kind: 'fast', genre: 'sports', query: 'plex', favoritesOnly: true, favorites: ['plex-live'] })
    expect(found.map((s) => s.id)).toEqual(['plex-live'])
    expect(filterLiveSources(liveSources, { ...all, query: 'zzz-not-found' })).toHaveLength(0)
  })
  it('cleans stored favorites against current allowlist without crashing', () => {
    expect(parseFavorites('broken')).toEqual([])
    expect(parseFavorites(JSON.stringify(['pluto', 'unknown', 'pluto', 'nasa-live']))).toEqual(['pluto', 'nasa-live'])
    expect(parseFavorites('"oops"')).toEqual([])
    expect(parseFavorites('x'.repeat(6000))).toEqual([])
  })
  it('random chooser cannot return an unavailable service', () => {
    const list = filterLiveSources(liveSources, { ...all, kind: 'antenna' })
    expect(pickSource(list, () => 0)?.id).toBe('fcc-ota')
    expect(pickSource([], () => 0)).toBeNull()
    expect(pickSource(liveSources, () => Number.NaN)?.id).toBe('pluto')
  })
})
