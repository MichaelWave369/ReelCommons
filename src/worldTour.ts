/**
 * RCTV v1.5 · World Tour Mode
 *
 * A curated, human-directed itinerary through official provider pages.
 * "Stamped" means the visitor manually marked the stop explored, not that
 * RCTV detected video playback, real-time availability, or physical travel.
 * No external API, background timer, remote player, or remote camera loads.
 */
import { ALL_OPEN_STREAMS } from './cameraCatalog'
import type { OpenStream } from './openStreams'

export const WORLD_TOUR_KEY = 'rctv-world-tour-passport-v1'
export interface TourStop {
  sourceId: string
  story: string
}
export interface WorldTour {
  id: string
  name: string
  subtitle: string
  description: string
  accent: 'mint' | 'blue' | 'gold' | 'violet' | 'coral' | 'rose'
  symbol: string
  stops: readonly TourStop[]
}
export interface TourPassport {
  version: 1
  /** ISO YYYY-MM-DD (UTC), manual visitor stamp only. */
  stampedOn: Record<string, string>
}
export const EMPTY_TOUR_PASSPORT: TourPassport = { version: 1, stampedOn: {} }

export const WORLD_TOURS: readonly WorldTour[] = [
  {
    id: 'neon-nights', name: 'Neon Nights',
    subtitle: 'Bourbon Street to Shibuya',
    description: 'An after-dark-inspired stroll through city streets, crossings and lights. Local daylight varies; live video is never guaranteed.',
    accent: 'violet', symbol: '✦', stops: [
      { sourceId: 'new-orleans-bourbon', story: 'Begin where you left off: music, balconies and the French Quarter.' },
      { sourceId: 'nyc-times-square', story: 'Look up at Manhattan’s dancing signs and crossing crowds.' },
      { sourceId: 'vegas-skyline', story: 'Visit the desert skyline where the city meets the night.' },
      { sourceId: 'tokyo-shibuya', story: 'Follow the flow of one of Tokyo’s busy street intersections.' },
      { sourceId: 'london-abbey-road', story: 'Catch the next hopeful album-cover recreation at a famous crossing.' },
    ],
  },
  {
    id: 'postcard-cities', name: 'Postcard Cities',
    subtitle: 'Five remarkable city corners',
    description: 'A global walk from London through Italy, Japan and New York, using only official city camera pages.',
    accent: 'coral', symbol: '▦', stops: [
      { sourceId: 'london-abbey-road', story: 'Watch daily life unfold outside a music landmark.' },
      { sourceId: 'rome-trevi-fountain', story: 'Study the old city through a fountain-side perspective.' },
      { sourceId: 'venice-grand-canal', story: 'Switch pedestrians for boats along the Grand Canal.' },
      { sourceId: 'tokyo-shibuya', story: 'See the choreography of an urban crossing.' },
      { sourceId: 'nyc-times-square', story: 'Finish with the glowing center of Midtown Manhattan.' },
    ],
  },
  {
    id: 'parks-peaks', name: 'Parks & Peaks',
    subtitle: 'Five American national parks',
    description: 'From granite walls to geysers. These park webcams often publish refreshed still images rather than continuous video.',
    accent: 'mint', symbol: '△', stops: [
      { sourceId: 'yosemite-valley', story: 'Take in Yosemite Valley from the mountain webcams.' },
      { sourceId: 'grand-canyon-south-rim', story: 'Watch shadows and weather move across canyon country.' },
      { sourceId: 'glacier-montana', story: 'Pause beside northern mountain lakes and passes.' },
      { sourceId: 'rocky-mountain-park', story: 'Check the high-country weather from official park views.' },
      { sourceId: 'yellowstone-geysers', story: 'Finish at Old Faithful and the geyser basin.' },
    ],
  },
  {
    id: 'wild-neighbors', name: 'Wild Neighbors',
    subtitle: 'Birds, pandas and life under water',
    description: 'A relaxed wildlife route. Nature has no production schedule, and some sources are seasonal or replay footage.',
    accent: 'gold', symbol: '✳', stops: [
      { sourceId: 'cornell-feederwatch', story: 'Meet the regulars at the bird feeder.' },
      { sourceId: 'smithsonian-pandas', story: 'Drop by the zoo’s giant panda habitats.' },
      { sourceId: 'explore-wildlife', story: 'Browse seasonal wildlife cameras maintained by Explore.org.' },
      { sourceId: 'aquarium-pacific', story: 'Visit an ocean world of reefs, sharks and penguins.' },
      { sourceId: 'georgia-aquarium-cams', story: 'Finish with another window onto life beneath the surface.' },
    ],
  },
  {
    id: 'earth-alive', name: 'Earth Alive',
    subtitle: 'Volcanoes, geysers and the view from orbit',
    description: 'See geology and natural forces, ending with NASA’s window toward Earth. USGS scientific cameras show refreshed images.',
    accent: 'rose', symbol: '♨', stops: [
      { sourceId: 'usgs-kilauea', story: 'Read the volcano landscape through an official summit camera.' },
      { sourceId: 'usgs-mauna-loa', story: 'Move to the observatory’s thermal perspective.' },
      { sourceId: 'yellowstone-geysers', story: 'Watch geothermal processes in Yellowstone.' },
      { sourceId: 'grand-canyon-south-rim', story: 'Look across geology on a vast continental scale.' },
      { sourceId: 'nasa-iss', story: 'End at the International Space Station’s view of Earth.' },
    ],
  },
  {
    id: 'ocean-to-orbit', name: 'Ocean to Orbit',
    subtitle: 'A slow journey from blue water to space',
    description: 'A quiet itinerary spanning aquarium life, coastal wildlife, and official space viewing.',
    accent: 'blue', symbol: '≋', stops: [
      { sourceId: 'monterey-cams', story: 'Begin at Monterey Bay’s kelp forest and ocean habitats.' },
      { sourceId: 'aquarium-pacific', story: 'Explore the aquarium’s shark and reef cameras.' },
      { sourceId: 'georgia-aquarium-cams', story: 'Discover the aquarium’s marine wildlife feeds.' },
      { sourceId: 'nasa-live', story: 'Check NASA’s current event and mission coverage page.' },
      { sourceId: 'nasa-iss', story: 'Rise into orbit for the final view of our planet.' },
    ],
  },
]

