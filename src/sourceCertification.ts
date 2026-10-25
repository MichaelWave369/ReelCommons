/**
 * RCTV v2.5 · Source Certification Lab (research intake only).
 *
 * Candidate packets are USER-SUPPLIED UNVERIFIED notes, never trust authority.
 * Deliberately no import into OpenStream, playableUrl, World TV, or media player.
 */
import { officialBroadcastUrl } from './worldBroadcast'

export const SOURCE_LAB_STORAGE_KEY = 'rctv-source-lab-drafts-v1'
export const SOURCE_LAB_SCHEMA = 'RCTV_SOURCE_INTAKE_PACKET_V1'
export const SOURCE_LAB_PROVENANCE = 'USER_SUPPLIED_UNVERIFIED'
export const SOURCE_LAB_MAX_DRAFTS = 40
export const SOURCE_LAB_MAX_BYTES = 64_000

export const SOURCE_LAB_CHECKS = [
  { id: 'publisher', label: 'Official broadcaster identity and ownership documented' },
  { id: 'terms', label: 'Publisher terms and applicable usage restrictions read' },
  { id: 'permission', label: 'Evidence of permission for the proposed playback method recorded' },
  { id: 'territory', label: 'Regional restrictions and availability caveats documented' },
  { id: 'privacy', label: 'Third-party requests, tracking and privacy implications documented' },
  { id: 'fallback', label: 'Official website fallback and failure behavior specified' },
  { id: 'manual', label: 'Manual browser playback test and browser limitations recorded' },
] as const

export type SourceLabCheckId = typeof SOURCE_LAB_CHECKS[number]['id']
export type SourceLabMethod = 'official-site' | 'youtube-embed' | 'published-audio'
export interface SourceLabCandidate {
  id: string
  name: string
  homepage: string
  proposedMethod: SourceLabMethod
  evidenceNotes: string
  checked: SourceLabCheckId[]
  createdUtc: string
}
export interface SourceLabInput {
  name: string
  homepage: string
  proposedMethod: SourceLabMethod
  evidenceNotes: string
}

const exactKeys = (v: Record<string, unknown>, expected: readonly string[]): boolean =>
  Object.keys(v).sort().join('|') === [...expected].sort().join('|')
const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v)
const DATE_RE = /^20\d{2}-\d{2}-\d{2}$/
const ID_RE = /^cand-[a-zA-Z0-9-]{6,80}$/
const METHODS: readonly SourceLabMethod[] = ['official-site', 'youtube-embed', 'published-audio']
const CHECK_IDS = SOURCE_LAB_CHECKS.map(({ id }) => id)

export function isSourceLabDate(v: unknown): v is string {
  if (typeof v !== 'string' || !DATE_RE.test(v)) return false
  const n = Date.parse(v + 'T00:00:00Z')
  return Number.isFinite(n) && new Date(n).toISOString().slice(0,10) === v
}

/** Only public HTTPS official site homepages; never accept media or signed API URLs. */
export function safeSourceLabHomepage(value: unknown): string | null {
  const parsed = officialBroadcastUrl(value)
  if (!parsed) return null
  try {
    const u = new URL(parsed)
    if (u.search || u.hash || /.(?:m3u8?|mp[34]|aac|ogg|xml|json|ts)(?:$|\/)/i.test(u.pathname)) return null
    return parsed
  } catch { return null }
}

export function sourceLabStage(candidate: SourceLabCandidate): 'needs-evidence' | 'ready-for-independent-review' {
  return candidate.checked.length === SOURCE_LAB_CHECKS.length &&
    candidate.evidenceNotes.trim().length >= 40
    ? 'ready-for-independent-review' : 'needs-evidence'
}
export function sourceLabProgress(candidate: SourceLabCandidate): number {
  return candidate.checked.length
}
export function createSourceLabCandidate(input: SourceLabInput, id: string, date: string): SourceLabCandidate {
  const name = input.name.trim()
  const homepage = safeSourceLabHomepage(input.homepage)
  const notes = input.evidenceNotes.trim()
  if (!ID_RE.test(id) || !isSourceLabDate(date) || name.length < 2 || name.length > 100 ||
      !homepage || !METHODS.includes(input.proposedMethod) || notes.length > 1000) {
    throw new Error('Use a name (2–100 characters), valid official HTTPS site, and supported method. No media URLs or private network addresses.')
  }
  return {
    id, name, homepage, proposedMethod: input.proposedMethod,
    evidenceNotes: notes, checked: [], createdUtc: date,
  }
}
export function toggleSourceLabCheck(candidate: SourceLabCandidate, key: SourceLabCheckId): SourceLabCandidate {
  if (!CHECK_IDS.includes(key)) return candidate
  const checked = candidate.checked.includes(key)
    ? candidate.checked.filter((id) => id !== key)
    : CHECK_IDS.filter((id) => candidate.checked.includes(id) || id === key)
  return { ...candidate, checked }
}
export function updateSourceLabNotes(candidate: SourceLabCandidate, notes: string): SourceLabCandidate {
  return { ...candidate, evidenceNotes: notes.slice(0, 1000) }
}

