import { describe, it, expect } from 'vitest';
import { limbPose, selectPose, chooseCelebrant, depthScale, DEPTH_NEAR, DEPTH_FAR } from './poses';

const PR = 15;

describe("limbPose('run') is pixel-identical to the original inline swing", () => {
  it('matches sin(t*2 + phase) * 0.5 * gait * PR for sampled inputs', () => {
    const samples: [number, number, number][] = [
      [0, 1, 0],
      [1.3, 0.5, 1.7],
      [10, 0.8, 3.4],
      [123.4, 0.2, 0.9],
    ];
    for (const [t, gait, phase] of samples) {
      const sw = Math.sin(t * 2 + phase) * 0.5 * gait * PR;
      const p = limbPose('run', t, gait, phase, PR);
      expect(p.farLeg).toBeCloseTo(sw, 10);
      expect(p.nearLeg).toBeCloseTo(-sw, 10);
      expect(p.farArm).toBeCloseTo(-sw, 10); // contralateral
      expect(p.nearArm).toBeCloseTo(sw, 10);
      expect(p.lean).toBe(0);
      expect(p.crouch).toBe(1);
    }
  });

  it('writes into the supplied scratch object (no allocation)', () => {
    const out = { farLeg: 0, nearLeg: 0, farArm: 0, nearArm: 0, lean: 0, crouch: 1 };
    const r = limbPose('run', 1, 1, 0, PR, out);
    expect(r).toBe(out);
  });
});

describe('limbPose action poses', () => {
  it('kick monotonically extends the striking leg from back to forward across t01', () => {
    let prev = -Infinity;
    for (let i = 0; i <= 10; i++) {
      const p = limbPose('kick', i / 10, 1, 0, PR);
      expect(p.farLeg).toBeGreaterThan(prev);
      prev = p.farLeg;
    }
    expect(limbPose('kick', 0, 1, 0, PR).farLeg).toBeLessThan(0); // wound back at the start
    expect(limbPose('kick', 1, 1, 0, PR).farLeg).toBeGreaterThan(0.5 * PR); // extended at contact
    expect(limbPose('kick', 1, 1, 0, PR).lean).toBeGreaterThan(0); // leans into the follow-through
  });

  it('slide throws both legs forward, low (crouched) and leaning', () => {
    const p = limbPose('slide', 0, 1, 0, PR);
    expect(p.farLeg).toBeGreaterThan(0);
    expect(p.nearLeg).toBeGreaterThan(0);
    expect(p.crouch).toBeLessThan(1);
    expect(p.lean).toBeGreaterThan(0);
  });

  it('dive throws both arms forward (the keeper reach)', () => {
    const p = limbPose('dive', 1, 0, 0, PR);
    expect(p.farArm).toBeGreaterThan(0.5 * PR);
    expect(p.nearArm).toBeGreaterThan(0.5 * PR);
  });

  it('celebrate raises both arms', () => {
    const p = limbPose('celebrate', 0, 0, 0, PR);
    expect(p.farArm).toBeGreaterThan(0.5 * PR);
    expect(p.nearArm).toBeGreaterThan(0.5 * PR);
  });

  it('all outputs are finite for guarded inputs', () => {
    for (const a of ['run', 'kick', 'slide', 'dive', 'celebrate'] as const) {
      const p = limbPose(a, NaN, NaN, NaN, PR);
      for (const v of [p.farLeg, p.nearLeg, p.farArm, p.nearArm, p.lean, p.crouch]) {
        expect(Number.isFinite(v)).toBe(true);
      }
    }
  });
});

describe('selectPose priority', () => {
  it('celebrate beats everything', () => {
    expect(selectPose(0.2, 0.2, 0.2, 0.2, 0.5).action).toBe('celebrate');
  });
  it('dive beats slide/kick', () => {
    expect(selectPose(0.2, 0.3, 0.2, 0.2, 0).action).toBe('dive');
  });
  it('slide (slideT or recovery) beats kick', () => {
    expect(selectPose(0.2, 0, 0.3, 0, 0).action).toBe('slide');
    expect(selectPose(0.2, 0, 0, 0.4, 0).action).toBe('slide');
  });
  it('kick beats run', () => {
    expect(selectPose(0.2, 0, 0, 0, 0).action).toBe('kick');
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
