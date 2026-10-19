import { describe, expect, it } from 'vitest'
import { compareDiagnosticReports, DIAGNOSTIC_DEMO, diagnosticReceipt, parseDiagnosticReport } from './deviceDiagnostics'

const example = () => JSON.stringify(DIAGNOSTIC_DEMO)
describe('Windows diagnostic receipt trust boundary', () => {
  it('accepts bounded demo but never authenticates source', () => {
    const parsed = parseDiagnosticReport(example())
    expect(parsed.devices).toHaveLength(2)
    expect(parsed.source).toBe('SYNTHETIC_DEMO')
    expect(parsed.observations.rfLockObserved).toBe(false)
    expect(diagnosticReceipt(parsed)).toContain('UNVERIFIED_USER_SUPPLIED_FILE')
  })
  it('accepts a user-supplied Windows source CLAIM, with no measured RF', () => {
    const r = parseDiagnosticReport(JSON.stringify({ ...DIAGNOSTIC_DEMO, source: 'WINDOWS_CIM_SNAPSHOT', platform: 'Windows' }))
    expect(r.source).toBe('WINDOWS_CIM_SNAPSHOT')
    expect(r.observations.programDecoded).toBe(false)
  })
  it('rejects device identifier fields and suspicious unbounded inputs', () => {
    expect(() => parseDiagnosticReport(JSON.stringify({
      ...DIAGNOSTIC_DEMO, devices: [{ ...DIAGNOSTIC_DEMO.devices[0], PNPDeviceID: 'SERIAL' }],
    }))).toThrow(/identifying/)
    expect(() => parseDiagnosticReport('x'.repeat(80001))).toThrow(/80 KB/)
    expect(() => parseDiagnosticReport('{')).toThrow(/invalid JSON/)
  })
  it('rejects RF promotion, metadata disagreement and invented status interpretations', () => {
    expect(() => parseDiagnosticReport(JSON.stringify({
      ...DIAGNOSTIC_DEMO, observations: { ...DIAGNOSTIC_DEMO.observations, rfLockObserved: true },
    }))).toThrow(/RF\/decode/)
    expect(() => parseDiagnosticReport(JSON.stringify({
      ...DIAGNOSTIC_DEMO, devices: [{ ...DIAGNOSTIC_DEMO.devices[0], diagnostic: 'WINDOWS_REPORTS_DEVICE_ISSUE' }],
    }))).toThrow(/inconsistent/)
  })
  it('rejects incompatible platform, invalid Windows error codes and schemas', () => {
    expect(() => parseDiagnosticReport(JSON.stringify({ ...DIAGNOSTIC_DEMO, source: 'WINDOWS_CIM_SNAPSHOT' }))).toThrow(/platform/)
    expect(() => parseDiagnosticReport(JSON.stringify({
      ...DIAGNOSTIC_DEMO, devices: [{ ...DIAGNOSTIC_DEMO.devices[0], configManagerErrorCode: -1 }],
    }))).toThrow(/ConfigManager/)
    expect(() => parseDiagnosticReport(JSON.stringify({ ...DIAGNOSTIC_DEMO, schema: 'fake' }))).toThrow(/Diagnostics/)
  })
  it('compares state and presence by name without pretending to know device identity', () => {
    const baseline = parseDiagnosticReport(example())
    const updated = parseDiagnosticReport(JSON.stringify({
      ...DIAGNOSTIC_DEMO,
      devices: [{ ...DIAGNOSTIC_DEMO.devices[0], configManagerErrorCode: 28, diagnostic: 'WINDOWS_REPORTS_DEVICE_ISSUE' },
        { name: 'New DVB-T2 candidate', deviceClass: 'Media', windowsStatus: 'OK', configManagerErrorCode: 0,
          candidateType: 'POSSIBLE_BROADCAST_TUNER', diagnostic: 'WINDOWS_REPORTS_OK' }],
    }))
    const diffs = compareDiagnosticReports(baseline, updated)
    expect(diffs.map((a) => a.change).sort()).toEqual(['NAME_APPEARED', 'NAME_DISAPPEARED', 'WINDOWS_STATE_CHANGED'])
    expect(compareDiagnosticReports(updated, updated)).toEqual([])
  })
  it('supports empty reports and unknown Windows state without inventing missing driver health', () => {
    const r = parseDiagnosticReport(JSON.stringify({
      ...DIAGNOSTIC_DEMO, devices: [{ ...DIAGNOSTIC_DEMO.devices[0], configManagerErrorCode: null,
        windowsStatus: 'Unknown', diagnostic: 'WINDOWS_STATUS_UNCERTAIN' }],
    }))
    expect(r.devices[0].diagnostic).toBe('WINDOWS_STATUS_UNCERTAIN')
    expect(compareDiagnosticReports(parseDiagnosticReport(JSON.stringify({ ...DIAGNOSTIC_DEMO, devices: [] })), r)[0].change).toBe('NAME_APPEARED')
  })
})
