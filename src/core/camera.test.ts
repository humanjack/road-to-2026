import { describe, it, expect } from 'vitest';
import {
  cameraTarget,
  followStep,
  baseZoom,
  framingFits,
  zoomPunchStep,
  shakeIntensity,
  shakeDuration,
  parallaxShift,
  velocityLead,
  deadzone1d,
  viewFromDigit,
  viewZoomLevel,
  viewForZoomLevel,
  cameraViewConfig,
  fitZoom,
  tacticalBounds,
  VIEW_LABEL,
  type Vec2,
  type Bounds,
} from './camera';

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

describe('followStep (centre space)', () => {
  // followStep now returns the camera CENTRE (world point at screen centre); the
  // scene converts to a Phaser scroll with `scroll = centre - cameraSize/2`.
  const viewW = 800;
  const viewH = 450;
  // for BOUNDS (1280x720): centre x ∈ [400, 880], centre y ∈ [225, 495]

  it('moves the centre toward the target by the lerp fraction', () => {
    // target 640 (in range); from 400 at lerp 0.5 -> 520
    const r = followStep(400, 225, 640, 360, 0.5, viewW, viewH, BOUNDS);
    expect(r.x).toBeCloseTo(520, 5); // 400 + (640-400)*0.5
    expect(r.y).toBeCloseTo(292.5, 5); // 225 + (360-225)*0.5
  });

  it('lerp = 0 holds the current centre (steady reduce-motion framing)', () => {
    const r = followStep(500, 300, 640, 360, 0, viewW, viewH, BOUNDS);
    expect(r.x).toBe(500);
    expect(r.y).toBe(300);
  });

  it('lerp = 1 snaps exactly onto the clamped target centre', () => {
    const r = followStep(400, 225, 640, 360, 1, viewW, viewH, BOUNDS);
    expect(r.x).toBeCloseTo(640, 5);
    expect(r.y).toBeCloseTo(360, 5);
  });

  it('clamps the centre at the left/top edge — never reveals void beyond the world', () => {
    // a target at the world origin pulls the centre only to the half-view minimum
    const r = followStep(400, 225, 0, 0, 1, viewW, viewH, BOUNDS);
    expect(r.x).toBe(viewW / 2); // 400 — the view's left edge rests on bounds.x
    expect(r.y).toBe(viewH / 2); // 225
  });

  it('clamps the centre at the right/bottom edge', () => {
    const r = followStep(640, 360, 5000, 5000, 1, viewW, viewH, BOUNDS);
    expect(r.x).toBe(BOUNDS.w - viewW / 2); // 880
    expect(r.y).toBe(BOUNDS.h - viewH / 2); // 495
  });

  it('approaches monotonically and never overshoots over repeated steps', () => {
    let x = viewW / 2; // start parked at the left clamp
    const target = 640;
    let prev = -1;
    for (let i = 0; i < 200; i++) {
      const r = followStep(x, 360, target, 360, 0.12, viewW, viewH, BOUNDS);
      x = r.x;
      expect(x).toBeGreaterThanOrEqual(prev); // monotonic toward target
      expect(x).toBeLessThanOrEqual(target + 1e-6); // never overshoots
      prev = x;
    }
    expect(x).toBeCloseTo(target, 3); // converges
  });

  it('centres an axis when the view is larger than the world (no jitter)', () => {
    const narrow: Bounds = { x: 0, y: 0, w: 600, h: 720 };
    const r = followStep(300, 360, 100, 360, 1, viewW, viewH, narrow);
    expect(r.x).toBe(300); // world centre (0 + 600/2), regardless of the target
  });

  it('writes into the supplied scratch object (no allocation)', () => {
    const out: Vec2 = { x: 0, y: 0 };
    const r = followStep(400, 225, 640, 360, 0.12, viewW, viewH, BOUNDS, out);
    expect(r).toBe(out);
  });

  it('recovers from a non-finite current centre instead of propagating NaN', () => {
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

describe('shake curve (#139, retuned for the intentional-shake budget)', () => {
  it('intensity runs from a floor at impact 0 to a capped max at impact 1', () => {
    expect(shakeIntensity(0)).toBeCloseTo(0.004, 6);
    expect(shakeIntensity(1)).toBeCloseTo(0.011, 6);
  });

  it('the retuned curve is gentler than the old 0.006/0.016 at every impact', () => {
    // every point on the new curve sits at or below the old one (a calmer frame)
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const oldV = 0.006 + (0.016 - 0.006) * t;
      expect(shakeIntensity(t)).toBeLessThan(oldV);
    }
  });

  it('intensity is monotonic and never exceeds the readability cap', () => {
    let prev = -1;
    for (let i = 0; i <= 20; i++) {
      const v = shakeIntensity(i / 20);
      expect(v).toBeGreaterThanOrEqual(prev);
      expect(v).toBeLessThanOrEqual(0.011 + 1e-9); // hard cap
      prev = v;
    }
    expect(shakeIntensity(5)).toBeLessThanOrEqual(0.011); // clamps impact > 1
  });

  it('a tap-in and a screamer-goal map to clearly different (bounded) shakes', () => {
    const tapIn = shakeIntensity(0.2);
    const screamer = shakeIntensity(1.0);
    expect(screamer).toBeGreaterThan(tapIn); // visibly stronger
    expect(screamer).toBeLessThanOrEqual(0.011);
  });

  it('duration scales with impact within bounds', () => {
    expect(shakeDuration(0)).toBe(180);
    expect(shakeDuration(1)).toBe(260);
    expect(shakeDuration(0.5)).toBeGreaterThan(shakeDuration(0));
  });
});

describe('parallaxShift (#125 broadcast depth)', () => {
  it('factor 1 locks the layer to the world (no parallax)', () => {
    expect(parallaxShift(500, 1)).toBeCloseTo(0, 10);
    expect(parallaxShift(-320, 1)).toBeCloseTo(0, 10); // -0 is fine; it's mathematically zero
  });

  it('factor 0 pins the layer to the screen (offset == full scroll)', () => {
    expect(parallaxShift(500, 0)).toBe(500);
  });

  it('a mid factor lags the turf — on-screen travel is factor*scroll', () => {
    // layer position = scroll*(1-f); on-screen travel = scroll - position = scroll*f
    const scroll = 600;
    const f = 0.6;
    const pos = parallaxShift(scroll, f);
    expect(pos).toBeCloseTo(240, 6); // 600 * 0.4
    expect(scroll - pos).toBeCloseTo(scroll * f, 6); // travels at 60% of the turf
  });

  it('is linear in scroll and monotonic in factor', () => {
    expect(parallaxShift(0, 0.5)).toBe(0);
    expect(parallaxShift(200, 0.5)).toBeCloseTo(100, 6);
    expect(parallaxShift(400, 0.5)).toBeCloseTo(200, 6);
    // a smaller factor (more distant) ⇒ a larger world offset (lags more)
    expect(parallaxShift(400, 0.3)).toBeGreaterThan(parallaxShift(400, 0.7));
  });

  it('clamps the factor into [0,1] and survives a non-finite scroll', () => {
    expect(parallaxShift(400, -1)).toBe(400); // clamped to 0 → full pin
    expect(parallaxShift(400, 2)).toBe(0); // clamped to 1 → locked
    expect(parallaxShift(NaN, 0.5)).toBe(0);
  });
});

describe('velocityLead (#125 vertical lead)', () => {
  it('leads proportionally to velocity in its direction', () => {
    expect(velocityLead(200, 0.22, 70)).toBeCloseTo(44, 6);
    expect(velocityLead(-200, 0.22, 70)).toBeCloseTo(-44, 6);
  });

  it('hard-clamps to ±cap so a fast shot/sprint cannot fling the frame', () => {
    expect(velocityLead(5000, 0.22, 70)).toBe(70);
    expect(velocityLead(-5000, 0.22, 70)).toBe(-70);
  });

  it('a zero scale (reduce-motion) yields no lead', () => {
    expect(velocityLead(300, 0, 70)).toBe(0);
  });

  it('survives a non-finite velocity', () => {
    expect(velocityLead(NaN, 0.22, 70)).toBe(0);
  });
});

describe('deadzone1d (#125 anti-jitter)', () => {
  it('holds the frame still while the focus stays within the band', () => {
    expect(deadzone1d(0, 26)).toBe(0);
    expect(deadzone1d(20, 26)).toBe(0);
    expect(deadzone1d(-26, 26)).toBe(0);
  });

  it('returns only the overshoot beyond the band (focus rests on the edge)', () => {
    expect(deadzone1d(40, 26)).toBeCloseTo(14, 6);
    expect(deadzone1d(-40, 26)).toBeCloseTo(-14, 6);
  });

  it('is continuous at the band edge (no jump as the focus crosses out)', () => {
    expect(deadzone1d(26.0001, 26)).toBeCloseTo(0.0001, 6);
  });

  it('a zero half-band passes the delta straight through', () => {
    expect(deadzone1d(33, 0)).toBe(33);
  });

  it('survives a non-finite delta', () => {
    expect(deadzone1d(NaN, 26)).toBe(0);
  });
});

describe('multi-view camera (#176)', () => {
  it('maps the number keys 1-4 to views, rejecting anything else', () => {
    expect(viewFromDigit(1)).toBe('full');
    expect(viewFromDigit(2)).toBe('broadcast');
    expect(viewFromDigit(3)).toBe('tight');
    expect(viewFromDigit(4)).toBe('tactical');
    expect(viewFromDigit(0)).toBeNull();
    expect(viewFromDigit(5)).toBeNull();
    expect(viewFromDigit(NaN)).toBeNull();
  });

  it('follow views persist a ZoomLevel; tactical never overwrites the setting', () => {
    expect(viewZoomLevel('full')).toBe('wide');
    expect(viewZoomLevel('broadcast')).toBe('balanced');
    expect(viewZoomLevel('tight')).toBe('tight');
    expect(viewZoomLevel('tactical')).toBeNull();
  });

  it('round-trips ZoomLevel <-> view for the three follow views', () => {
    expect(viewForZoomLevel('wide')).toBe('full');
    expect(viewForZoomLevel('balanced')).toBe('broadcast');
    expect(viewForZoomLevel('tight')).toBe('tight');
    for (const lvl of ['wide', 'balanced', 'tight'] as const) {
      expect(viewZoomLevel(viewForZoomLevel(lvl))).toBe(lvl);
    }
  });

  it('framing: follow views use baseZoom and follow; tactical takes the caller zoom and does not follow', () => {
    expect(cameraViewConfig('full', 0.85)).toEqual({ zoom: baseZoom('wide'), follow: true, label: VIEW_LABEL.full });
    expect(cameraViewConfig('broadcast', 0.85)).toEqual({
      zoom: baseZoom('balanced'),
      follow: true,
      label: VIEW_LABEL.broadcast,
    });
    expect(cameraViewConfig('tight', 0.85)).toEqual({ zoom: baseZoom('tight'), follow: true, label: VIEW_LABEL.tight });
    const tac = cameraViewConfig('tactical', 0.85);
    expect(tac).toEqual({ zoom: 0.85, follow: false, label: VIEW_LABEL.tactical });
  });

  it('the full view shows the whole 1280x720 world at zoom 1 (view == world)', () => {
    expect(cameraViewConfig('full', 0.85).zoom).toBe(1.0);
  });

  it('fitZoom returns the smaller axis ratio so the whole rect fits', () => {
    // pitch (1152x560) + 140 margin each side -> 1432x840 fit into 1280x720
    const z = fitZoom(1432, 840, 1280, 720);
    expect(z).toBeCloseTo(Math.min(1280 / 1432, 720 / 840), 6);
    expect(z).toBeLessThan(1); // tactical pulls back beyond the full-pitch view
    // at this zoom the content fits within the viewport on both axes
    expect(1432 * z).toBeLessThanOrEqual(1280 + 1e-6);
    expect(840 * z).toBeLessThanOrEqual(720 + 1e-6);
  });

  it('fitZoom is defensive against non-positive dims', () => {
    expect(fitZoom(0, 100, 1280, 720)).toBe(1);
    expect(fitZoom(100, 100, -1, 720)).toBe(1);
  });

  it('tacticalBounds is a view-sized rect centred on the pitch (so the camera is pinned static)', () => {
    const z = 0.8;
    const b = tacticalBounds(640, 376, 1280, 720, z);
    expect(b.w).toBeCloseTo(1280 / z, 6);
    expect(b.h).toBeCloseTo(720 / z, 6);
    // centre of the bounds == pitch centre on both axes
    expect(b.x + b.w / 2).toBeCloseTo(640, 6);
    expect(b.y + b.h / 2).toBeCloseTo(376, 6);
  });

  it('tacticalBounds survives a non-positive zoom', () => {
    const b = tacticalBounds(640, 376, 1280, 720, 0);
    expect(Number.isFinite(b.w)).toBe(true);
    expect(b.w).toBe(1280);
  });
});
