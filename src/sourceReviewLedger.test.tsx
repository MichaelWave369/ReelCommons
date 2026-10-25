import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createSourceLabCandidate } from './sourceCertification'
import SourceReviewLedger from './SourceReviewLedger'
import {
  REVIEW_LEDGER_KEY, REVIEW_LEDGER_MAX_BYTES, REVIEW_LEDGER_MAX_ENTRIES,
  REVIEW_LEDGER_PROVENANCE, REVIEW_LEDGER_SCHEMA, appendReviewEntry, createReviewEntry,
  exportReviewLedger, githubReviewHandoff, historyForCandidate,
  importReviewLedger, latestReviewDisposition, mergeReviewLedger,
  readReviewLedger,
} from './sourceReviewLedger'
import type { ReviewEntry } from './sourceReviewLedger'

const a = createSourceLabCandidate({
  name: 'Example Public TV', homepage: 'https://tv.example.org/',
  proposedMethod: 'youtube-embed',
  evidenceNotes: 'Broadcaster player terms need independent review before inline embedding.',
}, 'cand-example1234', '2026-10-25')
const b = { ...a, id: 'cand-second1234', name: 'Second Broadcaster' }
const date1 = '2026-10-25T18:20:22.000Z'
const date2 = '2026-10-25T18:21:10.000Z'
const snap = createReviewEntry(a, 'rev-test-000001', date1, 'snapshot', 'not-assessed','')
const note = createReviewEntry(a, 'rev-test-000002', date2, 'review-note',
  'request-more-evidence', 'We still need documented terms and a reviewed browser test.')

