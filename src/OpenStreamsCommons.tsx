import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  CAMERA_FORMAT_LABELS, CAMERA_SCENE_FILTERS, COMMONS_FAVORITES_KEY, filterCameraScene,
  filterOpenStreams, playableUrl, playbackLabel, readCommonsFavorites, STREAM_CATEGORIES,
} from './openStreams'
import type { CameraScene, OpenStream, StreamCategory } from './openStreams'
import { ALL_OPEN_STREAMS, CAMERA_COUNTS } from './cameraCatalog'
import { COAST_RAIL_COUNTS } from './coastRailCatalog'
import WorldTour from './WorldTour'
import WorldAtlas from './WorldAtlas'
import WorldBroadcastAtlas from './WorldBroadcastAtlas'
import ReviewedPlaybackBridge from './ReviewedPlaybackBridge'
import SourceCertificationLab from './SourceCertificationLab'
import ChannelSurfRemote from './ChannelSurfRemote'
import CouchMode from './CouchMode'
import {CHANNEL_SURF_STORAGE_KEY,readChannelSurfState,serializeChannelSurfState} from './channelSurf'
import { inspectLocalM3u, MAX_PLAYLIST_BYTES } from './m3uInspection'
import type { PlaylistInspection } from './m3uInspection'
import './open-streams.css'

