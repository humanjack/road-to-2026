import Phaser from 'phaser';
import { C, CSS, FONT_DISPLAY, FONT_BODY, GAME_W, GAME_H } from '../ui/theme';
import { TEAMS } from '../data/teams';
import { displayName } from '../data/names';
import type { TournamentState, MatchResult } from '../data/types';
import { getSave, saveTournament, recordTournament, addCoins } from '../core/save';
import { RNG, randomSeed } from '../core/rng';
import {
  teamMapOf,
  groupStandings,
  roundLabel,
  roundMatches,
  applyKnockoutResult,
  userStillIn,
} from '../core/tournament';
import {
  currentGroupFixtures,
  userGroupFixture,
  simNonUserGroupFixtures,
  completeGroupMatchday,
  userRoundMatch,
  simNonUserRoundMatches,
  advanceRoundIfComplete,
  autoSimAll,
} from '../core/flow';
import { simulateMatch } from '../core/simMatch';
import { audio } from '../core/audio';

const map = teamMapOf(TEAMS);

export class TournamentScene extends Phaser.Scene {
  private state!: TournamentState;

  constructor() {
    super('Tournament');
  }

  create(data: { fromMatch?: boolean }): void {
    const save = getSave();
    if (!save.tournament) {
      this.scene.start('Menu');
      return;
    }
    this.state = save.tournament;

    if (data?.fromMatch) {
      const result = this.game.registry.get('lastMatchResult') as MatchResult | undefined;
      const matchId = this.game.registry.get('lastMatchId') as string | null;
      if (result) this.applyUserResultAndAdvance(result, matchId);
      this.game.registry.set('lastMatchResult', null);
      this.game.registry.set('lastMatchId', null);
    }

    // A completed cup awards rewards and transitions to the Result screen
    // immediately — never leave an interactive window where the award could be
    // skipped (e.g. by tapping MENU) or double-fired.
    if (this.state.phase === 'done') {
      this.gotoChampion();
      return;
    }

    this.cameras.main.setBackgroundColor(C.indigo);
    this.render();
  }

  // --- orchestration -----------------------------------------------------

  private applyUserResultAndAdvance(result: MatchResult, matchId: string | null): void {
    if (this.state.phase === 'groups') {
      const fix = currentGroupFixtures(this.state).find((f) => f.userInvolved && !f.played);
      if (fix) {
        fix.homeGoals = result.homeGoals;
        fix.awayGoals = result.awayGoals;
        fix.played = true;
      }
      completeGroupMatchday(this.state, TEAMS);
    } else if (this.state.phase === 'knockout') {
      const id = matchId ?? userRoundMatch(this.state)?.id;
      if (id) applyKnockoutResult(this.state, id, result);
      advanceRoundIfComplete(this.state);
    }
    saveTournament(this.state);
  }

  private rng(): RNG {
    return new RNG(randomSeed());
  }

  private playUserMatchLive(): void {
    const rng = this.rng();
    if (this.state.phase === 'groups') {
      simNonUserGroupFixtures(this.state, TEAMS, rng);
      saveTournament(this.state);
      const fix = userGroupFixture(this.state);
      if (!fix) {
        completeGroupMatchday(this.state, TEAMS);
        saveTournament(this.state);
        this.scene.restart();
        return;
      }
      this.launchMatch(fix.homeId, fix.awayId, 'group');
    } else if (this.state.phase === 'knockout') {
      simNonUserRoundMatches(this.state, TEAMS, rng);
      saveTournament(this.state);
      const m = userRoundMatch(this.state);
      if (!m || !m.homeId || !m.awayId) {
        this.simToEnd();
        return;
      }
      this.launchMatch(m.homeId, m.awayId, 'knockout', m.id);
    }
  }

  private simUserMatch(): void {
    const rng = this.rng();
    if (this.state.phase === 'groups') {
      simNonUserGroupFixtures(this.state, TEAMS, rng);
      const fix = userGroupFixture(this.state);
      if (fix) {
        const r = simulateMatch(map[fix.homeId], map[fix.awayId], rng, this.state.userTeamId, {});
        fix.homeGoals = r.homeGoals;
        fix.awayGoals = r.awayGoals;
        fix.played = true;
      }
      completeGroupMatchday(this.state, TEAMS);
    } else if (this.state.phase === 'knockout') {
      simNonUserRoundMatches(this.state, TEAMS, rng);
      const m = userRoundMatch(this.state);
      if (m && m.homeId && m.awayId) {
        const r = simulateMatch(map[m.homeId], map[m.awayId], rng, this.state.userTeamId, {
          knockout: true,
          neutral: true,
        });
        applyKnockoutResult(this.state, m.id, r);
      }
      advanceRoundIfComplete(this.state);
    }
    saveTournament(this.state);
    if (this.state.phase === 'done') this.gotoChampion();
    else this.scene.restart();
  }

  private simToEnd(): void {
    autoSimAll(this.state, TEAMS, this.rng());
    saveTournament(this.state);
    this.gotoChampion();
  }

