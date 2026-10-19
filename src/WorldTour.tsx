import { useState } from 'react'
import CustomTourBuilder from './CustomTourBuilder'
import { CUSTOM_TOURS_STORAGE_KEY,customTourToWorldTour,parseCustomTourStore } from './customTours'
import type { CustomTourStore } from './customTours'
import { CAMERA_FORMAT_LABELS } from './openStreams'
import type { OpenStream } from './openStreams'
import {
  getTourStop, markTourStop, nextTourIndex,
  readTourPassport, tourPassportReceipt, tourProgress, unmarkTourStop,
  WORLD_TOUR_KEY, WORLD_TOURS,
} from './worldTour'
import type { TourPassport, WorldTour } from './worldTour'
import './world-tour.css'

function initialCustomTours(): CustomTourStore {
  try { return parseCustomTourStore(window.localStorage.getItem(CUSTOM_TOURS_STORAGE_KEY)) }
  catch { return {version:1,tours:[]} }
}
function initialPassport(): TourPassport {
  try { return readTourPassport(window.localStorage.getItem(WORLD_TOUR_KEY)) }
  catch { return { version: 1, stampedOn: {} } }
}
const safelyDownload = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export default function WorldTour({ onPreview }: { onPreview: (source: OpenStream) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [tourId, setTourId] = useState('neon-nights')
  const [stopIndex, setStopIndex] = useState(0)
  const [passport, setPassport] = useState<TourPassport>(initialPassport)
  const [customStore, setCustomStore] = useState<CustomTourStore>(initialCustomTours)
  const [message, setMessage] = useState('')
  const allTours:WorldTour[] = [...WORLD_TOURS,...customStore.tours.map((record)=>customTourToWorldTour(record))]
  const activeTour: WorldTour = allTours.find((tour) => tour.id === tourId) ?? WORLD_TOURS[0]
  const safeIndex = Math.max(0,Math.min(stopIndex,activeTour.stops.length-1))
  const stop = activeTour.stops[safeIndex]
  const source = getTourStop(activeTour, safeIndex)
  const progress = tourProgress(activeTour, passport)
  const stamped = !!passport.stampedOn[stop.sourceId]
  const allStamps = Object.keys(passport.stampedOn).length

  function persistCustom(next:CustomTourStore){
    setCustomStore(next)
    try {window.localStorage.setItem(CUSTOM_TOURS_STORAGE_KEY,JSON.stringify(next))}
    catch {setMessage('Browser storage unavailable; these custom routes last only for this visit.')}
  }
  function persist(next: TourPassport) {
    setPassport(next)
    try { window.localStorage.setItem(WORLD_TOUR_KEY, JSON.stringify(next)) }
    catch { setMessage('Browser storage is unavailable. Stamps are saved only for this visit.') }
  }
  function changeTour(tour: WorldTour) {
    setTourId(tour.id)
    setStopIndex(0)
    setMessage('')
  }
  function stamp() {
    if (!source) return
    const next = stamped ? unmarkTourStop(passport, source.id) :
      markTourStop(passport, source.id, new Date().toISOString().slice(0, 10))
    persist(next)
    setMessage(stamped ? 'Removed your manual stamp.' :
      'You manually marked this stop explored. This does not verify that a live feed played.')
  }
  function setStep(direction: -1 | 1) {
    setStopIndex((current) => nextTourIndex(Math.min(current,activeTour.stops.length-1), activeTour, direction))
    setMessage('')
  }
  function clearPassport() {
    if (!window.confirm('Clear all manually collected World Tour stamps in this browser?')) return
    persist({ version: 1, stampedOn: {} })
    setMessage('All World Tour stamps cleared from this browser.')
  }
  async function copyRoute() {
    const text = [
      'RCTV World Tour · ' + activeTour.name,
      activeTour.description,
      'Official camera destinations (source-controlled, uptime not guaranteed):',
      ...activeTour.stops.map((_, index) => {
        const station = getTourStop(activeTour, index)
        return station ? (index + 1) + '. ' + station.name + '\n' + station.officialUrl : ''
      }),
      'Shared from RCTV. Individual provider terms apply; no broadcast footage is embedded.',
    ].join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setMessage('Copied the itinerary and official source links. No stream URLs were copied.')
    } catch { setMessage('Clipboard access unavailable. You can use the visible official links instead.') }
  }
  function exportPassport() {
    safelyDownload(tourPassportReceipt(passport, activeTour), 'rctv-world-tour-passport.json')
    setMessage('Downloaded the current tour’s self-reported stamps, not a verified viewing history.')
  }
  return <section className="wtd-shell" aria-labelledby="wtd-title">
    <div className="wtd-top">
      <div className="wtd-intro">
        <span className="wtd-kicker">RCTV v1.8 · THE COMMONS TRAVEL CHANNEL</span>
        <h2 id="wtd-title">World Tour <em>Mode.</em></h2>
        <p>Channel-surf across the planet without losing your place. Ten handcrafted routes plus your own custom adventures connect official provider destinations, each with a story, camera type and trusted viewing page.</p>
        <div className="wtd-top-stats"><span><b>{WORLD_TOURS.length}</b> curated routes + <b>{customStore.tours.length}</b> yours</span><span><b>{allStamps}</b> manually stamped stops</span><span><b>0</b> rebroadcasts</span></div>
      </div>
      <div className="wtd-top-actions"><button type="button" aria-expanded={expanded} aria-controls="rctv-world-tour-stage" onClick={() => { setExpanded((open) => !open); setMessage('') }}>
        {expanded ? '− Close World Tour' : '✈ Start exploring'}
      </button></div>
    </div>
    {expanded && <div id="rctv-world-tour-stage" className="wtd-body">
      <div className="wtd-route-panel">
        <h3><span>01</span> Choose a journey</h3>
        <div className="wtd-tour-grid" aria-label="Guided World Tour itineraries">
          {allTours.map((tour) => {
            const routeProgress = tourProgress(tour, passport)
            return <button key={tour.id} type="button" className={'wtd-tour-card ' + (tour.id === activeTour.id ? 'active' : '') + ' wtd-accent-' + tour.accent}
              aria-pressed={tour.id === activeTour.id} onClick={() => changeTour(tour)}>
              <span className="wtd-tour-card-symbol" aria-hidden="true">{tour.symbol}</span>
              <strong>{tour.name}</strong>
              <span>{tour.subtitle}</span>
              <small>{routeProgress.stamped}/{routeProgress.total} manually explored</small>
            </button>
          })}
        </div>
        <CustomTourBuilder store={customStore} onStoreChange={persistCustom} onChoose={changeTour} />
        <p className="wtd-legal">A tour changes RCTV’s selected destination only when you choose Preview. All actual camera footage stays with its operator. This travel mode never opens external tabs or plays media automatically.</p>
      </div>
      <div className="wtd-stage-panel">
        <div className="wtd-stage-heading">
          <div><span className="wtd-kicker">02 · CURRENT STOP</span><h3>{activeTour.name}</h3><p>{activeTour.description}</p></div>
          <span className="wtd-stop-index">STOP {safeIndex + 1} OF {activeTour.stops.length}</span>
        </div>
        {source && <div className={'wtd-current wtd-accent-' + activeTour.accent}>
          <div className="wtd-current-symbol" aria-hidden="true">{source.icon}</div>
          <div className="wtd-current-info">
            <div className="wtd-current-flags"><span>{source.category.toUpperCase()}</span><span>{source.cameraFormat ? CAMERA_FORMAT_LABELS[source.cameraFormat] : 'OFFICIAL SOURCE'}</span></div>
            <h4>{source.name}</h4>
            <p className="wtd-current-place">{source.place || source.region}</p>
            <p>{stop.story}</p>
            <p className="wtd-current-caveat">{source.region}</p>
          </div>
        </div>}
        <div className="wtd-trip-progress" role="progressbar" aria-label="Manually explored stops in current World Tour" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.stamped}>
          <span style={{width: (progress.stamped / Math.max(1, progress.total) * 100) + '%'}}/>
        </div>
        <div className="wtd-trip-status">{progress.stamped} of {progress.total} stops manually explored. {progress.completed ? 'Your self-reported passport is complete for this route.' : 'No automatic feed verification.'}</div>
        <div className="wtd-stop-list" aria-label="Tour route stops">
          {activeTour.stops.map((routeStop, index) => {
            const station = getTourStop(activeTour, index)
            return <button key={routeStop.sourceId} type="button" className={'wtd-stop-dot ' + (index === safeIndex ? 'active' : '') + (passport.stampedOn[routeStop.sourceId] ? ' stamped' : '')}
              aria-current={index === safeIndex ? 'step' : undefined} aria-label={'Stop ' + (index + 1) + ': ' + (station?.name || routeStop.sourceId) +
                (passport.stampedOn[routeStop.sourceId] ? ', marked explored' : '')}
              onClick={() => {setStopIndex(index);setMessage('')}}>{passport.stampedOn[routeStop.sourceId] ? '✓' : index + 1}</button>
          })}
        </div>
        <div className="wtd-nav">
          <button type="button" onClick={() => setStep(-1)} disabled={safeIndex === 0}>← Previous stop</button>
          <button type="button" onClick={() => setStep(1)} disabled={safeIndex === activeTour.stops.length - 1}>Next stop →</button>
        </div>
        <div className="wtd-view-actions">
          {source && <button type="button" className="wtd-preview" onClick={() => {onPreview(source);setMessage('Selected this stop in the RCTV channel desk. No media loaded automatically.')}}>▣ Preview channel desk</button>}
          {source && <a href={source.officialUrl} className="wtd-open" target="_blank" rel="noopener noreferrer">↗ Open official camera</a>}
          <button type="button" className={stamped ? 'wtd-stamp stamped' : 'wtd-stamp'} onClick={stamp}>
            {stamped ? '✓ Remove my stamp' : '✳ Mark as explored'}
          </button>
        </div>
        {message && <div className="wtd-notice" role="status">{message}</div>}
        <div className="wtd-passport">
          <div><strong>YOUR PRIVATE CAMERA PASSPORT</strong><p>A stamp records only your manual choice in local browser storage. It does not detect what you watched or confirm any station is live. You can export or clear your stamps whenever you like.</p></div>
          <div className="wtd-passport-controls">
            <button type="button" onClick={copyRoute}>Copy route links</button>
            <button type="button" onClick={exportPassport}>Export passport</button>
            <button type="button" onClick={clearPassport} disabled={!allStamps}>Clear stamps</button>
          </div>
        </div>
      </div>
    </div>}
  </section>
}