function initialChannelSelection(): string {
  try {return readChannelSurfState(window.localStorage.getItem(CHANNEL_SURF_STORAGE_KEY)).lastId ?? 'nasa-iss'}
  catch {return 'nasa-iss'}
}
function initialFavorites(): string[] {
  try { return readCommonsFavorites(window.localStorage.getItem(COMMONS_FAVORITES_KEY), ALL_OPEN_STREAMS) }
  catch { return [] }
}
const categoryNames: Record<StreamCategory, string> = {
  tv: 'LIVE TV', radio: 'INTERNET RADIO', earth: 'LIVE EARTH', space: 'SPACE & SCIENCE', city: 'CITY CAMS', nature: 'NATURE CAMS', beach: 'BEACH CAMS', harbor: 'HARBOR CAMS', train: 'TRAIN CAMS', mountain: 'MOUNTAIN CAMS',
}
export default function OpenStreamsCommons({ onOpenLiveTV }: { onOpenLiveTV: () => void }) {
  const [category, setCategory] = useState<StreamCategory | 'all'>('all')
  const [query, setQuery] = useState('')
  const [cameraScene, setCameraScene] = useState<CameraScene | 'all'>('all')
  const [favorites, setFavorites] = useState<string[]>(initialFavorites)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [selectedId, setSelectedId] = useState(initialChannelSelection)
  const [mediaLoadedFor, setMediaLoadedFor] = useState<string | null>(null)
  const [bridgeResetToken, setBridgeResetToken] = useState(0)
  const [notice, setNotice] = useState('')
  const [playlistReport, setPlaylistReport] = useState<PlaylistInspection | null>(null)
  const [playlistError, setPlaylistError] = useState('')
  const [playlistName, setPlaylistName] = useState('')
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [couchOpen, setCouchOpen] = useState(false)
  const couchLaunchRef = useRef<HTMLButtonElement>(null)

  const visible = useMemo(() =>
    filterCameraScene(filterOpenStreams(ALL_OPEN_STREAMS, category, query, favorites, favoritesOnly), cameraScene),
  [category, query, favorites, favoritesOnly, cameraScene])
  const selected = ALL_OPEN_STREAMS.find((item) => item.id === selectedId) ?? ALL_OPEN_STREAMS[0]
  const allowedMediaUrl = playableUrl(selected)
  const mediaOn = mediaLoadedFor === selected.id && allowedMediaUrl !== null
  const officialUrl = selected.officialUrl

  function selectSource(source: OpenStream, scrollToPlayer = true) {
    setSelectedId(source.id)
    const saved = serializeChannelSurfState(source.id)
    if(saved)try {window.localStorage.setItem(CHANNEL_SURF_STORAGE_KEY,saved)} catch {/* Session selection still works */}
    setMediaLoadedFor(null) // Unmount iframes and native audio when switching channels.
    setBridgeResetToken((token) => token + 1) // Any original desk selection unloads the bridge.
    setNotice('')
    if (scrollToPlayer) document.getElementById('osc-player')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
  function closeCouchMode() {
    setCouchOpen(false)
    window.setTimeout(() => couchLaunchRef.current?.focus(), 0)
  }
  function toggleFavorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id]
    setFavorites(next)
    try { window.localStorage.setItem(COMMONS_FAVORITES_KEY, JSON.stringify(next)) }
    catch { setNotice('Browser storage is unavailable. Favorites will last for this visit only.') }
  }
  function choose() {
    if (!visible.length) return
    const candidates = visible.filter((item) => item.id !== selectedId)
    const roster = candidates.length ? candidates : visible
    selectSource(roster[Math.floor(Math.random() * roster.length)])
  }
  async function readM3u(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPlaylistError(''); setPlaylistReport(null); setPlaylistName('')
    if (file.size > MAX_PLAYLIST_BYTES) {
      setPlaylistError('Playlist exceeds the 96 KB metadata-preview limit.')
      return
    }
    try {
      const report = inspectLocalM3u(await file.text())
      setPlaylistReport(report)
      setPlaylistName(file.name.slice(0, 110))
    } catch (cause) { setPlaylistError(cause instanceof Error ? cause.message : 'Could not inspect the M3U index.') }
  }
  function loadSampleM3u() {
    setPlaylistError('')
    setPlaylistName('Generated metadata-only M3U example')
    setPlaylistReport(inspectLocalM3u(
      '#EXTM3U\n#EXTINF:-1,Sample community station\nhttps://radio.example.org/listen.mp3\n' +
      '#EXTINF:-1,Sample educational stream\nhttps://video.example.org/live/index.m3u8\n',
    ))
    setShowPlaylist(true)
  }
  return <section className="osc-page wrap" aria-labelledby="osc-heading">
    {couchOpen && <CouchMode selected={selected} favoriteIds={favorites}
      onSelect={(source) => selectSource(source, false)} onClose={closeCouchMode} />}
    <div className="eyebrow">THE COMMON SCREEN / RCTV v2.6 · OPEN STREAMS COMMONS</div>
    <div className="osc-hero">
      <div className="osc-hero-copy">
        <span className="osc-overline"><span className="osc-signal" /> LEGITIMATE CHANNELS · ENDLESS CURIOSITY</span>
        <h1 id="osc-heading">The whole world.<br/><em>One channel away.</em></h1>
        <p>Explore official free television, internet radio, bustling city cams, national parks, wildlife, volcanoes, ocean habitats and space missions. Discover freely. Watch through supported official players. No mystery IPTV lists, copied streams or sign-up here.</p>
        <div className="osc-stat-line"><span><strong>{ALL_OPEN_STREAMS.length}</strong> Curated destinations</span><span><strong>10</strong> Commons wings</span><span><strong>0</strong> Rebroadcast servers</span></div>
      </div>
      <div className="osc-hero-art" aria-hidden="true">
        <div className="osc-planet"><span>◎</span></div>
        <strong>RCTV<span>OPEN</span></strong>
        <small>TV · RADIO · CITIES · COAST · RAIL · MOUNTAINS · SPACE</small>
      </div>
    </div>
    <div className="osc-honesty"><strong>FREE TO WATCH ≠ FREE TO REBROADCAST.</strong> Sources below link to the original owners. Media is never fetched, proxied, redistributed or recorded by RCTV. Where no reviewed embed or broadcaster-published listening link exists, the official website is the player. Live availability is not monitored and may change.</div>
    <section className="couch-launch" aria-label="Launch RCTV lean-back television interface">
      <div><span className="couch-launch-label">NEW · RCTV 2.0 · THE BIG SCREEN</span>
        <strong>Kick back. Channel surf. Explore the world.</strong>
        <p>Open our lean-back Couch Mode, designed for a television-size screen, large controls, and a guide to all 50 curated official destinations.</p></div>
      <button type="button" ref={couchLaunchRef} onClick={() => {setMediaLoadedFor(null);setBridgeResetToken((token) => token + 1);setCouchOpen(true)}}>▣ Launch Couch Mode ↗</button>
    </section>

    <div className="osc-category-bar" role="group" aria-label="Open Streams categories">
      {STREAM_CATEGORIES.map((choice) => <button type="button" key={choice.id} className={category === choice.id ? 'active' : ''} aria-pressed={category === choice.id} onClick={() => { setCategory(choice.id); setCameraScene('all') }}>
        <span aria-hidden="true">{choice.icon}</span>{choice.label}<small>{choice.id === 'all' ? ALL_OPEN_STREAMS.length : ALL_OPEN_STREAMS.filter((s) => s.category === choice.id).length}</small>
      </button>)}
    </div>

    <section className="osc-cam-discovery" aria-label="City and nature camera overview">
      <div><span className="osc-kicker">NEW · CITY & NATURE PASSPORT</span><strong>{CAMERA_COUNTS.cities} city windows · {CAMERA_COUNTS.nature} nature stations</strong><p>Walk the cities, visit a national park, watch a volcano or drift into an aquarium. Camera types are labeled: video, refreshed stills, or mixed schedules. No claim that every feed is live right now.</p></div>
      <div className="osc-cam-shortcuts">
        <button type="button" onClick={() => {setCategory('city');setCameraScene('all');setFavoritesOnly(false);setQuery('')}}>▤ Explore city cams</button>
        <button type="button" onClick={() => {setCategory('nature');setCameraScene('all');setFavoritesOnly(false);setQuery('')}}>♧ Explore nature cams</button>
      </div>
    </section>

    <section className="osc-coast-expansion" aria-label="New coastline and railway exploration categories">
      <div>
        <span className="osc-kicker">NEW IN v1.6 · COASTLINES & RAILS</span>
        <strong>{COAST_RAIL_COUNTS.beaches} beaches · {COAST_RAIL_COUNTS.harbors} harbors · {COAST_RAIL_COUNTS.trains} train views · {COAST_RAIL_COUNTS.mountains} mountain viewpoints</strong>
        <p>Explore surf breaks, working ports, public railcams and alpine webcams. Video, still images, schedules and free-versus-premium access are labeled honestly.</p>
      </div>
      <div className="osc-coast-shortcuts">
        {(['beach','harbor','train','mountain'] as const).map((kind) =>
          <button type="button" key={kind} onClick={() => {setCategory(kind);setCameraScene('all');setFavoritesOnly(false);setQuery('')}}>
            {kind === 'beach' ? '≋ Beaches' : kind === 'harbor' ? '⚓ Harbors' : kind === 'train' ? '▣ Trains' : '△ Mountains'}
          </button>)}
      </div>
    </section>
    <WorldAtlas onPreview={selectSource} />
    <WorldTour onPreview={selectSource} />
    <ReviewedPlaybackBridge resetToken={bridgeResetToken} onRequestMediaLoad={() => setMediaLoadedFor(null)} />
    <SourceCertificationLab />
    <WorldBroadcastAtlas />

    <div className="osc-layout">
      <div className="osc-left">
        <section className="osc-control-panel" aria-label="Filter free live destinations">
          <label>SEARCH THE COMMONS<input type="search" maxLength={100} value={query} placeholder="News, wildlife, NASA, music…" onChange={(event) => setQuery(event.target.value)}/></label>
          <div className="osc-filter-actions">
            <button type="button" aria-pressed={favoritesOnly} className={favoritesOnly ? 'active' : ''} onClick={() => setFavoritesOnly((on) => !on)}>★ Saved only ({favorites.length})</button>
            <button type="button" disabled={!visible.length} onClick={choose}>✳ Surprise me</button>
          </div>
          {(['city','nature','beach','harbor','train','mountain'].includes(category) || cameraScene !== 'all') &&
            <div className="osc-scene-picker" role="group" aria-label="Camera viewpoint type">
              {CAMERA_SCENE_FILTERS.map((scene) =>
                <button type="button" key={scene.id} aria-pressed={cameraScene === scene.id}
                  className={cameraScene === scene.id ? 'active' : ''}
                  onClick={() => setCameraScene(scene.id)}>{scene.label}</button>)}
            </div>}
          <p>{visible.length} official destinations match your filters. Selecting a card does not start playback.</p>
        </section>
        <div className="osc-grid" aria-label="Open Streams official channel catalog">
          {visible.map((item) => <article key={item.id} className={'osc-channel osc-tone-' + item.color + (selected.id === item.id ? ' selected' : '')}>
            <button type="button" className="osc-channel-select" aria-pressed={selected.id === item.id} onClick={() => selectSource(item)}>
              <span className="osc-card-header"><span>{categoryNames[item.category]}</span><span>{playbackLabel(item)}</span></span>
               <span className="osc-card-icon" aria-hidden="true">{item.icon}</span>
              {item.cameraFormat && <span className="osc-camera-format">{CAMERA_FORMAT_LABELS[item.cameraFormat]}</span>}
              <strong>{item.name}</strong><span className="osc-card-tagline">{item.tagline}</span>
              <span className="osc-card-tags">{item.place ? item.place + ' · ' : ''}{item.tags.slice(0, item.place ? 1 : 3).join(' · ')}</span>
            </button>
            <div className="osc-card-footer">
              <button type="button" aria-pressed={favorites.includes(item.id)} className={favorites.includes(item.id) ? 'is-favorite' : ''}
                aria-label={(favorites.includes(item.id) ? 'Remove ' : 'Save ') + item.name + ' favorite'}
                onClick={() => toggleFavorite(item.id)}>{favorites.includes(item.id) ? '★ SAVED' : '☆ SAVE'}</button>
              <a href={item.officialUrl} target="_blank" rel="noopener noreferrer" aria-label={'Open official ' + item.name + ' site'}>Official site ↗</a>
            </div>
          </article>)}
        </div>
        {!visible.length && <div className="osc-none"><h3>No channels matched.</h3><p>Try another category or turn off the saved-only filter.</p><button onClick={() => {setCategory('all');setQuery('');setCameraScene('all');setFavoritesOnly(false)}}>Reset channel filters</button></div>}
      </div>

      <div className="osc-right">
        <ChannelSurfRemote selected={selected} favoriteIds={favorites} onSelect={selectSource} />
        <section className="osc-player" id="osc-player" aria-labelledby="osc-player-title">
          <div className="osc-player-header"><div><span className="osc-kicker">THE COMMON SCREEN · CHANNEL DESK</span><h2 id="osc-player-title">{selected.name}</h2><p>{selected.tagline}</p></div><span className="osc-player-category">{categoryNames[selected.category]}</span></div>
          <div className="osc-screen">
            {mediaOn && allowedMediaUrl && selected.playback === 'youtube-embed' ? <iframe
              key={selected.id} src={allowedMediaUrl} title={'Official YouTube player: ' + selected.name}
              allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin" loading="lazy" /> :
            mediaOn && allowedMediaUrl && selected.playback === 'published-audio' ? <div className="osc-audio-screen">
              <span aria-hidden="true">♫</span><strong>Official broadcaster audio</strong>
              <p>You chose to load KEXP’s publicly listed AAC feed. Press Play below; availability and browser support vary.</p>
              <audio key={selected.id} controls preload="none" src={allowedMediaUrl} aria-label="KEXP live broadcaster audio" onError={() => setNotice('Audio failed to load or is unsupported by your browser. Use the official KEXP player below.')} />
            </div> : <div className="osc-standby"><div className="osc-standby-symbol" aria-hidden="true">{selected.icon}</div><strong>{allowedMediaUrl ? 'PRESS TO CONNECT' : 'OFFICIAL PLAYER DESTINATION'}</strong><span>{allowedMediaUrl ? 'Media is not loaded until you activate it.' : 'Playback is available through the broadcaster’s own website.'}</span></div>}
          </div>
          <div className="osc-player-controls">
            {allowedMediaUrl && !mediaOn && <button type="button" className="osc-play-btn" onClick={() => {setBridgeResetToken((token) => token + 1);setMediaLoadedFor(selected.id);setNotice('Loaded the reviewed external player on demand. The broadcaster controls availability and playback.')}}>
              ▶ {selected.playback === 'youtube-embed' ? 'Load official YouTube embed' : 'Load published KEXP audio'}
            </button>}
            {mediaOn && <button type="button" className="osc-stop-btn" onClick={() => {setMediaLoadedFor(null);setNotice('Player unloaded.')}}>■ Stop / unload media</button>}
            <a className="osc-official-btn" href={officialUrl} target="_blank" rel="noopener noreferrer">Open official player ↗</a>
          </div>
          {notice && <div className="osc-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss status">×</button></div>}
          <div className="osc-source-note"><strong>RIGHTS & PLAYBACK LEDGER</strong><p>{selected.playbackNote}</p><p><b>Area:</b> {selected.region}</p>{selected.cameraFormat &&
            <p><b>Camera format:</b> {CAMERA_FORMAT_LABELS[selected.cameraFormat]}. Source-reported type only; not real-time availability verification.</p>}
            {selected.place && <p><b>Viewpoint:</b> {selected.place}</p>}<p><b>Source:</b> {selected.sourceEvidence}</p><p><b>Playback policy:</b> {selected.playback === 'official' ? 'Official destination only' : selected.playback === 'youtube-embed' ? 'Opt-in, platform-supported YouTube embed' : 'Opt-in, publisher-listed audio endpoint'}.</p></div>
          <p className="osc-player-footnote">RCTV cannot confirm this channel is on air right now. Some embeds may be disabled or blocked; the official player link always remains available. No autoplay occurs on channel selection.</p>
        </section>
        <section className="osc-side-note"><h3>Already have a television?</h3><p>RCTV’s existing FAST guide, Living Room Mode and FTA hardware labs are still here. Open them without mixing up internet streams and terrestrial/satellite reception.</p><button type="button" onClick={() => {setMediaLoadedFor(null);onOpenLiveTV()}}>Explore Live TV & FTA ↗</button></section>
      </div>
    </div>
    <section className="osc-playlist-lab" aria-labelledby="osc-playlist-heading">
      <div className="osc-playlist-head"><div><span className="osc-kicker">OPEN PLAYLIST FORMATS / RESEARCH STATION</span><h2 id="osc-playlist-heading">M3U Inspector</h2><p>Inspect a local IPTV channel-index playlist as metadata only. Nothing in this tool connects to, loads or plays a playlist URL.</p></div><button type="button" className="osc-playlist-toggle" aria-expanded={showPlaylist} onClick={() => setShowPlaylist((v) => !v)}>{showPlaylist ? '− Hide inspector' : '+ Open M3U inspector'}</button></div>
      {showPlaylist && <div className="osc-playlist-body">
        <div className="osc-import">
          <label className="osc-import-file"><strong>↑ Import local M3U channel index</strong><span>96 KB max · metadata only · no fetching</span><input type="file" accept=".m3u,.m3u8,audio/x-mpegurl,application/vnd.apple.mpegurl,text/plain" aria-label="Choose local M3U channel index to inspect" onChange={readM3u}/></label>
          <button type="button" onClick={loadSampleM3u}>Try generated M3U example</button>
          <button type="button" onClick={() => {setPlaylistReport(null);setPlaylistName('');setPlaylistError('')}} disabled={!playlistReport}>Clear import</button>
          <p>Unlike a directory, an M3U stream URL alone does not prove rights, validity, or that a broadcaster authorized embedding. HLS segment manifests are rejected; this tool only previews channel indexes.</p>
        </div>
        <div className="osc-inspection">
          {playlistError && <p className="osc-playlist-error" role="alert">{playlistError}</p>}
          {!playlistReport ? <div className="osc-inspection-empty">No index selected. Use the generated example to see the safety checks.</div> :
            <><strong>{playlistName} · {playlistReport.entries.length} PREVIEW ENTRIES</strong>
              <p>Hostnames and format hints only. Stream URLs and credentials are discarded.</p>
              <div className="osc-entry-list">{playlistReport.entries.map((entry) => <div key={entry.id}><span>{entry.name}</span><small>{entry.originHost} · {entry.streamFormatHint}</small></div>)}</div>
              <div className="osc-playlist-warnings">{playlistReport.warnings.map((warning, i) => <p key={i}>{warning}</p>)}</div>
            </>}
        </div>
      </div>}
    </section>
    <div className="osc-bottom">Source collection reflects reviewed official destinations, not real-time channel availability. Third-party logos, video, audio and trademarks remain with their owners. Future additions need documented playback permission and an auditable source ledger. The existing GitHub Pages site does not proxy, host, decrypt or redistribute media.</div>
  </section>
}
