import { describe, it, expect } from 'vitest';
import {
  approachVelocity,
  stepStamina,
  STAMINA,
  carryOffset,
  easeCarryAngle,
  CARRY_BASE,
  bufferConsumable,
  bufferExpired,
  isOneTouch,
  INPUT_BUFFER_MS,
  tackleOutcome,
  ballExposure,
  POKE_REACH,
  SLIDE_REACH,
  choosePassTarget,
  throughBallLead,
  forwardRunTarget,
  supportTarget,
  runActive,
  PASS_CONE,
  type PassMate,
  PLAYER_ACCEL,
  PLAYER_DECEL,
} from './movement';

// Integrate a held desired velocity for `seconds` at a fixed `dt`, returning the
// final velocity and the trapezoidal displacement (avg-velocity per step — the
// quality position integral, frame-rate independent to second order).
function run(desVx: number, desVy: number, seconds: number, dt: number, vx = 0, vy = 0) {
  let dispX = 0;
  let dispY = 0;
  const steps = Math.round(seconds / dt);
  for (let i = 0; i < steps; i++) {
    const nv = approachVelocity(vx, vy, desVx, desVy, PLAYER_ACCEL, PLAYER_DECEL, dt);
    dispX += ((vx + nv.x) / 2) * dt;
    dispY += ((vy + nv.y) / 2) * dt;
    vx = nv.x;
    vy = nv.y;
  }
  return { vx, vy, dispX, dispY, speed: Math.hypot(vx, vy) };
}

describe('approachVelocity', () => {
  const TOP = 210;

  it('reaches ~95% of top speed within 0.2s from rest', () => {
    const r = run(TOP, 0, 0.2, 1 / 60);
    expect(r.speed).toBeGreaterThanOrEqual(0.95 * TOP);
    expect(r.speed).toBeLessThanOrEqual(TOP + 1e-6); // never overshoots top speed
  });

  it('decelerates to a dead stop within ~0.15s after input release', () => {
    const moving = run(TOP, 0, 0.5, 1 / 60); // get up to speed
    const stopped = run(0, 0, 0.15, 1 / 60, moving.vx, moving.vy);
    expect(stopped.speed).toBe(0);
  });

  it('never overshoots the desired velocity (monotone approach)', () => {
    let vx = 0;
    let vy = 0;
    const dt = 1 / 60;
    for (let i = 0; i < 60; i++) {
      const nv = approachVelocity(vx, vy, TOP, 0, PLAYER_ACCEL, PLAYER_DECEL, dt);
      // distance to target never increases, and speed never exceeds target
      expect(Math.hypot(TOP - nv.x, 0 - nv.y)).toBeLessThanOrEqual(Math.hypot(TOP - vx, 0 - vy) + 1e-9);
      expect(Math.hypot(nv.x, nv.y)).toBeLessThanOrEqual(TOP + 1e-9);
      vx = nv.x;
      vy = nv.y;
    }
  });

  it('a hard reverse at top speed arcs through lower speed (momentum), not a snap', () => {
    const moving = run(TOP, 0, 0.5, 1 / 60); // +x at top speed
    // one step of fully-reversed desired velocity must not flip sign instantly
    const dt = 1 / 60;
    const nv = approachVelocity(moving.vx, moving.vy, -TOP, 0, PLAYER_ACCEL, PLAYER_DECEL, dt);
    expect(nv.x).toBeLessThan(moving.vx); // slowing
    expect(nv.x).toBeGreaterThan(-TOP); // hasn't teleported to full reverse
    // mid-reversal the speed dips well below top speed (the arc)
    let vx = moving.vx;
    let vy = moving.vy;
    let minSpeed = Infinity;
    for (let i = 0; i < 40; i++) {
      const r = approachVelocity(vx, vy, -TOP, 0, PLAYER_ACCEL, PLAYER_DECEL, dt);
      vx = r.x;
      vy = r.y;
      minSpeed = Math.min(minSpeed, Math.hypot(vx, vy));
    }
    expect(minSpeed).toBeLessThan(0.25 * TOP);
  });

  it('is frame-rate independent: 1s displacement matches across dt (±1.5%)', () => {
    const slow = run(TOP, 0, 1, 1 / 30);
    const fast = run(TOP, 0, 1, 1 / 144);
    const rel = Math.abs(slow.dispX - fast.dispX) / fast.dispX;
    expect(rel).toBeLessThan(0.015);
    // both settle at exactly top speed
    expect(slow.speed).toBeCloseTo(TOP, 5);
    expect(fast.speed).toBeCloseTo(TOP, 5);
  });

  it('preserves top speed exactly while turning (chord stays inside the speed circle)', () => {
    const moving = run(TOP, 0, 0.5, 1 / 60);
    let vx = moving.vx;
    let vy = moving.vy;
    const dt = 1 / 60;
    let maxSpeed = 0;
    for (let i = 0; i < 60; i++) {
      const r = approachVelocity(vx, vy, 0, TOP, PLAYER_ACCEL, PLAYER_DECEL, dt); // turn 90° to +y
      vx = r.x;
      vy = r.y;
      maxSpeed = Math.max(maxSpeed, Math.hypot(vx, vy));
    }
    expect(maxSpeed).toBeLessThanOrEqual(TOP + 1e-6);
    expect(Math.hypot(vx, vy)).toBeCloseTo(TOP, 3); // ends at top speed in the new direction
  });

  it('recovers from non-finite velocity instead of propagating NaN', () => {
    const r = approachVelocity(NaN, NaN, TOP, 0, PLAYER_ACCEL, PLAYER_DECEL, 1 / 60);
    expect(Number.isFinite(r.x)).toBe(true);
    expect(Number.isFinite(r.y)).toBe(true);
  });

  it('is a no-op for non-positive dt', () => {
    const r = approachVelocity(50, 20, 0, 0, PLAYER_ACCEL, PLAYER_DECEL, 0);
    expect(r).toEqual({ x: 50, y: 20 });
  });
});

