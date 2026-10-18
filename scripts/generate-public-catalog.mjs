import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export const REGIONS = ['US', 'CA', 'GB', 'AU']
export const SCHEMA_VERSION = 1
export const MAX_DISCOVERED_PER_REGION_TYPE = 8
const BASE = 'https://api.themoviedb.org/3'
const RETRIES = 3

export function validatePosterPath(raw) {
  return typeof raw === 'string' && /^\/[a-zA-Z0-9_.-]+$/.test(raw) && !raw.includes('..') ? raw : null
}

export function validOfficialTrailer(raw) {
  if (!raw || typeof raw !== 'object') return null
  const results = Array.isArray(raw.results) ? raw.results : []
  const clip = results.find((v) => v?.site === 'YouTube' && v.type === 'Trailer' && v.official === true && /^[a-zA-Z0-9_-]{11}$/.test(v.key))
  return clip ? 'https://www.youtube.com/watch?v=' + clip.key : null
}

function safeTMDBUrl(value) {
  if (typeof value !== 'string') return null
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' && ['www.themoviedb.org', 'themoviedb.org'].includes(parsed.hostname) ? parsed.href : null
  } catch { return null }
}

function safeProviders(value) {
  return Array.isArray(value) ? value
    .filter((v) => v && Number.isInteger(v.provider_id) && typeof v.provider_name === 'string' && v.provider_name.length > 0)
    .slice(0, 25)
    .map((v) => ({ provider_id: v.provider_id, provider_name: v.provider_name }))
    : []
}

export function normalizeProviders(result, checkedAt) {
  const availabilityByRegion = {}
  for (const region of REGIONS) {
    const raw = result && typeof result === 'object' ? result[region] : null
    availabilityByRegion[region] = {
      country: region,
      checkedAt,
      link: safeTMDBUrl(raw?.link),
      free: safeProviders(raw?.free),
      ads: safeProviders(raw?.ads),
    }
  }
  return availabilityByRegion
}

export function normalizeMedia(detail, mediaType, providerResults, checkedAt) {
  if (!Number.isInteger(detail?.id) || detail.id <= 0 || detail.adult === true) return null
  const title = mediaType === 'movie' ? detail.title : detail.name
  if (typeof title !== 'string' || !title.trim()) return null
  const date = mediaType === 'movie' ? detail.release_date : detail.first_air_date
  const year = typeof date === 'string' && /^\d{4}/.test(date) ? date.slice(0, 4) : 'Year unknown'
  const availabilityByRegion = normalizeProviders(providerResults, checkedAt)
  const hasAnyReportedFree = Object.values(availabilityByRegion).some((v) => v.free.length > 0 || v.ads.length > 0)
  if (!hasAnyReportedFree) return null
  const runtime = mediaType === 'movie' ? detail.runtime : detail.episode_run_time?.[0]
  return {
    id: detail.id, mediaType, title: title.trim(),
    overview: typeof detail.overview === 'string' ? detail.overview : '',
    year, posterPath: validatePosterPath(detail.poster_path),
    backdropPath: validatePosterPath(detail.backdrop_path),
    rating: typeof detail.vote_average === 'number' && Number.isFinite(detail.vote_average) && detail.vote_average > 0
      ? Math.min(10, Math.max(0, detail.vote_average)) : null,
    voteCount: Number.isInteger(detail.vote_count) && detail.vote_count > 0 ? detail.vote_count : 0,
    genreIds: Array.isArray(detail.genres) ? detail.genres.filter((g) => Number.isInteger(g?.id)).map((g) => g.id) : [],
    genres: Array.isArray(detail.genres) ? detail.genres.filter((g) => Number.isInteger(g?.id) && typeof g?.name === 'string')
      .map((g) => ({ id: g.id, name: g.name })).slice(0, 15) : [],
    runtime: typeof runtime === 'number' && Number.isFinite(runtime) && runtime > 0 ? runtime : null,
    cast: Array.isArray(detail.credits?.cast) ? detail.credits.cast.filter((c) => Number.isInteger(c?.id) && typeof c?.name === 'string')
      .slice(0, 7).map((c) => ({ id: c.id, name: c.name, character: typeof c.character === 'string' ? c.character : '' })) : [],
    trailerUrl: validOfficialTrailer(detail.videos),
    availabilityByRegion,
  }
}

