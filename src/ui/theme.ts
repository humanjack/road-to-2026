// Central palette + typography, lifted from the GDD (Visual Design §7.6).
// Numeric values for Phaser, string values for CSS / text styles.

export const C = {
  surge: 0xff2e88, // Surge Magenta — primary accent
  indigo: 0x1a1240, // Deep Pitch Indigo — base background
  cyan: 0x19d3f0, // Electric Cyan — secondary accent
  lime: 0x7be83c, // Pitch Lime — pitch surface
  turfA: 0x2f8d3a, // vivid mowing stripe (deeper lime-green) — #128
  turfB: 0x3aa647, // vivid mowing stripe (lighter lime-green) — #128
  gold: 0xffc53d, // Aurora Gold — trophy / finals
  flare: 0xff7a33, // Flare Orange — energy / warning
  light: 0xf5f7ff,
  mid: 0xa9b0c8,
  dark: 0x3a3656,
  deep: 0x0e0a24,
  white: 0xffffff,
  black: 0x000000,
} as const;

export const CSS = {
  surge: '#ff2e88',
  indigo: '#1a1240',
  cyan: '#19d3f0',
  lime: '#7be83c',
  gold: '#ffc53d',
  flare: '#ff7a33',
  light: '#f5f7ff',
  mid: '#a9b0c8',
  dark: '#3a3656',
  deep: '#0e0a24',
  white: '#ffffff',
} as const;

// Per-confederation accent tokens (GDD §7.6).
export const CONFED_COLOR: Record<string, string> = {
  ICL: '#4c7df0',
  SBC: '#ff9e1b',
  EAU: '#1fb89a',
  SCB: '#9aa7c7',
  NTA: '#2bc4c9',
  BHC: '#7b5cff',
};

export const CONFED_NAME: Record<string, string> = {
  ICL: 'Iron Continent League',
  SBC: 'Sunbelt Confederation',
  EAU: 'Equatorial African Union',
  SCB: 'Silver Coast Bloc',
  NTA: 'North Triangle Alliance',
  BHC: 'Blue Horizon Circuit',
};

export const FONT_DISPLAY = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
export const FONT_BODY = '"Trebuchet MS", "Segoe UI", Arial, sans-serif';

// Design resolution — everything is laid out against this, then scaled to fit.
export const GAME_W = 1280;
export const GAME_H = 720;

export function hex(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}
