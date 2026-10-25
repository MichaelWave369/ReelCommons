import { useEffect, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import type { BroadcastChannel, BroadcastOption } from './worldBroadcast'
import {
  WORLD_TV_PASSPORT_KEY, WORLD_TV_PASSPORT_MAX_IMPORT_BYTES, WORLD_TV_PASSPORT_MAX_STAMPS,
  addWorldTvStamp, exportWorldTvPassport, importWorldTvPassport, mergeWorldTvStamps,
  pickWorldTvChannel, readWorldTvPassport, removeWorldTvStamp, stampCountryCount,
  stepWorldTvChannel, todayUtc,
} from './worldTvPassport'
import './world-tv-passport.css'

interface Props {
  channels: readonly BroadcastChannel[] // visible / filtered, never a player source
  allChannels: readonly BroadcastChannel[]
  countries: readonly BroadcastOption[]
}
const fmt = (n: number) => n.toLocaleString('en-US')

export default function WorldTvPassport({ channels, allChannels, countries }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [stamps, setStamps] = useState<ReturnType<typeof readWorldTvPassport>>([])
  const [notice, setNotice] = useState('')
  const [importError, setImportError] = useState('')
  useEffect(() => {
    let raw: string | null = null
    try { raw = localStorage.getItem(WORLD_TV_PASSPORT_KEY) } catch { /* private browser mode */ }
    setStamps(readWorldTvPassport(raw, allChannels))
  }, [allChannels])

  const active = channels.find(({ id }) => id === selectedId) ?? channels[0] ?? null
  const selectedIndex = active ? channels.findIndex(({ id }) => id === active.id) : -1
  const isStamped = active ? stamps.some(({ id }) => id === active.id) : false
  const byId = new Map(allChannels.map((channel) => [channel.id, channel]))
  function persist(next: typeof stamps) {
    setStamps(next)
    try {
      localStorage.setItem(WORLD_TV_PASSPORT_KEY, JSON.stringify({
        schema: 'RCTV_WORLD_TV_PASSPORT_V1', stamps: next,
      }))
    } catch {
      setNotice('Browser storage is unavailable. Your stamps last only during this visit.')
    }
  }
  function change(step: number) {
    const choice = stepWorldTvChannel(channels, active?.id ?? null, step)
    if (choice) setSelectedId(choice.id)
  }
  function hop() {
    const choice = pickWorldTvChannel(channels, active?.id ?? null)
    if (choice) setSelectedId(choice.id)
  }
  function mark() {
    if (!active) return
    if (isStamped) {
      persist(removeWorldTvStamp(stamps, active.id))
      setNotice('Manual exploration stamp removed.')
    } else {
      if (stamps.length >= WORLD_TV_PASSPORT_MAX_STAMPS) {
        setNotice('The passport holds a maximum of 250 stations.')
        return
      }
      persist(addWorldTvStamp(stamps, active.id, allChannels, todayUtc()))
      setNotice('Manually marked as explored. This does not verify that you watched a stream.')
    }
  }
  function download() {
    const blob = new Blob([exportWorldTvPassport(stamps)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'reelcommons-world-tv-passport.json'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    setNotice('Exported manual catalog stamps only. No watch or travel claims.')
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImportError(''); setNotice('')
    if (file.size > WORLD_TV_PASSPORT_MAX_IMPORT_BYTES) {
      setImportError('Passport files must be 64 KB or smaller.')
      return
    }
    try {
      const parsed = importWorldTvPassport(await file.text(), allChannels)
      const merged = mergeWorldTvStamps(stamps, parsed)
      persist(merged)
      setNotice('Imported ' + (merged.length - stamps.length) + ' new manual channel stamp(s). Existing dates kept. Unknown channel IDs are rejected.')
    } catch (cause) {
      setImportError(cause instanceof Error ? cause.message : 'Could not read this passport file.')
    }
  }
  function onRemoteKey(event: KeyboardEvent<HTMLElement>) {
    // Remote-only shortcuts: typing/search/select/buttons elsewhere is unaffected.
    if (event.target !== event.currentTarget) return
    if (event.key === 'ArrowLeft') { event.preventDefault(); change(-1) }
    if (event.key === 'ArrowRight') { event.preventDefault(); change(1) }
  }
  return <section className="wbt" aria-labelledby="wbt-title">
    <div className="wbt-top">
      <div><span className="wbt-kicker">WORLD TV / EXPLORER & PASSPORT</span>
        <h3 id="wbt-title">Channel-hop around the planet.</h3>
        <p>Explore the directory with a lean-back station remote. Select a broadcaster, visit its official website if you wish, and manually stamp the stations you've explored. No video plays inside this remote.</p>
      </div>
      <div className="wbt-counts" aria-label="Passport progress">
        <span><strong>{fmt(stamps.length)}</strong> marked stations</span>
        <span><strong>{fmt(stampCountryCount(stamps, allChannels))}</strong> countries represented</span>
      </div>
    </div>
    {active ? <div className="wbt-remote" tabIndex={0} onKeyDown={onRemoteKey} aria-label="World TV channel-hopper. Focus this panel and use left and right arrow keys to change selected directory station.">
      <div className="wbt-screen">
        <div className="wbt-screen-heading"><span>RCTV / WORLD STATION</span><span>{fmt(selectedIndex + 1)} OF {fmt(channels.length)} FILTERED</span></div>
        <span className="wbt-broadcast-icon" aria-hidden="true">◎</span>
        <strong>{active.name}</strong>
        <p>{countries.find((c) => c.id === active.country)?.label ?? active.country} · {active.country} · Directory preview</p>
        <span className="wbt-screen-notice">STANDBY · NO STREAM LOADED</span>
      </div>
      <div className="wbt-controls">
        <button type="button" disabled={channels.length < 2} onClick={() => change(-1)} aria-label="Previous directory station">◀ CH−</button>
        <button type="button" disabled={channels.length < 2} onClick={hop}>✧ World Hop</button>
        <button type="button" disabled={channels.length < 2} onClick={() => change(1)} aria-label="Next directory station">CH+ ▶</button>
      </div>
      <div className="wbt-actions">
        <a href={active.officialUrl} target="_blank" rel="noopener noreferrer">Open official broadcaster ↗</a>
        <button type="button" onClick={mark} aria-pressed={isStamped}>
          {isStamped ? '✓ Marked as explored · Undo' : '＋ Mark as explored'}
        </button>
      </div>
      <p className="wbt-key-hint">Focus the remote panel for ← / → channel navigation. The station list follows the World TV search and filters above. Selecting a channel never starts a broadcast.</p>
    </div> : <div className="wbt-empty">No stations match the current filters. Clear or change filters above to continue your World TV tour.</div>}
    <div className="wbt-passport">
      <div className="wbt-passport-heading">
        <div><strong>YOUR LOCAL PASSPORT</strong><p>Self-reported catalog exploration. A stamp does not prove live playback, viewing time, or travel.</p></div>
        <div className="wbt-file-actions">
          <button type="button" onClick={download}>↓ Export passport JSON</button>
          <label className="wbt-import-file">↑ Import passport JSON
            <input type="file" accept=".json,application/json" onChange={importFile}
              aria-label="Import an RCTV World TV passport JSON file" />
          </label>
        </div>
      </div>
      {stamps.length === 0 ? <p className="wbt-no-stamps">No stamps yet. Pick a station and select “Mark as explored” to start your passport.</p> :
        <ul className="wbt-stamps">
          {stamps.slice(-8).reverse().map((stamp) => <li key={stamp.id}>
            <div><strong>{byId.get(stamp.id)?.name ?? stamp.id}</strong>
              <span>{byId.get(stamp.id)?.country} · Marked {stamp.date} UTC</span></div>
            <button type="button" onClick={() => persist(removeWorldTvStamp(stamps, stamp.id))}
              aria-label={'Remove exploration stamp for ' + (byId.get(stamp.id)?.name ?? stamp.id)}>Remove</button>
          </li>)}
        </ul>}
      {stamps.length > 8 && <p className="wbt-trail-note">Showing 8 most recently added stamps. Export contains all {fmt(stamps.length)} stamps.</p>}
      {notice && <p className="wbt-notice" role="status">{notice} <button type="button" onClick={() => setNotice('')}>Dismiss</button></p>}
      {importError && <p className="wbt-error" role="alert">{importError}</p>}
      <p className="wbt-footnote">Only channel IDs and manually chosen UTC calendar dates are stored or exported. Files contain no source URLs, media, streaming keys, viewer identity, watch history or location. Imported records must match currently indexed channels; existing stamps are preserved.</p>
    </div>
  </section>
}
