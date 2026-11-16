import { describe, expect, it } from 'vitest';
import { applyHit } from '../src/sim/damage';
import { CHASER } from '../src/data/enemies';
import { createSim as createSimulation, getPlayer, NO_INPUT, step } from '../src/sim/state';
import { distanceToRect, room, run } from './helpers';

const createSim: typeof createSimulation = (seed, room) => {
  const sim = createSimulation(seed, room);
  for (const e of sim.entities) if (e.ai) e.ai.cooldown = 10000;
  return sim;
};

const placement = (x: number, y: number) => ({ kind: 'chaser' as const, x, y });

describe('noticing and pursuit', () => {
  it('stays put for 600 steps until noticed, then pursues even beyond notice range', () => {
    const sim = createSim(1, room([], { x: 100, y: 500 }, [], [placement(800, 500)]));
    const e = sim.entities[1];
    run(sim, NO_INPUT, 600);
    expect(e.pos).toEqual({ x: 800, y: 500 });
    expect(e.ai?.state.kind).toBe('idle');
    getPlayer(sim).pos.x = 500;
    step(sim, NO_INPUT);
    expect(e.pos.x).toBeLessThan(800);
    getPlayer(sim).pos.x = 100;
    const before = e.pos.x;
    step(sim, NO_INPUT);
    expect(e.pos.x).toBeLessThan(before);
    expect(e.ai?.state.kind).toBe('pursue');
  });

  it('closes by one second of configured speed in 60 steps and faces the player', () => {
    const sim = createSim(1, room([], { x: 600, y: 500 }, [], [placement(300, 500)]));
    run(sim, NO_INPUT, 60);
    expect(sim.entities[1].pos.x).toBeCloseTo(300 + CHASER.speed);
    expect(sim.entities[1].facing).toBe(0);
  });

  it('stops at attack distance without moving a standing player', () => {
    const sim = createSim(1, room([], { x: 500, y: 500 }, [], [placement(200, 500)]));
    run(sim, NO_INPUT, 150);
    expect(sim.entities[1].pos.x).toBeCloseTo(500 - CHASER.attackDistance);
    expect(getPlayer(sim).pos).toEqual({ x: 500, y: 500 });
  });
});

describe('steering around convex walls', () => {
  it.each([
    [{ x: 450, y: 450, w: 100, h: 100 }, 600],
    [{ x: 350, y: 470, w: 300, h: 60 }, 900],
  ] as const)('reaches the player around %o within %i steps', (wall, limit) => {
    const sim = createSim(1, room([wall], { x: 500, y: 700 }, [], [placement(500, 300)]));
    const e = sim.entities[1];
    let arrived = false;
    for (let i = 0; i < limit; i++) {
      step(sim, NO_INPUT);
      expect(distanceToRect(e.pos, wall)).toBeGreaterThanOrEqual(e.radius - 1e-6);
      if (Math.hypot(e.pos.x - 500, e.pos.y - 700) <= CHASER.attackDistance + 1e-6) { arrived = true; break; }
    }
    expect(arrived).toBe(true);
  });
});

describe('enemy separation', () => {
  it('settles two converging chasers without overlap or pushing the player', () => {
    const sim = createSim(1, room([], undefined, [], [placement(200, 480), placement(200, 520)]));
    run(sim, NO_INPUT, 240);
    const [a, b] = sim.entities.slice(1);
    expect(Math.hypot(a.pos.x - b.pos.x, a.pos.y - b.pos.y)).toBeGreaterThanOrEqual(a.radius + b.radius - 1e-6);
    expect(getPlayer(sim).pos).toEqual({ x: 500, y: 500 });
  });
  it('does not move or overlap a dummy in the path', () => {
    const sim = createSim(1, room([], undefined, [{ x: 350, y: 500 }], [placement(200, 500)]));
    const dummy = sim.entities[1], e = sim.entities[2];
    for (let i = 0; i < 240; i++) {
      step(sim, NO_INPUT);
      expect(dummy.pos).toEqual({ x: 350, y: 500 });
      expect(Math.hypot(e.pos.x - dummy.pos.x, e.pos.y - dummy.pos.y)).toBeGreaterThanOrEqual(e.radius + dummy.radius - 1e-6);
    }
  });
});

it('restores a defeated chaser at home with full health, no hitstop, and idle AI', () => {
  const sim = createSim(1, room([], { x: 100, y: 500 }, [], [placement(800, 500)]));
  const e = sim.entities[1];
  e.ai!.state = { kind: 'pursue' };
  e.pos.x -= 10;
  applyHit(sim, getPlayer(sim).pos, e.id, { damage: CHASER.health, knockback: 0, hitstop: 0 });
  run(sim, NO_INPUT, CHASER.respawnDelay - 1);
  expect(e.defeated).toBe(true);
  step(sim, NO_INPUT);
  expect(e.defeated).toBe(false);
  expect(e.pos).toEqual({ x: 800, y: 500 });
  expect(e.health).toBe(CHASER.health);
  expect(e.hitstop).toBe(0);
  expect(e.ai?.state.kind).toBe('idle');
  run(sim, NO_INPUT, 10);
  expect(e.ai?.state.kind).toBe('idle');
});