  private launchMatch(homeId: string, awayId: string, context: 'group' | 'knockout', matchId?: string): void {
    this.scene.start('Match', {
      homeId,
      awayId,
      userTeamId: this.state.userTeamId,
      context,
      difficulty: this.state.difficulty,
      matchId,
      returnScene: 'Tournament',
      durationSec: 120,
    });
  }

  private awarded = false;

  private gotoChampion(): void {
    const champ = this.state.championId ? map[this.state.championId] : null;
    const userWon = this.state.championId === this.state.userTeamId;
    if (this.state.phase === 'done' && !this.awarded) {
      this.awarded = true; // idempotent: award exactly once per completed cup
      recordTournament(userWon);
      addCoins(userWon ? 500 : 120);
      // clear so "Continue" doesn't resume a finished cup
      saveTournament(null);
    }
    this.scene.start('Result', {
      title: userWon ? 'CHAMPIONS!' : 'CUP COMPLETE',
      subtitle: champ ? `${displayName(champ)} lift the Aurora Sphere` : 'The Globe Cup is decided',
      lines: userWon
        ? ['You have won The Globe Cup!', '+500 coins']
        : [`Winner: ${champ ? displayName(champ) : '—'}`, userStillIn(this.state) ? '' : 'You were knocked out earlier', '+120 coins'].filter(Boolean),
      accent: userWon ? C.gold : C.cyan,
      outcome: userWon ? 'win' : 'loss',
      nextScene: 'Menu',
      buttonLabel: 'BACK TO MENU',
    });
  }

  // --- rendering ---------------------------------------------------------

  private render(): void {
    const user = map[this.state.userTeamId];
    this.add
      .text(GAME_W / 2, 40, 'THE GLOBE CUP', { fontFamily: FONT_DISPLAY, fontSize: '36px', color: CSS.gold })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 74, `Your nation: ${displayName(user)} (${user.code})  ·  Difficulty: ${this.state.difficulty.toUpperCase()}`, {
        fontFamily: FONT_BODY,
        fontSize: '16px',
        color: CSS.mid,
      })
      .setOrigin(0.5);

    if (this.state.phase === 'groups') this.renderGroups();
    else if (this.state.phase === 'knockout') this.renderKnockout();

    this.renderActionBar();

