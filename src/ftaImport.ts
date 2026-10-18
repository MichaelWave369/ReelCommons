import type { Constellation, Standard, Transponder } from './ftaPhysics'

export interface ImportReport {
  records: Transponder[]
  warnings: string[]
}
const MAX_IMPORT_BYTES = 200_000
const MAX_SATELLITES = 16
const MAX_TRANSPONDERS = 120

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}
function text(value: unknown, limit = 80): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, limit) : null
}
function numeric(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const stripped = value.trim()
  // Accept common satellite-list strings such as "11789 MHz" and "22000".
  if (!/^[+-]?\d+(?:\.\d+)?(?:\s*(?:MHz|ksym\/s|kSps))?$/i.test(stripped)) return null
  const n = Number.parseFloat(stripped)
  return Number.isFinite(n) ? n : null
}
export function orbitalLongitudeFromName(name: string): number | null {
  const match = name.match(/(\d{1,3}(?:\.\d+)?)\s*°?\s*([EW])\b/i)
  if (!match) return null
  const number = Number(match[1])
  if (number > 180) return null
  return match[2].toUpperCase() === 'W' ? -number : number
}
function channels(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value
    .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    .slice(0, 25)
    .map((item) => item.trim().slice(0, 75)))] : []
}
function polarization(value: unknown): Transponder['polarization'] {
  return value === 'H' || value === 'V' || value === 'L' || value === 'R' ? value : null
}
function standard(value: unknown): Standard | null {
  return value === 'DVB-S' || value === 'DVB-S2' ? value : null
}
function constellation(value: unknown): Constellation | null {
  return value === 'QPSK' || value === '8PSK' ? value : null
}
function fec(value: unknown): string | null {
  const selected = text(value, 10)
  return selected && /^\d{1,2}\/\d{1,2}$/.test(selected) ? selected : null
}

/**
 * Handles Gemini's flat satellite -> [transponder] shape, Grok's
 * {satellites: {...}} simulation result and nested {transponders: [...]}
 * examples. Everything is IMPORTED (UNVERIFIED); never trust a Status field.
 */
export function importFtaJson(jsonText: string): ImportReport {
  if (jsonText.length > MAX_IMPORT_BYTES) throw new Error('The JSON file exceeds the 200 KB local import limit.')
  let json: unknown
  try { json = JSON.parse(jsonText) as unknown }
  catch { throw new Error('That file is not valid JSON.') }
  const root = record(json)
  if (!root) throw new Error('Expected a JSON object keyed by satellite name.')
  const satellites = record(root.satellites) ?? root
  const keys = Object.keys(satellites).filter((k) => k !== 'simulation_timestamp' && k !== 'receiver_config')
  if (keys.length > MAX_SATELLITES) throw new Error('Import exceeds the 16-satellite limit.')
  const records: Transponder[] = []
  const warnings: string[] = []
  for (const satellite of keys) {
    const raw = satellites[satellite]
    const satelliteRecord = record(raw)
    const entries: unknown = Array.isArray(raw) ? raw : satelliteRecord?.transponders
    if (!Array.isArray(entries)) { warnings.push('Skipped ' + satellite.slice(0, 65) + ': no transponder list.'); continue }
    const satelliteEirp = numeric(satelliteRecord?.typical_eirp_dbw)
    const explicitOrbit = numeric(satelliteRecord?.orbital_longitude_deg)
    const orbital = explicitOrbit !== null && Math.abs(explicitOrbit) <= 180
      ? explicitOrbit : orbitalLongitudeFromName(satellite)
    for (const value of entries) {
      if (records.length >= MAX_TRANSPONDERS) throw new Error('Import exceeds the 120-transponder limit.')
      const entry = record(value)
      if (!entry) { warnings.push('Skipped a non-object transponder.'); continue }
      const f = numeric(entry.Frequency ?? entry.frequency_mhz)
      const sr = numeric(entry.Symbol_Rate ?? entry.symbol_rate)
      const eirp = numeric(entry.EIRP_dBW ?? entry.eirp_dbw) ?? satelliteEirp
      const std = standard(entry.Modulation_Standard ?? entry.modulation)
      const mod = constellation(entry.Constellation ?? entry.constellation) ?? (std === 'DVB-S' ? 'QPSK' : null)
      const parsedOrbit = numeric(entry.orbital_longitude_deg) ?? orbital
      const name = satellite.trim().slice(0, 85)
      if (f === null || f <= 0 || f > 50_000) { warnings.push('Skipped invalid frequency in ' + name); continue }
      records.push({
        id: 'import-' + records.length, satellite: name, orbitLongitudeDeg: parsedOrbit,
        frequencyMHz: f, polarization: polarization(entry.Polarization ?? entry.polarization),
        symbolRateKSps: sr, fec: fec(entry.FEC ?? entry.fec),
        standard: std, constellation: mod, eirpDbw: eirp,
        listedChannels: channels(entry.Found_Channels ?? entry.channels),
        provenance: 'USER_IMPORTED',
        reportedStatus: text(entry.Status ?? entry.status, 24),
      })
    }
  }
  if (!records.length) throw new Error('No valid transponders were found in the imported JSON.')
  const incomplete = records.filter((item) => item.symbolRateKSps === null || item.eirpDbw === null || !item.fec || !item.constellation).length
  if (incomplete) warnings.push(incomplete + ' imported record(s) lack parameters needed for a modeled lock. Edit the missing fields before simulating.')
  if (records.some((item) => item.reportedStatus)) warnings.push('Imported Status/LOCKED claims are unverified metadata and never influence our calculation.')
  return { records, warnings }
}
