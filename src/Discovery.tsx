import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { fetchCatalog, fetchDetails, fetchGenres, posterUrl, REGIONS, tmdbTitleUrl } from './tmdb'
import type { CatalogView, Genre, MediaType, TitleCard, TitleDetails } from './tmdb'
import './discovery.css'

interface Props {
  savedKeys: string[]
  onSave: (item: TitleCard) => void
  onOpenWatchlist: () => void
}

const OFFICIAL_TMDB_LOGO = 'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg'

function cardKey(card: TitleCard): string { return 'tmdb-' + card.mediaType + '-' + card.id }

export default function Discovery({ savedKeys, onSave, onOpenWatchlist }: Props) {
  const [tokenDraft, setTokenDraft] = useState('')
  const [token, setToken] = useState('')
  const [mediaType, setMediaType] = useState<MediaType>('movie')
  const [region, setRegion] = useState('US')
  const [view, setView] = useState<CatalogView>('browse')
  const [queryDraft, setQueryDraft] = useState('')
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState<number | null>(null)
  const [genres, setGenres] = useState<Genre[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [items, setItems] = useState<TitleCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const [selected, setSelected] = useState<TitleCard | null>(null)
  const [details, setDetails] = useState<TitleDetails | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  const saved = useMemo(() => new Set(savedKeys), [savedKeys])

  useEffect(() => {
    if (!token) { setGenres([]); return }
    const controller = new AbortController()
    fetchGenres(token, mediaType, controller.signal).then((data) => {
      if (!controller.signal.aborted) setGenres(data)
    }).catch(() => { if (!controller.signal.aborted) setGenres([]) })
    return () => controller.abort()
  }, [token, mediaType])

  useEffect(() => {
    if (!token || (view === 'search' && !query.trim())) { setItems([]); return }
    const controller = new AbortController()
    setLoading(true)
    setError('')
    fetchCatalog(token, { mediaType, region, view, query, page, genre }, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return
        setItems(response.results)
        setTotalPages(response.totalPages)
        setLastUpdated(new Date().toISOString())
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setItems([])
        setError(err instanceof Error ? err.message : 'The catalog could not load.')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token, mediaType, region, view, query, page, genre])

  useEffect(() => {
    if (!selected || !token) { setDetails(null); return }
    const controller = new AbortController()
    setDetailLoading(true); setDetailError(''); setDetails(null)
    fetchDetails(token, selected, region, controller.signal)
      .then((info) => { if (!controller.signal.aborted) setDetails(info) })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setDetailError(err instanceof Error ? err.message : 'Could not load details.')
      })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false) })
    return () => controller.abort()
  }, [selected, region, token])

  useEffect(() => {
    if (!selected) return
    const prior = document.activeElement instanceof HTMLElement ? document.activeElement : null
    returnFocus.current = prior
    const priorOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    function keys(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setSelected(null)
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const buttons = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled])'))
        .filter((el) => el.getClientRects().length > 0)
      if (!buttons.length) { event.preventDefault(); return }
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus()
      }
    }
    window.addEventListener('keydown', keys)
    return () => {
      document.body.style.overflow = priorOverflow
      window.removeEventListener('keydown', keys)
      returnFocus.current?.focus()
    }
  }, [selected])

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = queryDraft.trim()
    setPage(1); setGenre(null)
    if (trimmed) { setQuery(trimmed); setView('search') }
    else { setQuery(''); setView('browse') }
  }

  function showDetails(card: TitleCard) { setSelected(card) }

  function roulette() {
    if (!items.length) return
    const index = Math.min(items.length - 1, Math.floor(Math.random() * items.length))
    showDetails(items[index])
  }

  function changeMedia(next: MediaType) {
    setMediaType(next); setPage(1); setGenre(null); setQuery(''); setQueryDraft(''); setView('browse')
  }

  function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (tokenDraft.trim().length < 12) { setError('Enter a valid TMDB API Read Access Token.'); return }
    setError(''); setToken(tokenDraft.trim()); setTokenDraft('')
  }

  const isSaved = selected ? saved.has(cardKey(selected)) : false
  const availability = details?.availability
  const hasOptions = Boolean(availability && (availability.free.length > 0 || availability.ads.length > 0))
  const selectedGenres = details?.genres.map((g) => g.name).join(' · ')

  return (
    <section className="rc-catalog wrap" aria-labelledby="rc-catalog-heading">
      <div className="eyebrow">THE SCREEN ROOM / 004</div>
      <div className="rc-heading">
        <div><h1 id="rc-catalog-heading">Find the next <em>good story.</em></h1><p>Real movie and TV data. Region-aware free viewing reports. A little movie-night magic.</p></div>
        <div className="rc-heading-stamp">REELCOMMONS<br />CATALOG v0.2</div>
      </div>
      {!token ? (
        <div className="rc-connect">
          <div className="rc-connect-art" aria-hidden="true"><span>▶</span><strong>THE<br/>BIG<br/>SCREEN</strong></div>
          <div className="rc-connect-content">
            <div className="eyebrow">OPTIONAL LIVE DISCOVERY</div>
            <h2>Open the movie database.</h2>
            <p>The live catalog uses TMDB. Because ReelCommons is a public, static GitHub Pages site, every visitor connects with their <strong>own TMDB API Read Access Token</strong>. No shared secret is shipped in the code.</p>
            <form onSubmit={connect} className="rc-token-form">
              <label htmlFor="rc-token">YOUR TMDB API READ ACCESS TOKEN</label>
              <div className="rc-token-row"><input id="rc-token" type="password" autoComplete="off" spellCheck={false} minLength={12} required value={tokenDraft} onChange={(e) => setTokenDraft(e.target.value)} placeholder="Paste your read-only token for this visit" /><button className="btn btn-primary" type="submit">Connect →</button></div>
            </form>
            {error && <p className="rc-error" role="alert">{error}</p>}
            <p className="rc-token-note">Token remains in this tab's memory, never in browser storage or source code. Requests go directly from your browser to TMDB; browser extensions and developer tools can still observe them. It disappears when you refresh or close the tab. <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer">Get a TMDB token ↗</a></p>
            <p className="rc-token-note">Don't want to connect? The <strong>Free sources</strong> directory and your personal watchlist work without any token.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="rc-toolbar">
            <div className="rc-toolbar-top">
              <div className="rc-toggle" aria-label="Title type"><button className={mediaType === 'movie' ? 'active' : ''} onClick={() => changeMedia('movie')} aria-pressed={mediaType === 'movie'}>Movies</button><button className={mediaType === 'tv' ? 'active' : ''} onClick={() => changeMedia('tv')} aria-pressed={mediaType === 'tv'}>TV series</button></div>
              <div className="rc-region"><label htmlFor="rc-region">VIEWING REGION</label><select id="rc-region" value={region} onChange={(e) => { setRegion(e.target.value); setPage(1) }}>{REGIONS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}</select></div>
              <button className="rc-disconnect" onClick={() => { setToken(''); setSelected(null); setItems([]); setError('') }}>Disconnect token</button>
            </div>
            <form className="rc-search" onSubmit={search}><label className="sr-only" htmlFor="rc-title-search">Search movies or TV shows</label><input id="rc-title-search" value={queryDraft} maxLength={90} placeholder={'Search ' + (mediaType === 'movie' ? 'movies' : 'TV series') + ' by title…'} onChange={(e) => setQueryDraft(e.target.value)} /><button type="submit">Search titles →</button></form>
            <div className="rc-browse-actions">
              <button className={view === 'browse' ? 'rc-browse-pill active' : 'rc-browse-pill'} onClick={() => { setView('browse'); setQuery(''); setQueryDraft(''); setPage(1) }}>Free / ad-supported discovery</button>
              {view === 'search' && <span className="rc-search-info">Title search across all availability types. Each title must be checked separately.</span>}
              <button className="rc-roulette" onClick={roulette} disabled={loading || items.length === 0}>✳ Movie night roulette</button>
            </div>
            {view === 'browse' && <div className="rc-genres"><span>GENRE</span><select aria-label="Filter catalog by genre" value={genre ?? ''} onChange={(e) => { setGenre(e.target.value ? Number(e.target.value) : null); setPage(1) }}><option value="">Any genre</option>{genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select><span className="rc-genre-disclaimer">Filtered using reported free / ad-supported providers in {region}.</span></div>}
          </div>
          <div className="rc-result-head"><div><span className="eyebrow">{view === 'browse' ? 'REPORTED FREE STREAMING' : 'ALL TITLE RESULTS'}</span><h2>{view === 'browse' ? 'Now in the mix.' : 'Search results.'}</h2></div><span className="rc-result-count">{loading ? 'SEARCHING…' : items.length + ' TITLES'} {lastUpdated && !loading && ' · Updated ' + new Date(lastUpdated).toLocaleTimeString()}</span></div>
          {error && <div className="rc-notice rc-error" role="alert">{error} <button onClick={() => { setToken(''); setError('') }}>Reconnect</button></div>}
          {loading && <div className="rc-status" role="status">Scanning the catalog…</div>}
          {!loading && !error && items.length === 0 && <div className="rc-status">No titles returned. Try another genre, viewing region, or search.</div>}
          {!loading && <div className="rc-title-grid">{items.map((item) => <article className="rc-title-card" key={cardKey(item)}><button onClick={() => showDetails(item)} aria-label={'See details and viewing options for ' + item.title}><div className="rc-poster">{posterUrl(item.posterPath) ? <img src={posterUrl(item.posterPath) ?? ''} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className="rc-no-poster">REEL<br/>COMMONS</span>}<span className="rc-poster-arrow" aria-hidden="true">↗</span></div><div className="rc-card-copy"><h3>{item.title}</h3><p>{item.year} · {item.mediaType === 'movie' ? 'Movie' : 'TV'} {item.rating ? ' · ★ ' + item.rating.toFixed(1) : ''}</p></div></button>{saved.has(cardKey(item)) && <span className="rc-saved-tag">✓ Saved</span>}</article>)}</div>}
          {!loading && !error && totalPages > 1 && <div className="rc-pages"><button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Previous</button><span>Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next →</button></div>}
          <p className="rc-coverage-note">Catalog browsing uses TMDB's reported free and ad-supported availability. Individual provider reports may be incomplete, delayed, or out of date. Viewing may require ads or additional eligibility. No streaming is hosted here.</p>
        </>
      )}

      <div className="rc-attribution">
        <div className="rc-credits-title">DATA & AVAILABILITY CREDITS</div>
        <div className="rc-credits-body"><a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" aria-label="The Movie Database"><img src={OFFICIAL_TMDB_LOGO} alt="TMDB logo" width="62" height="46" /></a><p>This product uses the TMDB API but is not endorsed or certified by TMDB. Posters and film metadata come from TMDB. Viewing-provider information is provided by <a href="https://www.justwatch.com/" target="_blank" rel="noopener noreferrer">JustWatch</a> through TMDB. ReelCommons is independent of both.</p></div>
      </div>

      {selected && <div className="rc-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null) }}>
        <div className="rc-modal" role="dialog" aria-modal="true" aria-labelledby="rc-dialog-title" ref={dialogRef} tabIndex={-1}>
          <button className="rc-modal-close" aria-label="Close title details" onClick={() => setSelected(null)}>✕</button>
          <div className="rc-modal-top">
            <div className="rc-modal-poster">{posterUrl(selected.posterPath, 'w500') ? <img src={posterUrl(selected.posterPath, 'w500') ?? ''} alt={'Poster for ' + selected.title} /> : <span>NO POSTER</span>}</div>
            <div className="rc-modal-copy">
              <div className="eyebrow">MOVIE-NIGHT DOSSIER / TMDB</div>
              <h2 id="rc-dialog-title">{selected.title}</h2>
              <div className="rc-modal-meta">{selected.year} · {selected.mediaType === 'movie' ? 'Movie' : 'TV series'} {selected.rating ? ' · ★ ' + selected.rating.toFixed(1) + '/10' : ''} {details?.runtime ? ' · ' + details.runtime + ' min' : ''}</div>
              {selectedGenres && <p className="rc-modal-genres">{selectedGenres}</p>}
              <p className="rc-synopsis">{selected.overview || 'A synopsis is not currently available.'}</p>
              <div className="rc-modal-actions"><button className="btn btn-primary" disabled={isSaved} onClick={() => onSave(selected)}>{isSaved ? '✓ In watchlist' : '+ Save to watchlist'}</button><button className="btn btn-outline" onClick={() => { setSelected(null); onOpenWatchlist() }}>My list ↗</button>{details?.trailerUrl && <a className="btn btn-outline" href={details.trailerUrl} target="_blank" rel="noopener noreferrer">Official trailer ↗</a>}</div>
            </div>
          </div>
          {detailLoading && <p className="rc-status" role="status">Loading cast and regional availability…</p>}
          {detailError && <p className="rc-error" role="alert">{detailError}</p>}
          {details && <div className="rc-modal-lower">
            <div className="rc-modal-section"><h3>Cast</h3>{details.cast.length ? <p>{details.cast.map((p) => p.name).join(' · ')}</p> : <p>No cast credits returned.</p>}</div>
            <div className="rc-modal-section"><h3>Where to watch in {REGIONS.find((r) => r.code === region)?.name ?? region}</h3>
              {availability?.error ? <p role="status">{availability.error} Do not assume it is unavailable.</p> :
                hasOptions ? <><p className="rc-watch-caption">Reported by JustWatch via TMDB · Checked {availability ? new Date(availability.checkedAt).toLocaleString() : ''}</p>
                  {availability && availability.free.length > 0 && <div className="rc-provider-list"><strong>REPORTED FREE</strong><div>{availability.free.map((p) => <span key={p.provider_id}>{p.provider_name}</span>)}</div></div>}
                  {availability && availability.ads.length > 0 && <div className="rc-provider-list"><strong>REPORTED WITH ADS</strong><div>{availability.ads.map((p) => <span key={p.provider_id}>{p.provider_name}</span>)}</div></div>}
                </> : <p>No free/ad-supported options reported for this region at the last check. That is not proof of unavailability.</p>}
              <p className="rc-watch-caption">TMDB provides regional provider names but not direct service playback links. Confirm current cost, entitlement, ads, and title availability before viewing.</p>
              <div className="rc-modal-links">{availability?.link && <a className="btn btn-outline" target="_blank" rel="noopener noreferrer" href={availability.link}>View provider links on TMDB ↗</a>}<a className="btn btn-outline" target="_blank" rel="noopener noreferrer" href={tmdbTitleUrl(selected)}>Open title on TMDB ↗</a></div>
              <p className="rc-provider-credit">Streaming availability data: <a href="https://www.justwatch.com/" target="_blank" rel="noopener noreferrer">JustWatch</a> via TMDB.</p>
            </div>
          </div>}
        </div>
      </div>}
    </section>
  )
}
