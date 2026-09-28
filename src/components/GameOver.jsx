/**
 * GameOver.jsx
 *
 * Full-screen overlay shown when GAME_OVER fires. Stats come straight
 * from the event payload Phaser already computed.
 */
export default function GameOver({ stats, onRestart }) {
  if (!stats) return null;

  return (
    <div className="overlay game-over-overlay">
      <div className="game-over-card">
        <h1>GAME OVER</h1>
        <div className="game-over-stats">
          <div className="game-over-stat">
            <span>Wave Reached</span>
            <strong>{stats.waveReached}</strong>
          </div>
          <div className="game-over-stat">
            <span>Enemies Destroyed</span>
            <strong>{stats.enemiesDestroyed}</strong>
          </div>
          <div className="game-over-stat">
            <span>Money Earned</span>
            <strong>${stats.moneyEarned}</strong>
          </div>
        </div>
        <button type="button" className="btn btn-restart-large" onClick={onRestart}>
          RESTART
        </button>
      </div>
    </div>
  );
}
