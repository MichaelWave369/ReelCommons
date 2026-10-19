/**
 * RCTV v1.1: strict user-supplied Windows CIM diagnostic report validation.
 * Even a report labeled WINDOWS_CIM_SNAPSHOT is UNVERIFIED as to origin.
 */
export const DEVICE_DIAGNOSTIC_SCHEMA = 'RCTV_DEVICE_DIAGNOSTICS_V1'
export const MAX_DIAGNOSTIC_BYTES = 80_000
export type DiagnosticSource = 'WINDOWS_CIM_SNAPSHOT' | 'SYNTHETIC_DEMO'
export type WindowsDiagnostic = 'WINDOWS_REPORTS_OK' | 'WINDOWS_REPORTS_DEVICE_ISSUE' | 'WINDOWS_STATUS_UNCERTAIN'
export interface DiagnosticCandidate {
  name: string
  deviceClass: string
  windowsStatus: string
  configManagerErrorCode: number | null
  candidateType: 'POSSIBLE_BROADCAST_TUNER' | 'POSSIBLE_SDR'
  diagnostic: WindowsDiagnostic
}
export interface DiagnosticReport {
  schema: typeof DEVICE_DIAGNOSTIC_SCHEMA
  source: DiagnosticSource
  platform: 'Windows' | 'Synthetic'
  generatedAt: string
  candidateOnly: true
  truncated: boolean
  devices: DiagnosticCandidate[]
  observations: {
    rfLockObserved: false
    signalMeasured: false
    programDecoded: false
  }
  disclosure: string
}
export interface DiagnosticChange {
  name: string
  change: 'NAME_APPEARED' | 'NAME_DISAPPEARED' | 'WINDOWS_STATE_CHANGED'
  from: WindowsDiagnostic | null
  to: WindowsDiagnostic | null
}
const obj = (a: unknown): a is Record<string, unknown> => !!a && typeof a === 'object' && !Array.isArray(a)
const cleanText = (a: unknown, max: number): a is string =>
  typeof a === 'string' && !!a.trim() && a.length <= max && !/[\u0000-\u001f\u007f]/.test(a)
const keysOnly = (record: Record<string, unknown>, allowed: string[]) =>
  Object.keys(record).every((key) => allowed.includes(key))
const diagnosticFor = (status: string, code: number | null): WindowsDiagnostic =>
  code !== null && code !== 0 ? 'WINDOWS_REPORTS_DEVICE_ISSUE'
    : code === 0 && status.trim().toUpperCase() === 'OK' ? 'WINDOWS_REPORTS_OK' : 'WINDOWS_STATUS_UNCERTAIN'

