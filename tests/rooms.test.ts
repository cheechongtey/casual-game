import { describe, expect, it } from 'vitest';
import type { Room } from '../src/data/room';
import { startRoom } from '../src/data/rooms/start';
import { loadRoom, RoomError } from '../src/sim/room';
import { TUNING } from '../src/data/tuning';
import { createSim, getPlayer, NO_INPUT, step } from '../src/sim/state';

const valid: Room = {
  id: 'test',
  width: 800,
  height: 600,
  walls: [{ x: 100, y: 100, w: 50, h: 50 }],
  spawn: { x: 200, y: 300 },
  enemies: [], dummies: [],
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

describe('dummy placements', () => {
  it('starts with at least two dummies near the spawn point', () => {
    const sim = createSim(1, startRoom);
    const dummies = sim.entities.filter((e) => e.kind === 'dummy');
    expect(dummies.length).toBeGreaterThanOrEqual(2);
    for (const d of dummies) {
      expect(Math.hypot(d.pos.x - startRoom.spawn.x, d.pos.y - startRoom.spawn.y)).toBeLessThan(250);
    }
  });

  it('rejects a dummy inside a wall and names the placement', () => {
    const room = { ...valid, dummies: [{ x: 400, y: 300 }, { x: 125, y: 125 }] };
    expect(() => loadRoom(room)).toThrow(/dummy 1 at \(125, 125\) overlaps wall 0/);
  });

  it('rejects a dummy overlapping the room edge and names the placement', () => {
    const room = { ...valid, dummies: [{ x: 790, y: 300 }] };
    expect(() => loadRoom(room)).toThrow(/dummy 0 at \(790, 300\) overlaps the room edge/);
  });

  it('rejects a dummy on the spawn point and names the placement', () => {
    const room = { ...valid, dummies: [{ x: 200, y: 300 }] };
    expect(() => loadRoom(room)).toThrow(/dummy 0 at \(200, 300\) overlaps the player at the spawn point/);
  });

  it('rejects a dummy overlapping another dummy and names the placement', () => {
    const room = { ...valid, dummies: [{ x: 400, y: 300 }, { x: 430, y: 300 }] };
    expect(() => loadRoom(room)).toThrow(/dummy 1 at \(430, 300\) overlaps dummy 0/);
  });

  it('creates one dummy at full health per placement', () => {
    const sim = createSim(1, { ...valid, width: 1000, dummies: [{ x: 300, y: 300 }, { x: 600, y: 300 }] });
    const dummies = sim.entities.filter((e) => e.kind === 'dummy');
    expect(dummies.map((d) => d.pos)).toEqual([{ x: 300, y: 300 }, { x: 600, y: 300 }]);
    for (const d of dummies) {
      expect(d.health).toBe(TUNING.dummyHealth);
      expect(d.maxHealth).toBe(TUNING.dummyHealth);
    }
  });

  it('creates no dummies for a room with no placements', () => {
    const sim = createSim(1, valid);
    expect(sim.entities.filter((e) => e.kind === 'dummy')).toEqual([]);
  });

  it('leaves a dummy where it stands with full health for 600 steps', () => {
    const sim = createSim(1, { ...valid, dummies: [{ x: 500, y: 300 }] });
    for (let i = 0; i < 600; i++) step(sim, NO_INPUT);
    const dummy = sim.entities.find((e) => e.kind === 'dummy')!;
    expect(dummy.pos).toEqual({ x: 500, y: 300 });
    expect(dummy.health).toBe(TUNING.dummyHealth);
  });
});

describe('enemy placements', () => {
  it.each([
    [{ x: 125, y: 125 }, /enemy 0.*wall/],
    [{ x: 2, y: 300 }, /enemy 0.*edge/],
    [{ x: 200, y: 300 }, /enemy 0.*spawn/],
    [{ x: 400, y: 300 }, /enemy 0.*dummy 0/],
  ] as const)('rejects an invalid enemy at %o', (pos, message) => {
    expect(() => loadRoom({ ...valid, dummies: [{ x: 400, y: 300 }], enemies: [{ kind: 'chaser', ...pos }] })).toThrow(message);
  });

  it('rejects overlapping enemies, naming the later placement', () => {
    expect(() => loadRoom({ ...valid, enemies: [
      { kind: 'chaser', x: 400, y: 300 }, { kind: 'chaser', x: 420, y: 300 },
    ] })).toThrow(/enemy 1.*enemy 0/);
  });

  it('copies enemy placements independently', () => {
    const source = { ...valid, enemies: [{ kind: 'chaser' as const, x: 400, y: 300 }] };
    const loaded = loadRoom(source);
    loaded.enemies[0].x += 1;
    expect(source.enemies[0].x).toBe(400);
  });
});

describe('enemy creation', () => {
  it('creates full-health, idle chasers at each placement', () => {
    const sim = createSim(1, { ...valid, enemies: [
      { kind: 'chaser', x: 300, y: 300 }, { kind: 'chaser', x: 600, y: 300 },
    ] });
    const enemies = sim.entities.filter(e => e.kind === 'chaser');
    expect(enemies.map(e => e.pos)).toEqual([{ x: 300, y: 300 }, { x: 600, y: 300 }]);
    for (const e of enemies) {
      expect(e.health).toBe(e.maxHealth);
      expect(e.ai?.state.kind).toBe('idle');
      expect(e.vel).toEqual({ x: 0, y: 0 });
    }
  });
  it('creates none for an empty list', () => {
    expect(createSim(1, valid).entities.some(e => e.kind === 'chaser')).toBe(false);
  });
});

it('loads a starting room with a nearby enemy group beyond notice range', () => {
  const sim = createSim(1, startRoom);
  const chasers = sim.entities.filter(e => e.kind === 'chaser');
  expect(chasers.length).toBeGreaterThanOrEqual(4);
  for (const e of chasers) expect(Math.hypot(e.pos.x - startRoom.spawn.x, e.pos.y - startRoom.spawn.y)).toBeGreaterThan(420);
  expect(chasers.filter(e => Math.hypot(e.pos.x - 1200, e.pos.y - 200) < 420).length).toBeGreaterThanOrEqual(3);
});
