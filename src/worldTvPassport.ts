/**
 * RCTV v2.2 · World TV Passport
 * A browser-local, manually stamped directory exploration log.
 * Not a watch history, playback proof, travel record, location tracker or EPG receipt.
 */
import type { BroadcastChannel } from './worldBroadcast'

export const WORLD_TV_PASSPORT_KEY = 'rctv-world-tv-passport-v1'
export const WORLD_TV_PASSPORT_SCHEMA = 'RCTV_WORLD_TV_PASSPORT_V1'
export const WORLD_TV_PASSPORT_MAX_STAMPS = 250
export const WORLD_TV_PASSPORT_MAX_IMPORT_BYTES = 64_000

export interface WorldTvStamp {
  id: string
  date: string // user declaration date, UTC YYYY-MM-DD
}

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

export function isUtcCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(value)) return false
  const time = Date.parse(value + 'T00:00:00.000Z')
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value
}
export function todayUtc(): string { return new Date().toISOString().slice(0, 10) }

function isStamp(value: unknown, valid: ReadonlySet<string>): value is WorldTvStamp {
  return record(value) && Object.keys(value).sort().join(',') === 'date,id' &&
    typeof value.id === 'string' && valid.has(value.id) && isUtcCalendarDate(value.date)
}
function checkedEntries(raw: unknown, channels: readonly BroadcastChannel[], strict: boolean): WorldTvStamp[] {
  if (!Array.isArray(raw) || raw.length > (strict ? WORLD_TV_PASSPORT_MAX_STAMPS : 500)) {
    if (strict) throw new Error('Passport stamps must be a bounded list.')
    return []
  }
  const valid = new Set(channels.map((ch) => ch.id))
  const unique = new Set<string>()
  const output: WorldTvStamp[] = []
  for (const entry of raw) {
    if (!isStamp(entry, valid)) {
      if (strict) throw new Error('Unknown channel, invalid date, or unexpected stamp fields.')
      continue
    }
    if (unique.has(entry.id)) {
      if (strict) throw new Error('Duplicate channel stamps are not accepted.')
      continue
    }
    unique.add(entry.id)
    if (output.length < WORLD_TV_PASSPORT_MAX_STAMPS) output.push({ id: entry.id, date: entry.date })
  }
  return output
}

/** Local storage input has no authority: salvage only valid IDs and calendar dates. */
export function readWorldTvPassport(raw: string | null, channels: readonly BroadcastChannel[]): WorldTvStamp[] {
  if (!raw || raw.length > WORLD_TV_PASSPORT_MAX_IMPORT_BYTES) return []
  try {
    const decoded: unknown = JSON.parse(raw)
    if (!record(decoded) || decoded.schema !== WORLD_TV_PASSPORT_SCHEMA) return []
    return checkedEntries(decoded.stamps, channels, false)
  } catch { return [] }
}

/** Portable metadata receipt contains channel IDs and manual UTC date stamps only. */
export function exportWorldTvPassport(stamps: readonly WorldTvStamp[]): string {
  return JSON.stringify({
    schema: WORLD_TV_PASSPORT_SCHEMA,
    provenance: 'USER_MARKED_DIRECTORY_EXPLORATION',
    limits: 'Self-reported catalog exploration; does not prove watching, live availability or travel.',
    stamps: stamps.map(({ id, date }) => ({ id, date })),
  }, null, 2)
}

/** Parse external files as untrusted. Unknown IDs or additional fields fail closed. */
export function importWorldTvPassport(raw: string, channels: readonly BroadcastChannel[]): WorldTvStamp[] {
  if (raw.length > WORLD_TV_PASSPORT_MAX_IMPORT_BYTES) throw new Error('Passport import exceeds 64 KB.')
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { throw new Error('This is not valid JSON.') }
  if (!record(parsed) || Object.keys(parsed).sort().join(',') !== 'limits,provenance,schema,stamps' ||
      parsed.schema !== WORLD_TV_PASSPORT_SCHEMA ||
      parsed.provenance !== 'USER_MARKED_DIRECTORY_EXPLORATION' ||
      typeof parsed.limits !== 'string' || parsed.limits.length > 180) {
    throw new Error('Unsupported passport schema or unexpected fields.')
  }
  return checkedEntries(parsed.stamps, channels, true)
}
export function addWorldTvStamp(
  stamps: readonly WorldTvStamp[], channelId: string, channels: readonly BroadcastChannel[], date: string,
): WorldTvStamp[] {
  if (!channels.some((channel) => channel.id === channelId) ||
      !isUtcCalendarDate(date) || stamps.some((stamp) => stamp.id === channelId) ||
      stamps.length >= WORLD_TV_PASSPORT_MAX_STAMPS) return [...stamps]
  return [...stamps, { id: channelId, date }]
}
export function removeWorldTvStamp(stamps: readonly WorldTvStamp[], channelId: string): WorldTvStamp[] {
  return stamps.filter(({ id }) => id !== channelId)
}
export function mergeWorldTvStamps(current: readonly WorldTvStamp[], imported: readonly WorldTvStamp[]): WorldTvStamp[] {
  const merged = [...current]
  const seen = new Set(current.map(({ id }) => id))
  for (const stamp of imported) {
    if (merged.length >= WORLD_TV_PASSPORT_MAX_STAMPS) break
    if (seen.has(stamp.id)) continue
    seen.add(stamp.id)
    merged.push({ id: stamp.id, date: stamp.date })
  }
  return merged
}
export function stampCountryCount(stamps: readonly WorldTvStamp[], channels: readonly BroadcastChannel[]): number {
  const countries = new Map(channels.map((channel) => [channel.id, channel.country]))
  return new Set(stamps.map((stamp) => countries.get(stamp.id)).filter((v): v is string => !!v)).size
}
export function stepWorldTvChannel(
  visible: readonly BroadcastChannel[], selectedId: string | null, increment: number,
): BroadcastChannel | null {
  if (!visible.length) return null
  const index = visible.findIndex((channel) => channel.id === selectedId)
  const start = index < 0 ? 0 : index
  const next = ((start + increment) % visible.length + visible.length) % visible.length
  return visible[next]
}
export function pickWorldTvChannel(visible: readonly BroadcastChannel[], currentId: string | null, random = Math.random): BroadcastChannel | null {
  if (!visible.length) return null
  if (visible.length === 1) return visible[0]
  const currentIndex = visible.findIndex(({ id }) => id === currentId)
  // Uniform choice over every *other* station when the current choice is in this pool.
  const choices = currentIndex === -1 ? visible : visible.filter(({ id }) => id !== currentId)
  return choices[Math.min(choices.length - 1, Math.max(0, Math.floor(random() * choices.length)))]
}
