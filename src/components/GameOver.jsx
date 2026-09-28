/**
 * GameOver.jsx
 *
 * Full-screen overlay shown when GAME_OVER fires. The wave/kills/money
 * stats come straight from the GAME_OVER event payload Phaser already
 * computed - unchanged since V1. Score submission and the leaderboard
 * below are additive: if MongoDB is unavailable, this overlay still
 * shows the same stats and the same working restart button it always
 * has - only the submit form/leaderboard degrade.
 */
import { useState } from 'react';
import { submitMatchResult, isUnavailableError } from '../services/matchApi.js';
import Leaderboard from './Leaderboard.jsx';

const NAME_STORAGE_KEY = 'towerdefense_player_name';

export default function GameOver({ stats, onRestart }) {
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem(NAME_STORAGE_KEY) || ''
  );
  const [submitState, setSubmitState] = useState('idle'); // idle | submitting | submitted | unavailable | error
  const [refreshKey, setRefreshKey] = useState(0);

  if (!stats) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = playerName.trim();
    if (!trimmed || submitState === 'submitting') return;

    setSubmitState('submitting');
    try {
      await submitMatchResult({ playerName: trimmed, ...stats });
      localStorage.setItem(NAME_STORAGE_KEY, trimmed);
      setSubmitState('submitted');
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setSubmitState(isUnavailableError(err) ? 'unavailable' : 'error');
    }
  };

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

        {submitState !== 'submitted' && (
          <form className="score-submit-form" onSubmit={handleSubmit}>
            <input
              type="text"
              maxLength={24}
              placeholder="Enter your name"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              disabled={submitState === 'submitting'}
            />
            <button
              type="submit"
              className="btn btn-submit-score"
              disabled={submitState === 'submitting' || !playerName.trim()}
            >
              {submitState === 'submitting' ? 'Submitting…' : 'Submit Score'}
            </button>
          </form>
        )}

        {submitState === 'submitted' && (
          <p className="score-submit-note score-submit-success">Score submitted!</p>
        )}
        {submitState === 'unavailable' && (
          <p className="score-submit-note">Leaderboard is currently unavailable — your score wasn't saved.</p>
        )}
        {submitState === 'error' && (
          <p className="score-submit-note score-submit-error">Couldn't submit your score. Try again?</p>
        )}

        <Leaderboard key={refreshKey} />

        <button type="button" className="btn btn-restart-large" onClick={onRestart}>
          RESTART
        </button>
      </div>
    </div>
  );
}
