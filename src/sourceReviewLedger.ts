/**
 * RCTV v2.6 · Source Review Ledger
 * Browser-local, append-only-in-UI record of self-reported evidence snapshots and
 * proposed review dispositions. Neither authenticity nor publisher consent is proven.
 * Imported/exported records NEVER feed the actual RCTV playback allowlist.
 */
import {
  SOURCE_LAB_SCHEMA, SOURCE_LAB_PROVENANCE,
  exportSourceLabPacket, importSourceLabPacket,
} from './sourceCertification'
import type { SourceLabCandidate } from './sourceCertification'

export const REVIEW_LEDGER_KEY = 'rctv-source-review-ledger-v1'
export const REVIEW_LEDGER_SCHEMA = 'RCTV_SOURCE_REVIEW_LEDGER_V1'
export const REVIEW_LEDGER_PROVENANCE = 'USER_RECORDED_UNVERIFIED'
export const REVIEW_LEDGER_MAX_ENTRIES = 100
export const REVIEW_LEDGER_MAX_BYTES = 128_000

export type ReviewAction = 'snapshot' | 'review-note'
export type ReviewDisposition =
  | 'not-assessed' | 'request-more-evidence'
  | 'decline-candidate' | 'recommend-code-review'
export interface ReviewEntry {
  id: string
  candidateId: string
  recordedUtc: string
  action: ReviewAction
  disposition: ReviewDisposition
  note: string
  snapshot: SourceLabCandidate
}
export const REVIEW_DISPOSITIONS: ReadonlyArray<{ id: Exclude<ReviewDisposition,'not-assessed'>; label: string }> = [
  { id: 'request-more-evidence', label: 'Request more evidence' },
  { id: 'decline-candidate', label: 'Decline candidate' },
  { id: 'recommend-code-review', label: 'Recommend independent code review (NOT approval)' },
]

const keys = (v: Record<string, unknown>, allowed: readonly string[]) =>
  Object.keys(v).sort().join('|') === [...allowed].sort().join('|')
const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v)
const ID_RE = /^rev-[a-zA-Z0-9-]{6,80}$/
const UTC_RE = /^20\d\d-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}Z$/
const DISPOSITIONS: readonly ReviewDisposition[] = ['not-assessed', ...REVIEW_DISPOSITIONS.map(({id})=>id)]

