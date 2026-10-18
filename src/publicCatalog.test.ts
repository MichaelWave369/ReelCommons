import { describe, expect, it } from 'vitest'
import { ageOfSnapshot, parsePublicSnapshot, visiblePublicTitles } from './publicCatalog'

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
