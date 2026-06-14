import { describe, it, expect } from 'vitest';
import { cameraTarget, followStep, baseZoom, framingFits, zoomPunchStep, type Vec2, type Bounds } from './camera';

const BOUNDS: Bounds = { x: 0, y: 0, w: 1280, h: 720 };

describe('cameraTarget', () => {
  it('leads ahead of a home carrier (attackDir +1)', () => {
    const t = cameraTarget(0, 0, 500, 300, true, 1, 90);
    expect(t.x).toBe(590);
    expect(t.y).toBe(300);
  });

  it('leads ahead of an away carrier (attackDir -1)', () => {
    const t = cameraTarget(0, 0, 500, 300, true, -1, 90);
    expect(t.x).toBe(410);
    expect(t.y).toBe(300);
  });

  it('frames the loose ball dead-on with no lead', () => {
    const t = cameraTarget(700, 250, 999, 999, false, 1, 90);
    expect(t.x).toBe(700);
    expect(t.y).toBe(250);
  });

  it('a zero lead frames the carrier exactly (reduce-motion path)', () => {
    const t = cameraTarget(0, 0, 500, 300, true, 1, 0);
    expect(t.x).toBe(500);
  });

  it('writes into the supplied scratch object (no allocation)', () => {
    const out: Vec2 = { x: 0, y: 0 };
    const r = cameraTarget(0, 0, 500, 300, true, 1, 90, out);
    expect(r).toBe(out); // same reference returned
  });
});

describe('followStep', () => {
  const viewW = 800;
  const viewH = 450;

  it('moves the scroll toward (but not past) the centred target by the lerp fraction', () => {
    // target centre 640 -> desired scrollX = 640 - 400 = 240; from 0 at lerp 0.5 -> 120
    const r = followStep(0, 0, 640, 360, 0.5, viewW, viewH, BOUNDS);
    expect(r.x).toBeCloseTo(120, 5);
    expect(r.y).toBeCloseTo((360 - viewH / 2) * 0.5, 5);
  });

  it('lerp = 0 holds the current scroll (steady reduce-motion framing)', () => {
    const r = followStep(173, 88, 640, 360, 0, viewW, viewH, BOUNDS);
    expect(r.x).toBe(173);
    expect(r.y).toBe(88);
  });

  it('lerp = 1 snaps exactly onto the clamped desired scroll', () => {
    const r = followStep(0, 0, 640, 360, 1, viewW, viewH, BOUNDS);
    expect(r.x).toBeCloseTo(240, 5);
    expect(r.y).toBeCloseTo(135, 5);
  });

  it('clamps to the left/top edge — never reveals void beyond the world', () => {
    const r = followStep(0, 0, 0, 0, 1, viewW, viewH, BOUNDS);
    expect(r.x).toBe(0);
    expect(r.y).toBe(0);
  });

  it('clamps to the right/bottom edge', () => {
    const r = followStep(0, 0, 5000, 5000, 1, viewW, viewH, BOUNDS);
    expect(r.x).toBe(BOUNDS.w - viewW); // 480
    expect(r.y).toBe(BOUNDS.h - viewH); // 270
  });

  it('approaches monotonically and never overshoots over repeated steps', () => {
    let x = 0;
    const targetScroll = 640 - viewW / 2; // 240
    let prev = -1;
    for (let i = 0; i < 200; i++) {
      const r = followStep(x, 0, 640, 360, 0.12, viewW, viewH, BOUNDS);
      x = r.x;
      expect(x).toBeGreaterThanOrEqual(prev); // monotonic toward target
      expect(x).toBeLessThanOrEqual(targetScroll + 1e-6); // never overshoots
      prev = x;
    }
    expect(x).toBeCloseTo(targetScroll, 3); // converges
  });

  it('centres an axis when the view is larger than the world (no scroll jitter)', () => {
    const wide: Bounds = { x: 0, y: 0, w: 600, h: 720 };
    const r = followStep(0, 0, 300, 360, 1, viewW, viewH, wide);
    expect(r.x).toBe((600 - viewW) / 2); // -100: world centred in the view
  });

  it('writes into the supplied scratch object (no allocation)', () => {
    const out: Vec2 = { x: 0, y: 0 };
    const r = followStep(0, 0, 640, 360, 0.12, viewW, viewH, BOUNDS, out);
    expect(r).toBe(out);
  });

  it('recovers from a non-finite current scroll instead of propagating NaN', () => {
    const r = followStep(NaN, NaN, 640, 360, 0.5, viewW, viewH, BOUNDS);
    expect(Number.isFinite(r.x)).toBe(true);
    expect(Number.isFinite(r.y)).toBe(true);
  });
});

