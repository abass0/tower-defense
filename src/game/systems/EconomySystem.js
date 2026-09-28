/**
 * EconomySystem.js
 *
 * Owns the player's money. This is the single source of truth for the
 * player's cash balance - nothing else mutates it directly. Emits
 * MONEY_CHANGED any time the balance changes so React can update the HUD.
 */
import GameEvents, { Events } from '../events/GameEvents.js';

export default class EconomySystem {
  constructor(startingMoney) {
    this.money = startingMoney;
    // Tracked separately from `money` for the Game Over "money earned"
    // stat - purely additive lifetime earnings from kills, not net worth.
    this.earnedFromKills = 0;
  }

  addMoney(amount, { fromKill = false } = {}) {
    this.money += amount;
    if (fromKill) this.earnedFromKills += amount;
    GameEvents.emit(Events.MONEY_CHANGED, this.money);
  }

  spendMoney(amount) {
    if (this.money < amount) return false;
    this.money -= amount;
    GameEvents.emit(Events.MONEY_CHANGED, this.money);
    return true;
  }

  canAfford(amount) {
    return this.money >= amount;
  }
}
