import type { Team } from './types';
import { getSave } from '../core/save';

// "Fictionalized Nations" mode: deterministically derive a clearly-invented
// nation name from each team (keeps a hint of the original for fun, but is not
// a real country). The most risk-averse shipping switch from the GDD's legal
// section — real country names off, original names on.

const SUFFIXES = ['ia', 'land', 'stan', 'ovia', 'onia', 'aria', 'grad', 'mark', 'heim', 'dor', 'ica', 'esia'];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const cache: Record<string, string> = {};

export function fictionalName(team: Team): string {
  if (cache[team.id]) return cache[team.id];
  const letters = team.name.replace(/[^A-Za-z]/g, '');
  const base = letters.slice(0, Math.min(4, Math.max(3, letters.length)));
  const suffix = SUFFIXES[hashStr(team.id) % SUFFIXES.length];
  const name = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase() + suffix;
  cache[team.id] = name;
  return name;
}

// Display name honouring the current Fictionalized Nations setting.
export function displayName(team: Team): string {
  try {
    return getSave().settings.fictionalNations ? fictionalName(team) : team.name;
  } catch {
    return team.name;
  }
}
