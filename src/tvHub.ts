/**
 * RCTV v3.0 unified TV home: navigation is source metadata only.
 *
 * All selections reference the immutable 50-slot channel lineup.
 * No external URL, imported playlist, candidate packet or browser data
 * can create a channel or initiate player loading through this module.
 */
import { CHANNEL_LINEUP, resolveChannelNumber } from './channelSurf'
import type { ChannelSlot } from './channelSurf'
import { REVIEWED_BRIDGE_ROSTER } from './reviewedPlaybackBridge'

export const TV_HUB_RECENTS_MAX = 6
export const TV_HUB_MODE_LABELS = [
  'Channel Desk', 'Couch Mode', 'Reviewed Player Desk',
] as const

export function hubChannelById(id: unknown): ChannelSlot | null {
  return typeof id === 'string'
    ? CHANNEL_LINEUP.find((slot) => slot.source.id === id) ?? null
    : null
}
export function hubChannelByNumber(value: string): ChannelSlot | null {
  return resolveChannelNumber(value, CHANNEL_LINEUP)
}
export function hubGuide(
  query: string, favoriteIds: readonly string[], favoritesOnly: boolean,
): ChannelSlot[] {
  const q = query.trim().toLocaleLowerCase().slice(0,90)
  const favorites = new Set(favoriteIds)
  return CHANNEL_LINEUP.filter((slot) => {
    if (favoritesOnly && !favorites.has(slot.source.id)) return false
    return !q || [
      slot.source.name,slot.source.tagline,slot.source.category,
      slot.source.place ?? '',slot.source.region,...slot.source.tags,
      String(slot.number).padStart(3,'0'),
    ].join(' ').toLocaleLowerCase().includes(q)
  })
}
export function hubRememberPrevious(
  previousIds: readonly string[], currentId: string, nextId: string,
): string[] {
  if (!hubChannelById(nextId) || currentId === nextId) return [...previousIds]
  const prior = hubChannelById(currentId)
  const recent = prior ? [prior.source.id, ...previousIds] : [...previousIds]
  return [...new Set(recent)].filter((id) => hubChannelById(id)?.source.id !== nextId)
    .slice(0, TV_HUB_RECENTS_MAX)
}
export function hubReviewedSource(id: string): boolean {
  return REVIEWED_BRIDGE_ROSTER.some((item) => item.id === id)
}
