// Glyph-based control legend (#146): compact rounded key-cap chips + action
// labels, grouped so a new player can scan rather than read a run-on sentence.
// Vector primitives only (no asset files). The layout math is pure + unit-tested;
// the draw helper uses only the passed scene's methods, so this module has NO
// runtime Phaser dependency (Phaser is a type-only import) and stays test-safe.

import type Phaser from 'phaser';
import { C, CSS, FONT_DISPLAY, FONT_BODY } from './theme';

export interface ChipSpec {
  glyph: string; // the key-cap text (WASD, SPACE, J, …)
  label: string; // the action it performs
}

// In-match core legend — short labels so the row stays compact in the corner.
export const MATCH_CONTROLS: ChipSpec[] = [
  { glyph: 'WASD', label: 'Move' },
  { glyph: 'SPACE', label: 'Shoot' },
  { glyph: 'J', label: 'Pass' },
  { glyph: 'L', label: 'Through' },
  { glyph: 'I', label: 'Tackle' },
  { glyph: 'O', label: 'Skill' },
  { glyph: 'K', label: 'Switch' },
  { glyph: '1-4', label: 'View' },
];

// Fuller legend for the Settings reference (adds the slide + mute hints).
export const SETTINGS_CONTROLS: ChipSpec[] = [
  { glyph: 'WASD', label: 'Move' },
  { glyph: 'SPACE', label: 'Shoot' },
  { glyph: 'J', label: 'Pass' },
  { glyph: 'L', label: 'Through' },
  { glyph: 'I', label: 'Tackle / hold = slide' },
  { glyph: 'O', label: 'Skill' },
  { glyph: 'K', label: 'Switch' },
  { glyph: '1-4', label: 'Camera view' },
  { glyph: 'M', label: 'Mute' },
];

// Layout constants — these also drive the pure width math so the unit-tested
// layout matches exactly what gets drawn.
const GLYPH_CHAR_W = 9;
const CHIP_PAD = 9;
export const CHIP_H = 22;
const LABEL_CHAR_W = 7.2;
const LABEL_GAP = 6;
const ITEM_GAP = 16;
const ROW_GAP = 8;

/** Pixel width of just the rounded key-cap for a glyph. */
export function capWidth(glyph: string): number {
  return CHIP_PAD * 2 + glyph.length * GLYPH_CHAR_W;
}

/** Pixel span of a chip + its label (cap + gap + label text). */
export function chipSpan(spec: ChipSpec): number {
  return capWidth(spec.glyph) + LABEL_GAP + spec.label.length * LABEL_CHAR_W;
}

export interface ChipBox {
  x: number; // left edge within the legend (relative to startX)
  row: number; // 0-based wrap row
  capW: number; // key-cap width
  span: number; // full chip + label span
}

/**
 * Tile chips left-to-right from `startX`, wrapping to a new row when the next
 * chip would exceed `maxWidth`. Pure — no overlap within a row by construction.
 */
export function layoutChips(specs: ChipSpec[], startX = 0, gap = ITEM_GAP, maxWidth = Infinity): ChipBox[] {
  const out: ChipBox[] = [];
  let x = startX;
  let row = 0;
  for (const s of specs) {
    const span = chipSpan(s);
    if (x > startX && x + span > startX + maxWidth) {
      row++;
      x = startX;
    }
    out.push({ x, row, capW: capWidth(s.glyph), span });
    x += span + gap;
  }
  return out;
}

/** Total rendered size of a legend (max row width × row count). */
export function legendSize(specs: ChipSpec[], gap = ITEM_GAP, maxWidth = Infinity): { width: number; height: number; rows: number } {
  if (!specs.length) return { width: 0, height: 0, rows: 0 };
  const boxes = layoutChips(specs, 0, gap, maxWidth);
  let width = 0;
  let rows = 0;
  for (const b of boxes) {
    width = Math.max(width, b.x + b.span);
    rows = Math.max(rows, b.row + 1);
  }
  return { width, height: rows * CHIP_H + (rows - 1) * ROW_GAP, rows };
}

/**
 * Build the legend game objects ONCE at (x, yTop), growing downward across wrap
 * rows. Returns the created objects (for the camera-ignore list) + measured size.
 * Static — nothing here runs per frame.
 */
export function buildControlLegend(
  scene: Phaser.Scene,
  x: number,
  yTop: number,
  specs: ChipSpec[],
  maxWidth = Infinity,
  depth = 31,
): { objects: Phaser.GameObjects.GameObject[]; width: number; height: number } {
  const boxes = layoutChips(specs, x, ITEM_GAP, maxWidth);
  const g = scene.add.graphics().setDepth(depth);
  const objects: Phaser.GameObjects.GameObject[] = [g];
  specs.forEach((s, i) => {
    const b = boxes[i];
    const top = yTop + b.row * (CHIP_H + ROW_GAP);
    // deep chip bg + faint outline so it reads on the darkest AND brightest turf
    g.fillStyle(C.deep, 0.85);
    g.fillRoundedRect(b.x, top, b.capW, CHIP_H, 5);
    g.lineStyle(1, C.mid, 0.5);
    g.strokeRoundedRect(b.x, top, b.capW, CHIP_H, 5);
    const glyph = scene.add
      .text(b.x + b.capW / 2, top + CHIP_H / 2, s.glyph, { fontFamily: FONT_DISPLAY, fontSize: '12px', color: CSS.light })
      .setOrigin(0.5)
      .setDepth(depth);
    const label = scene.add
      .text(b.x + b.capW + LABEL_GAP, top + CHIP_H / 2, s.label, { fontFamily: FONT_BODY, fontSize: '13px', color: CSS.mid })
      .setOrigin(0, 0.5)
      .setDepth(depth);
    objects.push(glyph, label);
  });
  const size = legendSize(specs, ITEM_GAP, maxWidth);
  return { objects, width: size.width, height: size.height };
}