describe('stepStamina', () => {
  const dt = 1 / 60;

  // helper: run for `seconds` with a fixed draining flag from a start state
  function hold(start: { stamina: number; locked: boolean }, draining: boolean, seconds: number) {
    let s = start.stamina;
    let locked = start.locked;
    const steps = Math.round(seconds / dt);
    for (let i = 0; i < steps; i++) {
      const r = stepStamina(s, draining && !locked && s > 0, locked, dt);
      s = r.stamina;
      locked = r.locked;
    }
    return { stamina: s, locked };
  }

  it('drains to exhaustion in ~3.3s of continuous sprint', () => {
    // find the frame the lock first engages while holding sprint
    let s = 1;
    let locked = false;
    let exhaustT = -1;
    for (let i = 0; i < Math.round(6 / dt); i++) {
      const canSprint = !locked && s > 0;
      const r = stepStamina(s, canSprint, locked, dt);
      s = r.stamina;
      locked = r.locked;
      if (locked && exhaustT < 0) exhaustT = (i + 1) * dt;
    }
    expect(exhaustT).toBeGreaterThan(3.0);
    expect(exhaustT).toBeLessThan(3.7); // empties at ~1/0.3 ≈ 3.33s
  });

  it('recovers from empty to full in ~5s and clears the lock at unlockAt', () => {
    const empty = { stamina: 0, locked: true };
    const after1 = hold(empty, false, 1.0); // 1s recovery: 0.2 < unlockAt(0.3) → still locked
    expect(after1.locked).toBe(true);
    const after2 = hold(empty, false, 2.0); // 2s: 0.4 ≥ unlockAt → unlocked
    expect(after2.locked).toBe(false);
    const after5 = hold(empty, false, 5.5);
    expect(after5.stamina).toBe(1);
    expect(after5.locked).toBe(false);
  });

  it('never lets a sprint-empty player keep draining (hysteresis prevents stutter-sprint)', () => {
    // exhaust, then immediately request sprint again every frame — must stay 0 & locked
    let s = 0;
    let locked = true;
    for (let i = 0; i < 30; i++) {
      const canSprint = !locked && s > 0;
      const r = stepStamina(s, true && canSprint, locked, dt); // intent to sprint, but gated
      s = r.stamina;
      locked = r.locked;
    }
    expect(s).toBeGreaterThan(0); // it was recovering (draining gated off), not stuck at 0
    expect(s).toBeLessThan(STAMINA.unlockAt); // still under the unlock threshold after 0.5s
    expect(locked).toBe(true);
  });

  it('clamps to [0,1] and recovers from NaN', () => {
    const over = stepStamina(1, false, false, dt); // already full
    expect(over.stamina).toBeLessThanOrEqual(1);
    const nan = stepStamina(NaN, false, false, dt);
    expect(Number.isFinite(nan.stamina)).toBe(true);
  });

  it('is a no-op on non-positive dt', () => {
    const r = stepStamina(0.5, true, false, 0);
    expect(r.stamina).toBe(0.5);
  });
});

