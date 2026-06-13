import Phaser from 'phaser';
import { C, CSS, FONT_DISPLAY, FONT_BODY, GAME_W, GAME_H } from '../ui/theme';
import { audio } from '../core/audio';
import { getSave } from '../core/save';
import { drawTrophy } from '../ui/trophy';

// Explicit, typed match outcome — the single source of truth for celebration
// tiers (trophy size, confetti, count-up tint). Never infer this from `accent`:
// a quick-match DRAW and a tournament WIN both use gold, so colour-sniffing
// would fire a celebration on a draw.
export type Outcome = 'win' | 'draw' | 'loss';

export interface ResultData {
  title: string;
  subtitle?: string;
  lines?: string[];
  accent?: number;
  outcome?: Outcome;
  nextScene: string;
  buttonLabel?: string;
  // Optional scoreline — when present, the Result screen shows a large
  // animated count-up + team-coloured stat lines instead of the plain
  // subtitle scoreline. Absent for the tournament-champion screen.
  homeCode?: string;
  awayCode?: string;
  homeGoals?: number;
  awayGoals?: number;
  userIsHome?: boolean;
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

    // Trophy — the focal symbol of the result. Drawn before the title so it
    // rises BEHIND the headline text. Full gold for a win, muted+smaller for
    // a draw/defeat so the screen still has a centrepiece.
    this.drawResultTrophy(cx, data.outcome === 'win');

    // Celebrate a win/champion with falling confetti (skipped for draw/defeat,
    // and entirely suppressed under reduceMotion).
    if (data.outcome === 'win' && !getSave().settings.reduceMotion) {
      this.spawnConfetti();
    }

    this.add.text(cx, 230, data.title, { fontFamily: FONT_DISPLAY, fontSize: '64px', color: '#' + accent.toString(16).padStart(6, '0') }).setOrigin(0.5);

    const hasScore = data.homeGoals !== undefined && data.awayGoals !== undefined;
    if (hasScore) {
      this.drawScoreline(cx, data);
    } else if (data.subtitle) {
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
    btn.on('pointerdown', () => {
      audio.resume();
      audio.play('ui');
      this.scene.start(data.nextScene);
    });
  }

  private drawResultTrophy(cx: number, win: boolean): void {
    const restY = 108;
    const baseScale = win ? 0.85 : 0.55;
    const trophy = drawTrophy(this, cx, restY, baseScale, win).setDepth(0);

    if (getSave().settings.reduceMotion) return;

    // rise up from below, then settle into a slow breathing pulse (trophy)
    trophy.y = GAME_H + 140;
    this.tweens.add({
      targets: trophy,
      y: restY,
      duration: 800,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: trophy,
          scale: baseScale * 1.05,
          duration: 1250,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });
  }

  // Big animated scoreline (counts up from 0-0) plus two team-coloured stat
  // lines. Colour-independent: the user's side carries a "YOU" tag and a
  // FILLED marker; the opponent gets an OUTLINE marker — so attribution never
  // relies on hue alone (mirrors the pitch centre-dot discipline).
  private drawScoreline(cx: number, data: ResultData): void {
    const hg = data.homeGoals ?? 0;
    const ag = data.awayGoals ?? 0;
    const draw = data.outcome === 'draw';
    const userIsHome = data.userIsHome ?? true;

    const score = this.add
      .text(cx, 300, '0 - 0', { fontFamily: FONT_DISPLAY, fontSize: '56px', color: CSS.gold })
      .setOrigin(0.5)
      .setDepth(2);
    if (getSave().settings.reduceMotion) {
      score.setText(`${hg} - ${ag}`);
    } else {
      const c = { h: 0, a: 0 };
      this.tweens.add({
        targets: c,
        h: hg,
        a: ag,
        duration: 1100,
        ease: 'Quad.easeOut',
        onUpdate: () => score.setText(`${Math.round(c.h)} - ${Math.round(c.a)}`),
        onComplete: () => score.setText(`${hg} - ${ag}`),
      });
    }

    const homeTint = draw ? CSS.light : userIsHome ? CSS.surge : CSS.cyan;
    const awayTint = draw ? CSS.light : userIsHome ? CSS.cyan : CSS.surge;
    this.drawSideStat(cx - 150, 352, data.homeCode ?? 'HOME', hg, homeTint, !draw && userIsHome);
    this.drawSideStat(cx + 150, 352, data.awayCode ?? 'AWAY', ag, awayTint, !draw && !userIsHome);
  }

  private drawSideStat(x: number, y: number, code: string, goals: number, color: string, isUser: boolean): void {
    const colNum = Phaser.Display.Color.HexStringToColor(color).color;
    const g = this.add.graphics().setDepth(2);
    if (isUser) {
      g.fillStyle(colNum, 1);
      g.fillCircle(x - 48, y, 6);
    } else {
      g.lineStyle(2, colNum, 1);
      g.strokeCircle(x - 48, y, 6);
    }
    this.add
      .text(x - 34, y, `${code}  ${goals}`, { fontFamily: FONT_DISPLAY, fontSize: '24px', color })
      .setOrigin(0, 0.5)
      .setDepth(2);
    if (isUser) {
      this.add
        .text(x - 34, y - 26, 'YOU', { fontFamily: FONT_BODY, fontSize: '12px', color: CSS.gold })
        .setOrigin(0, 0.5)
        .setDepth(2)
        .setLetterSpacing(2);
    }
  }

  // ~70 palette-coloured paper pieces cascading from the top edge, drifting and
  // tumbling as they fall, then fading and self-destroying. Win-only; gated by
  // the caller on reduceMotion.
  private spawnConfetti(): void {
    const colors = [C.surge, C.cyan, C.lime, C.gold, C.flare];
    for (let i = 0; i < 70; i++) {
      const x = Phaser.Math.Between(0, GAME_W);
      const col = colors[Phaser.Math.Between(0, colors.length - 1)];
      const piece = this.add.rectangle(x, Phaser.Math.Between(-40, -10), 4, 7, col).setDepth(60);
      this.tweens.add({
        targets: piece,
        y: GAME_H + 40,
        x: x + Phaser.Math.Between(-180, 180),
        angle: Phaser.Math.Between(360, 1080),
        alpha: { from: 1, to: 0 },
        duration: Phaser.Math.Between(1600, 2200),
        delay: Phaser.Math.Between(0, 700),
        ease: 'Quad.easeIn',
        onComplete: () => piece.destroy(),
      });
    }
  }
}
