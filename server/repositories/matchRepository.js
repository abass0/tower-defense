/**
 * matchRepository.js
 *
 * Data-access layer for match results. Route handlers never write a
 * MongoDB query themselves - they call these functions. If the database
 * were ever swapped out, this is the only file that would need to
 * change.
 */
import { getDb, isReady } from '../db/mongoClient.js';

const COLLECTION = 'matches';

/**
 * Score is computed here, server-side, from the raw stats Phaser
 * already produced - never trusted as a value the client sends. Ranking
 * integrity belongs to the API, not the browser.
 */
function computeScore({ waveReached, enemiesDestroyed, moneyEarned }) {
  return waveReached * 1000 + enemiesDestroyed * 10 + moneyEarned;
}

export async function insertMatch({ playerName, waveReached, enemiesDestroyed, moneyEarned }) {
  if (!isReady()) throw new Error('leaderboard_unavailable');

  const doc = {
    playerName,
    waveReached,
    enemiesDestroyed,
    moneyEarned,
    score: computeScore({ waveReached, enemiesDestroyed, moneyEarned }),
    createdAt: new Date(),
  };

  const result = await getDb().collection(COLLECTION).insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

export async function getTopMatches(limit) {
  if (!isReady()) throw new Error('leaderboard_unavailable');

  return getDb()
    .collection(COLLECTION)
    .find({})
    .sort({ score: -1, createdAt: 1 })
    .limit(limit)
    .toArray();
}
