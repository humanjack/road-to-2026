import { describe, it, expect } from 'vitest';
import { createTimeFlow, resetTimeFlow, requestHitStop, requestSlowMo, stepTimeScale, paceForSpeed } from './timeflow';

describe('paceForSpeed (#184 match tempo)', () => {
  it('maps each Game Speed to a distinct, increasing tempo multiplier', () => {
    expect(paceForSpeed('relaxed')).toBe(0.72);
    expect(paceForSpeed('standard')).toBe(0.85);
    expect(paceForSpeed('brisk')).toBe(1.0);
    expect(paceForSpeed('relaxed')).toBeLessThan(paceForSpeed('standard'));
    expect(paceForSpeed('standard')).toBeLessThan(paceForSpeed('brisk'));
  });

  it('brisk is the raw (unslowed) pace and no level ever speeds the game up', () => {
    expect(paceForSpeed('brisk')).toBe(1.0);
    for (const s of ['relaxed', 'standard', 'brisk'] as const) {
      expect(paceForSpeed(s)).toBeGreaterThan(0);
      expect(paceForSpeed(s)).toBeLessThanOrEqual(1.0);
    }
  });

  it('the default (standard) is a gentle slowdown for readability', () => {
    expect(paceForSpeed('standard')).toBeGreaterThan(0.8);
    expect(paceForSpeed('standard')).toBeLessThan(1.0);
  });
});

describe('timeflow — idle', () => {
  it('returns scale 1 when nothing is requested', () => {
    const s = createTimeFlow();
    expect(stepTimeScale(s, 16)).toBe(1);
    expect(stepTimeScale(s, 16)).toBe(1);
  });

  it('treats a non-positive delta as zero (no NaN, holds state)', () => {
    const s = createTimeFlow();
    requestHitStop(s, 80);
    expect(stepTimeScale(s, 0)).toBe(0);
    expect(s.hitStopMs).toBe(80); // not advanced
  });
});

describe('timeflow — hit-stop', () => {
  it('returns scale 0 for the freeze window then recovers to 1', () => {
    const s = createTimeFlow();
    requestHitStop(s, 80);
    expect(stepTimeScale(s, 50)).toBe(0); // 30 remaining
    expect(stepTimeScale(s, 50)).toBe(0); // crosses zero this frame
    expect(stepTimeScale(s, 16)).toBe(1); // recovered
  });

  it('a longer request wins when overlapping', () => {
    const s = createTimeFlow();
    requestHitStop(s, 40);
    requestHitStop(s, 90);
    expect(s.hitStopMs).toBe(90);
  });
});

describe('timeflow — slow-mo', () => {
  it('holds the floor scale at the start and eases monotonically back to 1', () => {
    const s = createTimeFlow();
    requestSlowMo(s, 0.45, 800);
    const first = stepTimeScale(s, 0.0001); // essentially the window start
    expect(first).toBeGreaterThanOrEqual(0.45);
    expect(first).toBeLessThan(0.47);
    let prev = first;
    let scale = first;
    for (let i = 0; i < 200; i++) {
      scale = stepTimeScale(s, 16);
      expect(scale).toBeGreaterThanOrEqual(prev - 1e-9); // monotonic up
      expect(scale).toBeLessThanOrEqual(1 + 1e-9);
      prev = scale;
    }
    expect(scale).toBe(1); // fully recovered
  });

  it('clamps a requested floor scale into [0,1]', () => {
    const s = createTimeFlow();
    requestSlowMo(s, -2, 100);
    expect(s.slowScale).toBe(0);
    requestSlowMo(s, 9, 100);
    expect(s.slowScale).toBe(1);
  });
});

describe('timeflow — goal (freeze then slow-mo)', () => {
  it('freezes first (scale 0) WITHOUT consuming the slow-mo window, then eases in', () => {
    const s = createTimeFlow();
    requestHitStop(s, 80);
    requestSlowMo(s, 0.45, 800);
    // freeze phase
    expect(stepTimeScale(s, 40)).toBe(0);
    expect(stepTimeScale(s, 40)).toBe(0);
    expect(s.slowMs).toBe(800); // slow window untouched during freeze
    // slow phase begins at the floor
    const afterFreeze = stepTimeScale(s, 0.0001);
    expect(afterFreeze).toBeGreaterThanOrEqual(0.45);
    expect(afterFreeze).toBeLessThan(0.47);
  });
});

describe('timeflow — determinism + reset', () => {
  it('identical real-delta sequences yield identical scale sequences', () => {
    const run = () => {
      const s = createTimeFlow();
      requestHitStop(s, 80);
      requestSlowMo(s, 0.45, 800);
      const out: number[] = [];
      for (let i = 0; i < 80; i++) out.push(stepTimeScale(s, 16));
      return out;
    };
    expect(run()).toEqual(run());
  });

  it('resetTimeFlow clears an active effect back to full speed', () => {
    const s = createTimeFlow();
    requestHitStop(s, 80);
    requestSlowMo(s, 0.4, 800);
    resetTimeFlow(s);
    expect(stepTimeScale(s, 16)).toBe(1);
  });
});
