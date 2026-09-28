/**
 * towers.js
 *
 * Single source of truth for tower balance. Every gameplay number for a
 * tower type (cost, damage, range, fire rate, projectile behaviour and
 * per-level upgrade scaling) lives here. Nothing else in the codebase
 * should hardcode a tower's stats - always read through
 * `getTowerStatsAtLevel` / `getUpgradeCost` so balance changes only ever
 * require editing this file.
 */

export const TOWER_MAX_LEVEL = 3;

export const TOWER_TYPES = {
  machineGun: {
    id: 'machineGun',
    name: 'Machine Gun',
    description: 'Reliable sustained DPS against groups of weaker enemies.',
    cost: 100,
    baseDamage: 8,
    baseRange: 165,
    baseFireRate: 160, // ms between shots (very high attack speed)
    projectileSpeed: 640,
    projectileType: 'bullet',
    splashRadius: 0,
    color: 0x4fc3f7,
    barrelColor: 0x01579b,
    projectileColor: 0xe1f5fe,
    upgradeScaling: {
      damageMultPerLevel: 1.4,
      rangeMultPerLevel: 1.08,
      fireRateMultPerLevel: 0.9,
    },
    upgradeCost: [70, 140],
  },

  cannon: {
    id: 'cannon',
    name: 'Cannon',
    description: 'Slow but devastating area-of-effect explosions.',
    cost: 200,
    baseDamage: 55,
    baseRange: 150,
    baseFireRate: 1450, // slow attack speed
    projectileSpeed: 270, // slow projectile
    projectileType: 'shell',
    splashRadius: 75,
    color: 0xff8a50,
    barrelColor: 0x8d3b0a,
    projectileColor: 0x5d4037,
    upgradeScaling: {
      damageMultPerLevel: 1.4,
      rangeMultPerLevel: 1.1,
      fireRateMultPerLevel: 0.93,
    },
    upgradeCost: [140, 260],
  },

  sniper: {
    id: 'sniper',
    name: 'Sniper',
    description: 'Eliminates strong enemies from extreme range.',
    cost: 300,
    baseDamage: 110,
    baseRange: 340,
    baseFireRate: 1900, // very slow attack speed
    projectileSpeed: 1100, // very fast projectile / tracer
    projectileType: 'tracer',
    splashRadius: 0,
    color: 0xba68c8,
    barrelColor: 0x4a148c,
    projectileColor: 0xf3e5f5,
    upgradeScaling: {
      damageMultPerLevel: 1.45,
      rangeMultPerLevel: 1.08,
      fireRateMultPerLevel: 0.92,
    },
    upgradeCost: [200, 380],
  },
};

export const TOWER_ORDER = ['machineGun', 'cannon', 'sniper'];

/**
 * Compute the effective stats for a tower type at a given level (1-based).
 */
export function getTowerStatsAtLevel(type, level) {
  const cfg = TOWER_TYPES[type];
  if (!cfg) throw new Error(`Unknown tower type: ${type}`);
  const levelIndex = Math.max(0, level - 1);
  const { damageMultPerLevel, rangeMultPerLevel, fireRateMultPerLevel } = cfg.upgradeScaling;

  return {
    damage: Math.round(cfg.baseDamage * damageMultPerLevel ** levelIndex),
    range: Math.round(cfg.baseRange * rangeMultPerLevel ** levelIndex),
    fireRate: Math.round(cfg.baseFireRate * fireRateMultPerLevel ** levelIndex),
    projectileSpeed: cfg.projectileSpeed,
    splashRadius: cfg.splashRadius,
  };
}

/**
 * Cost in dollars to upgrade a tower currently at `currentLevel` to the
 * next level. Returns null if already at max level.
 */
export function getUpgradeCost(type, currentLevel) {
  const cfg = TOWER_TYPES[type];
  if (!cfg) throw new Error(`Unknown tower type: ${type}`);
  if (currentLevel >= TOWER_MAX_LEVEL) return null;
  return cfg.upgradeCost[currentLevel - 1];
}

export function getTowerConfig(type) {
  const cfg = TOWER_TYPES[type];
  if (!cfg) throw new Error(`Unknown tower type: ${type}`);
  return cfg;
}
