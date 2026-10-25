/**
 * RCTV v2.7 Playback Trust Gate.
 *
 * Local, deterministic policy audit of CHECKED-IN channel declarations.
 * This verifies software configuration, NOT legal permission or live uptime.
 * Never imports candidate drafts, browser storage, M3U or IPTV-org content.
 */
import { ALL_OPEN_STREAMS } from './cameraCatalog'
import { playableUrl } from './openStreams'
import type { OpenStream } from './openStreams'
import { REVIEWED_BRIDGE_ROSTER } from './reviewedPlaybackBridge'

export const TRUST_GATE_SCHEMA = 'RCTV_PLAYBACK_TRUST_GATE_V1'
export const TRUST_GATE_PROVENANCE = 'CHECKED_IN_CODE_CONFIGURATION_ONLY'
export const TRUST_GATE_POLICY_REVISION = '2026-10-25-v1'

type TrustGateMode = 'youtube-embed' | 'published-audio' | 'official'
export interface TrustGateDeclaration {
  id: string
  mode: TrustGateMode
  /** Exact checked-in media route expected from playableUrl. Null prohibits inline media. */
  mediaRoute: string | null
  evidence: string
  boundary: string
}

/** Manual source-code policy. Additional inline routes require a reviewed PR here too. */
export const TRUST_GATE_DECLARATIONS: readonly TrustGateDeclaration[] = [
  {
    id: 'nasa-iss', mode: 'youtube-embed',
    mediaRoute: 'https://www.youtube-nocookie.com/embed/jKHvbJe9c_Y?rel=0',
    evidence: 'NASA official ISS YouTube source and YouTube supported embed documentation',
    boundary: 'YouTube/platform may deny embedding or change availability; no copying, transcoding or redistribution.',
  },
  {
    id: 'kexp', mode: 'published-audio',
    mediaRoute: 'https://kexp.streamguys1.com/kexp160.aac',
    evidence: 'KEXP official published third-party listening URL: https://www.kexp.org/mobile/kexp-livestreams/',
    boundary: 'Publisher-listed personal listening only, no recording/proxy/rebroadcast; regional restrictions may apply.',
  },
  {
    id: 'cbs-news', mode: 'official', mediaRoute: null,
    evidence: 'CBS News official live viewing destination',
    boundary: 'Official site only: embedding/playback rights have not been independently established.',
  },
  {
    id: 'abc-news', mode: 'official', mediaRoute: null,
    evidence: 'ABC News official live destination',
    boundary: 'Official site only: embedding/playback rights have not been independently established.',
  },
  {
    id: 'pbs-online', mode: 'official', mediaRoute: null,
    evidence: 'PBS official station and local playback page',
    boundary: 'Official site only: local coverage and eligibility are broadcaster-controlled.',
  },
  {
    id: 'house-live', mode: 'official', mediaRoute: null,
    evidence: 'U.S. House official proceedings page',
    boundary: 'Official site only: event schedule and availability vary.',
  },
  {
    id: 'nasa-live', mode: 'official', mediaRoute: null,
    evidence: 'NASA official events and live programming page',
    boundary: 'Official site only: event schedule and playback policy are broadcaster-controlled.',
  },
]

export type TrustGateIssueCode =
  | 'DUPLICATE_SOURCE_ID'
  | 'UNDECLARED_PLAYABLE_ROUTE'
  | 'ROUTE_MISMATCH'
  | 'POLICY_MODE_MISMATCH'
  | 'UNREVIEWED_INLINE_MODE'
  | 'MISSING_REVIEWED_SOURCE'
  | 'MISSING_EVIDENCE'
  | 'UNSAFE_OFFICIAL_SITE'
  | 'REVIEW_ROSTER_MISMATCH'
  | 'DUPLICATE_POLICY_ID'
  | 'INVALID_POLICY_MODE'
  | 'POLICY_MEDIA_MISMATCH'
export interface TrustGateIssue {
  sourceId: string
  code: TrustGateIssueCode
}
export interface TrustGateAudit {
  status: 'code-consistent' | 'engineering-review-required'
  checkedSources: number
  directoryOnly: number
  declaredSourceCount: number
  reviewedMediaRoutes: number
  issues: TrustGateIssue[]
}

const expectedEndpoint = (id: string): string | null =>
  id === 'nasa-iss' ? 'https://www.youtube-nocookie.com/embed/jKHvbJe9c_Y?rel=0'
  : id === 'kexp' ? 'https://kexp.streamguys1.com/kexp160.aac' : null

function publicSite(source: OpenStream): boolean {
  try {
    const uri = new URL(source.officialUrl)
    if (uri.protocol !== 'https:' || !!uri.username || !!uri.password || !!uri.port) return false
    const host = uri.hostname.toLowerCase()
    const declared = source.officialDomain.toLowerCase()
    if (!/^[a-z0-9.-]+$/.test(host) || !host.includes('.') ||
        host.includes('..') || !/^[a-z0-9.-]+$/.test(declared) || !declared.includes('.')) return false
    return host === declared || host.endsWith('.' + declared)
  } catch { return false }
}