function validTimestamp(v: unknown): v is string {
  if (typeof v !== 'string' || !UTC_RE.test(v)) return false
  const n = Date.parse(v)
  return Number.isFinite(n) && new Date(n).toISOString() === v
}
function cleanCandidate(candidate: SourceLabCandidate): SourceLabCandidate {
  // Reuse v2.5's exact-field, hostname, media-URL and checklist gate for snapshots.
  return importSourceLabPacket(exportSourceLabPacket([candidate]))[0]
}
function parseEntry(v: unknown): ReviewEntry {
  if (!isRecord(v) || !keys(v, ['id','candidateId','recordedUtc','action','disposition','note','snapshot']) ||
    typeof v.id !== 'string' || !ID_RE.test(v.id) ||
    typeof v.candidateId !== 'string' || typeof v.recordedUtc !== 'string' ||
    !validTimestamp(v.recordedUtc) ||
    (v.action !== 'snapshot' && v.action !== 'review-note') ||
    typeof v.disposition !== 'string' || !DISPOSITIONS.includes(v.disposition as ReviewDisposition) ||
    typeof v.note !== 'string' || v.note.length > 600 ||
    (v.action === 'snapshot' && (v.disposition !== 'not-assessed' || v.note !== '')) ||
    (v.action === 'review-note' && (v.disposition === 'not-assessed' || v.note.trim().length < 15))) {
    throw new Error('Invalid ledger event fields, date or disposition.')
  }
  const snapshot = cleanCandidate(v.snapshot as SourceLabCandidate)
  if (v.candidateId !== snapshot.id) throw new Error('Ledger candidate and snapshot ID differ.')
  return {
    id: v.id, candidateId: v.candidateId, recordedUtc: v.recordedUtc,
    action: v.action, disposition: v.disposition as ReviewDisposition,
    note: v.note, snapshot,
  }
}
export function createReviewEntry(
  candidate: SourceLabCandidate, id: string, recordedUtc: string,
  action: ReviewAction, disposition: ReviewDisposition, note: string,
): ReviewEntry {
  return parseEntry({ id, candidateId: candidate.id, recordedUtc, action, disposition,
    note: note.trim(), snapshot: cleanCandidate(candidate) })
}
export function exportReviewLedger(entries: readonly ReviewEntry[]): string {
  if (entries.length > REVIEW_LEDGER_MAX_ENTRIES) throw new Error('Ledger limit is 100 entries.')
  const parsed = entries.map(parseEntry)
  if (new Set(parsed.map(({id}) => id)).size !== parsed.length) throw new Error('Duplicate event IDs.')
  const raw = JSON.stringify({
    schema: REVIEW_LEDGER_SCHEMA,
    provenance: REVIEW_LEDGER_PROVENANCE,
    notice: 'Editable browser storage, not cryptographically tamper-proof. User-recorded evidence and recommendations are unverified. No broadcaster permission or media playback is granted.',
    sourceIntakeSchema: SOURCE_LAB_SCHEMA,
    sourceIntakeProvenance: SOURCE_LAB_PROVENANCE,
    events: parsed,
  }, null, 2)
  if (raw.length > REVIEW_LEDGER_MAX_BYTES) throw new Error('Ledger exceeds 128 KB.')
  return raw
}
export function importReviewLedger(raw: string): ReviewEntry[] {
  if (raw.length > REVIEW_LEDGER_MAX_BYTES) throw new Error('Ledger exceeds 128 KB.')
  let data: unknown
  try { data = JSON.parse(raw) } catch { throw new Error('Ledger JSON is malformed.') }
  if (!isRecord(data) || !keys(data, [
    'schema','provenance','notice','sourceIntakeSchema','sourceIntakeProvenance','events',
  ]) || data.schema !== REVIEW_LEDGER_SCHEMA || data.provenance !== REVIEW_LEDGER_PROVENANCE ||
    data.sourceIntakeSchema !== SOURCE_LAB_SCHEMA || data.sourceIntakeProvenance !== SOURCE_LAB_PROVENANCE ||
    typeof data.notice !== 'string' || data.notice.length > 350 ||
    !Array.isArray(data.events) || data.events.length > REVIEW_LEDGER_MAX_ENTRIES) {
    throw new Error('Unrecognized ledger schema, provenance or event count.')
  }
  const events = data.events.map(parseEntry)
  if (new Set(events.map(({id}) => id)).size !== events.length) throw new Error('Duplicate ledger event IDs.')
  return events
}
export function readReviewLedger(raw: string | null): ReviewEntry[] {
  if (!raw) return []
  try { return importReviewLedger(raw) } catch { return [] }
}
export function appendReviewEntry(existing: readonly ReviewEntry[], entry: ReviewEntry): ReviewEntry[] {
  if (existing.length >= REVIEW_LEDGER_MAX_ENTRIES) throw new Error('Ledger holds at most 100 events.')
  if (existing.some(({id}) => id === entry.id)) throw new Error('Duplicate ledger event ID.')
  const next = [...existing, parseEntry(entry)]
  exportReviewLedger(next) // validate size before the caller changes local state
  return next
}
export function mergeReviewLedger(existing: readonly ReviewEntry[], imported: readonly ReviewEntry[]): ReviewEntry[] {
  const next = [...existing]
  const byId = new Map(existing.map((entry) => [entry.id, entry]))
  for (const entry of imported) {
    const checked = parseEntry(entry)
    const prior = byId.get(checked.id)
    if (prior) {
      if (JSON.stringify(prior) !== JSON.stringify(checked)) {
        throw new Error('Conflicting ledger event ID. Nothing was imported.')
      }
      continue
    }
    if (next.length >= REVIEW_LEDGER_MAX_ENTRIES) throw new Error('Ledger is full. Export existing entries before importing.')
    next.push(checked); byId.set(checked.id, checked)
  }
  exportReviewLedger(next)
  return next
}
export function historyForCandidate(events: readonly ReviewEntry[], candidateId: string): ReviewEntry[] {
  return events.filter((event) => event.candidateId === candidateId).slice().reverse()
}
export function latestReviewDisposition(events: readonly ReviewEntry[], candidateId: string): ReviewDisposition {
  return historyForCandidate(events, candidateId).find(({action}) => action === 'review-note')?.disposition ?? 'not-assessed'
}
/** A text handoff only; never exposes stream URLs, logs into GitHub or opens an issue automatically. */
export function githubReviewHandoff(candidate: SourceLabCandidate, events: readonly ReviewEntry[]): string {
  const source = cleanCandidate(candidate)
  const history = historyForCandidate(events, source.id)
  const recent = history.slice(0, 8)
  return [
    'RCTV SOURCE REVIEW / UNVERIFIED RESEARCH HANDOFF',
    '',
    'Candidate: ' + source.name,
    'Intake ID: ' + source.id,
    'Publisher homepage: ' + source.homepage,
    'Requested method: ' + source.proposedMethod,
    'Checklist: ' + source.checked.length + '/7 self-attested',
    'Evidence notes: ' + source.evidenceNotes,
    '',
    'Latest local review recommendation: ' + latestReviewDisposition(events, source.id),
    'Recent local ledger entries (not authenticated):',
    ...recent.map((event) => '- ' + event.recordedUtc + ' / ' + event.action +
      ' / ' + event.disposition + (event.note ? ' / ' + event.note : '')),
    '',
    'No source is approved or made playable by this issue. A maintainer must verify',
    'publisher identity, exact usage permissions, current terms and browser behavior;',
    'then propose a separate reviewed code PR with tests.',
    'Do not include private access tokens, subscriber keys or non-public personal information.',
  ].join('\n')
}
