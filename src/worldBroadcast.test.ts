import { describe, expect, it } from 'vitest'
import {
  WORLD_BROADCAST_API, WORLD_BROADCAST_FAVORITES_KEY,
  attachBroadcastLanguages, broadcastGuideCoverage, filterBroadcastChannels,
  normalizeBroadcastChannels, normalizeBroadcastOptions, officialBroadcastUrl,
  readBroadcastFavorites, toggleBroadcastFavorite,
} from './worldBroadcast'

const input = [
  { id: 'ExampleNews.us', name: 'Example News', country: 'US', categories: ['news'],
    website: 'https://news.example.org/watch', closed: null, is_nsfw: false },
  { id: 'CultureTV.fr', name: 'Culture TV', country: 'FR', categories: ['culture'],
    website: 'https://culture.example.org/', closed: null, is_nsfw: false },
  { id: 'Archived.us', name: 'Archived', country: 'US', categories: ['general'],
    website: 'https://archive.example.org', closed: '2022-01-01', is_nsfw: false },
  { id: 'Adult.us', name: 'Adult', country: 'US', categories: ['adult'],
    website: 'https://adult.example.org', closed: null, is_nsfw: true },
  { id: 'Local.us', name: 'Local', country: 'US', categories: ['news'],
    website: 'https://127.0.0.1/private', closed: null, is_nsfw: false },
  { id: 'Insecure.us', name: 'Insecure', country: 'US', categories: ['news'],
    website: 'http://insecure.example.org', closed: null, is_nsfw: false },
  { id: 'ExampleNews.us', name: 'Duplicate News', country: 'US', categories: ['news'],
    website: 'https://different.example.org', closed: null, is_nsfw: false },
]
const channels = attachBroadcastLanguages(normalizeBroadcastChannels(input), [
  { channel: 'ExampleNews.us', languages: ['eng'] },
  { channel: 'CultureTV.fr', languages: ['fra'] },
  { channel: 'CultureTV.fr', languages: ['fra', 'eng'] },
  { channel: 'Unknown.us', languages: ['eng'] },
])

describe('World Broadcast Atlas: source-only trust boundary', () => {
  it('only accepts public HTTPS broadcaster websites, never localhost or credential-bearing URLs', () => {
    expect(officialBroadcastUrl('https://station.example.org/watch')).toBe('https://station.example.org/watch')
    for (const value of ['http://station.example.org', 'https://localhost/admin',
      'https://127.0.0.1/private', 'https://10.0.0.5/', 'https://[::1]/',
      'https://user:pass@station.example.org', 'https://station.example.org:4443',
      'javascript:alert(1)', 'https://stream.local/index.m3u8', null]) {
      expect(officialBroadcastUrl(value)).toBeNull()
    }
  })
  it('keeps only open non-adult channels with reviewable official sites; deduplicates ids', () => {
    expect(channels.map((channel) => channel.id)).toEqual(['CultureTV.fr', 'ExampleNews.us'])
    expect(channels[0].officialUrl).toBe('https://culture.example.org/')
    expect(channels[0].languages).toEqual(['fra', 'eng'])
    expect(channels[1].languages).toEqual(['eng'])
    for (const channel of channels) {
      expect(channel).not.toHaveProperty('stream')
      expect(channel).not.toHaveProperty('streamUrl')
      expect(channel).not.toHaveProperty('playback')
      expect(channel).not.toHaveProperty('logo')
    }
  })
  it('validates and bounds country/category/language metadata and rejects malformed catalogs', () => {
    expect(() => normalizeBroadcastChannels({ a: 1 })).toThrow('not a list')
    expect(normalizeBroadcastChannels([42, {}, { ...input[0], id: 'bad<id' }])).toEqual([])
    expect(normalizeBroadcastOptions([{ name: 'United States', code: 'US' },
      { name: 'Unknown', code: '@@' }], 'countries')).toEqual([{ id: 'US', label: 'United States' }])
    expect(normalizeBroadcastOptions([{ id: 'news', name: 'News' },
      { id: '__proto__', name: 'Unsafe' }], 'categories')).toEqual([{ id: 'news', label: 'News' }])
    expect(normalizeBroadcastOptions([{ code: 'eng', name: 'English' },
      { code: 'English', name: 'wrong' }], 'languages')).toEqual([{ id: 'eng', label: 'English' }])
  })
  it('filters search, country, category, language and favorites without network calls', () => {
    expect(filterBroadcastChannels(channels, '', 'US', '', '', [], false).map((c) => c.id))
      .toEqual(['ExampleNews.us'])
    expect(filterBroadcastChannels(channels, 'culture', '', '', '', [], false)).toHaveLength(1)
    expect(filterBroadcastChannels(channels, '', '', 'news', 'fra', [], false)).toHaveLength(0)
    expect(filterBroadcastChannels(channels, '', '', 'culture', 'fra', [], false)).toHaveLength(1)
    expect(filterBroadcastChannels(channels, '', '', '', '', ['CultureTV.fr'], true).map((c) => c.id))
      .toEqual(['CultureTV.fr'])
  })
  it('quarantines forged or oversized browser favorites', () => {
    expect(WORLD_BROADCAST_FAVORITES_KEY).toContain('world-broadcast')
    expect(readBroadcastFavorites('broken json', channels)).toEqual([])
    expect(readBroadcastFavorites(JSON.stringify(['CultureTV.fr', 'CultureTV.fr', 'bad', null, 12]), channels))
      .toEqual(['CultureTV.fr'])
    expect(toggleBroadcastFavorite(['CultureTV.fr'], 'CultureTV.fr')).toEqual([])
    expect(toggleBroadcastFavorite(['CultureTV.fr'], 'ExampleNews.us')).toEqual(['CultureTV.fr','ExampleNews.us'])
  })
  it('treats EPG data as source coverage only, not TV listings or broadcast availability', () => {
    const coverage = broadcastGuideCoverage([
      { channel: 'ExampleNews.us', sources: [{ url: 'https://example.org/epg.xml' }] },
      { channel: 'CultureTV.fr', sources: [] },
      { channel: 'Unknown.us', sources: [{ url: 'https://example.org/guide.xml' }] },
    ], channels)
    expect([...coverage]).toEqual(['ExampleNews.us'])
    expect(WORLD_BROADCAST_API).toBe('https://iptv-org.github.io/api/')
    expect(WORLD_BROADCAST_API).not.toContain('streams')
  })
})
