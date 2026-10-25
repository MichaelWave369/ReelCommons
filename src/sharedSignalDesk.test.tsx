import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import SignalDiagnosticPanel from './SignalDiagnosticPanel'
import CouchMode from './CouchMode'
import { ALL_OPEN_STREAMS } from './cameraCatalog'
import {
  initialSignalForSource, createSignalState, observeSignal,
  selectSignalStation, signalSessionReceipt,
} from './signalRecovery'

const get = (id: string) => {
  const result = ALL_OPEN_STREAMS.find((s) => s.id === id)
  if (!result) throw new Error('Missing test source: ' + id)
  return result
}
const render = (id: string, loaded = false, scope: 'Channel Desk'|'Couch Mode'='Channel Desk') =>
  renderToStaticMarkup(<SignalDiagnosticPanel
    source={get(id)} loaded={loaded} context={scope}
    signal={initialSignalForSource(id)} onReport={() => {}} />)

describe('RCTV v2.9 · Shared Signal & Recovery', () => {
  it('restores signal state for saved reviewed stations, without trusting arbitrary IDs', () => {
    expect(initialSignalForSource('kexp')).toEqual(createSignalState('kexp'))
    expect(initialSignalForSource('nasa-iss')).toEqual(createSignalState('nasa-iss'))
    expect(initialSignalForSource('cbs-news')).toEqual(createSignalState('cbs-news'))
    expect(initialSignalForSource('bogus').sourceId).toBe('nasa-iss')
    expect(initialSignalForSource('bogus').phase).toBe('standby')
  })
  it('invalidates old media callbacks when tuned to website-only and back', () => {
    const first=observeSignal(createSignalState('kexp'),'load','kexp',0)
    const website=selectSignalStation(first,'somafm')
    expect(website).toMatchObject({phase:'standby',attempt:2,loadCount:1})
    expect(observeSignal(website,'audio-playing','kexp',1)).toEqual(website)
    const second=selectSignalStation(website,'kexp')
    expect(second.attempt).toBe(3)
    const newLoad=observeSignal(second,'load','kexp',3)
    expect(newLoad).toMatchObject({attempt:4,loadCount:2,phase:'controls-loaded'})
    expect(observeSignal(newLoad,'audio-playing','kexp',1)).toEqual(newLoad)
    expect(observeSignal(newLoad,'audio-playing','kexp',4).phase).toBe('audio-playing')
  })
  it('renders no media for a reviewed station until the user explicitly loads it', () => {
    const text=render('nasa-iss')
    expect(text).toContain('CHANNEL DESK SIGNAL')
    expect(text).toContain('Signal &amp; Recovery')
    expect(text).toContain('No media loaded')
    expect(text).toContain('Recover on official broadcaster')
    expect(text).toContain('Export signal receipt')
    expect(text).not.toContain('<iframe')
    expect(text).not.toContain('<audio')
    expect(text).not.toContain('streamguys1.com')
    expect(text).not.toContain('youtube-nocookie.com/embed')
    expect(text).not.toContain('I can see the video')
  })
  it('renders official-site recovery without misleading diagnostics or export for other destinations', () => {
    const html=render('somafm')
    expect(html).toContain('OFFICIAL SITE ONLY')
    expect(html).toContain('does not have an approved inline player')
    expect(html).toContain('https://somafm.com/')
    expect(html).not.toContain('Export signal receipt')
    expect(html).not.toContain('I can hear audio')
  })
  it('offers manual signal-reporting only when reviewed media was loaded', () => {
    const nasaLoaded=observeSignal(createSignalState('nasa-iss'),'load','nasa-iss',0)
    const html=renderToStaticMarkup(<SignalDiagnosticPanel
      source={get('nasa-iss')} loaded context="Channel Desk" signal={nasaLoaded}
      onReport={() => {}} />)
    expect(html).toContain('I can see the video')
    expect(html).toContain('Not working here')
    expect(html).toContain('iframe requested')
    expect(html).not.toContain('<iframe')
    const kexpLoaded=observeSignal(createSignalState('kexp'),'load','kexp',0)
    const audio=renderToStaticMarkup(<SignalDiagnosticPanel
      source={get('kexp')} loaded context="Couch Mode" signal={kexpLoaded}
      onReport={() => {}} />)
    expect(audio).toContain('I can hear audio')
    expect(audio).toContain('COUCH MODE SIGNAL')
    expect(audio).not.toContain('<audio')
  })
  it('includes the reusable recovery desk in Couch Mode without automatic media', () => {
    const html=renderToStaticMarkup(<CouchMode selected={get('kexp')}
      favoriteIds={[]} onSelect={()=>{}} onClose={()=>{}} />)
    expect(html).toContain('COUCH MODE SIGNAL')
    expect(html).toContain('Recover on official broadcaster')
    expect(html).toContain('Export signal receipt')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('<audio')
    expect(html).not.toContain('autoplay=')
    const onlyExternal=renderToStaticMarkup(<CouchMode selected={get('somafm')}
      favoriteIds={[]} onSelect={()=>{}} onClose={()=>{}} />)
    expect(onlyExternal).toContain('OFFICIAL SITE ONLY')
    expect(onlyExternal).not.toContain('Export signal receipt')
  })
  it('keeps export metadata source-specific and never persists media or viewing history', () => {
    const audio=observeSignal(createSignalState('kexp'),'load','kexp',0)
    const receipt=signalSessionReceipt(audio,'2026-10-25T21:30:00.000Z','code-consistent')
    const parsed=JSON.parse(receipt)
    expect(parsed.sourceId).toBe('kexp')
    expect(parsed.loadsRequestedThisDeskSession).toBe(1)
    expect(parsed.observedPhase).toBe('controls-loaded')
    for(const token of ['kexp160.aac','streamguys1.com','localStorage','watchDuration','userAgent']) {
      expect(receipt).not.toContain(token)
    }
  })
})
