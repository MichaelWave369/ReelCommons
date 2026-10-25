import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import MiniTvRemote, { resolveMiniRemoteChannel } from './MiniTvRemote'
import CouchMode from './CouchMode'
import { CHANNEL_LINEUP } from './channelSurf'
import { GAMEPAD_REPEAT_MS, readTvGamepadAction } from './tvGamepad'

const source=(id:string)=>{
  const value=CHANNEL_LINEUP.find((slot)=>slot.source.id===id)?.source
  if(!value) throw new Error('Missing source '+id)
  return value
}
const empty=()=>Array.from({length:16},()=>false)
const input=(button:number)=> {
  const list=empty()
  list[button]=true
  return list
}
describe('RCTV v3.1 · persistent mini remote and gamepad navigation',()=>{
  it('resolves only frozen numeric channels, never URLs or external media',()=>{
    expect(resolveMiniRemoteChannel('013')?.id).toBe('nasa-iss')
    expect(resolveMiniRemoteChannel('5')?.id).toBe('kexp')
    expect(resolveMiniRemoteChannel('050')?.id).toBe('mountain-jackson-hole')
    expect(resolveMiniRemoteChannel('0')).toBeNull()
    expect(resolveMiniRemoteChannel('051')).toBeNull()
    expect(resolveMiniRemoteChannel('https://evil.invalid/stream.m3u8')).toBeNull()
    expect(resolveMiniRemoteChannel('13 OR 1=1')).toBeNull()
  })
  it('initial dock is compact and requires click before showing tuner',()=>{
    const html=renderToStaticMarkup(<MiniTvRemote selected={source('nasa-iss')}
      onSelect={()=>{}} onOpenMain={()=>{}} onOpenCouch={()=>{}}
      onOpenReviewed={()=>{}} />)
    expect(html).toContain('RCTV persistent mini remote')
    expect(html).toContain('CH 013')
    expect(html).toContain('Mini Remote')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('<audio')
    expect(html).not.toContain('kexp160.aac')
    expect(html).not.toContain('autoplay=')
  })
  it('maps supported controllers to guide, channel direction and exit only',()=>{
    expect(readTvGamepadAction(empty(),[])).toBeNull()
    expect(readTvGamepadAction(input(15),[0,0])).toBe('next')
    expect(readTvGamepadAction(input(12),[0,0])).toBe('next')
    expect(readTvGamepadAction(input(14),[0,0])).toBe('previous')
    expect(readTvGamepadAction(input(13),[0,0])).toBe('previous')
    expect(readTvGamepadAction(input(0),[0,0])).toBe('guide')
    expect(readTvGamepadAction(input(2),[0,0])).toBe('guide')
    expect(readTvGamepadAction(input(1),[0,0])).toBe('close')
    expect(readTvGamepadAction(empty(),[0.8,0])).toBe('next')
    expect(readTvGamepadAction(empty(),[0,-0.81])).toBe('previous')
    expect(readTvGamepadAction(empty(),[0.5,0.3])).toBeNull()
    expect(GAMEPAD_REPEAT_MS).toBeGreaterThanOrEqual(300)
  })
  it('Couch Mode advertises optional polling but begins with no media and gamepad off',()=>{
    const html=renderToStaticMarkup(<CouchMode selected={source('kexp')}
      favoriteIds={[]} onSelect={()=>{}} onClose={()=>{}}/>)
    expect(html).toContain('Enable gamepad control')
    expect(html).toContain('aria-pressed="false"')
    expect(html).toContain('COUCH MODE SIGNAL')
    expect(html).not.toContain('<audio')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('autoplay=')
  })
})
