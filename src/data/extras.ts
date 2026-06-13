import type { Team } from './types';
import { TEAMS } from './teams';

// The unlockable all-star squad (World Eleven mode). Original identity — an
// invented cross-confederation select XI, not a real team. Quick Match only.
export const WORLD_ELEVEN: Team = {
  id: 'world-eleven',
  name: 'World Eleven',
  code: 'W11',
  confederation: 'ICL',
  ovr: 99,
  tier: 5,
  attack: 99,
  midfield: 98,
  defense: 96,
  pace: 98,
  colors: { primary: '#FFC53D', secondary: '#1A1240', accent: '#FF2E88' },
  formation: '4-3-3',
  playStyle: 'All-Star Surge',
  star: { name: 'Capt. Aurora', position: 'ST', archetype: 'galaxy of stars' },
  isHost: false,
};

export type ShopItemType = 'team' | 'ball' | 'pitch';

export interface ShopItem {
  id: string;
  name: string;
  desc: string;
  cost: number;
  type: ShopItemType;
  // for cosmetics: the cosmetic slot value applied when equipped
  cosmeticValue?: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'world-eleven', name: 'World Eleven', desc: 'Unlock the all-star squad for Quick Match', cost: 600, type: 'team' },
  { id: 'ball-gold', name: 'Aurora Gold Ball', desc: 'A gleaming gold match ball', cost: 150, type: 'ball', cosmeticValue: 'gold' },
  { id: 'ball-plasma', name: 'Plasma Ball', desc: 'Crackling magenta plasma', cost: 300, type: 'ball', cosmeticValue: 'plasma' },
  { id: 'pitch-aurora', name: 'Aurora Pitch', desc: 'Play beneath the northern lights', cost: 250, type: 'pitch', cosmeticValue: 'aurora' },
];

// Resolve any playable team by id (the 48 roster + the World Eleven extra).
export function resolveTeam(id: string): Team | undefined {
  return id === WORLD_ELEVEN.id ? WORLD_ELEVEN : TEAMS.find((t) => t.id === id);
}

// Resolve the active ball colour from the equipped cosmetic.
export function ballColor(cosmetic: string): number {
  switch (cosmetic) {
    case 'gold':
      return 0xffc53d;
    case 'plasma':
      return 0xff2e88;
    default:
      return 0xffffff;
  }
}
