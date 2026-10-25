import { useMemo, useState } from 'react'
import type { BroadcastChannel } from './worldBroadcast'
import type { BroadcastGuideIndex } from './worldBroadcastGuides'
import { guideReceipt } from './worldBroadcastGuides'
import './world-guide-desk.css'

type GuideStatus = 'idle' | 'loading' | 'ready' | 'error'
interface Props {
  index: BroadcastGuideIndex | null
  channels: readonly BroadcastChannel[]
  selectedId: string | null
  onSelect: (id: string) => void
  onlyWithGuides: boolean
  onOnlyWithGuides: (next: boolean) => void
  status: GuideStatus
  onLoad: () => void
}
const fmt = (n: number) => n.toLocaleString('en-US')

/** A research aid, not a TV listing/player. Provider guide URLs never enter UI state. */
export default function WorldGuideDesk({
  index, channels, selectedId, onSelect, onlyWithGuides,
  onOnlyWithGuides, status, onLoad,
}: Props) {
  const [find, setFind] = useState('')
  const [notice, setNotice] = useState('')
  const matches = useMemo(() => {
    if (!index) return []
    const needle = find.trim().toLocaleLowerCase().slice(0, 100)
    return channels.filter((channel) => index.indexedChannels.has(channel.id) &&
      (!needle || (channel.name + ' ' + channel.id + ' ' + channel.country).toLocaleLowerCase().includes(needle)))
      .slice(0, 8)
  }, [channels, index, find])
  const chosen = index ? channels.find(({ id }) => id === selectedId && index.indexedChannels.has(id)) ?? null : null
  const rows = chosen ? index?.byChannel.get(chosen.id) ?? [] : []

  function downloadReceipt() {
    if (!chosen || !rows.length) return
    const payload = guideReceipt(chosen, rows)
    const blob = new Blob([payload], { type: 'application/json' })
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = 'rctv-guide-source-receipt.json'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
    setNotice('Metadata-only receipt exported. It contains no schedules, media URLs or verified playback claims.')
  }

  return <section id="wba-guide-desk" className="wgd" aria-labelledby="wgd-heading">
    <div className="wgd-heading">
      <div>
        <span className="wgd-kicker">RCTV v2.3 · PROGRAM GUIDE RESEARCH</span>
        <h3 id="wgd-heading">World TV Guide Desk</h3>
        <p>Investigate which EPG source entries IPTV-org has indexed, for which stations, and in which languages. This is a research desk, not a live TV schedule.</p>
      </div>
      <div className="wgd-readiness">
        <span>INDEX <b>{status === 'ready' ? 'LOADED' : 'NOT LOADED'}</b></span>
        <span>SCHEDULES <b>NOT LOADED</b></span>
        <span>PLAYBACK <b>NOT AUTHORIZED</b></span>
      </div>
    </div>
    {status !== 'ready' && <div className="wgd-loading">
      <p><strong>Opt-in metadata lookup.</strong> Clicking below requests only `guides.json` from IPTV-org. The upstream server will receive the ordinary network request. We do not download the third-party XMLTV files referenced in that index.</p>
      <button type="button" onClick={onLoad} disabled={status === 'loading'}>
        {status === 'loading' ? 'Loading guide metadata…' : status === 'error' ? 'Retry guide lookup' : 'Load EPG source index'}
      </button>
      {status === 'error' && <p role="alert" className="wgd-error">Guide metadata could not be loaded. The world directory and passport are still usable.</p>}
    </div>}
    {status === 'ready' && index && <>
      <div className="wgd-stats" role="status">
        <div><strong>{fmt(index.indexedChannels.size)}</strong><span>channels with guide entries</span></div>
        <div><strong>{fmt(index.indexedSourceRows)}</strong><span>source metadata records retained</span></div>
        <div><strong>0</strong><span>program listings downloaded</span></div>
        <button type="button" onClick={onLoad}>↻ Refresh guide index</button>
      </div>
      <div className="wgd-filter">
        <label>
          <input type="checkbox" checked={onlyWithGuides} onChange={(e) => onOnlyWithGuides(e.target.checked)} />
          Show only stations with indexed guide sources in the World TV directory and remote
        </label>
        <p>The filtered World TV Passport remote follows this setting. It still opens only the official broadcaster website.</p>
      </div>
      <div className="wgd-search">
        <label htmlFor="wgd-search-input">FIND GUIDE METADATA FOR A STATION</label>
        <input id="wgd-search-input" type="search" value={find} maxLength={100}
          onChange={(event) => setFind(event.target.value)} placeholder="Channel name, country, or IPTV-org ID" />
        <div className="wgd-results">
          {matches.map((channel) => <button key={channel.id} type="button"
            className={chosen?.id === channel.id ? 'active' : ''}
            aria-pressed={chosen?.id === channel.id}
            onClick={() => { onSelect(channel.id); setNotice('') }}>
            {channel.name} <span>{channel.country}</span>
          </button>)}
          {matches.length === 0 && <span className="wgd-none">No indexed guide entries match. A missing index is not proof the broadcaster has no schedule.</span>}
        </div>
      </div>
      <div className="wgd-detail">
        {!chosen || rows.length === 0 ? <p>Select a station above or use “View guide sources” on a channel card below to inspect its indexed guide providers.</p> :
          <>
            <div className="wgd-selection">
              <div><span className="wgd-kicker">SELECTED STATION</span><h4>{chosen.name}</h4>
                <p>{chosen.id} · {chosen.country} · {rows.length} indexed source record(s) shown (up to 12)</p></div>
              <a href={chosen.officialUrl} target="_blank" rel="noopener noreferrer">Check broadcaster's official site ↗</a>
            </div>
            <div className="wgd-sources">
              {rows.map((row, i) => <article key={row.site + row.language + (row.feed ?? '') + i}>
                <div><strong>{row.siteName}</strong><span>Guide index site: {row.site}</span></div>
                <dl>
                  <div><dt>Guide language</dt><dd>{row.language}</dd></div>
                  <div><dt>Feed</dt><dd>{row.feed ?? 'Unspecified'}</dd></div>
                  <div><dt>Indexed formats</dt><dd>{row.formats.join(', ') || 'Unspecified'}</dd></div>
                  <div><dt>Listed sources</dt><dd>{row.sourceCount} (capped)</dd></div>
                </dl>
              </article>)}
            </div>
            <div className="wgd-export">
              <button type="button" onClick={downloadReceipt}>↓ Export guide research receipt</button>
              <span>Receipt includes source metadata only, no provider XMLTV URLs or schedules.</span>
            </div>
          </>}
      </div>
      {notice && <p className="wgd-notice" role="status">{notice}</p>}
      <p className="wgd-footnote">IPTV-org guide metadata may refer to third-party schedule collectors, not broadcaster-owned guides. A listed source does not verify accuracy, live status, authorization, accessibility, or broadcast rights. Guide site names are shown as plain text only, never visited or scraped by this app. Source data: <a href="https://github.com/iptv-org/epg" target="_blank" rel="noopener noreferrer">IPTV-org EPG</a>.</p>
    </>}
  </section>
}
