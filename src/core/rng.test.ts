import { describe, it, expect } from 'vitest';
import { RNG } from './rng';

describe('RNG', () => {
  it('is deterministic for a given seed and diverges for different seeds', () => {
    const a = new RNG(7);
    const b = new RNG(7);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
    const c = new RNG(8);
    const seqC = Array.from({ length: 20 }, () => c.next());
    expect(seqC).not.toEqual(seqA);
  });

  it('next() stays within [0, 1)', () => {
    const r = new RNG(123);
    for (let i = 0; i < 5000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int(min,max) is inclusive and hits both ends', () => {
    const r = new RNG(42);
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < 5000; i++) {
      const v = r.int(1, 6);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    expect(min).toBe(1);
    expect(max).toBe(6);
  });

  it('range(min,max) stays within [min,max)', () => {
    const r = new RNG(99);
    for (let i = 0; i < 5000; i++) {
      const v = r.range(2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThan(5);
    }
  });

  it('shuffle preserves the multiset, does not mutate input, and is deterministic', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const r = new RNG(5);
    const out = r.shuffle(input);
    expect(out.length).toBe(input.length);
    expect([...out].sort((x, y) => x - y)).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); // unchanged
    expect(new RNG(5).shuffle(input)).toEqual(out); // deterministic
  });

  it('pick returns an element of the array', () => {
    const r = new RNG(1);
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 100; i++) expect(arr).toContain(r.pick(arr));
  });
});
