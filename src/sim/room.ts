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
 * Throws a RoomError naming the offending wall or the spawn point.
 */
export function loadRoom(room: Room, playerRadius: number = TUNING.playerRadius): Room {
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

  return {
    id: room.id,
    width: room.width,
    height: room.height,
    walls: room.walls.map((w) => ({ ...w })),
    spawn: { ...room.spawn },
  };
}
