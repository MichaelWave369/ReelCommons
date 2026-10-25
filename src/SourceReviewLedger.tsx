import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { SourceLabCandidate } from './sourceCertification'
import {
  REVIEW_DISPOSITIONS, REVIEW_LEDGER_KEY, REVIEW_LEDGER_MAX_BYTES,
  REVIEW_LEDGER_MAX_ENTRIES, appendReviewEntry, createReviewEntry,
  exportReviewLedger, githubReviewHandoff, historyForCandidate,
  importReviewLedger, latestReviewDisposition, mergeReviewLedger,
  readReviewLedger,
} from './sourceReviewLedger'
import type { ReviewDisposition, ReviewEntry } from './sourceReviewLedger'
import './source-review-ledger.css'

interface Props { selected: SourceLabCandidate | null }
const CHOOSE_ISSUE = 'https://github.com/MichaelWave369/ReelCommons/issues/new/choose'

function download(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url; link.download = filename
  document.body.appendChild(link); link.click(); link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export default function SourceReviewLedger({selected}: Props) {
  const [events, setEvents] = useState<ReviewEntry[]>([])
  const [disposition, setDisposition] =
    useState<Exclude<ReviewDisposition,'not-assessed'>>('request-more-evidence')
  const [reviewNote, setReviewNote] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [storageWarning, setStorageWarning] = useState(false)

  useEffect(() => {
    try {setEvents(readReviewLedger(localStorage.getItem(REVIEW_LEDGER_KEY)))}
    catch {setStorageWarning(true)}
  }, [])
  useEffect(() => { setReviewNote(''); setNotice(''); setError('') }, [selected?.id])

  const history = selected ? historyForCandidate(events, selected.id) : []
  const latest = selected ? latestReviewDisposition(events, selected.id) : 'not-assessed'

  function persist(next: ReviewEntry[]) {
    try {
      const packet = exportReviewLedger(next)
      setEvents(next)
      try { localStorage.setItem(REVIEW_LEDGER_KEY, packet) }
      catch { setStorageWarning(true) }
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save review ledger.')
    }
  }
  function snapshot() {
    if (!selected) return
    try {
      const entry = createReviewEntry(selected, 'rev-' + crypto.randomUUID(),
        new Date().toISOString(), 'snapshot', 'not-assessed', '')
      persist(appendReviewEntry(events, entry))
      setNotice('Captured a frozen local evidence snapshot. It is self-recorded, not independently verified.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to snapshot the candidate.')
    }
  }
  function submitReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected) return
    try {
      const entry = createReviewEntry(selected, 'rev-' + crypto.randomUUID(),
        new Date().toISOString(), 'review-note', disposition, reviewNote)
      persist(appendReviewEntry(events, entry))
      setReviewNote('')
      setNotice('Recorded an append-only local review recommendation. The candidate remains unapproved.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to record the recommendation.')
    }
  }
  function exportLedger() {
    try {
      download('rctv-source-review-ledger.json', exportReviewLedger(events))
      setNotice('Exported local audit history. This file is not cryptographically signed or authoritative.')
      setError('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Export failed.') }
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > REVIEW_LEDGER_MAX_BYTES) { setError('The audit file exceeds the 128 KB limit.');return }
    try {
      const incoming = importReviewLedger(await file.text())
      const merged = mergeReviewLedger(events, incoming)
      const added = merged.length - events.length
      persist(merged)
      setNotice('Imported ' + added + ' local review event(s) with unverified provenance. No playback was authorized.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Import failed.') }
  }
  async function copyHandoff() {
    if (!selected) return
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API is unavailable in this browser.')
      await navigator.clipboard.writeText(githubReviewHandoff(selected, events))
      setNotice('Copied a review summary. It remains local until YOU choose to paste it into GitHub.')
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not copy the review summary.')
    }
  }

  return <section className="srl" aria-labelledby="srl-title">
    <div className="srl-top">
      <div><span className="scl-kicker">RCTV v2.6 · SOURCE REVIEW LEDGER</span>
        <h3 id="srl-title">Receipts before promotions.</h3>
        <p>Keep a dated trail of evidence snapshots and local review recommendations. The browser is not an identity provider, so these records are <b>not authenticated approvals</b>.</p>
      </div>
      <div className="srl-counter"><strong>{events.length}/{REVIEW_LEDGER_MAX_ENTRIES}</strong><span>local events</span></div>
    </div>
    <div className="srl-policy">
      <strong>LOCAL RESEARCH ONLY / NO TRUST ESCALATION</strong>
      <p>Review events may be copied, edited outside this app, deleted with browser data, or forged in an exported file. They are append-only <em>inside this workbench</em>, not tamper-proof. No ledger decision modifies the RCTV source allowlist, provider permissions or media players.</p>
    </div>
    <div className="srl-export">
      <button type="button" onClick={exportLedger}>↓ Export local review ledger</button>
      <label>↑ Import local ledger
        <input type="file" accept=".json,application/json" onChange={importFile}
          aria-label="Import RCTV unverified source review ledger JSON" />
      </label>
    </div>
    {!selected ? <div className="srl-empty">Select or create a candidate above to snapshot its evidence and propose a review recommendation. Existing saved history remains available when you reselect the candidate.</div> :
    <>
      <div className="srl-current">
        <span className="scl-kicker">SELECTED UNVERIFIED CANDIDATE</span>
        <h4>{selected.name}</h4>
        <p><b>Intake ID:</b> {selected.id} · <b>Local review:</b> {latest === 'not-assessed' ? 'Not assessed' : REVIEW_DISPOSITIONS.find((row) => row.id === latest)?.label}</p>
        <p>Latest evidence version is read from the candidate above. Every new snapshot or review entry captures that version; later edits do not rewrite earlier entries.</p>
        <button type="button" disabled={events.length >= REVIEW_LEDGER_MAX_ENTRIES} onClick={snapshot}>
          ＋ Capture evidence revision snapshot
        </button>
      </div>
      <form className="srl-review-form" onSubmit={submitReview}>
        <h4>Record a local review recommendation</h4>
        <label>Recommendation (never grants playback)
          <select value={disposition} onChange={(e) =>
            setDisposition(e.target.value as Exclude<ReviewDisposition,'not-assessed'>)}>
            {REVIEW_DISPOSITIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label>Reason and evidence still to verify (15–600 characters)
          <textarea required minLength={15} maxLength={600} rows={3}
            value={reviewNote} onChange={(e) => setReviewNote(e.target.value)}
            placeholder="What did you assess, what publisher terms remain to verify, and what should happen next?" />
        </label>
        <button type="submit" disabled={events.length >= REVIEW_LEDGER_MAX_ENTRIES}>
          Record recommendation with evidence snapshot
        </button>
      </form>
      <div className="srl-history">
        <h4>Local revision history · {history.length} entries</h4>
        {history.length === 0 ? <p>No review entries for this candidate yet.</p> :
          <ol>
            {history.slice(0, 12).map((entry) => <li key={entry.id}>
              <div><strong>{entry.action === 'snapshot' ? 'Evidence snapshot' :
                REVIEW_DISPOSITIONS.find((row) => row.id === entry.disposition)?.label}</strong>
                <time dateTime={entry.recordedUtc}>{entry.recordedUtc.replace('T',' ').replace('Z',' UTC')}</time>
              </div>
              <p><b>Self-attested checks:</b> {entry.snapshot.checked.length}/7 · <b>Proposed method:</b> {entry.snapshot.proposedMethod}</p>
              {entry.note && <p><b>Review note:</b> {entry.note}</p>}
              <details><summary>View frozen evidence</summary>
                <p><b>Publisher site:</b> {entry.snapshot.homepage}</p>
                <p>{entry.snapshot.evidenceNotes || 'No notes provided at this snapshot.'}</p>
              </details>
            </li>)}
          </ol>}
        {history.length > 12 && <p>Showing 12 latest entries. JSON export includes all history.</p>}
      </div>
      <div className="srl-handoff">
        <h4>GitHub review handoff · manual only</h4>
        <p>Copy a concise unverified research summary, then open the repository's issue template and paste only the information you choose to publish. GitHub issues may be public. The Lab does not submit issues or create playback PRs automatically.</p>
        <div>
          <button type="button" onClick={copyHandoff}>⧉ Copy review handoff</button>
          <a href={CHOOSE_ISSUE} rel="noopener noreferrer" target="_blank">Open GitHub issue templates ↗</a>
        </div>
      </div>
    </>}
    {error && <p className="srl-error" role="alert">{error}</p>}
    {notice && <p className="srl-notice" role="status">{notice}</p>}
    {storageWarning && <p className="srl-warning" role="status">Browser storage is unavailable. Export the ledger to preserve your work.</p>}
    <p className="srl-fine">Receipt schema: <code>RCTV_SOURCE_REVIEW_LEDGER_V1</code> · provenance <code>USER_RECORDED_UNVERIFIED</code>. History is local-only and untrusted. A separate independently reviewed GitHub code change is always required to modify inline playback.</p>
  </section>
}
