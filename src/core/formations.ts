// ---------------------------------------------------------------------------
// Team formations — pure data + a resolver. Each formation is an 11-slot table
// of { role, fx, fy } positions expressed as FRACTIONS of the pitch, with the
// home side attacking +x (so the GK sits near fx≈0 and the front line near
// fx≈0.7). The away side mirrors a slot to `1 - fx` at spawn. fy is the
// cross-field position (0 = far/top touchline, 1 = near/bottom).
//
// This replaces the old hard-coded 5-slot inline array in MatchScene so the
// live match fields a full 11-a-side shape (#183). Phaser-free + deterministic
// so it can be unit-tested in isolation. `Team.formation` (a cosmetic label
// until now) selects the shape via resolveFormation().
// ---------------------------------------------------------------------------

export type Role = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface FormationSlot {
  role: Role;
  fx: number; // along the pitch length, 0 (own goal) .. 1 (opponent goal)
  fy: number; // across the pitch, 0 (far touchline) .. 1 (near touchline)
}

// 4-3-3 — the default shape: a back four, a midfield three, a front three.
export const FORMATION_4_3_3: FormationSlot[] = [
  { role: 'GK', fx: 0.045, fy: 0.5 },
  { role: 'DEF', fx: 0.2, fy: 0.14 }, // LB
  { role: 'DEF', fx: 0.16, fy: 0.38 }, // LCB
  { role: 'DEF', fx: 0.16, fy: 0.62 }, // RCB
  { role: 'DEF', fx: 0.2, fy: 0.86 }, // RB
  { role: 'MID', fx: 0.42, fy: 0.3 }, // LCM
  { role: 'MID', fx: 0.4, fy: 0.5 }, // CM
  { role: 'MID', fx: 0.42, fy: 0.7 }, // RCM
  { role: 'FWD', fx: 0.66, fy: 0.2 }, // LW
  { role: 'FWD', fx: 0.74, fy: 0.5 }, // ST
  { role: 'FWD', fx: 0.66, fy: 0.8 }, // RW
];

// 4-4-2 — flat back four, midfield four, two up top.
export const FORMATION_4_4_2: FormationSlot[] = [
  { role: 'GK', fx: 0.045, fy: 0.5 },
  { role: 'DEF', fx: 0.2, fy: 0.14 },
  { role: 'DEF', fx: 0.16, fy: 0.38 },
  { role: 'DEF', fx: 0.16, fy: 0.62 },
  { role: 'DEF', fx: 0.2, fy: 0.86 },
  { role: 'MID', fx: 0.44, fy: 0.16 }, // LM
  { role: 'MID', fx: 0.4, fy: 0.4 }, // LCM
  { role: 'MID', fx: 0.4, fy: 0.6 }, // RCM
  { role: 'MID', fx: 0.44, fy: 0.84 }, // RM
  { role: 'FWD', fx: 0.7, fy: 0.4 }, // LST
  { role: 'FWD', fx: 0.7, fy: 0.6 }, // RST
];

// 3-5-2 — back three, wing-backs in a midfield five, a front two.
export const FORMATION_3_5_2: FormationSlot[] = [
  { role: 'GK', fx: 0.045, fy: 0.5 },
  { role: 'DEF', fx: 0.17, fy: 0.3 }, // LCB
  { role: 'DEF', fx: 0.15, fy: 0.5 }, // CB
  { role: 'DEF', fx: 0.17, fy: 0.7 }, // RCB
  { role: 'MID', fx: 0.4, fy: 0.1 }, // LWB
  { role: 'MID', fx: 0.42, fy: 0.34 }, // LCM
  { role: 'MID', fx: 0.4, fy: 0.5 }, // CM
  { role: 'MID', fx: 0.42, fy: 0.66 }, // RCM
  { role: 'MID', fx: 0.4, fy: 0.9 }, // RWB
  { role: 'FWD', fx: 0.72, fy: 0.42 }, // LST
  { role: 'FWD', fx: 0.72, fy: 0.58 }, // RST
];

export const FORMATIONS: Record<string, FormationSlot[]> = {
  '4-3-3': FORMATION_4_3_3,
  '4-4-2': FORMATION_4_4_2,
  '3-5-2': FORMATION_3_5_2,
};

export const DEFAULT_FORMATION = FORMATION_4_3_3;

/**
 * Resolve a team's formation label (e.g. '4-3-3', '4-2-3-1', '3-4-2-1') to a
 * concrete 11-slot table. Exact matches win; otherwise we approximate by the
 * defensive-line count (a back three → 3-5-2, a flat 4-4 → 4-4-2), falling back
 * to 4-3-3 for anything else. Always returns a valid 11-slot table. Pure.
 */
export function resolveFormation(label: string | undefined | null): FormationSlot[] {
  if (!label) return DEFAULT_FORMATION;
  const key = label.trim();
  if (FORMATIONS[key]) return FORMATIONS[key];
  if (key.startsWith('4-4')) return FORMATION_4_4_2;
  if (key.startsWith('3')) return FORMATION_3_5_2;
  return DEFAULT_FORMATION;
}
