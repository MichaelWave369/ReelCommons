import { useEffect, useMemo, useRef, useState } from 'react'
import { posterUrl, tmdbTitleUrl } from './tmdb'
import type { MediaType, TitleCard } from './tmdb'
import { ageOfSnapshot, parsePublicSnapshot, visiblePublicTitles } from './publicCatalog'
import type { PublicSnapshot, PublicTitle } from './publicCatalog'
import Discovery from './Discovery'
import './public-catalog.css'

interface Props {
  savedKeys: string[]
  onSave: (item: TitleCard) => void
  onOpenWatchlist: () => void
}

const SOURCE_LOGO = 'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg'

export default function PublicCatalog({ savedKeys, onSave, onOpenWatchlist }: Props) {
  const [mode, setMode] = useState<'public' | 'live'>('public')
  const [snapshot, setSnapshot] = useState<PublicSnapshot | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [region, setRegion] = useState('US')
  const [mediaType, setMediaType] = useState<MediaType | 'all'>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<PublicTitle | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(import.meta.env.BASE_URL + 'data/catalog.json', { signal: controller.signal, cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error('Public catalog could not be downloaded.'); return r.json() as Promise<unknown> })
      .then((data) => { if (!controller.signal.aborted) setSnapshot(parsePublicSnapshot(data)) })
      .catch((e: unknown) => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Failed to load the public catalog.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  const titles = useMemo(() => visiblePublicTitles(snapshot?.records ?? [], { query, region, mediaType }), [snapshot, query, region, mediaType])
  const saved = useMemo(() => new Set(savedKeys), [savedKeys])
  const age = ageOfSnapshot(snapshot?.generatedAt ?? null)
  const chosenProviders = selected?.availabilityByRegion[region]
  const availableLabel = (p: string) => p === 'US' ? 'United States' : p === 'CA' ? 'Canada' : p === 'GB' ? 'United Kingdom' : p === 'AU' ? 'Australia' : p

  useEffect(() => {
    if (!selected) return
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    triggerRef.current = trigger
    const before = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setSelected(null); return }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled])')).filter((element) => element.getClientRects().length > 0)
      if (!focusable.length) { event.preventDefault(); return }
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = before; window.removeEventListener('keydown', onKey); triggerRef.current?.focus() }
  }, [selected])

  const choose = () => {
    if (!titles.length) return
    const unSaved = titles.filter((title) => !saved.has('tmdb-' + title.mediaType + '-' + title.id))
    const options = unSaved.length ? unSaved : titles
    setSelected(options[Math.floor(Math.random() * options.length)])
  }

  return <>
    <div className="rc-public-mode wrap" role="group" aria-label="Catalog data source">
      <div><span className="rc-public-tag">THE SCREEN ROOM / v0.3</span><h2>Everyone gets <em>a seat.</em></h2></div>
      <div className="rc-mode-switch">
        <button className={mode === 'public' ? 'active' : ''} aria-pressed={mode === 'public'} onClick={() => setMode('public')}>Public catalog <span>No login</span></button>
        <button className={mode === 'live' ? 'active' : ''} aria-pressed={mode === 'live'} onClick={() => setMode('live')}>Advanced live search <span>Optional token</span></button>
      </div>
    </div>
    {mode === 'live' ? <Discovery savedKeys={savedKeys} onSave={onSave} onOpenWatchlist={onOpenWatchlist} /> :
      <section className="rc-public wrap">
        <div className="rc-public-hero">
          <span className="eyebrow">FREE STREAMING / CURATED SNAPSHOT</span>
          <h1>A world of stories.<br /><em>Zero hoops.</em></h1>
          <p>Explore a small selection of movies and shows reported free or ad-supported in your region. No account, API token, or paid ReelCommons subscription.</p>
          <div className="rc-public-note">
            {snapshot?.generatedAt ? <><span className={age?.stale ? 'rc-stale' : 'rc-fresh'}>{age?.stale ? 'OLDER SNAPSHOT' : 'CATALOG SNAPSHOT'}</span><span>Checked {new Date(snapshot.generatedAt).toLocaleString()}{age?.stale ? ' · Provider data may be outdated' : ''}</span></> : <span>Awaiting first successful catalog refresh</span>}
          </div>
        </div>
        <div className="rc-public-controls">
          <label>YOUR REGION<select value={region} onChange={(e) => setRegion(e.target.value)}>{(snapshot?.regions ?? ['US','CA','GB','AU']).map((code) => <option key={code} value={code}>{availableLabel(code)}</option>)}</select></label>
          <label>SHOW ME<select value={mediaType} onChange={(e) => setMediaType(e.target.value as MediaType | 'all')}><option value="all">Movies & TV</option><option value="movie">Movies</option><option value="tv">TV series</option></select></label>
          <label className="rc-public-search">FIND A STORY<input aria-label="Search the public catalog" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={80} placeholder="Search titles or genres..." /></label>
          <button className="rc-public-roulette" onClick={choose} disabled={titles.length === 0}>✳ Surprise me</button>
        </div>

        <div className="rc-public-results"><div><span className="eyebrow">PUBLIC COLLECTION / 001</span><h2>Tonight's possibilities.</h2></div><span>{titles.length} REPORTED TITLES</span></div>
        {loading && <div className="rc-public-empty" role="status">Loading the public catalog…</div>}
        {error && <div className="rc-public-empty" role="alert">{error} The original free-source directory still works without the catalog.</div>}
        {!loading && !error && snapshot?.records.length === 0 && <div className="rc-public-empty"><span aria-hidden="true">◎</span><h3>The public catalog is waiting for its first screening.</h3><p>The site owner must configure the private GitHub Actions TMDB token and run the Pages deployment. Until then, visit the free-source directory or use Advanced live search with your own token.</p></div>}
        {!loading && !error && (snapshot?.records.length ?? 0) > 0 && titles.length === 0 && <div className="rc-public-empty">No titles in this small snapshot match your filters. Try a different region or search. This is not proof that nothing is available to watch.</div>}
        {titles.length > 0 && <div className="rc-public-grid">{titles.map((item) => {
          const key = 'tmdb-' + item.mediaType + '-' + item.id
          const poster = posterUrl(item.posterPath)
          const availability = item.availabilityByRegion[region]
          return <article key={key} className="rc-public-card"><button onClick={() => setSelected(item)} aria-label={'Explore viewing options for ' + item.title}>
            <div className="rc-public-poster">{poster ? <img src={poster} alt="" loading="lazy" /> : <span>REEL<br/>COMMONS</span>}<span className="rc-public-postertag">{availability?.free?.length ? 'REPORTED FREE' : 'WITH ADS'}</span></div>
            <div className="rc-public-cardbody"><h3>{item.title}</h3><p>{item.year} · {item.mediaType === 'movie' ? 'Movie' : 'Series'}{item.rating ? ' · ★ ' + item.rating.toFixed(1) : ''}</p></div>
          </button>{saved.has(key) && <span className="rc-public-saved">✓ Saved</span>}</article>
        })}</div>}
        <div className="rc-public-disclaimer"><strong>Availability is a dated report, not a guarantee.</strong> Movie and TV rights change; provider information comes from JustWatch through TMDB. Titles here are a sampled selection, not a comprehensive search. Always confirm eligibility, ads and playback on the source service.</div>
        <div className="rc-public-attribution"><a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer"><img src={SOURCE_LOGO} width="60" height="44" alt="TMDB logo" /></a><p>This product uses the TMDB API but is not endorsed or certified by TMDB. Movie information and images are from TMDB. Availability information is from <a href="https://www.justwatch.com/" target="_blank" rel="noopener noreferrer">JustWatch</a> via TMDB.</p></div>
      </section>}

    {mode === 'public' && selected && <div className="rc-public-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}>
      <div className="rc-public-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="rc-public-dialog-title" tabIndex={-1}>
        <button className="rc-public-close" onClick={() => setSelected(null)} aria-label="Close title information">✕</button>
        <div className="rc-public-modal-top">
          {posterUrl(selected.posterPath, 'w500') ? <img className="rc-public-modal-poster" src={posterUrl(selected.posterPath, 'w500') ?? ''} alt={'Poster for ' + selected.title} /> : null}
          <div><span className="eyebrow">THE MOVIE NIGHT DOSSIER</span><h2 id="rc-public-dialog-title">{selected.title}</h2><div className="rc-public-meta">{selected.year} · {selected.mediaType === 'movie' ? 'Movie' : 'TV series'} {selected.runtime ? ' · ' + selected.runtime + ' min' : ''} {selected.rating ? ' · ★ ' + selected.rating.toFixed(1) : ''}</div><p>{selected.genres?.map((g) => g.name).join(' · ')}</p><p className="rc-public-description">{selected.overview || 'No synopsis is available.'}</p><div className="rc-public-modal-actions"><button className="btn btn-primary" onClick={() => onSave(selected)} disabled={saved.has('tmdb-' + selected.mediaType + '-' + selected.id)}>{saved.has('tmdb-' + selected.mediaType + '-' + selected.id) ? '✓ Saved' : '+ Add to watchlist'}</button>{selected.trailerUrl && <a className="btn btn-outline" href={selected.trailerUrl} target="_blank" rel="noopener noreferrer">Official trailer ↗</a>}</div></div>
        </div>
        <div className="rc-public-modal-info">
          {selected.cast.length > 0 && <div><h3>Featuring</h3><p>{selected.cast.map((p) => p.name).join(' · ')}</p></div>}
          <h3>Where to watch · {availableLabel(region)}</h3>
          <div className="rc-public-provider-list">{chosenProviders?.free?.length ? <div><strong>REPORTED FREE</strong><p>{chosenProviders.free.map((p) => p.provider_name).join(' · ')}</p></div> : null}{chosenProviders?.ads?.length ? <div><strong>REPORTED WITH ADS</strong><p>{chosenProviders.ads.map((p) => p.provider_name).join(' · ')}</p></div> : null}</div>
          <p>Report last checked {chosenProviders ? new Date(chosenProviders.checkedAt).toLocaleString() : 'at snapshot publication'}. Streaming availability is provided by JustWatch through TMDB; this snapshot does not verify today's availability.</p>
          <div className="rc-public-modal-actions">{chosenProviders?.link && <a className="btn btn-primary" href={chosenProviders.link} target="_blank" rel="noopener noreferrer">View links on TMDB ↗</a>}<a className="btn btn-outline" href={tmdbTitleUrl(selected)} target="_blank" rel="noopener noreferrer">Open movie details ↗</a><button className="btn btn-outline" onClick={() => { setSelected(null); onOpenWatchlist() }}>My watchlist →</button></div>
          <p className="rc-public-provider-credit">Availability source: <a href="https://www.justwatch.com/" target="_blank" rel="noopener noreferrer">JustWatch</a> via TMDB. These links are not direct playback URLs.</p>
        </div>
      </div>
    </div>}
  </>
}
