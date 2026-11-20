import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import MikeyFlixPortal,{THEATER_PAGES_CANDIDATE,THEATER_SOURCE} from './MikeyFlixPortal'
import ReelNetwork from './ReelNetwork'
import {CHANNEL_LINEUP} from './channelSurf'

describe('REEL private media doorway',()=>{
  it('links only to the public REEL Theater project and a labeled deployment candidate',()=>{
    expect(THEATER_SOURCE).toBe('https://github.com/MichaelWave369/ReelTheater')
    expect(THEATER_PAGES_CANDIDATE).toBe('https://michaelwave369.github.io/ReelTheater/#library')
    const html=renderToStaticMarkup(<MikeyFlixPortal/>)
    expect(html).toContain('MIKEY')
    expect(html).toContain('FLIX')
    expect(html).toContain('PERSONAL MEDIA')
    expect(html).toContain('deployment not verified')
    expect(html).toContain(THEATER_SOURCE)
    expect(html).toContain(THEATER_PAGES_CANDIDATE.replaceAll('&','&amp;'))
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })
  it('never embeds a private Jellyfin address, server port, tokens, media or unapproved video playback',()=>{
    const html=renderToStaticMarkup(<MikeyFlixPortal/>)
    for(const forbidden of ['192.168.','10.0.','localhost',':8096','api_key','access_token','Bearer ','<iframe','<video','<audio','<img','autoplay=','src="http://']){
      expect(html).not.toContain(forbidden)
    }
    expect(html).not.toContain('data-jellyfin-token')
    expect(html).toContain('no')
  })
  it('appears on the real REEL Network page without modifying RCTV channels or production counts',()=>{
    const html=renderToStaticMarkup(<ReelNetwork/>)
    expect(html).toContain('id="reel-mikeyflix"')
    expect(html).toContain('PERSONAL MEDIA')
    expect(html).toContain('PRODUCTION / NOT ON AIR')
    expect(html).toContain('PUBLIC REEL EPISODES VERIFIED HERE')
    expect(CHANNEL_LINEUP).toHaveLength(50)
    expect(CHANNEL_LINEUP.some(channel=>channel.source.id.toLowerCase().includes('jellyfin'))).toBe(false)
  })
})
