import { describe, expect, it } from 'vitest'
import { DEMO_SCOUT_REPORT, parseScoutReport, scoutEvidenceReceipt } from './tunerScout'

describe('RCTV user-supplied tuner inventory import', () => {
  const valid = () => JSON.stringify(DEMO_SCOUT_REPORT)
  it('accepts a bounded synthetic example and never upgrades its authority', () => {
    const data = parseScoutReport(valid())
    expect(data.source).toBe('SYNTHETIC_DEMO')
    expect(data.devices).toHaveLength(2)
    expect(data.rf.hardwareLockObserved).toBe(false)
    expect(scoutEvidenceReceipt(data)).toContain('"observationAuthority": "UNVERIFIED_LOCAL_EXPORT"')
  })
  it('also accepts truthful user-generated Windows PnP exports as unverified claims', () => {
    const parsed = parseScoutReport(JSON.stringify({
      ...DEMO_SCOUT_REPORT, platform: 'Windows', source: 'WINDOWS_PNP_ENUMERATION',
      generatedAt: '2026-10-18T15:00:00Z',
    }))
    expect(parsed.platform).toBe('Windows')
    expect(parsed.candidateOnly).toBe(true)
  })
  it('rejects reports that assert observed RF lock, transport decode or other authority', () => {
    for (const field of ['hardwareLockObserved', 'signalMeasurementsAvailable', 'transportStreamDecoded']) {
      const entry = { ...DEMO_SCOUT_REPORT, rf: { ...DEMO_SCOUT_REPORT.rf, [field]: true } }
      expect(() => parseScoutReport(JSON.stringify(entry))).toThrow(/RF authority/)
    }
  })
  it('rejects undeclared serials, IDs, addresses and unsafe additions', () => {
    const example = { ...DEMO_SCOUT_REPORT, devices: [{ ...DEMO_SCOUT_REPORT.devices[0], instanceId: 'USB\\SERIAL' }] }
    expect(() => parseScoutReport(JSON.stringify(example))).toThrow(/identifying/)
  })
  it('rejects forged schema, mismatched provenance and oversized input', () => {
    expect(() => parseScoutReport('{')).toThrow(/JSON/)
    expect(() => parseScoutReport('a'.repeat(80001))).toThrow(/80 KB/)
    expect(() => parseScoutReport(JSON.stringify({ ...DEMO_SCOUT_REPORT, schema: 'RCTV_FAKE' }))).toThrow(/Scout/)
    expect(() => parseScoutReport(JSON.stringify({ ...DEMO_SCOUT_REPORT, source: 'WINDOWS_PNP_ENUMERATION' }))).toThrow(/platform/)
  })
  it('handles empty inventories without asserting hardware is definitively absent', () => {
    const report = parseScoutReport(JSON.stringify({
      ...DEMO_SCOUT_REPORT, devices: [], scanResult: 'NO_MATCHING_DEVICE_NAMES',
    }))
    expect(report.devices).toHaveLength(0)
    expect(report.scanResult).toBe('NO_MATCHING_DEVICE_NAMES')
    expect(scoutEvidenceReceipt(report)).toContain('"measuredRF": false')
  })
  it('never trusts an inconsistent reported candidate count', () => {
    expect(() => parseScoutReport(JSON.stringify({
      ...DEMO_SCOUT_REPORT, scanResult: 'NO_MATCHING_DEVICE_NAMES',
    }))).toThrow(/counts/)
  })
})
