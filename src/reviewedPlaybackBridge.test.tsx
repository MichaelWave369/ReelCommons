import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import ReviewedPlaybackBridge from './ReviewedPlaybackBridge'
import {
  REVIEWED_BRIDGE_IDS, REVIEWED_BRIDGE_ROSTER,
  loadBridgeMedia, moveBridgeStation, reviewedBridgeReceipt, reviewedMediaUrl,
  unloadBridgeMedia,
} from './reviewedPlaybackBridge'
import type { BridgeSelection } from './reviewedPlaybackBridge'
import { playableUrl } from './openStreams'

const initial: BridgeSelection = { selectedId: 'nasa-iss', loadedId: null }

describe('RCTV v2.4 Reviewed Playback Bridge', () => {
  it('uses exactly the reviewed, source-controlled broadcaster roster', () => {
    expect(REVIEWED_BRIDGE_IDS).toEqual([
      'nasa-iss','kexp','cbs-news','abc-news','pbs-online','house-live','nasa-live',
    ])
    expect(REVIEWED_BRIDGE_ROSTER.map((item) => item.id)).toEqual(REVIEWED_BRIDGE_IDS)
    expect(new Set(REVIEWED_BRIDGE_ROSTER.map((item) => item.id)).size)
      .toBe(REVIEWED_BRIDGE_ROSTER.length)
    for (const item of REVIEWED_BRIDGE_ROSTER) {
      expect(item.source.id).toBe(item.id)
      expect(item.source.officialUrl.startsWith('https://')).toBe(true)
      expect(item.review.length).toBeGreaterThan(50)
    }
  })
  it('provides only the two pre-reviewed, exact playback URLs', () => {
    expect(reviewedMediaUrl('nasa-iss'))
      .toBe('https://www.youtube-nocookie.com/embed/jKHvbJe9c_Y?rel=0')
    expect(reviewedMediaUrl('kexp'))
      .toBe('https://kexp.streamguys1.com/kexp160.aac')
    for (const id of ['cbs-news','abc-news','pbs-online','house-live','nasa-live',
      'somafm','evil','NASA-ISS','https://www.youtube.com/watch?v=jKHvbJe9c_Y','']) {
      expect(reviewedMediaUrl(id)).toBeNull()
    }
    for (const item of REVIEWED_BRIDGE_ROSTER) {
      if (item.id !== 'nasa-iss' && item.id !== 'kexp') {
        expect(item.mode).toBe('official-website')
        expect(playableUrl(item.source)).toBeNull()
      }
    }
  })
  it('unloads the previous media whenever stations change or an unknown ID is chosen', () => {
    const playing = loadBridgeMedia(initial)
    expect(playing).toEqual({ selectedId: 'nasa-iss', loadedId: 'nasa-iss' })
    const radio = moveBridgeStation(playing, 'kexp')
    expect(radio).toEqual({ selectedId: 'kexp', loadedId: null })
    expect(loadBridgeMedia(radio)).toEqual({ selectedId: 'kexp', loadedId: 'kexp' })
    const official = moveBridgeStation(loadBridgeMedia(radio), 'cbs-news')
    expect(official).toEqual({ selectedId: 'cbs-news', loadedId: null })
    expect(loadBridgeMedia(official)).toEqual(official)
    expect(moveBridgeStation(playing, 'https://evil.example/index.m3u8')).toEqual(initial)
    expect(unloadBridgeMedia(playing)).toEqual(initial)
  })
  it('exports source review provenance, not private media endpoints or playback proof', () => {
    const receipt = reviewedBridgeReceipt('kexp')
    expect(receipt).not.toBeNull()
    const parsed = JSON.parse(receipt!)
    expect(parsed).toMatchObject({
      schema: 'RCTV_REVIEWED_BRIDGE_RECEIPT_V1',
      provenance: 'CHECKED_IN_RCTV_REVIEWED_SOURCE',
      sourceId: 'kexp',
      playbackMode: 'published-audio',
      officialSite: 'https://www.kexp.org/listen/',
    })
    for (const secret of ['kexp.streamguys1.com/kexp160.aac', 'streams.json', '.m3u8', 'watchDuration',
      'playedAt', 'viewerIp']) {
      expect(receipt).not.toContain(secret)
    }
    expect(reviewedBridgeReceipt('bogus')).toBeNull()
  })
  it('renders a standby-only interface with no media requests before an explicit click', () => {
    const html = renderToStaticMarkup(
      <ReviewedPlaybackBridge resetToken={0} onRequestMediaLoad={() => {}} />,
    )
    expect(html).toContain('Open Reviewed Player Desk')
    expect(html).toContain('REVIEWED METHOD')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('<audio')
    expect(html).not.toContain('autoplay=')
    expect(html).not.toContain('youtube-nocookie.com/embed')
    expect(html).not.toContain('streamguys1.com')
    expect(html).not.toContain('iptv-org.github.io/api/streams.json')
  })
})
