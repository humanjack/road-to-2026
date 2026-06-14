// ---------------------------------------------------------------------------
// Procedural player poses — pure limb math layered over the single-Graphics
// vector figure (#137). Each action is a deterministic override of the four
// limb fore/aft offsets plus a torso lean + crouch, so a kick / slide / keeper
// dive / goal celebration reads at a glance without any external art.
//
// This module also DEFINES the shared figure transform-composition order that
// the depth-scale (#128), lean, squash-stretch (#131), and cadence (#138) issues
// slot into, applied in drawPlayer in exactly this sequence:
//
//     translate(x, y - hop)  →  rotate(facing)  →  lean(+x)  →  crouch(scaleY)
//        →  [depthScale]  →  [squash]  →  limbs + torso (limbPose offsets)
//
// `action: 'run'` reproduces the original inline sine swing EXACTLY (unit-tested),
// so this refactor is behaviour-preserving for the common case.
// ---------------------------------------------------------------------------

export type PoseAction = 'run' | 'kick' | 'slide' | 'dive' | 'celebrate';

export interface LimbPose {
  farLeg: number; // fore/aft limb offsets in px (forward = +)
  nearLeg: number;
  farArm: number;
  nearArm: number;
  lean: number; // torso/figure forward shift along facing (px)
  crouch: number; // figure width scale (1 = upright; < 1 = laid-low / dive)
}

function clamp01(t: number): number {
  if (!Number.isFinite(t)) return 0;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/**
 * Limb offsets for an action. `t` is the run clock for 'run' (continuous) or a
 * 0..1 progress for the timed poses; `gait` (0..1) scales only the run swing;
 * `phase` desyncs the run cycle; `pr` is the player radius (offsets scale with the
 * body). Writes into `out` — allocation-free. The 'run' branch is the EXACT
 * original formula `sin(t*2 + phase) * 0.5 * gait * pr`.
 */
export function limbPose(
  action: PoseAction,
  t: number,
  gait: number,
  phase: number,
  pr: number,
  out: LimbPose = { farLeg: 0, nearLeg: 0, farArm: 0, nearArm: 0, lean: 0, crouch: 1 },
): LimbPose {
  // recover from any non-finite input rather than poisoning the batched Graphics
  if (!Number.isFinite(t)) t = 0;
  if (!Number.isFinite(gait)) gait = 0;
  if (!Number.isFinite(phase)) phase = 0;
  if (!Number.isFinite(pr)) pr = 0;
  let fl = 0;
  let nl = 0;
  let fa = 0;
  let na = 0;
  let lean = 0;
  let crouch = 1;

  if (action === 'run') {
    const sw = Math.sin(t * 2 + phase) * 0.5 * gait * pr; // identical to the old inline swing
    fl = sw;
    nl = -sw;
    fa = -sw;
    na = sw;
  } else if (action === 'kick') {
    // striking (far) leg sweeps monotonically from back to a forward extension; the
    // body leans into the follow-through. A wind-up read without breaking monotonicity.
    const p = clamp01(t);
    fl = (-0.35 + 1.25 * p) * pr; // back → extended forward
    nl = (0.1 - 0.3 * p) * pr; // plant leg
    fa = 0.2 * pr; // arms steady-ish for balance
    na = -0.2 * pr;
    lean = 0.3 * p * pr;
  } else if (action === 'slide') {
    // both legs thrown forward along the lunge, body low + leaning into it
    fl = 0.85 * pr;
    nl = 0.7 * pr;
    fa = -0.3 * pr;
    na = -0.3 * pr;
    lean = 0.5 * pr;
    crouch = 0.74;
  } else if (action === 'dive') {
    // keeper throws both arms forward toward the ball line; legs trail, body low
    fa = 0.9 * pr;
    na = 0.9 * pr;
    fl = -0.4 * pr;
    nl = -0.4 * pr;
    lean = 0.3 * pr;
    crouch = 0.88;
  } else if (action === 'celebrate') {
    // arms thrown up/forward, legs together — paired with a vertical hop in drawPlayer
    fa = 0.85 * pr;
    na = 0.85 * pr;
    fl = -0.15 * pr;
    nl = 0.15 * pr;
    lean = 0.1 * pr;
  }

  out.farLeg = fl;
  out.nearLeg = nl;
  out.farArm = fa;
  out.nearArm = na;
  out.lean = lean;
  out.crouch = crouch;
  return out;
}

export interface PoseSelection {
  action: PoseAction;
  t: number; // 0..1 progress for timed poses (ignored for 'run')
}

/**
 * Pick the active pose from a player's deterministic sim-ticked countdowns, in
 * priority order: celebrate > dive > slide > kick > run. `t` is the pose's 0..1
 * progress (so the limb sweep advances as the countdown drains). For 'run' the
 * caller supplies the continuous run clock instead.
 */
export function selectPose(
  kickT: number,
  diveT: number,
  slideT: number,
  recovery: number,
  celebrateT: number,
  kickDur = 0.28,
  diveDur = 0.45,
  slideDur = 0.4,
): PoseSelection {
  if (celebrateT > 0) return { action: 'celebrate', t: 0 };
  if (diveT > 0) return { action: 'dive', t: clamp01(1 - diveT / diveDur) };
  if (slideT > 0 || recovery > 0) return { action: 'slide', t: 0 };
  if (kickT > 0) return { action: 'kick', t: clamp01(1 - kickT / kickDur) };
  return { action: 'run', t: 0 };
}

/**
 * Choose the player who celebrates a goal: the scorer (`lastKickIdx`) when they're
 * a scoring-side outfielder, else the scoring-side outfielder nearest the opponent
 * goal. Never returns a conceding-side index. Returns -1 if no candidate.
 */
export function chooseCelebrant(
  scoringSide: string,
  lastKickIdx: number,
  players: { side: string; role: string }[],
  goalX: number,
  xs: number[],
): number {
  if (
    lastKickIdx >= 0 &&
    players[lastKickIdx] &&
    players[lastKickIdx].side === scoringSide &&
    players[lastKickIdx].role !== 'GK'
  ) {
    return lastKickIdx;
  }
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < players.length; i++) {
    if (players[i].side !== scoringSide || players[i].role === 'GK') continue;
    const d = Math.abs(xs[i] - goalX);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

// Broadcast scale-for-depth (#128): a gentle perspective on the flat top-down
// board — figures nearer the far (top) touchline draw smaller, nearer (bottom)
// ones larger. This is the OUTERMOST figure multiply and is hard-clamped to
// [DEPTH_FAR, DEPTH_NEAR] so that composed with the squash-stretch band [0.85,
// 1.18] (#131) and the body-lean it can never invert or balloon the silhouette.
// Pure + allocation-free; a function of y only, so it is static (renders
// identically under reduceMotion — it is depth readability, not motion juice).
export const DEPTH_NEAR = 1.12; // at the near (bottom) touchline
export const DEPTH_FAR = 0.88; // at the far (top) touchline

export function depthScale(y: number, py: number, ph: number): number {
  if (!Number.isFinite(y) || !Number.isFinite(py) || !Number.isFinite(ph) || ph <= 0) return 1;
  const t = (y - py) / ph; // 0 at the far touchline (top), 1 at the near one (bottom)
  const f = DEPTH_FAR + (DEPTH_NEAR - DEPTH_FAR) * t;
  return f < DEPTH_FAR ? DEPTH_FAR : f > DEPTH_NEAR ? DEPTH_NEAR : f;
}
