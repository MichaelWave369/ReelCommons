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

export type AccessFilter = 'all' | 'free' | 'ads'
export type ProviderFilter = number | 'all'

export function providersForRegion(
  items: PublicTitle[],
  { region, mediaType, access }: { region: string; mediaType: MediaType | 'all'; access: AccessFilter },
): PublicProvider[] {
  const options = new Map<number, PublicProvider>()
  for (const item of items) {
    if (mediaType !== 'all' && mediaType !== item.mediaType) continue
    const report = item.availabilityByRegion[region]
    if (!report) continue
    const list = access === 'free' ? report.free : access === 'ads' ? report.ads : [...report.free, ...report.ads]
    for (const provider of list) {
      if (Number.isInteger(provider.provider_id) && typeof provider.provider_name === 'string') {
        options.set(provider.provider_id, provider)
      }
    }
  }
  return [...options.values()].sort((a, b) => a.provider_name.localeCompare(b.provider_name))
}

export function visiblePublicTitles(
  items: PublicTitle[],
  {
    query, region, mediaType, access = 'all', provider = 'all',
  }: {
    query: string
    region: string
    mediaType: MediaType | 'all'
    access?: AccessFilter
    provider?: ProviderFilter
  },
): PublicTitle[] {
  const q = query.trim().toLocaleLowerCase()
  return items.filter((item) => {
    if (mediaType !== 'all' && item.mediaType !== mediaType) return false
    const report = item.availabilityByRegion[region]
    if (!report) return false
    const options = access === 'free' ? report.free : access === 'ads' ? report.ads : [...report.free, ...report.ads]
    if (!options.length) return false
    if (provider !== 'all' && !options.some((entry) => entry.provider_id === provider)) return false
    if (!q) return true
    return [item.title, item.overview, item.year, ...(item.genres || []).map((g) => g.name)]
      .join(' ').toLocaleLowerCase().includes(q)
  })
}

export function shortProviderLabels(
  report: RegionAvailability | undefined,
  access: AccessFilter = 'all',
  limit = 2,
): { labels: string[]; extra: number } {
  if (!report) return { labels: [], extra: 0 }
  const options = access === 'free' ? report.free : access === 'ads' ? report.ads : [...report.free, ...report.ads]
  const distinct = [...new Map(options.map((p) => [p.provider_id, p.provider_name])).values()]
  return { labels: distinct.slice(0, limit), extra: Math.max(0, distinct.length - limit) }
}

export function ageOfSnapshot(iso: string | null, now = Date.now()): { days: number; stale: boolean } | null {
  if (!iso) return null
  const time = Date.parse(iso)
  if (!Number.isFinite(time)) return null
  const days = Math.max(0, (now - time) / 86_400_000)
  return { days, stale: days >= 2 }
}
