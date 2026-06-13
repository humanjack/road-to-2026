import { describe, it, expect } from 'vitest';
import { TEAMS } from '../data/teams';
import {
  teamMapOf,
  createTournament,
  applyKnockoutResult,
  roundComplete,
  userStillIn,
} from './tournament';
import {
  currentGroupFixtures,
  userGroupFixture,
  simNonUserGroupFixtures,
  completeGroupMatchday,
  currentRoundMatches,
  userRoundMatch,
  simNonUserRoundMatches,
  advanceRoundIfComplete,
} from './flow';
import { simulateMatch } from './simMatch';
import { RNG } from './rng';

const map = teamMapOf(TEAMS);

describe('flow — granular user-aware path', () => {
  it('plays the group stage one matchday at a time (sim others, play the user)', () => {
    const st = createTournament(TEAMS, 'brazil', 'pro', 7);
    const rng = new RNG(7);

    for (let md = 0; md < 3; md++) {
      expect(currentGroupFixtures(st).length).toBe(24);
      simNonUserGroupFixtures(st, TEAMS, rng);

      // exactly one unplayed fixture remains this matchday — the user's
      const unplayed = currentGroupFixtures(st).filter((f) => !f.played);
      expect(unplayed.length).toBe(1);
      const uf = userGroupFixture(st);
      expect(uf).toBe(unplayed[0]);
      expect(uf!.userInvolved).toBe(true);

      const r = simulateMatch(map[uf!.homeId], map[uf!.awayId], rng, st.userTeamId, {});
      uf!.homeGoals = r.homeGoals;
      uf!.awayGoals = r.awayGoals;
      uf!.played = true;
      completeGroupMatchday(st, TEAMS);
    }

    expect(st.phase).toBe('knockout');
    expect(st.bracket.length).toBe(31);
    expect(st.knockoutRound).toBe('R32');
  });

  it('plays the knockout one round at a time and does not advance mid-round', () => {
    const st = createTournament(TEAMS, 'brazil', 'pro', 7);
    const rng = new RNG(7);
    // fast-forward groups
    while (st.phase === 'groups') {
      for (const f of currentGroupFixtures(st)) {
        if (!f.played) {
          const r = simulateMatch(map[f.homeId], map[f.awayId], rng, st.userTeamId, {});
          f.homeGoals = r.homeGoals;
          f.awayGoals = r.awayGoals;
          f.played = true;
        }
      }
      completeGroupMatchday(st, TEAMS);
    }
    expect(st.phase).toBe('knockout');

    let guard = 0;
    while (st.phase === 'knockout' && guard++ < 10) {
      const round = st.knockoutRound!;
      expect(currentRoundMatches(st).length).toBeGreaterThan(0);
      simNonUserRoundMatches(st, TEAMS, rng);

      const um = userRoundMatch(st);
      if (um) {
        // user still in -> their match is unresolved, so the round is not complete
        expect(roundComplete(st, round)).toBe(false);
        const r = simulateMatch(map[um.homeId!], map[um.awayId!], rng, st.userTeamId, {
          knockout: true,
          neutral: true,
        });
        applyKnockoutResult(st, um.id, r);
      }
      // mid-round (before all resolved) advanceRoundIfComplete must be a no-op
      const beforeRound = st.knockoutRound;
      if (!roundComplete(st, round)) {
        advanceRoundIfComplete(st);
        expect(st.knockoutRound).toBe(beforeRound);
      }
      advanceRoundIfComplete(st);
    }

    expect(st.phase).toBe('done');
    expect(st.championId).toBeTruthy();
    // userStillIn agrees with whether the user is the champion
    expect(userStillIn(st)).toBe(st.championId === st.userTeamId);
  });
});
