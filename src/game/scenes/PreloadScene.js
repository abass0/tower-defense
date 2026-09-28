/**
 * PreloadScene.js
 *
 * For the MVP, all art is generated procedurally (see
 * game/utils/textureGenerator.js) so we don't depend on any external
 * hosted or bundled assets. To swap in real sprite sheets later: add
 * `this.load.image(...)` / `this.load.spritesheet(...)` calls in
 * `preload()` using the same texture keys defined in
 * `textureGenerator.js`'s `textureKeys()`, and
 * `generatePlaceholderTextures` will simply no-op (it already guards
 * against re-generating textures that exist).
 */
import Phaser from 'phaser';
import { generatePlaceholderTextures } from '../utils/textureGenerator.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Placeholder for future real asset loading (spritesheets, audio).
  }

  create() {
    generatePlaceholderTextures(this);
    this.scene.start('GameScene');
  }
}
