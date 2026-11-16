import { describe, expect, it } from 'vitest';
import type { Rect } from '../src/data/room';
import { TUNING } from '../src/data/tuning';
import { createRng, nextFloat } from '../src/sim/rng';
import { createSim, getPlayer, step, type InputIntent, type SimState } from '../src/sim/state';
import { distanceToRect, intent, room, run } from './helpers';

const R = TUNING.playerRadius;
const EPS = 1e-6;

describe('movement', () => {
  it('covers one second of move speed in 60 steps', () => {
    const sim = createSim(1, room());
    run(sim, intent({ moveX: 1, moveY: 0, aim: 0 }), 60);
    expect(getPlayer(sim).pos.x - 500).toBeCloseTo(TUNING.moveSpeed, 6);
    expect(getPlayer(sim).pos.y).toBe(500);
  });

  it('is not faster on the diagonal', () => {
    const sim = createSim(1, room());
    run(sim, intent({ moveX: 1, moveY: -1, aim: 0 }), 60);
    const p = getPlayer(sim).pos;
    expect(Math.hypot(p.x - 500, p.y - 500)).toBeCloseTo(TUNING.moveSpeed, 6);
  });

  it('does not move on zero intent', () => {
    const sim = createSim(1, room());
    run(sim, intent({ moveX: 1, moveY: 0, aim: 0 }), 10);
    const before = { ...getPlayer(sim).pos };
    step(sim, intent({ moveX: 0, moveY: 0, aim: 0 }));
    expect(getPlayer(sim).pos).toEqual(before);
  });

  it('faces the aim angle regardless of move direction', () => {
    const sim = createSim(1, room());
    const startX = getPlayer(sim).pos.x;
    step(sim, intent({ moveX: -1, moveY: 0, aim: 0 }));
    expect(getPlayer(sim).pos.x).toBeLessThan(startX);
    expect(getPlayer(sim).facing).toBe(0);
    step(sim, intent({ moveX: -1, moveY: 0, aim: 1.25 }));
    expect(getPlayer(sim).facing).toBe(1.25);
  });
});

describe('collision', () => {
  const wall: Rect = { x: 600, y: 300, w: 100, h: 400 };

  it('stops the circle touching a wall without overlap', () => {
    const sim = createSim(1, room([wall]));
    run(sim, intent({ moveX: 1, moveY: 0, aim: 0 }), 120);
    const p = getPlayer(sim).pos;
    expect(p.x).toBeCloseTo(wall.x - R, 6);
    expect(distanceToRect(p, wall)).toBeGreaterThanOrEqual(R - EPS);
  });

  it('keeps the circle inside the room at every edge', () => {
    const directions = [
      { moveX: 1, moveY: 0 },
      { moveX: -1, moveY: 0 },
      { moveX: 0, moveY: 1 },
      { moveX: 0, moveY: -1 },
      { moveX: 1, moveY: 1 },
    ];
    for (const d of directions) {
      const sim = createSim(1, room());
      run(sim, intent(d), 600);
      const p = getPlayer(sim).pos;
      expect(p.x).toBeGreaterThanOrEqual(R);
      expect(p.x).toBeLessThanOrEqual(1000 - R);
      expect(p.y).toBeGreaterThanOrEqual(R);
      expect(p.y).toBeLessThanOrEqual(1000 - R);
    }
  });

  it('slides along a wall, keeping the parallel component', () => {
    const sim = createSim(1, room([wall], { x: wall.x - R, y: 600 }));
    const startY = getPlayer(sim).pos.y;
    run(sim, intent({ moveX: 1, moveY: -1, aim: 0 }), 30);
    const p = getPlayer(sim).pos;
    expect(p.x).toBeCloseTo(wall.x - R, 6);
    // Upward travel equals the diagonal's vertical share of the move speed.
    expect(startY - p.y).toBeCloseTo((TUNING.moveSpeed * Math.SQRT1_2) / 2, 6);
  });

  it('rounds an outer corner without stopping or overlapping', () => {
    // Start below-left of the wall's lower-left corner, clipping it on the way up-right.
    const pillar: Rect = { x: 500, y: 400, w: 100, h: 100 };
    const sim = createSim(1, room([pillar], { x: 490, y: 540 }));
    let last = { ...getPlayer(sim).pos };
    for (let i = 0; i < 40; i++) {
      step(sim, intent({ moveX: 1, moveY: -1, aim: 0 }));
      const p = getPlayer(sim).pos;
      expect(distanceToRect(p, pillar)).toBeGreaterThanOrEqual(R - EPS);
      expect(Math.hypot(p.x - last.x, p.y - last.y)).toBeGreaterThan(0.5);
      last = { ...p };
    }
  });

  it('never overlaps a wall under random input', () => {
    const walls: Rect[] = [
      { x: 300, y: 300, w: 100, h: 100 },
      { x: 400, y: 380, w: 200, h: 40 },
      { x: 700, y: 100, w: 40, h: 600 },
    ];
    const sim = createSim(1, room(walls, { x: 500, y: 600 }));
    const rng = createRng(99);
    let input: InputIntent = intent();
    for (let i = 0; i < 5000; i++) {
      if (i % 20 === 0) {
        input = intent({ moveX: nextFloat(rng) * 2 - 1, moveY: nextFloat(rng) * 2 - 1 });
      }
      step(sim, input);
      const p = getPlayer(sim).pos;
      for (const w of walls) expect(distanceToRect(p, w)).toBeGreaterThanOrEqual(R - EPS);
    }
  });
});

describe('determinism', () => {
  function recordedRun(): SimState {
    const walls: Rect[] = [
      { x: 300, y: 300, w: 100, h: 100 },
      { x: 600, y: 200, w: 60, h: 500 },
    ];
    const sim = createSim(1234, room(walls));
    const inputs = createRng(5);
    for (let i = 0; i < 600; i++) {
      step(
        sim,
        intent({
          moveX: nextFloat(inputs) * 2 - 1,
          moveY: nextFloat(inputs) * 2 - 1,
          aim: nextFloat(inputs) * Math.PI * 2 - Math.PI,
        }),
      );
    }
    return sim;
  }

  it('produces identical state from the same seed, room, and 600 intents', () => {
    const a = recordedRun();
    const b = recordedRun();
    expect(a.tick).toBe(600);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
