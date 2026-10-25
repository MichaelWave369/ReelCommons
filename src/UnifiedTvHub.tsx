import { useState } from 'react'
import type { OpenStream } from './openStreams'
import {
  CHANNEL_LINEUP, channelNumberForSource, channelNumberLabel, surfNextChannel,
} from './channelSurf'
import {
  hubChannelById, hubChannelByNumber, hubGuide, hubReviewedSource,
} from './tvHub'
import './unified-tv-hub.css'

interface Props {
  selected: OpenStream
  favoriteIds: readonly string[]
  recentIds: readonly string[]
  onSelect: (source: OpenStream) => void
  onOpenMain: () => void
  onOpenCouch: () => void
  onOpenReviewed: () => void
}

const picks = ['nasa-iss','kexp','cbs-news','monterey-cams','new-orleans-bourbon']
const featured = picks.flatMap((id) => {
  const slot = hubChannelById(id)
  return slot ? [slot] : []
})

export default function UnifiedTvHub({
  selected, favoriteIds, recentIds,
  onSelect, onOpenMain, onOpenCouch, onOpenReviewed,
}: Props) {
  const [query, setQuery] = useState('')
  const [number, setNumber] = useState('')
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [message, setMessage] = useState('')
  const list = hubGuide(query,favoriteIds,favoriteOnly)
  const currentNumber = channelNumberForSource(selected.id)
  const reviewed = hubReviewedSource(selected.id)
  const recents = recentIds.flatMap((id) => {
    const slot = hubChannelById(id)
    return slot ? [slot] : []
  })

  function tune(source: OpenStream) {
    onSelect(source)
    setNumber('')
    setMessage('Now selected: ' + source.name + '. No media was loaded.')
  }
  function tuneNumber() {
    const slot = hubChannelByNumber(number)
    if (!slot) {
      setMessage('Invalid virtual channel number. Select a channel from 001–' +
        channelNumberLabel(CHANNEL_LINEUP.length) + '.')
      return
    }
    tune(slot.source)
  }
  function surf(direction: -1 | 1) {
    const next = surfNextChannel(CHANNEL_LINEUP,selected.id,direction)
    if (next) tune(next.source)
  }

  return <section className="uth" aria-labelledby="uth-title">
    <div className="uth-heading">
      <div>
        <span className="uth-kicker">RCTV v3.0 · ONE TV, THREE SCREENS</span>
        <h2 id="uth-title">The Unified TV Home</h2>
        <p>One selected channel across the guide, regular player, lean-back Couch Mode, and Reviewed Player Desk. All 50 virtual channels remain official, curated destinations.</p>
      </div>
      <span className="uth-version">V3.0 / COMMON SCREEN</span>
    </div>
    <div className="uth-hero">
      <div className="uth-now" role="status">
        <span className="uth-kicker">NOW SELECTED · NOT AUTO-PLAYING</span>
        <div><span aria-hidden="true" className="uth-symbol">{selected.icon}</span>
          <div>
            <strong>CH {currentNumber === null ? '---' : channelNumberLabel(currentNumber)} · {selected.name}</strong>
            <p>{selected.tagline}</p>
          </div>
        </div>
        <div className="uth-tags">
          <span>{selected.category.toUpperCase()}</span>
          <span>{selected.playback === 'official' ? 'OFFICIAL SITE ONLY' :
            selected.playback === 'youtube-embed' ? 'OPT-IN REVIEWED VIDEO' :
            'OPT-IN PUBLISHED RADIO'}</span>
          <span>NO AUTOPLAY</span>
        </div>
      </div>
      <div className="uth-screen-actions" role="group" aria-label="Open a TV viewing surface">
        <button type="button" onClick={onOpenMain}>
          <span>01 · DESK</span><strong>View Channel Desk</strong>
          <small>Regular player and signal recovery</small>
        </button>
        <button type="button" onClick={onOpenCouch}>
          <span>02 · BIG SCREEN</span><strong>Enter Couch Mode</strong>
          <small>Same channel, 50-channel remote</small>
        </button>
        <button type="button" disabled={!reviewed} onClick={onOpenReviewed}>
          <span>03 · REVIEWED</span><strong>Open Reviewed Player Desk</strong>
          <small>{reviewed ? 'Same reviewed channel, on standby' :
            'Choose one of the 7 reviewed stations first'}</small>
        </button>
      </div>
    </div>
    <div className="uth-controls" aria-label="Unified channel controls">
      <button type="button" onClick={() => surf(-1)}>← CH−</button>
      <button type="button" onClick={() => surf(1)}>CH+ →</button>
      <form onSubmit={(event) => {event.preventDefault();tuneNumber()}}>
        <label htmlFor="uth-number">VIRTUAL CH</label>
        <input id="uth-number" type="text" inputMode="numeric" pattern="[0-9]{1,3}"
          maxLength={3} value={number} placeholder="013"
          onChange={(event) => setNumber(event.target.value.replace(/\D/g,'').slice(0,3))}/>
        <button type="submit" disabled={!number}>Tune</button>
      </form>
      <a href={selected.officialUrl} target="_blank" rel="noopener noreferrer">↗ Official broadcaster</a>
    </div>
    <div className="uth-featured">
      <div><h3>Featured channels</h3><p>Selections only. A new channel never starts media.</p></div>
      <div className="uth-featured-items">
        {featured.map(({source,number:channel}) => <button type="button"
          key={source.id} aria-pressed={source.id === selected.id} onClick={() => tune(source)}>
          <span>CH {channelNumberLabel(channel)}</span>
          <strong>{source.name}</strong>
        </button>)}
      </div>
    </div>
    {recents.length>0 && <div className="uth-recent">
      <h3>Previously selected · this visit only</h3>
      <div>{recents.map(({source,number:channel})=><button type="button"
        key={source.id} onClick={() => tune(source)}>
        ↶ {channelNumberLabel(channel)} · {source.name}
      </button>)}</div>
    </div>}
    <div className="uth-guide-head">
      <div><h3>One guide, 50 channels</h3>
        <p>Search the source-controlled TV lineup, including website-only broadcasts.</p></div>
      <button type="button" aria-expanded={guideOpen} aria-controls="uth-guide"
        onClick={() => setGuideOpen((v) => !v)}>
        {guideOpen ? '− Hide unified guide' : '＋ Browse unified guide'}
      </button>
    </div>
    {guideOpen && <div id="uth-guide" className="uth-guide">
      <div className="uth-filter">
        <label>SEARCH CHANNELS
          <input type="search" maxLength={90} value={query}
            placeholder="NASA, jazz, city, wildlife, CH 013…"
            onChange={(event) => setQuery(event.target.value)}/>
        </label>
        <label className="uth-favorites-only">
          <input type="checkbox" checked={favoriteOnly}
            onChange={(event) => setFavoriteOnly(event.target.checked)}/>
          ★ Favorites only ({favoriteIds.length})
        </label>
      </div>
      <div className="uth-guide-grid" role="group" aria-label="Unified source-controlled channel guide">
        {list.map(({source,number:channel})=><button type="button" key={source.id}
          className={source.id===selected.id?'selected':''}
          aria-pressed={source.id === selected.id}
          onClick={() => tune(source)}>
          <span>CH {channelNumberLabel(channel)} {favoriteIds.includes(source.id) ? '★' : ''}</span>
          <strong>{source.name}</strong>
          <small>{source.playback==='official'?'OFFICIAL WEBSITE':'REVIEWED INLINE OPTION'}</small>
        </button>)}
      </div>
      {!list.length && <p className="uth-empty">No stations match this search or favorite filter.</p>}
    </div>}
    {message && <p className="uth-message" role="status">{message}</p>}
    <p className="uth-boundary">RCTV's channel number is a directory position, not a TV frequency or confirmed live broadcast. All viewing surfaces are still opt-in. Opening a desk, switching stations or browsing this guide does not start a video, audio stream, or background network probe.</p>
  </section>
}
