/**
 * textureGenerator.js
 *
 * The MVP "asset system". Instead of loading external art, we procedurally
 * draw every sprite once (with Phaser.GameObjects.Graphics) and bake it
 * into a reusable texture via `generateTexture`. Every entity then just
 * uses `scene.add.image/sprite(x, y, textureKey)` like it would with real
 * artwork.
 *
 * To swap in real sprite sheets later: replace the body of
 * `generatePlaceholderTextures` with `scene.load.image/spritesheet(...)`
 * calls in PreloadScene's `preload()` using the *same* texture keys
 * exported below - no entity code needs to change.
 */
import { ENEMY_TYPES } from '../config/enemies.js';
import { TOWER_TYPES, TOWER_ORDER } from '../config/towers.js';

// Guard key used to detect whether textures were already generated
// (relevant because restarting the game re-runs PreloadScene, but the
// Phaser TextureManager instance is shared across scene restarts).
const GUARD_KEY = 'placeholder_textures_ready';

export function textureKeys() {
  return {
    enemy: (type) => `enemy_${type}`,
    towerBase: (type) => `tower_${type}_base`,
    towerBarrel: (type) => `tower_${type}_barrel`,
    projectile: {
      bullet: 'projectile_bullet',
      shell: 'projectile_shell',
      tracer: 'projectile_tracer',
    },
    particle: {
      spark: 'particle_spark',
      smoke: 'particle_smoke',
      debris: 'particle_debris',
    },
    decoration: {
      tree: 'deco_tree',
      rock: 'deco_rock',
    },
    baseKeep: 'base_keep',
    spawnMarker: 'spawn_marker',
    placementRing: 'placement_ring',
  };
}

export function generatePlaceholderTextures(scene) {
  if (scene.textures.exists(GUARD_KEY)) return;

  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  Object.keys(ENEMY_TYPES).forEach((type) => {
    drawEnemyTexture(g, ENEMY_TYPES[type], type);
  });

  TOWER_ORDER.forEach((type) => {
    drawTowerTextures(g, TOWER_TYPES[type], type);
  });

  drawRectTexture(g, 'projectile_bullet', 9, 4, 0xfff59d);
  drawRectTexture(g, 'projectile_shell', 15, 15, 0x4e342e, true);
  drawRectTexture(g, 'projectile_tracer', 22, 3, 0xf3e5f5);

  drawCircleTexture(g, 'particle_spark', 5, 0xffee58);
  drawCircleTexture(g, 'particle_smoke', 9, 0xb0bec5);
  drawCircleTexture(g, 'particle_debris', 4, 0x8d6e63);

  drawTreeTexture(g);
  drawRockTexture(g);
  drawBaseKeepTexture(g);
  drawSpawnMarkerTexture(g);

  // 1x1 marker so future calls can detect textures already exist.
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 0, 1, 1);
  g.generateTexture(GUARD_KEY, 1, 1);

  g.destroy();
}

function drawEnemyTexture(g, cfg, type) {
  const size = cfg.radius * 2 + 8;
  const c = size / 2;
  g.clear();
  g.fillStyle(cfg.color, 1);
  g.fillCircle(c, c, cfg.radius);
  g.lineStyle(3, cfg.outlineColor, 1);
  g.strokeCircle(c, c, cfg.radius);
  g.fillStyle(0xffffff, 0.35);
  g.fillCircle(c - cfg.radius * 0.32, c - cfg.radius * 0.32, cfg.radius * 0.34);
  g.generateTexture(`enemy_${type}`, size, size);
}

