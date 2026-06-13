import Phaser from 'phaser';
import { C, CSS, FONT_DISPLAY, GAME_W, GAME_H } from '../ui/theme';

// Stub — the playable arcade match engine is built in the Core Gameplay slice.
export class MatchScene extends Phaser.Scene {
  constructor() {
    super('Match');
  }

  create(data: any): void {
    this.cameras.main.setBackgroundColor(C.deep);
    this.add
      .text(GAME_W / 2, GAME_H / 2, `MATCH\n${data?.homeId ?? '?'} vs ${data?.awayId ?? '?'}`, {
        fontFamily: FONT_DISPLAY,
        fontSize: '32px',
        color: CSS.light,
        align: 'center',
      })
      .setOrigin(0.5);
  }
}
