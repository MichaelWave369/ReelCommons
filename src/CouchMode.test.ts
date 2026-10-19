import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import CouchMode from './CouchMode'
import { ALL_OPEN_STREAMS } from './cameraCatalog'
import { CHANNEL_LINEUP } from './channelSurf'
import { playableUrl } from './openStreams'

const source=(id:string)=>{
  const found=ALL_OPEN_STREAMS.find((item)=>item.id===id)
  if(!found)throw new Error('Fixture not in curated catalog: '+id)
  return found
}
const render=(id:string)=>renderToStaticMarkup(createElement(CouchMode,{
  selected:source(id),favoriteIds:[],onSelect:()=>{},onClose:()=>{},
}))
describe('RCTV v2.0 Couch Mode non-autoplay / source permissions',()=>{
  it('renders a labeled modal with large remote and official-player action',()=>{
    const html=render('new-orleans-bourbon')
    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-modal="true"')
    expect(html).toContain('Couch Mode')
    expect(html).toContain('CH 017')
    expect(html).toContain('Bourbon Street')
    expect(html).toContain('CH +')
    expect(html).toContain('CH −')
    expect(html).toContain('Open official player')
    expect(html).toContain('rel="noopener noreferrer"')
  })
  it('renders no iframe, audio or autoplay attributes before any intentional user action',()=>{
    for(const id of ['nasa-iss','kexp','somafm','new-orleans-bourbon','beach-santa-monica','train-ashland-va']){
      const html=render(id)
      expect(html).not.toContain('<iframe')
      expect(html).not.toContain('<audio')
      expect(html).not.toMatch(/\sautoPlay(=|\s|>)/i)
    }
  })
  it('official-site only sources have no inline player load action',()=>{
    for(const id of ['somafm','new-orleans-bourbon','train-virtualrailfan-free','beach-huntington-pier']){
      const html=render(id)
      expect(playableUrl(source(id))).toBeNull()
      expect(html).not.toContain('Load official YouTube player')
      expect(html).not.toContain('Load KEXP broadcaster audio')
      expect(html).toContain(source(id).officialUrl.replaceAll('&','&amp;'))
    }
  })
  it('allows only the already reviewed opt-in provider paths',()=>{
    expect(render('nasa-iss')).toContain('Load official YouTube player')
    expect(render('kexp')).toContain('Load KEXP broadcaster audio')
    expect(render('somafm')).not.toContain('Load KEXP broadcaster audio')
    expect(CHANNEL_LINEUP.length).toBe(50)
  })
  it('uses existing stable channel numbers, no new channel catalog in couch mode',()=>{
    expect(render('cbs-news')).toContain('CH 001')
    expect(render('nasa-iss')).toContain('CH 013')
    expect(render('mountain-jackson-hole')).toContain('CH 050')
  })
})
