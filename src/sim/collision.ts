import type { Room, Vec2 } from '../data/room';

const MAX_PASSES = 3;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Moves a circle out of every wall it overlaps and keeps it inside the room.
 * Pushing out along the shortest vector is what produces sliding along walls
 * and rounding of outer corners. Mutates `pos`.
 */
export function resolveCircle(pos: Vec2, radius: number, room: Room): void {
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let moved = false;

    for (const wall of room.walls) {
      const cx = clamp(pos.x, wall.x, wall.x + wall.w);
      const cy = clamp(pos.y, wall.y, wall.y + wall.h);
      const dx = pos.x - cx;
      const dy = pos.y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 >= radius * radius) continue;

      if (d2 > 0) {
        const d = Math.sqrt(d2);
        const push = radius - d;
        pos.x += (dx / d) * push;
        pos.y += (dy / d) * push;
      } else {
        // Center is inside the wall: leave through the nearest face.
        const left = pos.x - wall.x;
        const right = wall.x + wall.w - pos.x;
        const top = pos.y - wall.y;
        const bottom = wall.y + wall.h - pos.y;
        const min = Math.min(left, right, top, bottom);
        if (min === left) pos.x = wall.x - radius;
        else if (min === right) pos.x = wall.x + wall.w + radius;
        else if (min === top) pos.y = wall.y - radius;
        else pos.y = wall.y + wall.h + radius;
      }
      moved = true;
    }

    const bx = clamp(pos.x, radius, room.width - radius);
    const by = clamp(pos.y, radius, room.height - radius);
    if (bx !== pos.x || by !== pos.y) {
      pos.x = bx;
      pos.y = by;
      moved = true;
    }

    if (!moved) break;
  }
}

/**
 * Moves a circle by (dx, dy) in segments no longer than half its radius,
 * resolving walls after each. The resolver is only correct while a circle
 * has not crossed the middle of a wall in one move, so fast movement must
 * go through here. Mutates `pos`.
 */
export function moveCircle(pos: Vec2, dx: number, dy: number, radius: number, room: Room): void {
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return;
  const segments = Math.max(1, Math.ceil(dist / (radius / 2)));
  const sx = dx / segments;
  const sy = dy / segments;
  for (let i = 0; i < segments; i++) {
    pos.x += sx;
    pos.y += sy;
    resolveCircle(pos, radius, room);
  }
}
