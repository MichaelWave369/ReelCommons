/**
 * Educational GEO / Ku downlink model, v0.8.
 *
 * C/N here is a deterministic free-space + thermal-noise estimate, NOT a
 * receiver reading, DVB compliance calculation, coverage prediction, or
 * actual demodulator lock. All listed channels are unverified metadata.
 */
export type Standard = 'DVB-S' | 'DVB-S2'
export type Constellation = 'QPSK' | '8PSK'
export type Provenance = 'ILLUSTRATIVE_FIXTURE' | 'USER_IMPORTED'
export type SimulationStatus = 'BELOW_HORIZON' | 'INCOMPLETE' | 'SIMULATED_LOCK' | 'MARGINAL_MODEL' | 'NO_MODEL_LOCK'
export interface Transponder {
  id: string
  satellite: string
  orbitLongitudeDeg: number | null
  frequencyMHz: number | null
  polarization: 'H' | 'V' | 'L' | 'R' | null
  symbolRateKSps: number | null
  fec: string | null
  standard: Standard | null
  constellation: Constellation | null
  eirpDbw: number | null
  listedChannels: string[]
  provenance: Provenance
  reportedStatus: string | null
}
export interface ReceiverSettings {
  latDeg: number
  lonDeg: number
  dishDiameterM: number
  dishEfficiency: number
  rainFadeDb: number
  pointingLossDb: number
  cableLossDb: number
  lnbNoiseFigureDb: number
  antennaTemperatureK: number
  rolloff: number
}
export interface ModelResult {
  status: SimulationStatus
  issue: string | null
  elevationDeg: number | null
  slantRangeKm: number | null
  dishGainDbi: number | null
  fsplDb: number | null
  carrierDbw: number | null
  noiseDbw: number | null
  cnDb: number | null
  thresholdDb: number | null
  marginDb: number | null
  bandwidthHz: number | null
}
export const DEFAULT_SETTINGS: ReceiverSettings = {
  // Illustrative site, NOT the viewer's location.
  latDeg: 38, lonDeg: -121, dishDiameterM: 0.90, dishEfficiency: 0.65,
  rainFadeDb: 0, pointingLossDb: 0.5, cableLossDb: 2,
  lnbNoiseFigureDb: 0.7, antennaTemperatureK: 150, rolloff: 0.35,
}

export const EXAMPLES: readonly Transponder[] = [
  {
    id: 'g19-a', satellite: 'Galaxy 19 (97°W)', orbitLongitudeDeg: -97,
    frequencyMHz: 11842, polarization: 'H', symbolRateKSps: 22000,
    fec: '3/4', standard: 'DVB-S', constellation: 'QPSK', eirpDbw: 48.5,
    listedChannels: ['Illustrative channel A', 'Illustrative channel B'],
    provenance: 'ILLUSTRATIVE_FIXTURE', reportedStatus: null,
  },
  {
    id: 'g19-b', satellite: 'Galaxy 19 (97°W)', orbitLongitudeDeg: -97,
    frequencyMHz: 12184, polarization: 'H', symbolRateKSps: 22500,
    fec: '2/3', standard: 'DVB-S2', constellation: 'QPSK', eirpDbw: 48.5,
    listedChannels: ['Illustrative channel C'],
    provenance: 'ILLUSTRATIVE_FIXTURE', reportedStatus: null,
  },
  {
    id: 'e9b-a', satellite: 'Eutelsat 9B (9°E)', orbitLongitudeDeg: 9,
    frequencyMHz: 11900, polarization: 'H', symbolRateKSps: 27500,
    fec: '2/3', standard: 'DVB-S2', constellation: 'QPSK', eirpDbw: 45,
    listedChannels: ['Illustrative channel D'],
    provenance: 'ILLUSTRATIVE_FIXTURE', reportedStatus: null,
  },
]