    const menu = this.add
      .text(28, 36, '‹ MENU', { fontFamily: FONT_DISPLAY, fontSize: '18px', color: CSS.mid })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    menu.on('pointerdown', () => this.scene.start('Menu'));
  }

  private renderGroups(): void {
    this.add
      .text(GAME_W / 2, 104, `GROUP STAGE — MATCHDAY ${Math.min(this.state.groupMatchday + 1, 3)} / 3`, {
        fontFamily: FONT_DISPLAY,
        fontSize: '18px',
        color: CSS.cyan,
      })
      .setOrigin(0.5);

    const cols = 4;
    const cellW = 286;
    const cellH = 150;
    const gx = 8;
    const gy = 12;
    const startX = (GAME_W - (cols * cellW + (cols - 1) * gx)) / 2;
    const startY = 128;

    this.state.groups.forEach((group, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cellW + gx);
      const y = startY + row * (cellH + gy);
      const table = groupStandings(group, map);
      const userHere = group.teamIds.includes(this.state.userTeamId);

      const g = this.add.graphics();
      g.fillStyle(userHere ? C.dark : C.deep, 0.92);
      g.fillRoundedRect(x, y, cellW, cellH, 8);
      g.lineStyle(userHere ? 2.5 : 1, userHere ? C.gold : C.dark, 1);
      g.strokeRoundedRect(x, y, cellW, cellH, 8);

      this.add.text(x + 12, y + 8, `GROUP ${group.id}`, {
        fontFamily: FONT_DISPLAY,
        fontSize: '15px',
        color: CSS.light,
      });
      this.add
        .text(x + cellW - 12, y + 10, 'Pts', { fontFamily: FONT_BODY, fontSize: '12px', color: CSS.mid })
        .setOrigin(1, 0);

      table.forEach((rowS, idx) => {
        const ry = y + 34 + idx * 27;
        const team = map[rowS.teamId];
        const isUser = rowS.teamId === this.state.userTeamId;
        // qualification colour: top2 green, 3rd amber
        const dot = idx < 2 ? C.lime : idx === 2 ? C.gold : C.mid;
        const dg = this.add.graphics();
        dg.fillStyle(dot, 1);
        dg.fillCircle(x + 16, ry + 8, 4);
        this.add.text(x + 28, ry, `${team.code}`, {
          fontFamily: FONT_DISPLAY,
          fontSize: '14px',
          color: isUser ? CSS.gold : CSS.light,
        });
        this.add
          .text(x + 96, ry + 1, displayName(team), { fontFamily: FONT_BODY, fontSize: '11px', color: CSS.mid })
          .setFixedSize(120, 14);
        this.add
          .text(x + cellW - 12, ry, String(rowS.Pts), {
            fontFamily: FONT_DISPLAY,
            fontSize: '14px',
            color: isUser ? CSS.gold : CSS.light,
          })
          .setOrigin(1, 0);
      });
    });
  }

  private renderKnockout(): void {
    const round = this.state.knockoutRound!;
    this.add
      .text(GAME_W / 2, 108, roundLabel(round).toUpperCase(), {
        fontFamily: FONT_DISPLAY,
        fontSize: '22px',
        color: CSS.cyan,
      })
      .setOrigin(0.5);

    const matches = roundMatches(this.state, round).filter((m) => m.homeId && m.awayId);
    const cols = matches.length > 8 ? 2 : 1;
    const perCol = Math.ceil(matches.length / cols);
    const rowH = 44;
    const colW = 460;
    const startY = 150;
    const totalW = cols * colW + (cols - 1) * 40;
    const startX = (GAME_W - totalW) / 2;

    matches.forEach((m, i) => {
      const col = Math.floor(i / perCol);
      const row = i % perCol;
      const x = startX + col * (colW + 40);
      const y = startY + row * (rowH + 6);
      const isUser = m.homeId === this.state.userTeamId || m.awayId === this.state.userTeamId;
      const h = map[m.homeId!];
      const a = map[m.awayId!];

      const g = this.add.graphics();
      g.fillStyle(isUser ? C.dark : C.deep, 0.9);
      g.fillRoundedRect(x, y, colW, rowH, 8);
      g.lineStyle(isUser ? 2.5 : 1, isUser ? C.gold : C.dark, 1);
      g.strokeRoundedRect(x, y, colW, rowH, 8);

      const res = m.result;
      const homeWin = res?.winnerId === m.homeId;
      const awayWin = res?.winnerId === m.awayId;
      this.add.text(x + 14, y + 12, h.code, {
        fontFamily: FONT_DISPLAY,
        fontSize: '18px',
        color: homeWin ? CSS.lime : res ? CSS.mid : CSS.light,
      });
      this.add
        .text(x + colW - 14, y + 12, a.code, {
          fontFamily: FONT_DISPLAY,
          fontSize: '18px',
          color: awayWin ? CSS.lime : res ? CSS.mid : CSS.light,
        })
        .setOrigin(1, 0);
      const mid = res
        ? `${res.homeGoals} - ${res.awayGoals}${res.penalties ? ` (${res.penalties.home}-${res.penalties.away}p)` : ''}`
        : 'vs';
      this.add
        .text(x + colW / 2, y + 12, mid, { fontFamily: FONT_DISPLAY, fontSize: '16px', color: CSS.gold })
        .setOrigin(0.5, 0);
    });

    if (!userStillIn(this.state)) {
      this.add
        .text(GAME_W / 2, GAME_H - 150, 'You have been eliminated — sim on to crown the champion.', {
          fontFamily: FONT_BODY,
          fontSize: '16px',
          color: CSS.surge,
        })
        .setOrigin(0.5);
    }
  }

  private renderActionBar(): void {
    const y = GAME_H - 70;
    const stillIn = userStillIn(this.state);

    // next opponent label
    let label = '';
    if (this.state.phase === 'groups') {
      const fix = currentGroupFixtures(this.state).find((f) => f.userInvolved && !f.played);
      if (fix) {
        const opp = fix.homeId === this.state.userTeamId ? map[fix.awayId] : map[fix.homeId];
        label = `Next: ${map[this.state.userTeamId].code} vs ${opp.code}`;
      }
    } else if (this.state.phase === 'knockout' && stillIn) {
      const m = userRoundMatch(this.state);
      if (m && m.homeId && m.awayId) {
        const opp = m.homeId === this.state.userTeamId ? map[m.awayId] : map[m.homeId];
        label = `Next: ${map[this.state.userTeamId].code} vs ${opp.code}`;
      }
    }
    if (label) {
      this.add.text(40, y + 16, label, { fontFamily: FONT_DISPLAY, fontSize: '20px', color: CSS.light });
    }

    if (stillIn) {
      this.makeButton(GAME_W - 240, y + 26, 'PLAY MATCH', () => this.playUserMatchLive(), true);
      this.makeButton(GAME_W - 470, y + 26, 'SIM MATCH', () => this.simUserMatch(), false);
    } else {
      this.makeButton(GAME_W - 240, y + 26, 'SIM TO FINAL', () => this.simToEnd(), true);
    }
  }

  private makeButton(cx: number, cy: number, label: string, onClick: () => void, primary: boolean): void {
    const w = 200;
    const h = 48;
    const g = this.add.graphics();
    g.fillStyle(primary ? C.surge : C.dark, 1);
    g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
    g.lineStyle(2, primary ? C.light : C.mid, 0.8);
    g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
    const t = this.add
      .text(cx, cy, label, { fontFamily: FONT_DISPLAY, fontSize: '20px', color: CSS.white })
      .setOrigin(0.5);
    const z = this.add.zone(cx, cy, w, h).setInteractive({ useHandCursor: true });
    z.on('pointerover', () => t.setColor(CSS.gold));
    z.on('pointerout', () => t.setColor(CSS.white));
    z.on('pointerdown', () => {
      audio.resume();
      audio.play('ui');
      this.tweens.add({ targets: t, scale: 0.94, duration: 60, yoyo: true });
      this.time.delayedCall(70, onClick);
    });
  }
}
