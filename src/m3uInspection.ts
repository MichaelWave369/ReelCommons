/**
 * RCTV v1.3 local, quarantine-only M3U inspector.
 *
 * Never fetches, embeds, follows or plays imported URLs. Imported playlists
 * have NO authority to grant streaming rights or assert current availability.
 * No remote lookup, credential parsing, user tracking or media downloads.
 */
export const MAX_PLAYLIST_BYTES = 96_000
export const MAX_PLAYLIST_ITEMS = 100
export interface PlaylistEntry {
  id: number
  name: string
  originHost: string
  streamFormatHint: 'HLS' | 'MP3' | 'AAC' | 'OTHER'
  hadMetadata: boolean
}
export interface PlaylistInspection {
  kind: 'UNVERIFIED_LOCAL_M3U_INDEX'
  entries: PlaylistEntry[]
  scannedLines: number
  skipped: number
  warnings: string[]
  verdict: 'METADATA_PREVIEW_ONLY'
}
const isLocal = (host: string): boolean => {
  const s = host.toLowerCase().replace(/^\[|\]$/g, '')
  if (!s || s === 'localhost' || s.endsWith('.localhost') || s.endsWith('.local') ||
      s.endsWith('.internal') || s.endsWith('.test') || s.endsWith('.invalid') ||
      s === '0.0.0.0' || s === '::1') return true
  const match = s.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (match) {
    const nums = match.slice(1).map(Number)
    if (nums.some((n) => n > 255)) return true
    const [a,b] = nums
    return a === 0 || a === 10 || a === 127 || a >= 224 ||
      a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 ||
      a === 192 && b === 168 || a === 100 && b >= 64 && b <= 127 ||
      a === 192 && b === 0 && nums[2] === 0 ||
      a === 198 && (b === 18 || b === 19)
  }
  if (s.includes(':')) return true // no IP literals: IPv6 address/ranges
  return false
}
function inspectUrl(raw: string): { host: string; hint: PlaylistEntry['streamFormatHint'] } | null {
  try {
    const url = new URL(raw.trim())
    if (url.protocol !== 'https:' || !!url.username || !!url.password ||
      isLocal(url.hostname) || !url.hostname.includes('.')) return null
    const path = url.pathname.toLowerCase()
    const hint: PlaylistEntry['streamFormatHint'] =
      /\.m3u8?$/.test(path) ? 'HLS' : /\.mp3$/.test(path) ? 'MP3' :
      /\.aac$/.test(path) ? 'AAC' : 'OTHER'
    return { host: url.hostname.slice(0, 100), hint }
  } catch { return null }
}
function safeLabel(raw: string): string {
  return [...raw].filter((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127)
    .join('').trim().slice(0, 90)
}
export function inspectLocalM3u(raw: string): PlaylistInspection {
  if (raw.length > MAX_PLAYLIST_BYTES) throw new Error('M3U index exceeds the 96 KB preview limit.')
  const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/)
  if (!lines[0]?.trim().toUpperCase().startsWith('#EXTM3U')) {
    throw new Error('Expected a channel-index M3U file beginning with #EXTM3U.')
  }
  if (lines.some((line) => /^#EXT-X-/i.test(line.trim()))) {
    throw new Error('This looks like an HLS segment manifest, not a channel-directory M3U playlist.')
  }
  const entries: PlaylistEntry[] = []
  let name = ''
  let metadata = false
  let skipped = 0
  let discardedOverLimit = 0
  for (const line of lines.slice(1)) {
    const s = line.trim()
    if (!s) continue
    if (/^#EXTINF:/i.test(s)) {
      const comma = s.lastIndexOf(',')
      name = comma >= 0 ? safeLabel(s.slice(comma + 1)) : ''
      metadata = true
      continue
    }
    if (s.startsWith('#')) continue
    const url = inspectUrl(s)
    if (!url) {
      skipped++
    } else if (entries.length >= MAX_PLAYLIST_ITEMS) {
      discardedOverLimit++
    } else {
      entries.push({
        id: entries.length + 1, name: name || 'Unnamed playlist entry',
        originHost: url.host, streamFormatHint: url.hint, hadMetadata: metadata,
      })
    }
    name = ''
    metadata = false
  }
  const warnings = [
    'Local playlist metadata is unverified and does not establish broadcaster authorization or streaming rights.',
    'RCTV has not fetched, connected to, played or tested any imported URL.',
    'Stream URLs, tokens, query strings and credentials are intentionally not retained in the report.',
  ]
  if (skipped) warnings.push(skipped + ' untrusted, non-HTTPS, local-network or malformed URL(s) were skipped.')
  if (discardedOverLimit) warnings.push('Input exceeded the 100-entry preview cap; remaining entries were discarded.')
  return {
    kind: 'UNVERIFIED_LOCAL_M3U_INDEX', entries, scannedLines: lines.length,
    skipped: skipped + discardedOverLimit, warnings, verdict: 'METADATA_PREVIEW_ONLY',
  }
}
