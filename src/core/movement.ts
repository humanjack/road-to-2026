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
