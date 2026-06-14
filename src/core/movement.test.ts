import { describe, it, expect } from 'vitest';
import {
  approachVelocity,
  stepStamina,
  STAMINA,
  carryOffset,
  carryStreakAlpha,
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
  keeperTarget,
  saveOutcome,
  SAVE_REACH,
  chooseSwitchTarget,
  assignMarks,
  markPoint,
  shotPower01,
  skillMove,
  PASS_CONE,
  type PassMate,
  PLAYER_ACCEL,
  PLAYER_DECEL,
  shotRelease,
  curveAccel,
  stepCurve,
  SHOT_SWEET_START,
  SHOT_SWEET_END,
  CURVE_ACCEL,
  type CurveState,
  turnSharpness,
  turnBleed,
  resolveBump,
  type BumpResult,
  postBounce,
  rippleAmplitude,
  loftLaunch,
  segmentBlocked,
  LOFT_GRAVITY,
  squashStretch,
  isHardStop,
  SQUASH_MIN,
  SQUASH_MAX,
  ACCEL_DEADZONE,
  type Squash,
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

describe('keeperTarget', () => {
  // home goal at x=64 (left), centre y=360, comes out toward +x
  const gx = 64;
  const cy = 376;
  const gh = 168;

  it('stays between the ball and the goal, on the shot line', () => {
    const k = keeperTarget(700, 200, gx, cy, 1, gh);
    expect(k.x).toBeGreaterThan(gx); // off its line, toward the field
    expect(k.x).toBeLessThan(700); // but still goal-side of the ball
    // narrows the angle: keeper Y is on the goal-centre→ball side of centre
    expect(k.y).toBeLessThan(cy); // ball is above centre → keeper shades up
  });

  it('comes further off its line as the ball gets closer', () => {
    const far = keeperTarget(900, cy, gx, cy, 1, gh);
    const near = keeperTarget(180, cy, gx, cy, 1, gh);
    expect(near.x - gx).toBeGreaterThan(far.x - gx);
  });

  it('keeps the keeper within the mouth band and respects away direction', () => {
    const high = keeperTarget(700, -500, gx, cy, 1, gh);
    expect(high.y).toBeGreaterThanOrEqual(cy - gh / 2 - 10);
    const away = keeperTarget(500, 300, 1216, cy, -1, gh); // away goal on the right
    expect(away.x).toBeLessThan(1216); // comes out toward -x
  });
});

describe('saveOutcome', () => {
  it('is beaten when the ball is out of reach', () => {
    expect(saveOutcome(SAVE_REACH + 1, SAVE_REACH, 1, 0)).toBe('beaten');
  });
  it('catches a central shot with good reaction and a low roll', () => {
    expect(saveOutcome(2, SAVE_REACH, 0.9, 0.05)).toBe('catch');
  });
  it('is never a wall: a high roll can still beat a well-placed keeper', () => {
    expect(saveOutcome(2, SAVE_REACH, 1, 0.99)).toBe('beaten');
  });
  it('is monotonic: closer + better reaction never lowers the save tier', () => {
    const rank = (r: string) => (r === 'beaten' ? 0 : r === 'parry' ? 1 : 2);
    const weak = saveOutcome(SAVE_REACH * 0.9, SAVE_REACH, 0.2, 0.5);
    const strong = saveOutcome(SAVE_REACH * 0.1, SAVE_REACH, 0.9, 0.5);
    expect(rank(strong)).toBeGreaterThanOrEqual(rank(weak));
  });
});

describe('chooseSwitchTarget', () => {
  // own goal on the left (x=64); ball at x=700
  const ownGoalX = 64;
  const ballX = 700;
  const ballY = 360;

  it('prefers a goal-side defender over a closer one that is up-field of the ball', () => {
    const cands = [
      { x: 760, y: 360 }, // 0: very close but BEHIND the ball (up-field, wrong side)
      { x: 500, y: 380 }, // 1: a bit further but goal-side (between ball and our goal)
    ];
    expect(chooseSwitchTarget(cands, ballX, ballY, ownGoalX, -1)).toBe(1);
  });

  it('among goal-side defenders, picks the nearest to the ball', () => {
    const cands = [
      { x: 300, y: 360 }, // far goal-side
      { x: 600, y: 360 }, // near goal-side
    ];
    expect(chooseSwitchTarget(cands, ballX, ballY, ownGoalX, -1)).toBe(1);
  });

  it('skips the current player and returns -1 when no other candidate exists', () => {
    const cands = [{ x: 500, y: 360 }];
    expect(chooseSwitchTarget(cands, ballX, ballY, ownGoalX, 0)).toBe(-1);
  });
});

describe('assignMarks', () => {
  it('is one-to-one: no attacker is marked twice, no defender marks twice', () => {
    const defenders = [
      { x: 100, y: 100 },
      { x: 100, y: 300 },
      { x: 100, y: 500 },
    ];
    const attackers = [
      { x: 120, y: 110 }, // closest to def 0
      { x: 120, y: 310 }, // closest to def 1
      { x: 120, y: 510 }, // closest to def 2
    ];
    const marks = assignMarks(defenders, attackers);
    const assigned = marks.filter((m) => m >= 0);
    expect(new Set(assigned).size).toBe(assigned.length); // no attacker marked twice
    expect(marks).toEqual([0, 1, 2]);
  });

  it('the most-dangerous attacker (passed first) gets the nearest defender even amid contention', () => {
    const defenders = [{ x: 200, y: 200 }]; // only one defender
    const attackers = [
      { x: 210, y: 205 }, // danger #1 (first) — should be marked
      { x: 205, y: 200 }, // even closer but lower priority
    ];
    const marks = assignMarks(defenders, attackers);
    expect(marks[0]).toBe(0); // the first (most dangerous) attacker
  });

  it('leaves spare defenders unmarked when defenders outnumber attackers', () => {
    const marks = assignMarks([{ x: 0, y: 0 }, { x: 50, y: 0 }], [{ x: 10, y: 0 }]);
    expect(marks.filter((m) => m >= 0).length).toBe(1); // one marks, one is spare (cover)
  });
});

describe('markPoint', () => {
  it('sits goal-side of the attacker (between attacker and our goal)', () => {
    const p = markPoint(700, 360, 64, 360, 42); // our goal at x=64 (left)
    expect(p.x).toBeLessThan(700); // toward our goal
    expect(p.x).toBeGreaterThan(64);
    expect(p.y).toBeCloseTo(360, 5);
  });
});

describe('shotPower01', () => {
  it('maps a tap pass low and a screamer near 1, monotonically, clamped', () => {
    const tap = shotPower01(320);
    const screamer = shotPower01(980);
    expect(tap).toBeGreaterThan(0);
    expect(tap).toBeLessThan(screamer);
    expect(screamer).toBeCloseTo(1, 5);
    expect(shotPower01(5000)).toBe(1); // clamped
    expect(shotPower01(-10)).toBe(0);
    expect(shotPower01(NaN)).toBe(0);
  });
});

describe('skillMove', () => {
  it('knock-and-go along facing when input is forward or absent', () => {
    const none = skillMove(1, 0, 0, 0); // facing +x, no input
    expect(none.type).toBe('knock');
    expect(none.dx).toBeCloseTo(1, 5);
    const fwd = skillMove(1, 0, 1, 0.2); // input roughly forward
    expect(fwd.type).toBe('knock');
  });
  it('side-steps in the input direction when input is lateral to facing', () => {
    const up = skillMove(1, 0, 0, -1); // facing +x, flick up
    expect(up.type).toBe('sidestep');
    expect(up.dy).toBeCloseTo(-1, 5);
    const down = skillMove(1, 0, 0, 1);
    expect(down.type).toBe('sidestep');
    expect(down.dy).toBeCloseTo(1, 5);
  });
  it('returns a unit direction', () => {
    const s = skillMove(0, 1, 1, 0); // facing +y, flick +x → sidestep
    expect(Math.hypot(s.dx, s.dy)).toBeCloseTo(1, 5);
  });
});

describe('turnSharpness / turnBleed (#129)', () => {
  it('a straight hold has zero sharpness and full speed retention', () => {
    expect(turnSharpness(200, 0, 1, 0)).toBe(0);
    expect(turnBleed(200, 0, 1, 0)).toBe(1);
  });

  it('a gentle turn (within threshold) still bleeds nothing', () => {
    // ~30° change: cos ≈ 0.87 > threshold
    expect(turnSharpness(200, 0, Math.cos(0.5), Math.sin(0.5))).toBe(0);
    expect(turnBleed(200, 0, Math.cos(0.5), Math.sin(0.5))).toBe(1);
  });

  it('sharpness rises monotonically as the turn approaches 180°', () => {
    let prev = -1;
    for (let i = 0; i <= 10; i++) {
      const ang = (Math.PI * i) / 10; // 0 → 180°
      const s = turnSharpness(200, 0, Math.cos(ang), Math.sin(ang));
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
    expect(turnSharpness(200, 0, -1, 0)).toBeCloseTo(1, 5); // full reversal
  });

  it('a 180° reverse dips speed a few percent but never below the floor', () => {
    const r = turnBleed(200, 0, -1, 0); // sharpest
    expect(r).toBeLessThan(1);
    expect(r).toBeGreaterThanOrEqual(0.85); // floor
    expect(1 - r).toBeLessThan(0.16); // only a few percent
  });

  it('returns neutral when barely moving or no desired heading', () => {
    expect(turnSharpness(0, 0, 1, 0)).toBe(0);
    expect(turnBleed(200, 0, 0, 0)).toBe(1);
  });

  it('is deterministic for identical inputs', () => {
    expect(turnBleed(150, 40, -1, 0.2)).toBe(turnBleed(150, 40, -1, 0.2));
  });
});

describe('resolveBump (#130)', () => {
  const CAP = 300;

  it('a fast body into a stationary one slows the runner and knocks the target along the normal', () => {
    const r = resolveBump(200, 0, 0, 0, 1, 0, 0.4, CAP);
    expect(r.ax).toBeCloseTo(120, 5); // runner slows (200 - 80)
    expect(r.bx).toBeCloseTo(80, 5); // target knocked (+80)
    expect(r.ay).toBe(0);
    expect(r.by).toBe(0);
  });

  it('conserves momentum along the normal (equal mass: a loses what b gains)', () => {
    const r = resolveBump(200, 0, 0, 0, 1, 0, 0.4, CAP);
    expect(r.ax + r.bx).toBeCloseTo(200, 5); // total normal momentum unchanged
  });

  it('a head-on equal-and-opposite pair returns mirrored, damped velocities', () => {
    const r = resolveBump(200, 0, -200, 0, 1, 0, 0.4, CAP);
    expect(r.ax).toBeCloseTo(40, 5); // 200 - 160
    expect(r.bx).toBeCloseTo(-40, 5); // mirror
  });

  it('a near-tangential / separating contact transfers nothing', () => {
    const tangential = resolveBump(200, 0, 0, 0, 0, 1, 0.4, CAP); // velocity ⟂ normal
    expect(tangential.ax).toBe(200);
    expect(tangential.bx).toBe(0);
    const separating = resolveBump(-100, 0, 100, 0, 1, 0, 0.4, CAP); // moving apart
    expect(separating.ax).toBe(-100);
    expect(separating.bx).toBe(100);
  });

  it('never returns a speed above the cap', () => {
    const r = resolveBump(900, 200, -50, 0, 1, 0, 0.9, CAP);
    expect(Math.hypot(r.ax, r.ay)).toBeLessThanOrEqual(CAP + 1e-6);
    expect(Math.hypot(r.bx, r.by)).toBeLessThanOrEqual(CAP + 1e-6);
  });

  it('a repeated pile-up contact converges (closing speed shrinks, never explodes)', () => {
    let avx = 250;
    let bvx = 0;
    const out: BumpResult = { ax: 0, ay: 0, bx: 0, by: 0 };
    let prevClosing = avx - bvx;
    for (let i = 0; i < 20; i++) {
      resolveBump(avx, 0, bvx, 0, 1, 0, 0.4, CAP, out);
      avx = out.ax;
      bvx = out.bx;
      const closing = avx - bvx;
      expect(closing).toBeLessThanOrEqual(prevClosing + 1e-6); // monotonically settling
      prevClosing = closing;
    }
    expect(prevClosing).toBeGreaterThanOrEqual(0); // never reverses into an explosion
  });

  it('writes into the supplied scratch object (no allocation)', () => {
    const out: BumpResult = { ax: 0, ay: 0, bx: 0, by: 0 };
    const r = resolveBump(200, 0, 0, 0, 1, 0, 0.4, CAP, out);
    expect(r).toBe(out);
  });
});

describe('postBounce (#135)', () => {
  // post at (100, 100); ball radius + post radius hit distance = 14
  it('reflects a ball driven into a post back the way it came', () => {
    const r = postBounce(90, 100, 300, 0, 100, 100, 14, 0.6); // ball left of post, moving +x toward it
    expect(r).not.toBeNull();
    expect(r!.vx).toBeLessThan(0); // bounced back -x
  });

  it('returns null when the ball is out of post range (a clean ball through the mouth)', () => {
    expect(postBounce(100, 140, 0, 300, 100, 100, 14, 0.6)).toBeNull(); // 40px away
  });

  it('returns null when the ball is already moving away from the post', () => {
    expect(postBounce(90, 100, -300, 0, 100, 100, 14, 0.6)).toBeNull();
  });

  it('a glancing hit on the inside of a post deflects rather than passing through', () => {
    const r = postBounce(100, 92, 50, 250, 100, 100, 14, 0.6); // just above the post, driving down
    expect(r).not.toBeNull();
    expect(r!.vy).toBeLessThan(250); // vertical component reflected/reduced
  });

  it('is deterministic for identical inputs', () => {
    const a = postBounce(90, 100, 300, 10, 100, 100, 14, 0.6);
    const b = postBounce(90, 100, 300, 10, 100, 100, 14, 0.6);
    expect(a).toEqual(b);
  });
});

describe('rippleAmplitude (#135)', () => {
  it('is maximal at the crossing and settles to 0 by the settle time', () => {
    expect(rippleAmplitude(0)).toBeGreaterThan(0);
    expect(rippleAmplitude(0.5)).toBe(0);
    expect(rippleAmplitude(0.6)).toBe(0); // stays settled
  });

  it('decays monotonically (no net motion grows back)', () => {
    let prev = Infinity;
    for (let i = 0; i <= 10; i++) {
      const a = rippleAmplitude((i / 10) * 0.5);
      expect(a).toBeLessThanOrEqual(prev);
      prev = a;
    }
  });

  it('is 0 for a negative age', () => {
    expect(rippleAmplitude(-1)).toBe(0);
  });
});

describe('loftLaunch (#132)', () => {
  it('returns a positive vz and a hang time clamped to a readable arc', () => {
    const l = loftLaunch(300, 500);
    expect(l.vz).toBeGreaterThan(0);
    expect(l.hangTime).toBeGreaterThanOrEqual(0.45);
    expect(l.hangTime).toBeLessThanOrEqual(1.1);
  });

  it('the integrated height returns to ~0 right around the predicted hang time', () => {
    const l = loftLaunch(400, 500);
    let z = 0;
    let vz = l.vz;
    const dt = 1 / 60;
    let landed = -1;
    for (let i = 0; i < 200; i++) {
      z += vz * dt;
      vz -= LOFT_GRAVITY * dt;
      if (z <= 0 && i > 0) {
        landed = (i + 1) * dt;
        break;
      }
    }
    expect(landed).toBeGreaterThan(0);
    expect(Math.abs(landed - l.hangTime)).toBeLessThan(0.05); // lands ~ at hang time
  });

  it('peak height is positive and bounded', () => {
    const l = loftLaunch(600, 400);
    const peak = (l.vz * l.vz) / (2 * LOFT_GRAVITY);
    expect(peak).toBeGreaterThan(5);
    expect(peak).toBeLessThan(200);
  });

  it('is deterministic for identical inputs', () => {
    expect(loftLaunch(250, 480)).toEqual(loftLaunch(250, 480));
  });
});

describe('segmentBlocked (#132)', () => {
  it('detects a defender sitting in the middle of the passing lane', () => {
    expect(segmentBlocked(0, 0, 200, 0, 100, 5, 15)).toBe(true); // on the line, mid
  });

  it('ignores a player off to the side of the lane', () => {
    expect(segmentBlocked(0, 0, 200, 0, 100, 60, 15)).toBe(false);
  });

  it('ignores a player at the carrier or at the target (not between)', () => {
    expect(segmentBlocked(0, 0, 200, 0, 2, 0, 15)).toBe(false); // at the carrier
    expect(segmentBlocked(0, 0, 200, 0, 199, 0, 15)).toBe(false); // at the target
  });

  it('handles a degenerate (zero-length) lane', () => {
    expect(segmentBlocked(50, 50, 50, 50, 50, 50, 15)).toBe(false);
  });
});

describe('shotRelease (sweet window)', () => {
  it('a release inside the window is sweet and snaps to max power', () => {
    const r = shotRelease(0.85);
    expect(r.sweet).toBe(true);
    expect(r.power01).toBe(1);
  });

  it('the window boundaries are inclusive', () => {
    expect(shotRelease(SHOT_SWEET_START).sweet).toBe(true);
    expect(shotRelease(SHOT_SWEET_END).sweet).toBe(true);
  });

  it('a release just below or above the window is flat (power == charge)', () => {
    const lo = shotRelease(SHOT_SWEET_START - 0.01);
    expect(lo.sweet).toBe(false);
    expect(lo.power01).toBeCloseTo(SHOT_SWEET_START - 0.01, 6);
    const hi = shotRelease(SHOT_SWEET_END + 0.01);
    expect(hi.sweet).toBe(false);
    expect(hi.power01).toBeCloseTo(SHOT_SWEET_END + 0.01, 6);
  });

  it('clamps an out-of-range charge', () => {
    expect(shotRelease(-1).power01).toBe(0);
    expect(shotRelease(2).power01).toBe(1);
    expect(shotRelease(2).sweet).toBe(false); // 1.0 is past the window
  });
});

describe('curveAccel', () => {
  it('scales lightly with power and stays positive', () => {
    expect(curveAccel(0)).toBeCloseTo(CURVE_ACCEL * 0.7, 5);
    expect(curveAccel(1)).toBe(CURVE_ACCEL);
    expect(curveAccel(0.5)).toBeGreaterThan(curveAccel(0));
  });
});

describe('stepCurve (in-flight bend)', () => {
  // integrate a launch + curve over N fixed steps; return the lateral landing offset
  function landingY(curve: number, steps = 60): number {
    let vx = 500;
    let vy = 0;
    let y = 0;
    let c = curve;
    const dt = 1 / 60;
    const out: CurveState = { vx: 0, vy: 0, curve: 0 };
    for (let i = 0; i < steps; i++) {
      y += vy * dt;
      stepCurve(vx, vy, c, dt, out);
      vx = out.vx;
      vy = out.vy;
      c = out.curve;
    }
    return y;
  }

  it('a positive curve bends one way and a negative curve the other', () => {
    expect(landingY(900)).toBeGreaterThan(5);
    expect(landingY(-900)).toBeLessThan(-5);
  });

  it('zero curve flies straight', () => {
    expect(landingY(0)).toBe(0);
  });

  it('the bend is bounded — it converges (the curve decays), not a runaway spiral', () => {
    // no-drag integration over a full second; in-game drag shortens flight further
    expect(Math.abs(landingY(900))).toBeLessThan(400);
  });

  it('the curve decays toward straight over time', () => {
    const out: CurveState = { vx: 0, vy: 0, curve: 0 };
    let c = 900;
    for (let i = 0; i < 600; i++) {
      stepCurve(500, 0, c, 1 / 60, out);
      c = out.curve;
    }
    expect(c).toBe(0); // settled
  });

  it('is deterministic for a fixed launch + curve value (same path every run)', () => {
    expect(landingY(720)).toBe(landingY(720));
  });

  it('writes into the supplied scratch object (no allocation)', () => {
    const out: CurveState = { vx: 0, vy: 0, curve: 0 };
    const r = stepCurve(500, 0, 900, 1 / 60, out);
    expect(r).toBe(out);
  });
});

describe('squashStretch (#131 the single figure scale channel)', () => {
  const out: Squash = { sx: 1, sy: 1 };

  it('is neutral (1,1) at zero accel and zero kick', () => {
    const r = squashStretch(0, 0, out);
    expect(r.sx).toBe(1);
    expect(r.sy).toBe(1);
  });

  it('stays neutral inside the cruise deadzone (small accel ⇒ no pop)', () => {
    const r = squashStretch(ACCEL_DEADZONE - 1, 0, out);
    expect(r.sx).toBe(1);
    expect(r.sy).toBe(1);
  });

  it('stretches along facing (sx>1, sy<1) on a burst', () => {
    const r = squashStretch(1400, 0, out);
    expect(r.sx).toBeGreaterThan(1);
    expect(r.sy).toBeLessThan(1);
  });

  it('squashes (sx<1, sy>1) on a hard plant-stop', () => {
    const r = squashStretch(-2200, 0, out);
    expect(r.sx).toBeLessThan(1);
    expect(r.sy).toBeGreaterThan(1);
  });

  it('stretches forward on a kick impulse and scales with kick power', () => {
    const tap = squashStretch(0, 0.2, { sx: 1, sy: 1 });
    const screamer = squashStretch(0, 1, { sx: 1, sy: 1 });
    expect(tap.sx).toBeGreaterThan(1);
    expect(screamer.sx).toBeGreaterThan(tap.sx); // power-scaled
    expect(screamer.sy).toBeLessThan(1);
  });

  it('is symmetric about (1,1): +a and -a mirror around neutral', () => {
    const up = squashStretch(3000, 0, { sx: 1, sy: 1 });
    const dn = squashStretch(-3000, 0, { sx: 1, sy: 1 });
    expect(up.sx - 1).toBeCloseTo(-(dn.sx - 1), 6);
    expect(up.sy - 1).toBeCloseTo(-(dn.sy - 1), 6);
  });

  it('clamps within [SQUASH_MIN, SQUASH_MAX] for arbitrarily large inputs', () => {
    for (const [a, k] of [[1e9, 1e9], [-1e9, 0], [0, 1e9], [-1e9, 1e9]] as [number, number][]) {
      const r = squashStretch(a, k, out);
      expect(r.sx).toBeGreaterThanOrEqual(SQUASH_MIN);
      expect(r.sx).toBeLessThanOrEqual(SQUASH_MAX);
      expect(r.sy).toBeGreaterThanOrEqual(SQUASH_MIN);
      expect(r.sy).toBeLessThanOrEqual(SQUASH_MAX);
    }
  });

  it('composed with depthScale [0.88,1.12] never inverts/balloons the silhouette', () => {
    const r = squashStretch(1e9, 1e9, out); // max stretch
    for (const ds of [0.88, 1.0, 1.12]) {
      expect(r.sx * ds).toBeGreaterThan(0.5); // never inverted/collapsed
      expect(r.sx * ds).toBeLessThan(1.4); // never ballooned
      expect(r.sy * ds).toBeGreaterThan(0.5);
      expect(r.sy * ds).toBeLessThan(1.4);
    }
  });

  it('returns the out object (allocation-free) and guards non-finite input', () => {
    const r = squashStretch(NaN, NaN, out);
    expect(r).toBe(out);
    expect(r.sx).toBe(1);
    expect(r.sy).toBe(1);
  });

  it('isHardStop classifies a large per-step decel as an impact, small ones as none', () => {
    expect(isHardStop(-2200)).toBe(true);
    expect(isHardStop(-100)).toBe(false);
    expect(isHardStop(2200)).toBe(false); // accel, not a stop
    expect(isHardStop(NaN)).toBe(false);
  });
});

describe('carryStreakAlpha (#136 knock-on readability)', () => {
  it('is 0 for a tight close-control touch (exposure at/under the cue)', () => {
    expect(carryStreakAlpha(0, true)).toBe(0);
    expect(carryStreakAlpha(0.3, true)).toBe(0); // exactly at the default cue
    expect(carryStreakAlpha(0.267, true)).toBe(0); // observed jog distance — no streak
  });

  it('is 0 when the carrier is not sprinting, regardless of exposure', () => {
    expect(carryStreakAlpha(0.9, false)).toBe(0);
  });

  it('scales with exposure above the cue and is monotonic', () => {
    const a = carryStreakAlpha(0.4, true);
    const b = carryStreakAlpha(0.7, true);
    const c = carryStreakAlpha(1, true);
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
  });

  it('clamps to 1 for an over-exposed input and guards non-finite', () => {
    expect(carryStreakAlpha(5, true)).toBe(1);
    expect(carryStreakAlpha(NaN, true)).toBe(0);
  });

  it('a full sprint-touch (ballExposure at sprint carry distance) streaks', () => {
    expect(carryStreakAlpha(ballExposure(52), true)).toBeGreaterThan(0); // 52px ≈ full sprint knock
  });
});
