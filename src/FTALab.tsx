import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  DEFAULT_SETTINGS, EXAMPLES, resultReceipt, simulateTransponder, SUPPORTED_FEC,
} from './ftaPhysics'
import type { Constellation, ReceiverSettings, Standard, Transponder } from './ftaPhysics'
import { importFtaJson } from './ftaImport'
import './fta-lab.css'

const fmt = (value: number | null, unit = '', digits = 1): string =>
  value === null || !Number.isFinite(value) ? 'Not calculated' : value.toFixed(digits) + unit

const STATUS: Record<string, string> = {
  BELOW_HORIZON: 'BELOW HORIZON',
  INCOMPLETE: 'INPUT INCOMPLETE',
  SIMULATED_LOCK: 'SIMULATED LOCK',
  MARGINAL_MODEL: 'MARGINAL MODEL',
  NO_MODEL_LOCK: 'NO MODEL LOCK',
}

const fieldMeta: { key: keyof ReceiverSettings; name: string; min: number; max: number; step: number; unit: string }[] = [
  { key: 'latDeg', name: 'Latitude', min: -90, max: 90, step: 0.1, unit: '°' },
  { key: 'lonDeg', name: 'Longitude', min: -180, max: 180, step: 0.1, unit: '°' },
  { key: 'dishDiameterM', name: 'Dish diameter', min: 0.2, max: 15, step: 0.05, unit: 'm' },
  { key: 'dishEfficiency', name: 'Dish efficiency', min: 0.1, max: 1, step: 0.05, unit: 'ratio' },
  { key: 'rainFadeDb', name: 'Rain attenuation', min: 0, max: 50, step: 0.5, unit: 'dB' },
  { key: 'pointingLossDb', name: 'Pointing loss', min: 0, max: 30, step: 0.5, unit: 'dB' },
  { key: 'cableLossDb', name: 'Cable / other loss', min: 0, max: 20, step: 0.5, unit: 'dB' },
  { key: 'lnbNoiseFigureDb', name: 'LNB noise figure', min: 0, max: 10, step: 0.1, unit: 'dB' },
  { key: 'antennaTemperatureK', name: 'Antenna noise temp.', min: 1, max: 1500, step: 10, unit: 'K' },
  { key: 'rolloff', name: 'Symbol roll-off', min: 0, max: 0.6, step: 0.05, unit: 'ratio' },
]

