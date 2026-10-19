/**
 * ReelCommons v1.7 · World Atlas
 * Original schematic geographical region clusters, NOT exact webcam
 * locations and NOT a real-time provider status service.
 * Static metadata only; no third-party map tiles, location services or API.
 */
import { ALL_OPEN_STREAMS } from './cameraCatalog'
import type { OpenStream, StreamCategory } from './openStreams'
export type AtlasContinent = 'americas' | 'europe' | 'asia-pacific'
export interface AtlasRegion {
  id: string
  label: string
  description: string
  continent: AtlasContinent
  centerLat: number
  centerLon: number
  timeZone: string
  sourceIds: readonly string[]
}
export const ATLAS_REGIONS: readonly AtlasRegion[] = [
  {
    id: 'hawaii', label: 'Hawaiian Volcanoes', description: 'Scientific summit cameras above island volcanoes.',
    continent: 'americas', centerLat: 19.5, centerLon: -155.4, timeZone: 'Pacific/Honolulu',
    sourceIds: ['usgs-kilauea','usgs-mauna-loa'],
  },
  {
    id: 'whistler', label: 'Pacific Northwest', description: 'High mountain viewpoints in British Columbia.',
    continent: 'americas', centerLat: 50.1, centerLon: -122.9, timeZone: 'America/Vancouver',
    sourceIds: ['mountain-whistler'],
  },
  {
    id: 'cal-coast', label: 'California Coast', description: 'Pacific beaches, aquariums, piers and working harbors.',
    continent: 'americas', centerLat: 35.1, centerLon: -120.0, timeZone: 'America/Los_Angeles',
    sourceIds: ['beach-santa-monica','beach-huntington-pier','harbor-los-angeles','harbor-san-luis','aquarium-pacific','monterey-cams'],
  },
  {
    id: 'cal-sierra', label: 'High Sierra', description: 'Mountain webcams in California’s Sierra Nevada.',
    continent: 'americas', centerLat: 37.55, centerLon: -119.4, timeZone: 'America/Los_Angeles',
    sourceIds: ['yosemite-valley','mountain-mammoth'],
  },
  {
    id: 'nevada', label: 'Las Vegas, Nevada', description: 'Neon desert skyline and Las Vegas viewing.',
    continent: 'americas', centerLat: 36.1, centerLon: -115.2, timeZone: 'America/Los_Angeles',
    sourceIds: ['vegas-skyline'],
  },
  {
    id: 'arizona', label: 'Grand Canyon, Arizona', description: 'Grand Canyon South Rim park webcams.',
    continent: 'americas', centerLat: 36.05, centerLon: -112.13, timeZone: 'America/Phoenix',
    sourceIds: ['grand-canyon-south-rim'],
  },
  {
    id: 'northern-rockies', label: 'Northern Rockies', description: 'Geysers, national parks and alpine resort views.',
    continent: 'americas', centerLat: 45.1, centerLon: -112.1, timeZone: 'America/Denver',
    sourceIds: ['yellowstone-geysers','glacier-montana','mountain-jackson-hole'],
  },
  {
    id: 'colorado', label: 'Colorado Peaks', description: 'High-country national park webcams.',
    continent: 'americas', centerLat: 40.4, centerLon: -105.7, timeZone: 'America/Denver',
    sourceIds: ['rocky-mountain-park'],
  },
  {
    id: 'great-lakes', label: 'Lake Superior Port', description: 'Freighters, a lighthouse and freshwater waves.',
    continent: 'americas', centerLat: 46.8, centerLon: -92.1, timeZone: 'America/Chicago',
    sourceIds: ['beach-park-point','harbor-duluth','harbor-duluth-lighthouse'],
  },
  {
    id: 'new-orleans', label: 'New Orleans', description: 'Street life in the French Quarter.',
    continent: 'americas', centerLat: 30, centerLon: -90.1, timeZone: 'America/Chicago',
    sourceIds: ['new-orleans-bourbon'],
  },
  {
    id: 'east-corridor', label: 'Eastern US Corridor', description: 'Rail, bird feeders, zoo cameras and city streets.',
    continent: 'americas', centerLat: 40, centerLon: -75.8, timeZone: 'America/New_York',
    sourceIds: ['nyc-times-square','cornell-feederwatch','smithsonian-pandas','smithsonian-zoo','train-ashland-va'],
  },
  {
    id: 'new-hampshire', label: 'Mount Washington', description: 'Summit weather and mountain railway views.',
    continent: 'americas', centerLat: 44.3, centerLon: -71.3, timeZone: 'America/New_York',
    sourceIds: ['mountain-washington','train-cog-washington'],
  },
  {
    id: 'southeast', label: 'Southeastern US', description: 'Ocean exhibits and the Florida beach.',
    continent: 'americas', centerLat: 31.6, centerLon: -83.6, timeZone: 'America/New_York',
    sourceIds: ['georgia-aquarium-cams','beach-clearwater'],
  },
  {
    id: 'london', label: 'London', description: 'A world-famous zebra crossing at Abbey Road.',
    continent: 'europe', centerLat: 51.5, centerLon: -0.2, timeZone: 'Europe/London',
    sourceIds: ['london-abbey-road'],
  },
  {
    id: 'italy', label: 'Italy', description: 'Historic Roman landmarks and Venetian canals.',
    continent: 'europe', centerLat: 43.7, centerLon: 12.5, timeZone: 'Europe/Rome',
    sourceIds: ['rome-trevi-fountain','venice-grand-canal'],
  },
  {
    id: 'tokyo', label: 'Tokyo', description: 'The streets and crossings of Shibuya.',
    continent: 'asia-pacific', centerLat: 35.7, centerLon: 139.7, timeZone: 'Asia/Tokyo',
    sourceIds: ['tokyo-shibuya'],
  },
]
export const ATLAS_TABS: readonly { id: AtlasContinent | 'all'; label: string }[] = [
  { id:'all',label:'All regions' },{ id:'americas',label:'Americas' },
  { id:'europe',label:'Europe' },{ id:'asia-pacific',label:'Asia-Pacific' },
]
/** Equirectangular, schematic plot; vertical extent -65..80° to give inhabited latitudes more room. */
export function atlasCoordinates(lat: number, lon: number): { left: number; top: number } {
  const safeLon = Number.isFinite(lon) ? Math.max(-180,Math.min(180,lon)) : 0
  const safeLat = Number.isFinite(lat) ? Math.max(-65,Math.min(80,lat)) : 0
  return { left: (safeLon+180)/360*100, top: (80-safeLat)/145*100 }
}
export function sourcesForRegion(region: AtlasRegion, sources: readonly OpenStream[] = ALL_OPEN_STREAMS): OpenStream[] {
  const map = new Map(sources.map((source)=>[source.id,source]))
  return region.sourceIds.map((id)=>map.get(id)).filter((source):source is OpenStream=>!!source)
}
export function atlasRegionsMatching(
  regions: readonly AtlasRegion[],
  continent: AtlasContinent | 'all',
  category: StreamCategory | 'all',
  query: string,
  sources: readonly OpenStream[] = ALL_OPEN_STREAMS,
): AtlasRegion[] {
  const q=query.trim().toLocaleLowerCase().slice(0,100)
  return regions.filter((region)=>{
    if(continent !== 'all' && region.continent !== continent) return false
    const listed=sourcesForRegion(region,sources)
    if(category !== 'all' && !listed.some((s)=>s.category===category)) return false
    if(!q)return true
    return [region.label,region.description,...listed.flatMap((s)=>[s.name,s.place??'',s.description])]
      .join(' ').toLocaleLowerCase().includes(q)
  })
}
export function formatAtlasClock(region: AtlasRegion, at: Date): string {
  try {
    return new Intl.DateTimeFormat('en-US',{timeZone:region.timeZone,hour:'numeric',minute:'2-digit',
      hour12:true,weekday:'short',timeZoneName:'short'}).format(at)
  } catch { return 'Local time unavailable' }
}
export function atlasDaypart(region: AtlasRegion, at: Date): 'DAY' | 'NIGHT' | 'UNKNOWN' {
  try {
    const hour = Number(new Intl.DateTimeFormat('en-US',{timeZone:region.timeZone,hour:'numeric',hourCycle:'h23'}).format(at))
    return Number.isFinite(hour)?hour>=6&&hour<18?'DAY':'NIGHT':'UNKNOWN'
  } catch {return 'UNKNOWN'}
}
export const ATLAS_MAPPED_COUNT = new Set(ATLAS_REGIONS.flatMap((region)=>region.sourceIds)).size
