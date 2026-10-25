import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import SourceCertificationLab from './SourceCertificationLab'
import {
  SOURCE_LAB_CHECKS, SOURCE_LAB_MAX_DRAFTS, SOURCE_LAB_PROVENANCE, SOURCE_LAB_SCHEMA,
  createSourceLabCandidate, exportSourceLabPacket, importSourceLabPacket, isSourceLabDate,
  mergeSourceLabDrafts, readStoredSourceLabDrafts, safeSourceLabHomepage,
  sourceLabProgress, sourceLabStage, toggleSourceLabCheck, updateSourceLabNotes,
} from './sourceCertification'

const id = 'cand-test-000001'
const sample = createSourceLabCandidate({
  name: 'Example Public Broadcast',
  homepage: 'https://publisher.example.org/listen',
  proposedMethod: 'published-audio',
  evidenceNotes: 'Publisher page needs independent manual permission review and a fallback.',
}, id, '2026-10-25')

describe('RCTV v2.5 Source Certification Lab', () => {
  it('rejects stream, private-network, credentials and signed API endpoints as official sites', () => {
    expect(safeSourceLabHomepage('https://publisher.example.org/listen'))
      .toBe('https://publisher.example.org/listen')
    for (const url of [
      'http://publisher.example.org',
      'https://localhost:9000/',
      'https://127.0.0.1/live',
      'https://10.0.0.1/',
      'https://[::1]/',
      'https://user:secret@publisher.example.org/',
      'https://publisher.example.org/feed.m3u8',
      'https://publisher.example.org/list.m3u',
      'https://publisher.example.org/stream.mp3',
      'https://publisher.example.org/playlist.xml',
      'https://publisher.example.org/api.json',
      'https://publisher.example.org/watch?token=abc',
      'https://publisher.example.org/#secret',
      'javascript:alert(1)',
      null,
    ]) expect(safeSourceLabHomepage(url)).toBeNull()
  })
  it('validates candidate identity, method, notes and dates at intake', () => {
    expect(isSourceLabDate('2024-02-29')).toBe(true)
    expect(isSourceLabDate('2025-02-29')).toBe(false)
    expect(sample.proposedMethod).toBe('published-audio')
    expect(sample.checked).toEqual([])
    expect(() => createSourceLabCandidate({
      name: 'X', homepage: 'https://publisher.example.org',
      proposedMethod: 'published-audio', evidenceNotes: '',
    }, id, '2026-10-25')).toThrow()
    expect(() => createSourceLabCandidate({
      name: 'Bad', homepage: 'https://publisher.example.org/media.m3u8',
      proposedMethod: 'youtube-embed', evidenceNotes: '',
    }, id, '2026-10-25')).toThrow()
    expect(() => createSourceLabCandidate({
      name: 'Good', homepage: 'https://publisher.example.org/',
      proposedMethod: 'hls-player' as 'youtube-embed', evidenceNotes: '',
    }, id, '2026-10-25')).toThrow()
  })
  it('cannot claim approval regardless of checklist completion', () => {
    let draft = { ...sample, evidenceNotes: 'A detailed evidence summary must be independently checked against broadcaster terms before any source-code approval.' }
    expect(sourceLabStage(draft)).toBe('needs-evidence')
    for (const check of SOURCE_LAB_CHECKS) draft = toggleSourceLabCheck(draft, check.id)
    expect(sourceLabProgress(draft)).toBe(7)
    expect(sourceLabStage(draft)).toBe('ready-for-independent-review')
    expect(toggleSourceLabCheck(draft, SOURCE_LAB_CHECKS[0].id).checked).toHaveLength(6)
    expect(sourceLabStage(updateSourceLabNotes(draft, 'short'))).toBe('needs-evidence')
    expect(draft).not.toHaveProperty('certified')
    expect(draft).not.toHaveProperty('playableUrl')
  })
  it('exports untrusted research provenance without playback or promotion fields', () => {
    const raw = exportSourceLabPacket([sample])
    const parsed = JSON.parse(raw)
    expect(parsed.schema).toBe(SOURCE_LAB_SCHEMA)
    expect(parsed.provenance).toBe(SOURCE_LAB_PROVENANCE)
    expect(parsed.candidates).toHaveLength(1)
    expect(parsed).not.toHaveProperty('approved')
    expect(raw).not.toContain('autoplay')
    expect(raw).not.toContain('streamUrl')
    expect(raw).not.toContain('playableUrl')
    expect(raw).not.toContain('iframe')
    expect(importSourceLabPacket(raw)).toEqual([sample])
    expect(readStoredSourceLabDrafts(raw)).toEqual([sample])
  })
  it('rejects forged trust statuses, arbitrary keys and unrecognized fields on import', () => {
    const packet = JSON.parse(exportSourceLabPacket([sample]))
    const bad: unknown[] = [
      { ...packet, certified: true },
      { ...packet, provenance: 'VERIFIED' },
      { ...packet, schema: 'RCTV_PLAYABLE_SOURCE_V1' },
      { ...packet, candidates: [{ ...sample, approved: true }] },
      { ...packet, candidates: [{ ...sample, playableUrl: 'https://stream.example.org/a.m3u8' }] },
      { ...packet, candidates: [{ ...sample, homepage: 'https://127.0.0.1/' }] },
      { ...packet, candidates: [{ ...sample, checked: ['publisher','permission','permission'] }] },
      { ...packet, candidates: [{ ...sample, checked: ['admin-override'] }] },
      { ...packet, candidates: [{ ...sample, createdUtc: '2026-02-30' }] },
      { ...packet, candidates: [{ ...sample, evidenceNotes: 'A'.repeat(1001) }] },
      { ...packet, candidates: [sample, sample] },
    ]
    for (const body of bad) {
      expect(() => importSourceLabPacket(JSON.stringify(body))).toThrow()
    }
    expect(() => importSourceLabPacket('not-json')).toThrow()
    expect(readStoredSourceLabDrafts('not-json')).toEqual([])
  })
  it('deduplicates imported draft IDs and caps the local collection', () => {
    const second = { ...sample, id: 'cand-test-000002', name: 'Another Candidate' }
    expect(mergeSourceLabDrafts([sample], [sample, second])).toEqual([sample, second])
    const many = Array.from({ length: SOURCE_LAB_MAX_DRAFTS }, (_, i) => ({
      ...sample, id: 'cand-test-' + String(i).padStart(6, '0'),
    }))
    expect(mergeSourceLabDrafts(many, [second])).toHaveLength(SOURCE_LAB_MAX_DRAFTS)
    expect(() => exportSourceLabPacket([...many, second])).toThrow()
  })
  it('renders an opt-in intake gate with zero iframe, audio or third-party links', () => {
    const markup = renderToStaticMarkup(<SourceCertificationLab />)
    expect(markup).toContain('Open Source Review Lab')
    expect(markup).toContain('NO AUTO-PROMOTION')
    expect(markup).not.toContain('<iframe')
    expect(markup).not.toContain('<audio')
    expect(markup).not.toContain('<video')
    expect(markup).not.toContain('youtube-nocookie.com/embed')
    expect(markup).not.toContain('kexp.streamguys')
    expect(markup).not.toContain('streams.json')
  })
})
