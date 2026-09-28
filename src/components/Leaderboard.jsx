/**
 * Leaderboard.jsx
 *
 * Fetches and renders the top match results. Purely presentational plus
 * its own small loading/error/unavailable state - never imports Phaser,
 * never talks to MongoDB directly (that's matchApi.js + the server's
 * job).
 *
 * To refetch (e.g. after a successful score submission), the parent
 * renders this with a new `key` prop so React fully remounts it, rather
 * than this component resetting its own state back to "loading" inside
 * the effect.
 */
import { useEffect, useState } from 'react';
import { fetchLeaderboard, isUnavailableError } from '../services/matchApi.js';

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | unavailable | error

  useEffect(() => {
    let cancelled = false;

    fetchLeaderboard()
      .then((data) => {
        if (cancelled) return;
        setEntries(data);
        setState('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setState(isUnavailableError(err) ? 'unavailable' : 'error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') {
    return <div className="leaderboard leaderboard-note">Loading leaderboard…</div>;
  }

  if (state === 'unavailable') {
    return <div className="leaderboard leaderboard-note">Leaderboard is currently unavailable.</div>;
  }

  if (state === 'error') {
    return <div className="leaderboard leaderboard-note">Couldn't load the leaderboard.</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="leaderboard">
        <h3>Leaderboard</h3>
        <div className="leaderboard-note">No scores yet — be the first!</div>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h3>Leaderboard</h3>
      <ol className="leaderboard-list">
        {entries.map((entry, index) => (
          <li key={entry._id ?? `${entry.playerName}-${index}`} className="leaderboard-entry">
            <span className="leaderboard-rank">#{index + 1}</span>
            <span className="leaderboard-name">{entry.playerName}</span>
            <span className="leaderboard-score">{entry.score}</span>
            <span className="leaderboard-detail">
              Wave {entry.waveReached} · {entry.enemiesDestroyed} kills
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
