import type { Team, MatchResult } from '../data/types';
import { RNG } from './rng';

// Attacking / defensive strength used to shape expected goals.
function attackStrength(t: Team): number {
  return t.attack * 0.62 + t.midfield * 0.38;
}
function defenceStrength(t: Team): number {
  return t.defense * 0.62 + t.midfield * 0.38;
}

// Knuth's Poisson sampler.
function poisson(lambda: number, rng: RNG): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng.next();
  } while (p > L);
  return k - 1;
}

function expectedGoals(att: Team, def: Team, homeBoost: number): number {
  const ratio = attackStrength(att) / Math.max(40, defenceStrength(def));
  const xg = 1.3 * Math.pow(ratio, 1.7) * homeBoost;
  return Math.max(0.25, Math.min(3.6, xg));
}

export interface SimOptions {
  knockout?: boolean; // force a winner via extra-time/penalties on a draw
  neutral?: boolean; // no home advantage (knockout venues are neutral)
}

// Simulate a full match result between two teams from their ratings.
export function simulateMatch(
  home: Team,
  away: Team,
  rng: RNG,
  userTeamId: string,
  opts: SimOptions = {},
): MatchResult {
  const homeBoost = opts.neutral ? 1.0 : home.isHost ? 1.14 : 1.06;
  const awayBoost = opts.neutral ? 1.0 : 0.96;

  const xgH = expectedGoals(home, away, homeBoost);
  const xgA = expectedGoals(away, home, awayBoost);

  let hg = poisson(xgH, rng);
  let ag = poisson(xgA, rng);

  const result: MatchResult = {
    homeId: home.id,
    awayId: away.id,
    homeGoals: hg,
    awayGoals: ag,
    played: true,
    userInvolved: home.id === userTeamId || away.id === userTeamId,
  };

  if (opts.knockout) {
    if (hg > ag) result.winnerId = home.id;
    else if (ag > hg) result.winnerId = away.id;
    else {
      const pens = penaltyShootout(home, away, rng);
      result.penalties = pens;
      result.winnerId = pens.home > pens.away ? home.id : away.id;
    }
  }
  return result;
}

// Best-of-five then sudden death; conversion odds scale with composure (OVR).
export function penaltyShootout(home: Team, away: Team, rng: RNG): { home: number; away: number } {
  const pH = 0.62 + (home.ovr - 75) * 0.004;
  const pA = 0.62 + (away.ovr - 75) * 0.004;
  let h = 0;
  let a = 0;
  for (let i = 0; i < 5; i++) {
    if (rng.next() < pH) h++;
    if (rng.next() < pA) a++;
  }
  while (h === a) {
    const sh = rng.next() < pH ? 1 : 0;
    const sa = rng.next() < pA ? 1 : 0;
    h += sh;
    a += sa;
  }
  return { home: h, away: a };
}
