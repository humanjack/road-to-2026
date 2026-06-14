// ---------------------------------------------------------------------------
// Movement core — pure, deterministic, Phaser-free math for player motion.
//
// MatchScene is the Phaser glue; the *feel* of movement lives here so it can be
// unit-tested and (later) lock-stepped for deterministic netcode. Everything in
// this module is a pure function of its inputs — no time source, no globals, no
// allocation beyond the small result objects.
// ---------------------------------------------------------------------------

export interface Vec2 {
  x: number;
  y: number;
}

// --- momentum integrator ---------------------------------------------------
//
// Arcade "weight": a player carries momentum. Instead of snapping velocity to
// the input each frame, we move the current velocity vector *toward* a desired
// velocity by a capped amount per second — fast when speeding up (responsive
// starts), faster still when braking (crisp stops), and the same accel rate
// when turning at speed so a hard direction change traces a short arc through
// lower speed rather than teleporting. The velocity never overshoots the
// desired vector, so top speed is preserved exactly.
//
// Tunings are px/s². Reaching top speed (~210 px/s) takes ~V/accel seconds.

/** Player reaches ~95% of top speed in ~0.14s; weighty but no mushy start. */
export const PLAYER_ACCEL = 1400;
/** Brisker than accel so releasing/stopping feels crisp (stop in ~0.1s). */
export const PLAYER_DECEL = 2200;
/** Below this speed with no desired velocity, snap to rest (kills jitter). */
const REST_EPSILON = 4;

/**
 * Move a velocity vector toward a desired velocity with separate acceleration
 * (speeding up / turning) and braking (slowing toward a lower speed or rest)
 * rates. Frame-rate independent and overshoot-free.
 *
 * Rule: if the desired speed is below the current speed we are *braking* (this
 * covers releasing input and decelerating to a slower target); otherwise we are
 * *accelerating* — which includes turning at equal speed, giving turns weight
 * without making them sluggish.
 */
export function approachVelocity(
  vx: number,
  vy: number,
  desVx: number,
  desVy: number,
  accel: number,
  decel: number,
  dt: number,
): Vec2 {
  // Defensive: recover from any non-finite input rather than propagating NaN
  // (a single bad value would poison every downstream position).
  if (!Number.isFinite(vx) || !Number.isFinite(vy)) {
    vx = 0;
    vy = 0;
  }
  if (!Number.isFinite(desVx) || !Number.isFinite(desVy) || !(dt > 0)) {
    return { x: vx, y: vy };
  }

  const curSpeed = Math.hypot(vx, vy);
  const desSpeed = Math.hypot(desVx, desVy);
  const rate = desSpeed < curSpeed ? decel : accel;
  const maxDelta = rate * dt;

  const dx = desVx - vx;
  const dy = desVy - vy;
  const deltaLen = Math.hypot(dx, dy);

  if (deltaLen <= maxDelta) {
    // close enough to snap exactly onto the desired velocity (no overshoot)
    vx = desVx;
    vy = desVy;
  } else {
    vx += (dx / deltaLen) * maxDelta;
    vy += (dy / deltaLen) * maxDelta;
  }

  // settle to a dead stop when there's no desired motion and we're crawling
  if (desSpeed === 0 && Math.hypot(vx, vy) < REST_EPSILON) {
    return { x: 0, y: 0 };
  }
  return { x: vx, y: vy };
}

// --- sprint & stamina ------------------------------------------------------
//
// Sprint is a managed burst, not a free always-on button. While sprinting the
// player drains a small stamina pool; jogging/standing refills it. When it hits
// empty a recovery *lock* engages — you can't re-sprint until stamina climbs
// back over `unlockAt` (hysteresis), so an exhausted player has a real moment of
// vulnerability instead of stutter-sprinting at zero. Stamina only ever gates
// the sprint *bonus*; base movement is never slowed by it.

export interface StaminaTuning {
  /** Fraction drained per second while sprinting (empty in ~1/drain s). */
  drain: number;
  /** Fraction recovered per second while not sprinting (full in ~1/recover s). */
  recover: number;
  /** After hitting empty, stamina must climb back to this before sprint re-enables. */
  unlockAt: number;
}

