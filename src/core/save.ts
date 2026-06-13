import type { SaveGame, TournamentState, GameSettings, CareerStats } from '../data/types';

const STORAGE_KEY = 'groundswell26.save.v1';
export const SAVE_VERSION = 1;

function defaultSettings(): GameSettings {
  return { fictionalNations: false, sfx: true, music: true };
}

function defaultStats(): CareerStats {
  return { tournamentsPlayed: 0, tournamentsWon: 0, matchesPlayed: 0, goalsScored: 0 };
}

export function defaultSave(): SaveGame {
  return {
    version: SAVE_VERSION,
    tournament: null,
    coins: 0,
    settings: defaultSettings(),
    stats: defaultStats(),
  };
}

let cache: SaveGame | null = null;

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

// Migrate older save shapes forward. Currently only v1 exists, but the hook is
// here so future versions never wipe a player's progress.
function migrate(raw: any): SaveGame {
  const base = defaultSave();
  if (!raw || typeof raw !== 'object') return base;
  const save: SaveGame = {
    version: SAVE_VERSION,
    tournament: raw.tournament ?? null,
    coins: typeof raw.coins === 'number' ? raw.coins : 0,
    settings: { ...base.settings, ...(raw.settings ?? {}) },
    stats: { ...base.stats, ...(raw.stats ?? {}) },
  };
  return save;
}

export function loadSave(): SaveGame {
  if (cache) return cache;
  const s = storage();
  if (!s) {
    cache = defaultSave();
    return cache;
  }
  try {
    const txt = s.getItem(STORAGE_KEY);
    cache = txt ? migrate(JSON.parse(txt)) : defaultSave();
  } catch {
    cache = defaultSave();
  }
  return cache;
}

export function writeSave(save: SaveGame): void {
  cache = save;
  const s = storage();
  if (!s) return;
  try {
    s.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // Quota or privacy mode — fail silently; game still runs from in-memory cache.
  }
}

// Convenience mutators ------------------------------------------------------

export function getSave(): SaveGame {
  return loadSave();
}

export function saveTournament(t: TournamentState | null): void {
  const save = loadSave();
  save.tournament = t;
  writeSave(save);
}

export function hasSavedTournament(): boolean {
  const t = loadSave().tournament;
  return !!t && t.phase !== 'done';
}

export function addCoins(n: number): void {
  const save = loadSave();
  save.coins = Math.max(0, save.coins + n);
  writeSave(save);
}

export function updateSettings(patch: Partial<GameSettings>): void {
  const save = loadSave();
  save.settings = { ...save.settings, ...patch };
  writeSave(save);
}

export function recordMatch(goalsScored: number): void {
  const save = loadSave();
  save.stats.matchesPlayed += 1;
  save.stats.goalsScored += goalsScored;
  writeSave(save);
}

export function recordTournament(won: boolean): void {
  const save = loadSave();
  save.stats.tournamentsPlayed += 1;
  if (won) save.stats.tournamentsWon += 1;
  writeSave(save);
}

export function clearSave(): void {
  cache = defaultSave();
  const s = storage();
  if (s) {
    try {
      s.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}
