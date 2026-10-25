import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { BroadcastChannel } from './worldBroadcast'
import WorldGuideDesk from './WorldGuideDesk'
import { guideReceipt, normalizeGuideIndex } from './worldBroadcastGuides'

const channels: BroadcastChannel[] = [
  { id: 'ExampleNews.us', name: 'Example News', country: 'US', categories: ['news'],
    languages: ['eng'], officialUrl: 'https://publisher.example.org/watch' },
  { id: 'Other.fr', name: 'Another Station', country: 'FR', categories: ['culture'],
    languages: ['fra'], officialUrl: 'https://other.example.org' },
]
const SECRET = 'https://secret.example.org/listings.xml?token=do-not-keep'
const records = [
  {
    channel: 'ExampleNews.us', site: 'Guide.Example.COM', site_name: 'TV Listings & Co',
    feed: 'Main', lang: 'en',
    site_id: 'private-provider-id',
    sources: [
      { format: 'XML', host: 'untrusted.example.org', url: SECRET, secret: 'hidden' },
      { format: 'JSON', url: 'http://example.org/source.json' },
    ],
  },
  {
    channel: 'ExampleNews.us', site: 'Guide.Example.COM', site_name: 'Repeated',
    feed: 'Main', lang: 'en', sources: [{ format: 'XML', url: SECRET }],
  },
  {
    channel: 'Other.fr', site: 'guide.fr', site_name: '<script>spoof</script>',
    lang: 'fr', sources: [{ format: 'XML', url: 'https://guide.fr/listing.xml' }],
  },
  { channel: 'Missing.de', site: 'guide.de', sources: [{ format: 'XML', url: SECRET }] },
  { channel: 'Other.fr', site: 'localhost', site_name: 'local',
    sources: [{ format: 'XML', url: SECRET }] },
  { channel: 'Other.fr', site: 'bad<script>.com',
    sources: [{ format: 'XML', url: SECRET }] },
  { channel: 'Other.fr', site: 'empty.example.org', sources: [] },
  { channel: 'Other.fr', site: 'invalid.example.org',
    sources: [{ format: '<script>', url: SECRET }] },
]

describe('RCTV v2.3 Guide Desk: metadata-only provenance', () => {
  it('normalizes known guides, deduplicates rows, and excludes malformed source entries', () => {
    const result = normalizeGuideIndex(records, channels)
    expect(result.indexedChannels).toEqual(new Set(['ExampleNews.us', 'Other.fr']))
    expect(result.indexedSourceRows).toBe(2)
    expect(result.byChannel.get('ExampleNews.us')).toEqual([
      { channelId: 'ExampleNews.us', site: 'guide.example.com',
        siteName: 'TV Listings & Co', language: 'en', feed: 'Main',
        formats: ['JSON','XML'], sourceCount: 2 },
    ])
    expect(result.byChannel.get('Other.fr')?.[0].language).toBe('fr')
  })

  it('never retains source URLs, host headers, tokens, site IDs, or playback data', () => {
    const result = normalizeGuideIndex(records, channels)
    const serialized = JSON.stringify([...result.byChannel.entries()])
    const receipt = guideReceipt(channels[0], result.byChannel.get('ExampleNews.us') ?? [])
    for (const forbidden of [SECRET, 'secret.example.org', 'do-not-keep', 'private-provider-id',
      'untrusted.example.org', 'http://example.org/source.json', 'hidden',
      'streamUrl', 'source.url']) {
      expect(serialized).not.toContain(forbidden)
      expect(receipt).not.toContain(forbidden)
    }
    const parsed = JSON.parse(receipt)
    expect(parsed.schema).toBe('RCTV_GUIDE_SOURCE_RECEIPT_V1')
    expect(parsed.provenance).toBe('IPTV_ORG_INDEX_METADATA_UNVERIFIED')
    expect(parsed.channelId).toBe('ExampleNews.us')
    expect(parsed.sources).toHaveLength(1)
    expect(parsed.limits).toContain('No schedule')
    expect(receipt).not.toContain('https://')
  })

  it('is bounded even when upstream includes many records or invalid values', () => {
    expect(normalizeGuideIndex(null, channels).indexedSourceRows).toBe(0)
    expect(normalizeGuideIndex({}, channels).indexedSourceRows).toBe(0)
    expect(normalizeGuideIndex(new Array(100_001).fill({}), channels).indexedSourceRows).toBe(0)
    const huge = Array.from({ length: 40 }, (_, i) => ({
      channel: 'ExampleNews.us', site: 'site' + i + '.example.org',
      site_name: 'Site ' + i, lang: 'en',
      sources: Array.from({ length: 35 }, () => ({ url: SECRET, format: 'XML' })),
    }))
    const result = normalizeGuideIndex(huge, channels)
    expect(result.byChannel.get('ExampleNews.us')).toHaveLength(12)
    expect(result.byChannel.get('ExampleNews.us')?.[0].sourceCount).toBe(20)
    expect(result.indexedSourceRows).toBe(12)
  })

  it('renders no autoplay, media, XMLTV links, logos, or untrusted provider anchors', () => {
    const index = normalizeGuideIndex(records, channels)
    const html = renderToStaticMarkup(<WorldGuideDesk index={index} channels={channels}
      selectedId="ExampleNews.us" onSelect={() => {}} onlyWithGuides={false}
      onOnlyWithGuides={() => {}} status="ready" onLoad={() => {}} />)
    expect(html).toContain('World TV Guide Desk')
    expect(html).toContain('TV Listings &amp; Co')
    expect(html).not.toContain(SECRET)
    expect(html).not.toContain('guide.example.com/listings')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('<video')
    expect(html).not.toContain('<audio')
    expect(html).not.toContain('autoplay')
    expect(html).toContain('href="https://publisher.example.org/watch"')
    expect(html).not.toContain('href="https://secret.example.org')
  })
})
