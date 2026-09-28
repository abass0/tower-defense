/**
 * TargetingSystem.js
 *
 * Pure targeting logic used by towers to pick an enemy within range.
 * Only the FIRST strategy (attack the enemy furthest along the path) is
 * required for the MVP. The strategy map below is structured so LAST /
 * STRONGEST / WEAKEST / CLOSEST can be dropped in later without touching
 * any call site - `Tower`/`TowerSystem` only ever calls
 * `TargetingSystem.findTarget(strategyName, tower, enemies)`.
 */
import Phaser from 'phaser';

export const TargetingStrategy = {
  FIRST: 'FIRST',
  LAST: 'LAST',
  STRONGEST: 'STRONGEST',
  WEAKEST: 'WEAKEST',
  CLOSEST: 'CLOSEST',
};

// Enemy furthest along the path (closest to the base) wins.
function pickFirst(enemiesInRange) {
  let best = null;
  for (const enemy of enemiesInRange) {
    if (!best || enemy.pathT > best.pathT) best = enemy;
  }
  return best;
}

// Extension points for future targeting modes - intentionally not
// implemented for the MVP per spec ("Only FIRST needs to work").
const strategies = {
  [TargetingStrategy.FIRST]: pickFirst,
  [TargetingStrategy.LAST]: null, // TODO(post-MVP): least path progress
  [TargetingStrategy.STRONGEST]: null, // TODO(post-MVP): highest current HP
  [TargetingStrategy.WEAKEST]: null, // TODO(post-MVP): lowest current HP
  [TargetingStrategy.CLOSEST]: null, // TODO(post-MVP): nearest to tower
};

export default class TargetingSystem {
  static findTarget(strategyName, tower, enemies) {
    const inRange = enemies.filter(
      (e) => e.alive && Phaser.Math.Distance.Between(tower.x, tower.y, e.x, e.y) <= tower.range
    );
    if (inRange.length === 0) return null;

    const strategyFn = strategies[strategyName] || strategies[TargetingStrategy.FIRST];
    return strategyFn(inRange) || pickFirst(inRange);
  }
}
