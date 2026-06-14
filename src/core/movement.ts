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
  out: Vec2 = { x: 0, y: 0 }, // pass a reusable scratch to avoid a per-call allocation
): Vec2 {
  // Defensive: recover from any non-finite input rather than propagating NaN
  // (a single bad value would poison every downstream position).
  if (!Number.isFinite(vx) || !Number.isFinite(vy)) {
    vx = 0;
    vy = 0;
  }
  if (!Number.isFinite(desVx) || !Number.isFinite(desVy) || !(dt > 0)) {
    out.x = vx;
    out.y = vy;
    return out;
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
    out.x = 0;
    out.y = 0;
    return out;
  }
  out.x = vx;
  out.y = vy;
  return out;
}

// --- turning (hard-cut bleed + lean) ---------------------------------------
//
// A sharp direction change should read as a planted cut, not a frictionless
// pivot: the player bleeds a little speed (the cost of the turn, a defender's
// counterplay) and the body leans into the new heading for a beat. Both derive
// from the same "sharpness" — how far the desired heading is from the current
// velocity. Pure functions of the velocity vectors (no dt, no wall-clock), so
// the bleed is replay-deterministic.

/**
 * How sharp a turn is, 0..1: 0 for a gentle change (angle within `threshold`),
 * ramping to 1 at a full 180° reversal. Returns 0 when barely moving / no input.
 */
export function turnSharpness(curVx: number, curVy: number, desVx: number, desVy: number, threshold = 0.25): number {
  const cs = Math.hypot(curVx, curVy);
  const ds = Math.hypot(desVx, desVy);
  if (cs < 1 || ds < 0.01) return 0; // not moving (px/s) or no desired heading (unit or velocity)
  const cos = (curVx * desVx + curVy * desVy) / (cs * ds); // -1 reverse … 1 same heading
  if (cos >= threshold) return 0;
  return Math.min(1, (threshold - cos) / (threshold + 1));
}

/**
 * Speed-retention factor for a turn (multiply the desired speed by this). 1.0 on
 * a straight hold, dipping to `1 - bleed` on the hardest reversal, clamped to a
 * `floor` so a cut never stalls the player. A few percent on the sharpest turns.
 */
export function turnBleed(curVx: number, curVy: number, desVx: number, desVy: number, bleed = 0.1, floor = 0.85): number {
  const sharp = turnSharpness(curVx, curVy, desVx, desVy);
  return Math.max(floor, 1 - bleed * sharp);
}

// --- body collision (shoulder-barge) ---------------------------------------
//
// Two bodies meeting at speed should exchange momentum, not silently squeeze
// apart. Along the contact normal (a → b), a partial equal-mass exchange slows
// the faster body and knocks the slower one along the normal. `transfer` (0..1)
// scales the exchange (inelastic < 1); both outputs are clamped to `cap` so a
// pile-up settles instead of exploding. Pure + allocation-free.

