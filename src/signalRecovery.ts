/**
 * RCTV v2.8 Signal & Recovery Desk.
 *
 * In-memory observation of the already-reviewed media UI only. It does not
 * probe media URLs, infer YouTube video playback from iframe document load,
 * store viewing history, or allow unreviewed sources into a player.
 */
import { REVIEWED_BRIDGE_ROSTER, reviewedMediaUrl } from './reviewedPlaybackBridge'
import type { ReviewedBridgeId, ReviewedBridgeMode } from './reviewedPlaybackBridge'

export const SIGNAL_RECEIPT_SCHEMA = 'RCTV_SIGNAL_SESSION_RECEIPT_V1'
export const SIGNAL_RECEIPT_PROVENANCE = 'BROWSER_OBSERVATION_AND_USER_REPORT_NOT_VERIFIED'
export type SignalPhase =
  | 'standby' | 'controls-loaded' | 'frame-document-loaded'
  | 'audio-ready' | 'audio-playing' | 'audio-paused' | 'audio-buffering'
  | 'failed' | 'user-reported-working' | 'user-reported-failed'
export type SignalEvent =
  | 'load' | 'frame-load' | 'audio-canplay' | 'audio-playing'
  | 'audio-pause' | 'audio-waiting' | 'audio-error'
  | 'report-working' | 'report-failed' | 'unload'
export interface SignalState {
  sourceId: ReviewedBridgeId
  mode: ReviewedBridgeMode
  phase: SignalPhase
  attempt: number
  loadCount: number
  lastEvent: SignalEvent | 'none'
  selfReported: 'working' | 'failed' | 'none'
}

const stations = new Map<string, (typeof REVIEWED_BRIDGE_ROSTER)[number]>(
  REVIEWED_BRIDGE_ROSTER.map((station) => [station.id, station]),
)
const audioEvents: readonly SignalEvent[] =
  ['audio-canplay','audio-playing','audio-pause','audio-waiting','audio-error']

export function createSignalState(id: ReviewedBridgeId): SignalState {
  const row = stations.get(id)
  if (!row) throw new Error('Unknown reviewed source. The session must not accept imported stations.')
  return {sourceId: id, mode: row.mode, phase: 'standby', attempt: 0, loadCount: 0,
    lastEvent: 'none', selfReported: 'none'}
}

/** Selecting any station resets prior media observations. */
export function selectSignalStation(state: SignalState, id: string): SignalState {
  const row = stations.get(id)
  if (!row) return {...state, phase: 'standby', lastEvent:'unload',selfReported:'none'}
  return {...createSignalState(row.id), attempt: state.attempt+1, loadCount: state.loadCount}
}

/**
 * A stale callback from a previous audio element/iframe is ignored.
 * No event can trigger network access or request playback.
 */
export function observeSignal(
  state: SignalState, event: SignalEvent, observedId: string, observedAttempt: number,
): SignalState {
  if (state.sourceId !== observedId || state.attempt !== observedAttempt) return state
  if (event === 'unload') return {...state, phase:'standby',lastEvent:'unload',selfReported:'none'}
  if (event === 'load') {
    if (state.phase !== 'standby' || !reviewedMediaUrl(state.sourceId)) return state
    return {...state, attempt: state.attempt+1, loadCount: state.loadCount+1, phase:'controls-loaded',
      lastEvent:'load',selfReported:'none'}
  }
  if (state.phase === 'standby' || state.mode === 'official-website') return state
  if (audioEvents.includes(event) && state.mode !== 'published-audio') return state
  if (event === 'frame-load' && state.mode !== 'youtube-video') return state
  if (event === 'frame-load') return {...state, phase:'frame-document-loaded',lastEvent:event}
  if (event === 'audio-canplay') return {...state,phase:'audio-ready',lastEvent:event}
  if (event === 'audio-playing') return {...state,phase:'audio-playing',lastEvent:event}
  if (event === 'audio-pause') return {...state,phase:'audio-paused',lastEvent:event}
  if (event === 'audio-waiting') return {...state,phase:'audio-buffering',lastEvent:event}
  if (event === 'audio-error') return {...state,phase:'failed',lastEvent:event}
  if (event === 'report-working') return {...state,phase:'user-reported-working',
    lastEvent:event,selfReported:'working'}
  if (event === 'report-failed') return {...state,phase:'user-reported-failed',
    lastEvent:event,selfReported:'failed'}
  return state
}

export function signalMessage(state: SignalState): string {
  switch(state.phase) {
    case 'standby': return 'No media loaded. Choose Load for a reviewed route, or use the official broadcaster website.'
    case 'controls-loaded': return state.mode === 'published-audio'
      ? 'KEXP audio controls mounted. Press Play in the browser player. A mounted player is not proof of sound.'
      : 'YouTube iframe requested. Loading its page does not guarantee live video will play.'
    case 'frame-document-loaded': return 'YouTube iframe document loaded. The browser cannot confirm its video is playing; check the picture yourself.'
    case 'audio-ready': return 'Browser reports audio can be played. Press Play if needed; no sound is inferred until its playing event.'
    case 'audio-playing': return 'Browser audio element reported playing. This does not verify that audible sound reached speakers.'
    case 'audio-paused': return 'Audio is paused or stopped by the browser. Press Play to resume.'
    case 'audio-buffering': return 'Browser audio is waiting for data. Check your connection or use the official broadcaster website.'
    case 'failed': return 'Audio failed to load or decode. Stop/unload, then try again or open the broadcaster site.'
    case 'user-reported-working': return 'You marked this attempt as working. This is a personal report, not independently verified.'
    case 'user-reported-failed': return 'You marked this attempt as failing. Use Stop/unload or the official broadcaster site.'
  }
}

/**
 * Export contains no source media URL, IP, watch duration, cookies, browser
 * fingerprint, user ID or localStorage. It is purely a click-to-export receipt.
 */
export function signalSessionReceipt(
  state: SignalState, recordedUtc: string, policyStatus: 'code-consistent'|'engineering-review-required',
): string {
  if (!Number.isFinite(Date.parse(recordedUtc)) ||
      !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(recordedUtc)) {
    throw new Error('Invalid session receipt timestamp.')
  }
  return JSON.stringify({
    schema: SIGNAL_RECEIPT_SCHEMA,
    provenance: SIGNAL_RECEIPT_PROVENANCE,
    sourceId: state.sourceId,
    mode: state.mode,
    attemptedCurrentSelection: state.phase !== 'standby',
    loadsRequestedThisDeskSession: state.loadCount,
    observedPhase: state.phase,
    lastEvent: state.lastEvent,
    selfReported: state.selfReported,
    localCodePolicyStatus: policyStatus,
    capturedUtc: recordedUtc,
    caveat: 'Session-only browser UI observations and optional user report. An iframe load never proves YouTube playback. Browser audio events do not prove audible sound. Code-policy match does not establish broadcaster permission, geographic access, or stream uptime.',
  },null,2)
}
