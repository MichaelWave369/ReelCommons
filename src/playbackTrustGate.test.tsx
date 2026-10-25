import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import PlaybackTrustGate from './PlaybackTrustGate'
import { ALL_OPEN_STREAMS } from './cameraCatalog'
import { playableUrl } from './openStreams'
import type { OpenStream } from './openStreams'
import { REVIEWED_BRIDGE_ROSTER } from './reviewedPlaybackBridge'
import {
  TRUST_GATE_DECLARATIONS, TRUST_GATE_PROVENANCE, TRUST_GATE_SCHEMA,
  auditCheckedInPlayback, auditPlaybackTrust, trustGateReport,
} from './playbackTrustGate'

const rosterIds=REVIEWED_BRIDGE_ROSTER.map(({id})=>id)
const audit=(sources: readonly OpenStream[], policy=TRUST_GATE_DECLARATIONS,
  roster=rosterIds)=>auditPlaybackTrust(sources,policy,roster)

describe('RCTV v2.7 Playback Trust Gate',()=>{
  it('asserts the real shipped catalog, roster and exact two routes are consistent',()=>{
    const actual=auditCheckedInPlayback()
    expect(actual.status).toBe('code-consistent')
    expect(actual.issues).toEqual([])
    expect(actual.checkedSources).toBe(ALL_OPEN_STREAMS.length)
    expect(actual.declaredSourceCount).toBe(7)
    expect(actual.reviewedMediaRoutes).toBe(2)
    expect(actual.directoryOnly).toBe(ALL_OPEN_STREAMS.length-2)
    expect(TRUST_GATE_DECLARATIONS.map(({id})=>id)).toEqual(rosterIds)
    expect(TRUST_GATE_DECLARATIONS.filter(({mediaRoute})=>mediaRoute!==null)
      .map(({id})=>id).sort()).toEqual(['kexp','nasa-iss'])
  })
  it('blocks a newly introduced undeclared media source and unreviewed inline mode',()=>{
    const source=ALL_OPEN_STREAMS.find(({id})=>id==='cbs-news')!
    const unknown:OpenStream={
      ...source,id:'new-playable-station',playback:'published-audio',
      audioUrl:'https://thirdparty.example.com/live.aac',
    }
    const inspected=audit([...ALL_OPEN_STREAMS,unknown])
    expect(inspected.status).toBe('engineering-review-required')
    expect(inspected.issues).toContainEqual({
      sourceId:'new-playable-station',code:'UNREVIEWED_INLINE_MODE',
    })
    expect(playableUrl(unknown)).toBeNull()
  })
  it('flags changes to NASA and KEXP playback modes or media routes',()=>{
    const spoofed=ALL_OPEN_STREAMS.map((source)=>
      source.id==='nasa-iss'?{...source,youtubeId:'xxxxxxxxxxx'}:source)
    expect(audit(spoofed).issues).toContainEqual({
      sourceId:'nasa-iss',code:'ROUTE_MISMATCH',
    })
    const wrongMode=ALL_OPEN_STREAMS.map((source)=>
      source.id==='kexp'?{...source,playback:'official' as const}:source)
    expect(audit(wrongMode).issues).toContainEqual({
      sourceId:'kexp',code:'POLICY_MODE_MISMATCH',
    })
    expect(audit(wrongMode).issues).toContainEqual({
      sourceId:'kexp',code:'ROUTE_MISMATCH',
    })
  })
  it('detects duplicate declarations, missing source IDs, missing metadata and roster drift',()=>{
    const duplicated=audit(ALL_OPEN_STREAMS,[...TRUST_GATE_DECLARATIONS,TRUST_GATE_DECLARATIONS[0]])
    expect(duplicated.issues).toContainEqual({
      sourceId:'nasa-iss',code:'DUPLICATE_POLICY_ID',
    })
    const missing=audit(ALL_OPEN_STREAMS.filter(({id})=>id!=='kexp'))
    expect(missing.issues).toContainEqual({
      sourceId:'kexp',code:'MISSING_REVIEWED_SOURCE',
    })
    const withoutPolicy=audit(ALL_OPEN_STREAMS,TRUST_GATE_DECLARATIONS.slice(1))
    expect(withoutPolicy.issues).toContainEqual({
      sourceId:'nasa-iss',code:'UNDECLARED_PLAYABLE_ROUTE',
    })
    const missingReview=audit(ALL_OPEN_STREAMS,TRUST_GATE_DECLARATIONS,
      rosterIds.filter((id)=>id!=='pbs-online'))
    expect(missingReview.issues).toContainEqual({
      sourceId:'pbs-online',code:'REVIEW_ROSTER_MISMATCH',
    })
    const poorEvidence=TRUST_GATE_DECLARATIONS.map((row)=>
      row.id==='kexp'?{...row,evidence:''}:row)
    expect(audit(ALL_OPEN_STREAMS,poorEvidence).issues).toContainEqual({
      sourceId:'kexp',code:'MISSING_EVIDENCE',
    })
    const invalidPolicy=TRUST_GATE_DECLARATIONS.map((row)=>
      row.id==='kexp'?{...row,mediaRoute:'https://evil.example/audio.m3u8'}:row)
    expect(audit(ALL_OPEN_STREAMS,invalidPolicy).issues).toContainEqual({
      sourceId:'kexp',code:'POLICY_MEDIA_MISMATCH',
    })
  })
  it('detects unsafe source destinations and duplicated catalog IDs',()=>{
    const source=ALL_OPEN_STREAMS.find(({id})=>id==='kexp')!
    const unsafe=[...ALL_OPEN_STREAMS,{...source,officialUrl:'http://kexp.org'}]
    expect(audit(unsafe).issues).toContainEqual({
      sourceId:'kexp',code:'DUPLICATE_SOURCE_ID',
    })
    expect(audit(unsafe).issues).toContainEqual({
      sourceId:'kexp',code:'UNSAFE_OFFICIAL_SITE',
    })
    const wrongHost=ALL_OPEN_STREAMS.map((s)=>
      s.id==='kexp'?{...s,officialUrl:'https://attacker.example.com/login'}:s)
    expect(audit(wrongHost).issues).toContainEqual({
      sourceId:'kexp',code:'UNSAFE_OFFICIAL_SITE',
    })
  })
  it('exports only code-consistency metadata, not media URLs, EPG or user history',()=>{
    const json=trustGateReport(auditCheckedInPlayback())
    const packet=JSON.parse(json)
    expect(packet.schema).toBe(TRUST_GATE_SCHEMA)
    expect(packet.provenance).toBe(TRUST_GATE_PROVENANCE)
    expect(packet.reviewedMediaRouteCount).toBe(2)
    expect(packet.status).toBe('code-consistent')
    expect(packet.notice).toContain('Not proof')
    for (const forbidden of ['streamguys1.com','youtube-nocookie.com/embed',
      'm3u8','viewingHistory','localStorage','approvedBy','api.github.com']) {
      expect(json).not.toContain(forbidden)
    }
  })
  it('starts closed with zero media, network calls or autoplay elements',()=>{
    const html=renderToStaticMarkup(<PlaybackTrustGate/>)
    expect(html).toContain('Open Playback Trust Gate')
    expect(html).toContain('CONFIGURATION CHECK')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('<audio')
    expect(html).not.toContain('<video')
    expect(html).not.toContain('autoplay=')
    expect(html).not.toContain('streamguys1.com')
  })
})
