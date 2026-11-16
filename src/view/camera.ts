import type { Rect } from '../data/room';

/**
 * Camera bounds in screen space for a projected room. On an axis where the
 * room is larger than the viewport the bounds equal the room, so nothing
 * outside it is shown. On an axis where it is smaller, the bounds are widened
 * symmetrically to the viewport size, which centers the room.
 */
export function cameraBounds(roomWidth: number, roomHeight: number, viewWidth: number, viewHeight: number): Rect {
  const w = Math.max(roomWidth, viewWidth);
  const h = Math.max(roomHeight, viewHeight);
  return { x: (roomWidth - w) / 2, y: (roomHeight - h) / 2, w, h };
}
