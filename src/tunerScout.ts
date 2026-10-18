/**
 * RCTV v1.0 Tuner Scout: validate user-selected local inventory exports.
 * Imported JSON is untrusted user-provided data, even when it claims Windows
 * PnP provenance. Neither reported PnP status nor an exported device name
 * constitutes observed RF, working drivers, or a verified receiver.
 */
export const TUNER_SCOUT_SCHEMA = 'RCTV_TUNER_SCOUT_V1'
export const MAX_SCOUT_JSON_BYTES = 80_000
export type CandidateType = 'POSSIBLE_BROADCAST_TUNER' | 'POSSIBLE_SDR'
export type ScoutSource = 'WINDOWS_PNP_ENUMERATION' | 'SYNTHETIC_DEMO'
export interface ScoutDevice {
  name: string
  deviceClass: string
  pnpStatus: string
  candidateType: CandidateType
}
export interface ScoutReport {
  schema: typeof TUNER_SCOUT_SCHEMA
  source: ScoutSource
  generatedAt: string
  platform: 'Windows' | 'Synthetic'
  candidateOnly: true
  scanResult: 'CANDIDATES_LISTED' | 'NO_MATCHING_DEVICE_NAMES'
  truncated: boolean
  devices: ScoutDevice[]
  rf: {
    hardwareLockObserved: false
    signalMeasurementsAvailable: false
    transportStreamDecoded: false
  }
  disclosure: string
}
export const DEMO_SCOUT_REPORT: ScoutReport = {
  schema: TUNER_SCOUT_SCHEMA,
  source: 'SYNTHETIC_DEMO',
  generatedAt: '2026-10-18T00:00:00Z',
  platform: 'Synthetic', candidateOnly: true,
  scanResult: 'CANDIDATES_LISTED', truncated: false,
  devices: [
    { name: 'RCTV DEMO DVB-S2 Receiver', deviceClass: 'Media', pnpStatus: 'OK', candidateType: 'POSSIBLE_BROADCAST_TUNER' },
    { name: 'RCTV DEMO RTL-SDR', deviceClass: 'USB', pnpStatus: 'OK', candidateType: 'POSSIBLE_SDR' },
  ],
  rf: { hardwareLockObserved: false, signalMeasurementsAvailable: false, transportStreamDecoded: false },
  disclosure: 'Synthetic demonstration only. These devices are imaginary and no hardware was observed.',
}
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isLimitedText = (x: unknown, limit: number): x is string =>
  typeof x === 'string' && x.length > 0 && x.length <= limit && !/[\u0000-\u001f\u007f]/.test(x)

export function parseScoutReport(raw: string): ScoutReport {
  if (raw.length > MAX_SCOUT_JSON_BYTES) throw new Error('Scout report exceeds the 80 KB import limit.')
  let json: unknown
  try { json = JSON.parse(raw) as unknown } catch { throw new Error('This file is not valid JSON.') }
  if (!isRecord(json) || json.schema !== TUNER_SCOUT_SCHEMA) throw new Error('Expected an RCTV Tuner Scout v1 report.')
  if (json.source !== 'WINDOWS_PNP_ENUMERATION' && json.source !== 'SYNTHETIC_DEMO')
    throw new Error('Unknown inventory source; cannot determine whether report is synthetic.')
  if (json.platform !== (json.source === 'SYNTHETIC_DEMO' ? 'Synthetic' : 'Windows'))
    throw new Error('Report platform and source do not agree.')
  if (json.candidateOnly !== true || json.truncated !== false && json.truncated !== true)
    throw new Error('Invalid candidate-only or truncation metadata.')
  const instant = typeof json.generatedAt === 'string' ? Date.parse(json.generatedAt) : NaN
  if (!Number.isFinite(instant) || !isLimitedText(json.generatedAt, 42))
    throw new Error('Missing or invalid report timestamp.')
  const rf = json.rf
  if (!isRecord(rf) || rf.hardwareLockObserved !== false || rf.signalMeasurementsAvailable !== false || rf.transportStreamDecoded !== false)
    throw new Error('Unsupported RF authority claim. This version cannot import hardware lock or decoding evidence.')
  if (!Array.isArray(json.devices) || json.devices.length > 32)
    throw new Error('Inventory is not a bounded list of possible devices.')
  const devices: ScoutDevice[] = json.devices.map((entry: unknown) => {
    if (!isRecord(entry) || !isLimitedText(entry.name, 105) ||
      !isLimitedText(entry.deviceClass, 55) || !isLimitedText(entry.pnpStatus, 35) ||
      (entry.candidateType !== 'POSSIBLE_BROADCAST_TUNER' && entry.candidateType !== 'POSSIBLE_SDR'))
      throw new Error('Invalid device metadata; expected redacted PnP display fields only.')
    // Don't accept identifier, serial, IP, URL, or driver-install fields in a v1 report.
    if (Object.keys(entry).some((key) => !['name', 'deviceClass', 'pnpStatus', 'candidateType'].includes(key)))
      throw new Error('Device metadata contains unsupported or potentially identifying fields.')
    return { name: entry.name, deviceClass: entry.deviceClass, pnpStatus: entry.pnpStatus, candidateType: entry.candidateType }
  })
  const scanResult = devices.length ? 'CANDIDATES_LISTED' : 'NO_MATCHING_DEVICE_NAMES'
  if (json.scanResult !== scanResult || !isLimitedText(json.disclosure, 500))
    throw new Error('Scout report counts or disclosures do not match the schema.')
  // Canonical projection deliberately discards all undeclared extra fields.
  return {
    schema: TUNER_SCOUT_SCHEMA, source: json.source,
    generatedAt: json.generatedAt, platform: json.platform,
    candidateOnly: true, scanResult, truncated: json.truncated,
    devices, rf: {
      hardwareLockObserved: false,
      signalMeasurementsAvailable: false,
      transportStreamDecoded: false,
    }, disclosure: json.disclosure,
  }
}

export function scoutEvidenceReceipt(report: ScoutReport): string {
  return JSON.stringify({
    schema: TUNER_SCOUT_SCHEMA,
    kind: 'USER_SUPPLIED_DEVICE_INVENTORY',
    sourceClaim: report.source,
    reportTimestampClaim: report.generatedAt,
    importedDeviceCandidates: report.devices,
    truncated: report.truncated,
    observationAuthority: 'UNVERIFIED_LOCAL_EXPORT',
    measuredRF: false, confirmedTunerCompatibility: false, verifiedPlayback: false,
    warning: 'This is a user-imported report. Device names and OK states cannot prove receiver compatibility or RF lock.',
  }, null, 2)
}
