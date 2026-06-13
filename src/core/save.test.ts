import { describe, it, expect, beforeEach, vi } from 'vitest';

const KEY = 'groundswell26.save.v1';

// Map-backed localStorage mock installed on a fake `window` — the save module
// reads window.localStorage, so this exercises the real persistence path in
// the plain node test environment (no jsdom needed).
let store: Map<string, string>;

function installStorage(): void {
  store = new Map();
  const ls = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  };
  (globalThis as any).window = { localStorage: ls };
  (globalThis as any).localStorage = ls;
}

// Each call returns a fresh save module (reset module-level `cache`).
async function freshSave() {
  vi.resetModules();
  return await import('./save');
}

async function makeTournament() {
  const { createTournament } = await import('./tournament');
  const { TEAMS } = await import('../data/teams');
  return createTournament(TEAMS, 'brazil', 'pro', 1);
}

describe('save', () => {
  beforeEach(() => {
    installStorage();
  });

  it('defaultSave has the expected shape', async () => {
    const s = await freshSave();
    const d = s.defaultSave();
    expect(d.version).toBe(1);
    expect(d.tournament).toBeNull();
    expect(d.coins).toBe(0);
    expect(d.settings).toEqual({ fictionalNations: false, sfx: true, music: true, reduceMotion: false, muted: false });
    expect(d.unlocks).toEqual([]);
    expect(d.cosmetics).toEqual({ ball: 'default', pitch: 'default' });
  });

  it('round-trips a tournament through storage', async () => {
    const s = await freshSave();
    s.saveTournament(await makeTournament());
    expect(store.get(KEY)).toBeTruthy();
    const s2 = await freshSave(); // reads from storage cold
    expect(s2.hasSavedTournament()).toBe(true);
    expect(s2.getSave().tournament?.userTeamId).toBe('brazil');
  });

  it('hasSavedTournament is false for a finished cup and never persists it', async () => {
    const s = await freshSave();
    const t = await makeTournament();
    t.phase = 'done';
    s.saveTournament(t);
    expect(s.getSave().tournament).toBeNull(); // terminal — dropped
    expect(s.hasSavedTournament()).toBe(false);
  });

  it('addCoins clamps at zero; spendCoins is atomic', async () => {
    const s = await freshSave();
    s.addCoins(50);
    s.addCoins(-100);
    expect(s.getSave().coins).toBe(0);
    s.addCoins(100);
    expect(s.spendCoins(60)).toBe(true);
    expect(s.getSave().coins).toBe(40);
    expect(s.spendCoins(100)).toBe(false); // too poor — unchanged
    expect(s.getSave().coins).toBe(40);
  });

  it('unlock / equip cosmetics persist', async () => {
    const s = await freshSave();
    expect(s.isUnlocked('ball-gold')).toBe(false);
    s.unlockItem('ball-gold');
    s.unlockItem('ball-gold'); // idempotent
    expect(s.isUnlocked('ball-gold')).toBe(true);
    expect(s.getSave().unlocks).toEqual(['ball-gold']);
    s.equipCosmetic('ball', 'gold');
    expect(s.getSave().cosmetics.ball).toBe('gold');
  });

  it('clearSave wipes cache and storage', async () => {
    const s = await freshSave();
    s.addCoins(500);
    s.unlockItem('x');
    s.clearSave();
    expect(s.getSave().coins).toBe(0);
    expect(store.get(KEY)).toBeUndefined();
  });

  describe('migrate()', () => {
    it('falls back to defaults on corrupt JSON', async () => {
      store.set(KEY, '{ not valid json');
      const s = await freshSave();
      expect(s.getSave().coins).toBe(0);
      expect(s.getSave().tournament).toBeNull();
    });

    it('merges partial settings over defaults', async () => {
      store.set(KEY, JSON.stringify({ version: 1, settings: { sfx: false } }));
      const s = await freshSave();
      const set = s.getSave().settings;
      expect(set.sfx).toBe(false);
      expect(set.music).toBe(true); // default preserved
      expect(set.fictionalNations).toBe(false);
    });

    it('drops a structurally invalid tournament', async () => {
      store.set(KEY, JSON.stringify({ version: 1, tournament: { groups: [], phase: 'groups' } }));
      const s = await freshSave();
      expect(s.getSave().tournament).toBeNull();
    });

    it('drops the tournament when the save version is newer than supported', async () => {
      const t = await makeTournament();
      store.set(KEY, JSON.stringify({ version: 99, tournament: t, coins: 7 }));
      const s = await freshSave();
      expect(s.getSave().tournament).toBeNull();
      expect(s.getSave().coins).toBe(7); // coins still recovered
    });

    it('accepts a structurally valid tournament', async () => {
      const t = await makeTournament();
      store.set(KEY, JSON.stringify({ version: 1, tournament: t }));
      const s = await freshSave();
      expect(s.getSave().tournament).toBeTruthy();
      expect(s.getSave().tournament?.groups.length).toBe(12);
    });
  });
});
