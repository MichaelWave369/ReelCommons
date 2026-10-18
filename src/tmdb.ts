export type MediaType = 'movie' | 'tv'
export type CatalogView = 'browse' | 'search'
export type AvailabilityKind = 'ads' | 'free'
export interface TitleCard {
  id: number
  mediaType: MediaType
  title: string
  overview: string
  year: string
  posterPath: string | null
  backdropPath: string | null
  rating: number | null
  voteCount: number
  genreIds: number[]
}
export interface Genre { id: number; name: string }
export interface Provider { provider_id: number; provider_name: string; logo_path: string | null }
export interface Availability {
  country: string
  link: string | null
  free: Provider[]
  ads: Provider[]
  checkedAt: string
  error: string | null
}
export interface TitleDetails extends TitleCard {
  runtime: number | null
  genres: Genre[]
  cast: { id: number; name: string; character: string }[]
  trailerUrl: string | null
  availability: Availability
}

export const REGIONS = [
  { code: 'US', name: 'United States' }, { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' }, { code: 'NZ', name: 'New Zealand' },
] as const

const BASE = 'https://api.themoviedb.org/3'
const IMAGE_BASE = 'https://image.tmdb.org/t/p/'

export function posterUrl(path: string | null | undefined, size: 'w185' | 'w342' | 'w500' = 'w342'): string | null {
  if (!path || !/^\/[a-zA-Z0-9_.-]+$/.test(path) || path.includes('..')) return null
  return IMAGE_BASE + size + path
}

export function tmdbTitleUrl(item: Pick<TitleCard, 'id' | 'mediaType'>): string {
  return 'https://www.themoviedb.org/' + item.mediaType + '/' + item.id
}

export function buildCatalogUrl(options: {
  mediaType: MediaType; view: CatalogView; region: string
  query: string; page: number; genre: number | null
}): string {
  const { mediaType, view, region, query, page, genre } = options
  const path = view === 'search' ? '/search/' + mediaType : '/discover/' + mediaType
  const params = new URLSearchParams({
    include_adult: 'false', language: 'en-US',
    page: String(Math.max(1, Math.min(500, page))),
  })
  if (view === 'search') {
    params.set('query', query.trim())
  } else {
    params.set('sort_by', 'popularity.desc')
    params.set('watch_region', region)
    params.set('with_watch_monetization_types', 'free|ads')
    if (genre !== null) params.set('with_genres', String(genre))
  }
  return BASE + path + '?' + params.toString()
}

type RawTitle = {
  id?: unknown; title?: unknown; name?: unknown; overview?: unknown
  release_date?: unknown; first_air_date?: unknown; poster_path?: unknown
  backdrop_path?: unknown; vote_average?: unknown; vote_count?: unknown
  genre_ids?: unknown; adult?: unknown
}
function getString(value: unknown): string { return typeof value === 'string' ? value : '' }
export function normalizeTitle(raw: RawTitle, mediaType: MediaType): TitleCard | null {
  if (raw.adult === true) return null
  if (!Number.isInteger(raw.id) || (raw.id as number) <= 0) return null
  const title = getString(mediaType === 'movie' ? raw.title : raw.name).trim()
  if (!title) return null
  const date = getString(mediaType === 'movie' ? raw.release_date : raw.first_air_date)
  const rating = typeof raw.vote_average === 'number' && Number.isFinite(raw.vote_average) && raw.vote_average > 0 ? Math.min(10, Math.max(0, raw.vote_average)) : null
  return {
    id: raw.id as number, mediaType, title, overview: getString(raw.overview),
    year: /^\d{4}/.test(date) ? date.slice(0, 4) : 'Year unknown',
    posterPath: getString(raw.poster_path) || null,
    backdropPath: getString(raw.backdrop_path) || null,
    rating,
    voteCount: typeof raw.vote_count === 'number' ? Math.max(0, raw.vote_count) : 0,
    genreIds: Array.isArray(raw.genre_ids) ? raw.genre_ids.filter((id): id is number => typeof id === 'number' && Number.isInteger(id)) : [],
  }
}

async function request<T>(url: string, token: string, signal?: AbortSignal): Promise<T> {
  // Tokens are supplied by each visitor and held in React memory only.
  // No application-wide credential is bundled in the static website.
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
    signal, cache: 'no-store',
  })
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error('TMDB denied this token. Check your API Read Access Token.')
    if (response.status === 429) throw new Error('TMDB rate limit reached. Please try again later.')
    throw new Error('TMDB request failed (HTTP ' + response.status + ').')
  }
  return response.json() as Promise<T>
}