export const STAMINA: StaminaTuning = {
  drain: 0.3, // ~3.3s of continuous sprint to empty
  recover: 0.2, // ~5s from empty to full
  unlockAt: 0.3, // ~1.5s of recovery before you can sprint again
};

/** Top-speed multiplier while sprinting (a real burst over the old flat 1.25). */
export const SPRINT_SPEED_MUL = 1.32;
/** Acceleration multiplier while sprinting so the burst kicks in quickly. */
export const SPRINT_ACCEL_MUL = 1.15;

export interface StaminaState {
  stamina: number; // 0..1
  locked: boolean; // true while in the post-exhaustion recovery lock
  canSprint: boolean; // whether a sprint *bonus* may apply next frame
}

/**
 * Advance a stamina pool one step. `draining` is whether the player is actually
 * sprint-moving this frame (the caller decides that from current `canSprint`,
 * intent, and whether they're moving). Returns the new pool, lock state, and
 * whether sprint is permitted going forward.
 */
export function stepStamina(
  stamina: number,
  draining: boolean,
  locked: boolean,
  dt: number,
  cfg: StaminaTuning = STAMINA,
): StaminaState {
  if (!Number.isFinite(stamina)) stamina = 1;
  if (!(dt > 0)) return { stamina, locked, canSprint: !locked && stamina > 0 };

  if (draining) {
    stamina -= cfg.drain * dt;
    if (stamina <= 0) {
      stamina = 0;
      locked = true; // exhausted → engage recovery lock
    }
  } else {
    stamina = Math.min(1, stamina + cfg.recover * dt);
    if (locked && stamina >= cfg.unlockAt) locked = false; // recovered enough
  }
  return { stamina, locked, canSprint: !locked && stamina > 0 };
}

// --- dribbling & ball control ----------------------------------------------
//
// Carrying the ball is a trade-off, not a magnet. A carrier loses a little top
// speed (close control), and the ball sits further ahead the faster they move —
// so a sprint becomes a knock-on: the ball leaves the foot, you cover ground,
// but a defender can nip in (the counterplay). Turning sharply lets the carry
// angle lag behind the new facing for a frame or two, which reads as a real
// touch dragging the ball around rather than a teleport.

/** Top-speed multiplier while carrying the ball — close control costs a touch of pace. */
export const DRIBBLE_SPEED_MUL = 0.9;
/** Minimum ball-ahead distance (px): ball clears the body even at a standstill. */
export const CARRY_BASE = 22;
/** How far the carry distance grows from base→top speed when jogging vs sprinting. */
const CARRY_KNOCK_JOG = 8;
const CARRY_KNOCK_SPRINT = 30;

/**
 * How far ahead of the carrier the ball sits, given current `speed`, the
 * carrier's `baseSpeed`, and whether they're sprinting. Grows with speed and is
 * much larger while sprinting (the knock-on). Monotonic and bounded.
 */
export function carryOffset(speed: number, baseSpeed: number, sprinting: boolean): number {
  if (!Number.isFinite(speed) || !(baseSpeed > 0)) return CARRY_BASE;
  const t = Math.min(1, Math.max(0, speed) / baseSpeed); // 0..1 (clamped at base speed)
  const knock = sprinting ? CARRY_KNOCK_SPRINT : CARRY_KNOCK_JOG;
  return CARRY_BASE + t * knock;
}

/**
 * Step the carry *angle* toward the carrier's facing. A lag factor < 1 makes a
 * hard turn swing the ball around over a couple of frames (a touch), instead of
 * snapping it to the new front. `lag` is the per-frame fraction (0..1].
 */
export function easeCarryAngle(current: number, targetFacing: number, lag: number): number {
  if (!Number.isFinite(current)) return targetFacing;
  // shortest-arc difference in [-PI, PI]
  let d = (targetFacing - current) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return current + d * Math.min(1, Math.max(0, lag));
}

// --- input buffering -------------------------------------------------------
//
// The lowest-risk, highest-feel latency win: when you press an action a hair
// before it's legal (pass/shoot the frame before you collect the ball), queue it
// and fire it the instant it becomes legal. This kills the "ate my input" feel
// without changing real input timing. Buffered inputs expire so a stale press
// can't fire seconds later, and the latest press wins.

