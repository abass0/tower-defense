/**
 * mapConfig.js
 *
 * Static description of the single MVP map: logical resolution, the
 * winding enemy path (as waypoints), the spawn/base locations, and a list
 * of decorative props. GameScene turns this data into an actual
 * Phaser.Curves.Path and draws the terrain from it - no HTML/CSS grid is
 * involved, this is all real game-world geometry.
 */

export const MAP_WIDTH = 1280;
export const MAP_HEIGHT = 720;

// Half-width of the visible dirt path. Also used as the base "no-build"
// buffer added to a tower's footprint when validating placement.
export const PATH_WIDTH = 74;

// Winding path from the spawn point (top-left) to the base (bottom-right).
// Enemies walk this as a Phaser.Curves.Path built from straight line
// segments between consecutive waypoints.
export const PATH_WAYPOINTS = [
  { x: 90, y: 70 },
  { x: 90, y: 230 },
  { x: 360, y: 230 },
  { x: 360, y: 410 },
  { x: 170, y: 410 },
  { x: 170, y: 570 },
  { x: 560, y: 570 },
  { x: 560, y: 300 },
  { x: 880, y: 300 },
  { x: 880, y: 630 },
  { x: 1170, y: 630 },
];

export const SPAWN_POINT = PATH_WAYPOINTS[0];
export const BASE_POINT = PATH_WAYPOINTS[PATH_WAYPOINTS.length - 1];

// Minimum distance a tower center must keep from the map edges.
export const MAP_MARGIN = 40;

// Minimum distance kept between two tower centers.
export const TOWER_MIN_SPACING = 56;

// Static decorative props (rocks / trees / grass tufts). Kept far enough
// from the path visually; GameScene additionally filters anything that
// would visually overlap the path buffer just in case.
export const DECORATIONS = [
  { type: 'tree', x: 220, y: 90 },
  { type: 'tree', x: 260, y: 130 },
  { type: 'rock', x: 500, y: 90 },
  { type: 'tree', x: 620, y: 120 },
  { type: 'tree', x: 700, y: 90 },
  { type: 'rock', x: 950, y: 110 },
  { type: 'tree', x: 1080, y: 90 },
  { type: 'tree', x: 1180, y: 160 },
  { type: 'rock', x: 240, y: 320 },
  { type: 'tree', x: 500, y: 200 },
  { type: 'tree', x: 540, y: 460 },
  { type: 'rock', x: 700, y: 470 },
  { type: 'tree', x: 750, y: 420 },
  { type: 'tree', x: 250, y: 500 },
  { type: 'rock', x: 90, y: 480 },
  { type: 'tree', x: 1000, y: 200 },
  { type: 'tree', x: 1050, y: 450 },
  { type: 'rock', x: 1150, y: 400 },
  { type: 'tree', x: 700, y: 650 },
  { type: 'tree', x: 400, y: 650 },
  { type: 'rock', x: 320, y: 620 },
  { type: 'tree', x: 950, y: 660 },
  { type: 'tree', x: 40, y: 650 },
  { type: 'rock', x: 780, y: 130 },
];
