import { describe, it, expect } from 'vitest';
import { crowdLevelFromSurge, isClosingPhase, musicIntensity } from './audio';

describe('crowdLevelFromSurge (#134)', () => {
  it('has a non-zero rest floor (the crowd is never dead silent)', () => {
    expect(crowdLevelFromSurge(0, 0)).toBeGreaterThan(0);
  });

  it('rises monotonically with the Surge meter', () => {
    let prev = -1;
    for (let i = 0; i <= 10; i++) {
      const v = crowdLevelFromSurge(i / 10, 0);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it('is loud at full Surge and peaks (roar) at GROUNDSWELL late on', () => {
    expect(crowdLevelFromSurge(1, 0)).toBeGreaterThan(0.8); // loud even early
    expect(crowdLevelFromSurge(1, 1)).toBe(1); // sustained roar
  });

  it('the closing minutes lift the level a touch', () => {
    expect(crowdLevelFromSurge(0.5, 1)).toBeGreaterThan(crowdLevelFromSurge(0.5, 0));
  });

  it('clamps over-range and non-finite inputs into [0,1]', () => {
    expect(crowdLevelFromSurge(2, 2)).toBe(1);
    expect(crowdLevelFromSurge(-1, -1)).toBeGreaterThan(0); // still the floor
    expect(crowdLevelFromSurge(-1, -1)).toBeLessThanOrEqual(1);
    expect(crowdLevelFromSurge(NaN, NaN)).toBeGreaterThan(0);
  });
});

describe('isClosingPhase / musicIntensity (#141)', () => {
  it('flips to true exactly at the final-10% boundary', () => {
    expect(isClosingPhase(107, 120)).toBe(false);
    expect(isClosingPhase(108, 120)).toBe(true); // 120 * 0.9
    expect(isClosingPhase(120, 120)).toBe(true);
  });

  it('holds the bed at the closing floor regardless of a late tension drop (MAX rule)', () => {
    expect(musicIntensity(0.3, true)).toBe(0.9); // a late goal dropped tension → floor holds the climax
    expect(musicIntensity(0.95, true)).toBe(0.95); // already higher → base wins
    expect(musicIntensity(0.3, false)).toBe(0.3); // outside the closing phase → base
  });

  it('handles a zero duration and a non-finite base', () => {
    expect(isClosingPhase(10, 0)).toBe(false);
    expect(musicIntensity(NaN, true)).toBe(0.9);
  });
});
