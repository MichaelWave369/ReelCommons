/**
 * RCTV v2.4 · Reviewed Playback Bridge.
 *
 * This roster references ONLY checked-in, hand-reviewed RCTV sources.
 * It does not read IPTV-org channel IDs, guide sources, M3U/HLS, pasted URLs,
 * browser storage, or dynamically discovered endpoints.
 */
import { ALL_OPEN_STREAMS } from './cameraCatalog'
import { playableUrl } from './openStreams'
import type { OpenStream } from './openStreams'

export const REVIEWED_BRIDGE_IDS = [
  'nasa-iss', 'kexp', 'cbs-news', 'abc-news', 'pbs-online', 'house-live', 'nasa-live',
] as const
export type ReviewedBridgeId = typeof REVIEWED_BRIDGE_IDS[number]
export type ReviewedBridgeMode = 'youtube-video' | 'published-audio' | 'official-website'

export interface ReviewedBridgeStation {
  id: ReviewedBridgeId
  source: OpenStream
  mode: ReviewedBridgeMode
  review: string
}

/** An explicit hand-authored roster, not an importer. Keep new sources gated on evidence. */
const REVIEW_NOTES: Record<ReviewedBridgeId, string> = {
  'nasa-iss': 'NASA-operated ISS video on official YouTube, via YouTube\'s documented privacy-enhanced embed interface. Video availability and embedding remain platform-controlled.',
  kexp: 'KEXP publishes its 160K AAC listening link for use by third-party players. Personal listening only; no redistribution or recording.',
  'cbs-news': 'CBS News provides the viewing experience on its own official website. No inline permission is established.',
  'abc-news': 'ABC News provides the viewing experience on its own official website. No inline permission is established.',
  'pbs-online': 'PBS controls local-station live access, eligibility and terms. No inline permission is established.',
  'house-live': 'U.S. House FloorCast is an official, scheduled proceedings page. No inline permission is established.',
  'nasa-live': 'NASA publishes official live programming and event times. This link does not imply permission to restream events.',
}
const SOURCES_BY_ID = new Map(ALL_OPEN_STREAMS.map((source) => [source.id, source]))

export const REVIEWED_BRIDGE_ROSTER: readonly ReviewedBridgeStation[] =
  REVIEWED_BRIDGE_IDS.flatMap((id) => {
    const source = SOURCES_BY_ID.get(id)
    if (!source || !source.officialUrl.startsWith('https://')) return []
    let mode: ReviewedBridgeMode = 'official-website'
    if (id === 'nasa-iss' && playableUrl(source) !== null) mode = 'youtube-video'
    if (id === 'kexp' && playableUrl(source) !== null) mode = 'published-audio'
    return [{ id, source, mode, review: REVIEW_NOTES[id] }]
  })

/** Never accepts arbitrary source objects or channel URLs, only vetted built-in IDs. */
export function reviewedMediaUrl(id: string): string | null {
  const row = REVIEWED_BRIDGE_ROSTER.find((item) => item.id === id)
  if (!row || row.mode === 'official-website') return null
  return playableUrl(row.source)
}
export interface BridgeSelection {
  selectedId: ReviewedBridgeId
  loadedId: ReviewedBridgeId | null
}
/** Selection, unload and denied requests always destroy the old media element. */
export function moveBridgeStation(state: BridgeSelection, id: string): BridgeSelection {
  const station = REVIEWED_BRIDGE_ROSTER.find((item) => item.id === id)
  return station ? { selectedId: station.id, loadedId: null } : { ...state, loadedId: null }
}
export function loadBridgeMedia(state: BridgeSelection): BridgeSelection {
  return reviewedMediaUrl(state.selectedId)
    ? { selectedId: state.selectedId, loadedId: state.selectedId }
    : { ...state, loadedId: null }
}
export function unloadBridgeMedia(state: BridgeSelection): BridgeSelection {
  return { ...state, loadedId: null }
}

/**
 * Metadata-only governance snapshot for future audits. Not proof a player
 * loaded or a broadcaster granted a transfer/rebroadcast license.
 */
export function reviewedBridgeReceipt(id: string): string | null {
  const row = REVIEWED_BRIDGE_ROSTER.find((item) => item.id === id)
  if (!row) return null
  return JSON.stringify({
    schema: 'RCTV_REVIEWED_BRIDGE_RECEIPT_V1',
    provenance: 'CHECKED_IN_RCTV_REVIEWED_SOURCE',
    sourceId: row.id,
    name: row.source.name,
    playbackMode: row.mode,
    officialSite: row.source.officialUrl,
    evidence: row.source.sourceEvidence,
    reviewNote: row.review,
    limits: 'Review of playback method only. Does not prove current availability, advertiser clearance, copyright ownership, offline rights or permission to rebroadcast.',
  }, null, 2)
}
