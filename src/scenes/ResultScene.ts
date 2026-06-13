import Phaser from 'phaser';
import { C, CSS, FONT_DISPLAY, FONT_BODY, GAME_W, GAME_H } from '../ui/theme';

export interface ResultData {
  title: string;
  subtitle?: string;
  lines?: string[];
  accent?: number;
  nextScene: string;
  buttonLabel?: string;
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  create(data: ResultData): void {
    this.cameras.main.setBackgroundColor(C.indigo);
    const cx = GAME_W / 2;
    const accent = data.accent ?? C.gold;

    const g = this.add.graphics();
    g.fillStyle(accent, 0.1);
    g.fillRect(0, 180, GAME_W, 200);

    this.add.text(cx, 230, data.title, { fontFamily: FONT_DISPLAY, fontSize: '64px', color: '#' + accent.toString(16).padStart(6, '0') }).setOrigin(0.5);
    if (data.subtitle) {
      this.add.text(cx, 300, data.subtitle, { fontFamily: FONT_DISPLAY, fontSize: '28px', color: CSS.light }).setOrigin(0.5);
    }
    let y = 380;
    for (const line of data.lines ?? []) {
      this.add.text(cx, y, line, { fontFamily: FONT_BODY, fontSize: '18px', color: CSS.mid }).setOrigin(0.5);
      y += 30;
    }

    const label = data.buttonLabel ?? 'CONTINUE';
    const btn = this.add
      .text(cx, GAME_H - 110, label, {
        fontFamily: FONT_DISPLAY,
        fontSize: '24px',
        color: CSS.white,
        backgroundColor: CSS.surge,
        padding: { x: 28, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setBackgroundColor(CSS.cyan));
    btn.on('pointerout', () => btn.setBackgroundColor(CSS.surge));
    btn.on('pointerdown', () => this.scene.start(data.nextScene));
  }
}