function pause(ms) { return new Promise((resolve) => setTimeout(resolve, ms)) }

async function getJSON(endpoint, token, fetcher = fetch) {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20_000)
    try {
      const response = await fetcher(BASE + endpoint, {
        headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
        signal: controller.signal,
      })
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) throw new Error('TMDB authentication rejected.')
        if (response.status === 429 || response.status >= 500) {
          if (attempt < RETRIES) {
            const raw = Number(response.headers.get('retry-after'))
            const wait = Number.isFinite(raw) && raw > 0 ? Math.min(raw * 1000, 15_000) : 1000 * 2 ** attempt
            await pause(wait)
            continue
          }
        }
        throw new Error('TMDB returned HTTP ' + response.status + ' for ' + endpoint)
      }
      return await response.json()
    } catch (error) {
      if (attempt >= RETRIES || String(error).includes('authentication')) throw error
      await pause(1000 * 2 ** attempt)
    } finally {
      clearTimeout(timeout)
    }
  }
  throw new Error('TMDB request retries exhausted.')
}

export async function generateSnapshot({ token, request = getJSON, now = () => new Date() }) {
  if (!token || token.trim().length < 12) throw new Error('TMDB_READ_ACCESS_TOKEN must be configured to generate the public catalog.')
  const date = now().toISOString()
  const candidates = new Map()

  // Small, bounded, original app-facing selection; not a bulk TMDB database export.
  for (const region of REGIONS) {
    for (const mediaType of ['movie', 'tv']) {
      const params = new URLSearchParams({
        language: 'en-US', page: '1', sort_by: 'popularity.desc',
        include_adult: 'false', watch_region: region,
        with_watch_monetization_types: 'free|ads',
      })
      const listing = await request('/discover/' + mediaType + '?' + params.toString(), token)
      if (!Array.isArray(listing?.results)) throw new Error('Malformed TMDB discovery results for ' + mediaType + ':' + region)
      for (const raw of listing.results.slice(0, MAX_DISCOVERED_PER_REGION_TYPE)) {
        if (!Number.isInteger(raw.id) || raw.id <= 0 || raw.adult === true) continue
        const key = mediaType + '-' + raw.id
        if (!candidates.has(key)) candidates.set(key, { id: raw.id, mediaType })
      }
    }
  }

  if (!candidates.size) throw new Error('TMDB returned no discovery candidates; refusing to publish an empty refresh.')
  const records = []
  for (const item of candidates.values()) {
    const basePath = '/' + item.mediaType + '/' + item.id
    const [detail, providers] = await Promise.all([
      request(basePath + '?language=en-US&append_to_response=credits%2Cvideos', token),
      request(basePath + '/watch/providers', token),
    ])
    if (!providers || typeof providers.results !== 'object' || providers.results === null) {
      throw new Error('Malformed TMDB provider response for ' + basePath)
    }
    const record = normalizeMedia(detail, item.mediaType, providers.results, date)
    if (record) records.push(record)
    // Respect TMDB load; speed is less important than not getting rate-limited.
    await pause(180)
  }

  if (!records.length) throw new Error('No candidates had a verifiable provider report; refusing an empty snapshot.')
  return { schemaVersion: SCHEMA_VERSION, generatedAt: date, source: 'TMDB', regions: REGIONS, records }
}

async function main() {
  const token = process.env.TMDB_READ_ACCESS_TOKEN
  const snapshot = await generateSnapshot({ token })
  const outfile = fileURLToPath(new URL('../public/data/catalog.json', import.meta.url))
  await mkdir(path.dirname(outfile), { recursive: true })
  await writeFile(outfile, JSON.stringify(snapshot, null, 2) + '\n', 'utf8')
  process.stdout.write('Generated ' + snapshot.records.length + ' titles across ' + snapshot.regions.length + ' regions at ' + snapshot.generatedAt + '.\n')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('Catalog refresh aborted: ' + (error instanceof Error ? error.message : String(error)))
    process.exitCode = 1
  })
}
