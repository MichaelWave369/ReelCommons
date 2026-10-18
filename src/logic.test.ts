import { describe, expect, it } from 'vitest'
import { services } from './catalog'
import type { WatchItem } from './catalog'
import { filterServices, formatWatchlist, pickTonight } from './logic'
import { parseWatchlist } from './storage'

const sample: WatchItem[] = [
  { id: '1', title: 'Old favorite', kind: 'Movie', note: 'Classic', watched: true, createdAt: 1 },
  { id: '2', title: 'New show', kind: 'Series', note: '', watched: false, createdAt: 2 },
]

describe('service discovery', () => {
  it('only shows library services when requested', () => {
    const result = filterServices(services, { query: '', kind: 'library', mood: 'all' })
    expect(result.map((item) => item.id)).toEqual(['kanopy', 'hoopla'])
  })
  it('matches descriptive tags case-insensitively', () => {
    const result = filterServices(services, { query: 'HISTORY', kind: 'all', mood: 'all' })
    expect(result.map((item) => item.id)).toContain('pbs')
  })
  it('respects both kind and mood filters', () => {
    const result = filterServices(services, { query: '', kind: 'library', mood: 'energy' })
    expect(result).toEqual([])
  })
})

describe('watchlist', () => {
  it('picks only unwatched items', () => expect(pickTonight(sample, () => 0)?.id).toBe('2'))
  it('returns null if all items are watched', () => expect(pickTonight([sample[0]])).toBeNull())
  it('formats portable text', () => expect(formatWatchlist(sample)).toContain('[ ] New show (Series)'))
  it('handles corrupt local storage without crashing', () => expect(parseWatchlist('{broken')).toEqual([]))
  it('rejects invalid entries and deduplicates ids', () => {
    const parsed = parseWatchlist(JSON.stringify([sample[0], sample[0], { title: 'missing fields' }, sample[1]]))
    expect(parsed.map((entry) => entry.id)).toEqual(['1', '2'])
  })
})
