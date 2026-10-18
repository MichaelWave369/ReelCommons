/**
 * RCTV Signal Bridge v0.9: bounded, read-only MPEG-TS file inspector.
 * Parses a local sample of 188-byte ISO/IEC 13818-1 TS packets and
 * CRC-checked PAT/PMT sections. No tuner access, DRM bypass, or playback.
 * A transport file is NOT proof of an actual live RF lock or legal entitlement.
 */
export const MAX_TS_BYTES = 8 * 1024 * 1024
const PACKET_SIZE = 188
const MAX_PSI_BYTES = 1024
const MAX_PID_ENTRIES = 8192

export interface PidSummary { pid: number; packets: number; continuityAnomalies: number }
export interface StreamSummary { pid: number; typeId: number; codecHint: string }
export interface ProgramSummary {
  number: number
  pmtPid: number
  pcrPid: number | null
  streams: StreamSummary[]
  pmtCrcValid: boolean
}
export interface TransportReport {
  kind: 'RCTV_LOCAL_TRANSPORT_SAMPLE'
  provenance: 'OBSERVED_LOCAL_FILE_BYTES' | 'GENERATED_DEMO_BYTES'
  sampleBytes: number
  alignmentOffset: number
  packetSize: 188
  packets: number
  syncLosses: number
  transportErrors: number
  scrambledPackets: number
  invalidAdaptationPackets: number
  continuityAnomalies: number
  crcValidPatSections: number
  crcValidPmtSections: number
  invalidPsiSections: number
  programs: ProgramSummary[]
  topPids: PidSummary[]
  warnings: string[]
  observedAt: string
}
interface InternalPid {
  count: number
  anomalies: number
  lastPayloadCounter: number | null
  lastPacket: Uint8Array | null
}
interface PsiState { data: number[] }
const CODEC_NAMES: Record<number, string> = {
  0x01: 'MPEG-1 video', 0x02: 'MPEG-2 video', 0x03: 'MPEG-1 audio',
  0x04: 'MPEG-2 audio', 0x06: 'Private/descriptor-defined stream',
  0x0f: 'AAC audio (ADTS)', 0x11: 'AAC audio (LATM)',
  0x1b: 'H.264 / AVC video', 0x24: 'H.265 / HEVC video',
  0x81: 'Private AC-3 identifier (non-universal)',
}
export const streamTypeLabel = (id: number): string => CODEC_NAMES[id] ?? 'Unrecognized stream type'

// MPEG-2 PSI CRC, nonreflected CRC32: polynomial 0x04C11DB7, init 0xFFFFFFFF.
export function mpegPsiCrcValid(section: Uint8Array): boolean {
  let crc = 0xffffffff
  for (const byte of section) {
    crc = (crc ^ (byte << 24)) >>> 0
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x80000000) !== 0 ? ((crc << 1) ^ 0x04c11db7) >>> 0 : (crc << 1) >>> 0
    }
  }
  return crc === 0
}

function locatePackets(bytes: Uint8Array): number {
  for (let start = 0; start < Math.min(PACKET_SIZE, bytes.length); start++) {
    const available = Math.floor((bytes.length - start) / PACKET_SIZE)
    if (available < 3) continue
    let aligned = true
    for (let n = 0; n < Math.min(available, 5); n++) {
      if (bytes[start + n * PACKET_SIZE] !== 0x47) { aligned = false; break }
    }
    if (aligned) return start
  }
  throw new Error('No reliable 188-byte MPEG-TS sync alignment found. This inspector does not support 192/204-byte variants yet.')
}
function packetsEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}
function sectionLength(data: number[]): number | null {
  if (data.length < 3) return null
  const length = ((data[1] & 0x0f) << 8) | data[2]
  if (length < 4 || length > 1021) return -1
  return length + 3
}
function psiSections(state: PsiState, chunk: Uint8Array, emit: (section: Uint8Array) => void): number {
  let bad = 0
  for (const byte of chunk) {
    if (state.data.length === 0 && byte === 0xff) break // PSI stuffing
    state.data.push(byte)
    const fullLength = sectionLength(state.data)
    if (fullLength === -1 || state.data.length > MAX_PSI_BYTES) { state.data = []; bad++; continue }
    if (fullLength !== null && state.data.length === fullLength) {
      emit(Uint8Array.from(state.data))
      state.data = []
    }
  }
  return bad
}

