/**
 * pathUtils.js
 *
 * Small geometry helpers shared by GameScene / TowerSystem / Enemy for
 * working with the winding enemy path. Built on top of Phaser.Curves so
 * we lean on the engine instead of reimplementing curve math.
 */
import Phaser from 'phaser';

/**
 * Build a Phaser.Curves.Path made of straight line segments connecting
 * consecutive waypoints.
 * @param {{x:number,y:number}[]} waypoints
 * @returns {Phaser.Curves.Path}
 */
export function buildPath(waypoints) {
  const path = new Phaser.Curves.Path(waypoints[0].x, waypoints[0].y);
  for (let i = 1; i < waypoints.length; i += 1) {
    path.lineTo(waypoints[i].x, waypoints[i].y);
  }
  return path;
}

/**
 * Shortest distance from point (x, y) to the polyline described by
 * `waypoints`. Used both for tower placement validation (must stay far
 * enough from the path) and for filtering decorations away from the road.
 */
export function distanceToPath(x, y, waypoints) {
  let min = Infinity;
  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const d = distanceToSegment(x, y, a.x, a.y, b.x, b.y);
    if (d < min) min = d;
  }
  return min;
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const lengthSq = abx * abx + aby * aby;
  let t = lengthSq === 0 ? 0 : ((px - ax) * abx + (py - ay) * aby) / lengthSq;
  t = Phaser.Math.Clamp(t, 0, 1);
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  return Phaser.Math.Distance.Between(px, py, cx, cy);
}
