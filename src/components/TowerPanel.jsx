/**
 * TowerPanel.jsx
 *
 * Displays the currently-selected tower's stats and lets the player
 * upgrade or sell it. Receives a plain-data snapshot from Phaser (via
 * TOWER_SELECTED) - never a live Phaser object.
 */
export default function TowerPanel({ tower, money, onUpgrade, onSell }) {
  const atMaxLevel = tower.level >= tower.maxLevel;
  const canUpgrade = !atMaxLevel && tower.upgradeCost != null && money >= tower.upgradeCost;
  const fireRatePerSec = (1000 / tower.fireRate).toFixed(1);

  return (
    <div className="tower-panel">
      <div className="tower-panel-header">
        <h3>{tower.name}</h3>
        <span className="tower-level">Lv. {tower.level}/{tower.maxLevel}</span>
      </div>

      <div className="tower-panel-stats">
        <div className="stat-row">
          <span>Damage</span>
          <span>{tower.damage}</span>
        </div>
        <div className="stat-row">
          <span>Range</span>
          <span>{tower.range}</span>
        </div>
        <div className="stat-row">
          <span>Fire Rate</span>
          <span>{fireRatePerSec}/s</span>
        </div>
        {tower.splashRadius > 0 && (
          <div className="stat-row">
            <span>Splash Radius</span>
            <span>{tower.splashRadius}</span>
          </div>
        )}
        <div className="stat-row">
          <span>Invested</span>
          <span>${tower.totalInvested}</span>
        </div>
      </div>

      <div className="tower-panel-actions">
        <button
          type="button"
          className="btn btn-upgrade"
          disabled={atMaxLevel || !canUpgrade}
          onClick={() => onUpgrade(tower.id)}
        >
          {atMaxLevel ? 'MAX LEVEL' : `UPGRADE ($${tower.upgradeCost})`}
        </button>
        <button type="button" className="btn btn-sell" onClick={() => onSell(tower.id)}>
          SELL (${tower.sellValue})
        </button>
      </div>
    </div>
  );
}
