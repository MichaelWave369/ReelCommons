import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import UnifiedTvHub from './UnifiedTvHub'
import ReviewedPlaybackBridge from './ReviewedPlaybackBridge'
import { CHANNEL_LINEUP } from './channelSurf'
import {
  TV_HUB_RECENTS_MAX, hubChannelById, hubChannelByNumber, hubGuide,
  hubRememberPrevious, hubReviewedSource,
} from './tvHub'

const nasa=hubChannelById('nasa-iss')!.source
const kexp=hubChannelById('kexp')!.source

function hubHTML(id='nasa-iss',favorites:string[] = [],recent:string[] = []) {
  return renderToStaticMarkup(<UnifiedTvHub
    selected={hubChannelById(id)!.source} favoriteIds={favorites} recentIds={recent}
    onSelect={()=>{}} onOpenMain={()=>{}} onOpenCouch={()=>{}}
    onOpenReviewed={()=>{}}/>)
}

describe('RCTV v3.0 · unified TV home',()=>{
  it('reuses exactly the frozen 50-channel lineup, without untrusted selections',()=>{
    expect(CHANNEL_LINEUP.length).toBe(50)
    expect(hubChannelById('nasa-iss')?.source.name).toBe(nasa.name)
    expect(hubChannelById('kexp')?.source.name).toBe(kexp.name)
    expect(hubChannelById('non-existent')).toBeNull()
    expect(hubChannelById('https://stream.example.com/file.m3u8')).toBeNull()
    expect(hubChannelById(null)).toBeNull()
    expect(hubChannelByNumber('013')?.source.id).toBe('nasa-iss')
    expect(hubChannelByNumber('005')?.source.id).toBe('kexp')
    expect(hubChannelByNumber('51')).toBeNull()
    expect(hubChannelByNumber('0')).toBeNull()
    expect(hubChannelByNumber('13; location.href="evil"')).toBeNull()
  })
  it('searches the official catalog by name, category and channel while respecting favorites',()=>{
    expect(hubGuide('',[],false)).toHaveLength(50)
    expect(hubGuide('nasa',[],false).some((row)=>row.source.id==='nasa-iss')).toBe(true)
    expect(hubGuide('013',[],false).map((row)=>row.source.id)).toContain('nasa-iss')
    expect(hubGuide('kexp',[],false).map((row)=>row.source.id)).toEqual(['kexp'])
    expect(hubGuide('', ['nasa-iss','kexp','madeup'],true).map(({source})=>source.id))
      .toEqual(['kexp','nasa-iss'])
    expect(hubGuide('jazz',['nasa-iss'],true)).toEqual([])
    expect(hubGuide('x'.repeat(800),[],false)).toEqual([])
  })
  it('tracks only a small untrusted-free in-memory navigation backstack',()=>{
    expect(hubRememberPrevious([], 'nasa-iss','nasa-iss')).toEqual([])
    expect(hubRememberPrevious([], 'nasa-iss','kexp')).toEqual(['nasa-iss'])
    expect(hubRememberPrevious(['nasa-iss'], 'kexp','cbs-news'))
      .toEqual(['kexp','nasa-iss'])
    expect(hubRememberPrevious(['kexp','nasa-iss'],'cbs-news','kexp'))
      .toEqual(['cbs-news','nasa-iss'])
    const visited=CHANNEL_LINEUP.slice(0,12).map((slot)=>slot.source.id)
    const recent=hubRememberPrevious(visited,'nasa-iss','kexp')
    expect(recent.length).toBe(TV_HUB_RECENTS_MAX)
    expect(recent).not.toContain('kexp')
    expect(hubRememberPrevious([], 'nasa-iss','unknown')).toEqual([])
  })
  it('limits reviewed-desk handoff to exact source-controlled bridge stations',()=>{
    expect(hubReviewedSource('nasa-iss')).toBe(true)
    expect(hubReviewedSource('kexp')).toBe(true)
    expect(hubReviewedSource('cbs-news')).toBe(true)
    expect(hubReviewedSource('somafm')).toBe(false)
    expect(hubReviewedSource('arbitrary')).toBe(false)
    expect(hubReviewedSource('https://example.com/stream.m3u8')).toBe(false)
  })
  it('renders unified navigation without loading a single player or media URL',()=>{
    const html=hubHTML('nasa-iss',['kexp'],['kexp'])
    expect(html).toContain('The Unified TV Home')
    expect(html).toContain('THREE SCREENS + STUDIO')
    expect(html).toContain('CH 013')
    expect(html).toContain('Enter Couch Mode')
    expect(html).toContain('Open Reviewed Player Desk')
    expect(html).toContain('Previously selected')
    expect(html).toContain('Browse unified guide')
    expect(html).toContain('NO AUTOPLAY')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('<audio')
    expect(html).not.toContain('streamguys1.com')
    expect(html).not.toContain('youtube-nocookie.com/embed')
    expect(html).not.toContain('autoplay=')
  })
  it('disables the Reviewed Player Desk handoff for a station outside its roster',()=>{
    const html=hubHTML('somafm')
    expect(html).toContain('Choose one of the 7 reviewed stations first')
    expect(html).toContain('disabled=""')
    expect(html).not.toContain('<video')
  })
  it('keeps reviewed desk standby-only with shared-source sync props',()=>{
    const html=renderToStaticMarkup(<ReviewedPlaybackBridge
      resetToken={2} selectedSourceId="kexp" openRequestToken={0}
      onSelectSource={()=>{}} onRequestMediaLoad={()=>{}}/>)
    expect(html).toContain('RCTV v3.1 · REVIEWED PLAYBACK BRIDGE')
    expect(html).toContain('Open Reviewed Player Desk')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('<audio')
    expect(html).not.toContain('autoplay=')
  })
})
