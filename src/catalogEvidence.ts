import { parsePublicSnapshot } from './publicCatalog'
import type { PublicSnapshot, PublicTitle, RegionAvailability } from './publicCatalog'
import { tmdbTitleUrl } from './tmdb'

export const SESSION_SNAPSHOT_KEY = 'reelcommons.public-catalog.session.v1'
const SESSION_MAX_CHARS = 1_500_000
const MAX_FALLBACK_AGE_MS = 7 * 24 * 60 * 60 * 1000
const CLOCK_TOLERANCE_MS = 60 * 60 * 1000
const OLD_SNAPSHOT_AGE_MS = 48 * 60 * 60 * 1000

export type SnapshotOrigin = 'network' | 'session-cache'
export type SnapshotHealth = 'current' | 'older' | 'expired' | 'unknown'

export function snapshotHealth(generatedAt: string | null, now = Date.now()): SnapshotHealth {
  if (!generatedAt) return 'unknown'
  const when = Date.parse(generatedAt)
  if (!Number.isFinite(when) || when > now + CLOCK_TOLERANCE_MS) return 'unknown'
  const age = Math.max(0, now - when)
  if (age > MAX_FALLBACK_AGE_MS) return 'expired'
  return age >= OLD_SNAPSHOT_AGE_MS ? 'older' : 'current'
}

function safeExternalTMDBLink(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' && ['themoviedb.org', 'www.themoviedb.org'].includes(parsed.hostname)
      ? parsed.href : null
  } catch { return null }
}

// Validate browser session content as untrusted data. No API tokens or personal watchlists
// belong in this cache, only the public, bounded movie snapshot.
export function restoreSessionSnapshot(raw: string | null, now = Date.now()): PublicSnapshot | null {
  if (!raw || raw.length > SESSION_MAX_CHARS) return null
  try {
    const parsed = parsePublicSnapshot(JSON.parse(raw) as unknown)
    if (parsed.records.length === 0 || !parsed.generatedAt) return null
    if (snapshotHealth(parsed.generatedAt, now) === 'expired' || snapshotHealth(parsed.generatedAt, now) === 'unknown') return null
    if (parsed.records.length > 200) return null
    for (const item of parsed.records) {
      if (!Array.isArray(item.genres) || !Array.isArray(item.cast)
        || typeof item.overview !== 'string' || typeof item.year !== 'string'
        || !item.availabilityByRegion || typeof item.availabilityByRegion !== 'object') return null
      if (typeof item.trailerUrl === 'string' && !/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(item.trailerUrl)) return null
      for (const region of parsed.regions) {
        const report = item.availabilityByRegion[region]
        if (report === undefined) continue
        if (!report || !Array.isArray(report.free) || !Array.isArray(report.ads)
          || typeof report.checkedAt !== 'string' || report.country !== region
          || (report.link !== null && safeExternalTMDBLink(report.link) === null)
          || [...report.free, ...report.ads].some((provider) =>
            !provider || !Number.isInteger(provider.provider_id) || typeof provider.provider_name !== 'string'
          )) return null
      }
    }
    return parsed
  } catch { return null }
}

export function encodeSessionSnapshot(snapshot: PublicSnapshot): string | null {
  if (!snapshot.generatedAt || snapshot.records.length === 0) return null
  try {
    const result = JSON.stringify(snapshot)
    return result.length <= SESSION_MAX_CHARS ? result : null
  } catch { return null }
}

export function evidenceReceipt(
  item: PublicTitle,
  region: string,
  origin: SnapshotOrigin,
  generatedAt: string | null,
): string {
  const report: RegionAvailability | undefined = item.availabilityByRegion[region]
  const titleLink = tmdbTitleUrl(item)
  const providerLink = safeExternalTMDBLink(report?.link)
  const toLines = (providers: RegionAvailability['free'] | undefined): string[] =>
    providers?.length ? providers.map((p) => '  - ' + p.provider_name + ' (provider ID ' + p.provider_id + ')') : ['  - None reported']
  return [
    'REELCOMMONS | TITLE AVAILABILITY RECEIPT',
    '',
    'Title: ' + item.title,
    'Type: ' + (item.mediaType === 'movie' ? 'Movie' : 'TV series'),
    'Region: ' + region,
    'TMDB title: ' + titleLink,
    'Snapshot generated: ' + (generatedAt ?? 'Unknown'),
    'Provider report checked: ' + (report?.checkedAt ?? 'Unknown'),
    'Data source: TMDB; streaming availability: JustWatch via TMDB',
    'Snapshot source: ' + (origin === 'session-cache' ? 'Browser session fallback copy' : 'Published catalog snapshot'),
    '',
    'REPORTED FREE:',
    ...toLines(report?.free),
    '',
    'REPORTED WITH ADS:',
    ...toLines(report?.ads),
    '',
    'Provider details: ' + (providerLink ?? 'No provider information link supplied'),
    'Playback checked independently by ReelCommons: NO',
    'Direct service playback link verified: NO',
    'This receipt is a dated third-party report. Confirm rights, region and',
    'actual playback with each provider. No access is guaranteed.',
  ].join('\n')
}
