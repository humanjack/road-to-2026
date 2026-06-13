import Phaser from 'phaser';
import { C, CSS, FONT_DISPLAY, FONT_BODY, GAME_W, GAME_H } from '../ui/theme';
import { hasSavedTournament, getSave } from '../core/save';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(C.indigo);
    this.drawBackdrop();

    const cx = GAME_W / 2;

    this.add
      .text(cx, 150, "THE GLOBE CUP", {
        fontFamily: FONT_BODY,
        fontSize: '22px',
        color: CSS.gold,
      })
      .setOrigin(0.5)
      .setLetterSpacing(8);

    this.add
      .text(cx, 232, 'GROUNDSWELL', {
        fontFamily: FONT_DISPLAY,
        fontSize: '92px',
        color: CSS.light,
      })
      .setOrigin(0.5);

    this.add
      .text(cx + 350, 196, "'26", {
        fontFamily: FONT_DISPLAY,
        fontSize: '52px',
        color: CSS.surge,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 308, 'W O R L D   E L E V E N', {
        fontFamily: FONT_DISPLAY,
        fontSize: '30px',
        color: CSS.cyan,
      })
      .setOrigin(0.5);

    // Aurora Sphere mark
    this.drawSphere(cx, 430);

    const continueAvailable = hasSavedTournament();

    const buttons: { label: string; onClick: () => void; primary?: boolean }[] = [];
    if (continueAvailable) {
      buttons.push({ label: 'CONTINUE TOURNAMENT', primary: true, onClick: () => this.scene.start('Tournament') });
      buttons.push({ label: 'NEW TOURNAMENT', onClick: () => this.startTeamSelect() });
    } else {
      buttons.push({ label: 'NEW TOURNAMENT', primary: true, onClick: () => this.startTeamSelect() });
    }
    buttons.push({ label: 'QUICK MATCH', onClick: () => this.startTeamSelect('quick') });

    let y = 540;
    for (const b of buttons) {
      this.makeButton(cx, y, b.label, b.onClick, b.primary);
      y += 64;
    }

    const save = getSave();
    this.add
      .text(GAME_W - 24, GAME_H - 20, `Coins ${save.coins}  ·  Cups ${save.stats.tournamentsWon}`, {
        fontFamily: FONT_BODY,
        fontSize: '16px',
        color: CSS.mid,
      })
      .setOrigin(1, 1);

    this.add
      .text(24, GAME_H - 20, '48 nations · one surge · lift the sphere', {
        fontFamily: FONT_BODY,
        fontSize: '16px',
        color: CSS.mid,
      })
      .setOrigin(0, 1);
  }

  private startTeamSelect(mode: 'tournament' | 'quick' = 'tournament'): void {
    this.scene.start('TeamSelect', { mode });
  }

  private drawBackdrop(): void {
    const g = this.add.graphics();
    // layered "surge wave" bands along the bottom
    g.fillStyle(C.deep, 1);
    g.fillRect(0, 0, GAME_W, GAME_H);
    const bands = [
      { y: GAME_H - 120, color: C.surge, a: 0.18 },
      { y: GAME_H - 80, color: C.flare, a: 0.16 },
      { y: GAME_H - 44, color: C.cyan, a: 0.14 },
    ];
    for (const b of bands) {
      g.fillStyle(b.color, b.a);
      g.fillRect(0, b.y, GAME_W, GAME_H - b.y);
    }
    // 48-dot motif top-left
    for (let r = 0; r < 6; r++) {
      for (let col = 0; col < 8; col++) {
        g.fillStyle(col % 3 === 0 ? C.cyan : C.gold, 0.5);
        g.fillCircle(40 + col * 14, 40 + r * 14, 2.4);
      }
    }
  }

  private drawSphere(x: number, y: number): void {
    const g = this.add.graphics();
    g.fillStyle(C.cyan, 0.12);
    g.fillCircle(x, y, 60);
    g.lineStyle(2, C.cyan, 0.5);
    g.strokeCircle(x, y, 60);
    g.fillStyle(C.gold, 1);
    g.fillCircle(x, y, 42);
    g.fillStyle(0xffe39a, 0.85);
    g.fillCircle(x - 12, y - 12, 24);
    // aurora arcs
    g.lineStyle(4, C.lime, 0.6);
    g.beginPath();
    g.arc(x, y, 78, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340));
    g.strokePath();
    g.lineStyle(3, C.surge, 0.5);
    g.beginPath();
    g.arc(x, y, 88, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(335));
    g.strokePath();
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void, primary = false): void {
    const w = 360;
    const h = 52;
    const g = this.add.graphics();
    const draw = (hover: boolean) => {
      g.clear();
      const fill = primary ? C.surge : C.dark;
      g.fillStyle(hover ? C.cyan : fill, primary ? 1 : 0.85);
      g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
      g.lineStyle(2, hover ? C.light : C.mid, 0.8);
      g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    };
    draw(false);
    const txt = this.add
      .text(x, y, label, { fontFamily: FONT_DISPLAY, fontSize: '22px', color: CSS.white })
      .setOrigin(0.5);
    const zone = this.add.zone(x, y, w, h).setRectangleDropZone(w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      draw(true);
      txt.setColor(CSS.deep);
    });
    zone.on('pointerout', () => {
      draw(false);
      txt.setColor(CSS.white);
    });
    zone.on('pointerdown', () => {
      this.tweens.add({ targets: [txt], scale: 0.94, duration: 60, yoyo: true });
      this.time.delayedCall(70, onClick);
    });
  }
}
