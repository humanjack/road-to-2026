import { describe, it, expect } from 'vitest';
import { TEAMS } from '../data/teams';
import {
  createTournament,
  teamMapOf,
  groupStandings,
  qualifiers,
  bestThirds,
  groupsComplete,
} from './tournament';
import { autoSimAll, currentGroupFixtures, completeGroupMatchday } from './flow';
import { RNG } from './rng';
import { penaltyShootout, simulateMatch } from './simMatch';

const map = teamMapOf(TEAMS);

describe('roster', () => {
  it('has exactly 48 teams with unique ids and codes', () => {
    expect(TEAMS.length).toBe(48);
    expect(new Set(TEAMS.map((t) => t.id)).size).toBe(48);
    expect(new Set(TEAMS.map((t) => t.code)).size).toBe(48);
  });
  it('every team has sane ratings and 3 hosts exist', () => {
    for (const t of TEAMS) {
      expect(t.ovr).toBeGreaterThanOrEqual(60);
      expect(t.ovr).toBeLessThanOrEqual(99);
      for (const s of [t.attack, t.midfield, t.defense, t.pace]) {
        expect(s).toBeGreaterThanOrEqual(40);
        expect(s).toBeLessThanOrEqual(99);
      }
      expect([1, 2, 3, 4, 5]).toContain(t.tier);
    }
    expect(TEAMS.filter((t) => t.isHost).length).toBe(3);
  });
});

describe('createTournament', () => {
  it('draws 12 groups of 4 covering all 48 teams once', () => {
    const st = createTournament(TEAMS, 'brazil', 'pro', 12345);
    expect(st.groups.length).toBe(12);
    const all: string[] = [];
    for (const g of st.groups) {
      expect(g.teamIds.length).toBe(4);
      expect(g.fixtures.length).toBe(6);
      all.push(...g.teamIds);
    }
    expect(all.length).toBe(48);
    expect(new Set(all).size).toBe(48);
  });
  it('places the user team into a group', () => {
    const st = createTournament(TEAMS, 'brazil', 'pro', 999);
    expect(st.groups.some((g) => g.teamIds.includes('brazil'))).toBe(true);
  });
});

describe('full tournament simulation', () => {
  it('runs groups -> knockout -> a single champion', () => {
    const st = createTournament(TEAMS, 'brazil', 'pro', 0xc0ffee);
    const rng = new RNG(0xc0ffee);
    autoSimAll(st, TEAMS, rng);

    expect(st.phase).toBe('done');
    expect(st.championId).toBeTruthy();
    expect(map[st.championId!]).toBeTruthy();

    // groups fully played
    expect(groupsComplete(st)).toBe(true);

    // 31 knockout matches (16+8+4+2+1), all decided with a winner
    expect(st.bracket.length).toBe(31);
    for (const m of st.bracket) {
      expect(m.result).toBeTruthy();
      expect(m.result!.winnerId).toBeTruthy();
    }
    // champion equals the Final winner
    const final = st.bracket.find((m) => m.round === 'F')!;
    expect(st.championId).toBe(final.result!.winnerId);
  });

  it('qualification yields 32 teams (12 winners, 12 runners, 8 thirds)', () => {
    const st = createTournament(TEAMS, 'spain', 'pro', 42);
    const rng = new RNG(42);
    // sim only the group phase, then inspect qualifiers before knockout starts
    while (st.phase === 'groups') {
      for (const f of currentGroupFixtures(st)) {
        if (!f.played) {
          const r = simulateMatch(map[f.homeId], map[f.awayId], rng, st.userTeamId, {});
          f.homeGoals = r.homeGoals;
          f.awayGoals = r.awayGoals;
          f.played = true;
        }
      }
      // capture qualifier counts on the final matchday before completeGroupMatchday flips phase
      if (st.groupMatchday === 2) {
        expect(bestThirds(st, map).length).toBe(8);
        expect(qualifiers(st, map).length).toBe(32);
      }
      completeGroupMatchday(st, TEAMS);
    }
    expect(st.phase).toBe('knockout');
    expect(st.bracket.length).toBe(31);
  });

  it('is deterministic for a given seed', () => {
    const a = createTournament(TEAMS, 'brazil', 'pro', 7);
    const b = createTournament(TEAMS, 'brazil', 'pro', 7);
    autoSimAll(a, TEAMS, new RNG(7));
    autoSimAll(b, TEAMS, new RNG(7));
    expect(a.championId).toBe(b.championId);
  });
});

describe('standings', () => {
  it('counts points correctly for a finished group', () => {
    const st = createTournament(TEAMS, 'brazil', 'pro', 1);
    const g = st.groups[0];
    // force results: team0 beats all, team1 beats team2&3, etc.
    for (const f of g.fixtures) {
      f.played = true;
      f.homeGoals = 2;
      f.awayGoals = 0;
    }
    const table = groupStandings(g, map);
    expect(table.reduce((s, r) => s + r.P, 0)).toBe(12); // 6 matches * 2 teams
    expect(table[0].Pts).toBeGreaterThanOrEqual(table[3].Pts);
  });
});

describe('penalties', () => {
  it('always produces a decisive winner', () => {
    const rng = new RNG(5);
    for (let i = 0; i < 50; i++) {
      const p = penaltyShootout(TEAMS[i % TEAMS.length], TEAMS[(i + 1) % TEAMS.length], rng);
      expect(p.home).not.toBe(p.away);
    }
  });
});
