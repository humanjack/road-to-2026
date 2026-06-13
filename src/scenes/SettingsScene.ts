import Phaser from 'phaser';
import { C, CSS, FONT_DISPLAY, FONT_BODY, GAME_W, GAME_H } from '../ui/theme';
import { getSave, updateSettings, clearSave } from '../core/save';
import type { GameSettings } from '../data/types';
import { audio } from '../core/audio';
import { transitionTo, fadeInScene } from '../ui/transitions';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('Settings');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(C.indigo);
    fadeInScene(this);

    this.add
      .text(GAME_W / 2, 70, 'SETTINGS', { fontFamily: FONT_DISPLAY, fontSize: '40px', color: CSS.light })
      .setOrigin(0.5);

    const s = getSave().settings;
    let y = 150;
    this.toggle('SOUND EFFECTS', 'sfx', s.sfx, y);
    y += 64;
    this.toggle('MUSIC', 'music', s.music, y);
    y += 64;
    this.toggle('MUTE ALL AUDIO', 'muted', s.muted, y);
    y += 64;
    this.toggle('REDUCE MOTION', 'reduceMotion', s.reduceMotion, y);
    y += 64;
    this.toggle('FICTIONALIZED NATIONS', 'fictionalNations', s.fictionalNations, y);

    // Legal disclaimer block
    const discY = 470;
    const g = this.add.graphics();
    g.fillStyle(C.deep, 0.85);
    g.fillRoundedRect(GAME_W / 2 - 460, discY, 920, 120, 12);
    this.add
      .text(GAME_W / 2, discY + 18, 'LEGAL', { fontFamily: FONT_DISPLAY, fontSize: '16px', color: CSS.gold })
      .setOrigin(0.5, 0);
    this.add
      .text(
        GAME_W / 2,
        discY + 46,
        'GROUNDSWELL ’26 is an original work and is NOT affiliated with, endorsed by, or sponsored by FIFA,\n' +
          'any football federation, or any official tournament. All teams, crests, kits, players, and branding are\n' +
          'original or fictional. Turn on Fictionalized Nations for fully invented nation names.',
        { fontFamily: FONT_BODY, fontSize: '14px', color: CSS.mid, align: 'center', lineSpacing: 4 },
      )
      .setOrigin(0.5, 0);

    // Erase save
    this.button(GAME_W / 2 - 170, GAME_H - 60, 'ERASE SAVE', C.dark, () => {
      clearSave();
      audio.syncSettings();
      this.scene.restart();
    });
    this.button(GAME_W / 2 + 170, GAME_H - 60, 'BACK', C.surge, () => transitionTo(this, 'Menu'));
  }

  private toggle(label: string, key: keyof GameSettings, value: boolean, y: number): void {
    const cx = GAME_W / 2;
    this.add
      .text(cx - 300, y, label, { fontFamily: FONT_DISPLAY, fontSize: '22px', color: CSS.light })
      .setOrigin(0, 0.5);

    const w = 120;
    const h = 44;
    const x = cx + 240;
    const g = this.add.graphics();
    const txt = this.add.text(x, y, '', { fontFamily: FONT_DISPLAY, fontSize: '20px', color: CSS.white }).setOrigin(0.5);
    let on = value;
    const draw = () => {
      g.clear();
      g.fillStyle(on ? C.lime : C.dark, 1);
      g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 22);
      g.lineStyle(2, C.mid, 0.6);
      g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 22);
      txt.setText(on ? 'ON' : 'OFF').setColor(on ? CSS.deep : CSS.mid);
    };
    draw();
    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      audio.resume();
      on = !on;
      draw();
      updateSettings({ [key]: on } as Partial<GameSettings>);
      audio.syncSettings();
      audio.play('ui');
    });
  }

  private button(cx: number, cy: number, label: string, color: number, onClick: () => void): void {
    const w = 240;
    const h = 48;
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
    g.lineStyle(2, C.mid, 0.7);
    g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
    this.add.text(cx, cy, label, { fontFamily: FONT_DISPLAY, fontSize: '20px', color: CSS.white }).setOrigin(0.5);
    const z = this.add.zone(cx, cy, w, h).setInteractive({ useHandCursor: true });
    z.on('pointerdown', () => {
      audio.resume();
      audio.play('ui');
      onClick();
    });
  }
}
