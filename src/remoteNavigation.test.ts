import { describe, expect, it } from 'vitest'
import { randomRemoteIndex, remoteSlotLabel, shortcutRemoteIndex, sourceScopeLabel, wrapRemoteIndex } from './remoteNavigation'
import { liveSources } from './liveTv'

describe('RCTV living room remote control', () => {
  it('wraps in both directions and offers home/end', () => {
    expect(wrapRemoteIndex(0, 9, 'previous')).toBe(8)
    expect(wrapRemoteIndex(8, 9, 'next')).toBe(0)
    expect(wrapRemoteIndex(4, 9, 'first')).toBe(0)
    expect(wrapRemoteIndex(4, 9, 'last')).toBe(8)
    expect(wrapRemoteIndex(0, 0, 'next')).toBe(-1)
  })
  it('digits address only visible directory slots and never imply OTA channel numbers', () => {
    expect(shortcutRemoteIndex('1', 5)).toBe(0)
    expect(shortcutRemoteIndex('5', 5)).toBe(4)
    expect(shortcutRemoteIndex('6', 5)).toBeNull()
    expect(shortcutRemoteIndex('0', 9)).toBeNull()
    expect(shortcutRemoteIndex('10', 12)).toBeNull()
    expect(remoteSlotLabel(0)).toBe('01')
    expect(remoteSlotLabel(8)).toBe('09')
  })
  it('surprise me moves away from current source if there is another option', () => {
    expect(randomRemoteIndex(0, 3, () => 0)).toBe(1)
    expect(randomRemoteIndex(1, 3, () => 0)).toBe(0)
    expect(randomRemoteIndex(1, 3, () => 0.9999)).toBe(2)
    expect(randomRemoteIndex(0, 1, () => 0.5)).toBe(0)
    expect(randomRemoteIndex(0, 0)).toBe(-1)
  })
  it('maintains correct distinction between internet services, public streams and OTA', () => {
    expect(sourceScopeLabel(liveSources.find((s) => s.id === 'fcc-ota')!)).toMatch(/NOT A STREAM/)
    expect(sourceScopeLabel(liveSources.find((s) => s.id === 'pluto')!)).toMatch(/STREAMING SERVICE/)
    expect(sourceScopeLabel(liveSources.find((s) => s.id === 'nasa-live')!)).toMatch(/TIMING VARIES/)
  })
})
