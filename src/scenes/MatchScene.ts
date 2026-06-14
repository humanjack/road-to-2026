import Phaser from 'phaser';
import { C, CSS, FONT_DISPLAY, FONT_BODY, GAME_W, GAME_H, hex } from '../ui/theme';
import { displayName } from '../data/names';
import { resolveTeam, ballColor } from '../data/extras';
import type { Team, MatchResult, MatchStats, Difficulty } from '../data/types';
import { recordMatch, getSave } from '../core/save';
import { penaltyShootout, type PenKick, type PenShootout } from '../core/simMatch';
import { RNG, randomSeed } from '../core/rng';
import {
  approachVelocity,
  turnBleed,
  resolveBump,
  postBounce,
  rippleAmplitude,
  loftLaunch,
  segmentBlocked,
  LOFT_GRAVITY,
  stepStamina,
  carryOffset,
  carryStreakAlpha,
  easeCarryAngle,
  PLAYER_ACCEL,
  PLAYER_DECEL,
  SPRINT_SPEED_MUL,
  SPRINT_ACCEL_MUL,
  DRIBBLE_SPEED_MUL,
  bufferConsumable,
  bufferExpired,
  isOneTouch,
  INPUT_BUFFER_MS,
  tackleOutcome,
  ballExposure,
  POKE_REACH,
  SLIDE_REACH,
  choosePassTarget,
  throughBallLead,
  forwardRunTarget,
  supportTarget,
  runActive,
  keeperTarget,
  saveOutcome,
  SAVE_REACH,
  chooseSwitchTarget,
  assignMarks,
  markPoint,
  shotPower01,
  shotRelease,
  curveAccel,
  stepCurve,
  SHOT_SWEET_START,
  SHOT_SWEET_END,
  skillMove,
  PASS_CONE,
  squashStretch,
  surgeCadence,
  possessionShare,
  easeToward,
  type BufferedInput,
  type TackleResult,
  type PassMate,
} from '../core/movement';
import { audio, crowdLevelFromSurge, isClosingPhase, musicIntensity } from '../core/audio';
import { limbPose, selectPose, chooseCelebrant, depthScale } from '../core/poses';
import { cameraTarget, followStep, baseZoom, zoomPunchStep, shakeIntensity, shakeDuration } from '../core/camera';
import { createTimeFlow, resetTimeFlow, requestHitStop, requestSlowMo, stepTimeScale } from '../core/timeflow';

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
  // --- appearance (all precomputed once in makePlayer; the draw loop only reads) ---
  idx: number; // 0..9 spawn index — drives skin/hair variety + run-cycle desync
  kit: number; // shirt colour (team primary, or GK lime)
  shorts: number; // hips + legs (darkened kit, or team-tinted for GK)
  shoulderHi: number; // shoulder caps (lightened kit — fake top-light)
  rim: number; // luminance-adaptive torso outline so any kit reads on the dark pitch
  skin: number;
  hair: number;
  phase: number; // run-cycle phase offset so the 10 figures don't move in lockstep
  renderAng: number; // smoothed facing angle, lerped toward atan2(faceY, faceX)
  stamina: number; // 0..1 sprint pool (only the user-controlled player drains it)
  sprintLock: boolean; // post-exhaustion recovery lock (can't sprint until recovered)
  sprinting: boolean; // transient: is this player sprint-moving this frame (drives ball knock-on)
  tackleCd: number; // seconds until this player may attempt another tackle
  recovery: number; // seconds grounded after a whiffed slide (can't move/act)
  ballHold: number; // seconds a keeper has held a caught ball (drives distribution)
  // pose countdowns (#137), all sim-ticked in integratePlayers (deterministic)
  kickT: number; // kick wind-up / follow-through
  diveT: number; // keeper dive
  slideT: number; // committed slide
  celebrateT: number; // goal celebration
  leanAng: number; // cosmetic body-lean into a hard cut (#129), eased in the render
  kickPop: number; // sim-ticked power-scaled kick impulse for squash-stretch (#131)
  pvx: number; // render-only prev velocity (for the along-facing accel that drives #131)
  pvy: number;
}

const PR = 15; // player radius
const BR = 9; // ball radius

// Realistic-player palette. Skin/hair are cosmetic variety ONLY — team identity
// is carried by the kit colour + the dyn centre dot, never by skin/hair.
const SKIN = [0xf0c39a, 0xe8b07d, 0xc68642, 0x8d5524, 0x5a3a22];
const HAIR = [0x1b1b1f, 0x2b1d12, 0x4a2f18, 0x6b4a2a, 0x111014];
// Keeper shirts: two distinct high-vis colours so opposing GKs never look alike,
// and both kept off pitch-lime (which doubles as the boost/SURGE FX colour).
const GK_KIT_HOME = 0xffc53d; // amber
const GK_KIT_AWAY = 0x19d3f0; // cyan
const CHARGE_MS = 700; // shot charge window — shared by power calc + charge-bar render

