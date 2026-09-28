/**
 * config.js
 *
 * The single place the server reads process.env. No other file should
 * touch process.env directly for Mongo-related settings - this mirrors
 * the config-centralization pattern already used on the frontend
 * (src/game/config/*.js): one file owns "where do these numbers/strings
 * come from," everything else just imports the result.
 *
 * MONGODB_URI takes precedence if set. Otherwise a URI is assembled from
 * the discrete MONGODB_HOST/PORT/DATABASE/USERNAME/PASSWORD variables -
 * supporting both shapes because different Secret/Operator conventions
 * expose one or the other.
 */

function buildMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

  const host = process.env.MONGODB_HOST || 'localhost';
  const port = process.env.MONGODB_PORT || '27017';
  const database = process.env.MONGODB_DATABASE || 'towerdefense';
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;

  const auth =
    username && password
      ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`
      : '';

  return `mongodb://${auth}${host}:${port}/${database}`;
}

const config = {
  port: process.env.PORT || 8080,
  host: '0.0.0.0',

  mongo: {
    // Explicit kill switch, independent of whether a URI happens to be
    // configured - lets the leaderboard be turned off on purpose even
    // when Mongo is technically reachable.
    enabled: process.env.MONGODB_ENABLED !== 'false',
    uri: buildMongoUri(),
    database: process.env.MONGODB_DATABASE || 'towerdefense',
  },

  leaderboardLimit: Number(process.env.LEADERBOARD_LIMIT) || 10,
};

export default config;
