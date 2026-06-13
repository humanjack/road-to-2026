import Phaser from 'phaser';
import { C, CSS, FONT_DISPLAY, FONT_BODY, GAME_W, GAME_H } from '../ui/theme';
import { hasSavedTournament, getSave, isUnlocked } from '../core/save';
import { audio } from '../core/audio';
import { TEAMS } from '../data/teams';
import { WORLD_ELEVEN } from '../data/extras';
import { RNG, randomSeed } from '../core/rng';
import { transitionTo } from '../ui/transitions';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(C.indigo);
    // Soft fade + slight zoom-out on entry (skipped under reduceMotion).
    if (!getSave().settings.reduceMotion) {
      this.cameras.main.fadeIn(600, 14, 10, 36);
      this.cameras.main.setZoom(1.08);
      this.cameras.main.zoomTo(1, 700, 'Quad.easeOut');
    }
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
      buttons.push({ label: 'CONTINUE TOURNAMENT', primary: true, onClick: () => transitionTo(this, 'Tournament') });
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

    // top-right utility buttons
    this.cornerButton(GAME_W - 90, 40, 'SETTINGS', () => transitionTo(this, 'Settings'));
    this.cornerButton(GAME_W - 230, 40, 'SHOP', () => transitionTo(this, 'Shop'));
    this.cornerButton(GAME_W - 370, 40, 'SAVES', () => transitionTo(this, 'SlotSelect'));
    if (isUnlocked(WORLD_ELEVEN.id)) {
      this.cornerButton(GAME_W - 510, 40, 'WORLD XI', () => this.launchWorldEleven());
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
      .text(24, GAME_H - 36, '48 nations · one surge · lift the sphere', {
        fontFamily: FONT_BODY,
        fontSize: '16px',
        color: CSS.mid,
      })
      .setOrigin(0, 1);
    this.add
      .text(24, GAME_H - 16, 'Original game — not affiliated with FIFA or any official tournament.', {
        fontFamily: FONT_BODY,
        fontSize: '12px',
        color: CSS.dark,
      })
      .setOrigin(0, 1)
      .setColor(CSS.mid);
  }

  private cornerButton(cx: number, cy: number, label: string, onClick: () => void): void {
    const w = 120;
    const h = 36;
    const g = this.add.graphics();
    g.fillStyle(C.dark, 0.9);
    g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
    g.lineStyle(1.5, C.mid, 0.6);
    g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
    const t = this.add
      .text(cx, cy, label, { fontFamily: FONT_DISPLAY, fontSize: '15px', color: CSS.light })
      .setOrigin(0.5);
    const z = this.add.zone(cx, cy, w, h).setInteractive({ useHandCursor: true });
    z.on('pointerover', () => t.setColor(CSS.cyan));
    z.on('pointerout', () => t.setColor(CSS.light));
    z.on('pointerdown', () => {
      audio.resume();
      audio.play('ui');
      onClick();
    });
  }

  private startTeamSelect(mode: 'tournament' | 'quick' = 'tournament'): void {
    transitionTo(this, 'TeamSelect', { mode });
  }

  // World Eleven mode: play the unlocked all-star squad vs a random nation.
  private launchWorldEleven(): void {
    const rng = new RNG(randomSeed());
    const opp = rng.pick(TEAMS);
    this.scene.start('Match', {
      homeId: WORLD_ELEVEN.id,
      awayId: opp.id,
      userTeamId: WORLD_ELEVEN.id,
      context: 'quick',
      difficulty: 'pro',
    });
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
    const rm = getSave().settings.reduceMotion;

    // Cyan halo (breathes in opacity).
    const halo = this.add.graphics();
    halo.fillStyle(C.cyan, 0.12);
    halo.fillCircle(x, y, 60);
    halo.lineStyle(2, C.cyan, 0.5);
    halo.strokeCircle(x, y, 60);

    // Aurora arcs in a container centred on the sphere (slowly orbit).
    const arcs = this.add.container(x, y);
    const ag = this.add.graphics();
    ag.lineStyle(4, C.lime, 0.6);
    ag.beginPath();
    ag.arc(0, 0, 78, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340));
    ag.strokePath();
    ag.lineStyle(3, C.surge, 0.5);
    ag.beginPath();
    ag.arc(0, 0, 88, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(335));
    ag.strokePath();
    arcs.add(ag);

    // Gold core + highlight (gently pulses).
    const core = this.add.container(x, y);
    const cg = this.add.graphics();
    cg.fillStyle(C.gold, 1);
    cg.fillCircle(0, 0, 42);
    cg.fillStyle(0xffe39a, 0.85);
    cg.fillCircle(-12, -12, 24);
    core.add(cg);

    if (!rm) {
      this.tweens.add({ targets: arcs, rotation: Math.PI * 2, duration: 16000, repeat: -1, ease: 'Linear' });
      this.tweens.add({ targets: core, scale: 1.06, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: halo, alpha: 0.5, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
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
      audio.resume();
      audio.play('ui');
      this.tweens.add({ targets: [txt], scale: 0.94, duration: 60, yoyo: true });
      this.time.delayedCall(70, onClick);
    });
  }
}