// --- broadcast-arc camera (#125, #127) --------------------------------------
// The resting zoom is the player's ZOOM setting (baseZoom() in core/camera); a
// follow camera over a world == viewport is inert, so even WIDE keeps the world
// at least the viewport size. Firework moments add a brief snap-zoom punch.
const CAM_LEAD = 90; // px the framing leads ahead of the carrier, in the attack direction
const CAM_LERP = 0.12; // follow smoothing (the GDD broadcast-arc follow-speed)
const CAM_LERP_RM = 0.05; // reduce-motion: heavily damped, steady framing (no twitch)
const ZOOM_PUNCH = 1.18; // snap-zoom multiplier on a firework moment (goal / screamer / tackle) (#127)
const MAX_LEAN = 0.3; // max body-lean angle (rad) into a hard cut (#129)
const CARRY_EXPOSE_CUE = 0.3; // ballExposure above which a knock-on streaks / shows the contest ring (#136)
const RUN_BASE_FREQ = 18; // run-cycle phase rate (rad/s) ≈ the old time.now*0.018 cadence (#138)
// body-bump (#130): a closing speed above the threshold exchanges momentum
const BUMP_THRESHOLD = 80; // px/s closing along the contact normal to register a barge
const BUMP_TRANSFER = 0.4; // fraction of the closing speed exchanged
const BUMP_CAP = 320; // clamp post-bump speed so a pile-up can't explode
// goal posts (#135): collidable woodwork at the mouth corners
const POST_R = 4; // post collision radius (px)
const POST_RESTITUTION = 0.6; // a damped clang off the woodwork
// match-loop pacing (#140): keep the goal beat climactic, then back to play fast
const GOAL_FREEZE = 1.3; // sim seconds of post-goal celebration / slow-mo fill
const GOAL_FREEZE_RM = 0.85; // reduce-motion: trimmed (no juice to hold for)
const KICKOFF_HOLD = 0.6; // sim seconds of the kick-off set piece before play
const GOAL_SKIP_AFTER = 0.5; // earliest the user may skip the cosmetic celebration tail
const PEN_KICK_CADENCE = 0.95; // sim seconds per penalty-kick reveal (#142)
const PEN_KICK_CADENCE_RM = 0.6; // reduce-motion: snappier (no flourish to hold)
const CHIP_CHARGE = 0.18; // a shot released below this charge chips (lofts) instead (#132)

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
  private ball = { x: 0, y: 0, vx: 0, vy: 0, ownerIdx: -1, curve: 0, z: 0, vz: 0, grounded: true };
  private ballCarryAng = 0; // smoothed carry direction so hard turns drag the ball (a touch)
  private vScratch = { x: 0, y: 0 }; // reused output for approachVelocity (no per-call alloc)
  private curveScratch = { vx: 0, vy: 0, curve: 0 }; // reused output for stepCurve (#133)
  private poseScratch = { farLeg: 0, nearLeg: 0, farArm: 0, nearArm: 0, lean: 0, crouch: 1 }; // reused for limbPose (#137)
  private bumpScratch = { ax: 0, ay: 0, bx: 0, by: 0 }; // reused output for resolveBump (#130)
  private squashScratch = { sx: 1, sy: 1 }; // reused output for squashStretch (#131)
  // Surge-reactive run cadence (#138): per-side factor + run-cycle phase, advanced
  // once per frame (no per-player alloc); phase accumulators avoid a swing jump when
  // surge changes the frequency.
  private cadenceHome = 1;
  private cadenceAway = 1;
  private runPhaseHome = 0;
  private runPhaseAway = 0;
  private bumpCd = 0; // body-bump sfx/fx rate-limit
  private renderOrder: Player[] = []; // reused y-sort scratch for the draw pass
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
  private bodyGfx!: Phaser.GameObjects.Graphics; // the footballer figures (depth 10)
  private shadowGfx!: Phaser.GameObjects.Graphics; // upright drop shadows (depth 9)
  private muteTag!: Phaser.GameObjects.Text; // shown while audio is muted
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
  // live possession / shots strip (#143)
  private possBar!: Phaser.GameObjects.Graphics;
  private shotsHomeText!: Phaser.GameObjects.Text;
  private shotsAwayText!: Phaser.GameObjects.Text;
  private dispPoss = 0.5; // lerped displayed home possession share (display-only)
  private prevShotsHome = -1;
  private prevShotsAway = -1;
  private bannerText!: Phaser.GameObjects.Text;
  private ballGfx!: Phaser.GameObjects.Arc;
  private trailGfx!: Phaser.GameObjects.Graphics;
  private netGfx!: Phaser.GameObjects.Graphics; // goal net mesh (#135)
  // goal geometry (#135), computed once
  private goalGy0 = 0;
  private goalGy1 = 0;
  private posts: { x: number; y: number }[] = [];
  private postScratch = { vx: 0, vy: 0 };
  private netGoals: { x: number; dir: number; side: Side }[] = [];
  // net ripple state (the most recent goal)
  private rippleSide: Side = 'home';
  private rippleY = 0;
  private rippleAge = 999; // seconds since the last cross (>= settle ⇒ no ripple)
  private vignette!: Phaser.GameObjects.Graphics;
  private ballTrail: { x: number; y: number }[] = [];
  private reduceMotion = false;
  // control settings (read once at create; defaults reproduce the original feel)
  private sprintToggleMode = false; // tap-to-toggle sprint vs hold
  private sprintToggled = false; // current toggled-sprint state
  private passCone = PASS_CONE.full; // assist-cone width from the pass-assist setting
  private autoSwitch = true; // auto-switch to the nearest defender on defence
  private ballTint = 0xffffff;
  private finished = false;
  private closingCued = false; // one-shot latch for the closing-minutes cue (#141)

  // --- camera (#125) ---
  // Two-camera split: main follows the action (zoom + scroll); uiCam renders the
  // HUD pinned to the screen and unscaled. Every display object is routed to
  // exactly one camera via onWorld()/onUi(). camTarget/camScratch are reused so
  // the per-frame follow allocates nothing (matches the vScratch convention).
  private uiCam!: Phaser.Cameras.Scene2D.Camera;
  private camTarget = { x: 0, y: 0 };
  private camScratch = { x: 0, y: 0 };
  private worldBounds = { x: 0, y: 0, w: GAME_W, h: GAME_H };
  private camFollow = true;
  private restZoom = 2.0; // resting broadcast zoom from the ZOOM setting (#127)
  private zoomCur = 2.0; // live zoom, eased back to restZoom after a snap-zoom punch
  private realDtSec = 1 / 60; // last real frame delta (render-side zoom-punch decay)

  // --- time-fx (#126): slow-mo + hit-stop, presentation-side only ---
  private timeFlow = createTimeFlow();
  private timeScale = 1; // current presentation time scale (drives the accumulator drain)
  private slowMoOn = true; // SLOW MOTION setting (gates all time-fx)

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
    this.closingCued = false; // fresh match: closing cue not yet fired (#141)
    this.shots = { home: 0, away: 0 };
    this.onTarget = { home: 0, away: 0 };
    this.possSec = { home: 0, away: 0 };
    this.dispPoss = 0.5; // #143 live strip display state
    this.prevShotsHome = -1;
    this.prevShotsAway = -1;
    this.prevHudHome = 0;
    this.prevHudAway = 0;
    this.elapsed = 0;
    this.acc = 0;
    this.players = [];
    this.powerups = [];
    this.puSpawnTimer = 6;
    this.puEffects = { home: { boost: 0, magnet: 0, frozen: 0 }, away: { boost: 0, magnet: 0, frozen: 0 } };

    // Set up the two-camera split BEFORE building any display objects so each can
    // be routed to its camera via onWorld()/onUi() as it is created.
    this.restZoom = baseZoom(getSave().settings.zoomLevel); // ZOOM setting → resting framing (#127)
    this.zoomCur = this.restZoom;
    this.uiCam = this.cameras.add(0, 0, GAME_W, GAME_H);
    this.cameras.main.setBounds(0, 0, GAME_W, GAME_H);
    this.cameras.main.setZoom(this.restZoom);
    this.camFollow = true;
    this.centerCameraOnPitch();

    this.computeGoalGeometry(); // #135 — drawPitch + post collision share this geometry
    this.rippleAge = 999; // fresh match: no active net ripple
    this.drawPitch();
    this.buildHud();
    this.spawnPlayers();
    const settings = getSave().settings;
    this.reduceMotion = settings.reduceMotion;
    this.slowMoOn = settings.slowMo;
    resetTimeFlow(this.timeFlow); // fresh match — no leftover slow-mo / hit-stop
    this.timeScale = 1;
    this.sprintToggleMode = settings.sprintMode === 'toggle';
    this.sprintToggled = false;
    this.passCone =
      settings.passAssist === 'manual' ? PASS_CONE.manual : settings.passAssist === 'semi' ? PASS_CONE.semi : PASS_CONE.full;
    this.autoSwitch = settings.defensiveSwitch !== 'manual';
    this.ballTrail = [];
    this.trailGfx = this.add.graphics().setDepth(14);
    this.netGfx = this.onWorld(this.add.graphics().setDepth(6)); // goal net, behind players (#135)
    this.shadowGfx = this.add.graphics().setDepth(9);
    this.bodyGfx = this.add.graphics().setDepth(10);
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

    // Route the persistent graphics: world layers (pitch/players/ball/rings/trail)
    // scroll with the main camera; the vignette + banner are screen-space HUD.
    this.uiCam.ignore([this.trailGfx, this.shadowGfx, this.bodyGfx, this.dyn, this.chargeText, this.ballGfx]);
    this.cameras.main.ignore([this.vignette, this.bannerText]);

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

  // --- camera (#125) -----------------------------------------------------

  // Route a world-space object so the fixed HUD camera ignores it — it scrolls
  // and zooms with play. Cheap one-shot at creation (never per frame).
  private onWorld<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.uiCam.ignore(o);
    return o;
  }

  // Route a screen-space HUD object so the world camera ignores it — it stays
  // pinned to the screen and unscaled regardless of follow/zoom.
  private onUi<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.cameras.main.ignore(o);
    return o;
  }

  // Centre the main camera on the pitch (kickoff framing + the fulltime beat).
  // setScroll is auto-clamped to the camera bounds.
  private centerCameraOnPitch(): void {
    const z = this.cameras.main.zoom;
    this.cameras.main.setScroll(this.px + this.pw / 2 - GAME_W / z / 2, this.py + this.ph / 2 - GAME_H / z / 2);
  }

  // Broadcast-arc follow — runs once per real frame from renderEntities (NEVER
  // in stepSim). Reads sim output only and writes the main camera scroll, so it
  // cannot affect the deterministic simulation or replays. Math in core/camera.
  private updateCamera(): void {
    if (!this.camFollow) return;
    const cam = this.cameras.main;
    // snap-zoom punch (#127) eases back to the resting zoom; real dt → independent
    // of slow-mo. Set the zoom BEFORE computing the follow so framing uses it.
    this.zoomCur = zoomPunchStep(this.zoomCur, this.restZoom, this.realDtSec);
    cam.setZoom(this.zoomCur);
    const z = cam.zoom;
    const viewW = GAME_W / z;
    const viewH = GAME_H / z;
    const owner = this.ball.ownerIdx;
    const hasOwner = owner >= 0;
    const cx = hasOwner ? this.players[owner].x : this.ball.x;
    const cy = hasOwner ? this.players[owner].y : this.ball.y;
    const attackDir = hasOwner ? (this.players[owner].side === 'home' ? 1 : -1) : 0;
    const lead = this.reduceMotion ? 0 : CAM_LEAD;
    cameraTarget(this.ball.x, this.ball.y, cx, cy, hasOwner, attackDir, lead, this.camTarget);
    const lerp = this.reduceMotion ? CAM_LERP_RM : CAM_LERP;
    followStep(cam.scrollX, cam.scrollY, this.camTarget.x, this.camTarget.y, lerp, viewW, viewH, this.worldBounds, this.camScratch);
    cam.setScroll(this.camScratch.x, this.camScratch.y);
  }

  // --- setup -------------------------------------------------------------

  private drawPitch(): void {
    const aurora = getSave().cosmetics.pitch === 'aurora';
    const g = this.onWorld(this.add.graphics().setDepth(0));
    g.fillStyle(C.indigo, 1);
    g.fillRect(0, 0, GAME_W, GAME_H);
    // Stadium surround behind the touchlines so a scrolled/zoomed broadcast frame
    // reads as a stadium instead of blank margin (static fill; parallax is #128).
    this.drawStadiumSurround(g, aurora);
    // turf stripes — vivid saturated pitch-lime broadcast surface (#128); the
    // aurora cosmetic still re-tints the grass cool/violet
    const stripeA = aurora ? 0x1b2a4a : C.turfA;
    const stripeB = aurora ? 0x16223d : C.turfB;
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
    // depth/lighting (drawn once, under the crisp line work): a soft light
    // top-left, a soft shade bottom-right, and a faint colour glow from each
    // goal end. Kept very low alpha so players/ball stay perfectly readable.
    this.softGlow(g, this.px + this.pw * 0.3, this.py + this.ph * 0.25, 280, 0xffffff, 0.05);
    this.softGlow(g, this.px + this.pw * 0.75, this.py + this.ph * 0.8, 300, C.deep, 0.1);
    this.softGlow(g, this.px + 50, this.py + this.ph / 2, 200, this.homeColor, 0.06);
    this.softGlow(g, this.px + this.pw - 50, this.py + this.ph / 2, 200, this.awayColor, 0.06);

    g.lineStyle(3, 0xffffff, 0.68); // crisper markings on the brighter turf (#128)
    g.strokeRect(this.px, this.py, this.pw, this.ph);
    g.lineBetween(this.px + this.pw / 2, this.py, this.px + this.pw / 2, this.py + this.ph);
    g.strokeCircle(this.px + this.pw / 2, this.py + this.ph / 2, 70);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(this.px + this.pw / 2, this.py + this.ph / 2, 4);
    // goals + boxes
    const gy0 = this.py + this.ph / 2 - this.goalH / 2;
    const boxH = this.goalH + 120;
    const byy = this.py + this.ph / 2 - boxH / 2;
    g.strokeRect(this.px, byy, 120, boxH);
    g.strokeRect(this.px + this.pw - 120, byy, 120, boxH);
    // goal frame (#135): the mouth line + post caps top & bottom so the goal reads
    // as a structure (the live net mesh is drawn separately in netGfx).
    for (const gx of [this.px, this.px + this.pw]) {
      g.lineStyle(5, C.gold, 0.95);
      g.lineBetween(gx, gy0, gx, gy0 + this.goalH);
      g.fillStyle(C.gold, 1);
      g.fillCircle(gx, gy0, 5);
      g.fillCircle(gx, gy0 + this.goalH, 5);
    }
  }

  // Goal geometry (#135), computed once: mouth top/bottom + the four post objects.
  private computeGoalGeometry(): void {
    this.goalGy0 = this.py + this.ph / 2 - this.goalH / 2;
    this.goalGy1 = this.goalGy0 + this.goalH;
    this.posts = [
      { x: this.px, y: this.goalGy0 },
      { x: this.px, y: this.goalGy1 },
      { x: this.px + this.pw, y: this.goalGy0 },
      { x: this.px + this.pw, y: this.goalGy1 },
    ];
    this.netGoals = [
      { x: this.px, dir: -1, side: 'away' },
      { x: this.px + this.pw, dir: 1, side: 'home' },
    ];
  }

  // The goal net mesh, redrawn each frame (cheap, fixed vertex count). When a
  // ripple is active for a goal, its back panel bows outward near the entry y and
  // settles over ~0.5s. Static under reduceMotion. No per-frame allocation.
  private drawNet(): void {
    const g = this.netGfx;
    g.clear();
    const depth = 26;
    const amp = rippleAmplitude(this.rippleAge);
    for (const goal of this.netGoals) {
      const rippleHere = amp > 0 && this.rippleSide === goal.side && !this.reduceMotion;
      const wobble = rippleHere ? amp * (0.6 + 0.4 * Math.sin(this.rippleAge * 26)) : 0;
      const base = goal.x + goal.dir * depth;
      g.lineStyle(1, 0xffffff, 0.22);
      const rows = 6;
      for (let r = 0; r <= rows; r++) {
        const yy = this.goalGy0 + (this.goalGy1 - this.goalGy0) * (r / rows);
        const bx = rippleHere ? base + goal.dir * wobble * Math.exp(-Math.abs(yy - this.rippleY) / 45) : base;
        g.lineBetween(goal.x, yy, bx, yy);
      }
      const cols = 4;
      for (let c = 1; c <= cols; c++) {
        const xx = goal.x + goal.dir * depth * (c / cols);
        g.lineBetween(xx, this.goalGy0, xx, this.goalGy1);
      }
    }
  }

  // Reflect the ball off a goal post (#135). Runs BEFORE the goal-mouth score
  // check so a post hit is never a goal. Pure/deterministic; fires the off-post
  // near-miss reward (Surge + banner + woodwork sfx).
  private tryPostBounce(): boolean {
    const hitDist = BR + POST_R;
    for (const post of this.posts) {
      const r = postBounce(this.ball.x, this.ball.y, this.ball.vx, this.ball.vy, post.x, post.y, hitDist, POST_RESTITUTION, this.postScratch);
      if (!r) continue;
      this.ball.vx = r.vx;
      this.ball.vy = r.vy;
      // shove the ball just clear of the post so it can't re-trigger next step
      const dx = this.ball.x - post.x;
      const dy = this.ball.y - post.y;
      const d = Math.hypot(dx, dy) || 1;
      this.ball.x = post.x + (dx / d) * (hitDist + 0.5);
      this.ball.y = post.y + (dy / d) * (hitDist + 0.5);
      this.onPostHit(post.x < this.px + this.pw / 2 ? 'away' : 'home');
      return true;
    }
    return false;
  }

  private onPostHit(attackSide: Side): void {
    this.lastKickIdx = -1; // anyone can chase the rebound
    this.kickCooldown = 0.08;
    this.shake(90, 0.008);
    audio.playImpact('post', shotPower01(Math.hypot(this.ball.vx, this.ball.vy)));
    this.showBanner('OFF THE POST!', C.gold, 600);
    // near-miss Surge reward (GDD §2.7) for the attacking side
    if (attackSide === 'home') this.surgeHome = Math.min(100, this.surgeHome + 5);
    else this.surgeAway = Math.min(100, this.surgeAway + 5);
  }

  // Stacked translucent circles forming a soft radial glow (bright centre,
  // faint edge) drawn straight into the pitch Graphics — no per-frame cost.
  private softGlow(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, color: number, peak: number): void {
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      g.fillStyle(color, (peak * (i + 1)) / steps);
      g.fillCircle(x, y, r * (1 - i / steps));
    }
  }

  // Stand bands + crowd speckle in the off-pitch margins. Drawn once into the
  // pitch Graphics; deterministic (index-based, NO rng) so it can never shift the
  // match's seeded random stream.
  private drawStadiumSurround(g: Phaser.GameObjects.Graphics, aurora: boolean): void {
    const standCol = aurora ? 0x141a30 : 0x0c1722;
    const bottomY = this.py + this.ph;
    const rightX = this.px + this.pw;
    g.fillStyle(standCol, 1);
    g.fillRect(0, 0, GAME_W, this.py); // top stand
    g.fillRect(0, bottomY, GAME_W, GAME_H - bottomY); // bottom stand
    g.fillRect(0, 0, this.px, GAME_H); // left stand
    g.fillRect(rightX, 0, GAME_W - rightX, GAME_H); // right stand
    // faint crowd speckle on the top + bottom stands (two rows each)
    g.fillStyle(0x9aa7c7, 0.12);
    for (let i = 0; i < 64; i++) {
      const x = 14 + i * 20 + (i % 3) * 4; // deterministic jitter by index
      if (x > GAME_W - 6) continue;
      g.fillCircle(x, 22 + (i % 2) * 18, 2.2);
      const yb = bottomY + 18 + (i % 2) * 18;
      if (yb < GAME_H - 6) g.fillCircle(x, yb, 2.2);
    }
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

    // live possession / shots strip (#143): possession bar y 111-119, shots tally
    // y 120-134 — all clear of the scorebox (18-74), surge bar (78-90), puHud (~89-107).
    this.possBar = this.add.graphics().setDepth(31);
    const shotStyle = { fontFamily: FONT_DISPLAY, fontSize: '13px', color: CSS.white } as const;
    this.shotsHomeText = this.add.text(GAME_W / 2 - 138, 127, '', shotStyle).setOrigin(0, 0.5).setDepth(31);
    this.shotsAwayText = this.add.text(GAME_W / 2 + 138, 127, '', shotStyle).setOrigin(1, 0.5).setDepth(31);

    // pause / quit
    const quit = this.add
      .text(GAME_W - 24, 30, '✕', { fontFamily: FONT_DISPLAY, fontSize: '24px', color: CSS.mid })
      .setOrigin(1, 0)
      .setDepth(31)
      .setInteractive({ useHandCursor: true });
    quit.on('pointerdown', () => this.abandon());

    const hint = this.add
      .text(24, GAME_H - 22, 'Move WASD · Shoot Space · Pass J · Through L · Tackle I (hold=slide) · Skill O · Switch K', {
        fontFamily: FONT_BODY,
        fontSize: '14px',
        color: CSS.mid,
      })
      .setOrigin(0, 1)
      .setDepth(31);

    // Persistent mute indicator — always reflects the current state (unlike a
    // banner, it can't be clobbered by a GOAL/SURGE message).
    this.muteTag = this.add
      .text(GAME_W - 24, GAME_H - 22, 'AUDIO MUTED', {
        fontFamily: FONT_DISPLAY,
        fontSize: '15px',
        color: CSS.flare,
      })
      .setOrigin(1, 1)
      .setDepth(31)
      .setVisible(getSave().settings.muted);

    // The whole HUD lives on the fixed UI camera (pinned + unscaled); the world
    // camera ignores all of it (#125).
    this.cameras.main.ignore([
      g,
      this.hudHome,
      this.hudAway,
      this.hudScore,
      this.hudClock,
      ul,
      cg,
      this.surgeBar,
      this.puHud,
      this.possBar,
      this.shotsHomeText,
      this.shotsAwayText,
      quit,
      hint,
      this.muteTag,
    ]);
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
    form.forEach((f, i) => {
      const hx = this.px + f.fx * this.pw;
      const hy = this.py + f.fy * this.ph;
      this.players.push(this.makePlayer('home', f.role, hx, hy, i));
    });
    form.forEach((f, i) => {
      const hx = this.px + (1 - f.fx) * this.pw;
      const hy = this.py + f.fy * this.ph;
      this.players.push(this.makePlayer('away', f.role, hx, hy, 5 + i));
    });
  }

  private makePlayer(side: Side, role: Role, hx: number, hy: number, idx: number): Player {
    const isGK = role === 'GK';
    const teamColor = side === 'home' ? this.homeColor : this.awayColor;
    const kit = isGK ? (side === 'home' ? GK_KIT_HOME : GK_KIT_AWAY) : teamColor;
    // perceived luminance → pick a rim that contrasts the kit (dark kit gets a
    // light edge, light kit a dark edge) so navy/black shirts don't vanish.
    const lum = 0.299 * ((kit >> 16) & 0xff) + 0.587 * ((kit >> 8) & 0xff) + 0.114 * (kit & 0xff);
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
      idx,
      kit,
      // GK keeps team identity via team-tinted shorts; outfielders get darkened kit.
      shorts: isGK ? this.shade(teamColor, 0.8) : this.shade(kit, 0.62),
      shoulderHi: this.shade(kit, 1.14),
      rim: lum > 140 ? C.deep : C.light,
      skin: SKIN[(idx * 2 + 1) % SKIN.length],
      hair: HAIR[(idx * 3) % HAIR.length],
      phase: idx * 1.7, // deterministic desync (avoid Math.random for reproducibility)
      renderAng: side === 'home' ? 0 : Math.PI,
      stamina: 1,
      sprintLock: false,
      sprinting: false,
      tackleCd: 0,
      recovery: 0,
      ballHold: 0,
      kickT: 0,
      diveT: 0,
      slideT: 0,
      celebrateT: 0,
      leanAng: 0,
      kickPop: 0,
      pvx: 0,
      pvy: 0,
    };
  }

  // Scale an RGB hex by `f` per channel (f<1 darken, f>1 lighten), clamped. Pure
  // integer math, no allocation — safe to call once per player at spawn.
  private shade(hexColor: number, f: number): number {
    const r = Math.min(255, ((hexColor >> 16) & 0xff) * f) | 0;
    const g = Math.min(255, ((hexColor >> 8) & 0xff) * f) | 0;
    const b = Math.min(255, (hexColor & 0xff) * f) | 0;
    return (r << 16) | (g << 8) | b;
  }

  private setupInput(): void {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,J,K,L,M,I,O,SHIFT') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    // Touch: left half = joystick, right half = shoot. CRITICAL (#125): every
    // pointer handler here uses SCREEN space (p.x / p.y), never worldX/worldY — the
    // follow camera scrolls the world, but the on-screen joystick must stay anchored
    // under the finger and the half-split must stay fixed to the screen.
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
    this.keys.J.on('down', () => {
      if (!this.doPass()) this.bufferInput('pass'); // pressed early → fire on reception
    });
    this.keys.L.on('down', () => {
      if (!this.doThroughBall()) this.bufferInput('through'); // lead a runner into space
    });
    this.keys.K.on('down', () => this.manualSwitch());
    this.keys.O.on('down', () => this.doSkill()); // skill move: side-step / knock-and-go
    // Sprint toggle mode: tapping SHIFT flips sprint on/off (vs hold-to-sprint).
    this.keys.SHIFT.on('down', () => {
      if (this.sprintToggleMode) this.sprintToggled = !this.sprintToggled;
    });
    // Tackle (I): tap = standing poke (short reach, no risk); hold past
    // SLIDE_HOLD_MS = committed slide (longer lunge, but a whiff grounds you).
    this.keys.I.on('down', () => {
      this.tackleHeldAt = this.time.now;
      this.tackleSlid = false;
    });
    this.keys.I.on('up', () => {
      if (!this.tackleSlid && this.activeIdx >= 0) this.attemptTackle(this.activeIdx, false);
      this.tackleHeldAt = -1;
      this.tackleSlid = false;
    });
    // M = master mute (global + persisted) — handy for muting the game while
    // recording / on a call without leaving the match.
    this.keys.M.on('down', () => {
      const muted = audio.toggleMute();
      this.muteTag.setVisible(muted);
    });
  }

  // tackle input state (poke on release of a tap, slide once a hold crosses the threshold)
  private tackleHeldAt = -1;
  private tackleSlid = false;
  private static readonly SLIDE_HOLD_MS = 160;

  // Escalate a held tackle into a committed slide once past the threshold.
  private updateTackleInput(): void {
    if (this.tackleHeldAt < 0 || this.tackleSlid) return;
    if (this.time.now - this.tackleHeldAt >= MatchScene.SLIDE_HOLD_MS) {
      if (this.activeIdx >= 0) this.attemptTackle(this.activeIdx, true);
      this.tackleSlid = true;
    }
  }

  // Resolve a tackle attempt by `tacklerIdx` against the current ball carrier.
  // Always costs a short cooldown; a committed slide adds a forward lunge, and a
  // whiffed slide grounds the tackler (recovery). User + AI share this path.
  private attemptTackle(tacklerIdx: number, slide: boolean): TackleResult {
    const t = this.players[tacklerIdx];
    if (t.tackleCd > 0 || t.recovery > 0) return 'miss';
    t.tackleCd = slide ? 0.5 : 0.28;
    if (slide) {
      this.lunge(t);
      t.slideT = 0.4; // committed-slide pose (#137)
    }
    const ownerIdx = this.ball.ownerIdx;
    // nothing to win if the ball is loose or held by a team-mate
    if (ownerIdx < 0 || this.players[ownerIdx].side === t.side) {
      if (slide) {
        t.recovery = 0.5; // a committed slide into nothing still grounds you
        audio.play('whiff'); // dry scuff (#134)
      }
      return 'miss';
    }
    const carrier = this.players[ownerIdx];
    const reach = slide ? SLIDE_REACH : POKE_REACH;
    const d = dist(t.x, t.y, this.ball.x, this.ball.y);
    const team = t.side === 'home' ? this.home : this.away;
    const exposure = ballExposure(dist(carrier.x, carrier.y, this.ball.x, this.ball.y));
    const res = tackleOutcome({ dist: d, reach, exposure, skill: team.defense / 99, slide, roll: this.rng.next() });
    if (res === 'steal') {
      this.ball.ownerIdx = tacklerIdx;
      this.ballCarryAng = Math.atan2(t.faceY, t.faceX);
      this.ball.vx = 0;
      this.ball.vy = 0;
      audio.play('tackle'); // physical thwock of a won challenge
      this.requestTimeFx('tackle'); // brief hit-stop on the clean steal
      this.requestZoomPunch(); // camera punch on the clean steal (#127)
      this.shake(110, 0.009); // short crisp jolt on the clean steal (#139)
      this.fxBurst(this.ball.x, this.ball.y, t.side === 'home' ? this.homeColor : this.awayColor);
    } else if (res === 'loose') {
      this.ball.ownerIdx = -1;
      this.ball.vx = (this.ball.x - carrier.x) * 6;
      this.ball.vy = (this.ball.y - carrier.y) * 6;
      this.lastKickIdx = ownerIdx; // dispossessed player can't instantly re-collect
      this.kickCooldown = 0.12;
      audio.play('tackle');
      this.shake(90, 0.006); // lighter jolt when the ball just pops loose (#139)
      this.fxBurst(this.ball.x, this.ball.y, C.light);
    } else if (slide) {
      t.recovery = 0.5; // whiffed slide → grounded (the risk)
      audio.play('whiff'); // dry scuff on the miss (#134)
    }
    return res;
  }

  // Brief forward impulse along facing — the committed-slide lunge.
  private lunge(t: Player): void {
    const fl = Math.hypot(t.faceX, t.faceY) || 1;
    t.vx += (t.faceX / fl) * 170;
    t.vy += (t.faceY / fl) * 170;
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
      p.kickT = 0; // clear any pose so a celebration never leaks past kickoff (#137)
      p.diveT = 0;
      p.slideT = 0;
      p.celebrateT = 0;
      p.kickPop = 0; // clear any residual kick stretch (#131)
    }
    this.ball.x = this.px + this.pw / 2;
    this.ball.y = this.py + this.ph / 2;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.ownerIdx = -1;
    this.ball.curve = 0; // clear any curve on a kickoff / post-goal reset (#133)
    this.ball.z = 0;
    this.ball.vz = 0;
    this.ball.grounded = true;
    this.inputBuf = null; // a stalled action must not survive a kickoff/goal reset
    this.charging = false;
    // nudge a kicking-side player onto the ball
    const taker = this.players.find((p) => p.side === side && p.role === 'MID')!;
    taker.x = this.ball.x - (side === 'home' ? 30 : -30);
    taker.y = this.ball.y;
    this.pickActive();
  }

  // Fixed simulation step (60Hz). The sim only ever advances by this constant,
  // so physics/AI are identical at any display refresh rate — the prerequisite
  // for deterministic replays and lock-step netcode.
  private static readonly FIXED_DT = 1 / 60;
  // Spiral-of-death guard: at most this many sim steps catch up per render frame
  // (a long stall drops time rather than freezing).
  private static readonly MAX_STEPS = 5;
  private acc = 0; // leftover real time waiting to become a fixed step

  update(_time: number, deltaMs: number): void {
    if (this.finished) return;
    this.realDtSec = deltaMs / 1000; // real frame delta for the render-side zoom punch (#127)
    // Presentation-side time dilation (slow-mo / hit-stop, #126). Advances by REAL
    // time and only changes HOW FAST real time is consumed below — never the sim
    // dt — so the fixed-timestep sim stays bit-identical (determinism / replays).
    this.timeScale = stepTimeScale(this.timeFlow, deltaMs);
    this.tweens.timeScale = this.timeScale; // slow tweens (banner / bloom) coherently
    this.time.timeScale = this.timeScale; // slow delayedCalls coherently
    // accumulate real time SCALED by timeScale, THEN apply the 0.1 backlog cap so
    // spiral-of-death protection is unchanged (cap = max 100ms of sim per frame).
    this.acc += Math.min(0.1, (deltaMs / 1000) * this.timeScale);
    let steps = 0;
    while (this.acc >= MatchScene.FIXED_DT && steps < MatchScene.MAX_STEPS) {
      this.stepSim(MatchScene.FIXED_DT);
      this.acc -= MatchScene.FIXED_DT;
      steps++;
      if (this.finished) return; // a step finished the match → it's leaving the scene
    }
    if (this.acc > MatchScene.FIXED_DT) this.acc = 0; // hit the cap → drop the backlog
    // render once per real frame, regardless of how many sim steps ran
    this.renderEntities();
    this.updateHud();
  }

  // Advance the simulation by one fixed step. No rendering here — that happens
  // once per frame in update() after all steps, so it never depends on dt.
  private stepSim(dt: number): void {
    if (this.state === 'kickoff') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) this.state = 'play';
      return;
    }
    if (this.state === 'goal') {
      this.stateTimer -= dt;
      // let the user skip the COSMETIC celebration tail once its peak has passed (#140):
      // only shortens the freeze, never the kickoff reset, and can't fire before the goal.
      if (this.stateTimer < GOAL_FREEZE - GOAL_SKIP_AFTER && (this.keys.SPACE.isDown || this.keys.J.isDown)) {
        this.stateTimer = 0;
      }
      if (this.stateTimer <= 0) {
        const conceding: Side = this.lastScorer === 'home' ? 'away' : 'home';
        this.beginKickoff(conceding);
        this.showBanner('KICK OFF', C.cyan, 700);
        this.state = 'kickoff';
        this.stateTimer = KICKOFF_HOLD;
      }
      return;
    }
    if (this.state === 'pens') {
      this.updatePenReveal(dt); // staged kick-by-kick reveal, sim-ticked (#142)
      return;
    }
    if (this.state === 'fulltime') return;

    // PLAY
    this.elapsed += dt;
    if (this.switchCd > 0) this.switchCd -= dt;
    if (this.skillCd > 0) this.skillCd -= dt;
    this.updateActiveSelection();
    this.updateTackleInput(); // hold I past the threshold → committed slide
    this.updateUserControl(dt);
    this.updateAI(dt);
    this.integratePlayers(dt);
    this.updateBall(dt);
    this.drainInputBuffer(); // fire any action queued just before we won the ball
    this.updateMovementFx(dt); // sprint dust / turn skid on the active player
    this.updateSurge(dt);
    this.updatePowerups(dt);

    // music tension tracks the bigger Surge meter + how late the match is
    const tension = Math.max(this.surgeHome, this.surgeAway) / 100;
    const closing = isClosingPhase(this.elapsed, this.duration); // final ~10% (#141), pure of elapsed
    const baseIntensity = 0.25 + tension * 0.5 + (this.elapsed / this.duration) * 0.2;
    audio.setIntensity(musicIntensity(baseIntensity, closing)); // closing floor wins over a late-goal tension drop
    audio.setCrowd(crowdLevelFromSurge(tension, this.elapsed / this.duration)); // crowd breathes with Surge (#134)
    // one-shot closing-minutes cue the first step we enter the final stretch (#141)
    if (closing && !this.closingCued) {
      this.closingCued = true;
      audio.play('closing');
      this.showBanner('FINAL MINUTES', C.flare, 700);
    }

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
    // manual defensive switching: keep control of the player you have (switch via K)
    if (!this.autoSwitch) return;
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

  private switchCd = 0; // brief cooldown so tapping switch can't thrash control
  private skillCd = 0; // cooldown between skill moves

  // Skill move (carry only): jink the ball + burst. A lateral input side-steps
  // that way; forward/no input is a knock-and-go down the facing. On cooldown.
  private doSkill(): void {
    if (this.skillCd > 0) return;
    const p = this.players[this.activeIdx];
    if (!p || this.ball.ownerIdx !== this.activeIdx) return; // only while carrying
    const inp = this.inputVector();
    const m = skillMove(p.faceX, p.faceY, inp.x, inp.y);
    // body burst + speed pop, and snap facing + the ball to the jink direction
    p.vx += m.dx * 215;
    p.vy += m.dy * 215;
    p.faceX = m.dx;
    p.faceY = m.dy;
    this.ballCarryAng = Math.atan2(m.dy, m.dx); // sharp touch onto the new side
    this.skillCd = 0.7;
    if (!this.reduceMotion) this.fxSpark(this.ball.x, this.ball.y, C.cyan);
    audio.play('pass');
  }

  private manualSwitch(): void {
    if (this.switchCd > 0) return;
    // pick the most useful defender (nearest goal-side of the ball), not array-next
    const idxs: number[] = [];
    const cands: { x: number; y: number }[] = [];
    this.players.forEach((p, i) => {
      if (p.side !== 'home' || p.role === 'GK') return;
      idxs.push(i);
      cands.push({ x: p.x, y: p.y });
    });
    const cur = idxs.indexOf(this.activeIdx);
    const ownGoalX = this.px; // home defends the left goal line
    const sel = chooseSwitchTarget(cands, this.ball.x, this.ball.y, ownGoalX, cur);
    if (sel < 0) return;
    this.setActive(idxs[sel]);
    this.switchCd = 0.22;
    this.flashSwitch(this.players[idxs[sel]]);
  }

  // Brief expanding ring on the newly-selected player so the eye can follow the
  // switch (reduceMotion: skipped — the gold active ring already marks it).
  private flashSwitch(p: Player): void {
    if (this.reduceMotion) return;
    const ring = this.onWorld(this.add.circle(p.x, p.y, PR + 6).setStrokeStyle(3, C.gold, 1).setDepth(21));
    this.tweens.add({
      targets: ring,
      scale: 2.1,
      alpha: 0,
      duration: 280,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  // --- movement visual feedback (#103) -----------------------------------
  // All cues are decorative (not information) → skipped under reduceMotion. Each
  // is a short self-destroying tween, so nothing accumulates over a match; dust
  // and skid are rate-gated so they can't spam.
  private dustTimer = 0;
  private skidTimer = 0;
  private prevActiveVx = 0;
  private prevActiveVy = 0;

  private updateMovementFx(dt: number): void {
    if (this.reduceMotion) return;
    this.dustTimer -= dt;
    this.skidTimer -= dt;
    const ap = this.players[this.activeIdx];
    if (!ap) return;
    const speed = Math.hypot(ap.vx, ap.vy);
    // sprint dust kicked up behind the player
    if (ap.sprinting && speed > 120 && this.dustTimer <= 0) {
      this.dustTimer = 0.07;
      const inv = 1 / (speed || 1);
      this.fxDust(ap.x - ap.vx * inv * PR, ap.y - ap.vy * inv * PR);
    }
    // hard-turn skid: a big swing in velocity direction at pace
    const pl = Math.hypot(this.prevActiveVx, this.prevActiveVy);
    if (speed > 130 && pl > 130 && this.skidTimer <= 0) {
      const dot = (ap.vx * this.prevActiveVx + ap.vy * this.prevActiveVy) / (speed * pl);
      if (dot < 0.55) {
        this.skidTimer = 0.18;
        this.fxSkid(ap.x, ap.y, Math.atan2(this.prevActiveVy, this.prevActiveVx));
      }
    }
    this.prevActiveVx = ap.vx;
    this.prevActiveVy = ap.vy;
  }

  private fxDust(x: number, y: number): void {
    const d = this.onWorld(
      this.add.circle(x + this.rng.range(-3, 3), y + this.rng.range(-2, 4), this.rng.range(2, 4), 0xcfcad6, 0.5).setDepth(8),
    );
    this.tweens.add({ targets: d, scale: 1.9, alpha: 0, duration: 360, onComplete: () => d.destroy() });
  }

  private fxSkid(x: number, y: number, ang: number): void {
    const s = this.onWorld(this.add.rectangle(x, y + 4, 20, 3, C.deep, 0.45).setDepth(8).setRotation(ang));
    this.tweens.add({ targets: s, alpha: 0, duration: 320, onComplete: () => s.destroy() });
  }

  private fxSpark(x: number, y: number, color: number): void {
    if (this.reduceMotion) return;
    const ring = this.onWorld(this.add.circle(x, y, BR + 1).setStrokeStyle(2, color, 0.9).setDepth(16));
    this.tweens.add({ targets: ring, scale: 2.2, alpha: 0, duration: 240, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
  }

  private fxBurst(x: number, y: number, color: number): void {
    if (this.reduceMotion) return;
    for (let k = 0; k < 8; k++) {
      const a = this.rng.range(0, Math.PI * 2);
      const sp = this.rng.range(40, 120);
      const dot = this.onWorld(this.add.circle(x, y, this.rng.range(2, 4), color).setDepth(17));
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(a) * sp,
        y: y + Math.sin(a) * sp,
        alpha: 0,
        duration: this.rng.range(220, 360),
        onComplete: () => dot.destroy(),
      });
    }
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
    // grounded after a whiffed slide: brake to a stop, no input/sprint this beat
    if (p.recovery > 0) {
      const nb = approachVelocity(p.vx, p.vy, 0, 0, PLAYER_ACCEL, PLAYER_DECEL, dt, this.vScratch);
      p.vx = nb.x;
      p.vy = nb.y;
      p.sprinting = false;
      return;
    }
    const v = this.inputVector();
    const moving = v.x !== 0 || v.y !== 0;
    // Sprint is a stamina-gated burst. You can sprint this frame only if you
    // want to, you're moving, and you're not in the post-exhaustion lock; the
    // pool then drains while sprinting and recovers otherwise.
    const sprintHeld = this.sprintToggleMode ? this.sprintToggled : this.keys.SHIFT.isDown;
    const wantSprint = sprintHeld && moving;
    const sprinting = wantSprint && !p.sprintLock && p.stamina > 0;
    const st = stepStamina(p.stamina, sprinting, p.sprintLock, dt);
    p.stamina = st.stamina;
    p.sprintLock = st.locked;
    if (sprinting && !p.sprinting) audio.play('sprint'); // whoosh on the sprint rising edge
    p.sprinting = sprinting; // drives the ball knock-on while carrying (read in updateBall)
    const speedMul = sprinting ? SPRINT_SPEED_MUL : 1;
    const accel = sprinting ? PLAYER_ACCEL * SPRINT_ACCEL_MUL : PLAYER_ACCEL;
    const speed = this.playerSpeed(p, 'home') * speedMul * turnBleed(p.vx, p.vy, v.x, v.y); // hard-cut speed-bleed (#129)
    // momentum: ease velocity toward the desired vector instead of snapping, so
    // starts feel responsive and hard turns carry weight. Facing stays instant
    // (zero-latency aim — the carried ball still points where you press).
    const nv = approachVelocity(p.vx, p.vy, v.x * speed, v.y * speed, accel, PLAYER_DECEL, dt, this.vScratch);
    p.vx = nv.x;
    p.vy = nv.y;
    if (v.x !== 0 || v.y !== 0) {
      p.faceX = v.x;
      p.faceY = v.y;
    }
  }

  private releaseShot(): void {
    if (!this.charging) return;
    this.charging = false;
    const charge = Math.min(1, (this.time.now - this.chargeStart) / CHARGE_MS);
    // If we can't shoot yet (ball not collected this frame), buffer the charged
    // release so it fires the instant we gain possession — no dropped input.
    if (!this.fireShot(charge)) this.bufferInput('shoot', charge);
  }

  // Fire a charged shot from the active player. Returns false (without firing)
  // when the active player doesn't own the ball, so the caller can buffer it.
  private fireShot(charge: number): boolean {
    const p = this.players[this.activeIdx];
    if (!p || this.ball.ownerIdx !== this.activeIdx) return false;
    // aim: face direction, biased toward opponent goal if little input
    let ax = p.faceX;
    let ay = p.faceY;
    if (Math.abs(ax) + Math.abs(ay) < 0.2) {
      ax = 1; // home attacks +x
      ay = (this.py + this.ph / 2 - p.y) / 200;
    }
    const len = Math.hypot(ax, ay) || 1;
    // sweet-window release (#133): inside the window snaps to max power; otherwise
    // power is the raw charge. The launch is straight — curve is applied in flight.
    const rel = shotRelease(charge);
    const power = 460 + rel.power01 * 520;
    const vx = (ax / len) * power;
    const vy = (ay / len) * power;
    this.registerShot(p.side, p.x, p.y, vx, vy); // straight launch → on-target heuristic unchanged
    this.kickBall(p, vx, vy); // resets ball.curve to 0
    if (charge < CHIP_CHARGE) this.loftBall(170); // a light tap chips the shot up + over a keeper (#132)
    if (rel.sweet) {
      // curl the free ball toward the aim's lateral side; treat as a firework
      const aySign = ay === 0 ? 1 : Math.sign(ay);
      this.ball.curve = curveAccel(rel.power01) * aySign;
      this.shake(120, 0.006);
      this.requestTimeFx('screamer'); // one slow-mo, shared with the goal path (no extra strobe)
      this.requestZoomPunch();
      this.showBanner('CURLER!', C.lime, 550);
    } else if (charge > 0.8) {
      this.shake(120, 0.006);
      this.requestTimeFx('screamer'); // slow-mo as the screamer flies
      this.requestZoomPunch(); // camera punch on the screamer (#127)
      this.showBanner('SCREAMER!', C.surge, 500);
    }
    return true;
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

  // Returns false (without passing) when the active player doesn't own the ball,
  // so the caller can buffer the press and retry it on reception.
  private doPass(): boolean {
    const p = this.players[this.activeIdx];
    if (!p || this.ball.ownerIdx !== this.activeIdx) return false;
    // gather home outfield mates (keep their real indices for setActive)
    const mateIdx: number[] = [];
    const mates: PassMate[] = [];
    this.players.forEach((t, i) => {
      if (t.side !== 'home' || i === this.activeIdx || t.role === 'GK') return;
      mateIdx.push(i);
      mates.push({ x: t.x, y: t.y, vx: t.vx, vy: t.vy });
    });
    if (!mates.length) return false;
    // assist: pick the mate inside the aim cone (aim = facing). Falls back to
    // the most-advanced mate so a press is never wasted.
    let sel = choosePassTarget(p.x, p.y, p.faceX, p.faceY, mates, this.passCone, 1);
    if (sel < 0) {
      let best = -1;
      let bestScore = -Infinity;
      mates.forEach((m, k) => {
        const score = (m.x - p.x) * 1.5 - dist(p.x, p.y, m.x, m.y);
        if (score > bestScore) {
          bestScore = score;
          best = k;
        }
      });
      sel = best;
    }
    if (sel < 0) return false;
    const targetIdx = mateIdx[sel];
    const t = this.players[targetIdx];
    // lead the receiver slightly into space along their run, clamped in-bounds
    const lead = 0.22;
    const tx = Phaser.Math.Clamp(t.x + t.vx * lead, this.px + BR, this.px + this.pw - BR);
    const ty = Phaser.Math.Clamp(t.y + t.vy * lead, this.py + BR, this.py + this.ph - BR);
    const dx = tx - p.x;
    const dy = ty - p.y;
    const len = Math.hypot(dx, dy) || 1;
    let power = Math.min(640, 300 + len * 1.4);
    // one-touch: passing within the receive window adds zip + a style callout +
    // a small Surge nudge (the GDD rhythm engine; uses the #94 receive ref).
    if (this.lastReceiveAt >= 0 && isOneTouch(this.lastReceiveAt, this.time.now)) {
      power = Math.min(720, power * 1.15);
      this.showBanner('ONE-TOUCH!', C.cyan, 450);
      this.surgeHome = Math.min(100, this.surgeHome + 4);
    }
    this.kickBall(p, (dx / len) * power, (dy / len) * power);
    this.setActive(targetIdx);
    return true;
  }

  // Through-ball: a weighted pass into the space ahead of a forward runner.
  // Returns false (so the press can be buffered) if the active player has no ball;
  // falls back to a normal forward pass when no forward runner is in the cone.
  private doThroughBall(): boolean {
    const p = this.players[this.activeIdx];
    if (!p || this.ball.ownerIdx !== this.activeIdx) return false;
    const attackDir = 1; // home attacks +x
    const mateIdx: number[] = [];
    const mates: PassMate[] = [];
    this.players.forEach((t, i) => {
      if (t.side !== 'home' || i === this.activeIdx || t.role === 'GK') return;
      mateIdx.push(i);
      mates.push({ x: t.x, y: t.y, vx: t.vx, vy: t.vy });
    });
    if (!mates.length) return false;
    // aim generally forward (nudged by facing), wide cone, strong forward bias →
    // the most advanced runner roughly in front of you
    const sel = choosePassTarget(p.x, p.y, attackDir + p.faceX * 0.4, p.faceY * 0.5, mates, PASS_CONE.full, attackDir, 2.5);
    if (sel < 0) return this.doPass(); // no forward option → a normal forward pass
    const targetIdx = mateIdx[sel];
    const t = this.players[targetIdx];
    const lead = throughBallLead(t.x, t.y, t.vx, t.vy, attackDir);
    const tx = Phaser.Math.Clamp(lead.x, this.px + BR, this.px + this.pw - BR);
    const ty = Phaser.Math.Clamp(lead.y, this.py + BR, this.py + this.ph - BR);
    const dx = tx - p.x;
    const dy = ty - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const power = Math.min(720, 360 + len * 1.5); // driven, with extra pace to beat the line
    // lofted variant (#132): if a defender sits in the passing lane, lift it over them
    const blocked = this.players.some(
      (q) => q.side !== p.side && q.role !== 'GK' && segmentBlocked(p.x, p.y, tx, ty, q.x, q.y, PR + 8),
    );
    this.kickBall(p, (dx / len) * power, (dy / len) * power);
    if (blocked) this.loftBall(len);
    this.setActive(targetIdx);
    return true;
  }

  // --- input buffer ------------------------------------------------------
  // Queue an action pressed a hair before it's legal; drainInputBuffer() fires
  // it the instant the active player owns the ball (within INPUT_BUFFER_MS).
  private inputBuf: BufferedInput | null = null;
  private lastReceiveAt = -1; // when the user-controlled player last collected the ball (one-touch ref)

  private bufferInput(action: string, charge?: number): void {
    this.inputBuf = { action, t: this.time.now, charge };
  }

  private drainInputBuffer(): void {
    const buf = this.inputBuf;
    if (!buf) return;
    const now = this.time.now;
    if (bufferExpired(buf, now, INPUT_BUFFER_MS)) {
      this.inputBuf = null; // stale press — never let it fire late
      return;
    }
    if (!bufferConsumable(buf, now, INPUT_BUFFER_MS)) return;
    // only legal once the controlled player actually has the ball
    if (this.activeIdx < 0 || this.ball.ownerIdx !== this.activeIdx) return;
    const done =
      buf.action === 'shoot'
        ? this.fireShot(buf.charge ?? 0.5)
        : buf.action === 'pass'
          ? this.doPass()
          : buf.action === 'through'
            ? this.doThroughBall()
            : false;
    if (done) this.inputBuf = null;
  }

  // Loft the just-kicked ball: set vz so it arcs and lands ~at the lead point (#132).
  private loftBall(dist: number): void {
    const speed = Math.hypot(this.ball.vx, this.ball.vy) || 1;
    const l = loftLaunch(dist, speed);
    this.ball.vz = l.vz;
    this.ball.z = 0;
    this.ball.grounded = false;
  }

  private kickBall(from: Player, vx: number, vy: number): void {
    this.ball.vx = vx;
    this.ball.vy = vy;
    this.ball.ownerIdx = -1;
    this.ball.curve = 0; // a fresh kick / pass has no curve until fireShot sets it (#133)
    this.ball.z = 0; // grounded by default; doThroughBall / fireShot may loft it after (#132)
    this.ball.vz = 0;
    this.ball.grounded = true;
    // place just ahead so we don't immediately re-collect
    const len = Math.hypot(vx, vy) || 1;
    this.ball.x = from.x + (vx / len) * (PR + BR + 2);
    this.ball.y = from.y + (vy / len) * (PR + BR + 2);
    this.lastKickIdx = this.players.indexOf(from);
    this.kickCooldown = 0.18;
    from.kickT = 0.28; // kick wind-up + follow-through pose (#137; user + AI)
    from.kickPop = shotPower01(len); // power-scaled kick stretch impulse, springs back (#131)
    audio.playKick(shotPower01(len)); // power-scaled thwock: a screamer hits harder than a tap
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

    // Marking: when a side has the ball, the OTHER side's non-chaser outfielders
    // each pick up a man (one-to-one, most-dangerous attacker first) and sit
    // goal-side of him. Computed once per frame (O(d*a), d,a ≤ 4).
    const markTarget: Record<number, { x: number; y: number }> = {};
    const owner = this.ball.ownerIdx;
    if (owner >= 0) {
      const attSide = this.players[owner].side;
      const defSide: Side = attSide === 'home' ? 'away' : 'home';
      const ownGoalX = defSide === 'home' ? this.px : this.px + this.pw;
      const ownGoalY = this.py + this.ph / 2;
      const defIdx: number[] = [];
      const defPos: { x: number; y: number }[] = [];
      this.players.forEach((q, qi) => {
        if (q.side === defSide && q.role !== 'GK' && qi !== chaser[defSide]) {
          defIdx.push(qi);
          defPos.push({ x: q.x, y: q.y });
        }
      });
      const att = this.players
        .map((q, qi) => ({ q, qi }))
        .filter((o) => o.q.side === attSide && o.q.role !== 'GK' && o.qi !== owner)
        .sort((a, b) => Math.abs(a.q.x - ownGoalX) - Math.abs(b.q.x - ownGoalX)); // nearest our goal = most dangerous
      const assign = assignMarks(defPos, att.map((o) => ({ x: o.q.x, y: o.q.y })));
      assign.forEach((aIdx, d) => {
        if (aIdx >= 0) {
          const atk = att[aIdx].q;
          markTarget[defIdx[d]] = markPoint(atk.x, atk.y, ownGoalX, ownGoalY);
        }
      });
    }

    this.players.forEach((p, i) => {
      if (p.isUser) return;
      p.sprinting = false; // AI never sprints; keep the knock-on flag clean for the carry block
      // grounded after a whiffed slide: can't act, just brake to a stop
      if (p.recovery > 0) {
        const nb = approachVelocity(p.vx, p.vy, 0, 0, PLAYER_ACCEL, PLAYER_DECEL, dt, this.vScratch);
        p.vx = nb.x;
        p.vy = nb.y;
        return;
      }
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
        // close enough to an opponent carrier → commit a tackle (mostly pokes,
        // an occasional slide). This is how the AI wins the ball now that the
        // passive auto-steal is gone; difficulty scales how eagerly it dives in.
        const oppOwns = this.ball.ownerIdx >= 0 && this.players[this.ball.ownerIdx].side !== p.side;
        if (oppOwns && p.tackleCd <= 0 && dist(p.x, p.y, this.ball.x, this.ball.y) < POKE_REACH) {
          this.attemptTackle(i, this.rng.bool(0.12 * this.diff.aiAccuracy));
        }
      } else if (teamHasBall) {
        // IN POSSESSION, off the ball: offer options instead of standing in shape
        const carrier = this.players[this.ball.ownerIdx];
        if (p.role === 'FWD') {
          // staggered depth run ahead of the ball (a through-ball target, #97),
          // dropping to a high line between runs so the defence can recover/react
          if (runActive(this.elapsed, p.phase)) {
            const r = forwardRunTarget(p.hy, this.ball.x, attackDir, this.px, this.px + this.pw, 200);
            tx = r.x;
            ty = r.y;
          } else {
            tx = Phaser.Math.Clamp(this.ball.x + attackDir * 70, this.px + 40, this.px + this.pw - 40);
            ty = p.hy;
          }
        } else if (p.role === 'MID') {
          // short support angle goal-side of the carrier (a safe outlet, #96)
          const s = supportTarget(carrier.x, carrier.y, p.hy, attackDir, 90);
          tx = s.x;
          ty = s.y;
        } else {
          // defenders push the line up modestly + shift ball-side, but stay home-ish
          const ballAdvance = (this.ball.x - (this.px + this.pw / 2)) / this.pw;
          tx = p.hx + attackDir * 40 + ballAdvance * 70 * attackDir;
          ty = p.hy + (this.ball.y - (this.py + this.ph / 2)) * 0.2;
        }
      } else if (markTarget[i]) {
        // OUT OF POSSESSION, marking a man: sit goal-side of him (assigned above)
        tx = markTarget[i].x;
        ty = markTarget[i].y;
      } else {
        // OUT OF POSSESSION, spare defender: hold defensive shape — drop a touch
        // and shift to the ball side (covers central space in front of goal)
        const ballAdvance = (this.ball.x - (this.px + this.pw / 2)) / this.pw; // -0.5..0.5
        tx = p.hx + attackDir * -10 + ballAdvance * 90 * attackDir;
        ty = p.hy + (this.ball.y - (this.py + this.ph / 2)) * 0.18;
      }

      this.steer(p, tx, ty, this.playerSpeed(p, p.side) * speedScale, dt);
    });
  }

  private updateGK(p: Player, dt: number): void {
    const cy = this.py + this.ph / 2;
    const owns = this.ball.ownerIdx >= 0 && this.players[this.ball.ownerIdx] === p;
    // Caught it: hold briefly, then distribute upfield (roll/throw to a mate).
    if (owns) {
      p.ballHold += dt;
      const goalX = p.side === 'home' ? this.px + 24 : this.px + this.pw - 24;
      this.steer(p, goalX, Phaser.Math.Clamp(this.ball.y, cy - this.goalH / 2, cy + this.goalH / 2), this.playerSpeed(p, p.side) * 0.9, dt);
      if (p.ballHold > 0.55) {
        this.aiPassToTeammate(p); // distribution: best forward outlet
        p.ballHold = 0;
      }
      return;
    }
    p.ballHold = 0;
    const goalLineX = p.side === 'home' ? this.px : this.px + this.pw;
    const comeOutSign = p.side === 'home' ? 1 : -1;
    // rush out to smother a very close ball in our third; otherwise hold the angle
    const closeBall = dist(p.x, p.y, this.ball.x, this.ball.y) < 88;
    const inOurThird = p.side === 'home' ? this.ball.x < this.px + 200 : this.ball.x > this.px + this.pw - 200;
    let targetX: number;
    let targetY: number;
    if (closeBall && inOurThird) {
      targetX = this.ball.x;
      targetY = this.ball.y;
    } else {
      const t = keeperTarget(this.ball.x, this.ball.y, goalLineX, cy, comeOutSign, this.goalH);
      targetX = t.x;
      targetY = t.y;
    }
    this.steer(p, targetX, targetY, this.playerSpeed(p, p.side) * 0.95, dt);
  }

  // Resolve a fast shot that has reached a keeper: catch (hold → distribute),
  // parry (loose rebound away from goal), or beaten (continues, may score). The
  // keeper lunges toward the ball regardless (the dive). Reaction is
  // difficulty-scaled so corner shots beat it but tame efforts don't.
  private resolveKeeperSaves(): void {
    if (this.ball.ownerIdx >= 0) return;
    if (!this.ball.grounded) return; // a lofted ball clears a ground keeper (#132)
    const speed = Math.hypot(this.ball.vx, this.ball.vy);
    if (speed < 220) return; // only shots/driven balls trigger a diving save
    for (let i = 0; i < this.players.length; i++) {
      const k = this.players[i];
      if (k.role !== 'GK') continue;
      // the ball must be heading toward THIS keeper's goal
      const towardOwnGoal = k.side === 'home' ? this.ball.vx < 0 : this.ball.vx > 0;
      if (!towardOwnGoal) continue;
      const d = dist(k.x, k.y, this.ball.x, this.ball.y);
      if (d > SAVE_REACH) continue;
      // dive: lunge toward the ball's line
      const dy = this.ball.y - k.y;
      k.vy += Math.sign(dy) * Math.min(220, Math.abs(dy) * 8);
      k.diveT = 0.45; // keeper dive pose (#137)
      const reaction = this.keeperReaction(k.side);
      const res = saveOutcome(d, SAVE_REACH, reaction, this.rng.next());
      if (res === 'catch') {
        this.ball.ownerIdx = i;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.curve = 0; // a caught ball has no curve (#133)
        this.ball.z = 0;
        this.ball.vz = 0;
        this.ball.grounded = true;
        this.ballCarryAng = Math.atan2(k.faceY, k.faceX);
        k.ballHold = 0;
        audio.play('save');
      } else if (res === 'parry') {
        // deflect the rebound away from goal (out toward the field, off the line)
        const away = k.side === 'home' ? 1 : -1;
        this.ball.vx = away * Math.max(260, Math.abs(this.ball.vx) * 0.6);
        this.ball.vy = (this.ball.y - k.y) * 4 + this.rng.range(-60, 60);
        this.ball.curve = 0; // a parry kills the curve — the rebound flies straight (#133)
        this.ball.z = 0;
        this.ball.vz = 0;
        this.ball.grounded = true;
        this.lastKickIdx = i;
        this.kickCooldown = 0.1;
        audio.play('save');
      }
      // 'beaten' → ball continues unchanged (the goal-line check may score it)
      return; // at most one keeper resolves per frame
    }
  }

  // Keeper reaction 0..1 from team defence + difficulty (the GDD's difficulty-
  // scaled shot-stopping). The away keeper rides the AI difficulty; the user's
  // keeper gets a steady, fair reaction.
  private keeperReaction(side: Side): number {
    const team = side === 'home' ? this.home : this.away;
    const base = 0.45 + (team.defense - 70) / 120; // ~0.3..0.7 by team
    const diffTerm = side === 'away' ? (this.diff.aiAccuracy - 0.7) * 0.4 : 0;
    return Math.min(0.92, Math.max(0.2, base + diffTerm));
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

  private steer(p: Player, tx: number, ty: number, speed: number, dt: number): void {
    const dx = tx - p.x;
    const dy = ty - p.y;
    const len = Math.hypot(dx, dy);
    let desVx = 0;
    let desVy = 0;
    if (len >= 4) {
      const ux = dx / len;
      const uy = dy / len;
      const bleed = turnBleed(p.vx, p.vy, ux, uy); // AI shares the planted-cut weight (#129)
      desVx = ux * speed * bleed;
      desVy = uy * speed * bleed;
      p.faceX = ux;
      p.faceY = uy;
    }
    // same momentum model as the user (AI eases to its target velocity and
    // brakes to a stop near it) so every figure shares the weighty feel.
    const nv = approachVelocity(p.vx, p.vy, desVx, desVy, PLAYER_ACCEL, PLAYER_DECEL, dt, this.vScratch);
    p.vx = nv.x;
    p.vy = nv.y;
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
    // close control: carrying the ball costs a touch of top speed (the trade-off
    // a defender exploits). O(1) owner check — no indexOf.
    const owns = this.ball.ownerIdx >= 0 && this.players[this.ball.ownerIdx] === p;
    const dribble = owns ? DRIBBLE_SPEED_MUL : 1;
    return base * surgeBoost * userBoost * puBoost * puFreeze * dribble;
  }

  // --- physics -----------------------------------------------------------

  private integratePlayers(dt: number): void {
    if (this.bumpCd > 0) this.bumpCd -= dt; // body-bump sfx/fx rate-limit (#130)
    for (const p of this.players) {
      // tick tackle cooldown + post-slide recovery lockout
      if (p.tackleCd > 0) p.tackleCd = Math.max(0, p.tackleCd - dt);
      if (p.recovery > 0) p.recovery = Math.max(0, p.recovery - dt);
      // pose countdowns (#137) — sim-ticked so replays produce identical pose timings
      if (p.kickT > 0) p.kickT = Math.max(0, p.kickT - dt);
      if (p.diveT > 0) p.diveT = Math.max(0, p.diveT - dt);
      if (p.slideT > 0) p.slideT = Math.max(0, p.slideT - dt);
      if (p.celebrateT > 0) p.celebrateT = Math.max(0, p.celebrateT - dt);
      if (p.kickPop > 0) p.kickPop = Math.max(0, p.kickPop - dt * 5); // springs back in ~0.2s (#131)
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
          // shoulder-barge: a firm closing along the contact normal exchanges momentum
          // so a fast body knocks a slow one and loses a little pace (#130). Loop order
          // is fixed → deterministic; ball.ownerIdx is untouched (possession intact).
          const closing = (a.vx - b.vx) * ux + (a.vy - b.vy) * uy;
          if (closing > BUMP_THRESHOLD) {
            const r = resolveBump(a.vx, a.vy, b.vx, b.vy, ux, uy, BUMP_TRANSFER, BUMP_CAP, this.bumpScratch);
            a.vx = r.ax;
            a.vy = r.ay;
            b.vx = r.bx;
            b.vy = r.by;
            this.onBodyBump((a.x + b.x) / 2, (a.y + b.y) / 2);
          }
        }
      }
    }
  }

  // Body-bump feedback (#130): a soft thud + a scuff, both rate-limited so a
  // pile-up doesn't spam. Audio is feel (not reduceMotion-gated); the scuff is
  // gated and uses NO rng, so it never perturbs the sim's deterministic stream.
  private onBodyBump(x: number, y: number): void {
    if (this.bumpCd > 0) return;
    this.bumpCd = 0.1;
    audio.play('bump');
    if (!this.reduceMotion) this.fxScuff(x, y);
  }

  private fxScuff(x: number, y: number): void {
    const d = this.onWorld(this.add.circle(x, y, 3, 0xcfcad6, 0.45).setDepth(8));
    this.tweens.add({ targets: d, scale: 2, alpha: 0, duration: 280, onComplete: () => d.destroy() });
  }

  private updateBall(dt: number): void {
    if (this.kickCooldown > 0) this.kickCooldown -= dt;
    if (this.wallShakeCd > 0) this.wallShakeCd -= dt; // rate-limit wall/woodwork shake (#139)

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
      if (owner >= 0 && this.ball.grounded) {
        const collectSpeed = Math.hypot(this.ball.vx, this.ball.vy); // pre-collect (for the touch fx)
        this.ball.ownerIdx = owner;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.curve = 0; // collecting kills any in-flight curve (#133)
        this.ball.z = 0;
        this.ball.vz = 0;
        this.ball.grounded = true;
        // First touch: cushion the ball toward the receiver's facing (which, for
        // the user, is their held movement direction) so a received pass settles
        // under control instead of snapping from a stale carry angle.
        const o = this.players[owner];
        this.ballCarryAng = Math.atan2(o.faceY, o.faceX);
        // mark reception time on the controlled player (one-touch window ref, #96)
        if (owner === this.activeIdx) this.lastReceiveAt = this.time.now;
        // clean first-touch spark when settling a moving ball (readability of #93)
        if (collectSpeed > 170) this.fxSpark(this.ball.x, this.ball.y, o.side === 'home' ? this.homeColor : this.awayColor);
      }
    } else {
      // carry the ball ahead of the owner: distance grows with speed (a sprint
      // becomes a knock-on) and the carry angle eases toward facing so hard
      // turns drag the ball around as a touch rather than teleporting it.
      const ownerIdx = this.ball.ownerIdx;
      const p = this.players[ownerIdx];
      const facing = Math.atan2(p.faceY, p.faceX);
      this.ballCarryAng = easeCarryAngle(this.ballCarryAng, facing, this.reduceMotion ? 1 : 0.22);
      const speed = Math.hypot(p.vx, p.vy);
      const off = carryOffset(speed, this.playerSpeed(p, p.side), p.sprinting);
      this.ball.x = p.x + Math.cos(this.ballCarryAng) * off;
      this.ball.y = p.y + Math.sin(this.ballCarryAng) * off;
      // keep the carried ball on the pitch so a knock-on never clips a wall/net
      this.ball.x = Phaser.Math.Clamp(this.ball.x, this.px + BR, this.px + this.pw - BR);
      this.ball.y = Phaser.Math.Clamp(this.ball.y, this.py + BR, this.py + this.ph - BR);
      this.ball.vx = 0;
      this.ball.vy = 0;
      // Tackling is no longer a passive coin-flip resolved here — possession is
      // won only by an explicit poke/slide attempt (attemptTackle), from the
      // user (I) or an AI defender in range. See updateUserControl / updateAI.
    }

    if (this.ball.ownerIdx >= 0) return;

    // free ball motion + drag
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;
    const drag = Math.pow(0.34, dt);
    this.ball.vx *= drag;
    this.ball.vy *= drag;
    // in-flight curve from a sweet-window release (#133): a decaying lateral accel,
    // integrated per fixed step from ball state only (deterministic, no wall-clock)
    if (this.ball.curve !== 0) {
      const cs = stepCurve(this.ball.vx, this.ball.vy, this.ball.curve, dt, this.curveScratch);
      this.ball.vx = cs.vx;
      this.ball.vy = cs.vy;
      this.ball.curve = cs.curve;
    }
    // vertical loft integration (#132): an airborne ball arcs over ground play and
    // lands (z→0) at the lead point; per fixed step from ball state → deterministic.
    if (!this.ball.grounded) {
      this.ball.z += this.ball.vz * dt;
      this.ball.vz -= LOFT_GRAVITY * dt;
      if (this.ball.z <= 0) {
        this.ball.z = 0;
        this.ball.vz = 0;
        this.ball.grounded = true;
      }
    }

    // top/bottom walls
    if (this.ball.y < this.py + BR) {
      this.onBallWallHit(Math.hypot(this.ball.vx, this.ball.vy), false); // incoming speed before the bounce (#139)
      this.ball.y = this.py + BR;
      this.ball.vy = Math.abs(this.ball.vy) * 0.7;
    } else if (this.ball.y > this.py + this.ph - BR) {
      this.onBallWallHit(Math.hypot(this.ball.vx, this.ball.vy), false);
      this.ball.y = this.py + this.ph - BR;
      this.ball.vy = -Math.abs(this.ball.vy) * 0.7;
    }

    // a keeper may dive on a shot before it reaches the line
    this.resolveKeeperSaves();
    if (this.ball.ownerIdx >= 0) return; // caught — stop free motion this frame

    // posts as objects (#135): clang off the woodwork BEFORE the goal-mouth check,
    // so a post hit is never miscounted as a goal. Pure, in-sim, deterministic.
    if (this.tryPostBounce()) return;

    // goal lines
    const gy0 = this.py + this.ph / 2 - this.goalH / 2;
    const gy1 = gy0 + this.goalH;
    if (this.ball.x < this.px + BR) {
      if (this.ball.y > gy0 && this.ball.y < gy1) {
        this.scoreGoal('away');
        return;
      }
      this.onBallWallHit(Math.hypot(this.ball.vx, this.ball.vy), true); // off the post / byline — sharper tick (#139)
      this.ball.x = this.px + BR;
      this.ball.vx = Math.abs(this.ball.vx) * 0.6;
    } else if (this.ball.x > this.px + this.pw - BR) {
      if (this.ball.y > gy0 && this.ball.y < gy1) {
        this.scoreGoal('home');
        return;
      }
      this.onBallWallHit(Math.hypot(this.ball.vx, this.ball.vy), true); // off the far post / byline (#139)
      this.ball.x = this.px + this.pw - BR;
      this.ball.vx = -Math.abs(this.ball.vx) * 0.6;
    }
  }

  // --- goals / surge -----------------------------------------------------

  private scoreGoal(side: Side): void {
    if (this.state !== 'play') return;
    this.lastScorer = side;
    // ripple the scored goal's net from the ball's entry point (#135)
    this.rippleSide = side;
    this.rippleY = Phaser.Math.Clamp(this.ball.y, this.goalGy0, this.goalGy1);
    this.rippleAge = 0;
    this.requestTimeFx('goal'); // freeze + slow-mo on the net-hit (the firework moment)
    this.requestZoomPunch(); // camera punch-in on the goal (#127)
    // the scorer (or nearest scoring-side outfielder) celebrates for the goal freeze (#137),
    // sized to the re-budgeted freeze so the pose fills it exactly (#140)
    const freeze = this.reduceMotion ? GOAL_FREEZE_RM : GOAL_FREEZE;
    const goalX = side === 'home' ? this.px + this.pw : this.px;
    const celebIdx = chooseCelebrant(side, this.lastKickIdx, this.players, goalX, this.players.map((pl) => pl.x));
    if (celebIdx >= 0) this.players[celebIdx].celebrateT = freeze;
    if (side === 'home') this.homeGoals++;
    else this.awayGoals++;
    // reward trailing team with surge reset; scoring team modest
    if (side === 'home') this.surgeHome = 0;
    else this.surgeAway = 0;
    const speed = Math.hypot(this.ball.vx, this.ball.vy);
    this.shakeFor(shotPower01(speed)); // power-scaled goal shake: a screamer rattles, a tap-in nudges (#139)
    this.flash(180, 255, 255, 255);
    const col = side === 'home' ? this.homeColor : this.awayColor;
    this.showBanner('GOAL!', col, 1300);
    this.updateHud();
    this.state = 'goal';
    this.stateTimer = freeze; // re-budgeted post-goal beat (#140)
    // burst of particles
    this.goalBurst(col);
    // bloom + scorer/power popup (motion only; bloom alpha capped and slightly
    // delayed so it never co-peaks with the camera flash — photosensitivity).
    if (!this.reduceMotion) {
      const bloom = this.onUi(this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0xffffff, 0.25).setDepth(48));
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
    const popup = this.onWorld(
      this.add
        .text(x0, this.py + this.ph / 2 - 64, `${code}  PWR ${pwr}`, {
          fontFamily: FONT_DISPLAY,
          fontSize: '22px',
          color: hex(col),
        })
        .setOrigin(0.5)
        .setDepth(49)
        .setStroke('#0e0a24', 4), // dark outline keeps it legible on any pitch colour
    );
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
        const dot = this.onWorld(this.add.circle(x, y, this.rng.range(2, 5), color).setDepth(40));
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
      const dot = this.onWorld(
        glow
          ? this.add.image(x, y, 'softcircle').setTint(col).setScale(size / 12).setDepth(40)
          : (this.add.circle(x, y, size, col).setDepth(40) as Phaser.GameObjects.GameObject),
      );
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
    const c = this.onWorld(this.add.container(x, y).setDepth(12));
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

  // Power-scaled camera shake for a 0..1 impact (#139), within the readability cap.
  private shakeFor(impact01: number): void {
    this.shake(shakeDuration(impact01), shakeIntensity(impact01));
  }

  // Ball striking a wall / the woodwork: a tactile shake tick above a firm-hit
  // threshold, rate-limited by wallShakeCd so fast pinball never blurs the frame.
  // (Also the seam #134 hangs the wall/post impact SFX off.)
  private wallShakeCd = 0;
  private onBallWallHit(speed: number, woodwork: boolean): void {
    if (speed < 240 || this.wallShakeCd > 0) return;
    this.wallShakeCd = 0.12;
    const impact = Math.min(1, speed / 980); // shotPower01-style normalisation
    this.shake(woodwork ? 90 : 70, (woodwork ? 0.008 : 0.005) + impact * 0.004);
    audio.playImpact(woodwork ? 'post' : 'wallthud', impact); // impact voice — not reduceMotion-gated (#134)
  }

  private shake(dur: number, intensity: number): void {
    if (!this.reduceMotion) this.cameras.main.shake(dur, intensity);
  }

  private flash(dur: number, r: number, g: number, b: number): void {
    if (!this.reduceMotion) this.cameras.main.flash(dur, r, g, b);
  }

  // Shared time-fx trigger (#126), consumed here and by sibling juice issues.
  // No-op under Reduce Motion or with the SLOW MOTION setting off. goal = a hard
  // freeze then slow-mo; screamer = slow-mo only; tackle = a short hit-stop.
  private requestTimeFx(kind: 'goal' | 'screamer' | 'tackle'): void {
    if (this.reduceMotion || !this.slowMoOn) return;
    if (kind === 'goal') {
      requestHitStop(this.timeFlow, 80);
      requestSlowMo(this.timeFlow, 0.45, 800);
    } else if (kind === 'screamer') {
      requestSlowMo(this.timeFlow, 0.45, 600);
    } else {
      requestHitStop(this.timeFlow, 80);
    }
  }

  // Snap-zoom punch (#127): briefly tighten ~18% on a firework moment, then ease
  // back to the resting zoom. Gated like shake/flash (off under reduceMotion) and
  // only while the follow is live, so it never double-stacks with the full-time
  // victory zoom.
  private requestZoomPunch(): void {
    if (this.reduceMotion || !this.camFollow) return;
    this.zoomCur = this.restZoom * ZOOM_PUNCH;
  }

  private renderEntities(): void {
    // goal net mesh + ripple (#135): cheap fixed-vertex redraw; the ripple age
    // advances on render time (the post collision is in-sim, this is presentation)
    this.rippleAge += this.realDtSec;
    this.drawNet();
    // Players are redrawn every frame: an upright shadow pass (depth 9) under a
    // y-sorted body pass (depth 10), so nearer (lower) figures overlap farther
    // ones. Both batch into one Graphics each — trivial for 10 players.
    this.shadowGfx.clear();
    this.shadowGfx.fillStyle(C.deep, 0.26);
    for (const p of this.players) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
      const ds = depthScale(p.y, this.py, this.ph); // shadow shrinks with the figure (#128)
      this.shadowGfx.fillEllipse(p.x + 2, p.y + 3, PR * 2.1 * ds, PR * 1.45 * ds);
    }
    this.bodyGfx.clear();
    // Surge-reactive run cadence (#138): a surging side's legs turn over faster +
    // swing wider. Per-side factor computed ONCE per frame; per-side phase
    // accumulators advance by real dt so changing surge never jumps the swing.
    // Frozen under reduceMotion (the gait gate zeroes the swing regardless).
    this.cadenceHome = surgeCadence(this.surgeHome / 100);
    this.cadenceAway = surgeCadence(this.surgeAway / 100);
    if (!this.reduceMotion) {
      this.runPhaseHome += this.realDtSec * RUN_BASE_FREQ * this.cadenceHome;
      this.runPhaseAway += this.realDtSec * RUN_BASE_FREQ * this.cadenceAway;
    }
    // y-sort into a reused scratch array (no per-frame array copy)
    const order = this.renderOrder;
    for (let i = 0; i < this.players.length; i++) order[i] = this.players[i];
    order.length = this.players.length;
    order.sort((a, b) => a.y - b.y);
    for (let i = 0; i < order.length; i++) this.drawPlayer(order[i]);

    const bz = this.ball.z;
    this.ballGfx.setPosition(this.ball.x, this.ball.y - bz); // lifted by height when airborne (#132)
    this.ballGfx.setScale(1 + bz * 0.004); // grows slightly when high

    // ball trail (afterimages): a LOOSE fast ball, OR a sprint knock-on where the
    // carried ball is pushed well off the foot (#136). The carried ball reports
    // vx/vy=0, so we sample its world position (which still advances as carryOffset
    // pushes it ahead) and gate on ballExposure — tight close-control stays clean.
    this.trailGfx.clear();
    const speed = Math.hypot(this.ball.vx, this.ball.vy);
    const carrier = this.ball.ownerIdx >= 0 ? this.players[this.ball.ownerIdx] : null;
    const carryExposure = carrier
      ? ballExposure(Math.hypot(this.ball.x - carrier.x, this.ball.y - carrier.y))
      : 0;
    // streak intensity is gated (sprint + exposure>cue) and reduceMotion-suppressed
    const streak = carryStreakAlpha(carryExposure, !!carrier && carrier.sprinting && !this.reduceMotion, CARRY_EXPOSE_CUE);
    const knockOn = streak > 0;
    const looseFast = this.ball.ownerIdx < 0 && speed > 140;
    if (looseFast || knockOn) {
      this.ballTrail.push({ x: this.ball.x, y: this.ball.y });
      if (this.ballTrail.length > 8) this.ballTrail.shift();
    } else if (this.ballTrail.length) {
      this.ballTrail.shift();
    }
    // a knock-on streak tints toward the owner's team colour and fades up with
    // exposure (a controlled-but-loose touch); a loose ball keeps the neutral tint
    const trailTint = knockOn ? (carrier!.side === 'home' ? this.homeColor : this.awayColor) : this.ballTint;
    const trailMax = knockOn ? 0.5 * streak : 0.5;
    this.ballTrail.forEach((t, i) => {
      const f = i / this.ballTrail.length;
      this.trailGfx.fillStyle(trailTint, f * trailMax);
      this.trailGfx.fillCircle(t.x, t.y, BR * (0.4 + f * 0.6));
    });
    // airborne ball shadow on the pitch at the true ground point (#132): the cue the
    // ball is lofted (unreachable by ground players). Renders under reduceMotion too.
    if (this.ball.z > 1) {
      const shrink = Math.max(0.35, 1 - this.ball.z * 0.0022);
      this.trailGfx.fillStyle(C.deep, 0.32);
      this.trailGfx.fillEllipse(this.ball.x, this.ball.y, BR * 2.2 * shrink, BR * 1.4 * shrink);
    }

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
    // per-team centre marker — colour-independent team identity (accessibility).
    // Keepers get it too, so the two GKs are tellable apart by side, not just kit.
    // marker + rings track the figure's depth scale (#128) so a far player's
    // overlay never looks oversized against the smaller silhouette
    for (const p of this.players) {
      this.dyn.fillStyle(p.side === 'home' ? C.deep : C.white, 0.85);
      this.dyn.fillCircle(p.x, p.y, 4 * depthScale(p.y, this.py, this.ph));
    }
    // possession ring on the actual ball owner (team colour), under the gold
    // active ring so a viewer can tell who HOLDS the ball, not just who's active
    if (this.ball.ownerIdx >= 0) {
      const owner = this.players[this.ball.ownerIdx];
      const ocol = owner.side === 'home' ? this.homeColor : this.awayColor;
      this.dyn.lineStyle(3, ocol, 0.4 + 0.25 * this.pulse);
      this.dyn.strokeCircle(owner.x, owner.y, (PR + 9) * depthScale(owner.y, this.py, this.ph));
    }
    // carried-ball exposure cue (#136): a brightening ring on the BALL when the touch
    // is knocked loose off the foot — the "contest it now" signal. It is INFORMATION,
    // so unlike the streak it renders under reduceMotion too. Scales with exposure.
    if (carrier && carryExposure > CARRY_EXPOSE_CUE) {
      this.dyn.lineStyle(2, C.light, 0.25 + 0.55 * carryExposure);
      this.dyn.strokeCircle(this.ball.x, this.ball.y, BR + 2 + 4 * carryExposure);
    }
    // active player ring
    const ap = this.players[this.activeIdx];
    if (ap) {
      const ds = depthScale(ap.y, this.py, this.ph);
      this.dyn.lineStyle(3, C.gold, 1);
      this.dyn.strokeCircle(ap.x, ap.y, (PR + 6) * ds);
      // small arrow under active (scales + lifts with the figure's depth)
      this.dyn.fillStyle(C.gold, 1);
      this.dyn.fillTriangle(ap.x - 6 * ds, ap.y - (PR + 12) * ds, ap.x + 6 * ds, ap.y - (PR + 12) * ds, ap.x, ap.y - (PR + 4) * ds);
      this.drawStaminaNub(ap);
    }
    if (this.charging && ap) this.drawChargeBar(ap); else this.chargeText.setVisible(false);

    this.updateCamera(); // broadcast-arc follow (per-frame, reads sim output only)
  }

  // Stamina nub above the active player: a small bar that depletes as you sprint
  // and refills as you jog. Hidden when full and ready (no clutter); turns to a
  // pulsing warning colour while the post-exhaustion lock is engaged. It's
  // information (not decoration), so it renders under reduceMotion too — the
  // pulse just resolves to a steady alpha.
  private drawStaminaNub(ap: Player): void {
    if (ap.stamina >= 0.999 && !ap.sprintLock) return;
    const bw = 28;
    const bh = 4;
    const bx = ap.x - bw / 2;
    const by = ap.y - PR - 22;
    this.dyn.fillStyle(C.dark, 0.6);
    this.dyn.fillRect(bx, by, bw, bh);
    const col = ap.sprintLock ? C.flare : ap.stamina > 0.5 ? C.lime : ap.stamina > 0.25 ? C.gold : C.flare;
    this.dyn.fillStyle(col, ap.sprintLock ? 0.55 + 0.45 * this.pulse : 1);
    this.dyn.fillRect(bx, by, bw * Math.max(0, ap.stamina), bh);
  }

  // A top-down footballer drawn in local space (forward = +x), then placed and
  // rotated to the player's smoothed facing. Arms/legs slide fore/aft in a
  // contralateral gait whose amplitude scales with speed; reduce-motion freezes
  // the swing (the figure still turns to face its heading — orientation, not
  // motion decoration). Everything is in units of PR so it scales with the body.
  private drawPlayer(p: Player): void {
    // a single non-finite coord would poison the whole batched Graphics (one bad
    // translateCanvas blanks every figure), so skip a corrupted player outright
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    // Surge-reactive cadence (#138): per-side run-cycle phase + amplitude factor
    const home = p.side === 'home';
    const runT = this.reduceMotion ? 0 : home ? this.runPhaseHome : this.runPhaseAway;
    const cad = home ? this.cadenceHome : this.cadenceAway;
    // smooth the facing so quick AI re-targets / near-target velocity zeroing
    // don't make the figure twitch or spin in place
    const fl = Math.hypot(p.faceX, p.faceY) || 1;
    const target = Math.atan2(p.faceY / fl, p.faceX / fl);
    if (!Number.isFinite(p.renderAng)) p.renderAng = target; // recover from a bad angle
    const dA = Phaser.Math.Angle.Wrap(target - p.renderAng);
    p.renderAng = Phaser.Math.Angle.Wrap(p.renderAng + dA * (this.reduceMotion ? 1 : 0.3));

    const speed = Math.hypot(p.vx, p.vy);
    // reduceMotion freezes the run swing (gait 0); committed poses still render.
    // The surge cadence widens the swing for a surging side (amplitude, #138).
    const gait = this.reduceMotion ? 0 : Phaser.Math.Clamp(speed / 200, 0, 1) * cad; // 200 ≈ base playerSpeed

    // Pick the active pose from the player's sim-ticked countdowns (#137); 'run' uses
    // the continuous clock, the rest a 0..1 progress. limbPose('run') is the exact
    // original swing, so jogging figures are unchanged.
    const sel = selectPose(p.kickT, p.diveT, p.slideT, p.recovery, p.celebrateT);
    const pose = limbPose(sel.action, sel.action === 'run' ? runT : sel.t, gait, p.phase, PR, this.poseScratch);
    // celebrate hop: a vertical bounce on the goal beat (frozen under reduceMotion);
    // figure only — the shadow stays grounded so it reads as a jump
    const hop = sel.action === 'celebrate' && !this.reduceMotion ? Math.abs(Math.sin(runT * 6 + p.phase)) * 0.5 * PR : 0;

    // body-lean into a hard cut (#129): over-rotate slightly toward the velocity↔facing
    // lag, eased in place. Pure visual — gated by reduceMotion (leanAng decays to 0).
    let leanTarget = 0;
    if (!this.reduceMotion && speed > 50) {
      const d = Phaser.Math.Angle.Wrap(Math.atan2(p.vy, p.vx) - p.renderAng);
      leanTarget = Phaser.Math.Clamp(d * 0.5, -MAX_LEAN, MAX_LEAN);
    }
    p.leanAng += (leanTarget - p.leanAng) * 0.3; // ease / decay in place

    // squash-stretch (#131): along-facing acceleration this frame (render-derived,
    // no sim state touched) + the power-scaled kick impulse → a brief scale pop.
    // Gated by reduceMotion. The accel uses the real (unscaled) frame dt.
    const fx = Math.cos(p.renderAng);
    const fy = Math.sin(p.renderAng);
    const idt = 1 / Math.max(1 / 240, this.realDtSec);
    const accelAlong = ((p.vx - p.pvx) * fx + (p.vy - p.pvy) * fy) * idt;
    p.pvx = p.vx;
    p.pvy = p.vy;
    const sq = this.reduceMotion ? null : squashStretch(accelAlong, p.kickPop, this.squashScratch);

    const g = this.bodyGfx;
    g.save();
    // shared figure transform order (#137): translate → rotate(+cut-lean #129) → pose-lean
    // → crouch → [depthScale #128] → [squash #131] → limbs/torso
    g.translateCanvas(p.x, p.y - hop);
    g.rotateCanvas(p.renderAng + p.leanAng);
    if (pose.lean !== 0) g.translateCanvas(pose.lean, 0); // forward shift along facing
    if (pose.crouch !== 1) g.scaleCanvas(1, pose.crouch); // lay low for a slide / dive
    // scale-for-depth (#128): gentle broadcast perspective, clamped [0.88,1.12]
    const ds = depthScale(p.y, this.py, this.ph);
    g.scaleCanvas(ds, ds);
    // squash-stretch (#131): the single figure scale channel, at the squash slot
    if (sq && (sq.sx !== 1 || sq.sy !== 1)) g.scaleCanvas(sq.sx, sq.sy);

    // limbs first (under the torso), offset per the active pose, contralateral
    if (p.role === 'GK') {
      // keeper silhouette (#138): glove-arms spread WIDE + reaching, with bright
      // mitts, so a keeper reads by SHAPE not just kit colour (an accessibility win
      // on top of the centre-dot identity). Pose offsets still apply, so a dive
      // (#137) throws the gloves laterally and a set keeper holds them out.
      this.drawLimb(g, -0.18 * PR, 0.28 * PR, 0.7 * PR, 0.34 * PR, pose.farLeg * 0.6, p.shorts); // planted legs
      this.drawLimb(g, -0.18 * PR, -0.28 * PR, 0.7 * PR, 0.34 * PR, pose.nearLeg * 0.6, p.shorts);
      this.drawLimb(g, 0.32 * PR, 1.02 * PR, 0.82 * PR, 0.3 * PR, pose.farArm * 0.6, p.skin); // wide far glove-arm
      this.drawLimb(g, 0.32 * PR, -1.02 * PR, 0.82 * PR, 0.3 * PR, pose.nearArm * 0.6, p.skin); // wide near glove-arm
      g.fillStyle(C.light, 1); // bright glove mitts at the reaching hand ends
      g.fillCircle(0.7 * PR + pose.farArm * 0.6, 1.02 * PR, 0.28 * PR);
      g.fillCircle(0.7 * PR + pose.nearArm * 0.6, -1.02 * PR, 0.28 * PR);
    } else {
      this.drawLimb(g, -0.3 * PR, 0.3 * PR, 0.78 * PR, 0.34 * PR, pose.farLeg, p.shorts); // far leg
      this.drawLimb(g, -0.3 * PR, -0.3 * PR, 0.78 * PR, 0.34 * PR, pose.nearLeg, p.shorts); // near leg
      this.drawLimb(g, 0.05 * PR, 0.72 * PR, 0.62 * PR, 0.26 * PR, pose.farArm, p.skin); // far arm
      this.drawLimb(g, 0.05 * PR, -0.72 * PR, 0.62 * PR, 0.26 * PR, pose.nearArm, p.skin); // near arm
    }

    // hips (shorts) then torso (kit) — torso is wider across the shoulders (y)
    g.fillStyle(p.shorts, 1);
    g.fillEllipse(-0.15 * PR, 0, 1.15 * PR, 1.3 * PR);
    g.fillStyle(p.kit, 1);
    g.fillEllipse(0.05 * PR, 0, 1.45 * PR, 1.65 * PR);
    // contrast rim so dark kits keep a crisp edge against the pitch; the surging
    // side's rim brightens slightly (#138 tint) — render-only, steady under
    // reduceMotion (surge is sim state, not a time pulse).
    const surgeSide = home ? this.surgeHome : this.surgeAway;
    g.lineStyle(1.5, p.rim, 0.5 + 0.35 * Phaser.Math.Clamp(surgeSide / 100, 0, 1));
    g.strokeEllipse(0.05 * PR, 0, 1.45 * PR, 1.65 * PR);
    // shoulder caps — lightened kit, a cheap fake top-light that gives the torso form
    g.fillStyle(p.shoulderHi, 1);
    g.fillCircle(0.15 * PR, 0.6 * PR, 0.32 * PR);
    g.fillCircle(0.15 * PR, -0.6 * PR, 0.32 * PR);

    // hair crown behind, head forward of torso centre, nose nub at the very front:
    // three redundant "which way is he facing" cues
    g.fillStyle(p.hair, 1);
    g.fillCircle(0.3 * PR, 0, 0.44 * PR);
    g.fillStyle(p.skin, 1);
    g.fillCircle(0.44 * PR, 0, 0.48 * PR);
    g.fillTriangle(0.94 * PR, 0, 0.8 * PR, 0.11 * PR, 0.8 * PR, -0.11 * PR);

    g.restore();
  }

  // A leg/arm as a rounded capsule oriented along the facing axis, offset
  // fore/aft by `offX` for the run cycle. Drawn in the body's local frame.
  private drawLimb(
    g: Phaser.GameObjects.Graphics,
    baseX: number,
    baseY: number,
    len: number,
    w: number,
    offX: number,
    color: number,
  ): void {
    g.fillStyle(color, 1);
    g.fillRoundedRect(baseX + offX - len / 2, baseY - w / 2, len, w, Math.min(len, w) * 0.49);
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
    // sweet-window highlight (#133): the green band to release inside for a CURLER
    // (max power + curve). Flashes while the charge is inside it; steady under
    // reduceMotion (information, not strobe).
    const sx0 = bx + bw * SHOT_SWEET_START;
    const sww = bw * (SHOT_SWEET_END - SHOT_SWEET_START);
    const inSweet = charge >= SHOT_SWEET_START && charge <= SHOT_SWEET_END;
    this.dyn.fillStyle(C.lime, this.reduceMotion ? 0.85 : inSweet ? 0.5 + 0.45 * this.pulse : 0.3);
    this.dyn.fillRect(sx0, by, sww, bh);
    this.dyn.lineStyle(1.5, C.lime, this.reduceMotion ? 1 : inSweet ? 0.7 + 0.3 * this.pulse : 0.55);
    this.dyn.strokeRect(sx0, by - 1, sww, bh + 2);
    // 0.8 threshold tick
    this.dyn.fillStyle(C.light, 0.95);
    this.dyn.fillRect(bx + bw * 0.8 - 1, by - 2, 2, bh + 4);
    // live percentage readout (green in the sweet window)
    this.chargeText
      .setText(`${Math.round(charge * 100)}%`)
      .setColor(inSweet ? CSS.lime : charge > 0.8 ? CSS.surge : CSS.light)
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
    // closing-minutes alert tint + gentle pulse (#141): the colour is information
    // (renders under reduceMotion); the pulse is motion (gated).
    if (isClosingPhase(this.elapsed, this.duration)) {
      this.hudClock.setColor(CSS.flare).setScale(this.reduceMotion ? 1 : 1 + 0.12 * this.pulse);
    } else {
      this.hudClock.setColor(CSS.mid).setScale(1);
    }
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

    // live possession share (#143): glide toward the true value (snap under
    // reduceMotion); shots text only re-renders when a count changes. All sourced
    // from the existing possSec/shots fields — no new sim tracking, display-only.
    const target = possessionShare(this.possSec.home, this.possSec.away);
    this.dispPoss = this.reduceMotion ? target : easeToward(this.dispPoss, target, this.realDtSec);
    this.drawPossBar();
    if (this.shots.home !== this.prevShotsHome) {
      this.prevShotsHome = this.shots.home;
      this.shotsHomeText.setText(`${this.home.code}  SH ${this.shots.home} (${this.onTarget.home})`);
    }
    if (this.shots.away !== this.prevShotsAway) {
      this.prevShotsAway = this.shots.away;
      this.shotsAwayText.setText(`SH ${this.shots.away} (${this.onTarget.away})  ${this.away.code}`);
    }
  }

  // Slim two-sided possession share bar (#143): home (left, team colour) vs away
  // (right), split at the lerped share with a white divider. Redrawn via clear+fill
  // each frame like drawSurgeBar — no per-frame allocation. y 111-119.
  private drawPossBar(): void {
    const w = 260;
    const cx = GAME_W / 2;
    const x0 = cx - w / 2;
    const y = 112;
    const h = 6;
    const hw = w * this.dispPoss;
    const g = this.possBar;
    g.clear();
    g.fillStyle(C.deep, 0.8);
    g.fillRoundedRect(x0 - 2, y - 1, w + 4, h + 2, 4);
    g.fillStyle(this.homeColor, 1);
    g.fillRect(x0, y, hw, h);
    g.fillStyle(this.awayColor, 1);
    g.fillRect(x0 + hw, y, w - hw, h);
    g.fillStyle(C.white, 0.9); // divider at the split
    g.fillRect(x0 + hw - 1, y - 1, 2, h + 2);
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
      const flash = this.onUi(
        side === 'home'
          ? this.add.rectangle(cx - w / 4, 84, w / 2, 10, 0xffffff, 0.9).setDepth(32)
          : this.add.rectangle(cx + w / 4, 84, w / 2, 10, 0xffffff, 0.9).setDepth(32),
      );
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
    this.camFollow = false; // hand framing to the victory beat / end-of-match overlays
    resetTimeFlow(this.timeFlow); // end-of-match beats play at full speed
    this.timeScale = 1;
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.zoomCur = this.restZoom; // drop any residual snap-zoom before the victory beat
    audio.finalWhistle(); // deliberate closing whistle + downward sting (#141)
    this.time.delayedCall(220, () => this.showBanner('FULL TIME', C.gold, 1600)); // timed behind the whistle peak
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
      this.centerCameraOnPitch();
      this.cameras.main.zoomTo(this.restZoom * 1.12, 1000, 'Quad.easeOut'); // punch in from the resting framing
      const spot = this.onWorld(this.add.container(this.px + this.pw / 2, this.py + this.ph / 2).setDepth(46));
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

  // Set up the staged shootout reveal (#142). The RESULT is penaltyShootout's
  // deterministic tally; this walks its ordered kicks[] on a sim-ticked cadence.
  private runPenalties(): void {
    const pens = penaltyShootout(this.home, this.away, this.rng);
    this.penResult = { home: pens.home, away: pens.away };
    this.penShootout = pens;
    this.penKickIdx = 0;
    this.penH = 0;
    this.penA = 0;
    this.penTimer = this.reduceMotion ? PEN_KICK_CADENCE_RM : PEN_KICK_CADENCE;
    // wide framing so both goals are in shot for the shootout
    this.cameras.main.setZoom(1.0);
    this.centerCameraOnPitch();
    const cx = GAME_W / 2;
    const title = this.onUi(
      this.add
        .text(cx, GAME_H + 60, 'PENALTIES', { fontFamily: FONT_DISPLAY, fontSize: '48px', color: CSS.surge })
        .setOrigin(0.5)
        .setDepth(51)
        .setStroke('#0e0a24', 6),
    );
    this.tweens.add({ targets: title, y: 150, duration: 500, ease: 'Back.easeOut' });
    this.penTallyText = this.onUi(
      this.add
        .text(cx, 232, `${this.home.code} 0 - 0 ${this.away.code}`, { fontFamily: FONT_DISPLAY, fontSize: '52px', color: CSS.gold })
        .setOrigin(0.5)
        .setDepth(51)
        .setStroke('#0e0a24', 6),
    );
    this.penTakerText = this.onUi(
      this.add
        .text(cx, 318, '', { fontFamily: FONT_DISPLAY, fontSize: '30px', color: CSS.light })
        .setOrigin(0.5)
        .setDepth(51)
        .setStroke('#0e0a24', 4),
    );
  }

  // Advance the shootout one kick per cadence tick; hand off after the last (#142).
  private updatePenReveal(dt: number): void {
    if (!this.penShootout) return; // reveal not set up yet (the pre-shootout beat)
    this.penTimer -= dt;
    if (this.penTimer > 0) return;
    const kicks = this.penShootout.kicks;
    if (this.penKickIdx >= kicks.length) {
      this.finishMatch(); // every kick shown → the existing result path, unchanged
      return;
    }
    this.revealPenKick(kicks[this.penKickIdx]);
    this.penKickIdx++;
    this.penTimer = this.penKickIdx >= kicks.length ? 1.6 : this.reduceMotion ? PEN_KICK_CADENCE_RM : PEN_KICK_CADENCE;
  }

  private revealPenKick(kick: PenKick): void {
    if (kick.side === 'home') {
      if (kick.scored) this.penH++;
    } else if (kick.scored) this.penA++;
    this.penTallyText?.setText(`${this.home.code} ${this.penH} - ${this.penA} ${this.away.code}`);
    const code = kick.side === 'home' ? this.home.code : this.away.code;
    this.penTakerText?.setText(`${code}  ${kick.scored ? 'SCORES!' : 'MISSES'}`).setColor(kick.scored ? CSS.lime : CSS.mid);
    const isLast = this.penKickIdx + 1 >= this.penShootout!.kicks.length;
    // crowd hush/roar via the bed (a deterministic sink) + a goal roar or a sigh whistle
    audio.setCrowd(kick.scored ? 1 : 0.25);
    audio.play(kick.scored ? 'goal' : 'whistle');
    if (this.reduceMotion) return; // flourishes / slow-mo suppressed; the tally carries the info
    if (kick.scored) {
      this.lastScorer = kick.side; // goalBurst frames the scored goal by lastScorer
      this.goalBurst(kick.side === 'home' ? this.homeColor : this.awayColor);
      this.requestZoomPunch();
      if (isLast) this.requestTimeFx('screamer'); // a beat on the decisive kick
    } else {
      this.shake(70, 0.005);
    }
  }

  private penResult?: { home: number; away: number };
  // staged penalty reveal state (#142), all sim-ticked
  private penShootout: PenShootout | null = null;
  private penKickIdx = 0;
  private penTimer = 0;
  private penH = 0;
  private penA = 0;
  private penTallyText?: Phaser.GameObjects.Text;
  private penTakerText?: Phaser.GameObjects.Text;

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

    this.onUi(this.add.rectangle(cx, cy, GAME_W, GAME_H, C.deep, 0.72).setDepth(60));
    const verdict = this.onUi(
      this.add
        .text(cx, cy - 36, advanced ? 'ADVANCED' : 'ELIMINATED', {
          fontFamily: FONT_DISPLAY,
          fontSize: '72px',
          color: hex(col),
        })
        .setOrigin(0.5)
        .setDepth(61)
        .setStroke('#0e0a24', 6),
    );

    const pens = this.penResult ? `  (${this.penResult.home}-${this.penResult.away}p)` : '';
    this.onUi(
      this.add
        .text(cx, cy + 34, `${this.home.code} ${this.homeGoals} - ${this.awayGoals} ${this.away.code}${pens}`, {
          fontFamily: FONT_DISPLAY,
          fontSize: '26px',
          color: CSS.light,
        })
        .setOrigin(0.5)
        .setDepth(61),
    );
    if (this.cfg.roundLabel) {
      this.onUi(
        this.add
          .text(cx, cy + 74, this.cfg.roundLabel.toUpperCase(), { fontFamily: FONT_BODY, fontSize: '16px', color: CSS.mid })
          .setOrigin(0.5)
          .setDepth(61)
          .setLetterSpacing(3),
      );
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
      const piece = this.onUi(this.add.rectangle(x, this.rng.range(-40, -10), 4, 7, col).setDepth(62));
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
