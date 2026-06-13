import { describe, it, expect } from 'vitest';
import { TEAMS } from '../data/teams';
import { createTournament } from './tournament';
import { autoSimAll } from './flow';
import { simulateMatch } from './simMatch';
import { RNG } from './rng';

// "No team is unwinnable" — the GDD's sacred balance promise, pinned as tests.

const byOvr = [...TEAMS].sort((a, b) => b.ovr - a.ovr);
const strongest = byOvr[0];
const weakest = byOvr[byOvr.length - 1];
const mid = byOvr[Math.floor(byOvr.length / 2)];

describe('balance', () => {
  it('the weakest nation can beat the strongest in a single neutral knockout match', () => {
    const rng = new RNG(123);
    let weakWins = 0;
    for (let i = 0; i < 800; i++) {
      const r = simulateMatch(weakest, strongest, rng, weakest.id, { knockout: true, neutral: true });
      if (r.winnerId === weakest.id) weakWins++;
    }
    expect(weakWins).toBeGreaterThan(0);
  });

  it('every single team can beat a mid-tier opponent at least once over many sims', () => {
    const rng = new RNG(7);
    for (const t of TEAMS) {
      if (t.id === mid.id) continue;
      let wins = 0;
      for (let i = 0; i < 250; i++) {
        const r = simulateMatch(t, mid, rng, t.id, { knockout: true, neutral: true });
        if (r.winnerId === t.id) wins++;
      }
      expect(wins, `${t.code} never beat ${mid.code} in 250 tries`).toBeGreaterThan(0);
    }
  });

  it('champions are diverse across many tournaments (not a single dominant winner)', () => {
    const champs = new Set<string>();
    for (let i = 0; i < 150; i++) {
      const st = createTournament(TEAMS, 'brazil', 'pro', 5000 + i);
      autoSimAll(st, TEAMS, new RNG(5000 + i));
      if (st.championId) champs.add(st.championId);
    }
    // a healthy spread of winners, not the same team every time
    expect(champs.size).toBeGreaterThanOrEqual(10);
  });
});