export function parseDiagnosticReport(raw: string): DiagnosticReport {
  if (raw.length > MAX_DIAGNOSTIC_BYTES) throw new Error('File exceeds the 80 KB report limit.')
  let json: unknown
  try { json = JSON.parse(raw) as unknown }
  catch { throw new Error('File contains invalid JSON.') }
  if (!obj(json) || json.schema !== DEVICE_DIAGNOSTIC_SCHEMA) throw new Error('Expected an RCTV Device Diagnostics v1.1 report.')
  if (json.source !== 'WINDOWS_CIM_SNAPSHOT' && json.source !== 'SYNTHETIC_DEMO') throw new Error('Unknown source type.')
  const source = json.source
  const platform = source === 'SYNTHETIC_DEMO' ? 'Synthetic' : 'Windows'
  if (json.platform !== platform || json.candidateOnly !== true || typeof json.truncated !== 'boolean')
    throw new Error('Source platform and candidate-only metadata do not agree.')
  if (!cleanText(json.generatedAt, 42) || !Number.isFinite(Date.parse(json.generatedAt)))
    throw new Error('Report timestamp is invalid.')
  if (!cleanText(json.disclosure, 600)) throw new Error('Expected explicit provenance disclosure.')
  const r = json.observations
  if (!obj(r) || !keysOnly(r, ['rfLockObserved', 'signalMeasured', 'programDecoded']) ||
    r.rfLockObserved !== false || r.signalMeasured !== false || r.programDecoded !== false)
    throw new Error('Unsupported RF/decode authority claim; Windows PnP cannot verify this.')
  if (!Array.isArray(json.devices) || json.devices.length > 32) throw new Error('Report exceeds 32 candidate devices.')
  const devices: DiagnosticCandidate[] = json.devices.map((dev: unknown) => {
    if (!obj(dev) || !keysOnly(dev, ['name', 'deviceClass', 'windowsStatus', 'configManagerErrorCode', 'candidateType', 'diagnostic']))
      throw new Error('Device contains unsupported or potentially identifying fields.')
    if (!cleanText(dev.name, 105) || !cleanText(dev.deviceClass, 55) || !cleanText(dev.windowsStatus, 35))
      throw new Error('Device names or Windows metadata are invalid.')
    if (dev.candidateType !== 'POSSIBLE_BROADCAST_TUNER' && dev.candidateType !== 'POSSIBLE_SDR')
      throw new Error('Unknown hardware candidate category.')
    const code = dev.configManagerErrorCode
    if (code !== null && (typeof code !== 'number' || !Number.isInteger(code) || code < 0 || code > 0xffffffff))
      throw new Error('Expected Windows ConfigManagerErrorCode or null.')
    const normalizedCode = code as number | null
    const expected = diagnosticFor(dev.windowsStatus, normalizedCode)
    if (dev.diagnostic !== expected) throw new Error('Windows diagnostic classification is inconsistent with reported inputs.')
    return {
      name: dev.name, deviceClass: dev.deviceClass, windowsStatus: dev.windowsStatus,
      configManagerErrorCode: normalizedCode, candidateType: dev.candidateType, diagnostic: expected,
    }
  })
  return {
    schema: DEVICE_DIAGNOSTIC_SCHEMA, source, platform, generatedAt: json.generatedAt,
    candidateOnly: true, truncated: json.truncated, devices,
    observations: { rfLockObserved: false, signalMeasured: false, programDecoded: false },
    disclosure: json.disclosure,
  }
}
export const DIAGNOSTIC_DEMO: DiagnosticReport = {
  schema: DEVICE_DIAGNOSTIC_SCHEMA, source: 'SYNTHETIC_DEMO', platform: 'Synthetic',
  generatedAt: '2026-10-18T23:00:00Z', candidateOnly: true, truncated: false,
  devices: [
    { name: 'RCTV DEMO DVB-S2 Receiver', deviceClass: 'Media', windowsStatus: 'OK',
      configManagerErrorCode: 0, candidateType: 'POSSIBLE_BROADCAST_TUNER', diagnostic: 'WINDOWS_REPORTS_OK' },
    { name: 'RCTV DEMO RTL-SDR', deviceClass: 'USB', windowsStatus: 'Error',
      configManagerErrorCode: 28, candidateType: 'POSSIBLE_SDR', diagnostic: 'WINDOWS_REPORTS_DEVICE_ISSUE' },
  ],
  observations: { rfLockObserved: false, signalMeasured: false, programDecoded: false },
  disclosure: 'Synthetic educational inventory, not evidence of real hardware or a Windows system.',
}

// Key is only a reported name/class pair. Two devices can share it or
// change the name after a driver update; do not treat this as serial identity.
const candidateKey = (d: DiagnosticCandidate) =>
  JSON.stringify([d.name.trim().toLowerCase(), d.deviceClass.trim().toLowerCase()])
export function compareDiagnosticReports(before: DiagnosticReport, after: DiagnosticReport): DiagnosticChange[] {
  const a = new Map(before.devices.map((d) => [candidateKey(d), d]))
  const b = new Map(after.devices.map((d) => [candidateKey(d), d]))
  const changes: DiagnosticChange[] = []
  for (const [key, old] of a) {
    const next = b.get(key)
    if (!next) changes.push({ name: old.name, change: 'NAME_DISAPPEARED', from: old.diagnostic, to: null })
    else if (next.diagnostic !== old.diagnostic)
      changes.push({ name: next.name, change: 'WINDOWS_STATE_CHANGED', from: old.diagnostic, to: next.diagnostic })
  }
  for (const [key, next] of b) {
    if (!a.has(key)) changes.push({ name: next.name, change: 'NAME_APPEARED', from: null, to: next.diagnostic })
  }
  return changes.slice(0, 64)
}
export function diagnosticReceipt(report: DiagnosticReport): string {
  return JSON.stringify({
    kind: 'RCTV_USER_IMPORTED_WINDOWS_DEVICE_DIAGNOSTICS',
    reportedSource: report.source, reportedTimestamp: report.generatedAt,
    candidates: report.devices, truncationReported: report.truncated,
    authority: 'UNVERIFIED_USER_SUPPLIED_FILE',
    physicalDeviceIdentityEstablished: false, tunerCompatibilityEstablished: false,
    actualRFMeasurements: false, decodedTVChannels: false,
    warning: 'Windows CIM status and ConfigManagerErrorCode are device state hints, not verified TV reception or authentic hardware telemetry.',
  }, null, 2)
}
