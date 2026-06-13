import Phaser from 'phaser';
import { GAME_W, GAME_H, C } from './ui/theme';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { TeamSelectScene } from './scenes/TeamSelectScene';
import { MatchScene } from './scenes/MatchScene';
import { TournamentScene } from './scenes/TournamentScene';
import { ResultScene } from './scenes/ResultScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: C.deep,
  width: GAME_W,
  height: GAME_H,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
  scene: [BootScene, MenuScene, TeamSelectScene, TournamentScene, MatchScene, ResultScene],
};

const game = new Phaser.Game(config);

// Debug/QA hook: lets automated tests drive scenes and inspect match state.
(window as unknown as { __GAME__: Phaser.Game }).__GAME__ = game;
