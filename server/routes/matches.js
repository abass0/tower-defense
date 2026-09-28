/**
 * routes/matches.js
 *
 * POST /api/matches - submit a completed match result. Validates shape
 * only (this is a demo, not a production auth boundary); the actual
 * score is computed by matchRepository, never trusted from the client.
 */
import { Router } from 'express';
import { insertMatch } from '../repositories/matchRepository.js';

const router = Router();
const MAX_NAME_LENGTH = 24;

function isValidPayload(body) {
  return (
    !!body &&
    typeof body.playerName === 'string' &&
    body.playerName.trim().length > 0 &&
    Number.isFinite(body.waveReached) &&
    Number.isFinite(body.enemiesDestroyed) &&
    Number.isFinite(body.moneyEarned)
  );
}

router.post('/', async (req, res) => {
  if (!isValidPayload(req.body)) {
    res.status(400).json({ error: 'invalid_payload' });
    return;
  }

  const playerName = req.body.playerName.trim().slice(0, MAX_NAME_LENGTH);

  try {
    const saved = await insertMatch({
      playerName,
      waveReached: req.body.waveReached,
      enemiesDestroyed: req.body.enemiesDestroyed,
      moneyEarned: req.body.moneyEarned,
    });
    res.status(201).json(saved);
  } catch {
    // Covers both "not connected" and any query failure - from the
    // client's point of view, the leaderboard feature is simply off.
    res.status(503).json({ error: 'leaderboard_unavailable' });
  }
});

export default router;
