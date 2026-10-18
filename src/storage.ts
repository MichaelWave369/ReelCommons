import type { WatchItem } from './catalog'

const KEY = 'reelcommons.watchlist.v1'
const LIMIT = 250

function isWatchItem(value: unknown): value is WatchItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<WatchItem>
  return typeof item.id === 'string' && item.id.length > 0 && item.id.length < 100
    && typeof item.title === 'string' && item.title.trim().length > 0 && item.title.length <= 120
    && (item.kind === 'Movie' || item.kind === 'Series')
    && typeof item.note === 'string' && item.note.length <= 320
    && typeof item.watched === 'boolean'
    && typeof item.createdAt === 'number' && Number.isFinite(item.createdAt)
}

export function parseWatchlist(json: string | null): WatchItem[] {
  if (!json) return []
  try {
    const parsed: unknown = JSON.parse(json)
    if (!Array.isArray(parsed)) return []
    const seen = new Set<string>()
    return parsed.filter((entry) => {
      if (!isWatchItem(entry) || seen.has(entry.id)) return false
      seen.add(entry.id)
      return true
    }).slice(0, LIMIT)
  } catch {
    return []
  }
}

export function readWatchlist(): WatchItem[] {
  try {
    return parseWatchlist(window.localStorage.getItem(KEY))
  } catch {
    return []
  }
}

export function saveWatchlist(items: WatchItem[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, LIMIT)))
    return true
  } catch {
    return false
  }
}
