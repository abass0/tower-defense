/**
 * gameConfig.js
 *
 * Builds the Phaser.Game configuration object. This is the only place
 * that wires scenes + scale/render settings together, so GameContainer.jsx
 * stays a thin mounting shell with no game-specific knowledge.
 */
import Phaser from 'phaser';
import { MAP_WIDTH, MAP_HEIGHT } from './mapConfig.js';
import BootScene from '../scenes/BootScene.js';
import PreloadScene from '../scenes/PreloadScene.js';
import GameScene from '../scenes/GameScene.js';

export const GAME_WIDTH = MAP_WIDTH;
export const GAME_HEIGHT = MAP_HEIGHT;

/**
 * @param {string} parentId DOM element id Phaser should inject its canvas into.
 * @returns {Phaser.Types.Core.GameConfig}
 */
export function createGameConfig(parentId) {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: parentId,
    backgroundColor: '#3a5a40',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
    // Movement/collision is all math-driven (path progress + distance
    // checks) so we intentionally skip an Arcade Physics world - Phaser's
    // update loop + delta timing is all that's required.
    scene: [BootScene, PreloadScene, GameScene],
  };
}
