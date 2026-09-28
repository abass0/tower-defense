/**
 * Enemy.js
 *
 * A single enemy instance. Phaser owns everything about it: position
 * (derived from path progress), current/max HP, and alive state. The
 * health bar is rendered directly inside Phaser (Graphics), never in
 * React. Movement uses the Scene's update/delta timing walking along a
 * shared Phaser.Curves.Path - no physics engine required.
 */
import Phaser from 'phaser';
import { getEnemyConfig } from '../config/enemies.js';

let nextEnemyId = 1;

export default class Enemy extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {Phaser.Curves.Path} path shared path all enemies walk
   * @param {number} pathLength precomputed path.getLength()
   * @param {string} type one of the ENEMY_TYPES keys
   * @param {number} hpMultiplier scales maxHealth (used by generated waves)
   */
  constructor(scene, path, pathLength, type, hpMultiplier = 1) {
    const start = path.getStartPoint();
    super(scene, start.x, start.y);

    this.path = path;
    this.pathLength = pathLength;
    this.type = type;
    this.id = `enemy_${nextEnemyId++}`;

    const cfg = getEnemyConfig(type);
    this.cfg = cfg;
    this.maxHp = Math.round(cfg.maxHealth * hpMultiplier);
    this.hp = this.maxHp;
    this.speed = cfg.speed;
    this.reward = cfg.reward;
    this.baseDamage = cfg.baseDamage;
    this.radius = cfg.radius;
    this.alive = true;
    this.pathT = 0;

    this.body = scene.add.image(0, 0, `enemy_${type}`);
    this.add(this.body);

    this.barWidth = cfg.radius * 2.3;
    this.healthBarBg = scene.add.graphics();
    this.healthBarFill = scene.add.graphics();
    this.add(this.healthBarBg);
    this.add(this.healthBarFill);
    this.drawHealthBar();

    this.setSize(cfg.radius * 2, cfg.radius * 2);
    scene.add.existing(this);
  }

  drawHealthBar() {
    const w = this.barWidth;
    const h = 5;
    const y = -this.radius - 11;
    const pct = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);

    this.healthBarBg.clear();
    this.healthBarBg.fillStyle(0x000000, 0.55);
    this.healthBarBg.fillRect(-w / 2 - 1, y - 1, w + 2, h + 2);

    this.healthBarFill.clear();
    const color = pct > 0.5 ? 0x4caf50 : pct > 0.25 ? 0xffb300 : 0xe53935;
    this.healthBarFill.fillStyle(color, 1);
    this.healthBarFill.fillRect(-w / 2, y, Math.max(0, w * pct), h);
  }

  /**
   * @param {number} deltaMs already speed-scaled by the caller (GameScene)
   */
  update(deltaMs) {
    if (!this.alive) return;
    const distance = this.speed * (deltaMs / 1000);
    this.pathT += distance / this.pathLength;

    if (this.pathT >= 1) {
      this.pathT = 1;
      this.onReachedBase();
      return;
    }

    const point = this.path.getPoint(this.pathT);
    this.setPosition(point.x, point.y);
  }

  onReachedBase() {
    if (!this.alive) return;
    this.alive = false;
    this.emit('reachedBase', this);
    this.destroy();
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    } else {
      this.drawHealthBar();
    }
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    this.emit('died', this);
    this.destroy();
  }
}
