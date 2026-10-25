import { describe, expect, it } from 'vitest'
import type { BroadcastChannel } from './worldBroadcast'
import {
  WORLD_TV_PASSPORT_KEY, WORLD_TV_PASSPORT_MAX_IMPORT_BYTES,
  WORLD_TV_PASSPORT_MAX_STAMPS, WORLD_TV_PASSPORT_SCHEMA, addWorldTvStamp,
  exportWorldTvPassport, importWorldTvPassport, isUtcCalendarDate,
  mergeWorldTvStamps, pickWorldTvChannel, readWorldTvPassport,
  removeWorldTvStamp, stampCountryCount, stepWorldTvChannel,
} from './worldTvPassport'

const channels: BroadcastChannel[] = [
  { id: 'KEXP.us', name: 'Example Music', country: 'US', categories: ['music'], languages: ['eng'], officialUrl: 'https://example.org/' },
  { id: 'TV1.fr', name: 'Example France', country: 'FR', categories: ['culture'], languages: ['fra'], officialUrl: 'https://tv.example.org/' },
  { id: 'TV2.fr', name: 'Example France Two', country: 'FR', categories: ['news'], languages: ['fra'], officialUrl: 'https://news.example.org/' },
]
const stamps = [{ id: 'KEXP.us', date: '2026-10-25' }, { id: 'TV1.fr', date: '2026-10-24' }]

describe('RCTV v2.2 World TV passport', () => {
  it('validates canonical UTC dates including leap years', () => {
    expect(isUtcCalendarDate('2024-02-29')).toBe(true)
    for (const date of ['2023-02-29', '2025-13-01', '2025-00-01', '1999-12-31', 'not-a-date', null]) {
      expect(isUtcCalendarDate(date)).toBe(false)
    }
  })
  it('exports only manually declared metadata, without media URLs or viewing claims', () => {
    const output = exportWorldTvPassport(stamps)
    const parsed = JSON.parse(output)
    expect(parsed).toEqual({
      schema: WORLD_TV_PASSPORT_SCHEMA,
      provenance: 'USER_MARKED_DIRECTORY_EXPLORATION',
      limits: 'Self-reported catalog exploration; does not prove watching, live availability or travel.',
      stamps,
    })
    expect(output).not.toContain('https://')
    expect(output).not.toContain('officialUrl')
    expect(output).not.toContain('IP address')
  })
  it('imports valid exported passports and rejects schema and unknown fields', () => {
    expect(importWorldTvPassport(exportWorldTvPassport(stamps), channels)).toEqual(stamps)
    for (const bad of [
      '{"schema":"wrong","stamps":[]}',
      JSON.stringify({ ...JSON.parse(exportWorldTvPassport(stamps)), token: 'bad' }),
      exportWorldTvPassport([{ id: 'NotInIndex.us', date: '2026-10-25' }]),
      exportWorldTvPassport([{ id: 'KEXP.us', date: '2026-02-30' }]),
      exportWorldTvPassport([stamps[0], stamps[0]]),
      exportWorldTvPassport([{ ...stamps[0], stream: 'https://evil.example/' }]),
      '{bad',
      'x'.repeat(WORLD_TV_PASSPORT_MAX_IMPORT_BYTES + 1),
    ]) {
      expect(() => importWorldTvPassport(bad, channels)).toThrow()
    }
  })
  it('salvages only bounded currently known stamps from local storage', () => {
    expect(WORLD_TV_PASSPORT_KEY).toContain('world-tv')
    expect(readWorldTvPassport(null, channels)).toEqual([])
    expect(readWorldTvPassport('not json', channels)).toEqual([])
    expect(readWorldTvPassport(JSON.stringify({ schema: 'unknown', stamps }), channels)).toEqual([])
    const raw = JSON.stringify({schema: WORLD_TV_PASSPORT_SCHEMA, stamps: [
      stamps[0], stamps[0], { id: 'NotInIndex.us', date: '2026-10-25' }, stamps[1],
    ]})
    expect(readWorldTvPassport(raw, channels)).toEqual(stamps)
  })
  it('adds, removes and merges independent stamps without overwriting older dates', () => {
    const one = addWorldTvStamp([], 'KEXP.us', channels, '2026-10-25')
    expect(one).toEqual([stamps[0]])
    expect(addWorldTvStamp(one, 'KEXP.us', channels, '2026-10-26')).toEqual(one)
    expect(addWorldTvStamp(one, 'Missing.us', channels, '2026-10-25')).toEqual(one)
    expect(addWorldTvStamp(one, 'TV1.fr', channels, 'bad')).toEqual(one)
    expect(mergeWorldTvStamps(one, [...stamps, { id: 'TV2.fr', date: '2026-10-25' }])).toEqual([
      stamps[0], stamps[1], { id: 'TV2.fr', date: '2026-10-25' },
    ])
    expect(removeWorldTvStamp(stamps, 'KEXP.us')).toEqual([stamps[1]])
    expect(stampCountryCount(stamps, channels)).toBe(2)
    expect(stampCountryCount([...stamps, { id: 'TV2.fr', date: '2026-10-25' }], channels)).toBe(2)
    expect(stampCountryCount([{id:'other', date:'2026-10-25'}], channels)).toBe(0)
    expect(WORLD_TV_PASSPORT_MAX_STAMPS).toBe(250)
  })
  it('wraps channel navigation and never selects stream media', () => {
    expect(stepWorldTvChannel(channels, 'KEXP.us', -1)?.id).toBe('TV2.fr')
    expect(stepWorldTvChannel(channels, 'TV2.fr', 1)?.id).toBe('KEXP.us')
    expect(stepWorldTvChannel([], 'KEXP.us', 1)).toBeNull()
    expect(pickWorldTvChannel(channels, 'TV1.fr', () => 0)?.id).toBe('KEXP.us')
    expect(pickWorldTvChannel(channels, 'KEXP.us', () => 0.999)?.id).toBe('TV2.fr')
    expect(pickWorldTvChannel(channels.slice(0, 1), 'KEXP.us')?.id).toBe('KEXP.us')
    expect(pickWorldTvChannel([], null)).toBeNull()
  })
})