const C = 299792458
const BOLTZMANN = 1.380649e-23
const EARTH_KM = 6378.137
const GEO_KM = 42164.0
const rad = (degrees: number) => degrees * Math.PI / 180
const deg = (radians: number) => radians * 180 / Math.PI
const blank = (status: SimulationStatus, issue: string | null, geometry?: { elevationDeg: number; slantRangeKm: number }): ModelResult => ({
  status, issue, elevationDeg: geometry?.elevationDeg ?? null, slantRangeKm: geometry?.slantRangeKm ?? null,
  dishGainDbi: null, fsplDb: null, carrierDbw: null, noiseDbw: null,
  cnDb: null, thresholdDb: null, marginDb: null, bandwidthHz: null,
})

const thresholdTable: Record<string, number> = {
  // Educational assumed C/N thresholds in dB; NOT definitive DVB MODCOD specs.
  'DVB-S:QPSK:1/2': 4, 'DVB-S:QPSK:2/3': 5.5, 'DVB-S:QPSK:3/4': 6.5,
  'DVB-S:QPSK:5/6': 7.5, 'DVB-S:QPSK:7/8': 8.3,
  'DVB-S2:QPSK:1/2': 2.5, 'DVB-S2:QPSK:2/3': 4, 'DVB-S2:QPSK:3/4': 5.5,
  'DVB-S2:QPSK:5/6': 6.4, 'DVB-S2:QPSK:8/9': 7.5,
  'DVB-S2:8PSK:2/3': 9, 'DVB-S2:8PSK:3/4': 10.8,
  'DVB-S2:8PSK:5/6': 12.5, 'DVB-S2:8PSK:8/9': 13.8,
}
export const THRESHOLDS = Object.freeze(thresholdTable)
export const SUPPORTED_FEC = ['1/2', '2/3', '3/4', '5/6', '7/8', '8/9'] as const

export function geoGeometry(latDeg: number, lonDeg: number, orbitalLonDeg: number): { elevationDeg: number; slantRangeKm: number } | null {
  if (![latDeg, lonDeg, orbitalLonDeg].every(Number.isFinite) || Math.abs(latDeg) > 90 || Math.abs(lonDeg) > 180 || Math.abs(orbitalLonDeg) > 180) return null
  const psiCos = Math.max(-1, Math.min(1, Math.cos(rad(latDeg)) * Math.cos(rad(lonDeg - orbitalLonDeg))))
  const slantRangeKm = Math.sqrt(GEO_KM ** 2 + EARTH_KM ** 2 - 2 * GEO_KM * EARTH_KM * psiCos)
  const elevationDeg = deg(Math.atan2(psiCos - EARTH_KM / GEO_KM, Math.sqrt(Math.max(0, 1 - psiCos ** 2))))
  return { elevationDeg, slantRangeKm }
}

function validSettings(s: ReceiverSettings): boolean {
  const numbers = Object.values(s)
  return numbers.every(Number.isFinite) &&
    Math.abs(s.latDeg) <= 90 && Math.abs(s.lonDeg) <= 180 &&
    s.dishDiameterM >= 0.2 && s.dishDiameterM <= 15 &&
    s.dishEfficiency > 0 && s.dishEfficiency <= 1 &&
    s.rainFadeDb >= 0 && s.rainFadeDb <= 50 &&
    s.pointingLossDb >= 0 && s.pointingLossDb <= 30 &&
    s.cableLossDb >= 0 && s.cableLossDb <= 20 &&
    s.lnbNoiseFigureDb >= 0 && s.lnbNoiseFigureDb <= 10 &&
    s.antennaTemperatureK > 0 && s.antennaTemperatureK <= 1500 &&
    s.rolloff >= 0 && s.rolloff <= 0.6
}

