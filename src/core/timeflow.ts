// ---------------------------------------------------------------------------
// Time-flow — pure cadence math for slow-mo + hit-stop (the GDD "firework" juice).
//
// This is PRESENTATION-side: it advances by REAL wall-clock delta and returns the
// current time scale [0..1]. MatchScene multiplies the accumulator drain by this
// scale, so a low scale drains FEWER fixed sim steps per real frame — the sim
// still only ever advances by the constant FIXED_DT, so physics/AI stay
// bit-identical (determinism / replays). The sim must NEVER read this value.
//
// Model: a "hit-stop" is a hard freeze (scale 0) for a short window; a "slow-mo"
// holds a low floor scale then eases monotonically back to 1 over its window. A
// goal requests both (freeze first, then ease in). Allocation-free: callers hold
// one TimeFlowState and mutate it in place.
// ---------------------------------------------------------------------------

export interface TimeFlowState {
  hitStopMs: number; // remaining hard-freeze (scale 0) in ms
  slowMs: number; // remaining slow-mo in ms
  slowTotalMs: number; // total slow-mo window (drives the ease back to 1)
  slowScale: number; // floor scale during slow-mo (e.g. 0.45)
}

export function createTimeFlow(): TimeFlowState {
  return { hitStopMs: 0, slowMs: 0, slowTotalMs: 0, slowScale: 1 };
}

/** Clear any active time-fx (match start / full time). */
export function resetTimeFlow(s: TimeFlowState): void {
  s.hitStopMs = 0;
  s.slowMs = 0;
  s.slowTotalMs = 0;
  s.slowScale = 1;
}

/** Queue a hard freeze for `ms` (takes the longest of any overlapping request). */
export function requestHitStop(s: TimeFlowState, ms: number): void {
  if (ms > s.hitStopMs) s.hitStopMs = ms;
}

/** Queue a slow-mo: hold `scale` (0..1) then ease back to 1 over `ms`. */
export function requestSlowMo(s: TimeFlowState, scale: number, ms: number): void {
  s.slowScale = scale < 0 ? 0 : scale > 1 ? 1 : scale;
  s.slowMs = ms;
  s.slowTotalMs = ms;
}

/**
 * Advance the time-flow by a REAL frame delta and return the current scale [0..1]:
 * 0 during a hit-stop freeze, then the slow-mo floor easing monotonically back to
 * 1, then 1. Hit-stop takes precedence and does NOT consume the slow-mo window, so
 * a goal freezes first and then eases into slow-mo. Deterministic: identical
 * real-delta sequences yield identical scale sequences.
 */
export function stepTimeScale(s: TimeFlowState, realDtMs: number): number {
  if (!(realDtMs > 0)) realDtMs = 0;

  if (s.hitStopMs > 0) {
    s.hitStopMs -= realDtMs;
    if (s.hitStopMs < 0) s.hitStopMs = 0;
    return 0; // hard freeze
  }

  if (s.slowMs > 0) {
    s.slowMs -= realDtMs;
    if (s.slowMs < 0) s.slowMs = 0;
    // t: 0 at the start of the window → 1 at the end; scale eases slowScale → 1
    const t = s.slowTotalMs > 0 ? 1 - s.slowMs / s.slowTotalMs : 1;
    const scale = s.slowScale + (1 - s.slowScale) * t;
    return scale < 0 ? 0 : scale > 1 ? 1 : scale;
  }

  return 1;
}
