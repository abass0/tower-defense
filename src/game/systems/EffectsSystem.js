/**
 * EffectsSystem.js
 *
 * Lightweight, self-cleaning visual feedback built entirely from Phaser
 * primitives (Graphics, Tweens, Particles). Kept as one small system so
 * towers/enemies/GameScene don't scatter tween/particle boilerplate
 * everywhere - they just call `effects.muzzleFlash(...)`, etc.
 */
export default class EffectsSystem {
  constructor(scene) {
    this.scene = scene;
  }

  muzzleFlash(x, y, color = 0xfff59d) {
    const scene = this.scene;
    const flash = scene.add.circle(x, y, 7, color, 0.9);
    scene.tweens.add({
      targets: flash,
      scale: 2,
      alpha: 0,
      duration: 110,
      onComplete: () => flash.destroy(),
    });
  }

  tracerFlash(x, y, angle, length, color = 0xf3e5f5) {
    const scene = this.scene;
    const line = scene.add.rectangle(x, y, length, 3, color, 0.9);
    line.setOrigin(0, 0.5);
    line.setRotation(angle);
    scene.tweens.add({
      targets: line,
      alpha: 0,
      duration: 140,
      onComplete: () => line.destroy(),
    });
  }

  explosion(x, y, radius) {
    const scene = this.scene;
    const state = { r: 6, alpha: 0.85 };
    const ring = scene.add.graphics();
    scene.tweens.add({
      targets: state,
      r: radius,
      alpha: 0,
      duration: 320,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        ring.clear();
        ring.lineStyle(4, 0xffab91, state.alpha);
        ring.strokeCircle(x, y, state.r);
        ring.fillStyle(0xff8a50, state.alpha * 0.25);
        ring.fillCircle(x, y, state.r);
      },
      onComplete: () => ring.destroy(),
    });

    if (scene.textures.exists('particle_debris')) {
      const emitter = scene.add.particles(x, y, 'particle_debris', {
        speed: { min: 60, max: 200 },
        angle: { min: 0, max: 360 },
        lifespan: 380,
        scale: { start: 1, end: 0 },
        quantity: 12,
        emitting: false,
      });
      emitter.explode(12);
      scene.time.delayedCall(450, () => emitter.destroy());
    }
  }

  hitSpark(x, y, color = 0xffffff) {
    const scene = this.scene;
    if (!scene.textures.exists('particle_spark')) return;
    const emitter = scene.add.particles(x, y, 'particle_spark', {
      speed: { min: 30, max: 90 },
      angle: { min: 0, max: 360 },
      lifespan: 200,
      scale: { start: 1, end: 0 },
      quantity: 5,
      tint: color,
      emitting: false,
    });
    emitter.explode(5);
    scene.time.delayedCall(260, () => emitter.destroy());
  }

  enemyDeathBurst(x, y, color = 0xffffff) {
    const scene = this.scene;
    if (!scene.textures.exists('particle_debris')) return;
    const emitter = scene.add.particles(x, y, 'particle_debris', {
      speed: { min: 40, max: 150 },
      angle: { min: 0, max: 360 },
      lifespan: 350,
      scale: { start: 1.1, end: 0 },
      quantity: 10,
      tint: color,
      emitting: false,
    });
    emitter.explode(10);
    scene.time.delayedCall(400, () => emitter.destroy());
  }

  placementPulse(target) {
    this.scene.tweens.add({
      targets: target,
      scale: { from: 0.2, to: 1 },
      duration: 220,
      ease: 'Back.easeOut',
    });
  }
}
