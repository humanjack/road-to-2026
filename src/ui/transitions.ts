import Phaser from 'phaser';
import { getSave } from '../core/save';

// Shared scene-to-scene crossfade so navigation feels continuous instead of a
// hard cut. transitionTo() fades the current camera to the deep background
// colour, then starts the next scene (which fades itself in via fadeInScene).
// Both no-op under reduceMotion.
const FADE_MS = 220;
const FADE_RGB: [number, number, number] = [14, 10, 36]; // matches C.deep

export function transitionTo(scene: Phaser.Scene, key: string, data?: object, ms = FADE_MS): void {
  if (getSave().settings.reduceMotion) {
    scene.scene.start(key, data);
    return;
  }
  const cam = scene.cameras.main;
  cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start(key, data));
  cam.fadeOut(ms, ...FADE_RGB);
}

export function fadeInScene(scene: Phaser.Scene, ms = FADE_MS): void {
  if (getSave().settings.reduceMotion) return;
  scene.cameras.main.fadeIn(ms, ...FADE_RGB);
}
