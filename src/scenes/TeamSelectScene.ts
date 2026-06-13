import Phaser from 'phaser';
import { C, CSS, FONT_DISPLAY, FONT_BODY, GAME_W, GAME_H, CONFED_COLOR } from '../ui/theme';
import { TEAMS } from '../data/teams';
import { displayName } from '../data/names';
import type { Team, Difficulty } from '../data/types';
import { createTournament } from '../core/tournament';
import { getSave, saveTournament } from '../core/save';
import { randomSeed, RNG } from '../core/rng';
import { audio } from '../core/audio';
import { transitionTo, fadeInScene } from '../ui/transitions';

interface TeamSelectData {
  mode: 'tournament' | 'quick';
}

function hexToNum(hex: string): number {
  return Phaser.Display.Color.HexStringToColor(hex).color;
}

export class TeamSelectScene extends Phaser.Scene {
  private mode: 'tournament' | 'quick' = 'tournament';
  private selectedId: string | null = null;
  private difficulty: Difficulty = 'pro';
  private cardObjs: Record<string, { redraw: (sel: boolean) => void }> = {};
  private summaryText!: Phaser.GameObjects.Text;
  private startEnabled = false;
  private startBtn!: Phaser.GameObjects.Container;

  constructor() {
    super('TeamSelect');
  }

