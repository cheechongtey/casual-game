export interface Vec2 {
  x: number;
  y: number;
}

/** Axis-aligned rectangle on the ground. `x`,`y` is the corner nearest the origin. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A room described entirely by data, in world units. */
export interface Room {
  id: string;
  width: number;
  height: number;
  walls: Rect[];
  spawn: Vec2;
  /** Ground positions where training dummies stand. */
  dummies: Vec2[];
}
