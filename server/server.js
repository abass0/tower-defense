/**
 * server.js
 *
 * Express server. Serves the built React/Vite bundle (`dist/`) and, as
 * of V2, a small stateless API in front of MongoDB for match results and
 * the leaderboard.
 *
 * MongoDB is never required for this server to start or to keep serving
 * the game: `initMongoConnection()` is fired only AFTER `app.listen()`
 * has already started accepting traffic, and every Mongo-backed route
 * responds with a distinguishable 503 rather than crashing if the
 * database isn't reachable. See server/db/mongoClient.js for the
 * connection lifecycle and retry behavior.
 *
 * Structured so future backend features have an obvious home:
 *   - player accounts / auth        -> app.use('/api/auth', ...)
 *   - saved games                   -> app.use('/api/saves', ...)
 *   - leaderboards                  -> app.use('/api/leaderboard', ...)  [V2]
 *   - persistent progression        -> app.use('/api/progress', ...)
 *   - map APIs                      -> app.use('/api/maps', ...)
 *   - multiplayer / co-op           -> a websocket/Socket.IO layer here
 */
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from './config.js';
import { initMongoConnection, getStatus, closeMongoConnection } from './db/mongoClient.js';
import matchesRouter from './routes/matches.js';
import leaderboardRouter from './routes/leaderboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.port;
const HOST = config.host;
const DIST_DIR = path.join(__dirname, '..', 'dist');

app.disable('x-powered-by');
app.use(express.json());

// Extended health/status endpoint - now also reports Mongo's connection
// state as informational data. Deliberately NOT used to fail this
// endpoint itself: a database blip should never look like the app is
// unhealthy to an external health check.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'tower-defense', mongo: getStatus() });
});

app.use('/api/matches', matchesRouter);
app.use('/api/leaderboard', leaderboardRouter);

app.use(express.static(DIST_DIR));

// SPA fallback: any non-API GET request that isn't a static file falls
// back to index.html so client-side navigation keeps working. Uses a
// path-less `app.use` (rather than an Express route pattern) so it works
// identically across Express major versions and their differing
// wildcard-route syntax.
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

const server = app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Tower Defense server listening on http://${HOST}:${PORT}`);

  // Fired only after the server is already accepting traffic - Mongo's
  // availability must never delay or block the game from being served.
  initMongoConnection();
});

// Graceful shutdown: respond to SIGTERM/SIGINT (e.g. `podman stop`, Ctrl+C)
// immediately instead of forcing the container runtime to wait out its
// grace period and send SIGKILL.
function shutdown() {
  // eslint-disable-next-line no-console
  console.log('Shutting down Tower Defense server...');
  server.close(() => {
    closeMongoConnection().finally(() => process.exit(0));
  });
  // Safety net in case some connection never closes.
  setTimeout(() => process.exit(0), 3000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
