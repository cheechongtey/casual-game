import type { Room } from '../room';

/** The single hand-authored room. */
export const startRoom: Room = {
  id: 'start',
  width: 2000,
  height: 1600,
  spawn: { x: 1000, y: 800 },
  // Training dummies beside the spawn point, so combat can be tuned at once.
  dummies: [
    { x: 1150, y: 740 },
    { x: 1150, y: 880 },
    { x: 850, y: 800 },
  ],
  walls: [
    // Four pillars around the spawn point.
    { x: 700, y: 500, w: 100, h: 100 },
    { x: 1200, y: 500, w: 100, h: 100 },
    { x: 700, y: 1000, w: 100, h: 100 },
    { x: 1200, y: 1000, w: 100, h: 100 },
    // A long wall to slide along, and one to hide behind.
    { x: 300, y: 250, w: 600, h: 60 },
    { x: 1500, y: 600, w: 60, h: 500 },
    // An L-shaped corner near the lower left.
    { x: 250, y: 1200, w: 300, h: 60 },
    { x: 250, y: 1260, w: 60, h: 200 },
  ],
};
