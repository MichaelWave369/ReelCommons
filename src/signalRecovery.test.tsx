import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import ReviewedPlaybackBridge from './ReviewedPlaybackBridge'
import {
  SIGNAL_RECEIPT_PROVENANCE, SIGNAL_RECEIPT_SCHEMA, createSignalState,
  observeSignal, selectSignalStation, signalMessage, signalSessionReceipt,
} from './signalRecovery'

describe('RCTV v2.8 Signal & Recovery Desk', () => {
  it('starts in standby with zero attempts and no media observation', () => {
    expect(createSignalState('nasa-iss')).toMatchObject({
      sourceId:'nasa-iss',mode:'youtube-video',phase:'standby',attempt:0,
      loadCount:0,lastEvent:'none',selfReported:'none',
    })
    expect(createSignalState('kexp').mode).toBe('published-audio')
    expect(createSignalState('abc-news').mode).toBe('official-website')
    expect(() => createSignalState('unreviewed' as 'kexp')).toThrow('Unknown reviewed source')
  })
  it('only starts an explicit reviewed route and cannot load official-site-only entries', () => {
    const official=createSignalState('cbs-news')
    expect(observeSignal(official,'load',official.sourceId,official.attempt)).toEqual(official)
    const initial=createSignalState('kexp')
    expect(observeSignal(initial,'audio-playing','kexp',0)).toEqual(initial)
    const mounted=observeSignal(initial,'load','kexp',0)
    expect(mounted).toMatchObject({phase:'controls-loaded',attempt:1,loadCount:1})
    expect(observeSignal(mounted,'load','kexp',1)).toEqual(mounted)
    expect(signalMessage(mounted)).toContain('Press Play')
  })
  it('separates iframe document load from YouTube playback evidence', () => {
    const initial=createSignalState('nasa-iss')
    const mounted=observeSignal(initial,'load','nasa-iss',0)
    const frame=observeSignal(mounted,'frame-load','nasa-iss',1)
    expect(frame.phase).toBe('frame-document-loaded')
    expect(signalMessage(frame)).toContain('cannot confirm')
    expect(frame.selfReported).toBe('none')
    expect(observeSignal(frame,'audio-playing','nasa-iss',1)).toEqual(frame)
    const reported=observeSignal(frame,'report-working','nasa-iss',1)
    expect(reported.phase).toBe('user-reported-working')
    expect(reported.selfReported).toBe('working')
    expect(signalMessage(reported)).toContain('personal report')
  })
  it('captures audio canplay, playing, wait, error and pause without false verification', () => {
    const mounted=observeSignal(createSignalState('kexp'),'load','kexp',0)
    const ready=observeSignal(mounted,'audio-canplay','kexp',1)
    expect(ready.phase).toBe('audio-ready')
    const playing=observeSignal(ready,'audio-playing','kexp',1)
    expect(playing.phase).toBe('audio-playing')
    expect(signalMessage(playing)).toContain('does not verify')
    const stalled=observeSignal(playing,'audio-waiting','kexp',1)
    expect(stalled.phase).toBe('audio-buffering')
    const fail=observeSignal(stalled,'audio-error','kexp',1)
    expect(fail.phase).toBe('failed')
    expect(signalMessage(fail)).toContain('Stop/unload')
    const stopped=observeSignal(fail,'audio-pause','kexp',1)
    expect(stopped.phase).toBe('audio-paused')
    const unload=observeSignal(stopped,'unload','kexp',1)
    expect(unload).toMatchObject({phase:'standby',lastEvent:'unload',selfReported:'none'})
    expect(observeSignal(unload,'audio-playing','kexp',1)).toEqual(unload)
  })
  it('ignores stale callbacks even after switching away and back to the same source', () => {
    const nasa=observeSignal(createSignalState('nasa-iss'),'load','nasa-iss',0)
    const kexp=selectSignalStation(nasa,'kexp')
    expect(kexp).toMatchObject({sourceId:'kexp',phase:'standby',attempt:2,loadCount:1})
    expect(observeSignal(kexp,'frame-load','nasa-iss',1)).toEqual(kexp)
    const back=selectSignalStation(kexp,'nasa-iss')
    expect(back).toMatchObject({sourceId:'nasa-iss',phase:'standby',attempt:3})
    expect(observeSignal(back,'frame-load','nasa-iss',1)).toEqual(back)
    const newAttempt=observeSignal(back,'load','nasa-iss',3)
    expect(newAttempt.attempt).toBe(4)
    expect(newAttempt.loadCount).toBe(2)
    expect(observeSignal(newAttempt,'frame-load','nasa-iss',4).phase)
      .toBe('frame-document-loaded')
  })
  it('ignores forged unknown IDs and wipes self-reported claims on switching and unloading', () => {
    const start=observeSignal(createSignalState('kexp'),'load','kexp',0)
    const fail=observeSignal(start,'report-failed','kexp',1)
    expect(fail).toMatchObject({phase:'user-reported-failed',selfReported:'failed'})
    const unknown=selectSignalStation(fail,'https://evil.example/stream.m3u8')
    expect(unknown).toMatchObject({phase:'standby',selfReported:'none'})
    expect(observeSignal(unknown,'load','unknown',1)).toEqual(unknown)
    const switched=selectSignalStation(fail,'cbs-news')
    expect(switched).toMatchObject({phase:'standby',selfReported:'none',loadCount:1})
  })
  it('exports a limited session-only receipt with honest provenance and no media endpoint', () => {
    const loaded=observeSignal(createSignalState('kexp'),'load','kexp',0)
    const playing=observeSignal(loaded,'audio-playing','kexp',1)
    const json=signalSessionReceipt(playing,'2026-10-25T19:00:00.000Z','code-consistent')
    const data=JSON.parse(json)
    expect(data).toMatchObject({
      schema:SIGNAL_RECEIPT_SCHEMA,
      provenance:SIGNAL_RECEIPT_PROVENANCE,
      sourceId:'kexp',attemptedCurrentSelection:true,
      loadsRequestedThisDeskSession:1,
      observedPhase:'audio-playing',
      localCodePolicyStatus:'code-consistent',
      capturedUtc:'2026-10-25T19:00:00.000Z',
    })
    expect(data.caveat).toContain('do not prove audible sound')
    for (const forbidden of [
      'kexp160.aac','streamguys1.com','youtube-nocookie.com','viewerIp',
      'watchDuration','localStorage','accessToken','m3u8',
    ]) expect(json).not.toContain(forbidden)
    expect(() => signalSessionReceipt(playing,'yesterday','code-consistent')).toThrow()
    const stopped=observeSignal(playing,'unload','kexp',1)
    expect(JSON.parse(signalSessionReceipt(stopped,'2026-10-25T19:00:00.000Z',
      'engineering-review-required')).attemptedCurrentSelection).toBe(false)
  })
  it('initial render includes recovery explanation but no iframe, audio, or autoplay', () => {
    const html=renderToStaticMarkup(
      <ReviewedPlaybackBridge resetToken={0} onRequestMediaLoad={() => {}}/>,
    )
    expect(html).toContain('RCTV v3.0 · REVIEWED PLAYBACK BRIDGE')
    expect(html).toContain('Open Reviewed Player Desk')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('<audio')
    expect(html).not.toContain('autoplay=')
    expect(html).not.toContain('kexp.streamguys1.com')
  })
})
