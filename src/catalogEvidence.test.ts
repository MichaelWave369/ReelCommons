import { describe, expect, it } from 'vitest'
import { encodeSessionSnapshot, evidenceReceipt, restoreSessionSnapshot, snapshotHealth } from './catalogEvidence'
import type { PublicSnapshot } from './publicCatalog'

const base: PublicSnapshot = {
  schemaVersion: 1, source: 'TMDB', generatedAt: '2026-10-18T15:00:00.000Z', regions: ['US', 'GB'],
  records: [{
    id: 987, mediaType: 'movie', title: 'A Test Adventure',
    year: '2000', overview: 'A fictional film', posterPath: null, backdropPath: null,
    rating: 7.7, voteCount: 22, genreIds: [12],
    genres: [{ id: 12, name: 'Adventure' }], runtime: 90, cast: [], trailerUrl: null,
    availabilityByRegion: {
      US: { country: 'US', checkedAt: '2026-10-18T15:00:00.000Z', link: 'https://www.themoviedb.org/movie/987/watch?locale=US',
        free: [{ provider_id: 4, provider_name: 'Public Example' }], ads: [{ provider_id: 5, provider_name: 'Example With Ads' }] },
      GB: { country: 'GB', checkedAt: '2026-10-18T15:00:00.000Z', link: null,
        free: [], ads: [] },
    },
  }],
}

describe('public catalog snapshot resilience', () => {
  const now = Date.parse('2026-10-18T18:00:00.000Z')
  it('labels snapshot age without pretending to verify availability', () => {
    expect(snapshotHealth(base.generatedAt, now)).toBe('current')
    expect(snapshotHealth(base.generatedAt, now + 49 * 60 * 60 * 1000)).toBe('older')
    expect(snapshotHealth(base.generatedAt, now + 8 * 24 * 60 * 60 * 1000)).toBe('expired')
    expect(snapshotHealth('nonsense', now)).toBe('unknown')
    expect(snapshotHealth('2030-01-01T00:00:00Z', now)).toBe('unknown')
  })
  it('accepts a recent bounded public-only snapshot from session storage', () => {
    const raw = encodeSessionSnapshot(base)
    expect(raw).not.toBeNull()
    expect(restoreSessionSnapshot(raw, now)?.records[0].title).toBe('A Test Adventure')
  })
  it('rejects malformed, oversized, expired and tampered session copies', () => {
    expect(restoreSessionSnapshot('not-json', now)).toBeNull()
    expect(restoreSessionSnapshot('a'.repeat(1_500_001), now)).toBeNull()
    expect(restoreSessionSnapshot(JSON.stringify(base), now + 9 * 24 * 60 * 60 * 1000)).toBeNull()
    const unsafe = structuredClone(base)
    unsafe.records[0].availabilityByRegion.US.link = 'https://bad.example/phishing'
    expect(restoreSessionSnapshot(JSON.stringify(unsafe), now)).toBeNull()
    const injected = structuredClone(base)
    injected.records[0].trailerUrl = 'javascript:alert(1)'
    expect(restoreSessionSnapshot(JSON.stringify(injected), now)).toBeNull()
  })
  it('does not store placeholders or empty catalogs', () => {
    expect(encodeSessionSnapshot({ ...base, records: [] })).toBeNull()
    expect(restoreSessionSnapshot(JSON.stringify({ ...base, records: [] }), now)).toBeNull()
  })
})

describe('evidence receipt', () => {
  it('includes accurate reported providers, dates and a clear no-verification disclaimer', () => {
    const receipt = evidenceReceipt(base.records[0], 'US', 'network', base.generatedAt)
    expect(receipt).toContain('Public Example (provider ID 4)')
    expect(receipt).toContain('Example With Ads (provider ID 5)')
    expect(receipt).toContain('JustWatch via TMDB')
    expect(receipt).toContain('Playback checked independently by ReelCommons: NO')
    expect(receipt).toContain('Direct service playback link verified: NO')
  })
  it('separates regions and labels the cached source', () => {
    const receipt = evidenceReceipt(base.records[0], 'GB', 'session-cache', base.generatedAt)
    expect(receipt).not.toContain('Example With Ads')
    expect(receipt).toContain('Browser session fallback copy')
    expect(receipt).toContain('None reported')
  })
  it('never puts an unsafe provider URL into copied provenance', () => {
    const tampered = structuredClone(base.records[0])
    tampered.availabilityByRegion.US.link = 'https://themoviedb.org.evil.example/stream'
    expect(evidenceReceipt(tampered, 'US', 'network', base.generatedAt)).not.toContain('evil.example')
  })
})
