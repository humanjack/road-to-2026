import { describe, it, expect } from 'vitest';
import {
  gaitPose,
  kickPose,
  passPose,
  receivePose,
  selectPose,
  chooseCelebrant,
  depthScale,
  gaitAdvance,
  accelLean,
  turnPlant,
  DEPTH_NEAR,
  DEPTH_FAR,
} from './poses';

describe('gaitPose (#anim run cycle)', () => {
  it('is perfectly still at gait 0 (a standing player does not animate)', () => {
    const p = gaitPose(1.234, 0);
    for (const v of [p.backLegX, p.frontLegX, p.backFootLift, p.frontFootLift, p.backKnee, p.frontKnee, p.bob, p.armX]) {
      expect(v).toBeCloseTo(0, 12); // (±0 — a standing player has no swing)
    }
  });

  it('strides the legs contralaterally and swings the arms opposite the legs', () => {
    const p = gaitPose(Math.PI / 2, 1); // sin = +1
    expect(p.backLegX).toBeCloseTo(-p.frontLegX, 10); // legs mirror
    expect(p.backLegX).toBeGreaterThan(0); // back foot forward at this phase
    expect(Math.sign(p.armX)).toBe(-Math.sign(p.backLegX)); // arms counter the legs
  });

  it('only the recovering (forward-swinging) leg lifts + bends; foot lifts are never negative', () => {
    const p = gaitPose(Math.PI / 2, 1); // back leg forward
    expect(p.backFootLift).toBeGreaterThan(0);
    expect(p.frontFootLift).toBe(0);
    expect(p.backKnee).toBeGreaterThan(0);
    for (let i = 0; i <= 24; i++) {
      const q = gaitPose((i / 24) * Math.PI * 2, 1);
      expect(q.backFootLift).toBeGreaterThanOrEqual(0);
      expect(q.frontFootLift).toBeGreaterThanOrEqual(0);
      expect(q.bob).toBeGreaterThanOrEqual(0); // the body never bobs below the stance line
    }
  });

  it('the bob completes two bounces per stride (one per footfall) and survives non-finite input', () => {
    expect(gaitPose(0, 1).bob).toBeCloseTo(0, 6); // footplant
    expect(gaitPose(Math.PI / 2, 1).bob).toBeGreaterThan(0); // mid-swing
    expect(gaitPose(Math.PI, 1).bob).toBeCloseTo(0, 6); // next footplant
    const nan = gaitPose(NaN, NaN);
    for (const v of [nan.backLegX, nan.bob, nan.armX]) expect(Number.isFinite(v)).toBe(true);
  });
});

describe('kickPose (#anim wind-up → strike → follow-through)', () => {
  it('winds the striking leg BACK before the strike', () => {
    expect(kickPose(0).legX).toBeCloseTo(0, 6); // neutral at the start
    expect(kickPose(0.3).legX).toBeLessThan(0); // wound back at the end of the wind-up
  });

  it('sweeps monotonically forward from the wind-up to a high follow-through', () => {
    let prev = -Infinity;
    for (let i = 3; i <= 10; i++) {
      const p = kickPose(i / 10); // strike + follow-through window
      expect(p.legX).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = p.legX;
    }
    expect(kickPose(1).legX).toBeGreaterThan(0.5); // extended forward at the end
    expect(kickPose(1).lean).toBeGreaterThan(0); // leans into the follow-through
    expect(kickPose(1).legLift).toBeGreaterThan(0); // foot finishes raised
  });

  it('the contact spike peaks mid-strike and is zero at the extremes', () => {
    expect(kickPose(0).contact).toBeCloseTo(0, 6);
    expect(kickPose(1).contact).toBeCloseTo(0, 6);
    expect(kickPose(0.45).contact).toBeGreaterThan(0.9); // contact ≈ the ball line
  });

  it('all outputs finite for non-finite progress', () => {
    const p = kickPose(NaN);
    for (const v of [p.legX, p.legLift, p.plantKnee, p.lean, p.armX, p.contact]) expect(Number.isFinite(v)).toBe(true);
  });
});

describe('receivePose (#anim first-touch cushion)', () => {
  it('dips + reaches at the touch and settles to neutral', () => {
    const touch = receivePose(0);
    expect(touch.crouch).toBeLessThan(1); // dipped to cushion
    expect(touch.reach).toBeGreaterThan(0); // lead foot reaches to the ball
    expect(touch.lean).toBeLessThan(0); // leans back a touch to absorb
    const settled = receivePose(1);
    expect(settled.crouch).toBeCloseTo(1, 6);
    expect(settled.reach).toBeCloseTo(0, 6);
    expect(settled.lean).toBeCloseTo(0, 6);
  });
});

