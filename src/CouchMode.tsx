/**
 * RCTV v2.9 · Couch Mode.
 * Lean-back directory viewer. Never auto-plays, captures, proxies, scrapes
 * or promotes any unapproved provider feed into in-app playback.
 */
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { CHANNEL_LINEUP, channelNumberForSource, channelNumberLabel,
  filterChannelLineup, normalizeChannelInput, resolveChannelNumber,
  surfNextChannel } from './channelSurf'
import { playableUrl, STREAM_CATEGORIES } from './openStreams'
import { initialSignalForSource, observeSignal, selectSignalStation } from './signalRecovery'
import SignalDiagnosticPanel from './SignalDiagnosticPanel'
import type { OpenStream, StreamCategory } from './openStreams'
import './couch-mode.css'

export default function CouchMode({
  selected, favoriteIds, onSelect, onClose,
}: {
  selected: OpenStream
  favoriteIds: readonly string[]
  onSelect: (source: OpenStream) => void
  onClose: () => void
}) {
  const overlayRef = useRef<HTMLElement>(null)
  const [category, setCategory] = useState<StreamCategory|'all'>('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [digits, setDigits] = useState('')
  const [loadedId, setLoadedId] = useState<string|null>(null)
  const [couchSignal, setCouchSignal] = useState(() => initialSignalForSource(selected.id))
  const [message, setMessage] = useState('')
  const lineup = filterChannelLineup(CHANNEL_LINEUP,category,favoritesOnly,favoriteIds)
  const selectedNumber = channelNumberForSource(selected.id)
  const safeUrl = playableUrl(selected)
  const loaded = loadedId === selected.id && safeUrl !== null
  const couchAttempt = couchSignal.attempt
  function signalEvent(event: 'frame-load'|'audio-canplay'|'audio-playing'|'audio-pause'|'audio-waiting'|'audio-error') {
    setCouchSignal((previous) => observeSignal(previous,event,selected.id,couchAttempt))
  }
  const filteredGuide = lineup.filter((slot) => {
    const query = search.trim().toLowerCase()
    return !query || [slot.source.name,slot.source.tagline,slot.source.category,slot.source.place??'']
      .join(' ').toLowerCase().includes(query)
  })

  useEffect(() => {
    const oldOverflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    overlayRef.current?.focus()
    return () => {document.body.style.overflow=oldOverflow}
  },[])

  function select(source: OpenStream) {
    setLoadedId(null)
    setCouchSignal((previous) => selectSignalStation(previous,source.id))
    setDigits('')
    setMessage('Selected '+source.name+'. No media loaded.')
    onSelect(source)
  }
  function surf(direction:1|-1) {
    const next=surfNextChannel(lineup,selected.id,direction)
    if(!next) {setMessage('No channels match this filter. Try All channels or disable Favorites only.');return}
    select(next.source)
  }
  function pressDigit(value:string) {
    setDigits((old)=>normalizeChannelInput(old.length>=3?value:old+value))
    setMessage('')
  }
  function tune() {
    const candidate=resolveChannelNumber(digits)
    if(!candidate) {setMessage('No virtual channel at that number. Choose 001–050.');return}
    if(!lineup.some((slot)=>slot.number===candidate.number)) {
      setMessage('That channel is outside the selected category or saved-only lineup.')
      return
    }
    select(candidate.source)
  }
  function handleKey(event:KeyboardEvent<HTMLElement>) {
    // Escape always closes the dialog even from focused buttons or form fields.
    if(event.key==='Escape' && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();event.stopPropagation();onClose();return
    }
    // Keep keyboard focus in this modal, including when the guide is expanded.
    if(event.key==='Tab') {
      const focusables=Array.from(overlayRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),[tabindex="0"]',
      )??[]).filter((el)=>el.getClientRects().length>0)
      if(!focusables.length)return
      const first=focusables[0],last=focusables[focusables.length-1]
      if(event.shiftKey && (document.activeElement===first||document.activeElement===overlayRef.current)) {
        event.preventDefault();last.focus()
      } else if(!event.shiftKey && document.activeElement===last) {
        event.preventDefault();first.focus()
      }
      return
    }
    if(event.target!==event.currentTarget || event.shiftKey||event.altKey||event.ctrlKey||event.metaKey)return
    if(event.key==='ArrowUp'||event.key==='ArrowRight') {event.preventDefault();surf(1)}
    else if(event.key==='ArrowDown'||event.key==='ArrowLeft') {event.preventDefault();surf(-1)}
    else if(/^[0-9]$/.test(event.key)) {event.preventDefault();pressDigit(event.key)}
    else if(event.key==='Enter') {event.preventDefault();tune()}
    else if(event.key==='Backspace') {event.preventDefault();setDigits((s)=>s.slice(0,-1))}
  }

  const currentNumber = selectedNumber===null?'---':channelNumberLabel(selectedNumber)
  return <section className="couch-overlay" role="dialog" aria-modal="true" aria-label="RCTV Couch Mode"
    ref={overlayRef} tabIndex={-1} onKeyDown={handleKey}>
    <div className="couch-frame">
      <header className="couch-topbar">
        <div><span className="couch-signature">RCTV / THE COMMON SCREEN</span><h2>COUCH <em>MODE</em></h2></div>
        <div className="couch-head-actions">
          <span className="couch-status">50 CURATED CHANNELS · NO AUTOPLAY</span>
          <button type="button" className="couch-close" onClick={onClose} aria-label="Close Couch Mode">✕ Exit Couch Mode</button>
        </div>
      </header>

      <div className="couch-stage-grid">
        <div className="couch-stage-area">
          <div className="couch-screen">
            {loaded && safeUrl && selected.playback==='youtube-embed' ?
              <iframe key={selected.id} src={safeUrl} title={'Official YouTube player: '+selected.name}
                allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={() => signalEvent('frame-load')}/> :
             loaded && safeUrl && selected.playback==='published-audio' ?
              <div className="couch-audio">
                <span aria-hidden="true">♫</span>
                <strong>{selected.name} · Broadcaster audio</strong>
                <p>You chose to load the publisher-listed audio URL. Press play to listen. Browser support and availability vary.</p>
                <audio key={selected.id} src={safeUrl} controls preload="none"
                  aria-label={'Official audio: '+selected.name}
                  onCanPlay={() => signalEvent('audio-canplay')}
                  onPlaying={() => signalEvent('audio-playing')}
                  onPause={() => signalEvent('audio-pause')}
                  onWaiting={() => signalEvent('audio-waiting')}
                  onStalled={() => signalEvent('audio-waiting')}
                  onError={()=>{signalEvent('audio-error');setMessage('Audio failed to load. Try the official broadcaster site instead.')}}/>
              </div> :
              <div className="couch-standby">
                <span className="couch-standby-icon" aria-hidden="true">{selected.icon}</span>
                <div className="couch-no-signal">{safeUrl?'MEDIA ON STANDBY':'OFFICIAL PLAYER DESTINATION'}</div>
                <strong>{selected.name}</strong>
                <p>{safeUrl ? 'Load the permitted player when you are ready.' :
                  'This camera or station plays on the provider’s own website. Select the official link to watch.'}</p>
              </div>}
            <div className="couch-screen-label">
              <span>CH {currentNumber}</span><strong>{selected.name}</strong>
              <small>{selected.category.toUpperCase()} · {selected.place??'Original broadcaster source'}</small>
            </div>
          </div>
          <div className="couch-player-actions">
            {safeUrl && !loaded && <button type="button" className="couch-load"
              onClick={()=>{setLoadedId(selected.id);setCouchSignal((previous)=>observeSignal(previous,'load',selected.id,previous.attempt));setMessage('External player loaded only after your action. Playback stays under provider control.')}}>
              ▶ {selected.playback==='youtube-embed'?'Load official YouTube player':'Load KEXP broadcaster audio'}
            </button>}
            {loaded && <button type="button" className="couch-unload" onClick={()=>{setLoadedId(null);setCouchSignal((previous)=>observeSignal(previous,'unload',previous.sourceId,previous.attempt));setMessage('Media unloaded.')}}>■ Stop / unload</button>}
            <a href={selected.officialUrl} target="_blank" rel="noopener noreferrer" className="couch-provider">↗ Open official player</a>
          </div>
          <SignalDiagnosticPanel key={selected.id} source={selected}
            signal={couchSignal} loaded={loaded} context="Couch Mode"
            onReport={(event)=>setCouchSignal((previous)=>
              observeSignal(previous,event,selected.id,previous.attempt))}/>
          <div className="couch-ownership">
            <strong>PROVIDER TRUST LEDGER</strong>
            <p>{selected.playbackNote}</p>
            <p>{selected.region} Neither the channel number nor this screen verifies live availability or rebroadcast permission.</p>
          </div>
        </div>

        <aside className="couch-side" aria-label="Couch Mode remote controls">
          <div className="couch-channel-display">
            <small>VIRTUAL CHANNEL · NOT AN RF FREQUENCY</small>
            <div><strong>{currentNumber}</strong><span>/{channelNumberLabel(CHANNEL_LINEUP.length)}</span></div>
            <p>{selected.tagline}</p>
          </div>
          <div className="couch-channel-arrows">
            <button type="button" onClick={()=>surf(-1)} disabled={!lineup.length}>← CH −</button>
            <button type="button" onClick={()=>surf(1)} disabled={!lineup.length}>CH + →</button>
          </div>
          <div className="couch-entry-row">
            <div aria-live="off"><small>DIRECT CHANNEL ENTRY</small><strong>{digits.padStart(3,'–')}</strong></div>
            <button type="button" onClick={tune}>TUNE</button>
          </div>
          <div className="couch-numbers" role="group" aria-label="TV remote numeric keypad">
            {['1','2','3','4','5','6','7','8','9','CLR','0','⌫'].map((digit)=>
              <button key={digit} type="button"
                aria-label={digit==='CLR'?'Clear digits':digit==='⌫'?'Backspace':'Digit '+digit}
                onClick={()=>digit==='CLR'?setDigits(''):digit==='⌫'?setDigits((v)=>v.slice(0,-1)):pressDigit(digit)}>
                {digit}
              </button>)}
          </div>
          <div className="couch-filter-controls">
            <label>CHANNEL CATEGORY
              <select value={category} onChange={(event)=>setCategory(event.target.value as StreamCategory|'all')}>
                {STREAM_CATEGORIES.map((item)=><option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="couch-favorites"><input type="checkbox" checked={favoritesOnly}
              onChange={(event)=>setFavoritesOnly(event.target.checked)}/> ★ Favorites only ({favoriteIds.length})</label>
          </div>
          <button type="button" className="couch-guide-toggle" aria-expanded={guideOpen}
            aria-controls="couch-channel-guide" onClick={()=>setGuideOpen((v)=>!v)}>
            {guideOpen?'− Hide Guide':'+ View Channel Guide'} ({lineup.length})
          </button>
        </aside>
      </div>
      {guideOpen && <div id="couch-channel-guide" className="couch-guide">
        <label>FIND A CHANNEL
          <input type="search" value={search} onChange={(event)=>setSearch(event.target.value.slice(0,100))}
            placeholder="Bourbon Street, NASA, oceans, trains…"/>
        </label>
        <div className="couch-guide-grid">
          {filteredGuide.map((slot)=><button key={slot.number} type="button"
            className={slot.source.id===selected.id?'active':''}
            aria-current={slot.source.id===selected.id?'true':undefined}
            onClick={()=>select(slot.source)}>
            <span>CH {channelNumberLabel(slot.number)}</span>
            <strong>{slot.source.name}</strong>
            <small>{slot.source.category.toUpperCase()}</small>
          </button>)}
          {!filteredGuide.length && <p>No stations match this filtered guide.</p>}
        </div>
      </div>}
      {message && <div className="couch-message" role="status">{message}</div>}
      <footer className="couch-footer">
        <span>REMOTE: CH+/CH− · NUMBERS · GUIDE · FAVORITES · OFFICIAL PROVIDER</span>
        <span>Focus empty screen area for keyboard arrows/numbers. Escape closes. No automatic third-party playback.</span>
      </footer>
    </div>
  </section>
}
