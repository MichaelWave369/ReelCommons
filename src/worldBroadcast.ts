/**
 * RCTV v2.1 · World Broadcast Atlas
 * Opt-in, metadata-only IPTV-org discovery. No playlist/streams.json download,
 * playback, embed, scraping, scheduled refresh or rebroadcast capability.
 */
export const WORLD_BROADCAST_FAVORITES_KEY = 'rctv-world-broadcast-favorites-v1'
export const WORLD_BROADCAST_API = 'https://iptv-org.github.io/api/'
const MAX_SAVED = 80

export interface BroadcastChannel {
  id: string
  name: string
  country: string
  categories: string[]
  languages: string[]
  officialUrl: string
}
export interface BroadcastOption { id: string; label: string }
export interface BroadcastCatalog {
  channels: BroadcastChannel[]
  countries: BroadcastOption[]
  categories: BroadcastOption[]
  languages: BroadcastOption[]
}
type Endpoint = 'channels.json' | 'countries.json' | 'categories.json' |
  'feeds.json' | 'languages.json' | 'guides.json'
const LIMITS: Record<Endpoint, number> = {
  'channels.json': 22_000_000, 'countries.json': 1_000_000,
  'categories.json': 1_000_000, 'feeds.json': 16_000_000,
  'languages.json': 1_000_000, 'guides.json': 12_000_000,
}
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const textValue = (value: unknown, max = 100): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''
const validId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 110 &&
  /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)
const safeCodes = (value: unknown, pattern: RegExp): string[] =>
  Array.isArray(value) ? [...new Set(value.filter((code): code is string =>
    typeof code === 'string' && pattern.test(code)))].slice(0, 15) : []

/** Only explicit, public HTTPS broadcaster homepages are selectable; never stream endpoints. */
export function officialBroadcastUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.port ||
        !url.hostname.includes('.') || url.hostname.endsWith('.') ||
        url.hostname === 'localhost' || url.hostname.endsWith('.localhost') ||
        url.hostname.endsWith('.local') || url.hostname.endsWith('.internal') ||
        url.hostname.endsWith('.test') || url.hostname.endsWith('.invalid') ||
        url.hostname.includes(':') || /^\\d+(?:\\.\\d+){3}$/.test(url.hostname)) return null
    return url.href
  } catch { return null }
}
export function normalizeBroadcastChannels(value: unknown): BroadcastChannel[] {
  if (!Array.isArray(value)) throw new Error('IPTV-org channel index is not a list.')
  if (value.length > 100_000) throw new Error('IPTV-org channel index exceeded the safety limit.')
  const channels: BroadcastChannel[] = []
  const seen = new Set<string>()
  for (const item of value) {
    if (!isObject(item) || !validId(item.id) || seen.has(item.id) ||
        item.is_nsfw === true || item.closed != null) continue
    const country = textValue(item.country, 2).toUpperCase()
    const officialUrl = officialBroadcastUrl(item.website)
    const name = textValue(item.name, 100)
    if (!/^[A-Z]{2}$/.test(country) || !officialUrl || !name) continue
    seen.add(item.id)
    channels.push({
      id: item.id, name, country, officialUrl,
      categories: safeCodes(item.categories, /^[a-z][a-z0-9-]{0,35}$/),
      languages: [],
    })
  }
  return channels.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
}
export function normalizeBroadcastOptions(value: unknown, kind: 'countries' | 'categories' | 'languages'): BroadcastOption[] {
  if (!Array.isArray(value) || value.length > 20_000) return []
  const result: BroadcastOption[] = []
  const seen = new Set<string>()
  for (const entry of value) {
    if (!isObject(entry)) continue
    const id = textValue(kind === 'categories' ? entry.id : entry.code, 40)
    const label = textValue(entry.name, 100)
    const valid = kind === 'countries' ? /^[A-Z]{2}$/.test(id) :
      kind === 'languages' ? /^[a-z]{3}$/.test(id) : /^[a-z][a-z0-9-]{0,35}$/.test(id)
    if (!valid || !label || seen.has(id)) continue
    seen.add(id)
    result.push({ id, label })
  }
  return result.sort((a, b) => a.label.localeCompare(b.label))
}
export function attachBroadcastLanguages(channels: BroadcastChannel[], raw: unknown): BroadcastChannel[] {
  if (!Array.isArray(raw) || raw.length > 100_000) return channels
  const byChannel = new Map<string, Set<string>>()
  const known = new Set(channels.map((ch) => ch.id))
  for (const item of raw) {
    if (!isObject(item) || !validId(item.channel) || !known.has(item.channel)) continue
    const codes = safeCodes(item.languages, /^[a-z]{3}$/)
    if (!codes.length) continue
    const existing = byChannel.get(item.channel) ?? new Set<string>()
    codes.forEach((code) => { if (existing.size < 15) existing.add(code) })
    byChannel.set(item.channel, existing)
  }
  return channels.map((channel) => ({ ...channel, languages: [...(byChannel.get(channel.id) ?? [])] }))
}
export function broadcastGuideCoverage(raw: unknown, channels: readonly BroadcastChannel[]): Set<string> {
  const indexed = new Set<string>()
  if (!Array.isArray(raw) || raw.length > 100_000) return indexed
  const allowed = new Set(channels.map((c) => c.id))
  for (const item of raw) {
    if (isObject(item) && validId(item.channel) && allowed.has(item.channel) &&
        Array.isArray(item.sources) && item.sources.length > 0) indexed.add(item.channel)
  }
  return indexed
}
export function filterBroadcastChannels(
  channels: readonly BroadcastChannel[], query: string, country: string, category: string,
  language: string, favorites: readonly string[], favoritesOnly: boolean,
): BroadcastChannel[] {
  const needle = query.trim().toLocaleLowerCase().slice(0, 100)
  const saved = new Set(favorites)
  return channels.filter((item) =>
    (!country || item.country === country) &&
    (!category || item.categories.includes(category)) &&
    (!language || item.languages.includes(language)) &&
    (!favoritesOnly || saved.has(item.id)) &&
    (!needle || [item.name, item.id, item.country, ...item.categories, ...item.languages]
      .some((part) => part.toLocaleLowerCase().includes(needle))))
}
export function readBroadcastFavorites(raw: string | null, channels: readonly BroadcastChannel[]): string[] {
  if (!raw || raw.length > 10_000) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const valid = new Set(channels.map((channel) => channel.id))
    return [...new Set(parsed.filter((item): item is string =>
      typeof item === 'string' && valid.has(item)))].slice(0, MAX_SAVED)
  } catch { return [] }
}
export function toggleBroadcastFavorite(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) :
    ids.length < MAX_SAVED ? [...ids, id] : [...ids]
}

