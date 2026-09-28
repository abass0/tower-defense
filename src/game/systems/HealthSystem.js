/**
 * HealthSystem.js
 *
 * Owns the player's base health. Emits HEALTH_CHANGED on every change.
 * Game over *detection* happens here (isDead flag) but the actual
 * GAME_OVER event + stats gathering is orchestrated by GameScene, since
 * this system deliberately knows nothing about waves/economy/kill counts.
 */
import GameEvents, { Events } from '../events/GameEvents.js';

export default class HealthSystem {
  constructor(maxHealth) {
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.isDead = false;
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    GameEvents.emit(Events.HEALTH_CHANGED, { health: this.health, maxHealth: this.maxHealth });
    if (this.health <= 0) {
      this.isDead = true;
    }
  }
}
