/**
 * RCTV v3.1 · persistent mini remote for the Open Streams page.
 *
 * The dock is only a tuner and surface launcher. It never loads media and
 * can only select one of the 50 built-in channel slots.
 */
import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { channelNumberForSource, channelNumberLabel, CHANNEL_LINEUP, surfNextChannel } from './channelSurf'
import type { OpenStream } from './openStreams'
import { hubChannelByNumber, hubReviewedSource } from './tvHub'
import './mini-tv-remote.css'

interface Props {
  selected: OpenStream
  onSelect: (source: OpenStream) => void
  onOpenMain: () => void
  onOpenCouch: () => void
  onOpenReviewed: () => void
}

export function resolveMiniRemoteChannel(value: string): OpenStream | null {
  return hubChannelByNumber(value)?.source ?? null
}

export default function MiniTvRemote({
  selected, onSelect, onOpenMain, onOpenCouch, onOpenReviewed,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [digits, setDigits] = useState('')
  const [message, setMessage] = useState('')
  const channelNumber = channelNumberForSource(selected.id)
  const reviewed = hubReviewedSource(selected.id)

  function select(source: OpenStream) {
    onSelect(source)
    setMessage('CH ' + channelNumberLabel(channelNumberForSource(source.id) ?? 0) +
      ' selected. Press Load separately to play media.')
    setDigits('')
  }
  function shift(direction: 1 | -1) {
    const next = surfNextChannel(CHANNEL_LINEUP, selected.id, direction)
    if (next) select(next.source)
  }
  function tune() {
    const source = resolveMiniRemoteChannel(digits)
    if (!source) {
      setMessage('Choose a numbered channel from 001 to 050.')
      return
    }
    select(source)
  }
  function onRemoteKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.altKey ||
      event.shiftKey || event.metaKey || event.ctrlKey) return
    if (event.key === 'ArrowLeft') {event.preventDefault();shift(-1)}
    if (event.key === 'ArrowRight') {event.preventDefault();shift(1)}
    if (event.key === 'Escape') {event.preventDefault();setExpanded(false)}
  }

  return <aside className="mtr" aria-label="RCTV persistent mini remote" onKeyDown={onRemoteKey}>
    <div className="mtr-bar">
      <span className="mtr-now">RCTV <strong>CH {channelNumber===null?'---':channelNumberLabel(channelNumber)}</strong></span>
      <span className="mtr-name" title={selected.name}>{selected.name}</span>
      <button type="button" className="mtr-toggle" aria-controls="mtr-details"
        aria-expanded={expanded} onClick={() => setExpanded((v)=>!v)}>
        {expanded?'− Collapse':'▣ Mini Remote'}
      </button>
    </div>
    {expanded && <div className="mtr-details" id="mtr-details" tabIndex={0}
      aria-label="Mini remote, focus here for left/right keyboard channel switching">
      <div className="mtr-transport">
        <button type="button" onClick={() => shift(-1)} aria-label="Previous channel">← CH−</button>
        <button type="button" onClick={() => shift(1)} aria-label="Next channel">CH+ →</button>
        <a href={selected.officialUrl} target="_blank" rel="noopener noreferrer">↗ Official</a>
      </div>
      <form onSubmit={(event) => {event.preventDefault();tune()}}>
        <label htmlFor="mtr-channel">Virtual channel</label>
        <input type="text" inputMode="numeric" id="mtr-channel" maxLength={3}
          placeholder="013" value={digits} pattern="[0-9]{1,3}"
          onChange={(event) => setDigits(event.target.value.replace(/\D/g,'').slice(0,3))}/>
        <button type="submit" disabled={!digits}>Tune</button>
      </form>
      <div className="mtr-screens" role="group" aria-label="Move to another TV screen">
        <button type="button" onClick={onOpenMain}>Channel Desk</button>
        <button type="button" onClick={onOpenCouch}>Couch Mode</button>
        <button type="button" onClick={onOpenReviewed} disabled={!reviewed}
          title={reviewed?'Open same reviewed source on standby':'Select a station in the seven-source reviewed roster'}>
          Reviewed Desk
        </button>
      </div>
      <p className="mtr-caveat">50 official destinations. Selecting or changing screens unloads prior media; no autoplay.</p>
      {message && <p className="mtr-message" role="status">{message}</p>}
    </div>}
  </aside>
}
