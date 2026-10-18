import { describe, expect, it } from 'vitest'
import { buildCatalogUrl, normalizeTitle, parseAvailability, posterUrl, tmdbTitleUrl } from './tmdb'

describe('free catalog queries', () => {
  it('requests regional free or ad-supported discovery', () => {
    const url = new URL(buildCatalogUrl({ mediaType: 'movie', view: 'browse', region: 'GB', query: '', page: 3, genre: 35 }))
    expect(url.pathname).toBe('/3/discover/movie')
    expect(url.searchParams.get('watch_region')).toBe('GB')
    expect(url.searchParams.get('with_watch_monetization_types')).toBe('free|ads')
    expect(url.searchParams.get('with_genres')).toBe('35')
    expect(url.searchParams.get('page')).toBe('3')
  })
  it('does not promise free availability for a title search', () => {
    const url = new URL(buildCatalogUrl({ mediaType: 'tv', view: 'search', region: 'US', query: ' Twin Peaks ', page: 1, genre: null }))
    expect(url.pathname).toBe('/3/search/tv')
    expect(url.searchParams.get('query')).toBe('Twin Peaks')
    expect(url.searchParams.has('with_watch_monetization_types')).toBe(false)
  })
})

describe('safe catalog data', () => {
  it('normalizes a movie without inventing a rating', () => {
    const movie = normalizeTitle({ id: 42, title: 'A Test Film', release_date: '1991-07-12', overview: 'A movie', vote_average: 0, genre_ids: [35] }, 'movie')
    expect(movie?.title).toBe('A Test Film')
    expect(movie?.year).toBe('1991')
    expect(movie?.rating).toBeNull()
  })
  it('ignores adult entries and malformed records', () => {
    expect(normalizeTitle({ id: 1, title: 'X', adult: true }, 'movie')).toBeNull()
    expect(normalizeTitle({ id: 0, title: 'Wrong' }, 'movie')).toBeNull()
  })
  it('restricts poster URLs to TMDB image paths', () => {
    expect(posterUrl('/good.jpg')).toBe('https://image.tmdb.org/t/p/w342/good.jpg')
    expect(posterUrl('https://example.com/a.jpg')).toBeNull()
    expect(posterUrl('/../secrets')).toBeNull()
  })
  it('builds official details URLs', () => {
    expect(tmdbTitleUrl({ id: 987, mediaType: 'tv' })).toBe('https://www.themoviedb.org/tv/987')
  })
})

describe('regional streaming evidence', () => {
  it('keeps free and ad-supported separate and accepts TMDB destination only', () => {
    const info = parseAvailability({
      results: {
        US: {
          link: 'https://www.themoviedb.org/movie/42/watch?locale=US',
          free: [{ provider_id: 1, provider_name: 'FreeOne', logo_path: null }],
          ads: [{ provider_id: 2, provider_name: 'AdOne', logo_path: null }],
        },
        GB: { free: [{ provider_id: 3, provider_name: 'DifferentRegion' }] },
      },
    }, 'US', '2026-10-18T00:00:00Z')
    expect(info.free.map((p) => p.provider_name)).toEqual(['FreeOne'])
    expect(info.ads.map((p) => p.provider_name)).toEqual(['AdOne'])
    expect(info.link).toContain('themoviedb.org')
    expect(info.country).toBe('US')
  })
  it('will not follow untrusted watch links', () => {
    expect(parseAvailability({ results: { US: { link: 'https://evil.example/path', free: [] } } }, 'US', 'today').link).toBeNull()
  })
  it('does not fabricate provider availability when a region is missing', () => {
    const value = parseAvailability({ results: { DE: { free: [{ provider_id: 1, provider_name: 'DE Only' }] } } }, 'US', 'now')
    expect(value.free).toEqual([])
    expect(value.link).toBeNull()
  })
})
