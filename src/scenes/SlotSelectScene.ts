import Phaser from 'phaser';
import { C, CSS, FONT_DISPLAY, FONT_BODY, GAME_W, GAME_H } from '../ui/theme';
import { getActiveSlot, setActiveSlot, getSlotSummaries, deleteSlot, type SlotSummary } from '../core/save';
import { resolveTeam } from '../data/extras';
import { displayName } from '../data/names';
import { audio } from '../core/audio';

export class SlotSelectScene extends Phaser.Scene {
  constructor() {
    super('SlotSelect');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(C.indigo);
    this.add
      .text(GAME_W / 2, 70, 'SAVE SLOTS', { fontFamily: FONT_DISPLAY, fontSize: '40px', color: CSS.light })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 106, 'Each slot is a separate career — coins, cups and progress', {
        fontFamily: FONT_BODY,
        fontSize: '16px',
        color: CSS.mid,
      })
      .setOrigin(0.5);

    const summaries = getSlotSummaries();
    const active = getActiveSlot();
    const cardW = 340;
    const cardH = 300;
    const gap = 30;
    const startX = (GAME_W - (3 * cardW + 2 * gap)) / 2;
    const y = 180;
    summaries.forEach((s, i) => this.makeSlot(s, startX + i * (cardW + gap), y, cardW, cardH, active));

    const back = this.add
      .text(GAME_W / 2, GAME_H - 56, 'BACK', {
        fontFamily: FONT_DISPLAY,
        fontSize: '22px',
        color: CSS.white,
        backgroundColor: CSS.dark,
        padding: { x: 26, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      audio.play('ui');
      this.scene.start('Menu');
    });
  }

  private makeSlot(s: SlotSummary, x: number, y: number, w: number, h: number, active: number): void {
    const isActive = s.slot === active;
    const g = this.add.graphics();
    g.fillStyle(isActive ? C.dark : C.deep, 0.92);
    g.fillRoundedRect(x, y, w, h, 12);
    g.lineStyle(isActive ? 3 : 1.5, isActive ? C.gold : C.mid, isActive ? 1 : 0.5);
    g.strokeRoundedRect(x, y, w, h, 12);

    this.add
      .text(x + w / 2, y + 28, `SLOT ${s.slot + 1}`, { fontFamily: FONT_DISPLAY, fontSize: '24px', color: CSS.cyan })
      .setOrigin(0.5);
    if (isActive) {
      this.add
        .text(x + w / 2, y + 54, 'ACTIVE', { fontFamily: FONT_BODY, fontSize: '13px', color: CSS.gold })
        .setOrigin(0.5);
    }

    if (s.exists) {
      const team = s.userTeamId ? resolveTeam(s.userTeamId) : null;
      const lines = [
        `Coins: ${s.coins}`,
        `Cups won: ${s.cups}`,
        s.inProgress && team ? `Cup in progress: ${displayName(team)}` : 'No active cup',
      ];
      lines.forEach((l, i) => {
        this.add
          .text(x + w / 2, y + 100 + i * 30, l, { fontFamily: FONT_BODY, fontSize: '16px', color: CSS.light })
          .setOrigin(0.5);
      });
    } else {
      this.add
        .text(x + w / 2, y + 130, 'EMPTY', { fontFamily: FONT_DISPLAY, fontSize: '22px', color: CSS.mid })
        .setOrigin(0.5);
    }

    // SELECT
    this.slotButton(x + w / 2, y + h - 70, w - 60, isActive ? 'SELECTED' : 'SELECT', isActive ? C.lime : C.surge, () => {
      setActiveSlot(s.slot);
      audio.play('ui');
      this.scene.start('Menu');
    });
    // DELETE (only if data exists)
    if (s.exists) {
      this.slotButton(x + w / 2, y + h - 24, w - 60, 'DELETE', C.dark, () => {
        deleteSlot(s.slot);
        audio.play('save');
        this.scene.restart();
      });
    }
  }

  private slotButton(cx: number, cy: number, w: number, label: string, color: number, onClick: () => void): void {
    const hh = 36;
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRoundedRect(cx - w / 2, cy - hh / 2, w, hh, 8);
    this.add.text(cx, cy, label, { fontFamily: FONT_DISPLAY, fontSize: '16px', color: CSS.white }).setOrigin(0.5);
    const z = this.add.zone(cx, cy, w, hh).setInteractive({ useHandCursor: true });
    z.on('pointerdown', () => {
      audio.resume();
      onClick();
    });
  }
}