describe('selectPose priority', () => {
  it('celebrate beats everything', () => {
    expect(selectPose(0.2, 0.2, 0.2, 0.2, 0.5, 0.2).action).toBe('celebrate');
  });
  it('dive beats slide/kick', () => {
    expect(selectPose(0.2, 0.3, 0.2, 0.2, 0).action).toBe('dive');
  });
  it('an active slide beats recover/kick', () => {
    expect(selectPose(0.2, 0, 0.3, 0.2, 0).action).toBe('slide');
  });
  it('recover (grounded after a whiffed slide) is its own action and beats kick', () => {
    expect(selectPose(0.2, 0, 0, 0.4, 0).action).toBe('recover');
  });
  it('kick beats receive and run', () => {
    expect(selectPose(0.2, 0, 0, 0, 0, 0.2).action).toBe('kick');
  });
  it('kick (a shot) beats pass; pass beats receive', () => {
    expect(selectPose(0.2, 0, 0, 0, 0, 0, 0.2).action).toBe('kick'); // kickT + passT → kick
    expect(selectPose(0, 0, 0, 0, 0, 0.2, 0.2).action).toBe('pass'); // passT + receiveT → pass
  });
  it('receive beats run', () => {
    expect(selectPose(0, 0, 0, 0, 0, 0.2).action).toBe('receive');
  });
  it('falls back to run when idle, and timed progress advances 0→1', () => {
    expect(selectPose(0, 0, 0, 0, 0).action).toBe('run');
    expect(selectPose(0.28, 0, 0, 0, 0).t).toBeCloseTo(0, 5); // full countdown → start
    expect(selectPose(0.001, 0, 0, 0, 0).t).toBeGreaterThan(0.9); // nearly drained → end
  });
});

describe('chooseCelebrant', () => {
  const players = [
    { side: 'home', role: 'GK' },
    { side: 'home', role: 'FWD' },
    { side: 'away', role: 'FWD' },
    { side: 'away', role: 'GK' },
  ];
  const xs = [60, 800, 400, 1200];

  it('returns the scorer when they are a scoring-side outfielder', () => {
    expect(chooseCelebrant('home', 1, players, 1216, xs)).toBe(1);
  });

  it('falls back to a scoring-side outfielder when the scorer is on the conceding side', () => {
    const idx = chooseCelebrant('home', 2, players, 1216, xs); // 2 is away → fallback
    expect(players[idx].side).toBe('home');
    expect(players[idx].role).not.toBe('GK');
  });

  it('never returns a conceding-side index (own goal credited to the kicker)', () => {
    const idx = chooseCelebrant('away', 1, players, 64, xs); // 1 is home → fallback to away outfield
    expect(idx).toBe(2);
  });
});

describe('depthScale (#128 scale-for-depth)', () => {
  const py = 80;
  const ph = 560; // pitch spans y ∈ [80, 640]

  it('is DEPTH_FAR at the far (top) touchline and DEPTH_NEAR at the near (bottom) one', () => {
    expect(depthScale(py, py, ph)).toBeCloseTo(DEPTH_FAR, 6);
    expect(depthScale(py + ph, py, ph)).toBeCloseTo(DEPTH_NEAR, 6);
  });

  it('is exactly 1 at the midline (no scaling at centre)', () => {
    expect(depthScale(py + ph / 2, py, ph)).toBeCloseTo((DEPTH_FAR + DEPTH_NEAR) / 2, 6);
    expect((DEPTH_FAR + DEPTH_NEAR) / 2).toBeCloseTo(1, 6); // band is symmetric about 1
  });

  it('increases monotonically with y (nearer ⇒ larger)', () => {
    let prev = -Infinity;
    for (let y = py - 50; y <= py + ph + 50; y += 20) {
      const f = depthScale(y, py, ph);
      expect(f).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = f;
    }
  });

  it('stays clamped within [DEPTH_FAR, DEPTH_NEAR] even well off the pitch', () => {
    for (const y of [-1000, -1, py - 200, py + ph + 200, 99999]) {
      const f = depthScale(y, py, ph);
      expect(f).toBeGreaterThanOrEqual(DEPTH_FAR);
      expect(f).toBeLessThanOrEqual(DEPTH_NEAR);
    }
  });

  it('the band never inverts/balloons when composed with the squash-stretch band [0.85,1.18]', () => {
    for (const y of [py, py + ph / 2, py + ph]) {
      const f = depthScale(y, py, ph);
      expect(f * 0.85).toBeGreaterThan(0); // never negative/zero (no inversion)
      expect(f * 1.18).toBeLessThan(1.4); // bounded combined scale
    }
  });

  it('falls back to 1 for non-finite or degenerate input (allocation-free guard)', () => {
    expect(depthScale(NaN, py, ph)).toBe(1);
    expect(depthScale(py, py, 0)).toBe(1);
    expect(depthScale(py, py, -10)).toBe(1);
    expect(depthScale(Infinity, py, ph)).toBe(1);
  });
});

