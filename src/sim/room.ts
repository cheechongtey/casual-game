import type { Rect, Room, Vec2 } from '../data/room';
import { TUNING } from '../data/tuning';

export class RoomError extends Error {
  constructor(roomId: string, problem: string) {
    super(`Room "${roomId}": ${problem}`);
    this.name = 'RoomError';
  }
}

/** True when a circle overlaps a rectangle (touching does not count). */
export function circleOverlapsRect(center: Vec2, radius: number, rect: Rect): boolean {
  const cx = Math.min(Math.max(center.x, rect.x), rect.x + rect.w);
  const cy = Math.min(Math.max(center.y, rect.y), rect.y + rect.h);
  const dx = center.x - cx;
  const dy = center.y - cy;
  return dx * dx + dy * dy < radius * radius;
}

/**
 * Validates a room definition and returns an independent copy of it.
 * Throws a RoomError naming the offending wall, the spawn point, or the
 * dummy placement.
 */
export function loadRoom(
  room: Room,
  playerRadius: number = TUNING.playerRadius,
  dummyRadius: number = TUNING.dummyRadius,
): Room {
  if (!(room.width > 0) || !(room.height > 0)) {
    throw new RoomError(room.id, `bounds must have positive size, got ${room.width} x ${room.height}`);
  }

  room.walls.forEach((wall, i) => {
    if (!(wall.w > 0) || !(wall.h > 0)) {
      throw new RoomError(room.id, `wall ${i} must have positive size, got ${wall.w} x ${wall.h}`);
    }
    if (wall.x < 0 || wall.y < 0 || wall.x + wall.w > room.width || wall.y + wall.h > room.height) {
      throw new RoomError(room.id, `wall ${i} extends outside the room bounds`);
    }
  });

  const { x, y } = room.spawn;
  const where = `spawn point (${x}, ${y})`;
  if (x < playerRadius || y < playerRadius || x > room.width - playerRadius || y > room.height - playerRadius) {
    throw new RoomError(room.id, `${where} leaves the player overlapping the room edge`);
  }
  room.walls.forEach((wall, i) => {
    if (circleOverlapsRect(room.spawn, playerRadius, wall)) {
      throw new RoomError(room.id, `${where} leaves the player overlapping wall ${i}`);
    }
  });

  room.dummies.forEach((p, i) => {
    const dummy = `dummy ${i} at (${p.x}, ${p.y})`;
    if (p.x < dummyRadius || p.y < dummyRadius || p.x > room.width - dummyRadius || p.y > room.height - dummyRadius) {
      throw new RoomError(room.id, `${dummy} overlaps the room edge`);
    }
    room.walls.forEach((wall, w) => {
      if (circleOverlapsRect(p, dummyRadius, wall)) {
        throw new RoomError(room.id, `${dummy} overlaps wall ${w}`);
      }
    });
    if (Math.hypot(p.x - x, p.y - y) < dummyRadius + playerRadius) {
      throw new RoomError(room.id, `${dummy} overlaps the player at the spawn point`);
    }
    for (let j = 0; j < i; j++) {
      const q = room.dummies[j];
      if (Math.hypot(p.x - q.x, p.y - q.y) < dummyRadius * 2) {
        throw new RoomError(room.id, `${dummy} overlaps dummy ${j}`);
      }
    }
  });

  return {
    id: room.id,
    width: room.width,
    height: room.height,
    walls: room.walls.map((w) => ({ ...w })),
    spawn: { ...room.spawn },
    dummies: room.dummies.map((p) => ({ ...p })),
  };
}
