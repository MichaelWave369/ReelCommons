/**
 * RCTV v1.9 · Channel Surf Remote
 *
 * Stable, explicitly numbered virtual channel slots for curated OFFICIAL
 * destinations. Numbers are directory positions, NOT broadcast frequencies,
 * schedules, tuning permissions, or proof that a stream is live.
 */
import { ALL_OPEN_STREAMS } from './cameraCatalog'
import type { OpenStream, StreamCategory } from './openStreams'

export const CHANNEL_SURF_STORAGE_KEY = 'rctv-channel-surf-last-v1'
export const CHANNEL_SURF_STATE_VERSION = 1
// Frozen v1.9 channel-number mapping. New sources must append to preserve
// existing people's saved channel numbers when the directory expands.
export const CHANNEL_IDS: readonly string[] = [
  'cbs-news','abc-news','house-live','pbs-online','kexp','somafm','radio-garden',
  'radio-browser','radio-paradise','monterey-cams','explore-wildlife','nasa-live',
  'nasa-iss','esa-webtv',
  'nyc-times-square','london-abbey-road','new-orleans-bourbon','vegas-skyline',
  'tokyo-shibuya','venice-grand-canal','rome-trevi-fountain','yellowstone-geysers',
  'yosemite-valley','grand-canyon-south-rim','glacier-montana','rocky-mountain-park',
  'usgs-kilauea','usgs-mauna-loa','smithsonian-pandas','smithsonian-zoo',
  'cornell-bird-cams','cornell-feederwatch','aquarium-pacific',
  'georgia-aquarium-cams',
  'beach-santa-monica','beach-huntington-pier','beach-clearwater',
  'beach-park-point','harbor-los-angeles','harbor-duluth','harbor-san-luis',
  'harbor-duluth-lighthouse','train-railstream-free','train-virtualrailfan-free',
  'train-ashland-va','train-cog-washington','mountain-washington',
  'mountain-whistler','mountain-mammoth','mountain-jackson-hole',
]
export interface ChannelSlot { number: number; source: OpenStream }
export const CHANNEL_LINEUP: readonly ChannelSlot[] = CHANNEL_IDS.flatMap((id,index)=>{
  const source = ALL_OPEN_STREAMS.find((item)=>item.id===id)
  return source?[{number:index+1,source}]:[]
})
export interface ChannelSurfState { version: 1; lastId: string | null }
export function normalizeChannelInput(raw: string): string {
  return raw.replace(/\D/g,'').slice(0,3)
}
export function channelNumberLabel(number: number): string {
  return String(number).padStart(3,'0')
}
export function resolveChannelNumber(raw: string, lineup: readonly ChannelSlot[] = CHANNEL_LINEUP): ChannelSlot | null {
  if(!/^\d{1,3}$/.test(raw))return null
  const number=Number(raw)
  if(number<1)return null
  return lineup.find((entry)=>entry.number===number)??null
}
export function channelNumberForSource(sourceId: string, lineup: readonly ChannelSlot[] = CHANNEL_LINEUP): number | null {
  return lineup.find((item)=>item.source.id===sourceId)?.number??null
}
export function filterChannelLineup(
  lineup: readonly ChannelSlot[],
  category: StreamCategory | 'all',
  favoritesOnly: boolean,
  favoriteIds: readonly string[],
): ChannelSlot[] {
  const favorites = new Set(favoriteIds)
  return lineup.filter(({source})=>(category==='all'||source.category===category) &&
    (!favoritesOnly||favorites.has(source.id)))
}
export function surfNextChannel(
  lineup: readonly ChannelSlot[],
  currentId: string,
  direction: 1 | -1,
): ChannelSlot | null {
  if(!lineup.length)return null
  const index = lineup.findIndex((item)=>item.source.id===currentId)
  if(index<0)return direction===1?lineup[0]:lineup[lineup.length-1]
  return lineup[(index+direction+lineup.length)%lineup.length]
}
export function readChannelSurfState(raw: string | null, lineup: readonly ChannelSlot[] = CHANNEL_LINEUP): ChannelSurfState {
  if(!raw||raw.length>500)return {version:1,lastId:null}
  try{
    const value: unknown=JSON.parse(raw) as unknown
    if(!value||typeof value!=='object'||Array.isArray(value))return {version:1,lastId:null}
    const data=value as Record<string,unknown>
    if(data.version!==CHANNEL_SURF_STATE_VERSION||typeof data.lastId!=='string')return {version:1,lastId:null}
    if(!lineup.some((slot)=>slot.source.id===data.lastId))return {version:1,lastId:null}
    return {version:1,lastId:data.lastId}
  }catch{return {version:1,lastId:null}}
}
export function serializeChannelSurfState(sourceId: string): string | null {
  if(channelNumberForSource(sourceId)===null)return null
  return JSON.stringify({version:1,lastId:sourceId})
}
