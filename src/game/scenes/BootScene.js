/**
 * BootScene.js
 *
 * Minimal entry scene. Exists as its own step so future boot-time setup
 * (e.g. detecting WebGL support, reading saved settings) has an obvious
 * home without cluttering PreloadScene.
 */
import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.scene.start('PreloadScene');
  }
}
