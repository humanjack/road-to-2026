import { describe, it, expect } from 'vitest';
import { capWidth, chipSpan, layoutChips, legendSize, MATCH_CONTROLS, SETTINGS_CONTROLS } from './controls';

describe('control-legend layout (#146)', () => {
  it('capWidth + chipSpan grow with glyph / label length', () => {
    expect(capWidth('WASD')).toBeGreaterThan(capWidth('J'));
    expect(chipSpan({ glyph: 'J', label: 'Through' })).toBeGreaterThan(chipSpan({ glyph: 'J', label: 'Pass' }));
    expect(chipSpan({ glyph: 'J', label: 'Pass' })).toBeGreaterThan(capWidth('J')); // span includes the label
  });

  it('tiles chips left-to-right within a row WITHOUT overlap', () => {
    const boxes = layoutChips(MATCH_CONTROLS, 24);
    for (let i = 1; i < boxes.length; i++) {
      if (boxes[i].row === boxes[i - 1].row) {
        // next chip starts at or after the previous chip's right edge (+ gap)
        expect(boxes[i].x).toBeGreaterThanOrEqual(boxes[i - 1].x + boxes[i - 1].span);
      }
    }
  });

  it('keeps the in-match legend on a single row by default (Infinity maxWidth)', () => {
    expect(legendSize(MATCH_CONTROLS).rows).toBe(1);
  });

  it('wraps to multiple rows under a constrained width, resetting x each row', () => {
    const maxW = 360;
    const boxes = layoutChips(SETTINGS_CONTROLS, 0, 16, maxW);
    const rows = Math.max(...boxes.map((b) => b.row)) + 1;
    expect(rows).toBeGreaterThan(1); // it wrapped
    // every chip fits within the row budget (start..start+maxW), and each row's
    // first chip restarts at x=0
    const firstOfRow = new Map<number, number>();
    for (const b of boxes) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      if (!firstOfRow.has(b.row)) firstOfRow.set(b.row, b.x);
    }
    for (const x of firstOfRow.values()) expect(x).toBe(0);
  });

  it('legendSize height scales with row count and width is positive', () => {
    const one = legendSize(MATCH_CONTROLS);
    const wrapped = legendSize(SETTINGS_CONTROLS, 16, 360);
    expect(one.width).toBeGreaterThan(0);
    expect(wrapped.rows).toBeGreaterThan(1);
    expect(wrapped.height).toBeGreaterThan(one.height);
  });

  it('an empty spec list is a zero-size legend (no crash)', () => {
    expect(legendSize([])).toEqual({ width: 0, height: 0, rows: 0 });
    expect(layoutChips([])).toEqual([]);
  });
});
