import Phaser from 'phaser';
import { C, CSS, FONT_DISPLAY, FONT_BODY, GAME_W, GAME_H, hex } from '../ui/theme';
import { displayName } from '../data/names';
import { resolveTeam, ballColor } from '../data/extras';
import type { Team, MatchResult, MatchStats, Difficulty } from '../data/types';
import { recordMatch, getSave } from '../core/save';
import { penaltyShootout } from '../core/simMatch';
import { RNG, randomSeed } from '../core/rng';
import { audio } from '../core/audio';

export interface MatchInit {
  homeId: string;
  awayId: string;
  userTeamId: string;
  context: 'quick' | 'group' | 'knockout';
  difficulty?: Difficulty;
  matchId?: string;
  returnScene?: string;
  durationSec?: number;
  roundLabel?: string;
}

type Side = 'home' | 'away';
type Role = 'GK' | 'DEF' | 'MID' | 'FWD';
type PowerType = 'boost' | 'freeze' | 'magnet';

const POWERUPS: Record<PowerType, { label: string; color: number; icon: string; dur: number }> = {
  boost: { label: 'SURGE BOOST', color: 0x7be83c, icon: '»', dur: 5 },
  freeze: { label: 'DEEP FREEZE', color: 0x19d3f0, icon: '*', dur: 4 },
  magnet: { label: 'BALL MAGNET', color: 0xff2e88, icon: 'O', dur: 6 },
};

interface Player {
  side: Side;
  role: Role;
  hx: number; // formation home (px)
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  faceX: number;
  faceY: number;
  isUser: boolean;
  gfx: Phaser.GameObjects.Arc;
}

const PR = 15; // player radius
const BR = 9; // ball radius
const CHARGE_MS = 700; // shot charge window — shared by power calc + charge-bar render

const DIFF: Record<Difficulty, { aiSpeed: number; aiShootRange: number; aiAccuracy: number; userBoost: number }> = {
  casual: { aiSpeed: 0.86, aiShootRange: 230, aiAccuracy: 0.55, userBoost: 1.08 },
  pro: { aiSpeed: 1.0, aiShootRange: 270, aiAccuracy: 0.72, userBoost: 1.0 },
  legend: { aiSpeed: 1.12, aiShootRange: 320, aiAccuracy: 0.86, userBoost: 0.95 },
};

export class MatchScene extends Phaser.Scene {
  private cfg!: MatchInit;
  private home!: Team;
  private away!: Team;
  private homeColor = 0xffffff;
  private awayColor = 0xff0000;
  private rng!: RNG;
  private diff = DIFF.pro;

  // pitch geometry
  private px = 64;
  private py = 96;
  private pw = 1152;
  private ph = 560;
  private goalH = 168;

  private players: Player[] = [];
  private ball = { x: 0, y: 0, vx: 0, vy: 0, ownerIdx: -1 };
  private activeIdx = -1;

  private homeGoals = 0;
  private awayGoals = 0;
  private surgeHome = 0;
  private surgeAway = 0;

  // post-match stats (live matches only)
  private shots: Record<Side, number> = { home: 0, away: 0 };
  private onTarget: Record<Side, number> = { home: 0, away: 0 };
  private possSec: Record<Side, number> = { home: 0, away: 0 };

  // power-ups
  private powerups: { x: number; y: number; type: PowerType; gfx: Phaser.GameObjects.Container }[] = [];
  private puSpawnTimer = 6;
  private puEffects: Record<Side, { boost: number; magnet: number; frozen: number }> = {
    home: { boost: 0, magnet: 0, frozen: 0 },
    away: { boost: 0, magnet: 0, frozen: 0 },
  };
  private puHud!: Phaser.GameObjects.Text;

  private elapsed = 0;
  private duration = 120;
  private state: 'kickoff' | 'play' | 'goal' | 'fulltime' | 'pens' = 'kickoff';
  private stateTimer = 0;
  private kickingSide: Side = 'home';

  // input
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private chargeStart = 0;
  private charging = false;
  private touchVec = { x: 0, y: 0, active: false };

  // gfx
  private dyn!: Phaser.GameObjects.Graphics;
  private chargeText!: Phaser.GameObjects.Text;
  private pulse = 0; // per-frame pulse phase [0..1], reused by ring + surge fx
  private hudScore!: Phaser.GameObjects.Text;
  private hudClock!: Phaser.GameObjects.Text;
  private hudHome!: Phaser.GameObjects.Text;
  private hudAway!: Phaser.GameObjects.Text;
  private surgeBar!: Phaser.GameObjects.Graphics;
  private homeGrad: number[] = [];
  private awayGrad: number[] = [];
  private bannerText!: Phaser.GameObjects.Text;
  private ballGfx!: Phaser.GameObjects.Arc;
  private trailGfx!: Phaser.GameObjects.Graphics;
  private vignette!: Phaser.GameObjects.Graphics;
  private ballTrail: { x: number; y: number }[] = [];
  private reduceMotion = false;
  private ballTint = 0xffffff;
  private finished = false;

  constructor() {
    super('Match');
  }

  create(init: MatchInit): void {
    this.cfg = init;
    this.finished = false;
    this.home = resolveTeam(init.homeId)!;
    this.away = resolveTeam(init.awayId)!;
    this.duration = init.durationSec ?? 120;
    this.rng = new RNG(randomSeed());
    this.diff = DIFF[init.difficulty ?? ('pro' as Difficulty)] ?? DIFF.pro;

    this.homeColor = Phaser.Display.Color.HexStringToColor(this.home.colors.primary).color;
    let ac = Phaser.Display.Color.HexStringToColor(this.away.colors.primary).color;
    if (colorClash(this.homeColor, ac)) ac = Phaser.Display.Color.HexStringToColor(this.away.colors.secondary).color;
    if (colorClash(this.homeColor, ac)) ac = Phaser.Display.Color.HexStringToColor(this.away.colors.accent).color;
    this.awayColor = ac;
    this.homeGrad = this.surgeGradient(this.homeColor, 6);
    this.awayGrad = this.surgeGradient(this.awayColor, 6);

    this.homeGoals = 0;
    this.awayGoals = 0;
    this.surgeHome = 0;
    this.surgeAway = 0;
    this.shots = { home: 0, away: 0 };
    this.onTarget = { home: 0, away: 0 };
    this.possSec = { home: 0, away: 0 };
    this.prevHudHome = 0;
    this.prevHudAway = 0;
    this.elapsed = 0;
    this.players = [];
    this.powerups = [];
    this.puSpawnTimer = 6;
    this.puEffects = { home: { boost: 0, magnet: 0, frozen: 0 }, away: { boost: 0, magnet: 0, frozen: 0 } };

    this.drawPitch();
    this.buildHud();
    this.spawnPlayers();
    this.reduceMotion = getSave().settings.reduceMotion;
    this.ballTrail = [];
    this.trailGfx = this.add.graphics().setDepth(14);
    this.dyn = this.add.graphics().setDepth(20);
    this.chargeText = this.add
      .text(0, 0, '', { fontFamily: FONT_BODY, fontSize: '11px', color: CSS.light })
      .setOrigin(0.5)
      .setDepth(22)
      .setVisible(false);
    this.vignette = this.add.graphics().setDepth(45);
    const cos = getSave().cosmetics;
    this.ballTint = ballColor(cos.ball);
    this.ballGfx = this.add.circle(0, 0, BR, this.ballTint).setDepth(15).setStrokeStyle(2, 0x1a1240, 1);
    this.bannerText = this.add
      .text(GAME_W / 2, GAME_H / 2, '', { fontFamily: FONT_DISPLAY, fontSize: '72px', color: CSS.white })
      .setOrigin(0.5)
      .setDepth(50);

    this.setupInput();
    this.beginKickoff('home');
    this.showBanner('KICK OFF', C.cyan, 1000);
    this.state = 'kickoff';
    this.stateTimer = 1.0;

    audio.resume();
    audio.syncSettings();
    audio.startMusic(0.3);
    audio.play('whistle');
  }