describe('passPose (#185 clipped strike)', () => {
  it('winds the leg back early, then sweeps forward to a follow-through', () => {
    expect(passPose(0.15).legX).toBeLessThan(0); // wind-up
    expect(passPose(1).legX).toBeGreaterThan(0.4); // follow-through forward
  });

  it('is lower-amplitude than a full shot kick at every comparable phase', () => {
    for (const t of [0.2, 0.5, 0.8, 1]) {
      expect(Math.abs(passPose(t).legX)).toBeLessThanOrEqual(Math.abs(kickPose(t).legX) + 1e-9);
      expect(passPose(t).legLift).toBeLessThanOrEqual(kickPose(t).legLift + 1e-9);
      expect(passPose(t).lean).toBeLessThanOrEqual(kickPose(t).lean + 1e-9);
    }
    expect(passPose(1).legX).toBeLessThan(kickPose(1).legX); // strictly smaller follow-through
  });

  it('has a contact spike mid-strike', () => {
    expect(passPose(0.42).contact).toBeGreaterThan(0.9);
    expect(passPose(0).contact).toBeCloseTo(0, 6);
  });
});

describe('gaitAdvance (#185 displacement-driven anti-skate cadence)', () => {
  it('advances proportionally to distance travelled (speed·dt)', () => {
    expect(gaitAdvance(200, 1 / 60)).toBeCloseTo(200 * (1 / 60) * 0.18, 6);
    expect(gaitAdvance(400, 1 / 60)).toBeCloseTo(2 * gaitAdvance(200, 1 / 60), 6); // 2× speed ⇒ 2× phase
  });
  it('is zero when stationary or stopped (no skate / no drift)', () => {
    expect(gaitAdvance(0, 1 / 60)).toBe(0);
    expect(gaitAdvance(200, 0)).toBe(0);
  });
  it('a ball carrier strides choppier (higher cadence)', () => {
    expect(gaitAdvance(200, 1 / 60, 1, true)).toBeGreaterThan(gaitAdvance(200, 1 / 60, 1, false));
  });
  it('scales with the surge cadence multiplier', () => {
    expect(gaitAdvance(200, 1 / 60, 1.5)).toBeCloseTo(1.5 * gaitAdvance(200, 1 / 60, 1), 6);
  });
});

describe('accelLean (#185 fore/aft weight)', () => {
  it('leans forward on acceleration, back on a brake, neutral at cruise', () => {
    expect(accelLean(1600)).toBeGreaterThan(0);
    expect(accelLean(-1600)).toBeLessThan(0);
    expect(accelLean(0)).toBe(0);
  });
  it('clamps to ±amp for extreme accel', () => {
    expect(accelLean(99999, 1600, 0.22)).toBeCloseTo(0.22, 6);
    expect(accelLean(-99999, 1600, 0.22)).toBeCloseTo(-0.22, 6);
  });
  it('is finite-safe', () => {
    expect(accelLean(NaN)).toBe(0);
    expect(accelLean(500, 0)).toBe(0);
  });
});

describe('turnPlant (#185 cut/pivot tell)', () => {
  it('is zero running straight (facing aligned with travel)', () => {
    expect(turnPlant(200, 0, 1, 0)).toBeCloseTo(0, 6);
  });
  it('is zero when moving slowly (no plant at a walk)', () => {
    expect(turnPlant(20, 0, 0, 1)).toBe(0);
  });
  it('fires on a hard cut (facing diverges from fast travel)', () => {
    const reverse = turnPlant(260, 0, -1, 0); // sprinting +x but steering back −x
    const square = turnPlant(260, 0, 0, 1); // sprinting +x but steering ⟂
    expect(reverse).toBeGreaterThan(0.5);
    expect(square).toBeGreaterThan(0);
    expect(reverse).toBeGreaterThan(square); // a sharper divergence plants harder
  });
  it('returns a normalised 0..1 intensity', () => {
    for (const [vx, vy, fx, fy] of [[300, 0, -1, 0], [200, 100, -1, -1], [100, 0, 0, 1]] as const) {
      const v = turnPlant(vx, vy, fx, fy);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
