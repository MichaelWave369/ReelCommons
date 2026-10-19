/**
 * RCTV v1.8 · Custom World Tours.
 *
 * Local-only itinerary metadata. User files are untrusted: we rebuild tour
 * objects from known catalog IDs, not arbitrary URLs, HTML, media or imports.
 * Existing World Tour passport remains a separate, manual-only record.
 */
import { ALL_OPEN_STREAMS } from './cameraCatalog'
import type { OpenStream } from './openStreams'
import type { WorldTour } from './worldTour'

export const CUSTOM_TOURS_STORAGE_KEY = 'rctv-custom-world-tours-v1'
export const CUSTOM_TOUR_FORMAT = 'RCTV_CUSTOM_WORLD_TOUR_V1'
export const MAX_CUSTOM_TOURS = 12
export const MIN_TOUR_STOPS = 3
export const MAX_TOUR_STOPS = 10
export const MAX_CUSTOM_IMPORT_BYTES = 24_000
const TITLE_MAX = 64
const ID_PATTERN = /^custom-[a-z0-9-]{8,70}$/

export interface CustomTourRecord {
  id: string
  title: string
  /** Ordered, deduplicated references to sources in the official RCTV catalog. */
  sourceIds: string[]
}
export interface CustomTourStore {
  version: 1
  tours: CustomTourRecord[]
}
export const EMPTY_CUSTOM_TOUR_STORE: CustomTourStore = { version: 1, tours: [] }

const obj = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
function titleClean(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > TITLE_MAX + 20) return null
  const title = value.trim()
  if (title.length < 3 || title.length > TITLE_MAX || /[\u0000-\u001f\u007f<>]/.test(title)) return null
  return title
}
export function validCatalogStopIds(value: unknown, sources: readonly OpenStream[] = ALL_OPEN_STREAMS): string[] | null {
  if (!Array.isArray(value) || value.length < MIN_TOUR_STOPS || value.length > MAX_TOUR_STOPS) return null
  const allowed = new Set(sources.map((source) => source.id))
  if (!value.every((id) => typeof id === 'string' && allowed.has(id))) return null
  const ids = value as string[]
  if (new Set(ids).size !== ids.length) return null
  return [...ids]
}
export function validateCustomTour(value: unknown, sources: readonly OpenStream[] = ALL_OPEN_STREAMS): CustomTourRecord | null {
  if (!obj(value) || Object.keys(value).some((key) => !['id','title','sourceIds'].includes(key))) return null
  if (typeof value.id !== 'string' || !ID_PATTERN.test(value.id)) return null
  const title = titleClean(value.title)
  const ids = validCatalogStopIds(value.sourceIds,sources)
  if (!title || !ids) return null
  return { id: value.id, title, sourceIds: ids }
}
export function makeCustomTour(id: string, title: string, sourceIds: string[], sources: readonly OpenStream[] = ALL_OPEN_STREAMS): CustomTourRecord | null {
  return validateCustomTour({id,title,sourceIds},sources)
}
export function customTourToWorldTour(record: CustomTourRecord, sources: readonly OpenStream[] = ALL_OPEN_STREAMS): WorldTour {
  const catalog = new Map(sources.map((item) => [item.id, item]))
  return {
    id: record.id,
    name: record.title,
    subtitle: 'Your personal journey · ' + record.sourceIds.length + ' stops',
    description: 'A route you curated from RCTV’s official destinations. Provider availability is not guaranteed, and no playback is started by the tour.',
    accent: 'mint', symbol: '✎',
    stops: record.sourceIds.map((id) => {
      const source = catalog.get(id)
      return {sourceId:id,story:source ?
        'Visit ' + source.name + ' through its original provider destination. ' + source.tagline :
        'Visit this source on its official destination page.'}
    }),
  }
}
export function parseCustomTourStore(raw: string | null, sources: readonly OpenStream[] = ALL_OPEN_STREAMS): CustomTourStore {
  if (!raw || raw.length > MAX_CUSTOM_IMPORT_BYTES) return {version:1,tours:[]}
  try {
    const json: unknown = JSON.parse(raw) as unknown
    if (!obj(json) || json.version !== 1 || !Array.isArray(json.tours)) return {version:1,tours:[]}
    const tours: CustomTourRecord[] = []
    const seen = new Set<string>()
    for (const entry of json.tours.slice(0, MAX_CUSTOM_TOURS + 1)) {
      const tour = validateCustomTour(entry, sources)
      if (!tour || seen.has(tour.id)) continue
      tours.push(tour);seen.add(tour.id)
      if (tours.length >= MAX_CUSTOM_TOURS) break
    }
    return {version:1,tours}
  } catch {return {version:1,tours:[]}}
}
export function parseSharedCustomTour(raw: string, sources: readonly OpenStream[] = ALL_OPEN_STREAMS): Omit<CustomTourRecord,'id'> {
  if (raw.length > MAX_CUSTOM_IMPORT_BYTES) throw new Error('Import exceeds 24 KB.')
  let parsed: unknown
  try {parsed = JSON.parse(raw) as unknown}
  catch {throw new Error('Not valid JSON.')}
  if (!obj(parsed) || parsed.format !== CUSTOM_TOUR_FORMAT || !obj(parsed.tour))
    throw new Error('Expected an RCTV Custom World Tour export.')
  if (Object.keys(parsed).some((key) => !['format','tour','notice'].includes(key))) throw new Error('Unsupported import envelope fields.')
  if (Object.keys(parsed.tour).some((key) => !['title','sourceIds'].includes(key)))
    throw new Error('Import contains unsupported fields, including possible remote media links.')
  const title = titleClean(parsed.tour.title)
  const sourceIds = validCatalogStopIds(parsed.tour.sourceIds,sources)
  if (!title) throw new Error('Tour title must be 3–64 characters without markup or control characters.')
  if (!sourceIds) throw new Error('Tour must contain 3–10 unique destinations from the current RCTV catalog.')
  return {title,sourceIds}
}
export function exportSharedCustomTour(record: CustomTourRecord): string {
  return JSON.stringify({
    format:CUSTOM_TOUR_FORMAT,
    tour:{title:record.title,sourceIds:[...record.sourceIds]},
    notice:'Itinerary metadata only. Source IDs reference curated official RCTV destinations. No video, stream URLs, playback evidence, GPS, personal data or rights authorization.',
  },null,2)
}
export function appendCustomTour(store: CustomTourStore, record: CustomTourRecord): CustomTourStore | null {
  if (store.tours.length >= MAX_CUSTOM_TOURS || store.tours.some((tour)=>tour.id===record.id)) return null
  return {version:1,tours:[...store.tours,record]}
}
export function moveCustomStop(ids: readonly string[], index: number, direction: -1 | 1): string[] {
  const next = [...ids];const target = index + direction
  if (!Number.isInteger(index) || index < 0 || target < 0 || target >= ids.length) return next
  ;[next[index],next[target]]=[next[target],next[index]]
  return next
}
