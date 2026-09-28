/**
 * enemies.js
 *
 * Single source of truth for enemy balance. Speeds are expressed in
 * pixels/second along the path; `Enemy.js` reads through
 * `getEnemyConfig` rather than hardcoding any stats.
 */

export const ENEMY_TYPES = {
  normal: {
    id: 'normal',
    name: 'Normal',
    maxHealth: 100,
    speed: 85, // px/sec
    reward: 10,
    baseDamage: 10,
    radius: 15,
    color: 0x66bb6a,
    outlineColor: 0x2e7d32,
    spawnInterval: 550, // ms between spawns of this type within a wave
  },
  fast: {
    id: 'fast',
    name: 'Fast',
    maxHealth: 55,
    speed: 165,
    reward: 15,
    baseDamage: 5,
    radius: 12,
    color: 0xffee58,
    outlineColor: 0xf9a825,
    spawnInterval: 380,
  },
  tank: {
    id: 'tank',
    name: 'Tank',
    maxHealth: 460,
    speed: 45,
    reward: 30,
    baseDamage: 25,
    radius: 21,
    color: 0x8d6e63,
    outlineColor: 0x4e342e,
    spawnInterval: 850,
  },
};

export const ENEMY_ORDER = ['normal', 'fast', 'tank'];

export function getEnemyConfig(type) {
  const cfg = ENEMY_TYPES[type];
  if (!cfg) throw new Error(`Unknown enemy type: ${type}`);
  return cfg;
}