  // --- setup -------------------------------------------------------------

  private drawPitch(): void {
    const aurora = getSave().cosmetics.pitch === 'aurora';
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(C.indigo, 1);
    g.fillRect(0, 0, GAME_W, GAME_H);
    // turf stripes (aurora cosmetic re-tints the grass cool/violet)
    const stripeA = aurora ? 0x1b2a4a : 0x16331f;
    const stripeB = aurora ? 0x16223d : 0x12281a;
    const stripes = 10;
    for (let i = 0; i < stripes; i++) {
      g.fillStyle(i % 2 === 0 ? stripeA : stripeB, 1);
      g.fillRect(this.px + (this.pw / stripes) * i, this.py, this.pw / stripes, this.ph);
    }
    if (aurora) {
      g.fillStyle(0x7b5cff, 0.12);
      g.fillRect(this.px, this.py, this.pw, this.ph * 0.4);
      g.fillStyle(0x19d3f0, 0.08);
      g.fillRect(this.px, this.py, this.pw, this.ph * 0.22);
    }
    g.lineStyle(3, 0xffffff, 0.5);
    g.strokeRect(this.px, this.py, this.pw, this.ph);
    g.lineBetween(this.px + this.pw / 2, this.py, this.px + this.pw / 2, this.py + this.ph);
    g.strokeCircle(this.px + this.pw / 2, this.py + this.ph / 2, 70);
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(this.px + this.pw / 2, this.py + this.ph / 2, 4);
    // goals + boxes
    const gy0 = this.py + this.ph / 2 - this.goalH / 2;
    const boxH = this.goalH + 120;
    const byy = this.py + this.ph / 2 - boxH / 2;
    g.strokeRect(this.px, byy, 120, boxH);
    g.strokeRect(this.px + this.pw - 120, byy, 120, boxH);
    // goal mouths
    g.lineStyle(6, C.gold, 0.95);
    g.lineBetween(this.px - 2, gy0, this.px - 2, gy0 + this.goalH);
    g.lineBetween(this.px + this.pw + 2, gy0, this.px + this.pw + 2, gy0 + this.goalH);
  }

  private buildHud(): void {
    const g = this.add.graphics().setDepth(30);
    g.fillStyle(C.deep, 0.92);
    g.fillRoundedRect(GAME_W / 2 - 230, 18, 460, 56, 12);
    this.hudHome = this.add
      .text(GAME_W / 2 - 150, 42, this.home.code, { fontFamily: FONT_DISPLAY, fontSize: '26px', color: CSS.white })
      .setOrigin(0.5)
      .setDepth(31);
    this.hudAway = this.add
      .text(GAME_W / 2 + 150, 42, this.away.code, { fontFamily: FONT_DISPLAY, fontSize: '26px', color: CSS.white })
      .setOrigin(0.5)
      .setDepth(31);
    // team-colour underlines beneath each code (which side just scored, at a glance)
    const ul = this.add.graphics().setDepth(31);
    ul.fillStyle(this.homeColor, 1);
    ul.fillRoundedRect(GAME_W / 2 - 150 - 28, 58, 56, 3, 1.5);
    ul.fillStyle(this.awayColor, 1);
    ul.fillRoundedRect(GAME_W / 2 + 150 - 28, 58, 56, 3, 1.5);
    this.hudScore = this.add
      .text(GAME_W / 2, 42, '0 - 0', { fontFamily: FONT_DISPLAY, fontSize: '42px', color: CSS.gold })
      .setOrigin(0.5)
      .setDepth(31);
    this.hudClock = this.add
      .text(GAME_W / 2, 66, "0'", { fontFamily: FONT_BODY, fontSize: '15px', color: CSS.mid })
      .setOrigin(0.5)
      .setDepth(31);
    // colour chips
    const cg = this.add.graphics().setDepth(31);
    cg.fillStyle(this.homeColor, 1);
    cg.fillRoundedRect(GAME_W / 2 - 224, 30, 14, 32, 4);
    cg.fillStyle(this.awayColor, 1);
    cg.fillRoundedRect(GAME_W / 2 + 210, 30, 14, 32, 4);

    this.surgeBar = this.add.graphics().setDepth(31);
    this.puHud = this.add
      .text(GAME_W / 2, 98, '', { fontFamily: FONT_DISPLAY, fontSize: '14px', color: CSS.lime })
      .setOrigin(0.5)
      .setDepth(31);

    // pause / quit
    const quit = this.add
      .text(GAME_W - 24, 30, '✕', { fontFamily: FONT_DISPLAY, fontSize: '24px', color: CSS.mid })
      .setOrigin(1, 0)
      .setDepth(31)
      .setInteractive({ useHandCursor: true });
    quit.on('pointerdown', () => this.abandon());

    this.add
      .text(24, GAME_H - 22, 'Move: WASD/Arrows   ·   Shoot: hold Space   ·   Pass: J   ·   Switch: K', {
        fontFamily: FONT_BODY,
        fontSize: '14px',
        color: CSS.mid,
      })
      .setOrigin(0, 1)
      .setDepth(31);
  }

  private spawnPlayers(): void {
    // formation as fractions of pitch (home attacks +x)
    const form: { role: Role; fx: number; fy: number }[] = [
      { role: 'GK', fx: 0.05, fy: 0.5 },
      { role: 'DEF', fx: 0.24, fy: 0.3 },
      { role: 'DEF', fx: 0.24, fy: 0.7 },
      { role: 'MID', fx: 0.46, fy: 0.5 },
      { role: 'FWD', fx: 0.66, fy: 0.42 },
    ];
    for (const f of form) {
      const hx = this.px + f.fx * this.pw;
      const hy = this.py + f.fy * this.ph;
      this.players.push(this.makePlayer('home', f.role, hx, hy));
    }
    for (const f of form) {
      const hx = this.px + (1 - f.fx) * this.pw;
      const hy = this.py + f.fy * this.ph;
      this.players.push(this.makePlayer('away', f.role, hx, hy));
    }
  }

  private makePlayer(side: Side, role: Role, hx: number, hy: number): Player {
    const color = side === 'home' ? this.homeColor : this.awayColor;
    const isGK = role === 'GK';
    const gfx = this.add
      .circle(hx, hy, PR, color)
      .setStrokeStyle(3, isGK ? C.lime : 0x0e0a24, 1)
      .setDepth(10);
    return {
      side,
      role,
      hx,
      hy,
      x: hx,
      y: hy,
      vx: 0,
      vy: 0,
      faceX: side === 'home' ? 1 : -1,
      faceY: 0,
      isUser: false,
      gfx,
    };
  }