export interface BumpResult {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

export function resolveBump(
  avx: number,
  avy: number,
  bvx: number,
  bvy: number,
  nx: number,
  ny: number,
  transfer: number,
  cap: number,
  out: BumpResult = { ax: 0, ay: 0, bx: 0, by: 0 },
): BumpResult {
  let ax = avx;
  let ay = avy;
  let bx = bvx;
  let by = bvy;
  const an = avx * nx + avy * ny; // a's velocity along the normal (a → b)
  const bn = bvx * nx + bvy * ny;
  const closing = an - bn; // > 0 ⇒ approaching along the normal
  if (closing > 0) {
    const j = closing * Math.min(1, Math.max(0, transfer)); // exchanged along the normal
    ax = avx - nx * j; // faster body slows along the normal
    ay = avy - ny * j;
    bx = bvx + nx * j; // slower body is knocked along the normal
    by = bvy + ny * j;
  }
  // clamp both results to the cap so repeated contacts can't blow up
  const as = Math.hypot(ax, ay);
  if (as > cap && as > 0) {
    const k = cap / as;
    ax *= k;
    ay *= k;
  }
  const bs = Math.hypot(bx, by);
  if (bs > cap && bs > 0) {
    const k = cap / bs;
    bx *= k;
    by *= k;
  }
  out.ax = ax;
  out.ay = ay;
  out.bx = bx;
  out.by = by;
  return out;
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

// --- passing ---------------------------------------------------------------
//
// A pass should go to the team-mate you *mean* — the one best aligned with your
// aim inside an assist cone — not a fixed "most-advanced" heuristic. Tighter
// cones (semi/manual, #105) demand more precision; the widest is the casual
// default. Through-balls (#97) reuse the same selector with a forward bias.

export interface PassMate {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** Assist cone half-angles as cosines (cos of the half-angle): wider = more help. */
export const PASS_CONE = {
  full: Math.cos((60 * Math.PI) / 180), // ±60° — casual / touch default
  semi: Math.cos((32 * Math.PI) / 180), // ±32°
  manual: Math.cos((14 * Math.PI) / 180), // ±14° — near pure stick aim
};

/**
 * Pick the best team-mate to receive a pass: among those inside the aim cone,
 * prefer the one most aligned with the aim, with light tie-breaks for forward
 * progress and proximity. Returns the index into `mates`, or -1 if the cone is
 * empty (caller should fall back so a press is never wasted).
 */
export function choosePassTarget(
  fromX: number,
  fromY: number,
  aimX: number,
  aimY: number,
  mates: PassMate[],
  coneCos: number,
  attackDir: number,
  forwardBias = 0,
): number {
  const al = Math.hypot(aimX, aimY);
  if (al === 0) return -1;
  const ax = aimX / al;
  const ay = aimY / al;
  let best = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < mates.length; i++) {
    const m = mates[i];
    const dx = m.x - fromX;
    const dy = m.y - fromY;
    const d = Math.hypot(dx, dy);
    if (d < 1) continue;
    const cos = (dx / d) * ax + (dy / d) * ay; // alignment with aim, -1..1
    if (cos < coneCos) continue; // outside the cone
    const ahead = (dx * attackDir) / 600; // forward progress, normalized-ish
    const score = cos * 2 + ahead * (1 + forwardBias) - d / 2000;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

/**
 * Where to play a through-ball: ahead of the runner along their run *and* a step
 * further toward the attacking goal, so it leads them into space behind the line
 * rather than to their feet. Caller clamps the result to the pitch.
 */
export function throughBallLead(
  mx: number,
  my: number,
  mvx: number,
  mvy: number,
  attackDir: number,
  runLead = 0.45,
  goalLead = 80,
): { x: number; y: number } {
  return { x: mx + mvx * runLead + attackDir * goalLead, y: my + mvy * runLead };
}

// --- off-ball movement -----------------------------------------------------
//
// When your team has the ball, team-mates shouldn't stand in formation — they
// should offer options. A forward makes a depth run ahead of the ball (staying
// in their lane for width); a midfielder holds a short support angle goal-side
// of the carrier (a safe outlet). Runs come in staggered waves so defenders can
// react and the attack isn't a constant overload.

/**
 * A forward's depth run: ahead of the ball toward the attacking goal, held in
 * the player's own lane (`laneY`) for width. Clamped to a playable band so the
 * runner never camps on the byline. `depth` is how far beyond the ball to run.
 */
export function forwardRunTarget(
  laneY: number,
  ballX: number,
  attackDir: number,
  pitchLeft: number,
  pitchRight: number,
  depth = 200,
): { x: number; y: number } {
  const x = Math.min(pitchRight - 40, Math.max(pitchLeft + 40, ballX + attackDir * depth));
  return { x, y: laneY };
}

/**
 * A midfielder's support outlet: goal-side (behind) the carrier so a back-pass
 * is always on, offset laterally toward `laneY` to open a clean passing angle.
 */
export function supportTarget(
  carrierX: number,
  carrierY: number,
  laneY: number,
  attackDir: number,
  behind = 80,
): { x: number; y: number } {
  return { x: carrierX - attackDir * behind, y: carrierY + (laneY - carrierY) * 0.5 };
}

/** Is this player's staggered run active right now? Desynced by `phase`. */
export function runActive(elapsed: number, phase: number, period = 4, duty = 0.55): boolean {
  const t = ((elapsed * 0.6 + phase) % period) / period;
  return t < duty;
}

// --- goalkeeper ------------------------------------------------------------
//
// A competent keeper isn't a cone on the line — it positions on the angle (the
// line from its goal-centre to the ball, narrowing the shooter's view) and
// comes off the line as the ball nears. When a shot arrives it makes a save
// weighted by how well it's positioned and its reaction, so well-placed corner
// shots still beat it (fair) but tame efforts on its body are stopped.

export type SaveResult = 'catch' | 'parry' | 'beaten';

/** Keeper reach for a diving save (px from its body to the ball). */
export const SAVE_REACH = 52;

/**
 * Where the keeper should stand: on the goal-centre→ball line (narrowing the
 * angle), coming off its line toward the ball the nearer the ball gets. Y is
 * clamped to just outside the posts so it always protects the mouth.
 */
export function keeperTarget(
  ballX: number,
  ballY: number,
  goalLineX: number,
  goalCenterY: number,
  comeOutSign: number, // +1 if the keeper advances toward +x, -1 toward -x
  goalH: number,
  maxOut = 78,
  reactDist = 340,
): { x: number; y: number } {
  const ballDist = Math.abs(ballX - goalLineX);
  const depth = Math.min(maxOut, Math.max(8, maxOut * (1 - ballDist / reactDist)));
  const keeperX = goalLineX + comeOutSign * depth;
  // Y on the goal-centre→ball line at the keeper's depth (narrows the angle)
  const denom = ballX - goalLineX;
  const ratio = Math.abs(denom) < 1 ? 0 : depth / Math.abs(denom);
  let keeperY = goalCenterY + (ballY - goalCenterY) * Math.min(1, ratio);
  const half = goalH / 2 + 10;
  keeperY = Math.min(goalCenterY + half, Math.max(goalCenterY - half, keeperY));
  return { x: keeperX, y: keeperY };
}

/**
 * Resolve a shot that has reached the keeper. Out of reach → beaten. In reach,
 * a save is likelier the more central the ball is to the keeper and the higher
 * its reaction; a strong save is a clean `catch`, a marginal one a `parry`
 * (loose rebound). Deterministic given `roll`. Capped < 1 so it's never a wall.
 */
export function saveOutcome(distToBall: number, reach: number, reaction: number, roll: number): SaveResult {
  if (!(distToBall <= reach) || reach <= 0) return 'beaten';
  const prox = 1 - distToBall / reach;
  const react = Math.min(1, Math.max(0, reaction));
  const save = Math.min(0.97, Math.max(0.05, 0.2 + prox * 0.5 + react * 0.35));
  if (roll < save) return (prox + react) * 0.5 > 0.62 ? 'catch' : 'parry';
  return 'beaten';
}

// --- player switching ------------------------------------------------------
//
// On defence you want the team-mate who can actually make a play — the closest
// one that's goal-side of the ball (between the ball and your goal), not the
// next body in an array. Index-cycling is the #1 mobile-frustration the GDD
// calls out; this picks the useful man.

/**
 * Pick the most useful defender to switch to: prefer candidates goal-side of the
 * ball (a strong bonus), then nearest to the ball. Skips `currentIdx` unless it
 * is the only option. Returns the index into `cands`, or -1 if empty.
 */
export function chooseSwitchTarget(
  cands: { x: number; y: number }[],
  ballX: number,
  ballY: number,
  ownGoalX: number,
  currentIdx: number,
): number {
  const goalIsLeft = ownGoalX < ballX; // is our goal to the -x side of the ball?
  let bestGoalSide = -1;
  let bestGoalSideD = Infinity;
  let bestAny = -1;
  let bestAnyD = Infinity;
  for (let i = 0; i < cands.length; i++) {
    if (i === currentIdx) continue; // a switch should move to someone else
    const c = cands[i];
    const d = Math.hypot(c.x - ballX, c.y - ballY);
    if (d < bestAnyD) {
      bestAnyD = d;
      bestAny = i;
    }
    const onGoalSide = goalIsLeft ? c.x <= ballX : c.x >= ballX;
    if (onGoalSide && d < bestGoalSideD) {
      bestGoalSideD = d;
      bestGoalSide = i;
    }
  }
  // a goal-side defender can actually make a play; only if there are none do we
  // fall back to the nearest body
  return bestGoalSide >= 0 ? bestGoalSide : bestAny;
}

// --- marking & cover -------------------------------------------------------
//
// When the opponent has the ball, defenders shouldn't ball-watch in formation —
// each should pick up a man. A one-to-one greedy assignment (most-dangerous
// attacker gets the nearest free defender first) avoids two defenders chasing
// the same runner and leaving someone free; each marker then sits goal-side of
// its man so it's between the attacker and the goal.

/**
 * Assign each defender at most one attacker to mark (and each attacker at most
 * one defender). Attackers should be passed most-dangerous first; each grabs the
 * nearest still-free defender. Returns, per defender, the attacker index it
 * marks (or -1). One-to-one — no double-marks, no free dangerous man.
 */
export function assignMarks(defenders: { x: number; y: number }[], attackers: { x: number; y: number }[]): number[] {
  const marks = new Array(defenders.length).fill(-1);
  const used = new Array(defenders.length).fill(false);
  for (let a = 0; a < attackers.length; a++) {
    let best = -1;
    let bestD = Infinity;
    for (let d = 0; d < defenders.length; d++) {
      if (used[d]) continue;
      const dd = Math.hypot(defenders[d].x - attackers[a].x, defenders[d].y - attackers[a].y);
      if (dd < bestD) {
        bestD = dd;
        best = d;
      }
    }
    if (best >= 0) {
      used[best] = true;
      marks[best] = a;
    }
  }
  return marks;
}

/** A goal-side marking spot: `standoff` px from the attacker toward our goal. */
export function markPoint(
  attackerX: number,
  attackerY: number,
  ownGoalX: number,
  ownGoalY: number,
  standoff = 42,
): { x: number; y: number } {
  const dx = ownGoalX - attackerX;
  const dy = ownGoalY - attackerY;
  const L = Math.hypot(dx, dy) || 1;
  return { x: attackerX + (dx / L) * standoff, y: attackerY + (dy / L) * standoff };
}

// --- audio mapping ---------------------------------------------------------

/**
 * Normalise a kick/shot speed (px/s) to a 0..1 strike strength for the
 * power-scaled "thwock" sfx. A tap pass lands low, a full screamer at ~1.
 */
export function shotPower01(speed: number, maxPower = 980): number {
  if (!Number.isFinite(speed) || maxPower <= 0) return 0;
  return Math.min(1, Math.max(0, speed / maxPower));
}

// --- charged-shot sweet window + curve (#133) ------------------------------
//
// Past the driven zone a short "sweet window" opens on the charge bar. Releasing
// inside it snaps the shot to max power AND imparts curve — a lateral acceleration
// applied to the free ball per fixed step that bends its path toward the aim side
// then decays. A mistimed release still fires, just flat — the window is a reward,
// not a gate. Determinism is over the recorded RELEASE-CHARGE VALUE: given the same
// charge value + seed, the curve integrated from ball state is bit-identical.

/** Charge fraction at which the sweet window opens / closes. */
export const SHOT_SWEET_START = 0.78;
export const SHOT_SWEET_END = 0.92;
/** Base lateral acceleration (px/s²) of a curved (sweet) shot. */
export const CURVE_ACCEL = 900;
/** Per-second decay of the curve so the swerve eventually straightens. */
const CURVE_DECAY = 0.5;

export interface ShotRelease {
  power01: number; // 0..1 strike power (a sweet release snaps to 1)
  sweet: boolean; // released inside the window?
}

/** Resolve a charged-shot release: inside the sweet window → max power + sweet flag. */
export function shotRelease(charge: number, sweetStart = SHOT_SWEET_START, sweetEnd = SHOT_SWEET_END): ShotRelease {
  const c = charge < 0 ? 0 : charge > 1 ? 1 : charge;
  const sweet = c >= sweetStart && c <= sweetEnd;
  return { power01: sweet ? 1 : c, sweet };
}

/** Lateral-acceleration magnitude for a curved shot, lightly scaled by power. */
export function curveAccel(power01: number, strength = CURVE_ACCEL): number {
  const p = power01 < 0 ? 0 : power01 > 1 ? 1 : power01;
  return strength * (0.7 + 0.3 * p);
}

export interface CurveState {
  vx: number;
  vy: number;
  curve: number;
}

/**
 * One fixed step of in-flight curve: accelerate the velocity along the left normal
 * of its current heading by `curve`, then decay `curve` so the swerve dies out.
 * Pure and allocation-free (writes into `out`); deterministic from ball state only,
 * so a recorded launch + curve reproduces the same path every run.
 */
export function stepCurve(
  vx: number,
  vy: number,
  curve: number,
  dt: number,
  out: CurveState = { vx: 0, vy: 0, curve: 0 },
): CurveState {
  if (curve !== 0 && dt > 0) {
    const sp = Math.hypot(vx, vy);
    if (sp > 1) {
      const nx = -vy / sp; // left normal of the heading
      const ny = vx / sp;
      vx += nx * curve * dt;
      vy += ny * curve * dt;
    }
    curve *= Math.pow(CURVE_DECAY, dt);
    if (Math.abs(curve) < 1) curve = 0; // settle to straight
  }
  out.vx = vx;
  out.vy = vy;
  out.curve = curve;
  return out;
}

// --- skill moves -----------------------------------------------------------
//
// A lightweight 1v1 toolkit: while carrying, a skill input jinks the ball. With
// a lateral input it's a side-step (shift the ball to that side and burst); with
// a forward / no input it's a knock-and-go (push the ball ahead and accelerate
// past your man). Kept to these two readable moves — arcade, not a move list.

export interface SkillMove {
  dx: number; // unit direction of the jink (and the body burst)
  dy: number;
  type: 'sidestep' | 'knock';
}

/**
 * Resolve a skill from the carrier's facing and held input. Forward-ish or no
 * input → knock-and-go along facing; a clearly lateral input → side-step in the
 * input direction. Returns a unit direction + the move type.
 */
export function skillMove(faceX: number, faceY: number, inX: number, inY: number): SkillMove {
  const fl = Math.hypot(faceX, faceY) || 1;
  const fx = faceX / fl;
  const fy = faceY / fl;
  const il = Math.hypot(inX, inY);
  if (il < 0.3) return { dx: fx, dy: fy, type: 'knock' }; // no clear input → go forward
  const ix = inX / il;
  const iy = inY / il;
  const dot = ix * fx + iy * fy; // how forward-aligned the input is
  if (dot > 0.6) return { dx: fx, dy: fy, type: 'knock' }; // input mostly forward → knock-and-go
  return { dx: ix, dy: iy, type: 'sidestep' }; // lateral input → side-step that way
}