export function getTourStop(tour: WorldTour, index: number, sources: readonly OpenStream[] = ALL_OPEN_STREAMS): OpenStream | null {
  if (!Number.isInteger(index) || index < 0 || index >= tour.stops.length) return null
  const id = tour.stops[index].sourceId
  return sources.find((source) => source.id === id) ?? null
}
export function tourProgress(tour: WorldTour, passport: TourPassport): { stamped: number; total: number; completed: boolean } {
  const stamped = tour.stops.filter((stop) => !!passport.stampedOn[stop.sourceId]).length
  return { stamped, total: tour.stops.length, completed: stamped === tour.stops.length && tour.stops.length > 0 }
}
export function nextTourIndex(index: number, tour: WorldTour, direction: 1 | -1): number {
  return Math.max(0, Math.min(tour.stops.length - 1, index + direction))
}
function validUtcDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(value + 'T00:00:00.000Z')
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}
export function readTourPassport(raw: string | null, sources: readonly OpenStream[] = ALL_OPEN_STREAMS): TourPassport {
  if (!raw || raw.length > 12_000) return { version: 1, stampedOn: {} }
  try {
    const json: unknown = JSON.parse(raw) as unknown
    if (!json || typeof json !== 'object' || Array.isArray(json)) return { version: 1, stampedOn: {} }
    const parsed = json as Record<string, unknown>
    if (parsed.version !== 1 || !parsed.stampedOn || typeof parsed.stampedOn !== 'object' || Array.isArray(parsed.stampedOn))
      return { version: 1, stampedOn: {} }
    const allowed = new Set(sources.map((source) => source.id))
    const clean: Record<string, string> = {}
    for (const [key, date] of Object.entries(parsed.stampedOn)) {
      if (allowed.has(key) && validUtcDate(date) && Object.keys(clean).length < 70) {
        clean[key] = date
      }
    }
    return { version: 1, stampedOn: clean }
  } catch { return { version: 1, stampedOn: {} } }
}
export function markTourStop(passport: TourPassport, sourceId: string, date: string, sources: readonly OpenStream[] = ALL_OPEN_STREAMS): TourPassport {
  const known = sources.some((source) => source.id === sourceId)
  if (!known || !validUtcDate(date)) return passport
  return { version: 1, stampedOn: { ...passport.stampedOn, [sourceId]: date } }
}
export function unmarkTourStop(passport: TourPassport, sourceId: string): TourPassport {
  const next = { ...passport.stampedOn }
  delete next[sourceId]
  return { version: 1, stampedOn: next }
}
export function tourPassportReceipt(passport: TourPassport, tour: WorldTour): string {
  return JSON.stringify({
    schema: 'RCTV_WORLD_TOUR_PASSPORT_V1',
    provenance: 'VISITOR_SELF_REPORTED_STOPS',
    tourId: tour.id, tourTitle: tour.name, progress: tourProgress(tour, passport),
    stamps: tour.stops.filter((stop) => passport.stampedOn[stop.sourceId]).map((stop) => ({
      sourceId: stop.sourceId, markedOnUtc: passport.stampedOn[stop.sourceId],
    })),
    limitations: 'A stamp means manually marked as explored, not that the feed played, the camera was live, or any physical travel occurred.',
    streamingUrlsIncluded: false, trackingEnabled: false,
  }, null, 2)
}
