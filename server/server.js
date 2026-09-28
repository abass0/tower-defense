/**
 * server.js
 *
 * Minimal Express server. Its only job for the MVP is serving the built
 * React/Vite bundle (`dist/`) and answering client-side routes with
 * `index.html` so the SPA can handle its own routing.
 *
 * Structured so future backend features have an obvious home:
 *   - player accounts / auth        -> app.use('/api/auth', ...)
 *   - saved games                   -> app.use('/api/saves', ...)
 *   - leaderboards                  -> app.use('/api/leaderboards', ...)
 *   - persistent progression        -> app.use('/api/progress', ...)
 *   - map APIs                      -> app.use('/api/maps', ...)
 *   - multiplayer / co-op           -> a websocket/Socket.IO layer here
 *
 * No database is introduced yet, per the MVP scope.
 */
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';
const DIST_DIR = path.join(__dirname, '..', 'dist');

app.disable('x-powered-by');

// Placeholder health/status endpoint - a stand-in for future API routes.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'tower-defense' });
});

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
});

// Graceful shutdown: respond to SIGTERM/SIGINT (e.g. `podman stop`, Ctrl+C)
// immediately instead of forcing the container runtime to wait out its
// grace period and send SIGKILL.
function shutdown() {
  // eslint-disable-next-line no-console
  console.log('Shutting down Tower Defense server...');
  server.close(() => process.exit(0));
  // Safety net in case some connection never closes.
  setTimeout(() => process.exit(0), 3000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
