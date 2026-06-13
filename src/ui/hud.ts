import Phaser from 'phaser';
import { C, CSS, FONT_DISPLAY } from './theme';

// A small currency badge: a drawn glyph (gold coin / cyan cup-ring) with a
// faint glow halo, plus the count in emphasised display type. Built in a
// container anchored at its RIGHT edge (rightX, cy) so several can stack
// flush-right; optionally pops in with a scale tween.
export function drawCurrencyBadge(
  scene: Phaser.Scene,
  rightX: number,
  cy: number,
  kind: 'coins' | 'cups',
  value: number,
  animate: boolean,
): Phaser.GameObjects.Container {
  const isCoin = kind === 'coins';
  const col = isCoin ? C.gold : C.cyan;
  const cssCol = isCoin ? CSS.gold : CSS.cyan;

  const c = scene.add.container(rightX, cy);
  const t = scene.add.text(0, 0, String(value), { fontFamily: FONT_DISPLAY, fontSize: '18px', color: cssCol }).setOrigin(1, 0.5);
  const iconX = -Math.ceil(t.width) - 16;

  const g = scene.add.graphics();
  g.fillStyle(col, 0.16);
  g.fillCircle(iconX, 0, 12); // glow halo
  if (isCoin) {
    g.fillStyle(col, 1);
    g.fillCircle(iconX, 0, 8);
    g.fillStyle(0xffe39a, 0.9);
    g.fillCircle(iconX - 2.5, -2.5, 3.2); // sheen
  } else {
    g.lineStyle(2.5, col, 1);
    g.strokeCircle(iconX, 0, 8); // cup ring (echoes the Aurora Sphere)
    g.fillStyle(col, 1);
    g.fillCircle(iconX, 0, 3);
  }

  c.add([g, t]);
  if (animate) {
    c.setScale(0.6).setAlpha(0);
    scene.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 300, ease: 'Back.easeOut' });
  }
  return c;
}

// Career rank derived from cups won, shown as a small pill.
export function careerRank(cupsWon: number): { label: string; color: number } {
  if (cupsWon <= 0) return { label: 'ROOKIE', color: C.mid };
  if (cupsWon < 3) return { label: 'CONTENDER', color: C.cyan };
  if (cupsWon < 5) return { label: 'CHAMPION', color: C.gold };
  return { label: 'LEGEND', color: C.surge };
}
