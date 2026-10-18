import type { LiveSource } from './liveTv'

export type RemoteDirection = 'next' | 'previous' | 'first' | 'last'

export function wrapRemoteIndex(current: number, count: number, direction: RemoteDirection): number {
  if (count <= 0 || !Number.isInteger(count)) return -1
  const index = Number.isInteger(current) ? Math.min(Math.max(0, current), count - 1) : 0
  switch (direction) {
    case 'next': return (index + 1) % count
    case 'previous': return (index - 1 + count) % count
    case 'first': return 0
    case 'last': return count - 1
  }
}

export function shortcutRemoteIndex(key: string, count: number): number | null {
  // These are arbitrary RCTV directory slots, not OTA station/channel numbers.
  if (!/^[1-9]$/.test(key)) return null
  const index = Number(key) - 1
  return index < count ? index : null
}

export function randomRemoteIndex(current: number, count: number, random: () => number = Math.random): number {
  if (count <= 0) return -1
  if (count === 1) return 0
  const number = random()
  const fraction = Number.isFinite(number) ? Math.min(0.9999999, Math.max(0, number)) : 0
  const next = Math.floor(fraction * (count - 1))
  // Choose uniformly from the other entries, skipping the currently selected one.
  return next >= current && current >= 0 && current < count ? next + 1 : next
}

export function remoteSlotLabel(index: number): string {
  return String(index + 1).padStart(2, '0')
}

export function sourceScopeLabel(source: LiveSource): string {
  return source.kind === 'antenna'
    ? 'BROADCAST RECEPTION MAP · NOT A STREAM'
    : source.kind === 'public'
      ? 'PUBLIC-SERVICE PROGRAMMING · TIMING VARIES'
      : 'AD-SUPPORTED STREAMING SERVICE · LINEUP VARIES'
}