function valueOrNull(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export default function FTALab() {
  const [settings, setSettings] = useState<ReceiverSettings>({ ...DEFAULT_SETTINGS })
  const [entries, setEntries] = useState<Transponder[]>(() => EXAMPLES.map((entry) => ({ ...entry, listedChannels: [...entry.listedChannels] })))
  const [selectedId, setSelectedId] = useState(EXAMPLES[0].id)
  const [importWarnings, setImportWarnings] = useState<string[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [showPhysics, setShowPhysics] = useState(false)

  const selected = entries.find((item) => item.id === selectedId) ?? entries[0] ?? null
  const result = useMemo(() => selected ? simulateTransponder(selected, settings) : null, [selected, settings])
  const simulations = useMemo(() => entries.map((item) => ({
    item, result: simulateTransponder(item, settings),
  })), [entries, settings])
  const statCount = simulations.reduce((acc, entry) => {
    if (entry.result.status === 'SIMULATED_LOCK') return acc + 1
    return acc
  }, 0)
  const signalPosition = result?.marginDb === null || result?.marginDb === undefined
    ? 0 : Math.max(0, Math.min(100, (result.marginDb + 30) * 100 / 60))

  function patchSelected(changes: Partial<Transponder>) {
    if (!selected) return
    setEntries((current) => current.map((item) => item.id === selected.id ? { ...item, ...changes } : item))
  }
  function numberEdit(label: string, key: 'frequencyMHz' | 'symbolRateKSps' | 'eirpDbw' | 'orbitLongitudeDeg', min: number, max: number, step: number) {
    return <label className="fta-field" key={key}>{label}
      <input type="number" min={min} max={max} step={step} value={selected?.[key] ?? ''}
        onChange={(event) => patchSelected({ [key]: valueOrNull(event.target.value) })} />
    </label>
  }
  function renderReceiverInput(field: typeof fieldMeta[number]) {
    return <label className="fta-field" key={field.key}>{field.name}<span>{field.unit}</span>
      <input type="number" min={field.min} max={field.max} step={field.step}
        value={settings[field.key]} onChange={(event) => setSettings((s) => ({
          ...s, [field.key]: Number(event.target.value),
        }))} />
    </label>
  }

  async function loadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(''); setMessage(''); setImportWarnings([])
    if (file.size > 200_000) { setError('JSON import is limited to 200 KB.'); return }
    try {
      const imported = importFtaJson(await file.text())
      setEntries(imported.records)
      setSelectedId(imported.records[0].id)
      setImportWarnings(imported.warnings)
      setMessage('Imported ' + imported.records.length + ' unverified transponder listing(s) locally. No files or credentials were uploaded.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not import that JSON file.')
    }
  }
  function reset() {
    setSettings({ ...DEFAULT_SETTINGS })
    setEntries(EXAMPLES.map((entry) => ({ ...entry, listedChannels: [...entry.listedChannels] })))
    setSelectedId(EXAMPLES[0].id)
    setImportWarnings([]); setError(''); setMessage('Educational fixtures and receiver settings restored.')
  }
  async function copyReceipt() {
    if (!selected || !result) return
    try {
      await navigator.clipboard.writeText(resultReceipt(selected, settings, result))
      setMessage('Model-only evidence receipt copied. No real RF was measured.')
    } catch {
      setError('Clipboard access failed. You can still inspect the model data below.')
    }
  }
  function downloadReceipt() {
    if (!selected || !result) return
    const blob = new Blob([resultReceipt(selected, settings, result)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'rctv-fta-simulation-' + selected.id.replace(/[^a-z0-9-]/gi, '-') + '.json'
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('Exported a model-only JSON receipt. Not a receiver channel file.')
  }

  return <section className="fta-page wrap" aria-labelledby="fta-title">
    <div className="eyebrow">RCTV LABS / EXPERIMENT 008 · EDUCATIONAL ONLY</div>
    <div className="fta-hero">
      <div>
        <div className="fta-eyebrow"><span className="fta-pulse" /> VIRTUAL RF INSTRUMENT PANEL</div>
        <h1 id="fta-title">Satellite signals.<br /><em>Without the satellite.</em></h1>
        <p>An original Ku-band geostationary receiver model. Adjust the virtual antenna, predict signal margin, and see why a dish might lock or fail. No hardware or live broadcast is connected.</p>
        <div className="fta-hero-tags"><span>DETERMINISTIC MODEL</span><span>NO REAL RF</span><span>LOCAL JSON IMPORT</span></div>
      </div>
      <div className="fta-hero-display" aria-hidden="true"><div className="fta-dish-circle"><span>⌁</span></div><strong>FTA<small>LAB</small></strong><span>RCTV SIGNAL EXPLORER</span></div>
    </div>
    <div className="fta-integrity"><strong>SIMULATION, NOT RECEPTION.</strong> Source names, frequencies, channel labels, EIRP and thresholds are illustrative or user-imported and unverified. Even a green model lock does not indicate actual reception, a decoded transport stream, a currently active transponder, or playable TV. Satellite visibility is mathematical geometry, not a site survey.</div>

    <div className="fta-main-grid">
      <div className="fta-side">
        <section className="fta-panel">
          <div className="fta-heading"><span className="fta-section-no">01</span><div><h2>Transponder workbench</h2><p>Choose the signal to model.</p></div></div>
          <div className="fta-source-actions">
            <label className="fta-import-label">↑ Import Gemini/Grok JSON
              <input type="file" accept=".json,application/json" onChange={loadFile} aria-label="Import local satellite listing JSON" />
            </label>
            <button type="button" className="fta-secondary" onClick={reset}>↺ Reset demo</button>
          </div>
          <p className="fta-helper">Imports stay in this browser tab. Metadata claims like <code>LOCKED</code> never control our simulation.</p>
          {error && <div className="fta-alert error" role="alert">{error}</div>}
          {message && <div className="fta-alert" role="status">{message}</div>}
          {importWarnings.length > 0 && <div className="fta-alert warning"><strong>Import notes</strong>{importWarnings.map((warning, i) => <p key={i}>{warning}</p>)}</div>}
          <div className="fta-directory" role="group" aria-label="Transponder selection">
            {entries.map((entry) => {
              const computed = simulations.find((value) => value.item.id === entry.id)?.result
              return <button key={entry.id} type="button" aria-pressed={entry.id === selected?.id}
                className={entry.id === selected?.id ? 'active' : ''} onClick={() => { setSelectedId(entry.id); setError(''); setMessage('') }}>
                <span>{entry.satellite}</span><strong>{fmt(entry.frequencyMHz, ' MHz', 0)} · {entry.standard ?? 'Unknown'}</strong>
                <small className={'fta-mini-status ' + (computed?.status ?? '').toLowerCase()}>{computed ? STATUS[computed.status] : 'NO DATA'}</small>
              </button>
            })}
          </div>
          {selected && <>
            <div className="fta-subheading">TRANSPONDER PARAMETERS <small>Editable assumptions</small></div>
            <div className="fta-field-grid">
              {numberEdit('Downlink MHz', 'frequencyMHz', 10000, 14000, 1)}
              {numberEdit('Orbit longitude °', 'orbitLongitudeDeg', -180, 180, 0.1)}
              {numberEdit('Symbol rate kSym/s', 'symbolRateKSps', 100, 70000, 1)}
              {numberEdit('EIRP dBW (assumed)', 'eirpDbw', 10, 75, 0.5)}
              <label className="fta-field">Standard<select value={selected.standard ?? ''} onChange={(e) => patchSelected({ standard: e.target.value ? e.target.value as Standard : null })}><option value="">Unknown</option><option>DVB-S</option><option>DVB-S2</option></select></label>
              <label className="fta-field">Constellation<select value={selected.constellation ?? ''} onChange={(e) => patchSelected({ constellation: e.target.value ? e.target.value as Constellation : null })}><option value="">Unknown</option><option>QPSK</option><option>8PSK</option></select></label>
              <label className="fta-field">FEC<select value={selected.fec ?? ''} onChange={(e) => patchSelected({ fec: e.target.value || null })}><option value="">Unknown</option>{SUPPORTED_FEC.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="fta-field">Polarization<select value={selected.polarization ?? ''} onChange={(e) => patchSelected({ polarization: e.target.value ? e.target.value as Transponder['polarization'] : null })}><option value="">Unknown</option><option>H</option><option>V</option><option>L</option><option>R</option></select></label>
            </div>
            <div className="fta-provenance"><strong>DATA ORIGIN</strong><p>{selected.provenance === 'USER_IMPORTED' ? 'USER-IMPORTED LISTING · UNVERIFIED' : 'BUILT-IN EDUCATIONAL EXAMPLE'}</p>{selected.reportedStatus && <p>Imported status claim: <strong>{selected.reportedStatus}</strong> (not trusted)</p>}</div>
            <div className="fta-listed"><strong>LISTED PROGRAMS (NOT OBSERVED)</strong><p>{selected.listedChannels.length ? selected.listedChannels.join(' · ') : 'No channel names included.'}</p></div>
          </>}
        </section>
      </div>

      <div className="fta-primary">
        <section className="fta-panel">
          <div className="fta-heading"><span className="fta-section-no">02</span><div><h2>Virtual receiver configuration</h2><p>Changes recalculate the signal immediately. Example site is 38°N, 121°W, not your actual location.</p></div></div>
          <div className="fta-controls">{fieldMeta.slice(0, 6).map(renderReceiverInput)}</div>
          <button className="fta-expand" aria-expanded={showMore} onClick={() => setShowMore((value) => !value)}>{showMore ? '− Hide additional assumptions' : '+ Advanced receiver assumptions'}</button>
          {showMore && <div className="fta-controls fta-advanced">{fieldMeta.slice(6).map(renderReceiverInput)}</div>}
          <div className="fta-settings-notice">The model uses a simple spherical GEO geometry approximation and isotropic thermal noise. It does not predict weather, satellite beam coverage, link availability, adjacent-channel interference, hardware gain calibration, or decoder-specific performance.</div>
        </section>

        {result && selected && <section className="fta-panel fta-result-panel">
          <div className="fta-heading"><span className="fta-section-no">03</span><div><h2>Simulated signal analyzer</h2><p>{selected.satellite} · {fmt(selected.frequencyMHz, ' MHz', 0)}</p></div><div className="fta-model-count">{statCount} / {entries.length}<small>MODELED LOCKS</small></div></div>
          <div className={'fta-status-box status-' + result.status.toLowerCase()}>
            <div><span className="fta-status-label">RECEIVER MODEL RESULT</span><strong>{STATUS[result.status]}</strong><small>{result.issue ?? 'A deterministic estimate, not a tuner measurement.'}</small></div>
            <span className="fta-status-symbol" aria-hidden="true">{result.status === 'SIMULATED_LOCK' ? '◉' : result.status === 'MARGINAL_MODEL' ? '◌' : result.status === 'BELOW_HORIZON' ? '⊘' : '◎'}</span>
          </div>
          <div className="fta-metric-grid">
            <div><span>Elevation</span><strong>{fmt(result.elevationDeg, '°')}</strong></div>
            <div><span>Slant range</span><strong>{fmt(result.slantRangeKm, ' km', 0)}</strong></div>
            <div><span>Carrier / Noise</span><strong>{fmt(result.cnDb, ' dB')}</strong></div>
            <div><span>Required C/N <small>(assumed)</small></span><strong>{fmt(result.thresholdDb, ' dB')}</strong></div>
          </div>
          <div className="fta-margin-panel">
            <div className="fta-margin-title"><span>SIGNED LINK MARGIN</span><strong>{result.marginDb === null ? 'NOT CALCULATED' : (result.marginDb >= 0 ? '+' : '') + fmt(result.marginDb, ' dB')}</strong></div>
            <div className="fta-meter" role="meter" aria-label="Modeled margin on scale minus 30 to plus 30 decibels" aria-valuemin={-30} aria-valuemax={30} aria-valuenow={result.marginDb === null ? undefined : Math.max(-30, Math.min(30, result.marginDb))}>
              <span className="fta-meter-zero" aria-hidden="true" /><span className="fta-meter-pointer" style={{ left: signalPosition + '%' }} aria-hidden="true" />
            </div>
            <div className="fta-meter-axis"><span>−30 dB</span><span>0 dB</span><span>+30 dB</span></div>
            <p>0 dB is the assumed demodulation threshold. 0–3 dB is marked marginal. A green result means only that the model exceeds its assumed threshold by at least 3 dB.</p>
          </div>
          <button className="fta-expand" aria-expanded={showPhysics} onClick={() => setShowPhysics((value) => !value)}>{showPhysics ? '− Hide link-budget ledger' : '+ Show link-budget ledger'}</button>
          {showPhysics && <div className="fta-ledger">
            <div><span>Dish gain</span><strong>{fmt(result.dishGainDbi, ' dBi')}</strong></div>
            <div><span>Free-space path loss</span><strong>{fmt(result.fsplDb, ' dB')}</strong></div>
            <div><span>Received carrier</span><strong>{fmt(result.carrierDbw, ' dBW')}</strong></div>
            <div><span>Thermal noise power</span><strong>{fmt(result.noiseDbw, ' dBW')}</strong></div>
            <div><span>Assumed noise bandwidth</span><strong>{fmt(result.bandwidthHz === null ? null : result.bandwidthHz / 1e6, ' MHz', 2)}</strong></div>
            <p>C/N = received carrier − thermal noise. Margin = C/N − educational MODCOD threshold. Negative values are never clamped, and no random jitter is added.</p>
          </div>}
          <div className="fta-export">
            <button type="button" onClick={copyReceipt}>Copy evidence receipt</button>
            <button type="button" onClick={downloadReceipt}>↓ Export model JSON</button>
          </div>
          <p className="fta-not-playback">Neither this output nor imported channel lists constitute actual received video. Hardware RF lock, transport-stream parsing and playback require a separate, authorized receiver bridge.</p>
        </section>}
      </div>
    </div>
    <div className="fta-bottom-note"><strong>BUILD OUTWARD, CIRCLE BACK.</strong> Future steps: calibrated thresholds and ITU propagation models, source-licensed satellite listings, and optional local tuner integration. This simulator does not scrape feeds, bypass encryption, or host television.</div>
  </section>
}
