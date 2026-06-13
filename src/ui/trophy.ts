import Phaser from 'phaser';
import { C } from './theme';

// A fully procedural trophy (no art assets) drawn around a local (0,0) origin
// inside a Container, so callers can freely position, scale, depth-sort and
// tween it as one object. `win` toggles the celebratory gold treatment vs a
// muted (de-saturated) version used for draws/defeats and the menu shelf.
export function drawTrophy(
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale: number,
  win: boolean,
): Phaser.GameObjects.Container {
  const body = win ? C.gold : C.mid;
  const bodyDark = win ? 0xcf9a23 : 0x7e87a0;
  const hi = win ? 0xffe39a : C.light;

  const g = scene.add.graphics();

  // soft drop shadow under the base — grounds the trophy
  g.fillStyle(C.deep, 0.45);
  g.fillEllipse(0, 72, 96, 20);

  // handles (stroked arcs) drawn first so the bowl overlaps their inner edge
  g.lineStyle(7, body, 1);
  g.beginPath();
  g.arc(-40, -38, 22, Phaser.Math.DegToRad(40), Phaser.Math.DegToRad(300), false);
  g.strokePath();
  g.beginPath();
  // mirror of the left handle: angle θ -> 180-θ with reversed winding
  g.arc(40, -38, 22, Phaser.Math.DegToRad(140), Phaser.Math.DegToRad(-120), true);
  g.strokePath();

  // pedestal: wide base + narrower tier
  g.fillStyle(bodyDark, 1);
  g.fillRoundedRect(-48, 52, 96, 18, 5);
  g.fillStyle(body, 1);
  g.fillRoundedRect(-28, 34, 56, 20, 4);
  // stem
  g.fillRect(-7, 12, 14, 24);

  // bowl: tapered cup + knob + 3D rim
  g.fillStyle(body, 1);
  g.beginPath();
  g.moveTo(-44, -56);
  g.lineTo(44, -56);
  g.lineTo(20, 14);
  g.lineTo(-20, 14);
  g.closePath();
  g.fillPath();
  g.fillCircle(0, 13, 9); // knob where bowl meets stem
  g.fillEllipse(0, -56, 90, 22); // top rim
  g.fillStyle(C.deep, 0.22);
  g.fillEllipse(0, -56, 64, 13); // inner cup hollow
  // highlight sheen on the upper-left of the bowl
  g.fillStyle(hi, 0.85);
  g.fillEllipse(-15, -44, 18, 30);

  const container = scene.add.container(x, y, [g]);
  container.setScale(scale);
  return container;
}
