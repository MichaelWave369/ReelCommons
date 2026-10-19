import { describe, expect, it } from 'vitest'
import { inspectLocalM3u, MAX_PLAYLIST_ITEMS } from './m3uInspection'

describe('quarantined M3U directory preview', () => {
  it('extracts only safe title, public host and format hint, never a tokenized stream URL', () => {
    const report = inspectLocalM3u('#EXTM3U\n#EXTINF:-1 tvg-id="demo",My public channel\nhttps://media.example.org/live/a.m3u8?token=PRIVATE\n')
    expect(report.entries).toEqual([{
      id: 1, name: 'My public channel', originHost: 'media.example.org',
      streamFormatHint: 'HLS', hadMetadata: true,
    }])
    expect(JSON.stringify(report)).not.toContain('PRIVATE')
    expect(report.verdict).toBe('METADATA_PREVIEW_ONLY')
  })
  it('rejects schemes, local networks, private IPs and embedded userinfo', () => {
    const report = inspectLocalM3u('#EXTM3U\n' + [
      'http://example.org/feed', 'javascript:alert(1)', 'file:///etc/passwd',
      'https://127.0.0.1/stream', 'https://192.168.0.2/a.m3u8',
      'https://10.2.1.4/a.m3u8', 'https://172.25.1.8/a.m3u8',
      'https://169.254.3.2/a.m3u8', 'https://localhost/a.m3u8',
      'https://someone:password@example.org/x', 'https://[::1]/a', 'https://real.example.org/a.mp3'
    ].join('\n'))
    expect(report.entries).toHaveLength(1)
    expect(report.entries[0].streamFormatHint).toBe('MP3')
    expect(report.skipped).toBe(11)
  })
  it('does not misinterpret HLS segment manifests as channel lists', () => {
    expect(() => inspectLocalM3u('#EXTM3U\n#EXT-X-VERSION:3\n#EXTINF:4,\nsegment.ts')).toThrow(/segment manifest/)
    expect(() => inspectLocalM3u('not m3u')).toThrow(/#EXTM3U/)
  })
  it('limits entries and input length before allocating unbounded metadata', () => {
    const inputs = Array.from({length: 120}, (_,i) => '#EXTINF:-1,Test '+i+'\nhttps://example.org/'+i+'.m3u8').join('\n')
    const report = inspectLocalM3u('#EXTM3U\n'+inputs)
    expect(report.entries).toHaveLength(MAX_PLAYLIST_ITEMS)
    expect(report.skipped).toBe(20)
    expect(() => inspectLocalM3u('a'.repeat(96001))).toThrow(/96 KB/)
  })
  it('keeps metadata-only interpretation even if a playlist claims an authorized name', () => {
    const report = inspectLocalM3u('#EXTM3U\n#EXTINF:-1,Official NASA\nhttps://somewhere.example/live\n')
    expect(report.entries[0].originHost).toBe('somewhere.example')
    expect(report.warnings.join(' ')).toContain('does not establish broadcaster authorization')
  })
})