function drawTowerTextures(g, cfg, type) {
  const baseRadius = 25;
  const baseSize = baseRadius * 2 + 6;
  const c = baseSize / 2;

  g.clear();
  g.fillStyle(0x5d5d5d, 1);
  g.fillCircle(c, c, baseRadius);
  g.lineStyle(3, 0x262626, 1);
  g.strokeCircle(c, c, baseRadius);
  g.fillStyle(cfg.color, 1);
  g.fillCircle(c, c, baseRadius * 0.7);
  g.lineStyle(2, 0x000000, 0.25);
  g.strokeCircle(c, c, baseRadius * 0.7);
  g.generateTexture(`tower_${type}_base`, baseSize, baseSize);

  const barrelLength = type === 'sniper' ? 48 : type === 'cannon' ? 38 : 34;
  const barrelHeight = type === 'cannon' ? 17 : 9;
  g.clear();
  g.fillStyle(cfg.barrelColor, 1);
  g.fillRoundedRect(0, 0, barrelLength, barrelHeight, 3);
  g.lineStyle(1, 0x000000, 0.3);
  g.strokeRoundedRect(0, 0, barrelLength, barrelHeight, 3);
  g.generateTexture(`tower_${type}_barrel`, barrelLength, barrelHeight);
}

function drawRectTexture(g, key, w, h, color, round = false) {
  g.clear();
  g.fillStyle(color, 1);
  if (round) {
    g.fillCircle(w / 2, h / 2, Math.min(w, h) / 2);
  } else {
    g.fillRoundedRect(0, 0, w, h, Math.min(w, h) / 2.5);
  }
  g.generateTexture(key, w, h);
}

function drawCircleTexture(g, key, radius, color) {
  const size = radius * 2;
  g.clear();
  g.fillStyle(color, 1);
  g.fillCircle(radius, radius, radius);
  g.generateTexture(key, size, size);
}

function drawTreeTexture(g) {
  const w = 40;
  const h = 56;
  g.clear();
  g.fillStyle(0x6d4c33, 1);
  g.fillRect(w / 2 - 4, h - 20, 8, 20);
  g.fillStyle(0x2e7d32, 1);
  g.fillCircle(w / 2, h - 34, 17);
  g.fillStyle(0x388e3c, 1);
  g.fillCircle(w / 2 - 9, h - 27, 11);
  g.fillCircle(w / 2 + 10, h - 25, 10);
  g.generateTexture('deco_tree', w, h);
}

function drawRockTexture(g) {
  const w = 30;
  const h = 22;
  g.clear();
  g.fillStyle(0x9e9e9e, 1);
  g.beginPath();
  g.moveTo(4, h);
  g.lineTo(1, h * 0.5);
  g.lineTo(10, 2);
  g.lineTo(w * 0.62, 0);
  g.lineTo(w - 1, h * 0.42);
  g.lineTo(w - 4, h);
  g.closePath();
  g.fillPath();
  g.lineStyle(2, 0x616161, 1);
  g.strokePath();
  g.generateTexture('deco_rock', w, h);
}

function drawBaseKeepTexture(g) {
  const w = 96;
  const h = 96;
  g.clear();
  g.fillStyle(0x8d6e63, 1);
  g.fillRoundedRect(4, 24, w - 8, h - 28, 8);
  g.lineStyle(3, 0x4e342e, 1);
  g.strokeRoundedRect(4, 24, w - 8, h - 28, 8);
  g.fillStyle(0xc62828, 1);
  g.fillTriangle(w / 2, 0, 6, 32, w - 6, 32);
  g.fillStyle(0x3e2723, 1);
  g.fillRect(w / 2 - 11, h - 30, 22, 26);
  g.fillStyle(0x9e9e9e, 1);
  g.fillRect(w / 2 - 1, 0, 2, 16);
  g.fillStyle(0xffca28, 1);
  g.fillTriangle(w / 2 + 1, 0, w / 2 + 1, 11, w / 2 + 18, 5);
  g.generateTexture('base_keep', w, h);
}

function drawSpawnMarkerTexture(g) {
  const size = 74;
  const c = size / 2;
  g.clear();
  g.fillStyle(0x1b1b2f, 0.4);
  g.fillCircle(c, c, c - 4);
  g.lineStyle(4, 0xff5252, 0.9);
  g.strokeCircle(c, c, c - 6);
  g.lineStyle(2, 0xff8a80, 0.7);
  g.strokeCircle(c, c, c - 15);
  g.generateTexture('spawn_marker', size, size);
}
