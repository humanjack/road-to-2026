import { describe, it, expect } from 'vitest';
import { TEAMS } from '../data/teams';
import { teamMapOf } from './tournament';
import { simulateMatch, penaltyShootout } from './simMatch';
import { RNG } from './rng';

const map = teamMapOf(TEAMS);
const A = map['brazil'];
const B = map['spain'];

describe('simulateMatch', () => {
  it('produces integer, non-negative scorelines', () => {
    const rng = new RNG(1);
    for (let i = 0; i < 1000; i++) {
      const r = simulateMatch(A, B, rng, 'brazil', {});
      expect(Number.isInteger(r.homeGoals)).toBe(true);
      expect(Number.isInteger(r.awayGoals)).toBe(true);
      expect(r.homeGoals).toBeGreaterThanOrEqual(0);
      expect(r.awayGoals).toBeGreaterThanOrEqual(0);
      expect(r.played).toBe(true);
    }
  });

  it('a knockout match always yields a decisive winner', () => {
    const rng = new RNG(2);
    for (let i = 0; i < 1000; i++) {
      const r = simulateMatch(A, B, rng, 'brazil', { knockout: true, neutral: true });
      expect(r.winnerId).toBeTruthy();
      expect([A.id, B.id]).toContain(r.winnerId);
      if (r.homeGoals === r.awayGoals) {
        expect(r.penalties).toBeTruthy();
        expect(r.penalties!.home).not.toBe(r.penalties!.away);
      }
    }
  });

  it('home advantage raises the home scoreline on average vs a neutral venue', () => {
    const N = 1500;
    let homeAdvTotal = 0;
    let neutralTotal = 0;
    const r1 = new RNG(10);
    const r2 = new RNG(10);
    for (let i = 0; i < N; i++) {
      homeAdvTotal += simulateMatch(A, B, r1, 'brazil', {}).homeGoals;
      neutralTotal += simulateMatch(A, B, r2, 'brazil', { neutral: true }).homeGoals;
    }
    expect(homeAdvTotal).toBeGreaterThan(neutralTotal);
  });
});

describe('penaltyShootout', () => {
  it('always decisive across many runs', () => {
    const rng = new RNG(3);
    for (let i = 0; i < 200; i++) {
      const p = penaltyShootout(A, B, rng);
      expect(p.home).not.toBe(p.away);
      expect(p.home).toBeGreaterThanOrEqual(0);
      expect(p.away).toBeGreaterThanOrEqual(0);
    }
  });

  it('the ordered kicks[] reconstruct the tally (no kick lost) and alternate sides (#142)', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const p = penaltyShootout(A, B, new RNG(seed));
      const homeScored = p.kicks.filter((k) => k.side === 'home' && k.scored).length;
      const awayScored = p.kicks.filter((k) => k.side === 'away' && k.scored).length;
      expect(homeScored).toBe(p.home); // every home goal is in the list
      expect(awayScored).toBe(p.away);
      expect(p.kicks.length % 2).toBe(0); // home/away pairs
      p.kicks.forEach((k, i) => expect(k.side).toBe(i % 2 === 0 ? 'home' : 'away'));
    }
  });

  it('the tally is bit-identical run-to-run for a seed (RNG draw order preserved)', () => {
    const a = penaltyShootout(A, B, new RNG(7));
    const b = penaltyShootout(A, B, new RNG(7));
    expect({ home: a.home, away: a.away }).toEqual({ home: b.home, away: b.away });
    expect(a.kicks).toEqual(b.kicks);
  });
});
