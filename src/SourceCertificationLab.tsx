import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { REVIEWED_BRIDGE_ROSTER } from './reviewedPlaybackBridge'
import SourceReviewLedger from './SourceReviewLedger'
import {
  SOURCE_LAB_CHECKS, SOURCE_LAB_MAX_BYTES, SOURCE_LAB_MAX_DRAFTS,
  SOURCE_LAB_STORAGE_KEY, createSourceLabCandidate, exportSourceLabPacket,
  importSourceLabPacket, mergeSourceLabDrafts, readStoredSourceLabDrafts,
  sourceLabProgress, sourceLabStage, toggleSourceLabCheck, updateSourceLabNotes,
} from './sourceCertification'
import type { SourceLabCandidate, SourceLabMethod } from './sourceCertification'
import './source-certification.css'

const EMPTY = { name: '', homepage: '', proposedMethod: 'official-site' as SourceLabMethod, evidenceNotes: '' }

function saveJson(filename: string, content: string) {
  const objectUrl = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = objectUrl; link.download = filename
  document.body.appendChild(link); link.click(); link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

export default function SourceCertificationLab() {
  const [opened, setOpened] = useState(false)
  const [drafts, setDrafts] = useState<SourceLabCandidate[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [storageWarning, setStorageWarning] = useState(false)

  useEffect(() => {
    try { setDrafts(readStoredSourceLabDrafts(localStorage.getItem(SOURCE_LAB_STORAGE_KEY))) }
    catch { setStorageWarning(true) }
  }, [])

  const selected = drafts.find((candidate) => candidate.id === selectedId) ?? null
  function persist(next: SourceLabCandidate[]) {
    try {
      const packet = exportSourceLabPacket(next)
      setDrafts(next)
      localStorage.setItem(SOURCE_LAB_STORAGE_KEY, packet)
    } catch (cause) {
      if (cause instanceof Error && cause.message.includes('64 KB')) {
        setError('The draft packet exceeds 64 KB. Shorten notes or remove older drafts.')
        return
      }
      setDrafts(next); setStorageWarning(true)
    }
  }
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(''); setNotice('')
    if (drafts.length >= SOURCE_LAB_MAX_DRAFTS) {
      setError('The Source Lab accepts up to 40 local candidate drafts.')
      return
    }
    try {
      const id = 'cand-' + crypto.randomUUID()
      const draft = createSourceLabCandidate(form, id, new Date().toISOString().slice(0, 10))
      if (drafts.some((d) => d.homepage === draft.homepage &&
        d.proposedMethod === draft.proposedMethod)) {
        setError('This website and proposed method already have a draft. Edit the existing draft instead.')
        return
      }
      persist([...drafts, draft]); setSelectedId(draft.id); setForm(EMPTY)
      setNotice('Candidate saved as an unverified research draft. It is NOT playable or approved.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create a candidate.')
    }
  }
  function edit(candidate: SourceLabCandidate) {
    persist(drafts.map((item) => item.id === candidate.id ? candidate : item))
    setNotice('Local checklist changed. This is self-reported, not an approval.')
    setError('')
  }
  function remove() {
    if (!selected) return
    persist(drafts.filter((d) => d.id !== selected.id))
    setSelectedId(null); setNotice('Candidate draft removed locally. No playback configuration was changed.')
  }
  function exportAll() {
    try {
      saveJson('rctv-source-lab-intake.json', exportSourceLabPacket(drafts))
      setNotice('Exported an unverified research packet. A maintainer must assess evidence and change source code separately.')
      setError('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Export failed.') }
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ''
    if (!file) return
    if (file.size > SOURCE_LAB_MAX_BYTES) {
      setError('Source Lab accepts JSON files up to 64 KB.')
      return
    }
    try {
      const imported = importSourceLabPacket(await file.text())
      const merged = mergeSourceLabDrafts(drafts, imported)
      persist(merged); setError('')
      setNotice('Imported ' + (merged.length - drafts.length) + ' new unverified draft(s). Duplicate IDs are ignored. No streams were enabled.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Import failed.')
    }
  }

  return <section className="scl" aria-labelledby="scl-title">
    <div className="scl-header">
      <div><span className="scl-kicker">RCTV v2.6 · SOURCE CERTIFICATION LAB</span>
        <h2 id="scl-title">Evidence before airwaves.</h2>
        <p>Document a proposed channel for independent review. The Lab helps organize broadcaster identity, usage terms and playback evidence, but cannot certify permissions or add playable media on its own.</p>
      </div>
      <button type="button" aria-expanded={opened} aria-controls="scl-workbench"
        onClick={() => setOpened((value) => !value)}>
        {opened ? '− Hide research workbench' : '＋ Open Source Review Lab'}
      </button>
    </div>
    <div className="scl-boundary"><strong>NO AUTO-PROMOTION TO LIVE PLAYBACK</strong>
      <p>Everything submitted here remains <b>USER-SUPPLIED UNVERIFIED</b>, even if every checklist box is marked. The original RCTV allowlist, IPTV-org directory, M3U quarantine and media players cannot read candidate packets. Evidence is reviewed by people and, if accepted, added through an audited source-code change.</p>
    </div>
    {opened && <div className="scl-workbench" id="scl-workbench">
      <div className="scl-review-roster">
        <h3>Current source-controlled roster</h3>
        <p>These are the <b>existing</b> RCTV review outcomes, not approvals from this Lab.</p>
        <div className="scl-existing">
          {REVIEWED_BRIDGE_ROSTER.map((row) => <article key={row.id}>
            <strong>{row.source.name}</strong>
            <span>{row.mode === 'official-website' ? 'Official website only' :
              row.mode === 'youtube-video' ? 'Reviewed YouTube method' : 'Publisher-listed AAC method'}</span>
            <p>{row.review}</p>
          </article>)}
        </div>
      </div>
      <div className="scl-work">
        <div className="scl-block">
          <h3>1 / Propose a broadcaster</h3>
          <p>Only an official public HTTPS homepage, proposed method and notes. Do not paste media-stream links, access tokens, personal credentials or private addresses.</p>
          <form className="scl-form" onSubmit={create}>
            <label>Publisher / station name
              <input required maxLength={100} minLength={2} value={form.name} placeholder="Example Public Radio"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}/>
            </label>
            <label>Official broadcaster website (no stream URLs)
              <input required type="url" maxLength={2048} value={form.homepage}
                placeholder="https://station.example.org/"
                onChange={(e) => setForm((f) => ({ ...f, homepage: e.target.value }))}/>
            </label>
            <label>Proposed access method
              <select value={form.proposedMethod} onChange={(e) =>
                setForm((f) => ({ ...f, proposedMethod: e.target.value as SourceLabMethod }))}>
                <option value="official-site">Official website only</option>
                <option value="youtube-embed">Supported YouTube embed · requires review</option>
                <option value="published-audio">Publisher-listed audio · requires review</option>
              </select>
            </label>
            <label>Evidence notes and permissions to investigate
              <textarea rows={3} maxLength={1000} value={form.evidenceNotes}
                placeholder="Where the broadcaster documents availability, embed/audio terms, region or fallback…"
                onChange={(e) => setForm((f) => ({ ...f, evidenceNotes: e.target.value }))}/>
            </label>
            <button type="submit">＋ Save unverified candidate</button>
          </form>
        </div>
        <div className="scl-block">
          <div className="scl-block-head"><div><h3>2 / Research the evidence</h3>
            <p>{drafts.length} of {SOURCE_LAB_MAX_DRAFTS} local candidates. Nothing is uploaded to a server.</p></div>
            <div className="scl-file-controls">
              <button type="button" onClick={exportAll}>↓ Export JSON</button>
              <label>↑ Import JSON
                <input type="file" accept=".json,application/json" onChange={importFile}
                  aria-label="Import a Source Lab JSON research packet" />
              </label>
            </div>
          </div>
          {drafts.length > 0 ? <div className="scl-candidates" role="group" aria-label="Local candidate drafts">
            {drafts.map((item) => <button type="button" key={item.id}
              aria-pressed={item.id === selected?.id} className={item.id === selected?.id ? 'active' : ''}
              onClick={() => { setSelectedId(item.id); setNotice(''); setError('') }}>
              <strong>{item.name}</strong><span>{sourceLabStage(item) === 'needs-evidence' ?
                'Needs evidence' : 'Ready for independent review'} · {sourceLabProgress(item)}/{SOURCE_LAB_CHECKS.length}</span>
            </button>)}
          </div> : <p className="scl-empty">No candidates yet. Create a draft above to begin.</p>}
          {selected && <div className="scl-inspector">
            <div className="scl-selected">
              <div><span className="scl-kicker">UNVERIFIED CANDIDATE · {selected.createdUtc} UTC</span>
                <h4>{selected.name}</h4>
                <p>Homepage (reference only, never fetched): <code>{selected.homepage}</code></p>
                <p>Proposed method: {selected.proposedMethod}. Stage: {sourceLabStage(selected) === 'needs-evidence' ?
                  'Needs evidence' : 'Ready for independent human review, NOT approved'}.</p></div>
              <button type="button" className="scl-delete" onClick={remove}>Remove draft</button>
            </div>
            <label className="scl-notes">Research notes (self-reported)
              <textarea value={selected.evidenceNotes} rows={4} maxLength={1000}
                onChange={(e) => edit(updateSourceLabNotes(selected, e.target.value))}/>
            </label>
            <fieldset className="scl-checks">
              <legend>Review checklist · {sourceLabProgress(selected)}/{SOURCE_LAB_CHECKS.length} self-attested</legend>
              {SOURCE_LAB_CHECKS.map((check) => <label key={check.id}>
                <input type="checkbox" checked={selected.checked.includes(check.id)}
                  onChange={() => edit(toggleSourceLabCheck(selected, check.id))}/>
                {check.label}
              </label>)}
            </fieldset>
            <p className="scl-verify">Completing the checklist produces a <b>human-review-ready intake packet only</b>. It cannot grant content rights or make an arbitrary URL playable. Keep dated permission evidence in the notes and review it independently before proposing a code change.</p>
          </div>}
          <SourceReviewLedger selected={selected} />
          {storageWarning && <p className="scl-warning" role="status">Browser storage unavailable. Your notes may last only until you leave this page. Export your JSON.</p>}
          {error && <p className="scl-error" role="alert">{error}</p>}
          {notice && <p className="scl-notice" role="status">{notice}</p>}
          <p className="scl-footnote">Exported packet: <code>RCTV_SOURCE_INTAKE_PACKET_V1</code> · provenance <code>USER_SUPPLIED_UNVERIFIED</code>. Import requires exact fields, known checklist IDs, public HTTPS homepages and limited text size. No network fetching, playlist parsing, iframe or audio element is performed by this Lab.</p>
        </div>
      </div>
    </div>}
  </section>
}
