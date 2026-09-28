/**
 * Projectile.js
 *
 * A visible game object that travels from a tower toward its target and
 * applies damage on impact (never instantaneous invisible damage). Cleans
 * itself up when it hits, when its target disappears, or after a safety
 * time-to-live so nothing lingers as a memory leak.
 */
import Phaser from 'phaser';
import { MAP_WIDTH, MAP_HEIGHT } from '../config/mapConfig.js';

const MAX_LIFETIME_MS = 3000;
const BOUNDS_PADDING = 60;

export default class Projectile extends Phaser.GameObjects.Image {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} texture
   * @param {object} target enemy-like object with x/y/alive
   * @param {number} damage
   * @param {number} speed px/sec
   * @param {number} splashRadius 0 for single-target projectiles
   * @param {(x:number, y:number, damage:number, splashRadius:number, target:object) => void} onHit
   */
  constructor(scene, x, y, texture, target, damage, speed, splashRadius, onHit) {
    super(scene, x, y, texture);

    this.target = target;
    this.damage = damage;
    this.speed = speed;
    this.splashRadius = splashRadius;
    this.onHit = onHit;
    this.alive = true;
    this.ttl = MAX_LIFETIME_MS;

    this.rotation = Phaser.Math.Angle.Between(x, y, target.x, target.y);
    scene.add.existing(this);
  }

  update(deltaMs) {
    if (!this.alive) return;

    this.ttl -= deltaMs;
    if (this.ttl <= 0 || !this.target || !this.target.alive) {
      this.destroyProjectile();
      return;
    }

    const targetX = this.target.x;
    const targetY = this.target.y;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    const step = this.speed * (deltaMs / 1000);

    this.rotation = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);

    if (step >= distance) {
      this.hit(targetX, targetY);
      return;
    }

    this.x += Math.cos(this.rotation) * step;
    this.y += Math.sin(this.rotation) * step;

    if (
      this.x < -BOUNDS_PADDING ||
      this.y < -BOUNDS_PADDING ||
      this.x > MAP_WIDTH + BOUNDS_PADDING ||
      this.y > MAP_HEIGHT + BOUNDS_PADDING
    ) {
      this.destroyProjectile();
    }
  }

  hit(x, y) {
    if (!this.alive) return;
    this.alive = false;
    if (this.onHit) this.onHit(x, y, this.damage, this.splashRadius, this.target);
    this.destroy();
  }

  destroyProjectile() {
    if (!this.alive) return;
    this.alive = false;
    this.destroy();
  }
}
