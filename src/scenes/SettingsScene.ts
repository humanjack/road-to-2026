import Phaser from 'phaser';
import { C, CSS, FONT_DISPLAY, FONT_BODY, GAME_W, GAME_H } from '../ui/theme';
import { getSave, updateSettings, clearSave } from '../core/save';
import type { GameSettings } from '../data/types';
import { audio } from '../core/audio';
import { transitionTo, fadeInScene } from '../ui/transitions';
import { buildControlLegend, SETTINGS_CONTROLS } from '../ui/controls';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('Settings');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(C.indigo);
    fadeInScene(this);

    this.add
      .text(GAME_W / 2, 56, 'SETTINGS', { fontFamily: FONT_DISPLAY, fontSize: '40px', color: CSS.light })
      .setOrigin(0.5);

    const s = getSave().settings;

    // --- left column: audio & display ---
    const lLabel = 120;
    const lCtrl = GAME_W / 2 - 150;
    this.section('AUDIO & DISPLAY', lLabel, 116);
    let y = 158;
    this.toggle('SOUND EFFECTS', 'sfx', s.sfx, lLabel, y, lCtrl);
    y += 62;
    this.toggle('MUSIC', 'music', s.music, lLabel, y, lCtrl);
    y += 62;
    this.toggle('MUTE ALL AUDIO', 'muted', s.muted, lLabel, y, lCtrl);
    y += 62;
    this.toggle('REDUCE MOTION', 'reduceMotion', s.reduceMotion, lLabel, y, lCtrl);
    y += 62;
    this.toggle('SLOW MOTION', 'slowMo', s.slowMo, lLabel, y, lCtrl);
    y += 62;
    this.toggle('FICTIONALIZED NATIONS', 'fictionalNations', s.fictionalNations, lLabel, y, lCtrl);

    // --- right column: controls (accessibility / veteran depth) ---
    const rLabel = GAME_W / 2 + 120;
    const rCtrl = GAME_W - 200;
    this.section('CONTROLS', rLabel, 116);
    let ry = 156;
    this.cycle('SPRINT', 'sprintMode', ['hold', 'toggle'], s.sprintMode, rLabel, ry, rCtrl);
    ry += 54;
    this.cycle('PASS ASSIST', 'passAssist', ['full', 'semi', 'manual'], s.passAssist, rLabel, ry, rCtrl);
    ry += 54;
    this.cycle('DEF. SWITCHING', 'defensiveSwitch', ['auto', 'manual'], s.defensiveSwitch, rLabel, ry, rCtrl);
    ry += 54;
    this.cycle('ZOOM', 'zoomLevel', ['wide', 'balanced', 'tight'], s.zoomLevel, rLabel, ry, rCtrl);
    ry += 54;
    this.cycle('GAME SPEED', 'gameSpeed', ['relaxed', 'standard', 'brisk'], s.gameSpeed, rLabel, ry, rCtrl);
    // glyph control legend (#146): the same grouped key-cap chips as the in-match
    // HUD, wrapped to the right column, plus an explicit touch-control description
    this.add
      .text(rLabel, ry + 50, 'IN MATCH', { fontFamily: FONT_DISPLAY, fontSize: '13px', color: CSS.mid })
      .setOrigin(0, 0);
    const legend = buildControlLegend(this, rLabel, ry + 72, SETTINGS_CONTROLS, GAME_W - rLabel - 24);
    this.add
      .text(rLabel, ry + 72 + legend.height + 10, 'Touch:  left half = move  ·  right half = shoot', {
        fontFamily: FONT_BODY,
        fontSize: '13px',
        color: CSS.mid,
      })
      .setOrigin(0, 0);

    // Legal disclaimer block
    const discY = 506;
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

  private section(label: string, x: number, y: number): void {
    this.add.text(x, y, label, { fontFamily: FONT_DISPLAY, fontSize: '16px', color: CSS.gold }).setOrigin(0, 0.5).setLetterSpacing(2);
  }

  private toggle(label: string, key: keyof GameSettings, value: boolean, labelX: number, y: number, ctrlX: number): void {
    this.add.text(labelX, y, label, { fontFamily: FONT_DISPLAY, fontSize: '18px', color: CSS.light }).setOrigin(0, 0.5);
    const w = 96;
    const h = 38;
    const g = this.add.graphics();
    const txt = this.add.text(ctrlX, y, '', { fontFamily: FONT_DISPLAY, fontSize: '17px', color: CSS.white }).setOrigin(0.5);
    let on = value;
    const draw = () => {
      g.clear();
      g.fillStyle(on ? C.lime : C.dark, 1);
      g.fillRoundedRect(ctrlX - w / 2, y - h / 2, w, h, 19);
      g.lineStyle(2, C.mid, 0.6);
      g.strokeRoundedRect(ctrlX - w / 2, y - h / 2, w, h, 19);
      txt.setText(on ? 'ON' : 'OFF').setColor(on ? CSS.deep : CSS.mid);
    };
    draw();
    const zone = this.add.zone(ctrlX, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      audio.resume();
      on = !on;
      draw();
      updateSettings({ [key]: on } as Partial<GameSettings>);
      audio.syncSettings();
      audio.play('ui');
    });
  }

  // A cycle control: tapping advances through `options`, persisting the choice.
  private cycle(label: string, key: keyof GameSettings, options: string[], current: string, labelX: number, y: number, ctrlX: number): void {
    this.add.text(labelX, y, label, { fontFamily: FONT_DISPLAY, fontSize: '18px', color: CSS.light }).setOrigin(0, 0.5);
    const w = 130;
    const h = 38;
    const g = this.add.graphics();
    const txt = this.add.text(ctrlX, y, '', { fontFamily: FONT_DISPLAY, fontSize: '16px', color: CSS.light }).setOrigin(0.5);
    let idx = Math.max(0, options.indexOf(current));
    const draw = () => {
      g.clear();
      g.fillStyle(C.deep, 1);
      g.fillRoundedRect(ctrlX - w / 2, y - h / 2, w, h, 10);
      g.lineStyle(2, C.cyan, 0.7);
      g.strokeRoundedRect(ctrlX - w / 2, y - h / 2, w, h, 10);
      txt.setText(`‹ ${options[idx].toUpperCase()} ›`);
    };
    draw();
    const zone = this.add.zone(ctrlX, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      audio.resume();
      idx = (idx + 1) % options.length;
      draw();
      updateSettings({ [key]: options[idx] } as Partial<GameSettings>);
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