  private setupInput(): void {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,J,K,SHIFT') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    // touch: left half = joystick, right half = shoot
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.x < GAME_W / 2) {
        this.touchVec.active = true;
        (this.touchVec as any).ox = p.x;
        (this.touchVec as any).oy = p.y;
      } else {
        this.charging = true;
        this.chargeStart = this.time.now;
      }
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.touchVec.active) {
        const dx = p.x - (this.touchVec as any).ox;
        const dy = p.y - (this.touchVec as any).oy;
        const len = Math.hypot(dx, dy) || 1;
        const m = Math.min(1, len / 60);
        this.touchVec.x = (dx / len) * m;
        this.touchVec.y = (dy / len) * m;
      }
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.x < GAME_W / 2) {
        this.touchVec.active = false;
        this.touchVec.x = 0;
        this.touchVec.y = 0;
      } else if (this.charging) {
        this.releaseShot();
      }
    });
    this.keys.SPACE.on('down', () => {
      if (!this.charging) {
        this.charging = true;
        this.chargeStart = this.time.now;
      }
    });
    this.keys.SPACE.on('up', () => this.releaseShot());
    this.keys.J.on('down', () => this.doPass());
    this.keys.K.on('down', () => this.manualSwitch());
  }

  // --- match flow --------------------------------------------------------

  private beginKickoff(side: Side): void {
    this.kickingSide = side;
    for (const p of this.players) {
      // reset to own-half formation
      let hx = p.hx;
      if (p.side === 'home' && hx > this.px + this.pw / 2 - 30) hx = this.px + this.pw / 2 - 60;
      if (p.side === 'away' && hx < this.px + this.pw / 2 + 30) hx = this.px + this.pw / 2 + 60;
      p.x = hx;
      p.y = p.hy;
      p.vx = 0;
      p.vy = 0;
    }
    this.ball.x = this.px + this.pw / 2;
    this.ball.y = this.py + this.ph / 2;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.ownerIdx = -1;
    // nudge a kicking-side player onto the ball
    const taker = this.players.find((p) => p.side === side && p.role === 'MID')!;
    taker.x = this.ball.x - (side === 'home' ? 30 : -30);
    taker.y = this.ball.y;
    this.pickActive();
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(0.05, deltaMs / 1000);
    if (this.finished) return;

    if (this.state === 'kickoff') {
      this.stateTimer -= dt;
      this.renderEntities();
      if (this.stateTimer <= 0) this.state = 'play';
      return;
    }
    if (this.state === 'goal') {
      this.stateTimer -= dt;
      this.renderEntities();
      if (this.stateTimer <= 0) {
        const conceding: Side = this.lastScorer === 'home' ? 'away' : 'home';
        this.beginKickoff(conceding);
        this.showBanner('KICK OFF', C.cyan, 700);
        this.state = 'kickoff';
        this.stateTimer = 0.8;
      }
      return;
    }
    if (this.state === 'fulltime' || this.state === 'pens') {
      this.renderEntities();
      return;
    }

    // PLAY
    this.elapsed += dt;
    this.updateActiveSelection();
    this.updateUserControl(dt);
    this.updateAI(dt);
    this.integratePlayers(dt);
    this.updateBall(dt);
    this.updateSurge(dt);
    this.updatePowerups(dt);
    this.renderEntities();
    this.updateHud();

    // music tension tracks the bigger Surge meter + how late the match is
    const tension = Math.max(this.surgeHome, this.surgeAway) / 100;
    audio.setIntensity(0.25 + tension * 0.5 + (this.elapsed / this.duration) * 0.2);

    if (this.elapsed >= this.duration) this.onFullTime();
  }

  private lastScorer: Side = 'home';

  // --- active player / input --------------------------------------------

  private pickActive(): void {
    // nearest home outfield player to the ball becomes user-controlled
    let best = -1;
    let bestD = Infinity;
    this.players.forEach((p, i) => {
      if (p.side !== 'home' || p.role === 'GK') return;
      const d = dist(p.x, p.y, this.ball.x, this.ball.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    this.setActive(best);
  }

  private setActive(idx: number): void {
    if (this.activeIdx >= 0 && this.players[this.activeIdx]) this.players[this.activeIdx].isUser = false;
    this.activeIdx = idx;
    if (idx >= 0) this.players[idx].isUser = true;
  }

  private updateActiveSelection(): void {
    // auto-switch to the home player nearest the ball when not in clear possession
    const owner = this.ball.ownerIdx;
    if (owner >= 0 && this.players[owner].side === 'home' && this.players[owner].role !== 'GK') {
      this.setActive(owner);
      return;
    }
    // otherwise nearest home outfielder
    let best = this.activeIdx;
    let bestD = Infinity;
    this.players.forEach((p, i) => {
      if (p.side !== 'home' || p.role === 'GK') return;
      const d = dist(p.x, p.y, this.ball.x, this.ball.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best !== this.activeIdx) this.setActive(best);
  }

  private manualSwitch(): void {
    // cycle to next home outfielder
    const outfield = this.players.map((p, i) => ({ p, i })).filter((o) => o.p.side === 'home' && o.p.role !== 'GK');
    const cur = outfield.findIndex((o) => o.i === this.activeIdx);
    const next = outfield[(cur + 1) % outfield.length];
    this.setActive(next.i);
  }

  private inputVector(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    if (this.keys.A.isDown || this.keys.LEFT.isDown) x -= 1;
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) x += 1;
    if (this.keys.W.isDown || this.keys.UP.isDown) y -= 1;
    if (this.keys.S.isDown || this.keys.DOWN.isDown) y += 1;
    if (x === 0 && y === 0 && this.touchVec.active) {
      x = this.touchVec.x;
      y = this.touchVec.y;
    }
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  private updateUserControl(dt: number): void {
    const p = this.players[this.activeIdx];
    if (!p) return;
    const v = this.inputVector();
    const sprint = this.keys.SHIFT.isDown ? 1.25 : 1;
    const speed = this.playerSpeed(p, 'home') * sprint;
    p.vx = v.x * speed;
    p.vy = v.y * speed;
    if (v.x !== 0 || v.y !== 0) {
      p.faceX = v.x;
      p.faceY = v.y;
    }
  }

  private releaseShot(): void {
    if (!this.charging) return;
    this.charging = false;
    const p = this.players[this.activeIdx];
    if (!p || this.ball.ownerIdx !== this.activeIdx) {
      return;
    }
    const charge = Math.min(1, (this.time.now - this.chargeStart) / CHARGE_MS);
    // aim: face direction, biased toward opponent goal if little input
    let ax = p.faceX;
    let ay = p.faceY;
    if (Math.abs(ax) + Math.abs(ay) < 0.2) {
      ax = 1; // home attacks +x
      ay = (this.py + this.ph / 2 - p.y) / 200;
    }
    const len = Math.hypot(ax, ay) || 1;
    const power = 460 + charge * 520;
    const vx = (ax / len) * power;
    const vy = (ay / len) * power;
    this.registerShot(p.side, p.x, p.y, vx, vy);
    this.kickBall(p, vx, vy);
    if (charge > 0.8) {
      this.shake(120, 0.006);
      this.showBanner('SCREAMER!', C.surge, 500);
    }
  }

  // Tally a shot and, by projecting its straight-line path to the opponent
  // goal line, whether it was on target (within the goal mouth). A heuristic —
  // drag bends the real path — but a fair shots/on-target ratio for the result.
  private registerShot(side: Side, fromX: number, fromY: number, vx: number, vy: number): void {
    this.shots[side]++;
    const goalX = side === 'home' ? this.px + this.pw : this.px;
    const towardGoal = side === 'home' ? vx > 0 : vx < 0;
    if (!towardGoal) return;
    const t = (goalX - fromX) / vx;
    if (t <= 0) return;
    const yAtGoal = fromY + vy * t;
    const gy0 = this.py + this.ph / 2 - this.goalH / 2;
    if (yAtGoal >= gy0 && yAtGoal <= gy0 + this.goalH) this.onTarget[side]++;
  }

  private doPass(): void {
    const p = this.players[this.activeIdx];
    if (!p || this.ball.ownerIdx !== this.activeIdx) return;
    // nearest teammate ahead (toward attacking goal)
    let best = -1;
    let bestScore = -Infinity;
    this.players.forEach((t, i) => {
      if (t.side !== 'home' || i === this.activeIdx || t.role === 'GK') return;
      const ahead = t.x - p.x; // home attacks +x
      const d = dist(p.x, p.y, t.x, t.y);
      const score = ahead * 1.5 - d;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    });
    if (best < 0) return;
    const t = this.players[best];
    const dx = t.x - p.x;
    const dy = t.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const power = Math.min(640, 300 + len * 1.4);
    this.kickBall(p, (dx / len) * power, (dy / len) * power);
    this.setActive(best);
  }

  private kickBall(from: Player, vx: number, vy: number): void {
    this.ball.vx = vx;
    this.ball.vy = vy;
    this.ball.ownerIdx = -1;
    // place just ahead so we don't immediately re-collect
    const len = Math.hypot(vx, vy) || 1;
    this.ball.x = from.x + (vx / len) * (PR + BR + 2);
    this.ball.y = from.y + (vy / len) * (PR + BR + 2);
    this.lastKickIdx = this.players.indexOf(from);
    this.kickCooldown = 0.18;
    audio.play('kick');
  }

  private lastKickIdx = -1;
  private kickCooldown = 0;

  // --- AI ----------------------------------------------------------------

  private updateAI(dt: number): void {
    // determine each team's chaser (closest outfielder to ball)
    const chaser: Record<Side, number> = { home: -1, away: -1 };
    (['home', 'away'] as Side[]).forEach((side) => {
      let bd = Infinity;
      this.players.forEach((p, i) => {
        if (p.side !== side || p.role === 'GK') return;
        const d = dist(p.x, p.y, this.ball.x, this.ball.y);
        if (d < bd) {
          bd = d;
          chaser[side] = i;
        }
      });
    });

    this.players.forEach((p, i) => {
      if (p.isUser) return;
      if (p.role === 'GK') {
        this.updateGK(p, dt);
        return;
      }
      const attackDir = p.side === 'home' ? 1 : -1;
      const oppGoalX = p.side === 'home' ? this.px + this.pw : this.px;
      const oppGoalY = this.py + this.ph / 2;
      const owns = this.ball.ownerIdx === i;
      const teamHasBall = this.ball.ownerIdx >= 0 && this.players[this.ball.ownerIdx].side === p.side;

      let tx: number;
      let ty: number;
      const speedScale = p.side === 'away' ? this.diff.aiSpeed : 1;

      if (owns) {
        // dribble toward opponent goal; shoot if in range; pass if pressured
        const distGoal = Math.abs(p.x - oppGoalX);
        const pressed = this.nearestOpponentDist(p) < 70;
        if (distGoal < this.diff.aiShootRange) {
          this.aiShoot(p, oppGoalX, oppGoalY);
          return;
        }
        if (pressed && this.rng.bool(0.04)) {
          this.aiPassToTeammate(p);
          return;
        }
        tx = oppGoalX;
        ty = oppGoalY + (p.y - (this.py + this.ph / 2)) * 0.3;
      } else if (i === chaser[p.side] && !teamHasBall) {
        tx = this.ball.x;
        ty = this.ball.y;
      } else {
        // hold shape, shift toward ball-side, push up when attacking
        const ballAdvance = (this.ball.x - (this.px + this.pw / 2)) / this.pw; // -0.5..0.5
        tx = p.hx + attackDir * (teamHasBall ? 70 : -10) + ballAdvance * 90 * attackDir;
        ty = p.hy + (this.ball.y - (this.py + this.ph / 2)) * 0.18;
      }

      this.steer(p, tx, ty, this.playerSpeed(p, p.side) * speedScale, dt);
    });
  }

  private updateGK(p: Player, _dt: number): void {
    const goalX = p.side === 'home' ? this.px + 24 : this.px + this.pw - 24;
    const cy = this.py + this.ph / 2;
    let targetY = Phaser.Math.Clamp(this.ball.y, cy - this.goalH / 2, cy + this.goalH / 2);
    // rush out if ball very close and in our third
    const closeBall = dist(p.x, p.y, this.ball.x, this.ball.y) < 90;
    const inOurThird = p.side === 'home' ? this.ball.x < this.px + 200 : this.ball.x > this.px + this.pw - 200;
    let targetX = goalX;
    if (closeBall && inOurThird) {
      targetX = this.ball.x;
      targetY = this.ball.y;
    }
    this.steer(p, targetX, targetY, this.playerSpeed(p, p.side) * 0.95, _dt);
  }

  private aiShoot(p: Player, goalX: number, goalY: number): void {
    const acc = this.diff.aiAccuracy;
    const spread = (1 - acc) * this.goalH * 0.9;
    const ty = goalY + this.rng.range(-spread, spread);
    const dx = goalX - p.x;
    const dy = ty - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const power = 720 + this.rng.range(0, 140);
    const vx = (dx / len) * power;
    const vy = (dy / len) * power;
    this.registerShot(p.side, p.x, p.y, vx, vy);
    this.kickBall(p, vx, vy);
  }

  private aiPassToTeammate(p: Player): void {
    let best = -1;
    let bestScore = -Infinity;
    const attackDir = p.side === 'home' ? 1 : -1;
    this.players.forEach((t, i) => {
      if (t.side !== p.side || t === p || t.role === 'GK') return;
      const ahead = (t.x - p.x) * attackDir;
      const d = dist(p.x, p.y, t.x, t.y);
      const score = ahead * 1.4 - d * 0.6;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    });
    if (best < 0) return;
    const t = this.players[best];
    const dx = t.x - p.x;
    const dy = t.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const power = Math.min(620, 280 + len * 1.3);
    this.kickBall(p, (dx / len) * power, (dy / len) * power);
  }

  private nearestOpponentDist(p: Player): number {
    let bd = Infinity;
    for (const o of this.players) {
      if (o.side === p.side) continue;
      const d = dist(p.x, p.y, o.x, o.y);
      if (d < bd) bd = d;
    }
    return bd;
  }

  private steer(p: Player, tx: number, ty: number, speed: number, _dt: number): void {
    const dx = tx - p.x;
    const dy = ty - p.y;
    const len = Math.hypot(dx, dy);
    if (len < 4) {
      p.vx = 0;
      p.vy = 0;
      return;
    }
    p.vx = (dx / len) * speed;
    p.vy = (dy / len) * speed;
    p.faceX = dx / len;
    p.faceY = dy / len;
  }

  private playerSpeed(p: Player, side: Side): number {
    const team = side === 'home' ? this.home : this.away;
    const base = 196 + (team.pace - 70) * 1.7;
    const surge = side === 'home' ? this.surgeHome : this.surgeAway;
    const surgeBoost = surge >= 100 ? 1.18 : 1;
    const userBoost = p.isUser ? this.diff.userBoost : 1;
    const e = this.puEffects[side];
    const puBoost = e.boost > 0 ? 1.28 : 1;
    const puFreeze = e.frozen > 0 ? 0.5 : 1;
    return base * surgeBoost * userBoost * puBoost * puFreeze;
  }

  // --- physics -----------------------------------------------------------

  private integratePlayers(dt: number): void {
    for (const p of this.players) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // keep inside pitch bounds (a little margin so GK can sit on the line)
      p.x = Phaser.Math.Clamp(p.x, this.px - 6, this.px + this.pw + 6);
      p.y = Phaser.Math.Clamp(p.y, this.py + PR * 0.5, this.py + this.ph - PR * 0.5);
    }
    // simple player-player separation
    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        const a = this.players[i];
        const b = this.players[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const min = PR * 2;
        if (d > 0 && d < min) {
          const push = (min - d) / 2;
          const ux = dx / d;
          const uy = dy / d;
          a.x -= ux * push;
          a.y -= uy * push;
          b.x += ux * push;
          b.y += uy * push;
        }
      }
    }
  }

  private updateBall(dt: number): void {
    if (this.kickCooldown > 0) this.kickCooldown -= dt;

    // possession clock (only ticks while a side actually holds the ball)
    if (this.ball.ownerIdx >= 0) this.possSec[this.players[this.ball.ownerIdx].side] += dt;

    // possession: closest player within collect radius
    if (this.ball.ownerIdx < 0) {
      let owner = -1;
      let bd = Infinity;
      this.players.forEach((p, i) => {
        if (this.kickCooldown > 0 && i === this.lastKickIdx) return;
        const d = dist(p.x, p.y, this.ball.x, this.ball.y);
        const reach = PR + BR + 6 + (this.puEffects[p.side].magnet > 0 ? 16 : 0);
        if (d < reach && d < bd) {
          bd = d;
          owner = i;
        }
      });
      if (owner >= 0) {
        this.ball.ownerIdx = owner;
        this.ball.vx = 0;
        this.ball.vy = 0;
      }
    } else {
      // stick ball ahead of owner
      const ownerIdx = this.ball.ownerIdx;
      const p = this.players[ownerIdx];
      const fl = Math.hypot(p.faceX, p.faceY) || 1;
      this.ball.x = p.x + (p.faceX / fl) * (PR + BR - 2);
      this.ball.y = p.y + (p.faceY / fl) * (PR + BR - 2);
      this.ball.vx = 0;
      this.ball.vy = 0;
      // Tackle: resolve ONCE against the single nearest opponent in range
      // (avoids the previous mid-loop ownerIdx mutation / stale-owner bug).
      let tackler = -1;
      let td = Infinity;
      for (let i = 0; i < this.players.length; i++) {
        const o = this.players[i];
        if (o.side === p.side) continue;
        const d = dist(o.x, o.y, this.ball.x, this.ball.y);
        if (d < PR + BR + 2 && d < td) {
          td = d;
          tackler = i;
        }
      }
      if (tackler >= 0) {
        if (this.rng.bool(0.5)) {
          this.ball.ownerIdx = tackler; // clean steal
        } else {
          this.ball.ownerIdx = -1; // pops loose
          this.ball.vx = (this.ball.x - p.x) * 6;
          this.ball.vy = (this.ball.y - p.y) * 6;
          this.lastKickIdx = ownerIdx; // dispossessed player can't instantly re-collect
          this.kickCooldown = 0.12;
        }
      }
    }

    if (this.ball.ownerIdx >= 0) return;

    // free ball motion + drag
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;
    const drag = Math.pow(0.34, dt);
    this.ball.vx *= drag;
    this.ball.vy *= drag;

    // top/bottom walls
    if (this.ball.y < this.py + BR) {
      this.ball.y = this.py + BR;
      this.ball.vy = Math.abs(this.ball.vy) * 0.7;
    } else if (this.ball.y > this.py + this.ph - BR) {
      this.ball.y = this.py + this.ph - BR;
      this.ball.vy = -Math.abs(this.ball.vy) * 0.7;
    }

    // goal lines
    const gy0 = this.py + this.ph / 2 - this.goalH / 2;
    const gy1 = gy0 + this.goalH;
    if (this.ball.x < this.px + BR) {
      if (this.ball.y > gy0 && this.ball.y < gy1) {
        this.scoreGoal('away');
        return;
      }
      this.ball.x = this.px + BR;
      this.ball.vx = Math.abs(this.ball.vx) * 0.6;
    } else if (this.ball.x > this.px + this.pw - BR) {
      if (this.ball.y > gy0 && this.ball.y < gy1) {
        this.scoreGoal('home');
        return;
      }
      this.ball.x = this.px + this.pw - BR;
      this.ball.vx = -Math.abs(this.ball.vx) * 0.6;
    }
  }

  // --- goals / surge -----------------------------------------------------

  private scoreGoal(side: Side): void {
    if (this.state !== 'play') return;
    this.lastScorer = side;
    if (side === 'home') this.homeGoals++;
    else this.awayGoals++;
    // reward trailing team with surge reset; scoring team modest
    if (side === 'home') this.surgeHome = 0;
    else this.surgeAway = 0;
    const speed = Math.hypot(this.ball.vx, this.ball.vy);
    this.shake(260, 0.012);
    this.flash(180, 255, 255, 255);
    const col = side === 'home' ? this.homeColor : this.awayColor;
    this.showBanner('GOAL!', col, 1300);
    this.updateHud();
    this.state = 'goal';
    this.stateTimer = 1.6;
    // burst of particles
    this.goalBurst(col);
    // bloom + scorer/power popup (motion only; bloom alpha capped and slightly
    // delayed so it never co-peaks with the camera flash — photosensitivity).
    if (!this.reduceMotion) {
      const bloom = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0xffffff, 0.25).setDepth(48);
      this.tweens.add({ targets: bloom, alpha: 0, duration: 260, delay: 60, ease: 'Quad.easeIn', onComplete: () => bloom.destroy() });
      this.goalPopup(side, col, speed);
    }
    audio.play('goal');
  }

  // A scorer/power flourish near the goal mouth that drifts toward centre and
  // fades. PWR is a coarse 0-99 read of the ball speed as it crossed the line.
  private goalPopup(side: Side, col: number, speed: number): void {
    const homeScored = side === 'home';
    const pwr = Math.min(99, Math.round(speed / 12));
    const code = homeScored ? this.home.code : this.away.code;
    const x0 = homeScored ? this.px + this.pw - 90 : this.px + 90;
    const popup = this.add
      .text(x0, this.py + this.ph / 2 - 64, `${code}  PWR ${pwr}`, {
        fontFamily: FONT_DISPLAY,
        fontSize: '22px',
        color: hex(col),
      })
      .setOrigin(0.5)
      .setDepth(49)
      .setStroke('#0e0a24', 4); // dark outline keeps it legible on any pitch colour
    this.tweens.add({
      targets: popup,
      x: GAME_W / 2,
      y: popup.y - 28,
      alpha: { from: 1, to: 0 },
      duration: 950,
      ease: 'Quad.easeOut',
      onComplete: () => popup.destroy(),
    });
  }

  private goalBurst(color: number): void {
    const homeScored = this.lastScorer === 'home';
    const x = homeScored ? this.px + this.pw - 20 : this.px + 20;
    const y = this.py + this.ph / 2;

    // reduceMotion: keep the original subdued radial puff.
    if (this.reduceMotion) {
      for (let i = 0; i < 22; i++) {
        const a = this.rng.range(0, Math.PI * 2);
        const sp = this.rng.range(60, 320);
        const dot = this.add.circle(x, y, this.rng.range(2, 5), color).setDepth(40);
        this.tweens.add({
          targets: dot,
          x: x + Math.cos(a) * sp,
          y: y + Math.sin(a) * sp,
          alpha: 0,
          duration: 700,
          onComplete: () => dot.destroy(),
        });
      }
      return;
    }

    // Full juice: ~40 mixed-colour particles sprayed in a 120° cone out of the
    // goal mouth into the field, arcing down under gravity; ~1 in 5 is a glow.
    const baseAngle = homeScored ? Math.PI : 0;
    const palette = [color, C.gold, C.white];
    for (let i = 0; i < 40; i++) {
      const a = baseAngle + this.rng.range(-Math.PI / 3, Math.PI / 3);
      const sp = this.rng.range(80, 360);
      const col = palette[Math.floor(this.rng.range(0, palette.length))];
      const size = this.rng.range(2, 8);
      const glow = this.rng.bool(0.2);
      const dot = glow
        ? this.add.image(x, y, 'softcircle').setTint(col).setScale(size / 12).setDepth(40)
        : (this.add.circle(x, y, size, col).setDepth(40) as Phaser.GameObjects.GameObject);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(a) * sp,
        y: y + Math.sin(a) * sp + this.rng.range(50, 170), // gravity drop
        alpha: 0,
        duration: this.rng.range(700, 1000),
        ease: 'Quad.easeOut',
        onComplete: () => dot.destroy(),
      });
    }
  }

  private updateSurge(dt: number): void {
    // trailing team's surge fills faster (the comeback mechanic, light version)
    const diff = this.homeGoals - this.awayGoals;
    const homeTrail = diff < 0 ? -diff : 0;
    const awayTrail = diff > 0 ? diff : 0;
    this.surgeHome = Math.min(100, this.surgeHome + (6 + homeTrail * 7) * dt);
    this.surgeAway = Math.min(100, this.surgeAway + (6 + awayTrail * 7) * dt);
  }

  // --- power-ups ---------------------------------------------------------

  private updatePowerups(dt: number): void {
    // decay active effects
    for (const side of ['home', 'away'] as Side[]) {
      const e = this.puEffects[side];
      e.boost = Math.max(0, e.boost - dt);
      e.magnet = Math.max(0, e.magnet - dt);
      e.frozen = Math.max(0, e.frozen - dt);
    }
    // spawn cadence
    this.puSpawnTimer -= dt;
    if (this.puSpawnTimer <= 0 && this.powerups.length < 2) {
      this.spawnPowerup();
      this.puSpawnTimer = this.rng.range(11, 16);
    }
    // spin + collision
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      pu.gfx.rotation += dt * 1.6;
      for (const p of this.players) {
        if (dist(p.x, p.y, pu.x, pu.y) < PR + 16) {
          this.collectPowerup(i, p.side);
          break;
        }
      }
    }
  }

  private spawnPowerup(): void {
    const type = this.rng.pick(['boost', 'freeze', 'magnet'] as PowerType[]);
    const x = this.px + this.pw * this.rng.range(0.28, 0.72);
    const y = this.py + this.ph * this.rng.range(0.2, 0.8);
    const cfg = POWERUPS[type];
    const c = this.add.container(x, y).setDepth(12);
    const ring = this.add.circle(0, 0, 17, cfg.color, 0.22).setStrokeStyle(3, cfg.color, 1);
    const icon = this.add
      .text(0, 0, cfg.icon, { fontFamily: FONT_DISPLAY, fontSize: '20px', color: hex(cfg.color) })
      .setOrigin(0.5);
    c.add([ring, icon]);
    this.tweens.add({ targets: c, scale: 1.15, duration: 500, yoyo: true, repeat: -1 });
    this.powerups.push({ x, y, type, gfx: c });
  }

  private collectPowerup(index: number, side: Side): void {
    const pu = this.powerups[index];
    const cfg = POWERUPS[pu.type];
    const other: Side = side === 'home' ? 'away' : 'home';
    if (pu.type === 'boost') this.puEffects[side].boost = cfg.dur;
    else if (pu.type === 'magnet') this.puEffects[side].magnet = cfg.dur;
    else this.puEffects[other].frozen = cfg.dur; // freeze the opponents
    const teamCode = side === 'home' ? this.home.code : this.away.code;
    this.showBanner(`${teamCode}: ${cfg.label}`, cfg.color, 900);
    audio.play('surge');
    pu.gfx.destroy();
    this.powerups.splice(index, 1);
  }

  // --- rendering ---------------------------------------------------------

  private shake(dur: number, intensity: number): void {
    if (!this.reduceMotion) this.cameras.main.shake(dur, intensity);
  }

  private flash(dur: number, r: number, g: number, b: number): void {
    if (!this.reduceMotion) this.cameras.main.flash(dur, r, g, b);
  }

  private renderEntities(): void {
    for (const p of this.players) {
      p.gfx.setPosition(p.x, p.y);
    }
    this.ballGfx.setPosition(this.ball.x, this.ball.y);

    // ball trail (afterimages) when the ball is loose and moving quickly
    this.trailGfx.clear();
    const speed = Math.hypot(this.ball.vx, this.ball.vy);
    if (this.ball.ownerIdx < 0 && speed > 140) {
      this.ballTrail.push({ x: this.ball.x, y: this.ball.y });
      if (this.ballTrail.length > 8) this.ballTrail.shift();
    } else if (this.ballTrail.length) {
      this.ballTrail.shift();
    }
    this.ballTrail.forEach((t, i) => {
      const a = (i / this.ballTrail.length) * 0.5;
      this.trailGfx.fillStyle(this.ballTint, a);
      this.trailGfx.fillCircle(t.x, t.y, BR * (0.4 + (i / this.ballTrail.length) * 0.6));
    });

    // Surge vignette — screen edges glow in the surging team's colour
    this.vignette.clear();
    const surge = Math.max(this.surgeHome, this.surgeAway);
    if (surge > 60) {
      const col = this.surgeHome >= this.surgeAway ? this.homeColor : this.awayColor;
      const a = ((surge - 60) / 40) * 0.22;
      const band = 70;
      this.vignette.fillStyle(col, a);
      this.vignette.fillRect(0, 0, GAME_W, band);
      this.vignette.fillRect(0, GAME_H - band, GAME_W, band);
      this.vignette.fillRect(0, 0, band, GAME_H);
      this.vignette.fillRect(GAME_W - band, 0, band, GAME_H);
    }

    // single per-frame pulse phase, reused by the possession ring + screamer
    // zone (one sin call, per the match-effects perf budget).
    this.pulse = this.reduceMotion ? 0 : 0.5 + 0.5 * Math.sin(this.time.now * 0.008);

    this.dyn.clear();
    // per-team centre marker — colour-independent team identity (accessibility)
    for (const p of this.players) {
      if (p.role === 'GK') continue;
      this.dyn.fillStyle(p.side === 'home' ? C.deep : C.white, 0.85);
      this.dyn.fillCircle(p.x, p.y, 4);
    }
    // possession ring on the actual ball owner (team colour), under the gold
    // active ring so a viewer can tell who HOLDS the ball, not just who's active
    if (this.ball.ownerIdx >= 0) {
      const owner = this.players[this.ball.ownerIdx];
      const ocol = owner.side === 'home' ? this.homeColor : this.awayColor;
      this.dyn.lineStyle(3, ocol, 0.4 + 0.25 * this.pulse);
      this.dyn.strokeCircle(owner.x, owner.y, PR + 9);
    }
    // active player ring
    const ap = this.players[this.activeIdx];
    if (ap) {
      this.dyn.lineStyle(3, C.gold, 1);
      this.dyn.strokeCircle(ap.x, ap.y, PR + 6);
      // small arrow under active
      this.dyn.fillStyle(C.gold, 1);
      this.dyn.fillTriangle(ap.x - 6, ap.y - PR - 12, ap.x + 6, ap.y - PR - 12, ap.x, ap.y - PR - 4);
    }
    if (this.charging && ap) this.drawChargeBar(ap); else this.chargeText.setVisible(false);
  }

  // Three-zone charge bar — weak (0-40%, dim) / strong (40-80%, cyan) /
  // screamer (80-100%, surge) — with a tick at the 0.8 threshold and a live
  // percentage, so players learn where the SCREAMER shot begins.
  private drawChargeBar(ap: Player): void {
    const charge = Math.min(1, (this.time.now - this.chargeStart) / CHARGE_MS);
    const bw = 50;
    const bh = 7;
    const bx = ap.x - bw / 2;
    const by = ap.y + PR + 9;
    // faint full-width track split into the three zones
    this.dyn.fillStyle(C.dark, 0.55);
    this.dyn.fillRect(bx, by, bw, bh);
    // filled portion, coloured by the current zone
    const zoneCol = charge > 0.8 ? C.surge : charge >= 0.4 ? C.cyan : C.mid;
    this.dyn.fillStyle(zoneCol, 1);
    this.dyn.fillRect(bx, by, bw * charge, bh);
    // pulsing screamer overlay once past the threshold
    if (charge > 0.8) {
      this.dyn.fillStyle(C.surge, 0.35 + 0.4 * this.pulse);
      this.dyn.fillRect(bx + bw * 0.8, by, bw * 0.2, bh);
    }
    // 0.8 threshold tick
    this.dyn.fillStyle(C.light, 0.95);
    this.dyn.fillRect(bx + bw * 0.8 - 1, by - 2, 2, bh + 4);
    // live percentage readout
    this.chargeText
      .setText(`${Math.round(charge * 100)}%`)
      .setColor(charge > 0.8 ? CSS.surge : CSS.light)
      .setPosition(ap.x, by - 9)
      .setVisible(true);
  }

  private showBanner(text: string, color: number, ms: number): void {
    this.bannerText.setText(text).setColor(hex(color)).setAlpha(1).setScale(1);
    this.tweens.killTweensOf(this.bannerText);
    this.tweens.add({ targets: this.bannerText, scale: 1.15, duration: 150, yoyo: true });
    this.tweens.add({ targets: this.bannerText, alpha: 0, delay: ms - 250, duration: 250 });
  }

  private prevHudHome = 0;
  private prevHudAway = 0;
  private updateHud(): void {
    if (this.homeGoals !== this.prevHudHome || this.awayGoals !== this.prevHudAway) {
      this.prevHudHome = this.homeGoals;
      this.prevHudAway = this.awayGoals;
      this.hudScore.setText(`${this.homeGoals} - ${this.awayGoals}`);
      if (!this.reduceMotion) {
        this.tweens.killTweensOf(this.hudScore);
        this.hudScore.setScale(1);
        this.tweens.add({ targets: this.hudScore, scale: 1.25, duration: 260, yoyo: true, ease: 'Elastic.easeOut' });
        this.hudScore.setColor(CSS.white);
        this.time.delayedCall(160, () => this.hudScore.setColor(CSS.gold));
      }
    } else {
      this.hudScore.setText(`${this.homeGoals} - ${this.awayGoals}`);
    }
    const minute = Math.floor((this.elapsed / this.duration) * 90);
    this.hudClock.setText(`${minute}'`);
    this.drawSurgeBar();
    if (this.surgeHome >= 100) this.tagSurge('home');
    if (this.surgeAway >= 100) this.tagSurge('away');

    // active power-up indicators
    const parts: string[] = [];
    for (const side of ['home', 'away'] as Side[]) {
      const e = this.puEffects[side];
      const code = side === 'home' ? this.home.code : this.away.code;
      const b: string[] = [];
      if (e.boost > 0) b.push('BOOST');
      if (e.magnet > 0) b.push('MAGNET');
      if (e.frozen > 0) b.push('FROZEN');
      if (b.length) parts.push(`${code} ${b.join('/')}`);
    }
    this.puHud.setText(parts.join('   ·   '));
  }

  // Two-sided Surge meter with a dark->bright gradient fill (precomputed
  // stripes), a glow halo past 60, and a white shimmer sweep — so it reads as
  // building comeback energy, not a flat gauge.
  private drawSurgeBar(): void {
    const w = 460;
    const x0 = GAME_W / 2 - w / 2;
    const cx = GAME_W / 2;
    const y = 80;
    const half = w / 2;
    const n = this.homeGrad.length;
    this.surgeBar.clear();
    this.surgeBar.fillStyle(C.deep, 0.8);
    this.surgeBar.fillRoundedRect(x0, y, w, 8, 4);

    const hw = (this.surgeHome / 100) * half;
    const aw = (this.surgeAway / 100) * half;
    for (let i = 0; i < n; i++) {
      this.surgeBar.fillStyle(this.homeGrad[i], 1);
      this.surgeBar.fillRect(cx - (hw * (i + 1)) / n, y + 1, hw / n + 0.5, 6);
      this.surgeBar.fillStyle(this.awayGrad[i], 1);
      this.surgeBar.fillRect(cx + (aw * i) / n, y + 1, aw / n + 0.5, 6);
    }

    // glow halo once a side crosses 60
    if (this.surgeHome > 60) {
      this.surgeBar.lineStyle(2, this.homeColor, 0.3 + 0.3 * this.pulse);
      this.surgeBar.strokeRoundedRect(cx - hw - 2, y - 2, hw + 2, 12, 4);
    }
    if (this.surgeAway > 60) {
      this.surgeBar.lineStyle(2, this.awayColor, 0.3 + 0.3 * this.pulse);
      this.surgeBar.strokeRoundedRect(cx, y - 2, aw + 2, 12, 4);
    }

    // white shimmer sweeping across the filled bar
    if (!this.reduceMotion) {
      const sweep = (this.time.now * 0.12) % w;
      const sx = x0 + sweep;
      const inHome = sx < cx && sx > cx - hw;
      const inAway = sx > cx && sx < cx + aw;
      if (inHome || inAway) {
        this.surgeBar.fillStyle(0xffffff, 0.5);
        this.surgeBar.fillRect(sx, y + 1, 3, 6);
      }
    }
  }

  // Per-side dim->bright colour ramp (centre dim, tip bright) — precomputed once
  // when team colours are known, not per frame.
  private surgeGradient(base: number, n: number): number[] {
    const r0 = (base >> 16) & 255;
    const g0 = (base >> 8) & 255;
    const b0 = base & 255;
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const dim = 0.55 + 0.45 * t;
      const lift = 0.25 * t;
      const r = Math.min(255, Math.round(r0 * dim + 255 * lift));
      const g = Math.min(255, Math.round(g0 * dim + 255 * lift));
      const b = Math.min(255, Math.round(b0 * dim + 255 * lift));
      out.push((r << 16) | (g << 8) | b);
    }
    return out;
  }

  private surgeTagged: Record<Side, boolean> = { home: false, away: false };
  private tagSurge(side: Side): void {
    if (this.surgeTagged[side]) return;
    this.surgeTagged[side] = true;
    const col = side === 'home' ? this.homeColor : this.awayColor;
    this.showBanner('GROUNDSWELL!', col, 900);
    // bright flash across the surging side's bar
    if (!this.reduceMotion) {
      const w = 460;
      const cx = GAME_W / 2;
      const flash =
        side === 'home'
          ? this.add.rectangle(cx - w / 4, 84, w / 2, 10, 0xffffff, 0.9).setDepth(32)
          : this.add.rectangle(cx + w / 4, 84, w / 2, 10, 0xffffff, 0.9).setDepth(32);
      this.tweens.add({ targets: flash, alpha: 0, duration: 220, onComplete: () => flash.destroy() });
    }
    audio.play('surge');
    this.time.delayedCall(2600, () => {
      if (side === 'home') this.surgeHome = 0;
      else this.surgeAway = 0;
      this.surgeTagged[side] = false;
    });
  }

  // --- end of match ------------------------------------------------------

  private onFullTime(): void {
    if (this.state === 'fulltime' || this.state === 'pens') return;
    this.state = 'fulltime';
    this.showBanner('FULL TIME', C.gold, 1600);
    audio.play('whistle');
    const knockout = this.cfg.context === 'knockout';
    if (knockout && this.homeGoals === this.awayGoals) {
      this.state = 'pens';
      this.time.delayedCall(1400, () => this.runPenalties());
    } else {
      // a decided match earns a short victory beat before the hand-off
      if (this.homeGoals !== this.awayGoals && !this.reduceMotion) {
        this.victoryZoomSpotlight();
      }
      this.time.delayedCall(1800, () => this.finishMatch());
    }
  }

  // Tighten the camera on a soft pulsing spotlight at pitch centre to honour
  // the winning moment before we cut to the result. Motion-only; both the zoom
  // and the spotlight live on the doomed MatchScene, so the next scene's fresh
  // camera starts clean.
  private victoryZoomSpotlight(): void {
    this.time.delayedCall(250, () => {
      if (this.finished) return;
      this.cameras.main.zoomTo(1.18, 1000, 'Quad.easeOut');
      const spot = this.add.container(this.px + this.pw / 2, this.py + this.ph / 2).setDepth(46);
      const sg = this.add.graphics();
      for (let i = 9; i >= 1; i--) {
        sg.fillStyle(0xffffff, 0.05);
        sg.fillCircle(0, 0, i * 20);
      }
      spot.add(sg);
      this.tweens.add({
        targets: spot,
        scale: 1.14,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  private runPenalties(): void {
    const pens = penaltyShootout(this.home, this.away, this.rng);
    this.penResult = pens;

    if (this.reduceMotion) {
      this.showBanner(`PENALTIES  ${pens.home}-${pens.away}`, C.surge, 2200);
      this.time.delayedCall(2400, () => this.finishMatch());
      return;
    }

    // Dramatic reveal: the PENALTIES title slides up from below, then the
    // resolved score drops in from above and bounces.
    const cx = GAME_W / 2;
    const cy = GAME_H / 2;
    const title = this.add
      .text(cx, GAME_H + 60, 'PENALTIES', { fontFamily: FONT_DISPLAY, fontSize: '54px', color: CSS.surge })
      .setOrigin(0.5)
      .setDepth(51)
      .setStroke('#0e0a24', 6);
    this.tweens.add({ targets: title, y: cy - 64, duration: 600, ease: 'Back.easeOut' });
    this.time.delayedCall(700, () => {
      const score = this.add
        .text(cx, -60, `${pens.home} - ${pens.away}`, { fontFamily: FONT_DISPLAY, fontSize: '78px', color: CSS.gold })
        .setOrigin(0.5)
        .setDepth(51)
        .setStroke('#0e0a24', 6);
      this.tweens.add({ targets: score, y: cy + 26, duration: 650, ease: 'Bounce.easeOut' });
    });
    this.time.delayedCall(2400, () => this.finishMatch());
  }

  private penResult?: { home: number; away: number };

  private finishMatch(): void {
    if (this.finished) return;
    this.finished = true;
    audio.stopMusic();
    const knockout = this.cfg.context === 'knockout';
    let winnerId: string | undefined;
    if (this.homeGoals > this.awayGoals) winnerId = this.home.id;
    else if (this.awayGoals > this.homeGoals) winnerId = this.away.id;
    else if (knockout && this.penResult) winnerId = this.penResult.home > this.penResult.away ? this.home.id : this.away.id;

    const totalPoss = this.possSec.home + this.possSec.away;
    const homePct = totalPoss > 0 ? Math.round((this.possSec.home / totalPoss) * 100) : 50;
    const stats: MatchStats = {
      shots: { ...this.shots },
      onTarget: { ...this.onTarget },
      possession: { home: homePct, away: 100 - homePct },
    };

    const result: MatchResult = {
      homeId: this.home.id,
      awayId: this.away.id,
      homeGoals: this.homeGoals,
      awayGoals: this.awayGoals,
      played: true,
      winnerId,
      penalties: this.penResult,
      userInvolved: true,
      stats,
    };

    const userGoals = this.cfg.userTeamId === this.home.id ? this.homeGoals : this.awayGoals;
    recordMatch(userGoals);

    this.game.registry.set('lastMatchResult', result);
    this.game.registry.set('lastMatchId', this.cfg.matchId ?? null);

    if (this.cfg.context === 'quick') {
      const userWon = winnerId === this.cfg.userTeamId;
      const drew = !winnerId;
      if (userWon) audio.play('win');
      this.scene.start('Result', {
        title: drew ? 'DRAW' : userWon ? 'WIN!' : 'DEFEAT',
        lines: [`${displayName(this.home)} vs ${displayName(this.away)}`],
        accent: userWon ? C.lime : drew ? C.gold : C.surge,
        outcome: drew ? 'draw' : userWon ? 'win' : 'loss',
        homeCode: this.home.code,
        awayCode: this.away.code,
        homeGoals: this.homeGoals,
        awayGoals: this.awayGoals,
        userIsHome: this.cfg.userTeamId === this.home.id,
        homeColor: this.homeColor,
        awayColor: this.awayColor,
        stats: result.stats,
        nextScene: 'Menu',
        buttonLabel: 'BACK TO MENU',
      });
    } else {
      const returnToTournament = () => this.scene.start(this.cfg.returnScene ?? 'Tournament', { fromMatch: true });
      // Knockout ties get a result beat for the user before the bracket
      // returns; group matches (lower stakes) go straight back.
      if (this.cfg.context === 'knockout') {
        this.showKnockoutVerdict(winnerId === this.cfg.userTeamId, returnToTournament);
      } else {
        returnToTournament();
      }
    }
  }

  // Brief full-screen ADVANCED / ELIMINATED beat for the user's knockout tie
  // before the bracket returns. Verdict is a WORD (not colour alone), with the
  // scoreline (incl. penalties) and the round context.
  private showKnockoutVerdict(advanced: boolean, onDone: () => void): void {
    const cx = GAME_W / 2;
    const cy = GAME_H / 2;
    const col = advanced ? C.lime : C.surge;

    this.add.rectangle(cx, cy, GAME_W, GAME_H, C.deep, 0.72).setDepth(60);
    const verdict = this.add
      .text(cx, cy - 36, advanced ? 'ADVANCED' : 'ELIMINATED', {
        fontFamily: FONT_DISPLAY,
        fontSize: '72px',
        color: hex(col),
      })
      .setOrigin(0.5)
      .setDepth(61)
      .setStroke('#0e0a24', 6);

    const pens = this.penResult ? `  (${this.penResult.home}-${this.penResult.away}p)` : '';
    this.add
      .text(cx, cy + 34, `${this.home.code} ${this.homeGoals} - ${this.awayGoals} ${this.away.code}${pens}`, {
        fontFamily: FONT_DISPLAY,
        fontSize: '26px',
        color: CSS.light,
      })
      .setOrigin(0.5)
      .setDepth(61);
    if (this.cfg.roundLabel) {
      this.add
        .text(cx, cy + 74, this.cfg.roundLabel.toUpperCase(), { fontFamily: FONT_BODY, fontSize: '16px', color: CSS.mid })
        .setOrigin(0.5)
        .setDepth(61)
        .setLetterSpacing(3);
    }

    if (!this.reduceMotion) {
      verdict.setScale(0.6);
      this.tweens.add({ targets: verdict, scale: 1, duration: 350, ease: 'Back.easeOut' });
      if (advanced) this.advanceConfetti();
    }
    audio.play(advanced ? 'win' : 'whistle');
    this.time.delayedCall(this.reduceMotion ? 1000 : 1700, onDone);
  }

  private advanceConfetti(): void {
    const colors = [C.surge, C.cyan, C.lime, C.gold, C.flare];
    for (let i = 0; i < 50; i++) {
      const x = this.rng.range(0, GAME_W);
      const col = colors[Math.floor(this.rng.range(0, colors.length))];
      const piece = this.add.rectangle(x, this.rng.range(-40, -10), 4, 7, col).setDepth(62);
      this.tweens.add({
        targets: piece,
        y: GAME_H + 40,
        x: x + this.rng.range(-160, 160),
        angle: this.rng.range(360, 1080),
        alpha: { from: 1, to: 0 },
        duration: this.rng.range(1300, 1800),
        delay: this.rng.range(0, 400),
        ease: 'Quad.easeIn',
        onComplete: () => piece.destroy(),
      });
    }
  }

  private abandon(): void {
    audio.stopMusic();
    if (this.cfg.context === 'quick') {
      this.scene.start('Menu');
    } else {
      // forfeit not allowed mid-tournament for MVP; just resume tournament view
      this.scene.start(this.cfg.returnScene ?? 'Tournament');
    }
  }
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

function colorClash(a: number, b: number): boolean {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const d = Math.abs(ar - br) + Math.abs(ag - bg) + Math.abs(ab - bb);
  return d < 140;
}
