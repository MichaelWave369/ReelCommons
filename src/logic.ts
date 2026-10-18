import type { Mood, Service, ServiceFilter, WatchItem } from './catalog'

export function filterServices(
  services: Service[],
  options: { query: string; kind: ServiceFilter; mood: Mood },
): Service[] {
  const query = options.query.trim().toLocaleLowerCase()
  return services.filter((service) => {
    const matchesKind = options.kind === 'all' || service.kind === options.kind
    const matchesMood = options.mood === 'all' || service.moods.includes(options.mood)
    const searchable = [service.name, service.tagline, service.description, service.access, ...service.tags].join(' ').toLocaleLowerCase()
    return matchesKind && matchesMood && (!query || searchable.includes(query))
  })
}

export function pickTonight(items: WatchItem[], random: () => number = Math.random): WatchItem | null {
  const candidates = items.filter((item) => !item.watched)
  if (!candidates.length) return null
  const index = Math.min(Math.max(Math.floor(random() * candidates.length), 0), candidates.length - 1)
  return candidates[index]
}

export function formatWatchlist(items: WatchItem[]): string {
  const rows = items.map((item) => {
    const note = item.note.trim() ? ` · ${item.note.trim().replace(/\s+/g, ' ')}` : ''
    return `[${item.watched ? 'x' : ' '}] ${item.title} (${item.kind})${note}`
  })
  return ['ReelCommons watchlist', '', ...rows].join('\n')
}
