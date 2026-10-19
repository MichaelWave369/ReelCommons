import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { STREAM_CATEGORIES } from './openStreams'
import type { OpenStream, StreamCategory } from './openStreams'
import {
  CHANNEL_LINEUP, channelNumberForSource, channelNumberLabel,
  filterChannelLineup, normalizeChannelInput, resolveChannelNumber, surfNextChannel,
} from './channelSurf'
import './channel-surf.css'

export default function ChannelSurfRemote({
  selected, favoriteIds, onSelect,
}: {
  selected: OpenStream
  favoriteIds: readonly string[]
  onSelect: (source: OpenStream) => void
}) {
  const [category, setCategory] = useState<StreamCategory | 'all'>('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [digits, setDigits] = useState('')
  const [guideOpen, setGuideOpen] = useState(false)
  const [guideSearch, setGuideSearch] = useState('')
  const [notice, setNotice] = useState('')
  const [previousId, setPreviousId] = useState<string | null>(null)
  const previousSelectedRef = useRef(selected.id)
  const permitted = filterChannelLineup(CHANNEL_LINEUP, category, favoritesOnly, favoriteIds)
  const number = channelNumberForSource(selected.id)
  const guide = guideSearch.trim() ?
    permitted.filter((slot) => [slot.source.name, slot.source.tagline,slot.source.place??'']
      .join(' ').toLowerCase().includes(guideSearch.trim().toLowerCase())) : permitted
  const favoriteSet = new Set(favoriteIds)

  useEffect(() => {
    if(previousSelectedRef.current !== selected.id) {
      setPreviousId(previousSelectedRef.current)
      previousSelectedRef.current = selected.id
    }
  }, [selected.id])

  function choose(source: OpenStream) {
    setDigits('')
    setNotice('Selected ' + source.name + '. This does not start playback.')
    onSelect(source)
  }
  function changeChannel(direction: 1 | -1) {
    const destination = surfNextChannel(permitted,selected.id,direction)
    if(!destination) {
      setNotice('No channels match this remote filter. Choose another category or turn off Favorites only.')
      return
    }
    choose(destination.source)
  }
  function enterDigit(value: string) {
    setDigits((old) => normalizeChannelInput(old.length >= 3 ? value : old + value))
    setNotice('')
  }
  function tuneNumber() {
    const result = resolveChannelNumber(digits)
    if(!result){
      setNotice('Channel not found. Enter a number from 001 to ' +
        channelNumberLabel(CHANNEL_LINEUP.length) + '.')
      return
    }
    if(!permitted.some((slot)=>slot.number===result.number)){
      setNotice('Channel ' + channelNumberLabel(result.number) +
        ' is outside your selected category/favorites lineup. Clear the filter to select it.')
      return
    }
    choose(result.source)
  }
  function jumpBack(){
    const entry=CHANNEL_LINEUP.find((slot)=>slot.source.id===previousId)
    if(!entry) {setNotice('No previous channel in this remote session.');return}
    if(!permitted.some((slot)=>slot.source.id===entry.source.id)){
      setNotice('Previous channel is outside this remote filter. Choose All channels to return to it.')
      return
    }
    choose(entry.source)
  }
  function onRemoteKey(event: KeyboardEvent<HTMLElement>) {
    if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return
    const target=event.target
    if(!(target instanceof HTMLElement))return
    // Never hijack inputs, text editing, select menus, links or other buttons.
    if(target!==event.currentTarget)return
    if(event.key==='ArrowUp'){event.preventDefault();changeChannel(1)}
    else if(event.key==='ArrowDown'){event.preventDefault();changeChannel(-1)}
    else if(/^\d$/.test(event.key)){event.preventDefault();enterDigit(event.key)}
    else if(event.key==='Enter'){event.preventDefault();tuneNumber()}
    else if(event.key==='Backspace'){event.preventDefault();setDigits((old)=>old.slice(0,-1))}
    else if(event.key==='Escape'){event.preventDefault();setDigits('');setNotice('')}
  }
  return <section className="csr-shell" aria-labelledby="csr-heading" tabIndex={0}
    onKeyDown={onRemoteKey} aria-label="Channel Surf Remote, focus this panel for arrow and numeric shortcuts">
    <div className="csr-header">
      <div><span>RCTV v1.9 · VIRTUAL CHANNEL DESK</span><h2 id="csr-heading">Channel Surf <em>Remote</em></h2></div>
      <span className="csr-chip">50 OFFICIAL DESTINATIONS</span>
    </div>
    <div className="csr-screen">
      <div className="csr-screen-top"><span>DIRECTORY CHANNEL</span><span>NOT RF / NO AUTOPLAY</span></div>
      <div className="csr-screen-main"><strong>CH {number===null?'---':channelNumberLabel(number)}</strong>
        <div><b>{selected.name}</b><small>{selected.category.toUpperCase()} · {selected.playback==='official'?'Official website player':selected.playback==='youtube-embed'?'Optional reviewed embed':'Optional broadcaster audio'}</small></div>
      </div>
      <p>{selected.tagline}</p>
    </div>
    <div className="csr-controls">
      <div className="csr-keypad" role="group" aria-label="Numeric channel keypad">
        {['1','2','3','4','5','6','7','8','9','CLR','0','⌫'].map((digit)=>
          <button key={digit} type="button"
            aria-label={digit==='CLR'?'Clear channel number':digit==='⌫'?'Remove last digit':'Enter digit '+digit}
            onClick={()=>digit==='CLR'?setDigits(''):digit==='⌫'?setDigits((old)=>old.slice(0,-1)):enterDigit(digit)}>
            {digit}
          </button>)}
      </div>
      <div className="csr-transport">
        <div className="csr-number"><span>ENTER CHANNEL</span><strong>{digits.padStart(3,'–')}</strong></div>
        <button type="button" className="csr-tune" onClick={tuneNumber}>✓ Tune channel</button>
        <div className="csr-transport-actions">
          <button type="button" onClick={()=>changeChannel(1)} disabled={!permitted.length}>CH +</button>
          <button type="button" onClick={()=>changeChannel(-1)} disabled={!permitted.length}>CH −</button>
          <button type="button" onClick={jumpBack} disabled={!previousId}>↺ Last</button>
        </div>
      </div>
    </div>
    <div className="csr-options">
      <label>REMOTE LINEUP
        <select value={category} onChange={(event)=>{setCategory(event.target.value as StreamCategory | 'all');setNotice('')}}>
          {STREAM_CATEGORIES.map((item)=><option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label className="csr-favorite-check"><input type="checkbox" checked={favoritesOnly}
        onChange={(event)=>{setFavoritesOnly(event.target.checked);setNotice('')}}/>
        <span>★ Favorites only ({favoriteIds.length})</span>
      </label>
    </div>
    <div className="csr-actions">
      <button type="button" className="csr-guide-toggle" aria-controls="csr-channel-guide"
        aria-expanded={guideOpen} onClick={()=>setGuideOpen((v)=>!v)}>
        {guideOpen?'− Close Guide':'+ Channel Guide'} · {permitted.length}
      </button>
      <a href={selected.officialUrl} target="_blank" rel="noopener noreferrer" className="csr-official">↗ Official player</a>
    </div>
    {guideOpen&&<div className="csr-guide" id="csr-channel-guide">
      <label>SEARCH VIRTUAL CHANNEL GUIDE
        <input type="search" value={guideSearch} maxLength={90}
          placeholder="Bourbon, NASA, ocean, trains…" onChange={(event)=>setGuideSearch(event.target.value)}/>
      </label>
      <div className="csr-guide-list">
        {guide.map((slot)=><button key={slot.number} type="button"
          aria-current={slot.source.id===selected.id?'true':undefined}
          className={slot.source.id===selected.id?'active':''}
          onClick={()=>choose(slot.source)}>
          <span>CH {channelNumberLabel(slot.number)}</span>
          <span><strong>{slot.source.name}</strong><small>{slot.source.category.toUpperCase()}</small></span>
          {favoriteSet.has(slot.source.id)&&<span aria-label="Favorite">★</span>}
        </button>)}
        {!guide.length&&<p className="csr-no-results">No channels match this guide filter.</p>}
      </div>
    </div>}
    {notice&&<div className="csr-notice" role="status">{notice}</div>}
    <div className="csr-note">
      <strong>VIRTUAL REMOTE · NOT A STREAM LICENSE</strong>
      <p>Choose a curated destination by number, guide, category or favorites. Selecting a channel unloads existing media and does not open a website or start audio/video. Live availability is not checked. Keyboard: focus the remote panel, then use ↑/↓, digits and Enter. Saved last selection stays only in this browser.</p>
    </div>
  </section>
}