export async function fetchGenres(token: string, mediaType: MediaType, signal?: AbortSignal): Promise<Genre[]> {
  const response = await request<{ genres?: Genre[] }>(BASE + '/genre/' + mediaType + '/list?language=en', token, signal)
  return Array.isArray(response.genres) ? response.genres.filter((g) => Number.isInteger(g.id) && typeof g.name === 'string') : []
}

export async function fetchCatalog(token: string, options: {
  mediaType: MediaType; view: CatalogView; region: string
  query: string; page: number; genre: number | null
}, signal?: AbortSignal): Promise<{ results: TitleCard[]; totalPages: number }> {
  const response = await request<{ results?: RawTitle[]; total_pages?: number }>(buildCatalogUrl(options), token, signal)
  return {
    results: Array.isArray(response.results) ? response.results.map((r) => normalizeTitle(r, options.mediaType)).filter((x): x is TitleCard => x !== null) : [],
    totalPages: Math.max(1, Math.min(500, typeof response.total_pages === 'number' ? response.total_pages : 1)),
  }
}

export function parseAvailability(data: unknown, region: string, checkedAt: string): Availability {
  const fallback: Availability = { country: region, link: null, free: [], ads: [], checkedAt, error: null }
  if (!data || typeof data !== 'object' || !('results' in data)) return fallback
  const results = (data as { results?: Record<string, unknown> }).results
  if (!results || typeof results !== 'object') return fallback
  const selected = results[region]
  if (!selected || typeof selected !== 'object') return fallback
  const record = selected as Record<string, unknown>
  const parseList = (key: AvailabilityKind): Provider[] =>
    Array.isArray(record[key])
      ? record[key].filter((p: unknown): p is Provider => {
        if (!p || typeof p !== 'object') return false
        const v = p as Partial<Provider>
        return Number.isInteger(v.provider_id) && typeof v.provider_name === 'string' && v.provider_name.length > 0
      })
      : []
  const rawLink = typeof record.link === 'string' ? record.link : ''
  let link: string | null = null
  try {
    const url = new URL(rawLink)
    if (url.protocol === 'https:' && (url.hostname === 'www.themoviedb.org' || url.hostname === 'themoviedb.org')) link = url.href
  } catch { /* missing external link */ }
  return { ...fallback, link, free: parseList('free'), ads: parseList('ads') }
}

export async function fetchDetails(
  token: string, item: TitleCard, region: string, signal?: AbortSignal,
): Promise<TitleDetails> {
  const path = BASE + '/' + item.mediaType + '/' + item.id
  const detailsUrl = path + '?language=en-US&append_to_response=credits%2Cvideos'
  type RawDetails = RawTitle & {
    runtime?: number; episode_run_time?: number[]; genres?: Genre[]
    credits?: { cast?: { id: number; name: string; character: string }[] }
    videos?: { results?: { site?: string; type?: string; official?: boolean; key?: string }[] }
  }
  // Availability failures must not make the rest of the title detail fail.
  const [details, providers] = await Promise.allSettled([
    request<RawDetails>(detailsUrl, token, signal),
    request<unknown>(path + '/watch/providers', token, signal),
  ])
  if (details.status === 'rejected') throw details.reason
  const raw = details.value
  const base = normalizeTitle(raw, item.mediaType) ?? item
  const checkedAt = new Date().toISOString()
  const availability = providers.status === 'fulfilled'
    ? parseAvailability(providers.value, region, checkedAt)
    : { country: region, link: null, free: [], ads: [], checkedAt, error: 'Provider information could not be checked.' }
  const candidates = Array.isArray(raw.videos?.results) ? raw.videos.results : []
  const trailer = candidates.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official === true && /^[a-zA-Z0-9_-]{11}$/.test(v.key ?? ''))
    ?? candidates.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && /^[a-zA-Z0-9_-]{11}$/.test(v.key ?? ''))
  const runtime = item.mediaType === 'movie' ? raw.runtime : raw.episode_run_time?.[0]
  return {
    ...base,
    runtime: typeof runtime === 'number' && runtime > 0 ? runtime : null,
    genres: Array.isArray(raw.genres) ? raw.genres.filter((g) => Number.isInteger(g.id) && typeof g.name === 'string') : [],
    cast: Array.isArray(raw.credits?.cast) ? raw.credits.cast.filter((c) => typeof c.name === 'string').slice(0, 8) : [],
    trailerUrl: trailer ? 'https://www.youtube.com/watch?v=' + trailer.key : null,
    availability,
  }
}