describe('carryOffset', () => {
  const BASE = 210;

  it('sits the ball just ahead of the body at a standstill', () => {
    expect(carryOffset(0, BASE, false)).toBe(CARRY_BASE);
  });

  it('grows with speed (faster dribble = ball further ahead)', () => {
    const slow = carryOffset(60, BASE, false);
    const fast = carryOffset(190, BASE, false);
    expect(fast).toBeGreaterThan(slow);
    expect(slow).toBeGreaterThanOrEqual(CARRY_BASE);
  });

  it('pushes the ball much further ahead while sprinting (knock-on)', () => {
    const jog = carryOffset(190, BASE, false);
    const sprint = carryOffset(190, BASE, true);
    expect(sprint).toBeGreaterThan(jog + 10);
  });

  it('is bounded (clamps the speed term at base speed) and finite-safe', () => {
    const huge = carryOffset(99999, BASE, true);
    const atTop = carryOffset(BASE, BASE, true);
    expect(huge).toBe(atTop); // clamped, no runaway offset
    expect(carryOffset(NaN, BASE, true)).toBe(CARRY_BASE);
    expect(carryOffset(100, 0, true)).toBe(CARRY_BASE); // bad baseSpeed
  });
});

describe('easeCarryAngle', () => {
  it('moves toward the target facing by the lag fraction', () => {
    const r = easeCarryAngle(0, 1, 0.25);
    expect(r).toBeCloseTo(0.25, 6);
  });

  it('takes the shortest arc across the ±PI wrap (no spin-around)', () => {
    // from +3.0 rad toward -3.0 rad: shortest arc is +0.28 (through PI), not -6
    const r = easeCarryAngle(3.0, -3.0, 0.5);
    expect(r).toBeGreaterThan(3.0); // went the short way (increasing past PI)
  });

  it('snaps to target with lag=1 and recovers from NaN', () => {
    expect(easeCarryAngle(0.4, 1.2, 1)).toBeCloseTo(1.2, 6);
    expect(easeCarryAngle(NaN, 0.7, 0.3)).toBe(0.7);
  });
});

describe('input buffer', () => {
  it('a press within the window is consumable, then expires after it', () => {
    const buf = { action: 'pass', t: 1000 };
    expect(bufferConsumable(buf, 1000)).toBe(true); // same frame
    expect(bufferConsumable(buf, 1000 + INPUT_BUFFER_MS)).toBe(true); // edge of window
    expect(bufferConsumable(buf, 1000 + INPUT_BUFFER_MS + 1)).toBe(false); // just past
    expect(bufferExpired(buf, 1000 + INPUT_BUFFER_MS + 1)).toBe(true);
    expect(bufferExpired(buf, 1100)).toBe(false);
  });

  it('models the real scenario: press 100ms early fires on the legal frame', () => {
    const pressT = 5000;
    const buf = { action: 'shoot', t: pressT, charge: 0.9 };
    const legalAt = pressT + 100; // ball arrives 100ms later
    expect(bufferConsumable(buf, legalAt)).toBe(true);
    // but a press 200ms before a legal frame is already stale → dropped
    expect(bufferConsumable({ action: 'shoot', t: pressT }, pressT + 200)).toBe(false);
  });

  it('ignores a null buffer and never fires a future-dated press', () => {
    expect(bufferConsumable(null, 100)).toBe(false);
    expect(bufferExpired(null, 100)).toBe(false);
    expect(bufferConsumable({ action: 'pass', t: 200 }, 100)).toBe(false); // now < t
  });

  it('flags a one-touch only within the receive window', () => {
    expect(isOneTouch(1000, 1100)).toBe(true); // 100ms after receiving
    expect(isOneTouch(1000, 1260)).toBe(false); // 260ms → not one-touch
    expect(isOneTouch(1000, 999)).toBe(false); // before receiving
  });
});

