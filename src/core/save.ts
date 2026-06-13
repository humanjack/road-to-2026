import type { SaveGame, TournamentState, GameSettings, CareerStats, Cosmetics } from '../data/types';

const STORAGE_KEY = 'groundswell26.save.v1';
const META_KEY = 'groundswell26.activeSlot';
export const SAVE_VERSION = 1;
export const SLOT_COUNT = 3;

// Slot 0 keeps the original key (backward compatible); slots 1+ are suffixed.
function slotKey(slot: number): string {
  return slot === 0 ? STORAGE_KEY : `${STORAGE_KEY}.s${slot}`;
}

let activeSlot = -1; // lazily resolved from storage

function defaultSettings(): GameSettings {
  return { fictionalNations: false, sfx: true, music: true, reduceMotion: false };
}

function defaultStats(): CareerStats {
  return { tournamentsPlayed: 0, tournamentsWon: 0, matchesPlayed: 0, goalsScored: 0 };
}

function defaultCosmetics(): Cosmetics {
  return { ball: 'default', pitch: 'default' };
}

export function defaultSave(): SaveGame {
  return {
    version: SAVE_VERSION,
    tournament: null,
    coins: 0,
    settings: defaultSettings(),
    stats: defaultStats(),
    unlocks: [],
    cosmetics: defaultCosmetics(),
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

// --- save slots -----------------------------------------------------------

export function getActiveSlot(): number {
  if (activeSlot >= 0) return activeSlot;
  let v = 0;
  const s = storage();
  if (s) {
    try {
      const m = s.getItem(META_KEY);
      const n = m != null ? parseInt(m, 10) : 0;
      if (n >= 0 && n < SLOT_COUNT) v = n;
    } catch {
      /* ignore */
    }
  }
  activeSlot = v;
  return v;
}

export function setActiveSlot(slot: number): void {
  if (slot < 0 || slot >= SLOT_COUNT) return;
  activeSlot = slot;
  cache = null; // force reload of the newly-selected slot
  const s = storage();
  if (s) {
    try {
      s.setItem(META_KEY, String(slot));
    } catch {
      /* ignore */
    }
  }
}

export interface SlotSummary {
  slot: number;
  exists: boolean;
  coins: number;
  cups: number;
  userTeamId: string | null;
  inProgress: boolean;
}

export function getSlotSummaries(): SlotSummary[] {
  const s = storage();
  const out: SlotSummary[] = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    let summary: SlotSummary = { slot: i, exists: false, coins: 0, cups: 0, userTeamId: null, inProgress: false };
    if (s) {
      try {
        const txt = s.getItem(slotKey(i));
        if (txt) {
          const g = migrate(JSON.parse(txt));
          summary = {
            slot: i,
            exists: true,
            coins: g.coins,
            cups: g.stats.tournamentsWon,
            userTeamId: g.tournament?.userTeamId ?? null,
            inProgress: !!g.tournament && g.tournament.phase !== 'done',
          };
        }
      } catch {
        /* leave as empty */
      }
    }
    out.push(summary);
  }
  return out;
}

export function deleteSlot(slot: number): void {
  const s = storage();
  if (s) {
    try {
      s.removeItem(slotKey(slot));
    } catch {
      /* ignore */
    }
  }
  if (slot === getActiveSlot()) cache = defaultSave();
}

// Structural validation so a corrupt / hand-edited / future-incompatible
// tournament blob never reaches the render path and crashes resume.
export function isValidTournament(t: any): boolean {
  if (!t || typeof t !== 'object') return false;
  if (typeof t.userTeamId !== 'string' || !t.userTeamId) return false;
  if (!['groups', 'knockout', 'done'].includes(t.phase)) return false;
  if (!Array.isArray(t.groups) || t.groups.length !== 12) return false;
  if (!Array.isArray(t.bracket)) return false;
  for (const g of t.groups) {
    if (!g || !Array.isArray(g.teamIds) || g.teamIds.length !== 4) return false;
    if (!Array.isArray(g.fixtures) || g.fixtures.length !== 6) return false;
  }
  return true;
}

// Migrate older save shapes forward. A version newer than we understand, or a
// structurally-broken tournament, drops the cup (keeps coins/settings/stats).
function migrate(raw: any): SaveGame {
  const base = defaultSave();
  if (!raw || typeof raw !== 'object') return base;
  const incompatible = typeof raw.version === 'number' && raw.version > SAVE_VERSION;
  const tournament = !incompatible && isValidTournament(raw.tournament) ? raw.tournament : null;
  const save: SaveGame = {
    version: SAVE_VERSION,
    tournament,
    coins: typeof raw.coins === 'number' ? raw.coins : 0,
    settings: { ...base.settings, ...(raw.settings ?? {}) },
    stats: { ...base.stats, ...(raw.stats ?? {}) },
    unlocks: Array.isArray(raw.unlocks) ? raw.unlocks.filter((x: any) => typeof x === 'string') : [],
    cosmetics: { ...base.cosmetics, ...(raw.cosmetics ?? {}) },
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
    const txt = s.getItem(slotKey(getActiveSlot()));
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
    s.setItem(slotKey(getActiveSlot()), JSON.stringify(save));
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
  // A finished cup is terminal — never persist it (avoids a stale 'done' blob).
  save.tournament = t && t.phase === 'done' ? null : t;
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

// Spend coins atomically; returns false (and changes nothing) if too poor.
export function spendCoins(n: number): boolean {
  const save = loadSave();
  if (save.coins < n) return false;
  save.coins -= n;
  writeSave(save);
  return true;
}

export function isUnlocked(id: string): boolean {
  return loadSave().unlocks.includes(id);
}

export function unlockItem(id: string): void {
  const save = loadSave();
  if (!save.unlocks.includes(id)) {
    save.unlocks.push(id);
    writeSave(save);
  }
}

export function equipCosmetic(slot: keyof import('../data/types').Cosmetics, value: string): void {
  const save = loadSave();
  save.cosmetics = { ...save.cosmetics, [slot]: value };
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
      s.removeItem(slotKey(getActiveSlot()));
    } catch {
      /* ignore */
    }
  }
}
