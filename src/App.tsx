import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { moods, serviceKinds, services } from './catalog'
import type { MediaKind, Mood, Service, ServiceFilter, Tab, WatchItem } from './catalog'
import { filterServices, formatWatchlist, pickTonight } from './logic'
import { readWatchlist, saveWatchlist } from './storage'
import PublicCatalog from './PublicCatalog'
import LiveTV from './LiveTV'
import FTALab from './FTALab'
import SignalBridge from './SignalBridge'
import type { TitleCard } from './tmdb'

const nav: { id: Tab; label: string }[] = [
  { id: 'discover', label: 'Free sources' },
  { id: 'catalog', label: 'Film catalog' },
  { id: 'live', label: 'Live TV & FTA' },
  { id: 'fta', label: 'FTA Simulator' },
  { id: 'signal', label: 'Signal Bridge' },
  { id: 'watchlist', label: 'My watchlist' },
  { id: 'guide', label: 'The guide' },
]

function Icon({ name, size = 20 }: { name: 'play' | 'arrow' | 'search' | 'plus' | 'check' | 'spark' | 'close' | 'external' | 'shuffle' | 'copy'; size?: number }) {
  const paths: Record<typeof name, ReactNode> = {
    play: <path d="m8 5 11 7-11 7V5Z" />,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    spark: <><path d="m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3L12 2Z" /></>,
    close: <><path d="m5 5 14 14" /><path d="M19 5 5 19" /></>,
    external: <><path d="M13 5h6v6" /><path d="m19 5-9 9" /><path d="M19 14v5H5V5h5" /></>,
    shuffle: <><path d="M16 3h5v5" /><path d="M4 20 21 3" /><path d="M16 21h5v-5" /><path d="m15 15 6 6" /><path d="M4 4l5 5" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function ProviderCard({ service }: { service: Service }) {
  return (
    <article className={`provider-card tone-${service.color}`}>
      <div className="provider-art" aria-hidden="true">
        <div className="art-orbit art-orbit-one" /><div className="art-orbit art-orbit-two" />
        <span className="art-monogram">{service.initials}</span>
        <span className="art-pill">{service.highlight}</span>
      </div>
      <div className="provider-content">
        <div className="provider-title-row"><h3>{service.name}</h3><span className="access-tag">{service.kind === 'ads' ? 'AD SUPPORTED' : service.kind === 'library' ? 'LIBRARY' : 'PUBLIC'}</span></div>
        <p className="provider-tagline">{service.tagline}</p>
        <p className="provider-description">{service.description}</p>
        <div className="provider-bottom"><span className="access-note">{service.access}</span><a href={service.url} target="_blank" rel="noopener noreferrer" className="provider-link" aria-label={`Open ${service.name} official website in a new tab`}>Visit source <Icon name="external" size={15} /></a></div>
      </div>
    </article>
  )
}

function App() {
  const [tab, setTab] = useState<Tab>('discover')
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<ServiceFilter>('all')
  const [mood, setMood] = useState<Mood>('all')
  const [items, setItems] = useState<WatchItem[]>(readWatchlist)
  const [title, setTitle] = useState('')
  const [mediaKind, setMediaKind] = useState<MediaKind>('Movie')
  const [note, setNote] = useState('')
  const [pickId, setPickId] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => { saveWatchlist(items) }, [items])
  const visibleServices = useMemo(() => filterServices(services, { query, kind, mood }), [query, kind, mood])
  const picked = items.find((item) => item.id === pickId && !item.watched)
  const unwatched = items.filter((item) => !item.watched).length

  function changeTab(next: Tab) {
    setTab(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function addFromCatalog(card: TitleCard) {
    const id = 'tmdb-' + card.mediaType + '-' + card.id
    if (items.some((entry) => entry.id === id)) { setToast('Already on your list.'); return }
    if (items.length >= 250) { setToast('Watchlist is full (250 items).'); return }
    const item: WatchItem = {
      id, title: card.title, kind: card.mediaType === 'movie' ? 'Movie' : 'Series',
      note: 'From TMDB catalog' + (card.year !== 'Year unknown' ? ' · ' + card.year : ''),
      watched: false, createdAt: Date.now(),
    }
    setItems((current) => current.some((entry) => entry.id === id) ? current : [item, ...current])
    setToast('Saved to your local watchlist.')
  }

  function addToWatchlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const safeTitle = title.trim().slice(0, 120)
    if (!safeTitle) return
    if (items.length >= 250) { setToast('Watchlist is full (250 items).'); return }
    const item: WatchItem = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
      title: safeTitle, kind: mediaKind, note: note.trim().slice(0, 320),
      watched: false, createdAt: Date.now(),
    }
    setItems((current) => [item, ...current])
    setTitle(''); setNote(''); setPickId(null)
    setToast('Added to your local watchlist.')
  }

  function toggleWatched(id: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, watched: !item.watched } : item))
    if (pickId === id) setPickId(null)
  }

  async function copyWatchlist() {
    try {
      await navigator.clipboard.writeText(formatWatchlist(items))
      setToast('Watchlist copied to clipboard.')
    } catch {
      setToast('Clipboard unavailable. Your saved list is still here.')
    }
  }

  return (
    <div className="app-shell">
      <div className="top-glow" aria-hidden="true" />
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <button className="brand" onClick={() => changeTab('discover')} aria-label="ReelCommons home">
          <span className="brand-mark"><Icon name="play" size={19} /></span>
          <span>REEL<span className="brand-accent">COMMONS</span><span className="brand-dot">.</span></span>
        </button>
        <nav aria-label="Main navigation" className="primary-nav">
          {nav.map((entry) => <button key={entry.id} className={tab === entry.id ? 'nav-link active' : 'nav-link'} onClick={() => changeTab(entry.id)} aria-current={tab === entry.id ? 'page' : undefined}>{entry.label}{entry.id === 'watchlist' && items.length > 0 ? <span className="nav-count">{items.length}</span> : null}</button>)}
        </nav>
        <span className="header-label"><span className="status-dot" /> ALWAYS FREE TO EXPLORE</span>
      </header>

      <main id="main-content" tabIndex={-1}>
        {tab === 'live' && <LiveTV onOpenLab={() => changeTab('fta')} />}
        {tab === 'fta' && <FTALab onOpenBridge={() => changeTab('signal')} />}
        {tab === 'signal' && <SignalBridge />}
        {tab === 'catalog' && <PublicCatalog savedKeys={items.map((item) => item.id)} onSave={addFromCatalog} onOpenWatchlist={() => changeTab('watchlist')} />}
        {tab === 'discover' && <>
          <section className="hero wrap">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-dash" /> ENTERTAINMENT WITHOUT THE SUBSCRIPTION MAZE</div>
              <h1>Good stories.<br /><em>Open doors.</em></h1>
              <p>Find legitimate places to watch for free, save what catches your eye, and make movie night feel easy again.</p>
              <div className="hero-actions"><a className="btn btn-primary" href="#explore"><Icon name="search" size={18} /> Explore free sources</a><button className="btn btn-outline" onClick={() => changeTab('watchlist')}>Build a watchlist <Icon name="arrow" size={18} /></button></div>
              <div className="hero-note"><span className="mini-star">✳</span> No subscriptions to ReelCommons. No account needed. No sketchy links.</div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-ring hero-ring-outer" /><div className="hero-ring hero-ring-inner" />
              <div className="hero-sun"><div className="hero-sun-shine" /></div>
              <div className="hero-popcorn"><span>THE<br />COMMON<br />SCREEN</span><span className="popcorn-play">▶</span></div>
              <span className="visual-caption">STORIES BELONG IN THE OPEN.</span>
              <span className="visual-cross visual-cross-one">+</span><span className="visual-cross visual-cross-two">+</span>
            </div>
          </section>

          <section className="highlight-strip wrap" aria-label="ReelCommons benefits">
            <div><span className="metric-big">08</span><span>Curated entry points</span></div>
            <div><span className="metric-big">01</span><span>Place to start</span></div>
            <div><span className="metric-big">00</span><span>Accounts required here</span></div>
            <div className="metric-ending"><Icon name="spark" size={20} /><span>Made for actual movie nights</span></div>
          </section>

          <section id="explore" className="directory wrap">
            <div className="section-heading"><div><div className="eyebrow">THE DIRECTORY / 001</div><h2>Find your next <em>favorite place.</em></h2><p>Official starting points, not mystery streaming sites.</p></div><span className="section-index">THE GOOD STUFF ↘</span></div>
            <div className="filters-panel">
              <label className="search-box"><Icon name="search" size={20} /><span className="sr-only">Search streaming services</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search services, genres, or interests..." maxLength={80} /></label>
              <div className="filter-group" aria-label="Filter by access type">{serviceKinds.map((option) => <button key={option.id} className={kind === option.id ? 'filter-chip selected' : 'filter-chip'} aria-pressed={kind === option.id} onClick={() => setKind(option.id)}>{option.label}</button>)}</div>
              <div className="mood-row"><span className="mood-prompt">What's the vibe?</span><div className="mood-list" aria-label="Filter by viewing mood">{moods.map((option) => <button key={option.id} className={mood === option.id ? 'mood-chip active' : 'mood-chip'} aria-pressed={mood === option.id} onClick={() => setMood(option.id)}><span aria-hidden="true">{option.symbol}</span> {option.label}</button>)}</div></div>
            </div>
            <div className="results-header"><span>{visibleServices.length} VERIFIED DESTINATIONS <span className="results-secondary">/ Official homepages</span></span><span className="results-line" /></div>
            <div className="provider-grid">{visibleServices.map((service) => <ProviderCard key={service.id} service={service} />)}</div>
            {visibleServices.length === 0 && <div className="empty-state"><div className="empty-symbol">◎</div><h3>No sources match those filters.</h3><p>Try a broader search or choose another vibe.</p><button className="btn btn-outline" onClick={() => { setQuery(''); setKind('all'); setMood('all') }}>Clear filters</button></div>}
            <div className="availability-note"><Icon name="spark" size={20} /><p><strong>Quick reality check:</strong> This directory links to service homepages. It does not verify individual movie availability. Titles, costs, ads, device support, and regional access can change, so check the provider before watching.</p></div>
          </section>

          <section className="cta-banner wrap">
            <div><div className="eyebrow">YOUR NEXT MOVIE NIGHT STARTS HERE</div><h2>Got a title in mind?<br /><em>Save it for later.</em></h2><p>Your list lives in this browser, under your control. No login, tracking account, or subscription required.</p><button className="btn btn-dark" onClick={() => changeTab('watchlist')}><Icon name="plus" size={19} /> Start your list</button></div>
            <div className="cta-visual" aria-hidden="true"><span>★</span><div className="ticket-card"><b>REELCOMMONS</b><strong>MOVIE<br />NIGHT</strong><small>ADMIT EVERYONE</small></div></div>
          </section>
        </>}

        {tab === 'watchlist' && <section className="subpage wrap">
          <div className="eyebrow">YOUR CORNER / 002</div>
          <h1 className="subpage-title">The <em>watchlist.</em></h1>
          <p className="subpage-lead">The shows, films, and ideas you don't want to lose. Stored on this device, not on our servers.</p>
          <div className="watch-layout">
            <div className="watch-editor panel">
              <div className="panel-head"><span className="panel-icon"><Icon name="plus" size={23} /></span><h2>Add something good</h2></div>
              <form onSubmit={addToWatchlist}>
                <label htmlFor="watch-title">TITLE</label>
                <input id="watch-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required placeholder="The movie or series name" />
                <label htmlFor="watch-kind">WHAT IS IT?</label>
                <select id="watch-kind" value={mediaKind} onChange={(event) => setMediaKind(event.target.value as MediaKind)}><option>Movie</option><option>Series</option></select>
                <label htmlFor="watch-note">WHY SAVE IT? <span>(OPTIONAL)</span></label>
                <textarea id="watch-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={320} rows={3} placeholder="Who recommended it, a genre, or a reminder..." />
                <button type="submit" className="btn btn-primary btn-full"><Icon name="plus" size={18} /> Add to my list</button>
              </form>
              <div className="local-note"><Icon name="check" size={16} /> Private to this browser's local storage. Clearing browser data removes your list.</div>
            </div>
            <div className="watch-collection panel">
              <div className="watch-collection-top"><div><div className="eyebrow">YOUR COLLECTION</div><h2>{items.length} saved <span className="collection-muted">/ {unwatched} to watch</span></h2></div><button className="subtle-button" onClick={copyWatchlist} disabled={items.length === 0}><Icon name="copy" size={17} /> Copy list</button></div>
              <div className="pick-panel"><div><span className="pick-label">CAN'T DECIDE?</span><h3>Let tonight choose.</h3><p>{picked ? <><strong>Your pick: {picked.title}</strong> · {picked.kind}</> : 'A little randomness for the decision-fatigued.'}</p></div><button className="btn btn-small" onClick={() => { const choice = pickTonight(items); setPickId(choice?.id ?? null); if (!choice) setToast('Add an unwatched title first.') }}><Icon name="shuffle" size={18} /> Surprise me</button></div>
              {items.length === 0 ? <div className="list-empty"><span>▤</span><h3>Your list is a blank screen.</h3><p>Every good movie night starts somewhere. Add a title to begin.</p></div> : <div className="watch-items">{items.map((item) => <article className={`watch-item ${item.watched ? 'is-watched' : ''} ${item.id === pickId ? 'is-picked' : ''}`} key={item.id}><button className="watched-toggle" onClick={() => toggleWatched(item.id)} aria-label={item.watched ? `Mark ${item.title} unwatched` : `Mark ${item.title} watched`} aria-pressed={item.watched}><Icon name="check" size={16} /></button><div className="watch-info"><h3>{item.title}</h3><div className="watch-meta">{item.kind}{item.watched ? ' · Watched' : ''}{item.id === pickId ? ' · Tonight’s pick' : ''}</div>{item.note && <p>{item.note}</p>}</div><button className="remove-item" onClick={() => { setItems((current) => current.filter((entry) => entry.id !== item.id)); if (pickId === item.id) setPickId(null) }} aria-label={`Remove ${item.title}`} title="Remove"><Icon name="close" size={17} /></button></article>)}</div>}
            </div>
          </div>
        </section>}

        {tab === 'guide' && <section className="subpage wrap guide-page">
          <div className="eyebrow">KNOW BEFORE YOU PRESS PLAY / 003</div>
          <h1 className="subpage-title">The <em>good-streaming guide.</em></h1>
          <p className="subpage-lead">Free entertainment can be legal and simple. Here's how to avoid the traps.</p>
          <div className="guide-grid">
            <article className="guide-card"><span className="guide-num">01</span><h2>Free with ads</h2><p>Ad-supported services license content and show ads in place of a subscription fee. Offerings and availability vary by location.</p><button onClick={() => { setKind('ads'); setMood('all'); setQuery(''); changeTab('discover') }}>Explore ad-supported <Icon name="arrow" size={16} /></button></article>
            <article className="guide-card"><span className="guide-num">02</span><h2>Your library is magic</h2><p>Some libraries provide Kanopy or hoopla access. A participating card may be required, with monthly borrowing limits.</p><button onClick={() => { setKind('library'); setMood('all'); setQuery(''); changeTab('discover') }}>Explore library services <Icon name="arrow" size={16} /></button></article>
            <article className="guide-card"><span className="guide-num">03</span><h2>Open archives & media</h2><p>Public media and archives can offer free viewing. Free to view does not necessarily mean public domain, so respect each item's rights.</p><button onClick={() => { setKind('public'); setMood('all'); setQuery(''); changeTab('discover') }}>Explore collections <Icon name="arrow" size={16} /></button></article>
          </div>
          <div className="guide-bottom"><div className="eyebrow">OUR PROMISE</div><h2>Links to the real thing.<br /><em>No shady shortcuts.</em></h2><p>ReelCommons is an independent discovery and personal-list tool, not a streaming player, title-availability database, ad bypass, or partner of the listed services. We don't host movies, bypass paywalls, or ask for passwords. Subtitles and accessibility features are best checked on each provider.</p></div>
        </section>}
      </main>
      <footer className="site-footer wrap"><div><span className="footer-wordmark">REEL<span>COMMONS</span>.</span><p>Good stories. Open doors.</p></div><div className="footer-right"><span>Independent • Original • Open source</span><a href="https://github.com/MichaelWave369/ReelCommons" target="_blank" rel="noopener noreferrer">View on GitHub <Icon name="external" size={14} /></a><span>© 2026 ReelCommons · MIT</span></div></footer>
      {toast && <div className="toast" role="status">{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><Icon name="close" size={16} /></button></div>}
    </div>
  )
}

export default App