describe('tackleOutcome', () => {
  const base = { reach: POKE_REACH, exposure: 0.5, skill: 0.7, slide: false };

  it('always misses when the ball is out of reach', () => {
    expect(tackleOutcome({ ...base, dist: POKE_REACH + 1, roll: 0 })).toBe('miss');
  });

  it('a point-blank, exposed, skilled poke with a low roll wins the ball', () => {
    const r = tackleOutcome({ ...base, dist: 2, exposure: 0.9, skill: 0.9, roll: 0.05 });
    expect(r === 'steal' || r === 'loose').toBe(true);
  });

  it('a high roll always misses (success is capped below 1)', () => {
    expect(tackleOutcome({ ...base, dist: 1, exposure: 1, skill: 1, slide: true, roll: 0.99 })).toBe('miss');
  });

  it('success is monotonic in closeness (for a fixed roll)', () => {
    const far = tackleOutcome({ ...base, dist: POKE_REACH * 0.95, roll: 0.5 });
    const near = tackleOutcome({ ...base, dist: POKE_REACH * 0.05, roll: 0.5 });
    const rank = (r: string) => (r === 'miss' ? 0 : r === 'loose' ? 1 : 2);
    expect(rank(near)).toBeGreaterThanOrEqual(rank(far));
  });

  it('a more exposed carrier is easier to dispossess (for a fixed roll)', () => {
    const guarded = tackleOutcome({ ...base, dist: 18, exposure: 0.0, skill: 0.4, roll: 0.55 });
    const exposed = tackleOutcome({ ...base, dist: 18, exposure: 1.0, skill: 0.4, roll: 0.55 });
    const rank = (r: string) => (r === 'miss' ? 0 : r === 'loose' ? 1 : 2);
    expect(rank(exposed)).toBeGreaterThanOrEqual(rank(guarded));
  });

  it('a slide wins more cleanly than a poke at the same geometry', () => {
    const poke = tackleOutcome({ dist: 10, reach: SLIDE_REACH, exposure: 0.5, skill: 0.5, slide: false, roll: 0.1 });
    const slide = tackleOutcome({ dist: 10, reach: SLIDE_REACH, exposure: 0.5, skill: 0.5, slide: true, roll: 0.1 });
    const rank = (r: string) => (r === 'miss' ? 0 : r === 'loose' ? 1 : 2);
    expect(rank(slide)).toBeGreaterThanOrEqual(rank(poke));
  });
});

describe('ballExposure', () => {
  it('is 0 with the ball at the foot and rises as it is knocked ahead', () => {
    expect(ballExposure(CARRY_BASE)).toBe(0);
    expect(ballExposure(CARRY_BASE + 15)).toBeGreaterThan(0);
    expect(ballExposure(CARRY_BASE + 15)).toBeLessThan(1);
  });
  it('clamps to [0,1]', () => {
    expect(ballExposure(0)).toBe(0);
    expect(ballExposure(9999)).toBe(1);
  });
});

