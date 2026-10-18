import type { Genre, MediaType, TitleCard } from './tmdb'
export interface PublicProvider { provider_id: number; provider_name: string }
export interface RegionAvailability {
  country: string
  checkedAt: string
  link: string | null
  free: PublicProvider[]
  ads: PublicProvider[]
}
export interface PublicTitle extends TitleCard {
  genres: Genre[]
  runtime: number | null
  cast: { id: number; name: string; character: string }[]
  trailerUrl: string | null
  availabilityByRegion: Record<string, RegionAvailability>
}
export interface PublicSnapshot {
  schemaVersion: 1
  generatedAt: string | null
  source: 'TMDB'
  regions: string[]
  records: PublicTitle[]
}

const DEFAULT_REGIONS = ['US', 'CA', 'GB', 'AU']
function object(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value) }

export function parsePublicSnapshot(value: unknown): PublicSnapshot {
  if (!object(value) || value.schemaVersion !== 1 || !Array.isArray(value.records)) throw new Error('Public catalog format is unsupported.')
  const validRegions = Array.isArray(value.regions) ? value.regions.filter((region): region is string => typeof region === 'string' && /^[A-Z]{2}$/.test(region)).slice(0, 20) : []
  const regions = validRegions.length ? [...new Set(validRegions)] : DEFAULT_REGIONS
  const ids = new Set<string>()
  const records = value.records.filter((item): item is PublicTitle => {
    if (!object(item) || !Number.isInteger(item.id) || Number(item.id) <= 0 || (item.mediaType !== 'movie' && item.mediaType !== 'tv') || typeof item.title !== 'string' || !item.title.trim()) return false
    if (!object(item.availabilityByRegion)) return false
    const hasAny = regions.some((region) => {
      const availability = item.availabilityByRegion as Record<string, unknown>
      const found = availability[region]
      return object(found) && (Array.isArray(found.free) && found.free.length > 0 || Array.isArray(found.ads) && found.ads.length > 0)
    })
    const key = item.mediaType + '-' + item.id
    if (!hasAny || ids.has(key)) return false
    ids.add(key)
    return true
  })
  return {
    schemaVersion: 1,
    generatedAt: typeof value.generatedAt === 'string' && Number.isFinite(Date.parse(value.generatedAt)) ? value.generatedAt : null,
    source: 'TMDB', regions, records,
  }
}

export function visiblePublicTitles(
  items: PublicTitle[],
  { query, region, mediaType }: { query: string; region: string; mediaType: MediaType | 'all' },
): PublicTitle[] {
  const q = query.trim().toLocaleLowerCase()
  return items.filter((item) => {
    if (mediaType !== 'all' && item.mediaType !== mediaType) return false
    const available = item.availabilityByRegion[region]
    if (!available || !(available.free?.length > 0 || available.ads?.length > 0)) return false
    if (!q) return true
    return [item.title, item.overview, item.year, ...(item.genres || []).map((g) => g.name)].join(' ').toLocaleLowerCase().includes(q)
  })
}

export function ageOfSnapshot(iso: string | null, now = Date.now()): { days: number; stale: boolean } | null {
  if (!iso) return null
  const time = Date.parse(iso)
  if (!Number.isFinite(time)) return null
  const days = Math.max(0, (now - time) / 86_400_000)
  return { days, stale: days >= 2 }
}
