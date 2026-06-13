import type { Team, TournamentState, MatchResult, BracketMatch } from '../data/types';
import { RNG } from './rng';
import { simulateMatch } from './simMatch';
import {
  teamMapOf,
  groupsComplete,
  startKnockout,
  roundMatches,
  applyKnockoutResult,
  roundComplete,
  nextRound,
  userBracketMatch,
} from './tournament';

// Copy a simulated result into an existing fixture/bracket result object.
function writeResult(target: MatchResult, r: MatchResult): void {
  target.homeGoals = r.homeGoals;
  target.awayGoals = r.awayGoals;
  target.played = true;
  target.winnerId = r.winnerId;
  target.penalties = r.penalties;
  target.userInvolved = r.userInvolved;
}

function simFixture(
  state: TournamentState,
  home: Team,
  away: Team,
  rng: RNG,
  knockout: boolean,
): MatchResult {
  return simulateMatch(home, away, rng, state.userTeamId, { knockout, neutral: knockout });
}

// --- GROUPS ---------------------------------------------------------------

// The 2 fixtures per group for the current matchday (24 total).
export function currentGroupFixtures(state: TournamentState): MatchResult[] {
  const md = state.groupMatchday;
  const out: MatchResult[] = [];
  for (const g of state.groups) {
    out.push(g.fixtures[md * 2], g.fixtures[md * 2 + 1]);
  }
  return out;
}

export function userGroupFixture(state: TournamentState): MatchResult | null {
  return currentGroupFixtures(state).find((f) => f.userInvolved && !f.played) ?? null;
}

// Sim every current-matchday fixture except the (still-unplayed) user fixture.
export function simNonUserGroupFixtures(state: TournamentState, teams: Team[], rng: RNG): void {
  const map = teamMapOf(teams);
  for (const f of currentGroupFixtures(state)) {
    if (f.played) continue;
    if (f.userInvolved) continue;
    writeResult(f, simFixture(state, map[f.homeId], map[f.awayId], rng, false));
  }
}

// Advance to the next matchday; once 3 are done, build the knockout bracket.
export function completeGroupMatchday(state: TournamentState, teams: Team[]): void {
  state.groupMatchday += 1;
  if (state.groupMatchday >= 3 || groupsComplete(state)) {
    if (groupsComplete(state)) startKnockout(state, teamMapOf(teams));
  }
}

// --- KNOCKOUT -------------------------------------------------------------

// Current-round matches that are ready (both slots filled).
export function currentRoundMatches(state: TournamentState): BracketMatch[] {
  if (!state.knockoutRound) return [];
  return roundMatches(state, state.knockoutRound).filter((m) => m.homeId && m.awayId);
}

export function userRoundMatch(state: TournamentState): BracketMatch | null {
  return userBracketMatch(state) ?? null;
}

export function simNonUserRoundMatches(state: TournamentState, teams: Team[], rng: RNG): void {
  const map = teamMapOf(teams);
  for (const m of currentRoundMatches(state)) {
    if (m.result) continue;
    if (m.homeId === state.userTeamId || m.awayId === state.userTeamId) continue;
    const r = simFixture(state, map[m.homeId!], map[m.awayId!], rng, true);
    applyKnockoutResult(state, m.id, r);
  }
}

// After all matches in the current round resolve, advance to the next round
// (or mark the whole tournament done after the Final).
export function advanceRoundIfComplete(state: TournamentState): void {
  if (!state.knockoutRound) return;
  if (!roundComplete(state, state.knockoutRound)) return;
  const nr = nextRound(state.knockoutRound);
  if (nr) {
    state.knockoutRound = nr;
  } else {
    state.phase = 'done';
  }
}

// --- FULL AUTO-SIM (tests, and "sim to the end" if the user bows out) -----

export function autoSimAll(state: TournamentState, teams: Team[], rng: RNG): void {
  let guard = 0;
  while (state.phase === 'groups' && guard++ < 100) {
    // sim all current-matchday fixtures (including the user's)
    const map = teamMapOf(teams);
    for (const f of currentGroupFixtures(state)) {
      if (!f.played) writeResult(f, simFixture(state, map[f.homeId], map[f.awayId], rng, false));
    }
    completeGroupMatchday(state, teams);
  }
  guard = 0;
  while (state.phase === 'knockout' && guard++ < 100) {
    const map = teamMapOf(teams);
    for (const m of currentRoundMatches(state)) {
      if (!m.result) {
        const r = simFixture(state, map[m.homeId!], map[m.awayId!], rng, true);
        applyKnockoutResult(state, m.id, r);
      }
    }
    advanceRoundIfComplete(state);
  }
}
