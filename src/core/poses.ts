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
//
// Pure pose helpers (composed in drawPlayer, all gated under reduceMotion):
//   gaitPose      — run cycle (jointed legs + bob + arm swing)
//   kickPose      — full shot: wind-up → strike → follow-through
//   passPose      — clipped strike: a lower, shorter kick for short passes (#185)
//   receivePose   — first-touch cushion
//   gaitAdvance   — per-player gait phase advance by DISTANCE travelled (#185, anti-skate)
//   accelLean     — fore/aft body lean from along-facing acceleration (#185, weight)
//   turnPlant     — stance-widen + crouch dip intensity on a hard cut (#185, pivot tell)
//   depthScale    — broadcast scale-for-depth
// ---------------------------------------------------------------------------

export type PoseAction = 'run' | 'kick' | 'pass' | 'slide' | 'dive' | 'celebrate' | 'receive' | 'recover';

function clamp01(t: number): number {
  if (!Number.isFinite(t)) return 0;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** Cubic ease-out (1 at u=1, fast then settling) — used to shape the kick sweep. */
function easeOut(u: number): number {
  const c = clamp01(u);
  const inv = 1 - c;
  return 1 - inv * inv * inv;
}

// --- run gait (#anim) -------------------------------------------------------
//
// A jointed run cycle, replacing the old straight-stick scissor: legs stride
// contralaterally AND bend at the knee through the recovery swing, the body
// bobs twice per stride (one bounce per footfall), and the arms swing opposite
// the legs. Everything is returned as a fraction of the player radius (the
// caller multiplies by U) and scaled by `gait` (0 = stand still, 1 = full
// sprint cadence), so a stationary player is perfectly still. Pure, allocation-
// free (writes `out`). `phase` is the continuous run clock (already desynced per
// player); the swing is `sin(phase)`.

export interface GaitPose {
  backLegX: number; // fore/aft offset of the back foot (× U)
  frontLegX: number;
  backFootLift: number; // how far the back foot lifts off the turf (× U, ≥ 0)
  frontFootLift: number;
  backKnee: number; // 0..1 knee flex of the back leg (the lifting/recovering leg bends most)
  frontKnee: number;
  bob: number; // vertical body bounce (× U, ≥ 0) — two bounces per stride
  armX: number; // near-arm fore/aft swing (× U); the far arm swings −armX (contralateral)
}

export function gaitPose(
  phase: number,
  gait: number,
  out: GaitPose = { backLegX: 0, frontLegX: 0, backFootLift: 0, frontFootLift: 0, backKnee: 0, frontKnee: 0, bob: 0, armX: 0 },
): GaitPose {
  const ph = Number.isFinite(phase) ? phase : 0;
  const g = !Number.isFinite(gait) ? 0 : gait < 0 ? 0 : gait > 1 ? 1 : gait;
  const s = Math.sin(ph); // +1 = back leg fully forward, −1 = front leg fully forward
  out.backLegX = s * 0.45 * g;
  out.frontLegX = -s * 0.45 * g;
  // a leg lifts (and bends) on its forward recovery swing
  out.backFootLift = Math.max(0, s) * 0.5 * g;
  out.frontFootLift = Math.max(0, -s) * 0.5 * g;
  out.backKnee = Math.max(0, s) * g;
  out.frontKnee = Math.max(0, -s) * g;
  out.bob = (0.5 - 0.5 * Math.cos(2 * ph)) * 0.18 * g; // sin²(phase): 0 at footplant, peak mid-swing, ≥ 0
  out.armX = -s * 0.4 * g; // arms counter the legs
  return out;
}

// --- kick: wind-up → strike → follow-through (#anim) ------------------------
//
// A real kicking motion instead of a single forward poke: the striking leg
// coils BACK during the first ~30% (the wind-up), sweeps through the ball with
// an ease-out (the strike), and finishes high and forward (the follow-through),
// while the body leans in and the opposite arm counter-swings for balance.
// `t` is the 0..1 pose progress. Returns × U fractions; pure, writes `out`.

export interface KickPose {
  legX: number; // striking-leg fore/aft: back (−) on wind-up → forward (+) on follow-through (× U)
  legLift: number; // striking-foot lift, peaks through the strike (× U, ≥ 0)
  plantKnee: number; // 0..1 plant-leg knee flex (absorbs the strike)
  lean: number; // torso forward lean into the follow-through (× U)
  armX: number; // counter-balancing near-arm swing (× U)
  contact: number; // 0..1 spike at the instant the foot passes the ball line
}

export function kickPose(
  t: number,
  out: KickPose = { legX: 0, legLift: 0, plantKnee: 0, lean: 0, armX: 0, contact: 0 },
): KickPose {
  const p = clamp01(t);
  let leg: number;
  if (p < 0.3) {
    leg = -(p / 0.3) * 0.5; // wind the leg back (0 → −0.5)
  } else {
    leg = -0.5 + easeOut((p - 0.3) / 0.7) * 1.55; // sweep through to a forward follow-through (→ +1.05)
  }
  out.legX = leg;
  out.legLift = Math.max(0, leg) * 0.9; // foot rises as it swings forward
  // plant leg bends in to absorb, then straightens on the follow-through
  out.plantKnee = p < 0.2 ? (p / 0.2) * 0.3 : 0.3 * (1 - clamp01((p - 0.6) / 0.4));
  out.lean = easeOut(p) * 0.35;
  out.armX = -leg * 0.5;
  out.contact = Math.max(0, 1 - Math.abs(p - 0.45) / 0.15); // contact window ≈ t∈[0.30,0.60]
  return out;
}

// --- first-touch receive cushion (#anim) -----------------------------------
//
// A short settle when a moving ball is brought under control: the body dips and
// leans back a touch to cushion it, the lead foot reaches to meet it, then it
// recovers to a neutral stance. `t` is 0 (the instant of the touch) → 1 (settled).
export interface ReceivePose {
  crouch: number; // figure height scale (< 1 = dipped to cushion)
  reach: number; // lead-foot reach toward the ball (× U)
  lean: number; // slight backward lean to absorb (× U, ≤ 0)
}

export function receivePose(t: number, out: ReceivePose = { crouch: 1, reach: 0, lean: 0 }): ReceivePose {
  const settle = 1 - clamp01(t); // 1 at the touch, 0 once settled
  out.crouch = 1 - settle * 0.14;
  out.reach = settle * 0.4;
  out.lean = -settle * 0.1;
  return out;
}

// --- pass: a clipped, lower strike (#185) ----------------------------------
//
// A pass is the SAME coil→strike→follow-through shape as a shot, but clipped: a
// shorter wind-up, a lower follow-through, less lean and foot-lift — so a 10-yard
// pass no longer reads like a 30-yard screamer. Same KickPose channels as kickPose
// (so drawPlayer + the blend treat them identically), just smaller amplitudes.
// `t` is the 0..1 pose progress.
export function passPose(t: number, out: KickPose = { legX: 0, legLift: 0, plantKnee: 0, lean: 0, armX: 0, contact: 0 }): KickPose {
  const p = clamp01(t);
  let leg: number;
  if (p < 0.32) {
    leg = -(p / 0.32) * 0.28; // shallow wind-up (0 → −0.28)
  } else {
    leg = -0.28 + easeOut((p - 0.32) / 0.68) * 0.78; // sweep to a modest follow-through (→ +0.5)
  }
  out.legX = leg;
  out.legLift = Math.max(0, leg) * 0.5; // foot stays lower than a shot
  out.plantKnee = p < 0.25 ? (p / 0.25) * 0.22 : 0.22 * (1 - clamp01((p - 0.6) / 0.4));
  out.lean = easeOut(p) * 0.16; // less body commitment than a shot
  out.armX = -leg * 0.45;
  out.contact = Math.max(0, 1 - Math.abs(p - 0.42) / 0.14);
  return out;
}

// --- weight, anti-skate cadence + turn plant (#185) ------------------------

// stride phase (rad) per px travelled. Calibrated to the old fixed-clock cadence:
// the previous gait ran at RUN_BASE_FREQ·2 = 36 rad/s and looked right at ~200 px/s,
// so 36 / 200 = 0.18 rad/px reproduces that stride length, now tied to distance.
// Lower → longer strides (feet turn over slower per px); higher → choppier.
const GAIT_RAD_PER_PX = 0.18;
const DRIBBLE_CADENCE = 1.25; // ball carrier: +25% phase per px → shorter, choppier close-control strides

/**
 * Per-player run-cycle phase advance for THIS frame, driven by DISTANCE travelled
 * (speed·dt) rather than wall-clock, so a stride completes per unit of ground
 * covered and the feet stop skating (the classic tell of weak locomotion). Scaled
 * by the side's surge `cadence`; a ball carrier strides choppier (`carrying`).
 * Returns the radians to add to the player's phase. Pure.
 */
export function gaitAdvance(speed: number, dtSec: number, cadence = 1, carrying = false): number {
  if (!(speed > 0) || !(dtSec > 0)) return 0;
  const c = cadence > 0 ? cadence : 0;
  return speed * dtSec * GAIT_RAD_PER_PX * c * (carrying ? DRIBBLE_CADENCE : 1);
}

/**
 * Fore/aft body lean (× U) from acceleration ALONG the facing: lean forward into a
 * burst, rock back on a hard brake — the weight tell the eye reads as mass fighting
 * its own inertia. `accelAlong` is the change in forward speed per second; `ref` is
 * the accel that maps to a full lean. Clamped to ±`amp`. Pure scalar.
 */
export function accelLean(accelAlong: number, ref = 1600, amp = 0.22): number {
  if (!Number.isFinite(accelAlong) || !(ref > 0)) return 0;
  const t = accelAlong / ref;
  const c = t < -1 ? -1 : t > 1 ? 1 : t;
  return c * amp;
}

/**
 * Turn-plant intensity 0..1: how hard the player is cutting, from the divergence
 * between travel (vx,vy) and the instantly-steered facing (faceX,faceY). On a sharp
 * cut the facing snaps to the new heading while momentum still carries the old, so
 * they diverge — the moment a real player plants the outside foot and pivots. Zero
 * when running straight or moving slowly. Drives a transient stance-widen + crouch
 * dip in the render. Pure scalar.
 */
export function turnPlant(vx: number, vy: number, faceX: number, faceY: number, minSpeed = 60, fullSpeed = 220): number {
  const sp = Math.hypot(vx, vy);
  if (!(sp > minSpeed)) return 0;
  const fl = Math.hypot(faceX, faceY);
  if (!(fl > 0)) return 0;
  const dot = (vx * faceX + vy * faceY) / (sp * fl); // cos angle, +1 aligned … −1 opposed
  // (1-dot) is 0 (aligned) … 2 (reversed); ×0.7 maps a ~90° cut (dot 0 → 0.7) most of
  // the way to full and a full reverse (dot −1 → 1.4, clamped) to max — so only real
  // cuts plant hard, gentle curves barely register.
  const diverge = clamp01((1 - dot) * 0.7);
  const spF = clamp01((sp - minSpeed) / (fullSpeed - minSpeed));
  return diverge * spF;
}

export interface PoseSelection {
  action: PoseAction;
  t: number; // 0..1 progress for timed poses (ignored for 'run')
}

/**
 * Pick the active pose from a player's deterministic sim-ticked countdowns, in
 * priority order: celebrate > dive > slide > recover > kick > pass > receive > run.
 * `t` is the pose's 0..1 progress (so the sweep advances as the countdown
 * drains). For 'run' the caller supplies the continuous run clock instead.
 *
 * `recover` (grounded-and-rising after a whiffed slide) is its own action,
 * distinct from an active `slide` lunge, so the figure animates back to its feet
 * instead of staying face-down. `pass` is a clipped strike (passPose) distinct
 * from a full `kick` shot.
 */
export function selectPose(
  kickT: number,
  diveT: number,
  slideT: number,
  recovery: number,
  celebrateT: number,
  receiveT = 0,
  passT = 0,
  kickDur = 0.28,
  diveDur = 0.45,
  slideDur = 0.4,
  recoverDur = 0.5,
  receiveDur = 0.32,
  passDur = 0.2,
): PoseSelection {
  if (celebrateT > 0) return { action: 'celebrate', t: 0 };
  if (diveT > 0) return { action: 'dive', t: clamp01(1 - diveT / diveDur) };
  if (slideT > 0) return { action: 'slide', t: clamp01(1 - slideT / slideDur) };
  if (recovery > 0) return { action: 'recover', t: clamp01(1 - recovery / recoverDur) };
  if (kickT > 0) return { action: 'kick', t: clamp01(1 - kickT / kickDur) };
  if (passT > 0) return { action: 'pass', t: clamp01(1 - passT / passDur) };
  if (receiveT > 0) return { action: 'receive', t: clamp01(1 - receiveT / receiveDur) };
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
// ~15% near↔far swing (GDD §6: "players shrink ~15% toward the far touchline"),
// symmetric about 1 so the band's midpoint is unscaled. A stronger read than the
// old ±12% — it sells the three-quarter broadcast angle without a z-axis.
export const DEPTH_NEAR = 1.15; // at the near (bottom) touchline
export const DEPTH_FAR = 0.85; // at the far (top) touchline

export function depthScale(y: number, py: number, ph: number): number {
  if (!Number.isFinite(y) || !Number.isFinite(py) || !Number.isFinite(ph) || ph <= 0) return 1;
  const t = (y - py) / ph; // 0 at the far touchline (top), 1 at the near one (bottom)
  const f = DEPTH_FAR + (DEPTH_NEAR - DEPTH_FAR) * t;
  return f < DEPTH_FAR ? DEPTH_FAR : f > DEPTH_NEAR ? DEPTH_NEAR : f;
}
