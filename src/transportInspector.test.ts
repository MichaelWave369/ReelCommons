import { describe, expect, it } from 'vitest'
import { syntheticTransportFixture } from './syntheticTransport'
import {
  inspectTransportStream, MAX_TS_BYTES, mpegPsiCrcValid, streamTypeLabel, transportEvidenceReceipt,
} from './transportInspector'

function withCrc(data: number[]): number[] {
  let crc = 0xffffffff
  for (const byte of data) {
    crc = (crc ^ (byte << 24)) >>> 0
    for (let n = 0; n < 8; n++) crc = crc & 0x80000000 ? ((crc << 1) ^ 0x04c11db7) >>> 0 : (crc << 1) >>> 0
  }
  return [...data, (crc >>> 24) & 255, (crc >>> 16) & 255, (crc >>> 8) & 255, crc & 255]
}
const pat = withCrc([0x00, 0xb0, 0x0d, 0x00, 0x01, 0xc1, 0x00, 0x00, 0x00, 0x01, 0xe1, 0x00])
const pmt = withCrc([
  0x02, 0xb0, 0x17, 0x00, 0x01, 0xc1, 0x00, 0x00, 0xe1, 0x01, 0xf0, 0x00,
  0x1b, 0xe1, 0x01, 0xf0, 0x00,
  0x0f, 0xe1, 0x02, 0xf0, 0x00,
])
function packet(pid: number, cc: number, payload: number[], opts: { pusi?: boolean; scrambled?: boolean; error?: boolean; maxPayload?: number } = {}): Uint8Array {
  const data = new Uint8Array(188).fill(0xff)
  data[0] = 0x47
  data[1] = (opts.pusi ? 0x40 : 0) | (opts.error ? 0x80 : 0) | (pid >> 8)
  data[2] = pid & 0xff
  const max = opts.maxPayload ?? 184
  if (max < payload.length || max > 184) throw new Error('Test packet payload will not fit.')
  const hasAdaptation = max < 184
  data[3] = (opts.scrambled ? 0x80 : 0) | (hasAdaptation ? 0x30 : 0x10) | cc
  let start = 4
  if (hasAdaptation) {
    const len = 183 - max
    data[4] = len
    start = 5 + len
  }
  data.set(payload, start)
  return data
}
function sample(packets: Uint8Array[]): Uint8Array {
  const combined = new Uint8Array(packets.length * 188)
  packets.forEach((p, n) => combined.set(p, n * 188))
  return combined
}
const common = () => [
  packet(0x0000, 0, [0x00, ...pat], { pusi: true }),
  packet(0x0100, 0, [0x00, ...pmt], { pusi: true }),
  packet(0x0101, 0, [0x00, 0x00, 0x01, 0xe0, 0x80], { pusi: true }),
  packet(0x0102, 0, [0x00, 0x00, 0x01, 0xc0], { pusi: true }),
  packet(0x1fff, 0, []),
]

