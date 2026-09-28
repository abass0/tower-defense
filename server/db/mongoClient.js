/**
 * mongoClient.js
 *
 * The ONLY file in this codebase that imports the `mongodb` driver.
 * Route handlers and repositories never touch it directly - they read
 * `getDb()` / `isReady()` from here. Owns the entire connection
 * lifecycle:
 *
 *   - connects asynchronously, AFTER the HTTP server is already
 *     accepting traffic (see server.js) - Mongo's availability must
 *     never gate whether the game itself can be served
 *   - retries on a fixed backoff if the connection fails or drops
 *   - exposes a simple status any route can check before querying
 *
 * This is what makes "degrade gracefully" possible: nothing here ever
 * throws in a way that could crash the process or block startup.
 */
import { MongoClient } from 'mongodb';
import config from '../config.js';

const RETRY_DELAY_MS = 5000;

let client = null;
let db = null;
/** @type {'disabled' | 'connecting' | 'connected' | 'unavailable'} */
let status = 'disabled';

function log(...args) {
  // eslint-disable-next-line no-console
  console.log('[mongo]', ...args);
}

export function getStatus() {
  return status;
}

export function getDb() {
  return db;
}

export function isReady() {
  return status === 'connected' && db != null;
}

function scheduleRetry() {
  setTimeout(attemptConnect, RETRY_DELAY_MS).unref();
}

async function ensureIndexes() {
  try {
    await db.collection('matches').createIndex({ score: -1 });
  } catch (err) {
    log(`failed to ensure indexes (${err.message})`);
  }
}

async function attemptConnect() {
  status = 'connecting';
  try {
    client = new MongoClient(config.mongo.uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    db = client.db(config.mongo.database);
    status = 'connected';
    log(`connected (database "${config.mongo.database}")`);
    await ensureIndexes();

    client.on('close', () => {
      if (status === 'connected') {
        status = 'unavailable';
        db = null;
        log('connection closed unexpectedly, retrying...');
        scheduleRetry();
      }
    });
  } catch (err) {
    status = 'unavailable';
    db = null;
    log(`connection failed (${err.message}), retrying in ${RETRY_DELAY_MS}ms`);
    scheduleRetry();
  }
}

/**
 * Called once at server boot, from server.js, AFTER app.listen(). Not
 * awaited by the caller on purpose - connecting (or failing to) happens
 * in the background.
 */
export function initMongoConnection() {
  if (!config.mongo.enabled) {
    status = 'disabled';
    log('disabled via MONGODB_ENABLED=false');
    return;
  }
  attemptConnect();
}

export async function closeMongoConnection() {
  if (client) {
    await client.close().catch(() => {});
  }
}
