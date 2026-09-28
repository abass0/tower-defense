/**
 * WaveSystem.js
 *
 * Owns wave progression and the live enemy list: staggered spawning via
 * Phaser timers, tracking "enemies remaining", the inter-wave countdown,
 * and reacting to enemies dying or reaching the base. GameScene never
 * spawns enemies itself.
 */
import Enemy from '../entities/Enemy.js';
import { getWaveDefinition, NEXT_WAVE_COUNTDOWN_MS } from '../config/waves.js';
import { getEnemyConfig } from '../config/enemies.js';
import GameEvents, { Events } from '../events/GameEvents.js';
import { SoundKeys } from './AudioSystem.js';

const INITIAL_COUNTDOWN_MS = 8000;
const COUNTDOWN_TICK_MS = 100;

export default class WaveSystem {
  constructor(scene, { path, pathLength, economy, health, effects, audio, onEnemyKilled }) {
    this.scene = scene;
    this.path = path;
    this.pathLength = pathLength;
    this.economy = economy;
    this.health = health;
    this.effects = effects;
    this.audio = audio;
    this.onEnemyKilled = onEnemyKilled;

    this.enemies = [];
    this.waveNumber = 0;
    this.enemiesSpawnedThisWave = 0;
    this.enemiesToSpawnThisWave = 0;
    this.waveInProgress = false;

    this.spawnTimers = [];
    this.countdownEvent = null;
    this.countdownRemainingMs = 0;

    this.startWaveCountdown(INITIAL_COUNTDOWN_MS);
  }

  get enemiesRemaining() {
    return this.enemiesToSpawnThisWave - this.enemiesSpawnedThisWave + this.enemies.length;
  }

  emitEnemiesRemaining() {
    GameEvents.emit(Events.ENEMIES_REMAINING_CHANGED, this.enemiesRemaining);
  }

  startWaveCountdown(durationMs = NEXT_WAVE_COUNTDOWN_MS) {
    this.clearCountdown();
    this.countdownRemainingMs = durationMs;
    const nextWaveNumber = this.waveNumber + 1;

    GameEvents.emit(Events.NEXT_WAVE_COUNTDOWN, {
      seconds: Math.ceil(durationMs / 1000),
      waveNumber: nextWaveNumber,
    });

    this.countdownEvent = this.scene.time.addEvent({
      delay: COUNTDOWN_TICK_MS,
      loop: true,
      callback: () => {
        this.countdownRemainingMs -= COUNTDOWN_TICK_MS;
        if (this.countdownRemainingMs <= 0) {
          this.beginNextWave();
        } else {
          GameEvents.emit(Events.NEXT_WAVE_COUNTDOWN, {
            seconds: Math.ceil(this.countdownRemainingMs / 1000),
            waveNumber: nextWaveNumber,
          });
        }
      },
    });
  }

  clearCountdown() {
    if (this.countdownEvent) {
      this.countdownEvent.remove(false);
      this.countdownEvent = null;
    }
  }

  /** Called from the START_NEXT_WAVE command - cancels the countdown. */
  startNextWaveEarly() {
    if (this.waveInProgress) return;
    this.clearCountdown();
    this.beginNextWave();
  }

  beginNextWave() {
    this.clearCountdown();
    // All spawn timers from the previous wave have necessarily already
    // fired by the time it was marked complete - drop the stale
    // references so this array doesn't grow unbounded across waves.
    this.spawnTimers = [];
    this.waveNumber += 1;
    this.waveInProgress = true;

    GameEvents.emit(Events.WAVE_CHANGED, this.waveNumber);
    GameEvents.emit(Events.NEXT_WAVE_COUNTDOWN, null);

    const definition = getWaveDefinition(this.waveNumber);
    this.enemiesSpawnedThisWave = 0;
    this.enemiesToSpawnThisWave = definition.reduce((sum, entry) => sum + entry.count, 0);
    this.emitEnemiesRemaining();

    let cumulativeDelay = 0;
    definition.forEach((entry) => {
      const enemyCfg = getEnemyConfig(entry.type);
      for (let i = 0; i < entry.count; i += 1) {
        const delay = cumulativeDelay;
        const timer = this.scene.time.addEvent({
          delay,
          callback: () => this.spawnEnemy(entry.type, entry.hpMultiplier || 1),
        });
        this.spawnTimers.push(timer);
        cumulativeDelay += enemyCfg.spawnInterval;
      }
    });
  }

  spawnEnemy(type, hpMultiplier) {
    const enemy = new Enemy(this.scene, this.path, this.pathLength, type, hpMultiplier);
    enemy.on('died', this.handleEnemyDied, this);
    enemy.on('reachedBase', this.handleEnemyReachedBase, this);
    this.enemies.push(enemy);
    this.enemiesSpawnedThisWave += 1;
    this.emitEnemiesRemaining();
  }

  handleEnemyDied(enemy) {
    this.removeEnemy(enemy);
    this.economy.addMoney(enemy.reward, { fromKill: true });
    this.effects?.enemyDeathBurst(enemy.x, enemy.y, enemy.cfg.color);
    this.audio?.play(SoundKeys.ENEMY_DEATH);
    this.onEnemyKilled?.(enemy);
    this.emitEnemiesRemaining();
    this.checkWaveComplete();
  }

  handleEnemyReachedBase(enemy) {
    this.removeEnemy(enemy);
    this.health.takeDamage(enemy.baseDamage);
    this.emitEnemiesRemaining();
    this.checkWaveComplete();
  }

  removeEnemy(enemy) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) this.enemies.splice(idx, 1);
  }

  checkWaveComplete() {
    if (!this.waveInProgress) return;
    if (this.enemiesSpawnedThisWave >= this.enemiesToSpawnThisWave && this.enemies.length === 0) {
      this.waveInProgress = false;
      this.startWaveCountdown();
    }
  }

  update(deltaMs) {
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      this.enemies[i].update(deltaMs);
    }
  }

  destroy() {
    this.clearCountdown();
    this.spawnTimers.forEach((t) => t.remove(false));
    this.spawnTimers = [];
    this.enemies.forEach((e) => e.destroy());
    this.enemies = [];
  }
}
