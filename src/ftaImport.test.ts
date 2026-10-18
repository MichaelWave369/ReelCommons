import { describe, expect, it } from 'vitest'
import { importFtaJson, orbitalLongitudeFromName } from './ftaImport'

describe('source-provenant FTA import', () => {
  it('parses the uploaded Gemini-style satellite map without inventing missing parameters', () => {
    const payload = JSON.stringify({
      'Galaxy 19 (97W)': [{
        Frequency: '11789 MHz', Modulation_Standard: 'DVB-S', Status: 'LOCKED',
        Signal_Margin_dB: '26.0 dB', Found_Channels: ['KBS World', 'RT News', 'CGTN'],
      }],
      'Eutelsat 9B (9E)': [{
        Frequency: '11900 MHz', Modulation_Standard: 'DVB-S2', Status: 'LOCKED',
        Found_Channels: ['M6 HD'],
      }],
    })
    const value = importFtaJson(payload)
    expect(value.records).toHaveLength(2)
    expect(value.records[0].orbitLongitudeDeg).toBe(-97)
    expect(value.records[1].orbitLongitudeDeg).toBe(9)
    expect(value.records[0].symbolRateKSps).toBeNull()
    expect(value.records[0].eirpDbw).toBeNull()
    expect(value.records[0].reportedStatus).toBe('LOCKED')
    expect(value.records[0].provenance).toBe('USER_IMPORTED')
    expect(value.warnings.join(' ')).toContain('unverified')
  })
  it('accepts richer Grok-style nested output, keeping arbitrary lock claims separate', () => {
    const value = importFtaJson(JSON.stringify({
      satellites: {
        'Galaxy 19 (97W)': [{
          Frequency: '11842 MHz', Polarization: 'H', Symbol_Rate: 22000,
          FEC: '3/4', Modulation_Standard: 'DVB-S', EIRP_dBW: 48.5,
          Status: 'LOCKED', Found_Channels: ['Example'],
        }],
      },
    }))
    expect(value.records[0].symbolRateKSps).toBe(22000)
    expect(value.records[0].fec).toBe('3/4')
    expect(value.records[0].eirpDbw).toBe(48.5)
    expect(value.records[0].constellation).toBe('QPSK')
  })
  it('does not mistake unknown satellite name or arbitrary RF data for geometry', () => {
    expect(orbitalLongitudeFromName('Satellite Unknown')).toBeNull()
    expect(orbitalLongitudeFromName('99.2°W')).toBe(-99.2)
    expect(orbitalLongitudeFromName('200E')).toBeNull()
  })
  it('bounds malformed or oversized input and strips channel junk', () => {
    expect(() => importFtaJson('not json')).toThrow()
    expect(() => importFtaJson('X'.repeat(200001))).toThrow()
    expect(() => importFtaJson('{}')).toThrow()
    const value = importFtaJson(JSON.stringify({ 'Example (75W)': [{
      Frequency: '12500 MHz', Found_Channels: ['one', '', null, 'one', 'two'],
    }] }))
    expect(value.records[0].listedChannels).toEqual(['one', 'two'])
  })
})