/**
 * Strict code gate. Never probes external network or imports browser candidates.
 * Different callers may supply test catalogs; the shipped UI audits only checked-in data.
 */
export function auditPlaybackTrust(
  sources: readonly OpenStream[],
  declarations: readonly TrustGateDeclaration[],
  rosterIds: readonly string[],
): TrustGateAudit {
  const issues: TrustGateIssue[] = []
  const add = (sourceId: string, code: TrustGateIssueCode) => { issues.push({ sourceId, code }) }
  const seenSources = new Set<string>()
  const sourceById = new Map<string, OpenStream>()
  for (const source of sources) {
    if (seenSources.has(source.id)) add(source.id, 'DUPLICATE_SOURCE_ID')
    seenSources.add(source.id)
    sourceById.set(source.id, source)
    if (!publicSite(source)) add(source.id, 'UNSAFE_OFFICIAL_SITE')
  }
  const seenDeclarations = new Set<string>()
  for (const row of declarations) {
    if (seenDeclarations.has(row.id)) add(row.id, 'DUPLICATE_POLICY_ID')
    seenDeclarations.add(row.id)
    if (row.mediaRoute !== expectedEndpoint(row.id)) add(row.id, 'POLICY_MEDIA_MISMATCH')
    if (row.id === 'nasa-iss' && row.mode !== 'youtube-embed' ||
        row.id === 'kexp' && row.mode !== 'published-audio' ||
        row.id !== 'nasa-iss' && row.id !== 'kexp' && row.mode !== 'official') {
      add(row.id, 'INVALID_POLICY_MODE')
    }
    if (!row.evidence.trim() || row.evidence.length < 20 ||
        !row.boundary.trim() || row.boundary.length < 20) add(row.id, 'MISSING_EVIDENCE')
    const source = sourceById.get(row.id)
    if (!source) { add(row.id, 'MISSING_REVIEWED_SOURCE'); continue }
    if (source.playback !== row.mode) add(row.id, 'POLICY_MODE_MISMATCH')
    if (playableUrl(source) !== row.mediaRoute) add(row.id, 'ROUTE_MISMATCH')
    if (source.sourceEvidence.length < 12 || source.playbackNote.length < 15)
      add(row.id, 'MISSING_EVIDENCE')
  }
  const declared = new Map(declarations.map((row) => [row.id, row]))
  let mediaRoutes = 0
  for (const source of sources) {
    const route = playableUrl(source)
    if (route !== null) {
      mediaRoutes++
      if (!declared.has(source.id)) add(source.id, 'UNDECLARED_PLAYABLE_ROUTE')
    }
    if (!declared.has(source.id) && source.playback !== 'official')
      add(source.id, 'UNREVIEWED_INLINE_MODE')
  }
  const roster = new Set(rosterIds)
  for (const declaredId of declared.keys()) {
    if (!roster.has(declaredId)) add(declaredId, 'REVIEW_ROSTER_MISMATCH')
  }
  for (const rosterId of roster) {
    if (!declared.has(rosterId)) add(rosterId, 'REVIEW_ROSTER_MISMATCH')
  }
  const sorted = issues.sort((a, b) => a.sourceId.localeCompare(b.sourceId) || a.code.localeCompare(b.code))
  return {
    status: sorted.length === 0 ? 'code-consistent' : 'engineering-review-required',
    checkedSources: sources.length,
    directoryOnly: sources.length - mediaRoutes,
    declaredSourceCount: declarations.length,
    reviewedMediaRoutes: mediaRoutes,
    issues: sorted,
  }
}

export function auditCheckedInPlayback(): TrustGateAudit {
  return auditPlaybackTrust(
    ALL_OPEN_STREAMS,
    TRUST_GATE_DECLARATIONS,
    REVIEWED_BRIDGE_ROSTER.map(({ id }) => id),
  )
}

export function trustGateReport(audit: TrustGateAudit): string {
  return JSON.stringify({
    schema: TRUST_GATE_SCHEMA,
    provenance: TRUST_GATE_PROVENANCE,
    policyRevision: TRUST_GATE_POLICY_REVISION,
    status: audit.status,
    checkedSourceCount: audit.checkedSources,
    directoryOnlyCount: audit.directoryOnly,
    reviewedMediaRouteCount: audit.reviewedMediaRoutes,
    sourceControlledDeclarationCount: audit.declaredSourceCount,
    issues: audit.issues,
    notice: 'Deterministic local source-code consistency check only. Not proof of publisher authorization, current availability, verification of terms, stream uptime or right to rebroadcast. No media endpoints or viewer data are exported.',
  }, null, 2)
}
