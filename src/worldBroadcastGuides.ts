/**
 * RCTV v2.3 · EPG Source Research Desk
 * Only descriptive guide-index metadata. Never fetch, store, export or link XMLTV
 * URLs or provider-specific scraping endpoints. Guide != broadcasting rights.
 */
import type { BroadcastChannel } from './worldBroadcast'

export interface BroadcastGuideRow {
  channelId: string
  site: string
  siteName: string
  language: string
  feed: string | null
  formats: string[]
  sourceCount: number
}
export interface BroadcastGuideIndex {
  byChannel: Map<string, BroadcastGuideRow[]>
  indexedChannels: Set<string>
  indexedSourceRows: number
}

const MAX_INDEX_ROWS = 100_000
const MAX_ROWS_PER_CHANNEL = 12
const MAX_SOURCES_PER_ROW = 20
const MAX_CHANNELS = 100_000

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const bounded = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''
const channelId = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 110 && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)
const feedId = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 100 && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)
const siteDomain = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 150 &&
  /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(value) &&
  value.includes('.') && !value.includes('..')
const formatName = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z][A-Za-z0-9+_-]{0,15}$/.test(value)
const guideLanguage = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})?$/.test(value)

/**
 * The only input is IPTV-org's fixed guides.json metadata response.
 * Raw URLs are read solely to detect listed source presence, then discarded.
 * No link to a guide source should be constructed from these fields.
 */
export function normalizeGuideIndex(raw: unknown, channels: readonly BroadcastChannel[]): BroadcastGuideIndex {
  const empty = (): BroadcastGuideIndex => ({
    byChannel: new Map(), indexedChannels: new Set(), indexedSourceRows: 0,
  })
  if (!Array.isArray(raw) || raw.length > MAX_INDEX_ROWS || channels.length > MAX_CHANNELS) return empty()
  const accepted = new Set(channels.map(({ id }) => id))
  const byChannel = new Map<string, BroadcastGuideRow[]>()
  const dedupe = new Map<string, Set<string>>()
  let indexedSourceRows = 0
  for (const item of raw) {
    if (!object(item) || !channelId(item.channel) || !accepted.has(item.channel) ||
        !siteDomain(item.site) || !Array.isArray(item.sources) || item.sources.length > 1000) continue
    // Inspect source metadata only. Do not retain host/url/headers/site_id.
    const sourceMetadata = item.sources.filter((source): source is Record<string, unknown> =>
      object(source) && typeof source.url === 'string' &&
      source.url.length > 0 && source.url.length <= 4096 && formatName(source.format))
    if (!sourceMetadata.length) continue
    const rows = byChannel.get(item.channel) ?? []
    if (rows.length >= MAX_ROWS_PER_CHANNEL) continue
    const site = bounded(item.site, 150).toLowerCase()
    const language = guideLanguage(item.lang) ? item.lang : 'unknown'
    const feed = feedId(item.feed) ? item.feed : null
    const uniqueKey = [site, language, feed ?? ''].join('|')
    const seen = dedupe.get(item.channel) ?? new Set<string>()
    if (seen.has(uniqueKey)) continue
    seen.add(uniqueKey)
    dedupe.set(item.channel, seen)
    const formats = [...new Set(sourceMetadata.slice(0, MAX_SOURCES_PER_ROW)
      .map((source) => source.format as string))].sort()
    rows.push({
      channelId: item.channel,
      site, siteName: bounded(item.site_name, 90) || site,
      language, feed,
      formats, sourceCount: Math.min(sourceMetadata.length, MAX_SOURCES_PER_ROW),
    })
    byChannel.set(item.channel, rows)
    indexedSourceRows++
  }
  for (const rows of byChannel.values()) rows.sort((a,b) => a.siteName.localeCompare(b.siteName))
  return { byChannel, indexedChannels: new Set(byChannel.keys()), indexedSourceRows }
}

export function guideReceipt(channel: BroadcastChannel, rows: readonly BroadcastGuideRow[]): string {
  return JSON.stringify({
    schema: 'RCTV_GUIDE_SOURCE_RECEIPT_V1',
    provenance: 'IPTV_ORG_INDEX_METADATA_UNVERIFIED',
    channelId: channel.id,
    channelName: channel.name,
    sources: rows.slice(0, MAX_ROWS_PER_CHANNEL).map((row) => ({
      site: row.site,
      siteName: row.siteName,
      language: row.language,
      feed: row.feed,
      formats: row.formats,
      listedSourceEntries: row.sourceCount,
    })),
    limits: 'Index metadata only. No schedule, current show, playback, authorization, freshness or XMLTV content verified.',
  }, null, 2)
}
