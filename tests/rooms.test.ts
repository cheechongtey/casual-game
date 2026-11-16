import { describe, expect, it } from 'vitest';
import type { Room } from '../src/data/room';
import { startRoom } from '../src/data/rooms/start';
import { loadRoom, RoomError } from '../src/sim/room';
import { createSim, getPlayer } from '../src/sim/state';

const valid: Room = {
  id: 'test',
  width: 800,
  height: 600,
  walls: [{ x: 100, y: 100, w: 50, h: 50 }],
  spawn: { x: 200, y: 300 },
};

describe('room loading', () => {
  it('accepts a valid room', () => {
    expect(loadRoom(valid)).toEqual(valid);
  });

  it('accepts the starting room', () => {
    expect(() => loadRoom(startRoom)).not.toThrow();
  });

  it('rejects non-positive bounds', () => {
    expect(() => loadRoom({ ...valid, width: 0 })).toThrow(RoomError);
    expect(() => loadRoom({ ...valid, height: -10 })).toThrow(/bounds/);
  });

  it('rejects a wall outside the bounds and names it', () => {
    const room = { ...valid, walls: [...valid.walls, { x: 780, y: 10, w: 50, h: 50 }] };
    expect(() => loadRoom(room)).toThrow(/wall 1 extends outside/);
  });

  it('rejects a spawn point inside a wall and names the spawn point', () => {
    const room = { ...valid, spawn: { x: 120, y: 120 } };
    expect(() => loadRoom(room)).toThrow(/spawn point \(120, 120\).*wall 0/);
  });

  it('rejects a spawn point whose circle overlaps the room edge', () => {
    const room = { ...valid, spawn: { x: 5, y: 300 } };
    expect(() => loadRoom(room)).toThrow(/spawn point \(5, 300\).*room edge/);
  });

  it('does not share geometry with the definition it was loaded from', () => {
    const loaded = loadRoom(valid);
    loaded.walls[0].x = 999;
    expect(valid.walls[0].x).toBe(100);
  });
});

describe('entering a room', () => {
  it('places the player at the spawn point', () => {
    const sim = createSim(1, valid);
    expect(getPlayer(sim).pos).toEqual({ x: 200, y: 300 });
  });

  it('contains exactly the bounds and walls of the definition', () => {
    const sim = createSim(1, valid);
    expect(sim.room.width).toBe(800);
    expect(sim.room.height).toBe(600);
    expect(sim.room.walls).toEqual(valid.walls);
  });
});
