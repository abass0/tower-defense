/**
 * GameControls.jsx
 *
 * Pause/resume, game-speed, and restart controls. Purely dispatches
 * commands via App.jsx's callbacks - the actual pause/speed logic lives
 * in GameScene.
 */
export default function GameControls({ isPaused, speed, onTogglePause, onSetSpeed, onRestart }) {
  return (
    <div className="game-controls">
      <button type="button" className="btn btn-control" onClick={onTogglePause}>
        {isPaused ? 'RESUME' : 'PAUSE'}
      </button>

      <div className="speed-toggle">
        <button
          type="button"
          className={`btn btn-speed${speed === 1 ? ' active' : ''}`}
          onClick={() => onSetSpeed(1)}
        >
          1x
        </button>
        <button
          type="button"
          className={`btn btn-speed${speed === 2 ? ' active' : ''}`}
          onClick={() => onSetSpeed(2)}
        >
          2x
        </button>
      </div>

      <button type="button" className="btn btn-restart" onClick={onRestart}>
        RESTART
      </button>
    </div>
  );
}