export function inspectTransportStream(
  bytes: Uint8Array,
  observedAt = new Date().toISOString(),
  provenance: TransportReport['provenance'] = 'OBSERVED_LOCAL_FILE_BYTES',
): TransportReport {
  if (!(bytes instanceof Uint8Array)) throw new Error('Expected binary MPEG-TS bytes.')
  if (bytes.byteLength > MAX_TS_BYTES) throw new Error('Transport sample is over the 8 MiB inspection limit.')
  if (bytes.length < PACKET_SIZE * 3) throw new Error('At least three complete MPEG-TS packets are needed.')
  const offset = locatePackets(bytes)
  const packets = Math.floor((bytes.length - offset) / PACKET_SIZE)
  const pidMap = new Map<number, InternalPid>()
  const psiMap = new Map<number, PsiState>()
  const programPids = new Map<number, number>()
  const programDetail = new Map<number, ProgramSummary>()
  let syncLosses = 0, transportErrors = 0, scrambledPackets = 0, invalidAdaptationPackets = 0
  let continuityAnomalies = 0, crcValidPatSections = 0, crcValidPmtSections = 0, invalidPsiSections = 0

  function decodeSection(pid: number, section: Uint8Array) {
    if (!mpegPsiCrcValid(section)) { invalidPsiSections++; return }
    if (pid === 0 && section[0] === 0x00) {
      if (section.length < 12 || !(section[5] & 0x01)) { invalidPsiSections++; return }
      crcValidPatSections++
      for (let i = 8; i + 4 <= section.length - 4; i += 4) {
        const number = (section[i] << 8) | section[i + 1]
        const pmtPid = ((section[i + 2] & 0x1f) << 8) | section[i + 3]
        if (number > 0 && ![0, 0x1fff].includes(pmtPid)) programPids.set(number, pmtPid)
      }
      return
    }
    if (!Array.from(programPids.values()).includes(pid) || section[0] !== 0x02) return
    if (section.length < 16 || !(section[5] & 0x01)) { invalidPsiSections++; return }
    const number = (section[3] << 8) | section[4]
    if (programPids.get(number) !== pid) return
    const pcrPid = ((section[8] & 0x1f) << 8) | section[9]
    const programInfoLength = ((section[10] & 0x0f) << 8) | section[11]
    let cursor = 12 + programInfoLength
    if (cursor > section.length - 4) { invalidPsiSections++; return }
    const streams: StreamSummary[] = []
    while (cursor + 5 <= section.length - 4) {
      const typeId = section[cursor]
      const streamPid = ((section[cursor + 1] & 0x1f) << 8) | section[cursor + 2]
      const descLength = ((section[cursor + 3] & 0x0f) << 8) | section[cursor + 4]
      cursor += 5 + descLength
      if (cursor > section.length - 4) { invalidPsiSections++; return }
      if (streams.length < 40) streams.push({ typeId, pid: streamPid, codecHint: streamTypeLabel(typeId) })
    }
    if (cursor !== section.length - 4) { invalidPsiSections++; return }
    crcValidPmtSections++
    programDetail.set(number, { number, pmtPid: pid, pcrPid, streams, pmtCrcValid: true })
  }

  function feedPsi(pid: number, payload: Uint8Array, start: boolean) {
    const state = psiMap.get(pid) ?? { data: [] }
    psiMap.set(pid, state)
    if (start) {
      if (!payload.length) { invalidPsiSections++; state.data = []; return }
      const pointer = payload[0]
      if (pointer + 1 > payload.length) { invalidPsiSections++; state.data = []; return }
      if (pointer && state.data.length) {
        const malformed = psiSections(state, payload.subarray(1, 1 + pointer), (section) => decodeSection(pid, section))
        invalidPsiSections += malformed
      }
      // A PUSI section starts after pointer bytes. Any unfinished old section
      // is discarded, not merged with the new section.
      state.data = []
      const malformed = psiSections(state, payload.subarray(1 + pointer), (section) => decodeSection(pid, section))
      invalidPsiSections += malformed
    } else if (state.data.length) {
      const malformed = psiSections(state, payload, (section) => decodeSection(pid, section))
      invalidPsiSections += malformed
    }
  }

  for (let n = 0; n < packets; n++) {
    const packet = bytes.subarray(offset + n * PACKET_SIZE, offset + (n + 1) * PACKET_SIZE)
    if (packet[0] !== 0x47) { syncLosses++; continue }
    const error = !!(packet[1] & 0x80)
    const pusi = !!(packet[1] & 0x40)
    const pid = ((packet[1] & 0x1f) << 8) | packet[2]
    const scrambling = (packet[3] >> 6) & 0x03
    const adaptation = (packet[3] >> 4) & 0x03
    const counter = packet[3] & 0x0f
    if (pidMap.size >= MAX_PID_ENTRIES && !pidMap.has(pid)) continue
    const stat = pidMap.get(pid) ?? { count: 0, anomalies: 0, lastPayloadCounter: null, lastPacket: null }
    pidMap.set(pid, stat)
    stat.count++
    if (error) transportErrors++
    if (scrambling) scrambledPackets++
    if (adaptation === 0) { invalidAdaptationPackets++; continue }
    const hasPayload = (adaptation & 0x01) !== 0
    let start = 4
    if (adaptation & 0x02) {
      const size = packet[4]
      if (size > 183 || (hasPayload && size > 182)) { invalidAdaptationPackets++; continue }
      start += size + 1
    }
    if (!hasPayload || error) continue
    // Null packets do not contribute to PSI and CC counts.
    if (pid === 0x1fff) continue
    const duplicated = stat.lastPayloadCounter === counter &&
      stat.lastPacket !== null && packetsEqual(stat.lastPacket, packet)
    if (stat.lastPayloadCounter !== null && !duplicated && counter !== ((stat.lastPayloadCounter + 1) & 0x0f)) {
      stat.anomalies++
      continuityAnomalies++
      // A transport discontinuity makes partial PSI unsafe to complete.
      psiMap.delete(pid)
    }
    if (duplicated) continue
    stat.lastPayloadCounter = counter
    stat.lastPacket = packet.slice()
    if (scrambling || start >= PACKET_SIZE) continue
    if (pid === 0 || Array.from(programPids.values()).includes(pid)) {
      feedPsi(pid, packet.subarray(start), pusi)
    }
  }

  const programs = [...programPids.entries()]
    .sort(([a], [b]) => a - b)
    .slice(0, 100)
    .map(([number, pmtPid]) => programDetail.get(number) ?? ({
      number, pmtPid, pcrPid: null, streams: [], pmtCrcValid: false,
    }))
  const topPids = [...pidMap.entries()]
    .map(([pid, stat]) => ({ pid, packets: stat.count, continuityAnomalies: stat.anomalies }))
    .sort((a, b) => b.packets - a.packets || a.pid - b.pid)
    .slice(0, 24)
  const warnings: string[] = [
    provenance === 'GENERATED_DEMO_BYTES'
      ? 'This is a generated synthetic MPEG-TS fixture, not a hardware observation or recording.'
      : 'These results come from the first bounded bytes of a local file, not from observed RF hardware.',
    'PAT and PMT only identify declared service and elementary-stream mappings, not video decodability, stream rights or current reception.',
  ]
  if (!crcValidPatSections) warnings.push('No CRC-valid PAT found in the inspected sample.')
  if (programs.some((program) => !program.pmtCrcValid)) warnings.push('Some programs lack a CRC-valid PMT within the inspected sample.')
  if (scrambledPackets) warnings.push('Packet scrambling flags are present. No decryption was attempted.')
  if (continuityAnomalies || transportErrors) warnings.push('Packet continuity or transport-error flags were observed in the sample.')
  if (bytes.length - offset - packets * PACKET_SIZE > 0) warnings.push('Trailing partial packet bytes were ignored.')
  return {
    kind: 'RCTV_LOCAL_TRANSPORT_SAMPLE', provenance,
    sampleBytes: bytes.byteLength, alignmentOffset: offset, packetSize: 188, packets,
    syncLosses, transportErrors, scrambledPackets, invalidAdaptationPackets, continuityAnomalies,
    crcValidPatSections, crcValidPmtSections, invalidPsiSections,
    programs, topPids, warnings, observedAt,
  }
}

export function transportEvidenceReceipt(report: TransportReport, name: string, size: number): string {
  return JSON.stringify({
    schemaVersion: 1, file: { name: name.slice(0, 180), bytes: size, inspectedBytes: report.sampleBytes },
    report,
    limitations: [
      report.provenance === 'GENERATED_DEMO_BYTES'
        ? 'This is a generated educational fixture. No original broadcast or hardware observation exists.'
        : 'The file was user-selected and read locally; its origin and broadcaster authenticity were not independently verified.',
      'PAT/PMT describe program structure, not live satellite reception or playable video. An MPEG-TS file does not prove an actual RF lock.',
      'No media playback, decryption, tuner tuning, retransmission, or rights verification occurred; no actual RF lock was verified.',
    ],
  }, null, 2)
}
