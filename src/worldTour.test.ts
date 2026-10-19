import { describe, expect, it } from 'vitest'
import {
  EMPTY_TOUR_PASSPORT, getTourStop, markTourStop, nextTourIndex, readTourPassport,
  tourPassportReceipt, tourProgress, unmarkTourStop, WORLD_TOURS,
} from './worldTour'
import { ALL_OPEN_STREAMS } from './cameraCatalog'
import { playableUrl } from './openStreams'

describe('RCTV v1.5 World Tour: curated camera itinerary and passport', () => {
  it('ten routes contain five unique existing official sources with meaningful narration', () => {
    expect(WORLD_TOURS).toHaveLength(10)
    expect(new Set(WORLD_TOURS.map((tour) => tour.id)).size).toBe(6)
    const sourceIds = new Set(ALL_OPEN_STREAMS.map((item) => item.id))
    for (const tour of WORLD_TOURS) {
      expect(tour.stops).toHaveLength(5)
      expect(new Set(tour.stops.map((stop) => stop.sourceId)).size).toBe(5)
      for (const stop of tour.stops) {
        expect(sourceIds.has(stop.sourceId)).toBe(true)
        expect(stop.story.length).toBeGreaterThan(25)
      }
    }
  })
  it('each stop uses the source owner destination, without constructing a player', () => {
    for (const tour of WORLD_TOURS) {
      for (let index = 0; index < tour.stops.length; index++) {
        const source = getTourStop(tour, index)!
        expect(source.id).toBe(tour.stops[index].sourceId)
        expect(source.officialUrl.startsWith('https://')).toBe(true)
        // A route does not infer embed permission, including NASA and KEXP.
        if (source.category === 'city' || source.category === 'nature') expect(playableUrl(source)).toBeNull()
      }
    }
    expect(getTourStop(WORLD_TOURS[0], -1)).toBeNull()
    expect(getTourStop(WORLD_TOURS[0], 20)).toBeNull()
  })
  it('a tour starts at stop one and cannot overrun its route', () => {
    const tour = WORLD_TOURS[0]
    expect(nextTourIndex(0, tour, -1)).toBe(0)
    expect(nextTourIndex(0, tour, 1)).toBe(1)
    expect(nextTourIndex(4, tour, 1)).toBe(4)
    expect(nextTourIndex(4, tour, -1)).toBe(3)
  })
  it('manual stamps do not imply automatically detected playback, and completion needs every stop', () => {
    let passport = EMPTY_TOUR_PASSPORT
    const tour = WORLD_TOURS[0]
    expect(tourProgress(tour, passport)).toEqual({ stamped: 0, total: 5, completed: false })
    for (let i = 0; i < tour.stops.length; i++) {
      passport = markTourStop(passport, tour.stops[i].sourceId, '2026-10-18')
    }
    expect(tourProgress(tour, passport)).toEqual({ stamped: 5, total: 5, completed: true })
    passport = unmarkTourStop(passport, tour.stops[0].sourceId)
    expect(tourProgress(tour, passport).completed).toBe(false)
  })
  it('rejects injected/unknown keys, malformed dates, arbitrary JSON and oversized local storage', () => {
    expect(readTourPassport('{')).toEqual(EMPTY_TOUR_PASSPORT)
    expect(readTourPassport('x'.repeat(12001))).toEqual(EMPTY_TOUR_PASSPORT)
    expect(readTourPassport('{"version":8,"stampedOn":{}}')).toEqual(EMPTY_TOUR_PASSPORT)
    expect(readTourPassport(JSON.stringify({
      version: 1, stampedOn: {
        'nyc-times-square': '2026-10-18', 'unknown-remote-feed': '2026-10-18',
        'new-orleans-bourbon': '2026-02-30', 'rome-trevi-fountain': 'bad',
      },
    })).stampedOn).toEqual({ 'nyc-times-square': '2026-10-18' })
    expect(markTourStop(EMPTY_TOUR_PASSPORT, 'unknown-remote-feed', '2026-10-18')).toBe(EMPTY_TOUR_PASSPORT)
  })
  it('exports only a user-stamped itinerary receipt with explicit source and playback limits', () => {
    const tour = WORLD_TOURS[0]
    const passport = markTourStop(EMPTY_TOUR_PASSPORT, tour.stops[0].sourceId, '2026-10-18')
    const receipt = JSON.parse(tourPassportReceipt(passport, tour)) as {
      provenance: string; streamingUrlsIncluded: boolean; trackingEnabled: boolean; stamps: unknown[]; limitations: string
    }
    expect(receipt.provenance).toBe('VISITOR_SELF_REPORTED_STOPS')
    expect(receipt.streamingUrlsIncluded).toBe(false)
    expect(receipt.trackingEnabled).toBe(false)
    expect(receipt.stamps).toHaveLength(1)
    expect(receipt.limitations).toContain('not that the feed played')
  })
  it('shared stops can be stamped across tour routes, without misleading per-tour progress', () => {
    const ids = WORLD_TOURS.flatMap((tour) => tour.stops.map((stop) => stop.sourceId))
    const sharedId = ids.find((id) => ids.filter((other) => other === id).length > 1)!
    const passport = markTourStop(EMPTY_TOUR_PASSPORT, sharedId, '2026-10-18')
    expect(WORLD_TOURS.filter((tour) => tour.stops.some((stop) => stop.sourceId === sharedId)).every(
      (tour) => tourProgress(tour, passport).stamped === 1,
    )).toBe(true)
  })
})
