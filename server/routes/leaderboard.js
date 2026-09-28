/**
 * routes/leaderboard.js
 *
 * GET /api/leaderboard - top N match results, ranked by score. Returns
 * 503 (not 500) when MongoDB is unavailable, so the frontend can tell
 * "feature is off" apart from "something actually broke."
 */
import { Router } from 'express';
import { getTopMatches } from '../repositories/matchRepository.js';
import config from '../config.js';

const router = Router();
const MAX_LIMIT = 50;

router.get('/', async (req, res) => {
  const requested = Number(req.query.limit);
  const limit =
    Number.isFinite(requested) && requested > 0
      ? Math.min(Math.floor(requested), MAX_LIMIT)
      : config.leaderboardLimit;

  try {
    const matches = await getTopMatches(limit);
    res.status(200).json(matches);
  } catch {
    res.status(503).json({ error: 'leaderboard_unavailable' });
  }
});

export default router;
