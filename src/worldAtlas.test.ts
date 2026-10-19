import { describe, expect, it } from 'vitest'
import { ALL_OPEN_STREAMS } from './cameraCatalog'
import { ATLAS_MAPPED_COUNT, ATLAS_REGIONS, atlasCoordinates, atlasDaypart, atlasRegionsMatching, formatAtlasClock, sourcesForRegion } from './worldAtlas'

describe('RCTV v1.7 World Atlas static official-source mapping', () => {
  it('includes 16 regional clusters with source ids from original catalog only', () => {
    expect(ATLAS_REGIONS).toHaveLength(16)
    const all=new Set(ALL_OPEN_STREAMS.map((s)=>s.id))
    const ids=ATLAS_REGIONS.flatMap((r)=>r.sourceIds)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ATLAS_MAPPED_COUNT).toBe(ids.length)
    expect(ATLAS_MAPPED_COUNT).toBeGreaterThan(30)
    for (const region of ATLAS_REGIONS) {
      expect(region.sourceIds.length).toBeGreaterThan(0)
      expect(region.sourceIds.every((id)=>all.has(id))).toBe(true)
    }
  })
  it('does not pretend distributed directory sources or ISS are located at a physical camera pin',()=>{
    const mapped=new Set(ATLAS_REGIONS.flatMap((x)=>x.sourceIds))
    for(const id of ['nasa-iss','radio-garden','train-railstream-free','train-virtualrailfan-free','cbs-news']){
      expect(mapped.has(id)).toBe(false)
    }
    expect(mapped.has('new-orleans-bourbon')).toBe(true)
  })
  it('uses finite clamped schematic coordinates, not device geolocation',()=>{
    for(const r of ATLAS_REGIONS){
      const p=atlasCoordinates(r.centerLat,r.centerLon)
      expect(p.left).toBeGreaterThanOrEqual(0);expect(p.left).toBeLessThanOrEqual(100)
      expect(p.top).toBeGreaterThanOrEqual(0);expect(p.top).toBeLessThanOrEqual(100)
    }
    expect(atlasCoordinates(90,200)).toEqual({left:100,top:0})
    expect(atlasCoordinates(-90,-200)).toEqual({left:0,top:100})
    expect(atlasCoordinates(Number.NaN,Number.POSITIVE_INFINITY).left).toBe(50)
  })
  it('geography tabs, existing categories and query filter known sources only',()=>{
    expect(atlasRegionsMatching(ATLAS_REGIONS,'europe','all','')).toHaveLength(2)
    expect(atlasRegionsMatching(ATLAS_REGIONS,'asia-pacific','all','')).toHaveLength(1)
    expect(atlasRegionsMatching(ATLAS_REGIONS,'all','harbor','')).toHaveLength(2)
    expect(atlasRegionsMatching(ATLAS_REGIONS,'all','all','Bourbon')).toHaveLength(1)
    expect(atlasRegionsMatching(ATLAS_REGIONS,'americas','city','')).toHaveLength(3)
    expect(atlasRegionsMatching(ATLAS_REGIONS,'all','all','nothing-in-catalog')).toHaveLength(0)
  })
  it('region list only returns our original provider URLs, no streams or API queries',()=>{
    const r=ATLAS_REGIONS.find((x)=>x.id==='cal-coast')!
    const items=sourcesForRegion(r)
    expect(items).toHaveLength(6)
    expect(items.every((s)=>s.officialUrl.startsWith('https://'))).toBe(true)
    expect(items.every((s)=>s.playback==='official')).toBe(true)
  })
  it('timezone formatting is anchored to a passed instant, not camera uptime or location detection',()=>{
    const t=new Date('2026-10-18T12:00:00Z')
    const la=ATLAS_REGIONS.find((x)=>x.id==='cal-coast')!
    const tokyo=ATLAS_REGIONS.find((x)=>x.id==='tokyo')!
    expect(formatAtlasClock(la,t)).toContain('Sun')
    expect(formatAtlasClock(tokyo,t)).toContain('Sun')
    expect(atlasDaypart(la,t)).toBe('NIGHT')
    expect(atlasDaypart(tokyo,t)).toBe('NIGHT')
    expect(atlasDaypart({...la,timeZone:'Not/AZone'},t)).toBe('UNKNOWN')
  })
  it('source comparison matches originals exactly, no added camera permissions',()=>{
    const all=sourcesForRegion(ATLAS_REGIONS.find((x)=>x.id==='great-lakes')!)
    expect(all).toHaveLength(3)
    expect(all.every((s)=>s.playback==='official')).toBe(true)
  })
})
