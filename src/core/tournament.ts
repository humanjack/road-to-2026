import type {
  Team,
  TournamentState,
  Group,
  MatchResult,
  GroupStanding,
  BracketMatch,
  KnockoutRound,
  Difficulty,
} from '../data/types';
import { RNG } from './rng';

export const GROUP_IDS = 'ABCDEFGHIJKL'.split(''); // 12 groups
export const TOURNAMENT_VERSION = 1;

export function teamMapOf(teams: Team[]): Record<string, Team> {
  const m: Record<string, Team> = {};
  for (const t of teams) m[t.id] = t;
  return m;
}

// --- Match construction ---------------------------------------------------

function emptyMatch(homeId: string, awayId: string, userTeamId: string): MatchResult {
  return {
    homeId,
    awayId,
    homeGoals: 0,
    awayGoals: 0,
    played: false,
    userInvolved: homeId === userTeamId || awayId === userTeamId,
  };
}

// Round-robin schedule for a 4-team group, organised into 3 matchdays.
// fixtures index layout: [MD1a, MD1b, MD2a, MD2b, MD3a, MD3b]
function groupFixtures(ids: string[], userTeamId: string): MatchResult[] {
  const [a, b, c, d] = ids;
  return [
    emptyMatch(a, b, userTeamId),
    emptyMatch(c, d, userTeamId),
    emptyMatch(a, c, userTeamId),
    emptyMatch(d, b, userTeamId),
    emptyMatch(a, d, userTeamId),
    emptyMatch(b, c, userTeamId),
  ];
}

// --- Tournament creation --------------------------------------------------

export function createTournament(
  teams: Team[],
  userTeamId: string,
  difficulty: Difficulty,
  seed: number,
): TournamentState {
  const rng = new RNG(seed);

  // Seed into 4 pots of 12 by OVR, then draw one from each pot per group.
  const ordered = teams.slice().sort((x, y) => y.ovr - x.ovr || x.id.localeCompare(y.id));
  const pots: Team[][] = [];
  for (let p = 0; p < 4; p++) pots.push(rng.shuffle(ordered.slice(p * 12, p * 12 + 12)));

  const groups: Group[] = GROUP_IDS.map((gid, gi) => {
    const ids = [pots[0][gi].id, pots[1][gi].id, pots[2][gi].id, pots[3][gi].id];
    return { id: gid, teamIds: ids, fixtures: groupFixtures(ids, userTeamId) };
  });

  return {
    version: TOURNAMENT_VERSION,
    seed,
    userTeamId,
    difficulty,
    phase: 'groups',
    groups,
    bracket: [],
    createdAt: Date.now(),
    groupMatchday: 0,
  };
}

// --- Standings ------------------------------------------------------------

export function groupStandings(group: Group, teams: Record<string, Team>): GroupStanding[] {
  const table: Record<string, GroupStanding> = {};
  for (const id of group.teamIds) {
    table[id] = { teamId: id, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 };
  }
  for (const f of group.fixtures) {
    if (!f.played) continue;
    const h = table[f.homeId];
    const a = table[f.awayId];
    h.P++;
    a.P++;
    h.GF += f.homeGoals;
    h.GA += f.awayGoals;
    a.GF += f.awayGoals;
    a.GA += f.homeGoals;
    if (f.homeGoals > f.awayGoals) {
      h.W++;
      a.L++;
      h.Pts += 3;
    } else if (f.homeGoals < f.awayGoals) {
      a.W++;
      h.L++;
      a.Pts += 3;
    } else {
      h.D++;
      a.D++;
      h.Pts++;
      a.Pts++;
    }
  }
  const rows = Object.values(table);
  for (const r of rows) r.GD = r.GF - r.GA;
  rows.sort((x, y) => compareStanding(x, y, teams));
  return rows;
}

function compareStanding(x: GroupStanding, y: GroupStanding, teams: Record<string, Team>): number {
  if (y.Pts !== x.Pts) return y.Pts - x.Pts;
  if (y.GD !== x.GD) return y.GD - x.GD;
  if (y.GF !== x.GF) return y.GF - x.GF;
  const ox = teams[x.teamId]?.ovr ?? 0;
  const oy = teams[y.teamId]?.ovr ?? 0;
  if (oy !== ox) return oy - ox;
  return x.teamId.localeCompare(y.teamId);
}

export function allStandings(state: TournamentState, teams: Record<string, Team>): Record<string, GroupStanding[]> {
  const out: Record<string, GroupStanding[]> = {};
  for (const g of state.groups) out[g.id] = groupStandings(g, teams);
  return out;
}

export function groupsComplete(state: TournamentState): boolean {
  return state.groups.every((g) => g.fixtures.every((f) => f.played));
}

// --- Qualification --------------------------------------------------------

// Best-third ranking across all 12 groups, returns the 8 qualifying third ids.
export function bestThirds(state: TournamentState, teams: Record<string, Team>): string[] {
  const thirds: GroupStanding[] = [];
  for (const g of state.groups) {
    const s = groupStandings(g, teams);
    if (s[2]) thirds.push(s[2]);
  }
  thirds.sort((x, y) => compareStanding(x, y, teams));
  return thirds.slice(0, 8).map((t) => t.teamId);
}