describe('RCTV v2.6 Source Review Ledger', () => {
  it('creates a frozen evidence snapshot with self-reported provenance', () => {
    expect(snap.snapshot).toEqual(a)
    expect(snap.action).toBe('snapshot')
    expect(snap.disposition).toBe('not-assessed')
    expect(snap.recordedUtc).toBe(date1)
    const later = { ...a, evidenceNotes: 'Edited after the snapshot was taken' }
    expect(snap.snapshot.evidenceNotes).not.toBe(later.evidenceNotes)
    expect(appendReviewEntry([],snap)).toEqual([snap])
    expect(appendReviewEntry([snap],note)).toEqual([snap,note])
    expect(historyForCandidate([snap,note],a.id)).toEqual([note,snap])
    expect(historyForCandidate([snap,note],b.id)).toEqual([])
    expect(latestReviewDisposition([snap,note],a.id)).toBe('request-more-evidence')
    expect(latestReviewDisposition([snap,note],b.id)).toBe('not-assessed')
  })
  it('permits advisory outcomes but no approved/verified state or shortcut', () => {
    const recommended = createReviewEntry(b, 'rev-test-000003',date2,
      'review-note','recommend-code-review',
      'Evidence may be ready for manual code review but no publisher license is inferred.')
    expect(recommended.disposition).toBe('recommend-code-review')
    expect(recommended).not.toHaveProperty('approved')
    expect(recommended).not.toHaveProperty('playableUrl')
    for (const bad of [
      ['review-note','approved','Some notes from reviewer'],
      ['review-note','not-assessed','Some notes from reviewer'],
      ['snapshot','recommend-code-review',''],
      ['review-note','decline-candidate','short'],
    ]) {
      expect(() => createReviewEntry(a,'rev-test-000005',date1,
        bad[0] as 'snapshot',bad[1] as 'not-assessed',bad[2])).toThrow()
    }
  })
  it('exports and imports strict provenance without playable URLs', () => {
    const packet=exportReviewLedger([snap,note])
    const parsed=JSON.parse(packet)
    expect(parsed.schema).toBe(REVIEW_LEDGER_SCHEMA)
    expect(parsed.provenance).toBe(REVIEW_LEDGER_PROVENANCE)
    expect(parsed.events).toHaveLength(2)
    expect(packet).not.toContain('playableUrl')
    expect(packet).not.toContain('youtube-nocookie.com')
    expect(packet).not.toContain('.m3u8')
    expect(importReviewLedger(packet)).toEqual([snap,note])
    expect(readReviewLedger(packet)).toEqual([snap,note])
    expect(readReviewLedger(null)).toEqual([])
    expect(readReviewLedger('broken')).toEqual([])
    expect(REVIEW_LEDGER_KEY).toContain('review-ledger')
  })
  it('rejects forged authority, malformed timestamps, extra fields and unrelated candidates', () => {
    const packet=JSON.parse(exportReviewLedger([snap,note]))
    const invalid: unknown[]=[
      {...packet,provenance:'INDEPENDENTLY_VERIFIED'},
      {...packet,approved:true},
      {...packet,events:[{...snap,approved:true}]},
      {...packet,events:[{...snap,disposition:'approved'}]},
      {...packet,events:[{...note,action:'certify'}]},
      {...packet,events:[{...note,recordedUtc:'2026-02-30T18:21:10.000Z'}]},
      {...packet,events:[{...note,recordedUtc:'2026-10-25T18:21:10+00:00'}]},
      {...packet,events:[{...note,candidateId:b.id}]},
      {...packet,events:[{...note,snapshot:{...a,streamUrl:'https://stream.example/a.m3u8'}}]},
      {...packet,events:[{...note,snapshot:{...a,homepage:'https://127.0.0.1/'}}]},
      {...packet,events:[snap,snap]},
    ]
    for(const v of invalid)expect(()=>importReviewLedger(JSON.stringify(v))).toThrow()
    expect(()=>importReviewLedger('invalid JSON')).toThrow()
    expect(()=>importReviewLedger('x'.repeat(REVIEW_LEDGER_MAX_BYTES+1))).toThrow()
  })
  it('merges by immutable ID, rejects conflicts, and never silently overwrites', () => {
    expect(mergeReviewLedger([snap],[snap,note])).toEqual([snap,note])
    const altered={...snap,note:'Some altered value'}
    expect(()=>mergeReviewLedger([snap],[altered])).toThrow('Conflicting')
    expect(()=>appendReviewEntry([snap],snap)).toThrow('Duplicate')
    const many=Array.from({length:REVIEW_LEDGER_MAX_ENTRIES},(_,i)=>({
      ...snap,id:'rev-seq-'+String(i).padStart(6,'0'),
    }))
    expect(()=>appendReviewEntry(many,note)).toThrow('at most 100')
    expect(()=>exportReviewLedger([...many,note])).toThrow('limit')
  })
  it('supports later imported orphan history without promoting the candidate', () => {
    const extra=createReviewEntry(b,'rev-test-000004',date2,'snapshot','not-assessed','')
    const events=mergeReviewLedger([snap,note],[extra])
    expect(historyForCandidate(events,b.id)).toEqual([extra])
    expect(historyForCandidate(events,a.id)).toEqual([note,snap])
    expect(events).toHaveLength(3)
    expect(events.every((event)=>event.disposition!=='approved')).toBe(true)
  })
  it('creates a manual GitHub handoff without transmission or certified claims', () => {
    const handoff=githubReviewHandoff(a,[snap,note])
    expect(handoff).toContain('UNVERIFIED RESEARCH HANDOFF')
    expect(handoff).toContain('cand-example1234')
    expect(handoff).toContain('request-more-evidence')
    expect(handoff).toContain('separate reviewed code PR')
    expect(handoff).not.toContain('streamUrl')
  })
  it('renders a closed, offline-only ledger with no player or GitHub API requests', () => {
    const html=renderToStaticMarkup(<SourceReviewLedger selected={a}/>)
    expect(html).toContain('Receipts before promotions.')
    expect(html).toContain('not authenticated approvals')
    expect(html).toContain('Copy review handoff')
    expect(html).toContain('https://github.com/MichaelWave369/ReelCommons/issues/new/choose')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('<audio')
    expect(html).not.toContain('<video')
    expect(html).not.toContain('api.github.com')
  })
})
