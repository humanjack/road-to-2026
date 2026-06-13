import Phaser from 'phaser';
import { C } from '../ui/theme';
import { loadSave } from '../core/save';

// BootScene: generate the handful of runtime textures we need (no external
// art assets — everything is drawn), load the save file, then hand off to Menu.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.makeSoftCircle('softcircle', 64, C.white);
    this.makeRing('ring', 64, C.white);
    this.makeSpark('spark', 12, C.white);

    // Prime the save system (creates a default save if none exists).
    loadSave();

    this.scene.start('Menu');
  }

  // A radial-ish soft dot built from stacked translucent circles — used for
  // glows, ball trails and particle bursts (tinted at use site).
  private makeSoftCircle(key: string, size: number, color: number): void {
    const g = this.add.graphics();
    const r = size / 2;
    for (let i = 6; i >= 1; i--) {
      g.fillStyle(color, 0.16);
      g.fillCircle(r, r, (r * i) / 6);
    }
    g.generateTexture(key, size, size);
    g.destroy();
  }

  private makeRing(key: string, size: number, color: number): void {
    const g = this.add.graphics();
    const r = size / 2;
    g.lineStyle(6, color, 1);
    g.strokeCircle(r, r, r - 4);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  private makeSpark(key: string, size: number, color: number): void {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillCircle(size / 2, size / 2, size / 2);
    g.generateTexture(key, size, size);
    g.destroy();
  }
}