/**
 * Strict import; never carry forward a declared "certified", "approved",
 * "playableUrl", playback token, custom URL field, or executable value.
 */
function assertCandidate(value: unknown): SourceLabCandidate {
  if (!isRecord(value) || !exactKeys(value, [
    'id','name','homepage','proposedMethod','evidenceNotes','checked','createdUtc',
  ])) throw new Error('Candidate fields are not recognized.')
  if (typeof value.name !== 'string' || typeof value.evidenceNotes !== 'string' ||
      typeof value.proposedMethod !== 'string' || !METHODS.includes(value.proposedMethod as SourceLabMethod) ||
      typeof value.id !== 'string' || !ID_RE.test(value.id) || !isSourceLabDate(value.createdUtc) ||
      value.name !== value.name.trim() || value.name.length < 2 || value.name.length > 100 ||
      value.evidenceNotes.length > 1000 ||
      typeof value.homepage !== 'string' || safeSourceLabHomepage(value.homepage) !== value.homepage ||
      !Array.isArray(value.checked) || value.checked.length > CHECK_IDS.length ||
      value.checked.some((v) => typeof v !== 'string' || !CHECK_IDS.includes(v as SourceLabCheckId)) ||
      new Set(value.checked).size !== value.checked.length) {
    throw new Error('Candidate does not meet the source-intake validation requirements.')
  }
  return {
    id: value.id, name: value.name, homepage: value.homepage,
    proposedMethod: value.proposedMethod as SourceLabMethod,
    evidenceNotes: value.evidenceNotes, checked: CHECK_IDS.filter((id) => (value.checked as SourceLabCheckId[]).includes(id)),
    createdUtc: value.createdUtc,
  }
}

export function exportSourceLabPacket(candidates: readonly SourceLabCandidate[]): string {
  if (candidates.length > SOURCE_LAB_MAX_DRAFTS) throw new Error('Too many drafts to export.')
  const packet = {
    schema: SOURCE_LAB_SCHEMA, provenance: SOURCE_LAB_PROVENANCE,
    notice: 'Self-reported intake notes only. No authorization, license, playback readiness or independent verification. Only reviewed source-code changes can enable playback.',
    candidates: candidates.map((candidate) => assertCandidate(candidate)),
  }
  const raw = JSON.stringify(packet, null, 2)
  if (raw.length > SOURCE_LAB_MAX_BYTES) throw new Error('Export exceeds 64 KB.')
  return raw
}
export function importSourceLabPacket(raw: string): SourceLabCandidate[] {
  if (raw.length > SOURCE_LAB_MAX_BYTES) throw new Error('Source packet exceeds 64 KB.')
  let value: unknown
  try { value = JSON.parse(raw) } catch { throw new Error('Source packet is not valid JSON.') }
  if (!isRecord(value) || !exactKeys(value, ['schema','provenance','notice','candidates']) ||
      value.schema !== SOURCE_LAB_SCHEMA || value.provenance !== SOURCE_LAB_PROVENANCE ||
      typeof value.notice !== 'string' || value.notice.length > 350 ||
      !Array.isArray(value.candidates) || value.candidates.length > SOURCE_LAB_MAX_DRAFTS) {
    throw new Error('Unrecognized packet, provenance or excessive draft count.')
  }
  const drafts = value.candidates.map(assertCandidate)
  if (new Set(drafts.map(({id}) => id)).size !== drafts.length) throw new Error('Duplicate draft IDs found.')
  return drafts
}
export function readStoredSourceLabDrafts(raw: string | null): SourceLabCandidate[] {
  if (!raw) return []
  try { return importSourceLabPacket(raw) } catch { return [] }
}
export function mergeSourceLabDrafts(
  current: readonly SourceLabCandidate[], imported: readonly SourceLabCandidate[],
): SourceLabCandidate[] {
  const output = [...current]
  const used = new Set(current.map((draft) => draft.id))
  for (const draft of imported) {
    if (output.length >= SOURCE_LAB_MAX_DRAFTS) break
    if (used.has(draft.id)) continue
    output.push(draft); used.add(draft.id)
  }
  return output
}
