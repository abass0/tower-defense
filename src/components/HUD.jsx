/**
 * HUD.jsx
 *
 * Pure presentational readout of health/money/wave/enemies remaining.
 * Never touches Phaser - all values are passed down from App.jsx, which
 * only updates them in response to GameEvents.
 */
export default function HUD({ health, maxHealth, money, wave, enemiesRemaining }) {
  const healthPct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const healthColor = healthPct > 50 ? '#4caf50' : healthPct > 25 ? '#ffb300' : '#e53935';

  return (
    <div className="hud">
      <div className="hud-stat hud-health">
        <span className="hud-label">HEALTH</span>
        <div className="hud-health-bar">
          <div className="hud-health-fill" style={{ width: `${healthPct}%`, background: healthColor }} />
          <span className="hud-health-text">{Math.ceil(health)} / {maxHealth}</span>
        </div>
      </div>

      <div className="hud-stat">
        <span className="hud-label">MONEY</span>
        <span className="hud-value hud-money">${money}</span>
      </div>

      <div className="hud-stat">
        <span className="hud-label">WAVE</span>
        <span className="hud-value">{wave > 0 ? wave : '-'}</span>
      </div>

      <div className="hud-stat">
        <span className="hud-label">ENEMIES</span>
        <span className="hud-value">{enemiesRemaining}</span>
      </div>
    </div>
  );
}