describe('baseZoom', () => {
  it('maps each level to a distinct, increasing resting zoom', () => {
    expect(baseZoom('wide')).toBe(1.0);
    expect(baseZoom('balanced')).toBe(2.0);
    expect(baseZoom('tight')).toBe(2.4);
    expect(baseZoom('wide')).toBeLessThan(baseZoom('balanced'));
    expect(baseZoom('balanced')).toBeLessThan(baseZoom('tight'));
  });

  it('balanced (the default) frames roughly the GDD ~55% of the 1152px pitch length', () => {
    const visibleWidth = 1280 / baseZoom('balanced');
    expect(visibleWidth / 1152).toBeGreaterThan(0.5);
    expect(visibleWidth / 1152).toBeLessThan(0.62);
  });

  it('wide shows the full pitch and tight is closer than balanced', () => {
    expect(1280 / baseZoom('wide')).toBeGreaterThan(1152); // full pitch width in frame
    expect(1280 / baseZoom('tight')).toBeLessThan(1280 / baseZoom('balanced')); // tighter
  });
});

describe('framingFits (the CI safety gate)', () => {
  const LEAD = 90; // CAM_LEAD from MatchScene

  it('every zoom level keeps the ball + nearest goal mouth in frame at max lead', () => {
    for (const level of ['wide', 'balanced', 'tight'] as const) {
      expect(framingFits(baseZoom(level), LEAD)).toBe(true);
    }
  });

  it('even a punched (1.18x) tight zoom still fits', () => {
    expect(framingFits(baseZoom('tight') * 1.18, LEAD)).toBe(true);
  });

  it('rejects an absurdly tight zoom that would push the goal mouth out of frame', () => {
    expect(framingFits(4.0, LEAD)).toBe(false); // half-width 160 < 90+9+84
  });

  it('rejects a non-positive zoom', () => {
    expect(framingFits(0, LEAD)).toBe(false);
  });
});

describe('zoomPunchStep', () => {
  it('decays a punch monotonically back to base', () => {
    const base = 1.5;
    let z = base * 1.18; // punched
    let prev = z;
    for (let i = 0; i < 120; i++) {
      z = zoomPunchStep(z, base, 0.016);
      expect(z).toBeLessThanOrEqual(prev + 1e-9); // monotonic down
      expect(z).toBeGreaterThanOrEqual(base - 1e-9);
      prev = z;
    }
    expect(z).toBe(base); // snaps exactly to base eventually
  });

  it('is frame-rate independent (one 16ms step == two 8ms steps)', () => {
    const base = 1.5;
    const start = base * 1.18;
    const oneStep = zoomPunchStep(start, base, 0.016);
    const twoSteps = zoomPunchStep(zoomPunchStep(start, base, 0.008), base, 0.008);
    expect(twoSteps).toBeCloseTo(oneStep, 9);
  });

  it('holds when dt is non-positive and recovers from non-finite', () => {
    expect(zoomPunchStep(1.7, 1.5, 0)).toBe(1.7);
    expect(zoomPunchStep(NaN, 1.5, 0.016)).toBe(1.5);
  });
});