describe('choosePassTarget', () => {
  // three mates: one up-right, one straight right, one down-left
  const mates: PassMate[] = [
    { x: 100, y: -100, vx: 0, vy: 0 }, // up-right (~ -45°)
    { x: 200, y: 0, vx: 0, vy: 0 }, // straight right
    { x: -120, y: 120, vx: 0, vy: 0 }, // behind / down-left
  ];

  it('picks the mate aligned with the aim direction', () => {
    // aim up-right → should pick mate 0, not the straight-ahead mate
    const i = choosePassTarget(0, 0, 1, -1, mates, PASS_CONE.full, 1);
    expect(i).toBe(0);
    // aim straight right → should pick mate 1
    expect(choosePassTarget(0, 0, 1, 0, mates, PASS_CONE.full, 1)).toBe(1);
  });

  it('returns -1 when no mate falls inside the cone (caller must fall back)', () => {
    // single mate straight right; aim straight up → 90° off, outside ±60°
    const right: PassMate[] = [{ x: 200, y: 0, vx: 0, vy: 0 }];
    expect(choosePassTarget(0, 0, 0, -1, right, PASS_CONE.full, 1)).toBe(-1);
  });

  it('a tighter cone rejects a marginally-aligned mate the wide cone accepts', () => {
    const offAxis: PassMate[] = [{ x: 100, y: -70, vx: 0, vy: 0 }]; // ~35° off straight-right
    expect(choosePassTarget(0, 0, 1, 0, offAxis, PASS_CONE.full, 1)).toBe(0); // ±60° accepts
    expect(choosePassTarget(0, 0, 1, 0, offAxis, PASS_CONE.manual, 1)).toBe(-1); // ±14° rejects
  });

  it('ignores a zero-length aim and an empty mate list', () => {
    expect(choosePassTarget(0, 0, 0, 0, mates, PASS_CONE.full, 1)).toBe(-1);
    expect(choosePassTarget(0, 0, 1, 0, [], PASS_CONE.full, 1)).toBe(-1);
  });

  it('a strong forward bias prefers a more advanced mate over a perfectly-aligned closer one', () => {
    // aim straight right; mate A dead-ahead but close, mate B further upfield, slightly off-axis
    const pair: PassMate[] = [
      { x: 120, y: 0, vx: 0, vy: 0 }, // dead-ahead, close
      { x: 480, y: 60, vx: 0, vy: 0 }, // much further forward, ~7° off
    ];
    expect(choosePassTarget(0, 0, 1, 0, pair, PASS_CONE.full, 1, 3)).toBe(1);
  });
});

describe('throughBallLead', () => {
  it('leads ahead of the runner along their run and toward the attacking goal', () => {
    const r = throughBallLead(100, 100, 60, 0, 1); // running, attacking +x
    expect(r.x).toBeGreaterThan(100 + 60 * 0.4); // ahead of run + goal lead
    expect(r.y).toBeCloseTo(100, 5);
  });
  it('respects attack direction (away team attacks -x)', () => {
    const r = throughBallLead(100, 100, 0, 0, -1);
    expect(r.x).toBeLessThan(100); // led toward -x goal
  });
});

describe('off-ball movement', () => {
  it('forwardRunTarget runs ahead of the ball toward goal, in the player lane', () => {
    const r = forwardRunTarget(300, 500, 1, 64, 1216, 200);
    expect(r.x).toBeGreaterThan(500); // ahead of the ball (attacking +x)
    expect(r.y).toBe(300); // stays in lane (width)
  });
  it('forwardRunTarget never camps past the playable band', () => {
    const r = forwardRunTarget(300, 1200, 1, 64, 1216, 400); // ball already deep
    expect(r.x).toBeLessThanOrEqual(1216 - 40);
  });
  it('supportTarget sits goal-side (behind) the carrier — a safe outlet', () => {
    const home = supportTarget(800, 360, 360, 1); // home attacks +x → support is at lower x
    expect(home.x).toBeLessThan(800);
    const away = supportTarget(400, 360, 360, -1); // away attacks -x → support is at higher x
    expect(away.x).toBeGreaterThan(400);
  });
  it('runActive cycles on and off over time and desyncs by phase', () => {
    // at the same elapsed, two phases shouldn't always agree
    let agree = 0;
    const N = 40;
    for (let k = 0; k < N; k++) {
      const e = k * 0.25;
      if (runActive(e, 0) === runActive(e, 2)) agree++;
    }
    expect(agree).toBeLessThan(N); // they diverge at least sometimes (staggered)
    // and a single phase is sometimes on (t≈0.015), sometimes off (t=0.75)
    const states = new Set([runActive(0.1, 0), runActive(5.0, 0)]);
    expect(states.size).toBe(2);
  });
});
