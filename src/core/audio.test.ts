import { describe, it, expect } from 'vitest';
import { crowdLevelFromSurge } from './audio';

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
