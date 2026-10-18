import { describe, expect, it } from 'vitest'
import { ageOfSnapshot, parsePublicSnapshot, providersForRegion, shortProviderLabels, visiblePublicTitles } from './publicCatalog'

const report = {
  schemaVersion: 1, generatedAt: '2026-10-18T12:00:00Z', source: 'TMDB',
  regions: ['US','GB'], records: [{
    id: 123, title: 'The Example', mediaType: 'movie', year: '1986', overview: 'A fictional comedy',
    genres: [{ id: 35, name: 'Comedy' }], availabilityByRegion: {
      US: { country: 'US', checkedAt: '2026-10-18T12:00:00Z', free: [{ provider_id: 1, provider_name: 'Test Provider' }], ads: [] },
      GB: { country: 'GB', checkedAt: '2026-10-18T12:00:00Z', free: [], ads: [] },
    },
  }],
}
describe('public catalog snapshots', () => {
  it('rejects invalid schema versions', () => expect(() => parsePublicSnapshot({ ...report, schemaVersion: 200 })).toThrow())
  it('retains only provider-backed titles', () => {
    const parsed = parsePublicSnapshot({ ...report, records: [...report.records, { ...report.records[0], id: 333, availabilityByRegion: {} }] })
    expect(parsed.records.length).toBe(1)
  })
  it('keeps region-specific discovery separate', () => {
    const parsed = parsePublicSnapshot(report)
    expect(visiblePublicTitles(parsed.records, { query: '', region: 'US', mediaType: 'all' })).toHaveLength(1)
    expect(visiblePublicTitles(parsed.records, { query: '', region: 'GB', mediaType: 'all' })).toHaveLength(0)
    expect(visiblePublicTitles(parsed.records, { query: 'COMEDY', region: 'US', mediaType: 'movie' })).toHaveLength(1)
  })
  it('flags snapshots older than two days', () => {
    expect(ageOfSnapshot('2026-10-18T00:00:00Z', Date.parse('2026-10-21T00:00:00Z'))?.stale).toBe(true)
    expect(ageOfSnapshot('2026-10-18T00:00:00Z', Date.parse('2026-10-18T12:00:00Z'))?.stale).toBe(false)
  })
})


describe('v0.4 provider evidence and filters', () => {
  const snapshot = parsePublicSnapshot({
    schemaVersion: 1, generatedAt: '2026-10-18T12:00:00Z', source: 'TMDB',
    regions: ['US', 'GB'],
    records: [
      { id: 101, title: 'First movie', mediaType: 'movie', year: '2020', overview: 'One',
        genreIds: [], genres: [], cast: [], availabilityByRegion: {
          US: { country: 'US', checkedAt: '2026-10-18T12:00:00Z', link: null,
            free: [{ provider_id: 20, provider_name: 'Beta Free' }, { provider_id: 30, provider_name: 'Alpha Free' }],
            ads: [{ provider_id: 40, provider_name: 'Delta Ads' }, { provider_id: 20, provider_name: 'Beta Free' }] },
          GB: { country: 'GB', checkedAt: '2026-10-18T12:00:00Z', link: null,
            free: [], ads: [{ provider_id: 60, provider_name: 'London Ads' }] },
        },
      },
      { id: 102, title: 'Second movie', mediaType: 'movie', year: '2021', overview: 'Two',
        genreIds: [], genres: [], cast: [], availabilityByRegion: {
          US: { country: 'US', checkedAt: '2026-10-18T12:00:00Z', link: null,
            free: [], ads: [{ provider_id: 40, provider_name: 'Delta Ads' }] },
          GB: { country: 'GB', checkedAt: '2026-10-18T12:00:00Z', link: null, free: [], ads: [] },
        },
      },
      { id: 103, title: 'A series', mediaType: 'tv', year: '2022', overview: 'Three',
        genreIds: [], genres: [], cast: [], availabilityByRegion: {
          US: { country: 'US', checkedAt: '2026-10-18T12:00:00Z', link: null,
            free: [{ provider_id: 50, provider_name: 'Series Free' }], ads: [] },
          GB: { country: 'GB', checkedAt: '2026-10-18T12:00:00Z', link: null, free: [], ads: [] },
        },
      },
    ],
  })
  const data = snapshot.records
  it('sorts and deduplicates providers by identity without crossing regions', () => {
    expect(providersForRegion(data, { region: 'US', mediaType: 'movie', access: 'all' }).map((p) => p.provider_name))
      .toEqual(['Alpha Free', 'Beta Free', 'Delta Ads'])
    expect(providersForRegion(data, { region: 'GB', mediaType: 'all', access: 'all' }).map((p) => p.provider_name))
      .toEqual(['London Ads'])
    expect(providersForRegion(data, { region: 'US', mediaType: 'tv', access: 'free' }).map((p) => p.provider_name))
      .toEqual(['Series Free'])
  })
  it('filters free vs ads, provider, media type, and region together', () => {
    expect(visiblePublicTitles(data, { query: '', region: 'US', mediaType: 'all', access: 'free' }).map((i) => i.id)).toEqual([101,103])
    expect(visiblePublicTitles(data, { query: '', region: 'US', mediaType: 'movie', access: 'ads', provider: 40 }).map((i) => i.id)).toEqual([101,102])
    expect(visiblePublicTitles(data, { query: '', region: 'US', mediaType: 'movie', access: 'free', provider: 40 })).toEqual([])
    expect(visiblePublicTitles(data, { query: '', region: 'GB', mediaType: 'movie', access: 'ads', provider: 60 }).map((i) => i.id)).toEqual([101])
    expect(visiblePublicTitles(data, { query: 'Second', region: 'US', mediaType: 'all', access: 'ads' }).map((i) => i.id)).toEqual([102])
  })
  it('shows a limited, deduplicated provider summary with count of remainder', () => {
    const report = data[0].availabilityByRegion.US
    expect(shortProviderLabels(report, 'all', 2)).toEqual({ labels: ['Beta Free', 'Alpha Free'], extra: 1 })
    expect(shortProviderLabels(report, 'ads', 1)).toEqual({ labels: ['Delta Ads'], extra: 1 })
    expect(shortProviderLabels(undefined)).toEqual({ labels: [], extra: 0 })
  })
  it('never infers a missing region or free option from a provider in another category', () => {
    expect(visiblePublicTitles(data, { query: '', region: 'GB', mediaType: 'all', access: 'free' })).toEqual([])
    expect(visiblePublicTitles(data, { query: '', region: 'CA', mediaType: 'all', access: 'all' })).toEqual([])
  })
})
