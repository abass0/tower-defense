/**
 * GameScene.js
 *
 * Coordinates systems and entities - it does NOT implement gameplay
 * mechanics itself. Responsibilities kept here are intentionally thin:
 *   - build/draw the map once
 *   - own the small set of scene-level systems (economy, health, waves,
 *     towers, effects) and wire them together
 *   - translate raw Phaser input into placement/selection actions
 *   - translate React "commands" (via GameEvents) into calls on those
 *     systems
 *   - drive everyone's update() each frame, respecting pause/speed
 */
import Phaser from 'phaser';
import {
  PATH_WAYPOINTS,
  DECORATIONS,
  MAP_WIDTH,
  MAP_HEIGHT,
  PATH_WIDTH,
  SPAWN_POINT,
  BASE_POINT,
} from '../config/mapConfig.js';
import { buildPath, distanceToPath } from '../utils/pathUtils.js';
import { getTowerStatsAtLevel } from '../config/towers.js';
import Tower from '../entities/Tower.js';
import EconomySystem from '../systems/EconomySystem.js';
import HealthSystem from '../systems/HealthSystem.js';
import WaveSystem from '../systems/WaveSystem.js';
import TowerSystem from '../systems/TowerSystem.js';
import EffectsSystem from '../systems/EffectsSystem.js';
import AudioSystem from '../systems/AudioSystem.js';
import GameEvents, { Events } from '../events/GameEvents.js';

