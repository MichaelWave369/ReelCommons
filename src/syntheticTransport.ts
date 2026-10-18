/**
 * Purely synthetic TS fixture for testing the browser inspector without RF,
 * downloads or hardware. Program 42 carries fake packet data, no video/audio.
 */
function crc32Mpeg(data: number[]): number[] {
  let crc = 0xffffffff
  for (const value of data) {
    crc = (crc ^ (value << 24)) >>> 0
    for (let i = 0; i < 8; i++) crc = crc & 0x80000000 ? ((crc << 1) ^ 0x04c11db7) >>> 0 : (crc << 1) >>> 0
  }
  return [...data, (crc >>> 24) & 255, (crc >>> 16) & 255, (crc >>> 8) & 255, crc & 255]
}

function packet(pid: number, count: number, payload: number[], isStart: boolean): Uint8Array {
  const bytes = new Uint8Array(188).fill(0xff)
  bytes[0] = 0x47
  bytes[1] = (isStart ? 0x40 : 0x00) | ((pid >> 8) & 0x1f)
  bytes[2] = pid & 0xff
  bytes[3] = 0x10 | (count & 15)
  bytes.set(payload.slice(0, 184), 4)
  return bytes
}

export function syntheticTransportFixture(): Uint8Array {
  const pat = crc32Mpeg([
    0x00, 0xb0, 0x0d, 0x00, 0x01, 0xc1, 0x00, 0x00,
    0x00, 0x2a, 0xe1, 0x00, // program 42 -> PMT pid 0x100
  ])
  const pmt = crc32Mpeg([
    0x02, 0xb0, 0x17, 0x00, 0x2a, 0xc1, 0x00, 0x00,
    0xe1, 0x01, 0xf0, 0x00,
    0x1b, 0xe1, 0x01, 0xf0, 0x00, // pretend AVC stream
    0x0f, 0xe1, 0x02, 0xf0, 0x00, // pretend AAC stream
  ])
  const packets = [
    packet(0, 0, [0, ...pat], true),
    packet(0x100, 0, [0, ...pmt], true),
    packet(0x101, 0, [0x00, 0x00, 0x01, 0xe0, 0xff], true),
    packet(0x102, 0, [0x00, 0x00, 0x01, 0xc0, 0xff], true),
    packet(0x1fff, 0, [], false),
    packet(0x101, 1, [0x00, 0x00, 0x01, 0xe0, 0xff], true),
  ]
  const bytes = new Uint8Array(188 * packets.length)
  packets.forEach((chunk, i) => bytes.set(chunk, i * 188))
  return bytes
}
