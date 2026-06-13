import Phaser from 'phaser';
import { C, CSS, FONT_DISPLAY, FONT_BODY, GAME_W, GAME_H } from '../ui/theme';
import { getSave } from '../core/save';

// Stub — full groups/bracket orchestration is built in the Tournament System slice.
export class TournamentScene extends Phaser.Scene {
  constructor() {
    super('Tournament');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(C.indigo);
    const t = getSave().tournament;
    this.add
      .text(GAME_W / 2, 120, 'THE GLOBE CUP', { fontFamily: FONT_DISPLAY, fontSize: '40px', color: CSS.gold })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 180, t ? `Phase: ${t.phase}` : 'No tournament loaded', {
        fontFamily: FONT_BODY,
        fontSize: '18px',
        color: CSS.mid,
      })
      .setOrigin(0.5);

    const back = this.add
      .text(GAME_W / 2, GAME_H - 80, 'BACK TO MENU', {
        fontFamily: FONT_DISPLAY,
        fontSize: '22px',
        color: CSS.white,
        backgroundColor: CSS.dark,
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('Menu'));
  }
}
