/**
 * Tower.js
 *
 * A placed tower. Phaser owns its position, level, stats and selection
 * state. Stat values always come from `towers.js` via
 * `getTowerStatsAtLevel` - this class never hardcodes balance numbers, so
 * upgrading is purely "bump level, re-read config".
 */
import Phaser from 'phaser';
import { getTowerConfig, getTowerStatsAtLevel, getUpgradeCost, TOWER_MAX_LEVEL } from '../config/towers.js';

let nextTowerId = 1;

export default class Tower extends Phaser.GameObjects.Container {
  constructor(scene, x, y, type) {
    super(scene, x, y);

    this.type = type;
    this.id = `tower_${nextTowerId++}`;
    this.level = 1;
    this.cfg = getTowerConfig(type);
    this.totalInvested = this.cfg.cost;
    this.lastFiredAt = 0;
    this.selected = false;

    this.applyStatsForLevel();

    this.base = scene.add.image(0, 0, `tower_${type}_base`);
    this.add(this.base);

    this.barrel = scene.add.image(0, 0, `tower_${type}_barrel`);
    this.barrel.setOrigin(0.15, 0.5);
    this.add(this.barrel);

    this.rangeCircle = scene.add.graphics();
    this.rangeCircle.setVisible(false);
    this.add(this.rangeCircle);
    this.drawRangeCircle();

    this.setSize(52, 52);
    this.setInteractive(new Phaser.Geom.Circle(0, 0, 26), Phaser.Geom.Circle.Contains);

    scene.add.existing(this);
  }

  applyStatsForLevel() {
    const stats = getTowerStatsAtLevel(this.type, this.level);
    this.damage = stats.damage;
    this.range = stats.range;
    this.fireRate = stats.fireRate;
    this.projectileSpeed = stats.projectileSpeed;
    this.splashRadius = stats.splashRadius;
  }

  drawRangeCircle() {
    this.rangeCircle.clear();
    this.rangeCircle.fillStyle(0xffffff, 0.08);
    this.rangeCircle.fillCircle(0, 0, this.range);
    this.rangeCircle.lineStyle(2, 0xffffff, 0.55);
    this.rangeCircle.strokeCircle(0, 0, this.range);
  }

  setSelected(selected) {
    this.selected = selected;
    this.rangeCircle.setVisible(selected);
  }

  canFire(time) {
    return time - this.lastFiredAt >= this.fireRate;
  }

  markFired(time) {
    this.lastFiredAt = time;
  }

  /**
   * Smoothly rotate the barrel toward a target world position. Uses
   * Phaser.Math.Angle.RotateTo each frame for a gentle turret-tracking
   * feel; the base graphic never rotates.
   */
  aimAt(targetX, targetY, deltaMs) {
    const desired = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const turnSpeed = 0.014; // radians per ms, tuned for a snappy-but-smooth feel
    this.barrel.rotation = Phaser.Math.Angle.RotateTo(this.barrel.rotation, desired, turnSpeed * deltaMs);
  }

  getMuzzlePosition() {
    const dist = this.barrel.displayWidth * (1 - this.barrel.originX) * 0.8;
    return {
      x: this.x + Math.cos(this.barrel.rotation) * dist,
      y: this.y + Math.sin(this.barrel.rotation) * dist,
    };
  }

  getUpgradeCost() {
    return getUpgradeCost(this.type, this.level);
  }

  upgrade() {
    if (this.level >= TOWER_MAX_LEVEL) return null;
    const cost = this.getUpgradeCost();
    if (cost == null) return null;
    this.level += 1;
    this.totalInvested += cost;
    this.applyStatsForLevel();
    this.drawRangeCircle();
    this.pulseUpgrade();
    return cost;
  }

  pulseUpgrade() {
    this.scene.tweens.add({
      targets: this.base,
      scale: { from: 1, to: 1.35 },
      duration: 130,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  toSnapshot() {
    return {
      id: this.id,
      type: this.type,
      name: this.cfg.name,
      level: this.level,
      maxLevel: TOWER_MAX_LEVEL,
      damage: this.damage,
      range: this.range,
      fireRate: this.fireRate,
      splashRadius: this.splashRadius,
      totalInvested: this.totalInvested,
      upgradeCost: this.getUpgradeCost(),
      sellValue: Math.round(this.totalInvested * 0.7),
      x: this.x,
      y: this.y,
    };
  }
}
