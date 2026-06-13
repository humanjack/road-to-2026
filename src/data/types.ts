// ---------------------------------------------------------------------------
// Core data model for GROUNDSWELL '26
// ---------------------------------------------------------------------------

export type Confed = 'ICL' | 'SBC' | 'EAU' | 'SCB' | 'NTA' | 'BHC';

export interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface StarPlayer {
  name: string;
  position: string;
  archetype: string;
}

export interface Team {
  id: string; // lowercase kebab slug, unique
  name: string; // country name
  code: string; // 3-letter uppercase, unique
  confederation: Confed;
  ovr: number; // 60-99
  tier: 1 | 2 | 3 | 4 | 5; // 5 = Elite
  attack: number; // 50-99
  midfield: number; // 50-99
  defense: number; // 50-99
  pace: number; // 50-99
  colors: TeamColors;
  formation: string;
  playStyle: string;
  star: StarPlayer;
  isHost: boolean;
}

// ---------------------------------------------------------------------------
// Match
// ---------------------------------------------------------------------------

export type Difficulty = 'casual' | 'pro' | 'legend';

export interface MatchResult {
  homeId: string;
  awayId: string;
  homeGoals: number;
  awayGoals: number;
  played: boolean;
  winnerId?: string; // set for knockout matches (after penalties if needed)
  penalties?: { home: number; away: number };
  userInvolved: boolean;
}

// ---------------------------------------------------------------------------
// Tournament
// ---------------------------------------------------------------------------

export interface GroupStanding {
  teamId: string;
  P: number;
  W: number;
  D: number;
  L: number;
  GF: number;
  GA: number;
  GD: number;
  Pts: number;
}

export interface Group {
  id: string; // 'A'..'L'
  teamIds: string[]; // 4 teams
  fixtures: MatchResult[]; // 6 matches (round robin)
}

export type KnockoutRound = 'R32' | 'R16' | 'QF' | 'SF' | 'F';

export interface BracketMatch {
  id: string; // e.g. 'R32-1'
  round: KnockoutRound;
  homeId?: string;
  awayId?: string;
  result?: MatchResult;
  nextMatchId?: string; // winner advances here
  nextSlot?: 'home' | 'away';
}

export type TournamentPhase = 'groups' | 'knockout' | 'done';

export interface TournamentState {
  version: number;
  seed: number;
  userTeamId: string;
  difficulty: Difficulty;
  phase: TournamentPhase;
  groups: Group[];
  bracket: BracketMatch[];
  championId?: string;
  createdAt: number;
  // progress markers
  groupMatchday: number; // 0..3 (3 matchdays played => groups done)
  knockoutRound?: KnockoutRound;
}

export interface SaveGame {
  version: number;
  tournament: TournamentState | null;
  coins: number;
  settings: GameSettings;
  stats: CareerStats;
  unlocks: string[]; // ids of purchased shop items (teams + cosmetics)
  cosmetics: Cosmetics;
}

export interface Cosmetics {
  ball: string; // 'default' | 'gold' | 'plasma'
  pitch: string; // 'default' | 'aurora'
}

export interface GameSettings {
  fictionalNations: boolean;
  sfx: boolean;
  music: boolean;
  reduceMotion: boolean; // accessibility: disables screen shake / flashes
}

export interface CareerStats {
  tournamentsPlayed: number;
  tournamentsWon: number;
  matchesPlayed: number;
  goalsScored: number;
}
