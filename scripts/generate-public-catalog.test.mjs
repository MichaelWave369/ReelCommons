import test from 'node:test'
import assert from 'node:assert/strict'
import { generateSnapshot, normalizeMedia, normalizeProviders, validOfficialTrailer, validatePosterPath } from './generate-public-catalog.mjs'

test('provider options remain separate per region', () => {
  const values = normalizeProviders({
    US: { link: 'https://www.themoviedb.org/movie/100/watch?locale=US', free: [{ provider_id: 1, provider_name: 'Service A' }] },
    GB: { link: 'javascript:alert(1)', ads: [{ provider_id: 2, provider_name: 'Service B' }] },
  }, '2026-10-18T12:00:00Z')
  assert.equal(values.US.free[0].provider_name, 'Service A')
  assert.equal(values.US.ads.length, 0)
  assert.equal(values.GB.free.length, 0)
  assert.equal(values.GB.ads[0].provider_name, 'Service B')
  assert.equal(values.GB.link, null)
})

test('only verified media records with free/ads providers are included', () => {
  const details = { id: 100, title: 'Test Movie', release_date: '1999-06-11', adult: false, genres: [{ id: 35, name: 'Comedy' }] }
  assert.equal(normalizeMedia(details, 'movie', {}, '2026-10-18T00:00:00Z'), null)
  const accepted = normalizeMedia(details, 'movie', { US: { ads: [{ provider_id: 20, provider_name: 'Ad Provider' }] } }, '2026-10-18T00:00:00Z')
  assert.equal(accepted?.title, 'Test Movie')
  assert.equal(accepted?.availabilityByRegion.US.ads.length, 1)
  assert.equal(accepted?.availabilityByRegion.GB.ads.length, 0)
})

test('poster and trailer sources are guarded', () => {
  assert.equal(validatePosterPath('/image123.jpg'), '/image123.jpg')
  assert.equal(validatePosterPath('/../secret'), null)
  assert.equal(validOfficialTrailer({ results: [{ site: 'YouTube', type: 'Trailer', official: false, key: 'abcdefghijk' }] }), null)
  assert.equal(validOfficialTrailer({ results: [{ site: 'YouTube', type: 'Trailer', official: true, key: 'abcdefghijk' }] }), 'https://www.youtube.com/watch?v=abcdefghijk')
})

test('generator refuses missing token and incomplete provider responses', async () => {
  await assert.rejects(() => generateSnapshot({ token: '' }), /TMDB_READ_ACCESS_TOKEN/)
  const req = async (endpoint) => {
    if (endpoint.includes('/discover/')) return { results: [{ id: 100, adult: false }] }
    if (endpoint.endsWith('/watch/providers')) return {}
    return { id: 100, title: 'A Test', name: 'A Test' }
  }
  await assert.rejects(() => generateSnapshot({ token: '0123456789abcdef', request: req }), /Malformed TMDB provider response/)
})

test('generator deduplicates across regions and records freshness', async () => {
  const calls = []
  const req = async (endpoint) => {
    calls.push(endpoint)
    if (endpoint.includes('/discover/')) return { results: [{ id: 100, adult: false }] }
    if (endpoint.endsWith('/watch/providers')) return { results: { US: { free: [{ provider_id: 1, provider_name: 'Test Service' }] } } }
    const mediaType = endpoint.startsWith('/movie/') ? 'movie' : 'tv'
    return { id: 100, title: mediaType === 'movie' ? 'A Movie' : undefined, name: mediaType === 'tv' ? 'A Show' : undefined }
  }
  const snapshot = await generateSnapshot({ token: '0123456789abcdef', request: req, now: () => new Date('2026-10-18T12:00:00.000Z') })
  assert.equal(snapshot.generatedAt, '2026-10-18T12:00:00.000Z')
  assert.equal(snapshot.records.length, 2)
  assert.equal(calls.filter((u) => u.endsWith('/watch/providers')).length, 2)
})
