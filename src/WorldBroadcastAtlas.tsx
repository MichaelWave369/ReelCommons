import { useEffect, useMemo, useRef, useState } from 'react'
import {
  WORLD_BROADCAST_FAVORITES_KEY, filterBroadcastChannels, loadBroadcastCatalog,
  loadBroadcastGuideCoverage, readBroadcastFavorites, toggleBroadcastFavorite,
} from './worldBroadcast'
import type { BroadcastCatalog, BroadcastChannel } from './worldBroadcast'
import WorldTvPassport from './WorldTvPassport'
import './world-broadcast.css'

const PAGE_SIZE = 24
const fmt = (value: number) => value.toLocaleString('en-US')
const labelFor = (id: string, options: readonly { id: string; label: string }[]): string =>
  options.find((option) => option.id === id)?.label ?? id

/**
 * World Broadcast Atlas is a separate, opt-in directory. Its metadata never
 * joins CHANNEL_LINEUP, playableUrl(), M3U inspector, Couch Mode, or a player.
 */
export default function WorldBroadcastAtlas() {
  const [catalog, setCatalog] = useState<BroadcastCatalog | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('')
  const [category, setCategory] = useState('')
  const [language, setLanguage] = useState('')
  const [saved, setSaved] = useState<string[]>([])
  const [savedOnly, setSavedOnly] = useState(false)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [guideStatus, setGuideStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [guideCoverage, setGuideCoverage] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState('')
  const catalogAbort = useRef<AbortController | null>(null)
  const guideAbort = useRef<AbortController | null>(null)

  useEffect(() => () => {
    catalogAbort.current?.abort()
    guideAbort.current?.abort()
  }, [])

  const filtered = useMemo(() => filterBroadcastChannels(
    catalog?.channels ?? [], query, country, category, language, saved, savedOnly,
  ), [catalog, query, country, category, language, saved, savedOnly])
  const shown = filtered.slice(0, limit)

  function resetFilters() {
    setQuery(''); setCountry(''); setCategory(''); setLanguage('')
    setSavedOnly(false); setLimit(PAGE_SIZE)
  }
  async function loadDirectory() {
    catalogAbort.current?.abort()
    guideAbort.current?.abort()
    const controller = new AbortController()
    catalogAbort.current = controller
    setStatus('loading'); setError(''); setNotice('')
    setGuideStatus('idle'); setGuideCoverage(new Set())
    try {
      const data = await loadBroadcastCatalog(controller.signal)
      if (controller.signal.aborted) return
      setCatalog(data)
      setSaved(readBroadcastFavorites(
        (() => { try { return localStorage.getItem(WORLD_BROADCAST_FAVORITES_KEY) } catch { return null } })(),
        data.channels,
      ))
      resetFilters()
      setStatus('ready')
    } catch (cause) {
      if (controller.signal.aborted) return
      setStatus('error')
      setError(cause instanceof Error ? cause.message : 'Could not load the external index.')
    }
  }
  async function loadGuideIndex() {
    if (!catalog) return
    guideAbort.current?.abort()
    const controller = new AbortController()
    guideAbort.current = controller
    setGuideStatus('loading')
    try {
      const indexed = await loadBroadcastGuideCoverage(controller.signal, catalog.channels)
      if (controller.signal.aborted) return
      setGuideCoverage(indexed)
      setGuideStatus('ready')
    } catch {
      if (!controller.signal.aborted) setGuideStatus('error')
    }
  }
  function favorite(channel: BroadcastChannel) {
    const next = toggleBroadcastFavorite(saved, channel.id)
    if (next.length === saved.length && !saved.includes(channel.id)) {
      setNotice('Favorites are limited to 80 channel IDs on this browser.')
      return
    }
    setSaved(next)
    try { localStorage.setItem(WORLD_BROADCAST_FAVORITES_KEY, JSON.stringify(next)) }
    catch { setNotice('Browser storage unavailable. Favorites last only for this visit.') }
  }

  return <section className="wba" aria-labelledby="wba-title">
    <div className="wba-heading">
      <div>
        <span className="wba-kicker">RCTV 2.2 / WORLD BROADCAST ATLAS</span>
        <h2 id="wba-title">A world of channels.<br /><em>One directory.</em></h2>
        <p>Explore global broadcasters by country, language and category with metadata indexed by IPTV-org. Open each broadcaster's official site to see viewing options, restrictions and schedules.</p>
      </div>
      <div className="wba-globe" aria-hidden="true"><span>◉</span><strong>WORLD<br />TV</strong></div>
    </div>
    <div className="wba-policy">
      <strong>DIRECTORY ONLY · NO AUTOMATIC PLAYBACK</strong>
      <p>IPTV-org's public index is not proof that a channel is free, currently live, authorized for embedding, or available in your region. We never download stream playlists, logos, videos, or subscriber credentials. The existing 50 reviewed RCTV channels and Couch Mode remain separate.</p>
    </div>
    {status !== 'ready' && <div className="wba-start">
      <div>
        <strong>Explore the international broadcaster index</strong>
        <p>Nothing is fetched until you click. This makes five CORS metadata requests to <code>iptv-org.github.io</code>, which receives your IP address as with any website request. The catalog is held in this tab; no viewing history is collected.</p>
      </div>
      <button type="button" onClick={loadDirectory} disabled={status === 'loading'}>
        {status === 'loading' ? 'Loading metadata…' : status === 'error' ? 'Retry directory load' : 'Load World TV Directory'}
      </button>
      {status === 'error' && <p className="wba-error" role="alert">Could not load the channel directory: {error}. Please retry later. No fallback stream URLs are attempted.</p>}
    </div>}
    {catalog && status === 'ready' && <>
      <div className="wba-totals" role="status">
        <span><strong>{fmt(catalog.channels.length)}</strong> indexed official sites</span>
        <span><strong>{fmt(catalog.countries.length)}</strong> countries in source index</span>
        <span><strong>{fmt(saved.length)}</strong> saved stations</span>
        <button type="button" onClick={loadDirectory}>↻ Refresh metadata</button>
      </div>
      <div className="wba-filters" role="group" aria-label="Filter worldwide broadcasters">
        <label>FIND A STATION
          <input type="search" maxLength={100} placeholder="Station name, ID or genre" value={query}
            onChange={(event) => { setQuery(event.target.value); setLimit(PAGE_SIZE) }} />
        </label>
        <label>COUNTRY
          <select value={country} onChange={(event) => { setCountry(event.target.value); setLimit(PAGE_SIZE) }}>
            <option value="">All countries</option>
            {catalog.countries.map((option) => <option key={option.id} value={option.id}>{option.label} ({option.id})</option>)}
          </select>
        </label>
        <label>CATEGORY
          <select value={category} onChange={(event) => { setCategory(event.target.value); setLimit(PAGE_SIZE) }}>
            <option value="">All categories</option>
            {catalog.categories.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </label>
        <label>LANGUAGE
          <select value={language} onChange={(event) => { setLanguage(event.target.value); setLimit(PAGE_SIZE) }}>
            <option value="">All indexed languages</option>
            {catalog.languages.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </label>
        <div className="wba-filter-actions">
          <button type="button" className={savedOnly ? 'is-active' : ''} aria-pressed={savedOnly}
            onClick={() => { setSavedOnly(!savedOnly); setLimit(PAGE_SIZE) }}>★ Favorites only</button>
          <button type="button" onClick={resetFilters}>Clear filters</button>
        </div>
      </div>
      <WorldTvPassport channels={filtered} allChannels={catalog.channels} countries={catalog.countries} />
      <div className="wba-guide">
        <div><strong>PROGRAM GUIDE SOURCE INDEX</strong>
          <p>Optional IPTV-org EPG metadata lookup. An indexed guide source does <b>not</b> mean that current listings were downloaded, verified, or licensed for republishing.</p>
        </div>
        {guideStatus !== 'ready' && <button type="button" disabled={guideStatus === 'loading'} onClick={loadGuideIndex}>
          {guideStatus === 'loading' ? 'Checking guide index…' : guideStatus === 'error' ? 'Retry guide index' : 'Check EPG coverage'}
        </button>}
        {guideStatus === 'ready' && <span className="wba-guide-count">{fmt(guideCoverage.size)} channels have listed guide sources</span>}
        {guideStatus === 'error' && <p role="alert">Guide index unavailable. Directory browsing still works.</p>}
      </div>
      {notice && <p className="wba-notice" role="status">{notice} <button type="button" onClick={() => setNotice('')}>Dismiss</button></p>}
      <p className="wba-results" aria-live="polite">{fmt(filtered.length)} matching channel destinations · Showing {fmt(shown.length)}. Source metadata is unverified for availability.</p>
      {shown.length > 0 ? <div className="wba-grid" aria-label="Worldwide broadcaster directory">
        {shown.map((channel) => <article className="wba-card" key={channel.id}>
          <div className="wba-card-top">
            <span>{labelFor(channel.country, catalog.countries)} · {channel.country}</span>
            <button type="button" onClick={() => favorite(channel)} aria-pressed={saved.includes(channel.id)}
              aria-label={(saved.includes(channel.id) ? 'Remove ' : 'Save ') + channel.name + ' favorite'}>
              {saved.includes(channel.id) ? '★ Saved' : '☆ Save'}
            </button>
          </div>
          <h3>{channel.name}</h3>
          <div className="wba-tags">
            {channel.categories.slice(0, 3).map((id) => <span key={id}>{labelFor(id, catalog.categories)}</span>)}
            {channel.languages.slice(0, 3).map((id) => <span key={id}>{labelFor(id, catalog.languages)}</span>)}
            {guideStatus === 'ready' && guideCoverage.has(channel.id) && <span>Guide source indexed</span>}
          </div>
          <div className="wba-card-bottom">
            <span title={channel.id}>IPTV-org ID: {channel.id}</span>
            <a href={channel.officialUrl} target="_blank" rel="noopener noreferrer">Visit official broadcaster ↗</a>
          </div>
        </article>)}
      </div> : <div className="wba-empty">No indexed official broadcaster websites match these filters. Try another country, category or language.</div>}
      {shown.length < filtered.length && <button className="wba-more" type="button" onClick={() => setLimit((count) => count + PAGE_SIZE)}>Show more ({fmt(filtered.length - shown.length)} remaining)</button>}
      <p className="wba-footer">Source: <a href="https://github.com/iptv-org/api" target="_blank" rel="noopener noreferrer">IPTV-org public API</a> and <a href="https://github.com/iptv-org/database" target="_blank" rel="noopener noreferrer">community database</a>. This index displays selected metadata only. Names and channel websites belong to their respective operators. Every external player controls its own terms, cost, region and availability.</p>
    </>}
  </section>
}
