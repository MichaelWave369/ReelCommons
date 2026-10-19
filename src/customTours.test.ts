import {describe,expect,it} from 'vitest'
import {
  appendCustomTour,CUSTOM_TOUR_FORMAT,CUSTOM_TOURS_STORAGE_KEY,customTourToWorldTour,
  EMPTY_CUSTOM_TOUR_STORE,exportSharedCustomTour,makeCustomTour,MAX_CUSTOM_TOURS,
  moveCustomStop,parseCustomTourStore,parseSharedCustomTour,validCatalogStopIds,
} from './customTours'
import {WORLD_TOURS} from './worldTour'
import {ALL_OPEN_STREAMS} from './cameraCatalog'
import {playableUrl} from './openStreams'

const ids=['new-orleans-bourbon','nyc-times-square','beach-santa-monica']
const id='custom-abcdef12-3456'
describe('RCTV v1.8 browser-local custom tours',()=>{
  it('constructs only 3–10 unique curated source IDs and a bounded safe title',()=>{
    expect(makeCustomTour(id,'My Bourbon Trail',ids)).toEqual({id,title:'My Bourbon Trail',sourceIds:ids})
    expect(makeCustomTour(id,'a',ids)).toBeNull()
    expect(makeCustomTour(id,'<script>alert(1)</script>',ids)).toBeNull()
    expect(makeCustomTour(id,'X'.repeat(65),ids)).toBeNull()
    expect(validCatalogStopIds([...ids,ids[0]])).toBeNull()
    expect(validCatalogStopIds(['new-orleans-bourbon','fake-hls-link','nyc-times-square'])).toBeNull()
  })
  it('clamps manual ordering without introducing unfamiliar IDs',()=>{
    expect(moveCustomStop(ids,0,-1)).toEqual(ids)
    expect(moveCustomStop(ids,0,1)).toEqual([ids[1],ids[0],ids[2]])
    expect(moveCustomStop(ids,2,1)).toEqual(ids)
    expect(moveCustomStop(ids,1,-1)).toEqual([ids[1],ids[0],ids[2]])
  })
  it('converts to existing World Tour model with original official source destinations',()=>{
    const record=makeCustomTour(id,'Test Route',ids)!
    const tour=customTourToWorldTour(record)
    expect(tour.stops.map((s)=>s.sourceId)).toEqual(ids)
    expect(tour.stops.every((stop)=>stop.story.includes('original provider'))).toBe(true)
    for(const sourceId of record.sourceIds){
      const original=ALL_OPEN_STREAMS.find((s)=>s.id===sourceId)!
      expect(original.officialUrl.startsWith('https://')).toBe(true)
      expect(playableUrl(original)).toBeNull()
    }
  })
  it('exports only name and catalog IDs, no remote URLs, device or viewing history',()=>{
    const record=makeCustomTour(id,'Test Route',ids)!
    const serialized=exportSharedCustomTour(record)
    const parsed=JSON.parse(serialized) as {format:string;tour:{title:string;sourceIds:string[]}}
    expect(parsed.format).toBe(CUSTOM_TOUR_FORMAT)
    expect(parsed.tour).toEqual({title:'Test Route',sourceIds:ids})
    expect(serialized).not.toContain('http')
    expect(serialized).not.toContain('stampedOn')
    expect(parseSharedCustomTour(serialized)).toEqual(parsed.tour)
  })
  it('rejects invented media URLs, arbitrary HTML fields, remote unknown channels',()=>{
    const original=JSON.parse(exportSharedCustomTour(makeCustomTour(id,'Test Route',ids)!)) as Record<string,unknown>
    expect(()=>parseSharedCustomTour(JSON.stringify({...original,hls:'https://attacker.example/manifest.m3u8'}))).toThrow(/Unsupported/)
    expect(()=>parseSharedCustomTour(JSON.stringify({format:CUSTOM_TOUR_FORMAT,tour:{title:'Test Route',sourceIds:ids,streamUrl:'https://attacker.example'}}))).toThrow(/unsupported/)
    expect(()=>parseSharedCustomTour(JSON.stringify({format:CUSTOM_TOUR_FORMAT,tour:{title:'Test Route',sourceIds:['fake','more','fake3']}}))).toThrow(/unique/)
    expect(()=>parseSharedCustomTour('{')).toThrow(/valid JSON/)
    expect(()=>parseSharedCustomTour('X'.repeat(24001))).toThrow(/24 KB/)
  })
  it('parses old local storage without trusting foreign URL fields and caps at twelve',()=>{
    const rec=makeCustomTour(id,'A good tour',ids)!
    expect(parseCustomTourStore(JSON.stringify({version:1,tours:[rec]})).tours).toEqual([rec])
    expect(parseCustomTourStore('{')).toEqual(EMPTY_CUSTOM_TOUR_STORE)
    expect(parseCustomTourStore(JSON.stringify({version:2,tours:[rec]}))).toEqual(EMPTY_CUSTOM_TOUR_STORE)
    const forged={...rec,remote:'https://bad.example'}
    expect(parseCustomTourStore(JSON.stringify({version:1,tours:[forged]})).tours).toHaveLength(0)
    const many=Array.from({length:19},(_,i)=>({...rec,id:'custom-abcdef12-'+(1000+i)}))
    expect(parseCustomTourStore(JSON.stringify({version:1,tours:many})).tours).toHaveLength(MAX_CUSTOM_TOURS)
  })
  it('enforces record capacity and unique custom IDs',()=>{
    let store=EMPTY_CUSTOM_TOUR_STORE
    const rec=makeCustomTour(id,'A good tour',ids)!
    store=appendCustomTour(store,rec)!
    expect(appendCustomTour(store,rec)).toBeNull()
    expect(CUSTOM_TOURS_STORAGE_KEY).toContain('world-tours')
  })
  it('does not alter the ten official guided routes or their passport authority',()=>{
    expect(WORLD_TOURS).toHaveLength(10)
    expect(WORLD_TOURS.some((tour)=>tour.id.startsWith('custom-'))).toBe(false)
    expect(customTourToWorldTour(makeCustomTour(id,'My first route',ids)!).description).toContain('no playback')
  })
})