  create(data: TeamSelectData): void {
    this.mode = data?.mode ?? 'tournament';
    this.selectedId = null;
    this.startEnabled = false; // reset on every entry (scene instance is reused)
    this.cardObjs = {};
    this.cameras.main.setBackgroundColor(C.indigo);
    fadeInScene(this);

    this.add
      .text(40, 34, this.mode === 'quick' ? 'QUICK MATCH — PICK A NATION' : 'CHOOSE YOUR NATION', {
        fontFamily: FONT_DISPLAY,
        fontSize: '30px',
        color: CSS.light,
      })
      .setOrigin(0, 0.5);

    this.add
      .text(40, 70, `${TEAMS.length} teams · 12 groups · one Aurora Sphere`, {
        fontFamily: FONT_BODY,
        fontSize: '16px',
        color: CSS.mid,
      })
      .setOrigin(0, 0.5);

    this.buildDifficulty();
    this.buildGrid();
    this.buildBottomBar();

    // Back
    const back = this.add
      .text(GAME_W - 30, 36, '‹ BACK', { fontFamily: FONT_DISPLAY, fontSize: '18px', color: CSS.mid })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor(CSS.cyan));
    back.on('pointerout', () => back.setColor(CSS.mid));
    back.on('pointerdown', () => transitionTo(this, 'Menu'));
  }

  private buildDifficulty(): void {
    const labels: Difficulty[] = ['casual', 'pro', 'legend'];
    const chips: Phaser.GameObjects.Text[] = [];
    let x = GAME_W - 360;
    this.add
      .text(x - 16, 70, 'DIFFICULTY', { fontFamily: FONT_BODY, fontSize: '14px', color: CSS.mid })
      .setOrigin(1, 0.5);
    for (const d of labels) {
      const t = this.add
        .text(x, 70, d.toUpperCase(), {
          fontFamily: FONT_DISPLAY,
          fontSize: '16px',
          color: d === this.difficulty ? CSS.deep : CSS.mid,
          backgroundColor: d === this.difficulty ? CSS.gold : undefined,
          padding: { x: 10, y: 5 },
        })
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => {
        this.difficulty = d;
        chips.forEach((c, i) => {
          const on = labels[i] === d;
          c.setColor(on ? CSS.deep : CSS.mid);
          c.setBackgroundColor(on ? CSS.gold : '');
        });
      });
      chips.push(t);
      x += t.width + 14;
    }
  }

  private buildGrid(): void {
    const cols = 8;
    const cardW = 140;
    const cardH = 80;
    const gapX = 8;
    const gapY = 8;
    const startX = (GAME_W - (cols * cardW + (cols - 1) * gapX)) / 2;
    const startY = 108;

    TEAMS.forEach((team, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      this.makeCard(team, x, y, cardW, cardH);
    });
  }

  private makeCard(team: Team, x: number, y: number, w: number, h: number): void {
    const primary = hexToNum(team.colors.primary);
    const confColor = hexToNum(CONFED_COLOR[team.confederation] ?? '#ffffff');
    const reduced = getSave().settings.reduceMotion;
    // Build the whole card in a container centred on the cell so a hover lift
    // (scale) and glow halo behave as one unit and can pop above neighbours.
    const cx = x + w / 2;
    const cy = y + h / 2;
    const lx = -w / 2;
    const ly = -h / 2;
    const card = this.add.container(cx, cy).setDepth(1);

    const glow = this.add.graphics();
    const g = this.add.graphics();

    const drawGlow = (on: boolean) => {
      glow.clear();
      if (!on) return;
      glow.lineStyle(7, confColor, 0.16);
      glow.strokeRoundedRect(lx - 3, ly - 3, w + 6, h + 6, 11);
      glow.lineStyle(3, confColor, 0.4);
      glow.strokeRoundedRect(lx - 1, ly - 1, w + 2, h + 2, 9);
    };
    const redraw = (sel: boolean, hover: boolean) => {
      g.clear();
      g.fillStyle(C.dark, 0.9);
      g.fillRoundedRect(lx, ly, w, h, 8);
      // confederation-coloured left border — groups the 48 nations by region
      g.fillStyle(confColor, 0.95);
      g.fillRoundedRect(lx, ly, 6, h, { tl: 8, bl: 8, tr: 0, br: 0 });
      // faint kit-colour wash
      g.fillStyle(primary, 0.16);
      g.fillRoundedRect(lx, ly, w, h, 8);
      const stroke = sel ? C.gold : confColor;
      g.lineStyle(sel ? 3 : hover ? 2.5 : 1.2, stroke, sel || hover ? 1 : 0.5);
      g.strokeRoundedRect(lx, ly, w, h, 8);
    };

    const code = this.add.text(lx + 16, ly + 12, team.code, { fontFamily: FONT_DISPLAY, fontSize: '22px', color: CSS.white });
    const name = this.add
      .text(lx + 16, ly + 40, displayName(team), { fontFamily: FONT_BODY, fontSize: '13px', color: CSS.light })
      .setFixedSize(w - 24, 16);
    const ovr = this.add
      .text(lx + w - 12, ly + 12, String(team.ovr), { fontFamily: FONT_DISPLAY, fontSize: '20px', color: CSS.gold })
      .setOrigin(1, 0);
    const stars = this.add
      .text(lx + 16, ly + 58, '★'.repeat(team.tier), { fontFamily: FONT_BODY, fontSize: '13px', color: CSS.gold })
      .setOrigin(0, 0.5);
    card.add([glow, g, code, name, ovr, stars]);
    if (team.isHost) {
      const host = this.add
        .text(lx + w - 12, ly + h - 14, 'HOST', { fontFamily: FONT_DISPLAY, fontSize: '11px', color: CSS.cyan })
        .setOrigin(1, 0.5);
      card.add(host);
    }

    // apply full visual state (border, glow, depth, lift) for a given mode
    const apply = (sel: boolean, hover: boolean) => {
      redraw(sel, hover);
      drawGlow(sel || hover);
      card.setDepth(hover ? 10 : sel ? 5 : 1);
      const scale = hover ? 1.06 : sel ? 1.03 : 1;
      if (reduced) {
        card.setScale(scale);
      } else {
        this.tweens.killTweensOf(card);
        this.tweens.add({ targets: card, scale, duration: 110, ease: 'Quad.easeOut' });
      }
    };
    apply(false, false);

    const zone = this.add.zone(cx, cy, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      if (this.selectedId !== team.id) apply(false, true);
    });
    zone.on('pointerout', () => apply(this.selectedId === team.id, false));
    zone.on('pointerdown', () => this.select(team));
    this.cardObjs[team.id] = { redraw: (sel: boolean) => apply(sel, false) };
  }

  private select(team: Team): void {
    audio.resume();
    audio.play('ui');
    const prev = this.selectedId;
    this.selectedId = team.id;
    if (prev && this.cardObjs[prev]) this.cardObjs[prev].redraw(false);
    this.cardObjs[team.id].redraw(true);
    this.startEnabled = true;
    this.summaryText.setText(
      `${displayName(team).toUpperCase()}  ·  OVR ${team.ovr}  ·  ${team.formation}  ·  ${team.playStyle}\n` +
        `Star: ${team.star.name} (${team.star.position}) — ${team.star.archetype}`,
    );
    this.refreshStart();
  }

  private buildBottomBar(): void {
    const g = this.add.graphics();
    g.fillStyle(C.deep, 0.95);
    g.fillRect(0, GAME_H - 64, GAME_W, 64);
    g.lineStyle(2, C.dark, 1);
    g.lineBetween(0, GAME_H - 64, GAME_W, GAME_H - 64);

    this.summaryText = this.add.text(40, GAME_H - 48, 'Select a nation to begin.', {
      fontFamily: FONT_BODY,
      fontSize: '15px',
      color: CSS.mid,
      lineSpacing: 4,
    });

    this.startBtn = this.add.container(GAME_W - 140, GAME_H - 32);
    const bg = this.add.graphics();
    bg.fillStyle(C.dark, 1);
    bg.fillRoundedRect(-110, -22, 220, 44, 10);
    const label = this.add
      .text(0, 0, this.mode === 'quick' ? 'KICK OFF' : 'START CUP', {
        fontFamily: FONT_DISPLAY,
        fontSize: '22px',
        color: CSS.mid,
      })
      .setOrigin(0.5);
    this.startBtn.add([bg, label]);
    (this.startBtn as any)._bg = bg;
    (this.startBtn as any)._label = label;

    const zone = this.add
      .zone(GAME_W - 140, GAME_H - 32, 220, 44)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.confirmStart());
  }

  private refreshStart(): void {
    const bg = (this.startBtn as any)._bg as Phaser.GameObjects.Graphics;
    const label = (this.startBtn as any)._label as Phaser.GameObjects.Text;
    bg.clear();
    bg.fillStyle(this.startEnabled ? C.surge : C.dark, 1);
    bg.fillRoundedRect(-110, -22, 220, 44, 10);
    label.setColor(this.startEnabled ? CSS.white : CSS.mid);
  }

  private confirmStart(): void {
    if (!this.startEnabled || !this.selectedId) return;
    if (this.mode === 'quick') {
      const rng = new RNG(randomSeed());
      const opponents = TEAMS.filter((t) => t.id !== this.selectedId);
      const opp = rng.pick(opponents);
      this.scene.start('Match', {
        homeId: this.selectedId,
        awayId: opp.id,
        userTeamId: this.selectedId,
        context: 'quick',
        difficulty: this.difficulty,
      });
    } else {
      const seed = randomSeed();
      const state = createTournament(TEAMS, this.selectedId, this.difficulty, seed);
      saveTournament(state);
      transitionTo(this, 'Tournament');
    }
  }
}
