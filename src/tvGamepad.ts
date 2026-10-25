/**
 * RCTV v3.1 · pure controller input interpreter.
 * This maps browser Gamepad API buttons to directory navigation, NEVER media load.
 * D-pad Up/Right => next, Down/Left => previous; A/X => guide, B => exit.
 */
export type TvGamepadAction = 'next' | 'previous' | 'guide' | 'close' | null
export function readTvGamepadAction(
  pressed: readonly boolean[],
  axes: readonly number[],
): TvGamepadAction {
  if (pressed[1]) return 'close' // B / Circle
  if (pressed[0] || pressed[2]) return 'guide' // A / Cross or X / Square
  if (pressed[12] || pressed[15] || (axes[0] ?? 0)>0.7 || (axes[1]??0)>0.7) return 'next'
  if (pressed[13] || pressed[14] || (axes[0] ?? 0)<-0.7 || (axes[1]??0)<-0.7) return 'previous'
  return null
}
/** Only explicit consent activates controller polling inside Couch Mode. */
export const GAMEPAD_REPEAT_MS=340