export function simulateTransponder(tp: Transponder, settings: ReceiverSettings): ModelResult {
  if (!validSettings(settings)) return blank('INCOMPLETE', 'Receiver settings are outside supported educational bounds.')
  if (tp.orbitLongitudeDeg === null) return blank('INCOMPLETE', 'Orbital longitude is missing.')
  const geometry = geoGeometry(settings.latDeg, settings.lonDeg, tp.orbitLongitudeDeg)
  if (!geometry) return blank('INCOMPLETE', 'Invalid orbital position.')
  // Geometry is tested before any signal estimates. No gain can fix an earth-blocked satellite.
  if (geometry.elevationDeg <= 0) return blank('BELOW_HORIZON', 'Satellite is below the geometric horizon at this model site.', geometry)
  if (
    tp.frequencyMHz === null || tp.frequencyMHz < 10000 || tp.frequencyMHz > 14000 ||
    tp.symbolRateKSps === null || tp.symbolRateKSps < 100 || tp.symbolRateKSps > 70000 ||
    tp.eirpDbw === null || !Number.isFinite(tp.eirpDbw) || tp.eirpDbw < 10 || tp.eirpDbw > 75 ||
    !tp.standard || !tp.constellation || !tp.fec
  ) return blank('INCOMPLETE', 'Frequency, symbol rate, assumed EIRP, standard, constellation or FEC is missing/unsupported.', geometry)
  const requiredCnDb = THRESHOLDS[tp.standard + ':' + tp.constellation + ':' + tp.fec]
  if (requiredCnDb === undefined) return blank('INCOMPLETE', 'No illustrative C/N threshold defined for this MODCOD.', geometry)

  const wavelength = C / (tp.frequencyMHz * 1e6)
  const dishGainDbi = 10 * Math.log10(settings.dishEfficiency * (Math.PI * settings.dishDiameterM / wavelength) ** 2)
  const fsplDb = 20 * Math.log10(4 * Math.PI * geometry.slantRangeKm * 1000 / wavelength)
  const carrierDbw = tp.eirpDbw + dishGainDbi - fsplDb - settings.rainFadeDb - settings.pointingLossDb - settings.cableLossDb
  // Equivalent receiver noise temperature from noise figure at T0=290 K.
  // Antenna temperature is a user assumption; other system and implementation
  // losses are omitted in v0.8 (therefore margins are optimistic).
  const equivalentReceiverTempK = 290 * (10 ** (settings.lnbNoiseFigureDb / 10) - 1)
  const systemTempK = settings.antennaTemperatureK + equivalentReceiverTempK
  const bandwidthHz = tp.symbolRateKSps * 1000 * (1 + settings.rolloff)
  const noiseDbw = 10 * Math.log10(BOLTZMANN * systemTempK * bandwidthHz)
  const cnDb = carrierDbw - noiseDbw
  const marginDb = cnDb - requiredCnDb // SIGNED. Do not clamp, subtract twice, or add random jitter.
  const status: SimulationStatus = marginDb >= 3 ? 'SIMULATED_LOCK' : marginDb >= 0 ? 'MARGINAL_MODEL' : 'NO_MODEL_LOCK'
  return {
    status, issue: null, elevationDeg: geometry.elevationDeg, slantRangeKm: geometry.slantRangeKm,
    dishGainDbi, fsplDb, carrierDbw, noiseDbw, cnDb,
    thresholdDb: requiredCnDb, marginDb, bandwidthHz,
  }
}

export function resultReceipt(tp: Transponder, settings: ReceiverSettings, result: ModelResult): string {
  return JSON.stringify({
    schemaVersion: 1, kind: 'RCTV_FTA_EDUCATIONAL_SIMULATION',
    provenance: tp.provenance, inputClaim: tp.reportedStatus,
    satellite: tp.satellite, transponder: tp,
    site: { assumedLatDeg: settings.latDeg, assumedLonDeg: settings.lonDeg },
    receiverAssumptions: settings, result,
    disclosures: [
      'All locks are calculated, not observed.',
      'All channel names are unverified listing examples, not received services.',
      'Thresholds and EIRP are illustrative and not calibrated for DVB compliance.',
      'No actual RF measurement, hardware lock, transport stream or playback occurred.',
    ],
  }, null, 2)
}
