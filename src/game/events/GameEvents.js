/**
 * GameEvents.js
 *
 * Centralized event bus used to decouple Phaser (the game world) from React
 * (the surrounding UI). Both sides import this single module-level emitter
 * instance and never reach into each other's internals directly.
 *
 * Phaser -> React events describe things that happened in the simulation.
 * React -> Phaser events are *commands* asking the simulation to do something.
 *
 * Because this emitter is a plain singleton (not a React context and not a
 * Phaser scene), it survives Phaser scene restarts and React re-renders
 * cleanly as long as every consumer removes its own listeners on cleanup
 * (see GameContainer.jsx and GameScene.js `shutdown` handling).
 */
import Phaser from 'phaser';

// Phaser -> React (state changed / things happened)
export const Events = {
  HEALTH_CHANGED: 'HEALTH_CHANGED',
  MONEY_CHANGED: 'MONEY_CHANGED',
  WAVE_CHANGED: 'WAVE_CHANGED',
  ENEMIES_REMAINING_CHANGED: 'ENEMIES_REMAINING_CHANGED',
  TOWER_SELECTED: 'TOWER_SELECTED',
  TOWER_DESELECTED: 'TOWER_DESELECTED',
  PLACEMENT_STATE_CHANGED: 'PLACEMENT_STATE_CHANGED',
  NEXT_WAVE_COUNTDOWN: 'NEXT_WAVE_COUNTDOWN',
  GAME_OVER: 'GAME_OVER',
  GAME_PAUSED: 'GAME_PAUSED',
  GAME_RESUMED: 'GAME_RESUMED',
  GAME_SPEED_CHANGED: 'GAME_SPEED_CHANGED',
  SCENE_READY: 'SCENE_READY',
  ENEMY_KILLED: 'ENEMY_KILLED',

  // React -> Phaser (commands)
  SELECT_TOWER_TYPE: 'SELECT_TOWER_TYPE',
  CANCEL_TOWER_SELECTION: 'CANCEL_TOWER_SELECTION',
  UPGRADE_TOWER: 'UPGRADE_TOWER',
  SELL_TOWER: 'SELL_TOWER',
  START_NEXT_WAVE: 'START_NEXT_WAVE',
  PAUSE_GAME: 'PAUSE_GAME',
  RESUME_GAME: 'RESUME_GAME',
  SET_GAME_SPEED: 'SET_GAME_SPEED',
  RESTART_GAME: 'RESTART_GAME',
};

// Single shared emitter instance for the whole application lifetime.
const GameEvents = new Phaser.Events.EventEmitter();

export default GameEvents;
