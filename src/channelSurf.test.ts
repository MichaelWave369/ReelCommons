import {describe,expect,it} from 'vitest'
import { ALL_OPEN_STREAMS } from './cameraCatalog'
import {
  CHANNEL_IDS,CHANNEL_LINEUP,CHANNEL_SURF_STORAGE_KEY,
  channelNumberForSource,channelNumberLabel,filterChannelLineup,
  normalizeChannelInput,readChannelSurfState,resolveChannelNumber,
  serializeChannelSurfState,surfNextChannel,
} from './channelSurf'
import {playableUrl} from './openStreams'
describe('RCTV v1.9 safe channel surfing',()=>{
  it('has 50 stable virtual numbers, one for each official curated source',()=>{
    expect(CHANNEL_IDS.length).toBe(50)
    expect(new Set(CHANNEL_IDS).size).toBe(50)
    expect(CHANNEL_LINEUP.length).toBe(50)
    expect(new Set(CHANNEL_LINEUP.map(x=>x.source.id)).size).toBe(50)
    expect(CHANNEL_LINEUP.map(x=>x.number)).toEqual(Array.from({length:50},(_,i)=>i+1))
    expect(new Set(ALL_OPEN_STREAMS.map(x=>x.id))).toEqual(new Set(CHANNEL_IDS))
    expect(channelNumberLabel(1)).toBe('001')
    expect(channelNumberLabel(50)).toBe('050')
  })
  it('assigns stable broadcast-neutral labels to the favorites from the old catalog',()=>{
    expect(channelNumberForSource('cbs-news')).toBe(1)
    expect(channelNumberForSource('nasa-iss')).toBe(13)
    expect(channelNumberForSource('new-orleans-bourbon')).toBe(17)
    expect(channelNumberForSource('mountain-jackson-hole')).toBe(50)
    expect(channelNumberForSource('unapproved-stream')).toBeNull()
  })
  it('validates keypad input instead of treating arbitrary text as a command',()=>{
    expect(normalizeChannelInput('0018x5')).toBe('001')
    expect(resolveChannelNumber('001')?.source.id).toBe('cbs-news')
    expect(resolveChannelNumber('50')?.source.id).toBe('mountain-jackson-hole')
    expect(resolveChannelNumber('000')).toBeNull()
    expect(resolveChannelNumber('051')).toBeNull()
    expect(resolveChannelNumber('0x1')).toBeNull()
    expect(resolveChannelNumber('')).toBeNull()
  })
  it('cycles the selected lineup without loading media or crossing filtered boundaries',()=>{
    expect(surfNextChannel(CHANNEL_LINEUP,'mountain-jackson-hole',1)?.source.id).toBe('cbs-news')
    expect(surfNextChannel(CHANNEL_LINEUP,'cbs-news',-1)?.source.id).toBe('mountain-jackson-hole')
    expect(surfNextChannel(CHANNEL_LINEUP,'missing',-1)?.number).toBe(50)
    expect(surfNextChannel([], 'cbs-news',1)).toBeNull()
    const subset=filterChannelLineup(CHANNEL_LINEUP,'city',false,[])
    expect(subset).toHaveLength(7)
    expect(surfNextChannel(subset,'not-in-subset',1)?.source.category).toBe('city')
    expect(surfNextChannel(subset,subset[0].source.id,-1)?.source.id).toBe(subset[subset.length-1].source.id)
  })
  it('favorite-only surfing is strictly sourced from user-saved IDs',()=>{
    const subset=filterChannelLineup(CHANNEL_LINEUP,'all',true,['new-orleans-bourbon','kexp','unknown'])
    expect(subset.map(x=>x.source.id)).toEqual(['kexp','new-orleans-bourbon'])
    expect(filterChannelLineup(CHANNEL_LINEUP,'mountain',true,['kexp'])).toHaveLength(0)
  })
  it('persisted last selection contains only known catalog source IDs',()=>{
    const raw=serializeChannelSurfState('new-orleans-bourbon')!
    expect(readChannelSurfState(raw)).toEqual({version:1,lastId:'new-orleans-bourbon'})
    expect(serializeChannelSurfState('random-external-url')).toBeNull()
    expect(readChannelSurfState(JSON.stringify({version:1,lastId:'bad-remote'})).lastId).toBeNull()
    expect(readChannelSurfState('bad-json').lastId).toBeNull()
    expect(readChannelSurfState(JSON.stringify({version:2,lastId:'kexp'})).lastId).toBeNull()
    expect(CHANNEL_SURF_STORAGE_KEY).toContain('channel-surf')
  })
  it('a remote slot cannot promote an official-only source into an embedded player',()=>{
    for(const slot of CHANNEL_LINEUP){
      if(slot.source.playback==='official')expect(playableUrl(slot.source)).toBeNull()
      expect(slot.source.officialUrl.startsWith('https://')).toBe(true)
    }
    expect(CHANNEL_LINEUP.some(slot=>slot.source.id==='somafm')).toBe(true)
    expect(playableUrl(CHANNEL_LINEUP.find(slot=>slot.source.id==='somafm')!.source)).toBeNull()
  })
})