async function fetchIndex(endpoint: Endpoint, signal: AbortSignal): Promise<unknown> {
  // Endpoints are a closed allowlist. No user-submitted URLs, credentials or media requests.
  const response = await fetch(WORLD_BROADCAST_API + endpoint, {
    signal, credentials: 'omit', mode: 'cors',
  })
  if (!response.ok) throw new Error('IPTV-org ' + endpoint + ' returned HTTP ' + response.status)
  const body = await response.text()
  if (body.length > LIMITS[endpoint]) throw new Error('IPTV-org ' + endpoint + ' is too large.')
  try { return JSON.parse(body) as unknown }
  catch { throw new Error('IPTV-org ' + endpoint + ' returned invalid JSON.') }
}
/** Called only after a visitor explicitly chooses to load the external directory. */
export async function loadBroadcastCatalog(signal: AbortSignal): Promise<BroadcastCatalog> {
  const [channelsData, countriesData, categoriesData, feedsData, languagesData] = await Promise.all([
    fetchIndex('channels.json', signal), fetchIndex('countries.json', signal),
    fetchIndex('categories.json', signal), fetchIndex('feeds.json', signal),
    fetchIndex('languages.json', signal),
  ])
  return {
    channels: attachBroadcastLanguages(normalizeBroadcastChannels(channelsData), feedsData),
    countries: normalizeBroadcastOptions(countriesData, 'countries'),
    categories: normalizeBroadcastOptions(categoriesData, 'categories'),
    languages: normalizeBroadcastOptions(languagesData, 'languages'),
  }
}
/** Guide-source coverage is not a schedule, program listing, or verified live status. */
export async function loadBroadcastGuideCoverage(signal: AbortSignal, channels: readonly BroadcastChannel[]): Promise<Set<string>> {
  return broadcastGuideCoverage(await fetchIndex('guides.json', signal), channels)
}
