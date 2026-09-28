/**
 * TowerSystem.js
 *
 * Owns the collection of placed towers and their projectiles: placement
 * validation, building, upgrading, selling, targeting/firing each frame,
 * and projectile lifecycle. GameScene delegates all of this here instead
 * of implementing tower gameplay itself.
 */
import Phaser from 'phaser';
import Tower from '../entities/Tower.js';
import Projectile from '../entities/Projectile.js';
import TargetingSystem, { TargetingStrategy } from './TargetingSystem.js';
import { getTowerConfig } from '../config/towers.js';
import { distanceToPath } from '../utils/pathUtils.js';
import { PATH_WIDTH, MAP_WIDTH, MAP_HEIGHT, MAP_MARGIN, TOWER_MIN_SPACING } from '../config/mapConfig.js';
import GameEvents, { Events } from '../events/GameEvents.js';
import { SoundKeys } from './AudioSystem.js';

const TOWER_FOOTPRINT_RADIUS = 26;

const TOWER_FIRE_SOUND = {
  machineGun: SoundKeys.TOWER_FIRE_MACHINE_GUN,
  cannon: SoundKeys.TOWER_FIRE_CANNON,
  sniper: SoundKeys.TOWER_FIRE_SNIPER,
};

const PROJECTILE_TEXTURES = {
  bullet: 'projectile_bullet',
  shell: 'projectile_shell',
  tracer: 'projectile_tracer',
};

export default class TowerSystem {
  constructor(scene, { pathWaypoints, economy, effects, audio }) {
    this.scene = scene;
    this.pathWaypoints = pathWaypoints;
    this.economy = economy;
    this.effects = effects;
    this.audio = audio;

    this.towers = [];
    this.projectiles = [];
    this.selectedTower = null;
    this.enemies = [];
  }

  /**
   * Validates whether a tower of `type` could be placed at (x, y) right
   * now. Checked, in order: map bounds, distance from the path, overlap
   * with existing towers, and affordability.
   */
  canPlaceAt(x, y, type) {
    const cfg = getTowerConfig(type);

    if (x < MAP_MARGIN || y < MAP_MARGIN || x > MAP_WIDTH - MAP_MARGIN || y > MAP_HEIGHT - MAP_MARGIN) {
      return { valid: false, reason: 'out_of_bounds' };
    }

    if (distanceToPath(x, y, this.pathWaypoints) < PATH_WIDTH / 2 + TOWER_FOOTPRINT_RADIUS + 6) {
      return { valid: false, reason: 'on_path' };
    }

    for (const tower of this.towers) {
      if (Phaser.Math.Distance.Between(x, y, tower.x, tower.y) < TOWER_MIN_SPACING) {
        return { valid: false, reason: 'overlaps_tower' };
      }
    }

    if (!this.economy.canAfford(cfg.cost)) {
      return { valid: false, reason: 'cannot_afford' };
    }

    return { valid: true };
  }

  placeTower(x, y, type) {
    const check = this.canPlaceAt(x, y, type);
    if (!check.valid) return null;

    const cfg = getTowerConfig(type);
    if (!this.economy.spendMoney(cfg.cost)) return null;

    const tower = new Tower(this.scene, x, y, type);
    this.towers.push(tower);
    return tower;
  }

  selectTower(tower) {
    if (this.selectedTower && this.selectedTower !== tower) {
      this.selectedTower.setSelected(false);
    }
    this.selectedTower = tower;
    tower.setSelected(true);
    GameEvents.emit(Events.TOWER_SELECTED, tower.toSnapshot());
  }

  deselectTower() {
    if (!this.selectedTower) return;
    this.selectedTower.setSelected(false);
    this.selectedTower = null;
    GameEvents.emit(Events.TOWER_DESELECTED);
  }

  upgradeTower(towerId) {
    const tower = this.towers.find((t) => t.id === towerId);
    if (!tower) return;
    const cost = tower.getUpgradeCost();
    if (cost == null) return;
    if (!this.economy.spendMoney(cost)) return;

    tower.upgrade();
    if (this.selectedTower === tower) {
      GameEvents.emit(Events.TOWER_SELECTED, tower.toSnapshot());
    }
  }

  sellTower(towerId) {
    const idx = this.towers.findIndex((t) => t.id === towerId);
    if (idx === -1) return;
    const tower = this.towers[idx];

    const refund = Math.round(tower.totalInvested * 0.7);
    this.economy.addMoney(refund);
    this.towers.splice(idx, 1);

    if (this.selectedTower === tower) {
      this.selectedTower = null;
      GameEvents.emit(Events.TOWER_DESELECTED);
    }
    tower.destroy();
  }

  /**
   * @param {number} time Phaser's current time (for fire-rate gating)
   * @param {number} deltaMs speed-scaled delta
   * @param {Enemy[]} enemies live enemy list from WaveSystem
   */
  update(time, deltaMs, enemies) {
    this.enemies = enemies;

    for (const tower of this.towers) {
      const target = TargetingSystem.findTarget(TargetingStrategy.FIRST, tower, enemies);
      if (!target) continue;

      tower.aimAt(target.x, target.y, deltaMs);

      if (tower.canFire(time)) {
        tower.markFired(time);
        this.spawnProjectile(tower, target);
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.projectiles[i];
      projectile.update(deltaMs);
      if (!projectile.alive) this.projectiles.splice(i, 1);
    }
  }

  spawnProjectile(tower, target) {
    const textureKey = PROJECTILE_TEXTURES[tower.cfg.projectileType];
    const muzzle = tower.getMuzzlePosition();

    const projectile = new Projectile(
      this.scene,
      muzzle.x,
      muzzle.y,
      textureKey,
      target,
      tower.damage,
      tower.projectileSpeed,
      tower.splashRadius,
      (hitX, hitY, damage, splashRadius, primaryTarget) =>
        this.handleProjectileHit(hitX, hitY, damage, splashRadius, primaryTarget, tower)
    );
    this.projectiles.push(projectile);
    this.audio?.play(TOWER_FIRE_SOUND[tower.type]);

    if (tower.type === 'machineGun') {
      this.effects?.muzzleFlash(muzzle.x, muzzle.y, tower.cfg.projectileColor);
    } else if (tower.type === 'sniper') {
      this.effects?.tracerFlash(muzzle.x, muzzle.y, tower.barrel.rotation, 26, tower.cfg.projectileColor);
    } else {
      this.effects?.muzzleFlash(muzzle.x, muzzle.y, tower.cfg.projectileColor);
    }
  }

  handleProjectileHit(x, y, damage, splashRadius, primaryTarget, tower) {
    if (splashRadius > 0) {
      this.effects?.explosion(x, y, splashRadius);
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
        if (dist <= splashRadius) {
          enemy.takeDamage(damage);
        }
      }
    } else {
      if (primaryTarget && primaryTarget.alive) {
        primaryTarget.takeDamage(damage);
      }
      this.effects?.hitSpark(x, y, tower.cfg.color);
    }
  }

  destroy() {
    this.towers.forEach((t) => t.destroy());
    this.projectiles.forEach((p) => p.destroy());
    this.towers = [];
    this.projectiles = [];
    this.selectedTower = null;
  }
}
