import type { Vec2 } from '../data/room';

/** A circular sector on the ground: the hit area of a melee attack. */
export interface Sector {
  apex: Vec2;
  /** Center direction in radians from +x. */
  dir: number;
  range: number;
  /** Half the opening angle, in radians. */
  halfAngle: number;
  /** Unit vector along `dir`. */
  ux: number;
  uy: number;
  cosHalf: number;
  /** Unit vectors along the two straight edges. */
  edgeA: Vec2;
  edgeB: Vec2;
}

export function makeSector(apex: Vec2, dir: number, range: number, angle: number): Sector {
  const halfAngle = angle / 2;
  return {
    apex: { x: apex.x, y: apex.y },
    dir,
    range,
    halfAngle,
    ux: Math.cos(dir),
    uy: Math.sin(dir),
    cosHalf: Math.cos(halfAngle),
    edgeA: { x: Math.cos(dir - halfAngle), y: Math.sin(dir - halfAngle) },
    edgeB: { x: Math.cos(dir + halfAngle), y: Math.sin(dir + halfAngle) },
  };
}

function edgeWithin(s: Sector, edge: Vec2, cx: number, cy: number, r: number): boolean {
  const t = Math.min(Math.max(cx * edge.x + cy * edge.y, 0), s.range);
  const dx = cx - edge.x * t;
  const dy = cy - edge.y * t;
  return dx * dx + dy * dy <= r * r;
}

/** True when a circle overlaps the sector. Uses dot products, no angles. */
export function sectorHitsCircle(s: Sector, center: Vec2, radius: number): boolean {
  const cx = center.x - s.apex.x;
  const cy = center.y - s.apex.y;
  const d2 = cx * cx + cy * cy;
  const reach = s.range + radius;
  if (d2 > reach * reach) return false;
  if (d2 <= radius * radius) return true;
  const d = Math.sqrt(d2);
  if ((cx * s.ux + cy * s.uy) / d >= s.cosHalf) return true;
  return edgeWithin(s, s.edgeA, cx, cy, radius) || edgeWithin(s, s.edgeB, cx, cy, radius);
}
