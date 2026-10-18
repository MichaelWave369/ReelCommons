import { useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import {
  FAVORITES_STORAGE_KEY, filterLiveSources, genreFilters,
  kindFilters, liveSources, parseFavorites, pickSource,
} from './liveTv'
import type { GenreFilter, LiveSource, SourceFilter } from './liveTv'
import './live-tv.css'

const kindNames = { fast: 'FREE INTERNET TV', public: 'PUBLIC LIVESTREAM', antenna: 'OVER-THE-AIR FTA' } as const

function initialFavorites(): string[] {
  try { return parseFavorites(window.localStorage.getItem(FAVORITES_STORAGE_KEY)) }
  catch { return [] }
}

export default function LiveTV() {
  const [kind, setKind] = useState<SourceFilter>('all')
  const [genre, setGenre] = useState<GenreFilter>('all')
  const [search, setSearch] = useState('')
  const [favorites, setFavorites] = useState<string[]>(initialFavorites)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [pick, setPick] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  const visible = useMemo(() => filterLiveSources(liveSources, {
    kind, genre, query: search, favoritesOnly, favorites,
  }), [kind, genre, search, favoritesOnly, favorites])
  const selected = liveSources.find((source) => source.id === pick && visible.some((item) => item.id === source.id)) ?? null
  const counts = {
    fast: liveSources.filter((s) => s.kind === 'fast').length,
    public: liveSources.filter((s) => s.kind === 'public').length,
    antenna: liveSources.filter((s) => s.kind === 'antenna').length,
  }

  function toggleFavorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter((saved) => saved !== id) : [...favorites, id]
    setFavorites(next)
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next))
      setNotice(next.includes(id) ? 'Saved this destination to your favorites on this device.' : 'Removed destination from favorites.')
    } catch {
      setNotice('Browser storage is unavailable. Favorites will remain only until you leave this page.')
    }
  }

  function choose() {
    const options = visible.filter((source) => source.id !== pick)
    const chosen = pickSource(options.length ? options : visible)
    if (!chosen) { setNotice('No destinations match your current filters.'); return }
    setPick(chosen.id)
    setNotice('Discovery Compass selected ' + chosen.name + '. Open its official guide when ready.')
    document.getElementById('rc-live-channel-' + chosen.id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  function handleChannelKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (!(event.target instanceof HTMLAnchorElement) || !event.target.classList.contains('rc-live-tune')) return
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    const anchors = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>('a.rc-live-tune'))
    const current = anchors.indexOf(event.target)
    if (current < 0) return
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? anchors.length - 1
      : event.key === 'ArrowRight' || event.key === 'ArrowDown' ? (current + 1) % anchors.length
      : (current - 1 + anchors.length) % anchors.length
    event.preventDefault()
    anchors[next]?.focus()
  }

  function renderCard(source: LiveSource) {
    const favorite = favorites.includes(source.id)
    return <article id={'rc-live-channel-' + source.id} key={source.id}
      className={'rc-live-card rc-live-' + source.accent + (selected?.id === source.id ? ' rc-live-highlight' : '')}>
      <div className="rc-live-art">
        <span className="rc-live-kind">{kindNames[source.kind]}</span>
        <span className="rc-live-glyph" aria-hidden="true">{source.icon}</span>
        <span className="rc-live-short">{source.shortName}</span>
        <span className="rc-live-orbit" aria-hidden="true" />
      </div>
      <div className="rc-live-card-content">
        <div className="rc-live-card-head">
          <h3>{source.name}</h3>
          <button type="button" className={'rc-live-heart' + (favorite ? ' active' : '')}
            aria-pressed={favorite} aria-label={(favorite ? 'Remove ' : 'Add ') + source.name + (favorite ? ' from' : ' to') + ' favorites'}
            onClick={() => toggleFavorite(source.id)} title={favorite ? 'Remove favorite' : 'Save favorite'}>
            {favorite ? '★' : '☆'}
          </button>
        </div>
        <p className="rc-live-headline">{source.headline}</p>
        <p className="rc-live-desc">{source.description}</p>
        <div className="rc-live-categories">{source.genres.slice(0, 3).map((label) =>
          <span key={label}>{label}</span>)}</div>
        <p className="rc-live-access">{source.access}</p>
        <p className="rc-live-area">{source.regionNote}</p>
        <div className="rc-live-actions">
          <a className="rc-live-tune" target="_blank" rel="noopener noreferrer" href={source.url}>
            {source.kind === 'antenna' ? 'Open reception map ↗' : 'Open official guide ↗'}
          </a>
          <span className="rc-live-official">OFFICIAL DESTINATION</span>
        </div>
      </div>
    </article>
  }

  return <section className="rc-live-page wrap" aria-labelledby="rc-live-heading">
    <div className="eyebrow">THE COMMON SCREEN / RCTV v0.6</div>
    <div className="rc-live-hero">
      <div className="rc-live-hero-copy">
        <div className="rc-live-overline"><span className="rc-live-signal" /> THE AIRWAVES ARE OPEN</div>
        <h1 id="rc-live-heading">Live television.<br /><em>More freedom.</em></h1>
        <p>Explore legitimate free internet channels, public-service livestreams, and old-school over-the-air TV. One friendly guide. No mystery IPTV links.</p>
        <div className="rc-live-hero-stats">
          <div><strong>{counts.fast}</strong><span>Streaming services</span></div>
          <div><strong>{counts.public}</strong><span>Public sources</span></div>
          <div><strong>{counts.antenna}</strong><span>FTA reception tool</span></div>
        </div>
      </div>
      <div className="rc-live-hero-visual" aria-hidden="true">
        <div className="rc-live-screen">
          <div className="rc-live-scan"><span>RCTV</span><strong>FREE<br/>TO<br/>EXPLORE</strong><small>THE COMMON SCREEN · CH 06</small></div>
          <div className="rc-live-screen-stand" />
        </div>
        <div className="rc-live-antenna" />
        <span className="rc-live-ring rc-live-ring-one" /><span className="rc-live-ring rc-live-ring-two" />
      </div>
    </div>

    <div className="rc-live-truth"><span aria-hidden="true">ⓘ</span><p><strong>What's actually live here?</strong> These are official <em>service and reception-guide destinations</em>, not individual streams or a real-time program schedule. ReelCommons doesn't rebroadcast video, scrape IPTV playlists, remove advertisements, or claim that a channel is airing right now. Playback and availability depend on the provider or your antenna reception.</p></div>

    <div className="rc-live-filter-panel">
      <div className="rc-live-filter-top"><div><span className="eyebrow">THE TUNER / 001</span><h2>Find your frequency.</h2></div><span className="rc-live-count">{visible.length} SOURCES TO EXPLORE</span></div>
      <div className="rc-live-type-filters" role="group" aria-label="Select type of free television">
        {kindFilters.map((item) => <button key={item.id} type="button" aria-pressed={kind === item.id} className={kind === item.id ? 'active' : ''} onClick={() => { setKind(item.id); setPick(null) }}>{item.label}</button>)}
      </div>
      <div className="rc-live-tool-row">
        <label className="rc-live-input-label">SEARCH OFFICIAL SOURCES
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPick(null) }} maxLength={90} placeholder="News, sports, space, movies..." />
        </label>
        <label className="rc-live-input-label">GENRE / INTEREST
          <select value={genre} onChange={(event) => { setGenre(event.target.value as GenreFilter); setPick(null) }}>
            {genreFilters.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <button className={'rc-live-fav-filter' + (favoritesOnly ? ' active' : '')} aria-pressed={favoritesOnly} onClick={() => { setFavoritesOnly(!favoritesOnly); setPick(null) }}>★ Favorites only ({favorites.length})</button>
        <button className="rc-live-surf" onClick={choose} disabled={visible.length === 0}>✳ Surprise me</button>
      </div>
    </div>

    {selected && <div className="rc-live-picked" role="status">
      <span>DISCOVERY COMPASS PICKED</span><strong>{selected.name}</strong>
      <a target="_blank" rel="noopener noreferrer" href={selected.url}>{selected.kind === 'antenna' ? 'Open FCC reception map ↗' : 'Explore official live guide ↗'}</a>
    </div>}
    {notice && <div className="rc-live-notice" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}>✕</button></div>}
    <div className="rc-live-directory" onKeyDown={handleChannelKeys} aria-label="Free television source directory">
      {visible.map(renderCard)}
    </div>
    {visible.length === 0 && <div className="rc-live-empty"><h3>Nothing matches these filters.</h3><p>Try a different genre, show all types, or turn off Favorites only.</p><button onClick={() => { setKind('all'); setGenre('all'); setSearch(''); setFavoritesOnly(false); setPick(null) }}>Reset the tuner</button></div>}

    <div className="rc-live-guide">
      <div className="eyebrow">THE FREE TV FIELD GUIDE / 002</div>
      <h2>Three different ways to <em>tune in.</em></h2>
      <div className="rc-live-explainer-grid">
        <article><div>01 / FAST</div><h3>Free internet channels</h3><p>FAST means Free Ad-Supported Streaming Television. Your internet connection carries the programming; the service displays advertising. Tune in through the official player or channel guide. Account and device rules vary.</p></article>
        <article><div>02 / PUBLIC</div><h3>Public service, live</h3><p>Broadcasters and agencies may offer free local streams or scheduled event coverage. PBS requires a participating local station and an eligible viewing region. NASA events aren't necessarily broadcasting all day.</p></article>
        <article><div>03 / FTA</div><h3>Real over-the-air TV</h3><p>In the U.S., an antenna and compatible TV tuner can receive nearby free terrestrial broadcasts. The FCC reception map predicts signal coverage, not internet streaming. Satellite FTA requires different equipment and legal reception rules.</p></article>
      </div>
      <div className="rc-live-footnote">All service names belong to their respective owners. ReelCommons is independent, does not host or provide live channel streams, and earns no revenue from these links. Links lead to provider-owned sites. Channel availability, technical requirements, service areas, advertising and terms can change.</div>
    </div>
    <div className="rc-live-footer-link"><button onClick={() => document.getElementById('rc-live-heading')?.scrollIntoView({ behavior: 'smooth' })}>↑ Back to the tuner</button><span>Navigation tip: focus an “Open official guide” link, then use arrow keys to move among destinations.</span></div>
  </section>
}
