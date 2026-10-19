import { useEffect, useMemo, useState } from 'react'
import type { OpenStream, StreamCategory } from './openStreams'
import { STREAM_CATEGORIES } from './openStreams'
import {
  ATLAS_MAPPED_COUNT, ATLAS_REGIONS, ATLAS_TABS, atlasCoordinates,
  atlasDaypart, atlasRegionsMatching, formatAtlasClock, sourcesForRegion,
} from './worldAtlas'
import type { AtlasContinent, AtlasRegion } from './worldAtlas'
import './world-atlas.css'

// Original intentionally rough land silhouettes, drawn for a *schematic* grid.
// This is not a navigation map, map tile or provider's imagery.
const LAND_SHAPES: readonly (readonly [number, number][])[] = [
  [[-168,69],[-147,71],[-128,64],[-124,50],[-117,33],[-112,30],[-98,15],[-84,8],[-79,25],[-70,42],[-60,52],[-60,60],[-85,72],[-119,72]],
  [[-81,11],[-72,11],[-62,8],[-51,3],[-42,-4],[-35,-12],[-39,-24],[-52,-35],[-66,-55],[-74,-43],[-72,-26],[-80,-9]],
  [[-52,59],[-47,75],[-28,81],[-20,75],[-40,58]],
  [[-11,35],[-11,43],[-6,58],[5,70],[28,72],[34,63],[36,49],[24,37],[7,35]],
  [[-18,36],[-2,36],[18,33],[35,30],[47,11],[45,-12],[32,-35],[20,-35],[11,-25],[0,-7],[-13,5]],
  [[30,35],[39,49],[60,63],[100,77],[138,72],[174,62],[172,50],[146,36],[126,22],[121,7],[105,-2],[93,5],[78,11],[65,25],[46,26]],
  [[113,-11],[128,-10],[142,-14],[154,-25],[148,-39],[132,-43],[115,-33]],
  [[47,-14],[50,-22],[44,-26],[43,-13]],
  [[-8,58],[-3,55],[-1,51],[-5,50]],
  [[130,33],[141,45],[146,43],[140,34]],
]
function pointSvg(lat: number, lon: number) {
  const p = atlasCoordinates(lat,lon)
  return (p.left*10).toFixed(1)+','+(p.top*5.5).toFixed(1)
}
// Small intentional schematic nudges make nearby clusters accessible.
// Positions remain approximate regional indicators, never camera coordinates.
const NUDGE: Record<string,{x:number;y:number}> = {
  'cal-coast':{x:-1.8,y:3.5},'cal-sierra':{x:2.8,y:-2.5},
  'nevada':{x:-2.4,y:3},'arizona':{x:3,y:-2},'northern-rockies':{x:-1.5,y:-2},
  'east-corridor':{x:-2.5,y:3},'new-hampshire':{x:3,y:-2},
  'southeast':{x:1.8,y:3},'whistler':{x:0,y:-2},
  'colorado':{x:1.5,y:0},'great-lakes':{x:1.5,y:-1},
}
const visualPoint = (region: AtlasRegion)=>{
  const base = atlasCoordinates(region.centerLat,region.centerLon)
  const offset=NUDGE[region.id]??{x:0,y:0}
  return {left:Math.max(3,Math.min(97,base.left+offset.x)),top:Math.max(4,Math.min(94,base.top+offset.y))}
}
export default function WorldAtlas({ onPreview }: { onPreview: (source: OpenStream) => void }) {
  const [expanded,setExpanded] = useState(false)
  const [continent,setContinent] = useState<AtlasContinent | 'all'>('all')
  const [category,setCategory] = useState<StreamCategory | 'all'>('all')
  const [search,setSearch] = useState('')
  const [regionId,setRegionId] = useState('new-orleans')
  const [clock,setClock] = useState(()=>new Date())
  useEffect(()=>{
    if(!expanded)return
    const timer=window.setInterval(()=>setClock(new Date()),60_000)
    return ()=>window.clearInterval(timer)
  },[expanded])
  const filtered=useMemo(
    ()=>atlasRegionsMatching(ATLAS_REGIONS,continent,category,search),
    [continent,category,search],
  )
  const region=filtered.find((item)=>item.id===regionId)??filtered[0]??null
  const cameras=region?sourcesForRegion(region).filter((source)=>category==='all'||source.category===category):[]
  function selectRegion(id: string) {
    setRegionId(id)
    setClock(new Date())
  }
  function surprise() {
    if(!filtered.length)return
    const alternatives=filtered.filter((item)=>item.id!==region?.id)
    const choices=alternatives.length?alternatives:filtered
    const index=Math.floor(Math.random()*choices.length)
    selectRegion(choices[index].id)
  }
  return <section className="atlas-shell" aria-labelledby="atlas-heading">
    <div className="atlas-hero">
      <div><span className="atlas-kicker">RCTV v1.7 · THE COMMONS SIGNAL ATLAS</span>
        <h2 id="atlas-heading">Choose a place.<br/><em>See another world.</em></h2>
        <p>Explore our official viewing destinations by region, then hop directly to the existing RCTV channel desk. An original schematic map, local-time clocks, and absolutely no tracking or map subscription.</p>
        <div className="atlas-hero-stats"><span><strong>{ATLAS_REGIONS.length}</strong> regional clusters</span><span><strong>{ATLAS_MAPPED_COUNT}</strong> mapped sources</span><span><strong>0</strong> map API calls</span></div>
      </div>
      <button type="button" className="atlas-expand" aria-expanded={expanded} aria-controls="rctv-atlas-explorer" onClick={()=>setExpanded((old)=>!old)}>
        {expanded?'− Close Atlas':'◎ Open World Atlas'}
      </button>
    </div>
    {expanded && <div className="atlas-content" id="rctv-atlas-explorer">
      <div className="atlas-tools">
        <div className="atlas-regions-filter" role="group" aria-label="Filter atlas by continent">
          {ATLAS_TABS.map((tab)=><button key={tab.id} type="button" aria-pressed={continent===tab.id} className={continent===tab.id?'active':''} onClick={()=>setContinent(tab.id)}>{tab.label}</button>)}
        </div>
        <label className="atlas-category-label">VIEW TYPE
          <select aria-label="Filter atlas by camera category" value={category} onChange={(e)=>setCategory(e.target.value as StreamCategory | 'all')}>
            {STREAM_CATEGORIES.map((tab)=><option value={tab.id} key={tab.id}>{tab.label}</option>)}
          </select>
        </label>
        <label className="atlas-search-label">SEARCH LOCATIONS
          <input type="search" maxLength={100} placeholder="Bourbon, Venice, birds, volcano…" value={search} onChange={(e)=>setSearch(e.target.value)}/>
        </label>
        <button type="button" className="atlas-surprise" disabled={!filtered.length} onClick={surprise}>✳ Surprise region</button>
      </div>
      <div className="atlas-main">
        <div className="atlas-map-pane">
          <div className="atlas-map-top"><strong>WORLD VIEW / REGIONAL CLUSTERS</strong><span>NOT GPS · SCHEMATIC</span></div>
          <div className="atlas-map" role="group" aria-label="World map with approximate regional destination clusters">
            <svg className="atlas-land" viewBox="0 0 1000 550" preserveAspectRatio="none" aria-hidden="true">
              <defs><linearGradient id="atlas-land-fill" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stopColor="#3b746e"/><stop offset="1" stopColor="#3c576d"/></linearGradient></defs>
              {[-120,-60,0,60,120].map((lon)=><line key={lon} x1={atlasCoordinates(0,lon).left*10} x2={atlasCoordinates(0,lon).left*10} y1="0" y2="550" stroke="#b7d6c4" strokeOpacity=".12" strokeDasharray="3 6"/>)}
              {[-30,0,30,60].map((lat)=><line key={lat} y1={atlasCoordinates(lat,0).top*5.5} y2={atlasCoordinates(lat,0).top*5.5} x1="0" x2="1000" stroke="#b7d6c4" strokeOpacity=".12" strokeDasharray="3 6"/>)}
              {LAND_SHAPES.map((coordinates,i)=><polygon key={i} points={coordinates.map(([lon,lat])=>pointSvg(lat,lon)).join(' ')} fill="url(#atlas-land-fill)" fillOpacity=".7" stroke="#a8ceba" strokeOpacity=".32" strokeWidth="1.5" strokeLinejoin="round"/>)}
            </svg>
            {filtered.map((item)=>{
              const p=visualPoint(item)
              const selected=item.id===region?.id
              return <button key={item.id} type="button" style={{left:p.left+'%',top:p.top+'%'}} className={'atlas-map-pin '+(selected?'active':'')}
                aria-label={item.label+': '+item.sourceIds.length+' official destinations'}
                aria-pressed={selected} title={item.label+' · approximate region'} onClick={()=>selectRegion(item.id)}>
                <span>{item.sourceIds.length}</span>
              </button>
            })}
            <div className="atlas-map-legend">◉ Number = destinations in region</div>
          </div>
          <p className="atlas-map-note">Map outlines are original, schematic illustrations. Pins represent broad regions, intentionally nudged for legibility, <strong>not exact camera coordinates</strong>. Public directories and mobile viewpoints such as the ISS are not pinned.</p>
          <div className="atlas-region-list">
            {filtered.map((item)=><button type="button" key={item.id} className={item.id===region?.id?'active':''} aria-pressed={item.id===region?.id} onClick={()=>selectRegion(item.id)}>
              <strong>{item.label}</strong><small>{item.sourceIds.length} sources</small>
            </button>)}
            {!filtered.length&&<div className="atlas-empty">No mapped regions match. Try clearing your filters; unpinned sources remain available in the channel directory.</div>}
          </div>
        </div>
        <aside className="atlas-details" aria-label="Selected atlas region">
          {region?<><span className="atlas-kicker">THE VIEW FROM HERE</span>
            <h3>{region.label}</h3><p>{region.description}</p>
            <div className="atlas-clock-card">
              <div><small>REGIONAL LOCAL TIME</small><strong>{formatAtlasClock(region,clock)}</strong></div>
              <span className="atlas-daypart">{atlasDaypart(region,clock)==='DAY'?'☼ Daytime':atlasDaypart(region,clock)==='NIGHT'?'☾ Nighttime':'Local time unknown'}</span>
            </div>
            <p className="atlas-time-note">Time is computed locally from a representative regional time zone; it does not indicate daylight at every camera, live status, or opening hours.</p>
            <div className="atlas-stations-heading">{cameras.length} OFFICIAL DESTINATIONS</div>
            <div className="atlas-source-list">
              {cameras.map((source)=><article key={source.id} className="atlas-source">
                <div className="atlas-source-identity"><span aria-hidden="true">{source.icon}</span><div><strong>{source.name}</strong><small>{source.category.toUpperCase()} · {source.place??region.label}</small></div></div>
                <p>{source.tagline}</p>
                <div className="atlas-source-actions">
                  <button type="button" onClick={()=>onPreview(source)}>Preview in channel desk ↗</button>
                  <a href={source.officialUrl} target="_blank" rel="noopener noreferrer">Official site <span aria-hidden="true">↗</span></a>
                </div>
              </article>)}
            </div>
            <div className="atlas-rights">Only existing curated provider links are shown here. Selecting a channel does not start playback or grant streaming rights. Availability is determined by each broadcaster.</div>
          </>:<div className="atlas-empty">No selected region. Choose another continent or clear your filters.</div>}
        </aside>
      </div>
    </div>}
  </section>
}
