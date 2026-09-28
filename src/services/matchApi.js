/**
 * matchApi.js
 *
 * The ONLY frontend file that knows the HTTP API exists. Components call
 * these functions and get back plain data or a typed error - the same
 * discipline as GameEvents on the Phaser side: components never reach
 * past their own boundary and build a raw fetch()/emit() call directly.
 */
const UNAVAILABLE = 'leaderboard_unavailable';

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function isUnavailableError(err) {
  return err instanceof Error && err.message === UNAVAILABLE;
}

export async function submitMatchResult({ playerName, waveReached, enemiesDestroyed, moneyEarned }) {
  const response = await fetch('/api/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, waveReached, enemiesDestroyed, moneyEarned }),
  });

  if (response.status === 503) throw new Error(UNAVAILABLE);
  if (!response.ok) throw new Error('submit_failed');

  return parseJsonSafe(response);
}

export async function fetchLeaderboard(limit = 10) {
  const response = await fetch(`/api/leaderboard?limit=${limit}`);

  if (response.status === 503) throw new Error(UNAVAILABLE);
  if (!response.ok) throw new Error('fetch_failed');

  return (await parseJsonSafe(response)) || [];
}