describe('RCTV Signal Bridge transport sample inspector', () => {
  it('validates MPEG PSI CRC and extracts one program with codec-tagged streams', () => {
    expect(mpegPsiCrcValid(Uint8Array.from(pat))).toBe(true)
    expect(mpegPsiCrcValid(Uint8Array.from(pmt))).toBe(true)
    const report = inspectTransportStream(sample(common()), '2026-10-18T12:00:00.000Z')
    expect(report.kind).toBe('RCTV_LOCAL_TRANSPORT_SAMPLE')
    expect(report.provenance).toBe('OBSERVED_LOCAL_FILE_BYTES')
    expect(report.packets).toBe(5)
    expect(report.crcValidPatSections).toBe(1)
    expect(report.crcValidPmtSections).toBe(1)
    expect(report.programs).toEqual([{
      number: 1, pmtPid: 0x100, pcrPid: 0x101, pmtCrcValid: true,
      streams: [
        { pid: 0x101, typeId: 0x1b, codecHint: 'H.264 / AVC video' },
        { pid: 0x102, typeId: 0x0f, codecHint: 'AAC audio (ADTS)' },
      ],
    }])
    expect(report.continuityAnomalies).toBe(0)
    expect(report.scrambledPackets).toBe(0)
  })
  it('rejects malformed, unsupported and oversized files rather than guessing sync', () => {
    expect(() => inspectTransportStream(new Uint8Array(120))).toThrow()
    expect(() => inspectTransportStream(new Uint8Array(188 * 4))).toThrow(/sync/)
    expect(() => inspectTransportStream(new Uint8Array(MAX_TS_BYTES + 1))).toThrow(/limit/)
    expect(streamTypeLabel(0xab)).toMatch(/Unrecognized/)
  })
  it('detects packet-aligned samples with a short non-TS prefix', () => {
    const content = sample(common())
    const prefixed = new Uint8Array(content.length + 5)
    prefixed.set([1, 2, 3, 4, 5])
    prefixed.set(content, 5)
    const result = inspectTransportStream(prefixed)
    expect(result.alignmentOffset).toBe(5)
    expect(result.programs).toHaveLength(1)
  })
  it('ignores PSI tables with invalid CRC and never invents found programs', () => {
    const invalid = [...pat]
    invalid[10] ^= 0x01
    const report = inspectTransportStream(sample([
      packet(0, 0, [0, ...invalid], { pusi: true }),
      packet(0x100, 0, [0, ...pmt], { pusi: true }),
      ...common().slice(2),
    ]))
    expect(report.crcValidPatSections).toBe(0)
    expect(report.invalidPsiSections).toBeGreaterThanOrEqual(1)
    expect(report.programs).toEqual([])
    expect(report.warnings.join(' ')).toContain('No CRC-valid PAT')
  })
  it('handles PAT sections split across TS packets with adaptation fields', () => {
    const first = pat.slice(0, 10)
    const second = pat.slice(10)
    const report = inspectTransportStream(sample([
      packet(0, 0, [0, ...first], { pusi: true, maxPayload: 11 }),
      packet(0, 1, second),
      packet(0x100, 0, [0, ...pmt], { pusi: true }),
      ...common().slice(2),
    ]))
    expect(report.crcValidPatSections).toBe(1)
    expect(report.programs[0].streams).toHaveLength(2)
  })
  it('detects CC anomalies and scrambled flags without decoding protected media', () => {
    const report = inspectTransportStream(sample([
      ...common(),
      packet(0x101, 1, [0x33, 0x44], { scrambled: true }),
      packet(0x101, 3, [0x55]),
    ]))
    expect(report.continuityAnomalies).toBe(1)
    expect(report.scrambledPackets).toBe(1)
    expect(report.warnings.join(' ')).toMatch(/No decryption/)
  })
  it('records TEI, validates adaptation lengths and reports local-file evidence caveat', () => {
    const broken = packet(0x103, 0, [])
    broken[3] = 0x30
    broken[4] = 255
    const report = inspectTransportStream(sample([
      ...common(),
      packet(0x103, 0, [0xaa], { error: true }),
      broken,
    ]))
    expect(report.transportErrors).toBe(1)
    expect(report.invalidAdaptationPackets).toBe(1)
    const receipt = transportEvidenceReceipt(report, 'my-capture.ts', 10000)
    expect(receipt).toContain('OBSERVED_LOCAL_FILE_BYTES')
    expect(receipt).toContain('origin and broadcaster authenticity were not independently verified')
    expect(receipt).toContain('no actual RF lock')
  })
  it('does not interpret program maps as actual live television or playable video', () => {
    const result = inspectTransportStream(sample(common()))
    expect(result.warnings.join(' ')).toContain('not from observed RF hardware')
    expect(result.warnings.join(' ')).toContain('not video decodability')
  })
})


describe('synthetic transport tutorial', () => {
  it('produces CRC-valid PAT/PMT sample data while clearly labeling it non-observational', () => {
    const fixture = syntheticTransportFixture()
    expect(fixture.length).toBe(188 * 6)
    const report = inspectTransportStream(fixture, '2026-10-18T12:00:00Z', 'GENERATED_DEMO_BYTES')
    expect(report.provenance).toBe('GENERATED_DEMO_BYTES')
    expect(report.crcValidPatSections).toBeGreaterThan(0)
    expect(report.crcValidPmtSections).toBeGreaterThan(0)
    expect(report.programs[0].number).toBe(42)
    expect(report.programs[0].streams).toHaveLength(2)
    expect(report.warnings.join(' ')).toContain('not a hardware observation')
    expect(transportEvidenceReceipt(report, 'generated-fixture.ts', fixture.length))
      .toContain('No original broadcast or hardware observation exists')
  })
})
