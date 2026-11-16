import type { EnemyPlacement, Rect, Room, Vec2 } from '../src/data/room';
import { NO_INPUT, step, type InputIntent, type SimEvent, type SimState } from '../src/sim/state';

/** An intent with every field defaulted to no input. */
export function intent(fields: Partial<InputIntent> = {}): InputIntent {
  return { ...NO_INPUT, ...fields };
}

/** A 1000 x 1000 test room. */
export function room(walls: Rect[] = [], spawn: Vec2 = { x: 500, y: 500 }, dummies: Vec2[] = [], enemies: EnemyPlacement[] = []): Room {
  return { id: 'test', width: 1000, height: 1000, walls, spawn, dummies, enemies };
}

/** Steps the simulation with the same intent and returns all events. */
export function run(sim: SimState, input: InputIntent, steps: number): SimEvent[] {
  const events: SimEvent[] = [];
  for (let i = 0; i < steps; i++) events.push(...step(sim, input));
  return events;
}

/**
 * Runs `steps` steps, asking `input` for each step's intent by its 1-based
 * number. Returns each step's events, indexed by step number (index 0 unused).
 */
export function runEach(sim: SimState, steps: number, input: (n: number) => InputIntent): SimEvent[][] {
  const perStep: SimEvent[][] = [[]];
  for (let n = 1; n <= steps; n++) perStep.push(step(sim, input(n)));
  return perStep;
}

/** Step numbers at which an event of the given type occurred. */
export function stepsWith(perStep: SimEvent[][], type: SimEvent['type']): number[] {
  const out: number[] = [];
  perStep.forEach((events, n) => {
    if (events.some((e) => e.type === type)) out.push(n);
  });
  return out;
}

export function entity(sim: SimState, id: number) {
  const e = sim.entities.find((x) => x.id === id);
  if (!e) throw new Error(`no entity ${id}`);
  return e;
}

/** Distance from a point to the nearest point of a rectangle. */
export function distanceToRect(p: Vec2, r: Rect): number {
  const cx = Math.min(Math.max(p.x, r.x), r.x + r.w);
  const cy = Math.min(Math.max(p.y, r.y), r.y + r.h);
  return Math.hypot(p.x - cx, p.y - cy);
}
