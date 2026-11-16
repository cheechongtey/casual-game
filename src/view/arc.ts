import type { Vec2 } from '../data/room';

/**
 * Ground points along the curved edge of a sector, from the edge at
 * `dir - angle / 2` to the edge at `dir + angle / 2`. Together with the apex
 * they outline the same sector the simulation hit-tests.
 */
export function arcPoints(apex: Vec2, dir: number, range: number, angle: number, segments = 16): Vec2[] {
  const start = dir - angle / 2;
  const points: Vec2[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = start + (angle * i) / segments;
    points.push({ x: apex.x + Math.cos(a) * range, y: apex.y + Math.sin(a) * range });
  }
  return points;
}