const STARTING_MONEY = 500;
const STARTING_HEALTH = 100;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.isPaused = false;
    this.isGameOver = false;
    this.speedMultiplier = 1;
    this.stats = { enemiesDestroyed: 0 };

    this.placementType = null;
    this.placementGhost = null;
    this.placementRange = null;

    this.path = buildPath(PATH_WAYPOINTS);
    this.pathLength = this.path.getLength();

    this.drawMap();

    this.economySystem = new EconomySystem(STARTING_MONEY);
    this.healthSystem = new HealthSystem(STARTING_HEALTH);
    this.effects = new EffectsSystem(this);
    this.audio = new AudioSystem(this);

    this.towerSystem = new TowerSystem(this, {
      pathWaypoints: PATH_WAYPOINTS,
      economy: this.economySystem,
      effects: this.effects,
      audio: this.audio,
    });

    this.waveSystem = new WaveSystem(this, {
      path: this.path,
      pathLength: this.pathLength,
      economy: this.economySystem,
      health: this.healthSystem,
      effects: this.effects,
      audio: this.audio,
      onEnemyKilled: () => {
        this.stats.enemiesDestroyed += 1;
      },
    });

    this.setupInput();
    this.registerCommandListeners();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);

    this.emitInitialState();
  }

  emitInitialState() {
    GameEvents.emit(Events.HEALTH_CHANGED, {
      health: this.healthSystem.health,
      maxHealth: this.healthSystem.maxHealth,
    });
    GameEvents.emit(Events.MONEY_CHANGED, this.economySystem.money);
    GameEvents.emit(Events.WAVE_CHANGED, 0);
    GameEvents.emit(Events.ENEMIES_REMAINING_CHANGED, 0);
    GameEvents.emit(Events.GAME_SPEED_CHANGED, 1);
    GameEvents.emit(Events.GAME_RESUMED);
    GameEvents.emit(Events.TOWER_DESELECTED);
    GameEvents.emit(Events.PLACEMENT_STATE_CHANGED, { active: false });
    GameEvents.emit(Events.SCENE_READY);
  }

  // ---------------------------------------------------------------------
  // Map rendering
  // ---------------------------------------------------------------------

  drawMap() {
    const g = this.add.graphics();

    // Base grass terrain with subtle deterministic variation patches.
    g.fillStyle(0x4c7a3f, 1);
    g.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    g.fillStyle(0x548c46, 0.45);
    for (let i = 0; i < 48; i += 1) {
      const x = (i * 137) % MAP_WIDTH;
      const y = (i * 271 + (i % 7) * 40) % MAP_HEIGHT;
      g.fillRect(x, y, 46, 46);
    }
    g.fillStyle(0x3f6a34, 0.3);
    for (let i = 0; i < 30; i += 1) {
      const x = (i * 211 + 60) % MAP_WIDTH;
      const y = (i * 193 + 30) % MAP_HEIGHT;
      g.fillCircle(x, y, 18);
    }

    // Path border (drawn wider, underneath) then the path fill on top.
    g.beginPath();
    g.moveTo(PATH_WAYPOINTS[0].x, PATH_WAYPOINTS[0].y);
    PATH_WAYPOINTS.slice(1).forEach((p) => g.lineTo(p.x, p.y));
    g.lineStyle(PATH_WIDTH + 10, 0x8d6e4a, 1);
    g.strokePath();

    g.beginPath();
    g.moveTo(PATH_WAYPOINTS[0].x, PATH_WAYPOINTS[0].y);
    PATH_WAYPOINTS.slice(1).forEach((p) => g.lineTo(p.x, p.y));
    g.lineStyle(PATH_WIDTH, 0xd7b788, 1);
    g.strokePath();

    // Round the interior joints so turns look smooth rather than mitered.
    for (let i = 1; i < PATH_WAYPOINTS.length - 1; i += 1) {
      const wp = PATH_WAYPOINTS[i];
      g.fillStyle(0xd7b788, 1);
      g.fillCircle(wp.x, wp.y, PATH_WIDTH / 2);
    }

    // Subtle centerline texture (dashes) for readability.
    g.fillStyle(0xc4a06f, 0.6);
    for (let i = 0; i < PATH_WAYPOINTS.length - 1; i += 1) {
      const a = PATH_WAYPOINTS[i];
      const b = PATH_WAYPOINTS[i + 1];
      const segLength = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      const steps = Math.floor(segLength / 30);
      for (let s = 0; s < steps; s += 1) {
        const t = s / steps;
        const x = Phaser.Math.Linear(a.x, b.x, t);
        const y = Phaser.Math.Linear(a.y, b.y, t);
        g.fillCircle(x, y, 3);
      }
    }

    // Spawn marker + label.
    this.add.image(SPAWN_POINT.x, SPAWN_POINT.y, 'spawn_marker');
    this.add
      .text(SPAWN_POINT.x, SPAWN_POINT.y - 48, 'SPAWN', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Base structure + label.
    this.add.image(BASE_POINT.x, BASE_POINT.y - 8, 'base_keep');
    this.add
      .text(BASE_POINT.x, BASE_POINT.y - 82, 'BASE', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Decorative props, skipping anything that would visually clash with
    // the path.
    DECORATIONS.forEach((d) => {
      const dist = distanceToPath(d.x, d.y, PATH_WAYPOINTS);
      if (dist < PATH_WIDTH / 2 + 16) return;
      const key = d.type === 'tree' ? 'deco_tree' : 'deco_rock';
      this.add.image(d.x, d.y, key).setOrigin(0.5, 0.9);
    });

    // Thin frame around the playable map for readability.
    const border = this.add.graphics();
    border.lineStyle(4, 0x1b3a1f, 1);
    border.strokeRect(2, 2, MAP_WIDTH - 4, MAP_HEIGHT - 4);
  }

  // ---------------------------------------------------------------------
  // Input: placement mode + tower selection
  // ---------------------------------------------------------------------

  setupInput() {
    this._onPointerDown = (pointer) => this.handleWorldPointerDown(pointer);
    this._onKeyDownEsc = () => this.cancelPlacement();

    this.input.on('pointerdown', this._onPointerDown);
    this.input.keyboard.on('keydown-ESC', this._onKeyDownEsc);
  }

  handleWorldPointerDown(pointer) {
    if (this.isGameOver || this.isPaused) return;

    if (this.placementType) {
      this.tryPlaceTowerAtPointer(pointer);
      return;
    }

    const hits = this.input.hitTestPointer(pointer);
    const towerHit = hits.find((obj) => obj instanceof Tower);
    if (towerHit) {
      this.towerSystem.selectTower(towerHit);
    } else {
      this.towerSystem.deselectTower();
    }
  }

  beginPlacement(type) {
    this.cancelPlacement();
    this.towerSystem.deselectTower();

    this.placementType = type;
    this.placementGhost = this.add.image(-9999, -9999, `tower_${type}_base`).setAlpha(0.65);
    this.placementRange = this.add.graphics();

    GameEvents.emit(Events.PLACEMENT_STATE_CHANGED, { active: true, type });
  }

  cancelPlacement() {
    if (this.placementGhost) {
      this.placementGhost.destroy();
      this.placementGhost = null;
    }
    if (this.placementRange) {
      this.placementRange.destroy();
      this.placementRange = null;
    }
    if (this.placementType) {
      this.placementType = null;
      GameEvents.emit(Events.PLACEMENT_STATE_CHANGED, { active: false });
    }
  }

  updatePlacementGhost() {
    if (!this.placementType || !this.placementGhost) return;

    const pointer = this.input.activePointer;
    const x = pointer.worldX;
    const y = pointer.worldY;
    this.placementGhost.setPosition(x, y);

    const stats = getTowerStatsAtLevel(this.placementType, 1);
    const check = this.towerSystem.canPlaceAt(x, y, this.placementType);
    const color = check.valid ? 0x66bb6a : 0xef5350;

    this.placementGhost.setTint(color);

    this.placementRange.clear();
    this.placementRange.fillStyle(color, 0.12);
    this.placementRange.fillCircle(x, y, stats.range);
    this.placementRange.lineStyle(2, color, 0.85);
    this.placementRange.strokeCircle(x, y, stats.range);
  }

  tryPlaceTowerAtPointer(pointer) {
    const x = pointer.worldX;
    const y = pointer.worldY;
    const type = this.placementType;

    const tower = this.towerSystem.placeTower(x, y, type);
    if (tower) {
      this.effects.placementPulse(tower);
      this.cancelPlacement();
    }
  }

  // ---------------------------------------------------------------------
  // React -> Phaser command wiring
  // ---------------------------------------------------------------------

  registerCommandListeners() {
    this._onSelectTowerType = (type) => this.beginPlacement(type);
    this._onCancelSelection = () => this.cancelPlacement();
    this._onUpgradeTower = (id) => this.towerSystem.upgradeTower(id);
    this._onSellTower = (id) => this.towerSystem.sellTower(id);
    this._onStartNextWave = () => this.waveSystem.startNextWaveEarly();
    this._onPauseGame = () => this.setPaused(true);
    this._onResumeGame = () => this.setPaused(false);
    this._onSetSpeed = (speed) => this.setSpeed(speed);
    this._onRestartGame = () => this.restartGame();

    GameEvents.on(Events.SELECT_TOWER_TYPE, this._onSelectTowerType);
    GameEvents.on(Events.CANCEL_TOWER_SELECTION, this._onCancelSelection);
    GameEvents.on(Events.UPGRADE_TOWER, this._onUpgradeTower);
    GameEvents.on(Events.SELL_TOWER, this._onSellTower);
    GameEvents.on(Events.START_NEXT_WAVE, this._onStartNextWave);
    GameEvents.on(Events.PAUSE_GAME, this._onPauseGame);
    GameEvents.on(Events.RESUME_GAME, this._onResumeGame);
    GameEvents.on(Events.SET_GAME_SPEED, this._onSetSpeed);
    GameEvents.on(Events.RESTART_GAME, this._onRestartGame);
  }

  unregisterCommandListeners() {
    GameEvents.off(Events.SELECT_TOWER_TYPE, this._onSelectTowerType);
    GameEvents.off(Events.CANCEL_TOWER_SELECTION, this._onCancelSelection);
    GameEvents.off(Events.UPGRADE_TOWER, this._onUpgradeTower);
    GameEvents.off(Events.SELL_TOWER, this._onSellTower);
    GameEvents.off(Events.START_NEXT_WAVE, this._onStartNextWave);
    GameEvents.off(Events.PAUSE_GAME, this._onPauseGame);
    GameEvents.off(Events.RESUME_GAME, this._onResumeGame);
    GameEvents.off(Events.SET_GAME_SPEED, this._onSetSpeed);
    GameEvents.off(Events.RESTART_GAME, this._onRestartGame);
  }

  setPaused(paused) {
    if (this.isGameOver) return;
    this.isPaused = paused;
    this.time.paused = paused;
    if (paused) {
      this.tweens.pauseAll();
      GameEvents.emit(Events.GAME_PAUSED);
    } else {
      this.tweens.resumeAll();
      GameEvents.emit(Events.GAME_RESUMED);
    }
  }

  setSpeed(speed) {
    this.speedMultiplier = speed;
    this.time.timeScale = speed;
    GameEvents.emit(Events.GAME_SPEED_CHANGED, speed);
  }

  restartGame() {
    this.scene.restart();
  }

  // ---------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------

  handleShutdown() {
    this.unregisterCommandListeners();
    this.input.off('pointerdown', this._onPointerDown);
    this.input.keyboard.off('keydown-ESC', this._onKeyDownEsc);
    this.towerSystem?.destroy();
    this.waveSystem?.destroy();
  }

  update(time, delta) {
    if (this.isGameOver) return;
    if (this.isPaused) return;

    const scaledDelta = delta * this.speedMultiplier;

    this.waveSystem.update(scaledDelta);
    this.towerSystem.update(time, scaledDelta, this.waveSystem.enemies);
    this.updatePlacementGhost();

    if (this.healthSystem.isDead && !this.isGameOver) {
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
    this.isGameOver = true;
    this.cancelPlacement();
    this.towerSystem.deselectTower();

    // Freeze Phaser's own timer system so any pending wave-spawn or
    // next-wave-countdown timers stop dead rather than silently ticking
    // (and potentially firing) behind the Game Over overlay.
    this.time.paused = true;
    this.tweens.pauseAll();
    this.waveSystem.clearCountdown();
    GameEvents.emit(Events.NEXT_WAVE_COUNTDOWN, null);

    GameEvents.emit(Events.GAME_OVER, {
      waveReached: this.waveSystem.waveNumber,
      enemiesDestroyed: this.stats.enemiesDestroyed,
      moneyEarned: this.economySystem.earnedFromKills,
    });
  }
}
