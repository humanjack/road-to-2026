import { describe, it, expect } from 'vitest';
import {
  FORMATIONS,
  FORMATION_4_3_3,
  FORMATION_4_4_2,
  FORMATION_3_5_2,
  DEFAULT_FORMATION,
  resolveFormation,
  type FormationSlot,
} from './formations';

const ALL = [FORMATION_4_3_3, FORMATION_4_4_2, FORMATION_3_5_2];

describe('formation tables', () => {
  it('every shipped formation has exactly 11 slots', () => {
    for (const f of ALL) expect(f.length).toBe(11);
  });

  it('every formation has exactly one goalkeeper', () => {
    for (const f of ALL) expect(f.filter((s) => s.role === 'GK').length).toBe(1);
  });

  it('the goalkeeper is the deepest player (nearest own goal)', () => {
    for (const f of ALL) {
      const gk = f.find((s) => s.role === 'GK')!;
      const minOutfield = Math.min(...f.filter((s) => s.role !== 'GK').map((s) => s.fx));
      expect(gk.fx).toBeLessThan(minOutfield);
    }
  });

  it('all positions are inside the pitch (0..1 on both axes, with a touchline inset)', () => {
    for (const f of ALL) {
      for (const s of f) {
        expect(s.fx).toBeGreaterThan(0);
        expect(s.fx).toBeLessThan(1);
        expect(s.fy).toBeGreaterThanOrEqual(0.05);
        expect(s.fy).toBeLessThanOrEqual(0.95);
      }
    }
  });

  it('outfield roles stack downfield: DEF behind MID behind FWD on average', () => {
    for (const f of ALL) {
      const avg = (r: string) => {
        const xs = f.filter((s) => s.role === r).map((s) => s.fx);
        return xs.reduce((a, b) => a + b, 0) / xs.length;
      };
      expect(avg('DEF')).toBeLessThan(avg('MID'));
      expect(avg('MID')).toBeLessThan(avg('FWD'));
    }
  });

  it('no two slots share the exact same position (no stacked players)', () => {
    for (const f of ALL) {
      const seen = new Set(f.map((s: FormationSlot) => `${s.fx},${s.fy}`));
      expect(seen.size).toBe(11);
    }
  });

  it('the standard shapes have the right line counts', () => {
    const count = (f: FormationSlot[], r: string) => f.filter((s) => s.role === r).length;
    expect([count(FORMATION_4_3_3, 'DEF'), count(FORMATION_4_3_3, 'MID'), count(FORMATION_4_3_3, 'FWD')]).toEqual([4, 3, 3]);
    expect([count(FORMATION_4_4_2, 'DEF'), count(FORMATION_4_4_2, 'MID'), count(FORMATION_4_4_2, 'FWD')]).toEqual([4, 4, 2]);
    expect([count(FORMATION_3_5_2, 'DEF'), count(FORMATION_3_5_2, 'MID'), count(FORMATION_3_5_2, 'FWD')]).toEqual([3, 5, 2]);
  });
});

describe('resolveFormation', () => {
  it('returns the exact table for a known label', () => {
    expect(resolveFormation('4-3-3')).toBe(FORMATION_4_3_3);
    expect(resolveFormation('4-4-2')).toBe(FORMATION_4_4_2);
    expect(resolveFormation('3-5-2')).toBe(FORMATION_3_5_2);
  });

  it('trims whitespace', () => {
    expect(resolveFormation('  4-4-2 ')).toBe(FORMATION_4_4_2);
  });

  it('approximates unknown labels by the defensive line', () => {
    expect(resolveFormation('4-4-2 diamond')).toBe(FORMATION_4_4_2);
    expect(resolveFormation('3-4-2-1')).toBe(FORMATION_3_5_2);
    expect(resolveFormation('3-4-3')).toBe(FORMATION_3_5_2);
  });

  it('falls back to the default 4-3-3 for anything else', () => {
    expect(resolveFormation('4-2-3-1')).toBe(DEFAULT_FORMATION);
    expect(resolveFormation('')).toBe(DEFAULT_FORMATION);
    expect(resolveFormation(undefined)).toBe(DEFAULT_FORMATION);
    expect(resolveFormation(null)).toBe(DEFAULT_FORMATION);
  });

  it('always returns a valid 11-slot table', () => {
    for (const label of ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', 'nonsense', '']) {
      expect(resolveFormation(label).length).toBe(11);
    }
  });

  it('the FORMATIONS registry exposes the shipped shapes', () => {
    expect(Object.keys(FORMATIONS).sort()).toEqual(['3-5-2', '4-3-3', '4-4-2']);
  });
});