export interface BufferedInput {
  action: string; // 'pass' | 'shoot' | (future) 'tackle' | 'through'
  t: number; // press timestamp (ms, monotonic)
  charge?: number; // for a pre-released charged shot
}

/** How long before it becomes legal a press still counts (ms). */
export const INPUT_BUFFER_MS = 160;
/** Acting within this of receiving the ball is a "one-touch" (style bonus hook, #96). */
export const ONE_TOUCH_MS = 250;

/** A buffered input is still good to fire if it's within the window (and not from the future). */
export function bufferConsumable(buf: BufferedInput | null, now: number, windowMs = INPUT_BUFFER_MS): boolean {
  if (!buf) return false;
  const age = now - buf.t;
  return age >= 0 && age <= windowMs;
}

/** A buffered input has gone stale (older than the window) and should be discarded. */
export function bufferExpired(buf: BufferedInput | null, now: number, windowMs = INPUT_BUFFER_MS): boolean {
  return !!buf && now - buf.t > windowMs;
}

/** Was an action taken within the one-touch window of receiving the ball? */
export function isOneTouch(receiveT: number, actionT: number, windowMs = ONE_TOUCH_MS): boolean {
  const dt = actionT - receiveT;
  return dt >= 0 && dt <= windowMs;
}

// --- tackling --------------------------------------------------------------
//
// A tackle is an *attempt*, never a passive coin-flip. A standing poke has short
// reach and no downside; a committed slide reaches further and lunges, but a
// whiffed slide grounds the tackler for a beat (the risk). Success is weighted —
// closer to the ball, a more exposed carrier (ball knocked further from the foot
// by a sprint, #93), and a more skilled defender all raise it — never a flat 0.5.

export type TackleResult = 'steal' | 'loose' | 'miss';

export interface TackleParams {
  dist: number; // tackler → ball distance (px)
  reach: number; // max reach for this tackle type (poke < slide)
  exposure: number; // 0..1 — how far the ball is off the carrier's foot (knock-on)
  skill: number; // 0..1 — defender skill (team defense)
  slide: boolean; // committed slide (cleaner win, but whiff = lockout for the caller)
  roll: number; // RNG in [0,1)
}

/** Standing-poke reach measured from the ball (short, safe). */
export const POKE_REACH = 30;
/** Slide reach (longer lunge, but a miss grounds you). */
export const SLIDE_REACH = 46;

/**
 * How exposed a carrier is (0..1) given how far the ball sits off their foot.
 * At the foot (≈CARRY_BASE) the carrier is well protected (0); knocked a full
 * sprint-touch ahead they're wide open (1). Mirrors the #93 knock-on so a sprint
 * directly raises tackle vulnerability.
 */
export function ballExposure(ballAhead: number): number {
  return Math.min(1, Math.max(0, (ballAhead - CARRY_BASE) / CARRY_KNOCK_SPRINT));
}

/**
 * Resolve a tackle attempt. Out of reach → always a miss. In reach, success
 * scales monotonically with closeness, carrier exposure, and defender skill; a
 * win is a clean `steal` when very close/skilled, otherwise the ball pops
 * `loose`. Deterministic given `roll`.
 */
export function tackleOutcome(p: TackleParams): TackleResult {
  if (!(p.dist <= p.reach) || p.reach <= 0) return 'miss';
  const closeness = 1 - Math.min(1, Math.max(0, p.dist / p.reach)); // 0..1
  const skill = Math.min(1, Math.max(0, p.skill));
  const exposure = Math.min(1, Math.max(0, p.exposure));
  let success = 0.3 + closeness * 0.4 + exposure * 0.25 + skill * 0.2;
  success = Math.min(0.95, Math.max(0.05, success));
  if (p.roll < success) {
    const cleanly = closeness * 0.5 + skill * 0.4 + (p.slide ? 0.15 : 0);
    return cleanly > 0.55 ? 'steal' : 'loose';
  }
  return 'miss';
}