// 32 ordered qualifier slots: 12 winners, 12 runners-up, 8 best thirds.
export function qualifiers(state: TournamentState, teams: Record<string, Team>): string[] {
  const winners: string[] = [];
  const runners: string[] = [];
  for (const g of state.groups) {
    const s = groupStandings(g, teams);
    winners.push(s[0].teamId);
    runners.push(s[1].teamId);
  }
  return [...winners, ...runners, ...bestThirds(state, teams)];
}

// --- Bracket --------------------------------------------------------------

const ROUNDS: { round: KnockoutRound; matches: number }[] = [
  { round: 'R32', matches: 16 },
  { round: 'R16', matches: 8 },
  { round: 'QF', matches: 4 },
  { round: 'SF', matches: 2 },
  { round: 'F', matches: 1 },
];

export function nextRound(r: KnockoutRound): KnockoutRound | null {
  const idx = ROUNDS.findIndex((x) => x.round === r);
  return idx >= 0 && idx < ROUNDS.length - 1 ? ROUNDS[idx + 1].round : null;
}

export function roundLabel(r: KnockoutRound): string {
  return { R32: 'Round of 32', R16: 'Round of 16', QF: 'Quarter-Final', SF: 'Semi-Final', F: 'The Globe Cup Final' }[r];
}

// Build the full bracket tree from 32 ordered slots (1 vs 32, 2 vs 31, ...).
export function buildBracket(slots: string[]): BracketMatch[] {
  const matches: BracketMatch[] = [];
  // R32
  for (let i = 0; i < 16; i++) {
    matches.push({
      id: `R32-${i + 1}`,
      round: 'R32',
      homeId: slots[i],
      awayId: slots[31 - i],
    });
  }
  // Subsequent rounds (empty slots, filled as winners advance)
  for (let r = 1; r < ROUNDS.length; r++) {
    const { round, matches: count } = ROUNDS[r];
    for (let i = 0; i < count; i++) matches.push({ id: `${round}-${i + 1}`, round });
  }
  // Link winners forward.
  for (let r = 0; r < ROUNDS.length - 1; r++) {
    const cur = ROUNDS[r];
    for (let i = 0; i < cur.matches; i++) {
      const m = matches.find((x) => x.id === `${cur.round}-${i + 1}`)!;
      const next = ROUNDS[r + 1];
      m.nextMatchId = `${next.round}-${Math.floor(i / 2) + 1}`;
      m.nextSlot = i % 2 === 0 ? 'home' : 'away';
    }
  }
  return matches;
}

export function startKnockout(state: TournamentState, teams: Record<string, Team>): void {
  const slots = qualifiers(state, teams);
  state.bracket = buildBracket(slots);
  state.phase = 'knockout';
  state.knockoutRound = 'R32';
}

export function bracketMatch(state: TournamentState, id: string): BracketMatch | undefined {
  return state.bracket.find((m) => m.id === id);
}

export function roundMatches(state: TournamentState, round: KnockoutRound): BracketMatch[] {
  return state.bracket.filter((m) => m.round === round);
}

// Apply a finished knockout result and advance the winner into the next match.
export function applyKnockoutResult(state: TournamentState, matchId: string, result: MatchResult): void {
  const m = bracketMatch(state, matchId);
  if (!m) return;
  m.result = result;
  const winner = result.winnerId ?? (result.homeGoals >= result.awayGoals ? result.homeId : result.awayId);
  if (result.winnerId == null) result.winnerId = winner; // keep stored result self-consistent
  if (m.round === 'F') {
    state.championId = winner;
    return;
  }
  if (m.nextMatchId && m.nextSlot) {
    const nxt = bracketMatch(state, m.nextMatchId);
    if (nxt) {
      if (m.nextSlot === 'home') nxt.homeId = winner;
      else nxt.awayId = winner;
    }
  }
}

export function roundComplete(state: TournamentState, round: KnockoutRound): boolean {
  return roundMatches(state, round).every((m) => !!m.result);
}

export function userStillIn(state: TournamentState): boolean {
  if (state.phase === 'groups') return true;
  if (state.phase === 'done') return state.championId === state.userTeamId;
  const round = state.knockoutRound;
  if (!round) return false;
  // user is in if they appear in this round's matches without having lost
  const ms = roundMatches(state, round);
  return ms.some(
    (m) =>
      (m.homeId === state.userTeamId || m.awayId === state.userTeamId) &&
      (!m.result || m.result.winnerId === state.userTeamId),
  );
}

export function userBracketMatch(state: TournamentState): BracketMatch | undefined {
  const round = state.knockoutRound;
  if (!round) return undefined;
  return roundMatches(state, round).find(
    (m) => (m.homeId === state.userTeamId || m.awayId === state.userTeamId) && !m.result,
  );
}
