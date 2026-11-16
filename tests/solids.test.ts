import { describe, expect, it } from 'vitest';
import type { Rect } from '../src/data/room';
import { TUNING } from '../src/data/tuning';
import { applyHit } from '../src/sim/damage';
import { createRng, nextFloat } from '../src/sim/rng';
import { createSim, getPlayer, NO_INPUT, step, type SimEvent, type SimState } from '../src/sim/state';
import { distanceToRect, entity, intent, room, run } from './helpers';

const R = TUNING.playerRadius;
const DR = TUNING.dummyRadius;
const TOUCH = R + DR;
const EPS = 1e-6;
const DUMMY = 2;

function gap(sim: SimState, id = DUMMY): number {
  const p = getPlayer(sim).pos;
  const d = entity(sim, id).pos;
  return Math.hypot(p.x - d.x, p.y - d.y);
}

describe('solid entities block the player', () => {
  it('stops the player touching a dummy it walks into, without moving the dummy', () => {
    const sim = createSim(1, room([], { x: 500, y: 500 }, [{ x: 600, y: 500 }]));
    for (let i = 0; i < 120; i++) {
      step(sim, intent({ moveX: 1 }));
      expect(gap(sim)).toBeGreaterThanOrEqual(TOUCH - EPS);
    }
    expect(gap(sim)).toBeCloseTo(TOUCH, 6);
    expect(entity(sim, DUMMY).pos).toEqual({ x: 600, y: 500 });
  });

  it('slides around a dummy approached off-center', () => {
    const sim = createSim(1, room([], { x: 500, y: 500 }, [{ x: 600, y: 510 }]));
    let last = { ...getPlayer(sim).pos };
    for (let i = 0; i < 80; i++) {
      step(sim, intent({ moveX: 1 }));
      const p = getPlayer(sim).pos;
      expect(gap(sim)).toBeGreaterThanOrEqual(TOUCH - EPS);
      expect(Math.hypot(p.x - last.x, p.y - last.y)).toBeGreaterThan(0.5);
      last = { ...p };
    }
    expect(getPlayer(sim).pos.x).toBeGreaterThan(600 + TOUCH);
  });

  it('keeps the player clear of both a dummy and a wall it is pressed between', () => {
    const wall: Rect = { x: 600, y: 300, w: 100, h: 400 };
    const sim = createSim(1, room([wall], { x: 500, y: 430 }, [{ x: wall.x - DR, y: 500 }]));
    for (let i = 0; i < 200; i++) {
      step(sim, intent({ moveX: 1, moveY: 1 }));
      expect(distanceToRect(getPlayer(sim).pos, wall)).toBeGreaterThanOrEqual(R - EPS);
      expect(gap(sim)).toBeGreaterThanOrEqual(TOUCH - EPS);
    }
    expect(entity(sim, DUMMY).pos).toEqual({ x: wall.x - DR, y: 500 });
  });
});

describe('dashing through entities', () => {
  it('passes through a dummy and ends on the far side', () => {
    const sim = createSim(1, room([], { x: 500, y: 500 }, [{ x: 600, y: 500 }]));
    step(sim, intent({ dash: true, moveX: 1 }));
    run(sim, NO_INPUT, TUNING.dashDuration);
    expect(getPlayer(sim).pos.x).toBeCloseTo(500 + TUNING.dashDistance, 9);
    expect(getPlayer(sim).pos.x).toBeGreaterThan(600 + TOUCH);
  });

  it('moves the player out of a dummy it ends a dash inside', () => {
    const sim = createSim(1, room([], { x: 500, y: 500 }, [{ x: 660, y: 500 }]));
    step(sim, intent({ dash: true, moveX: 1 }));
    run(sim, NO_INPUT, TUNING.dashDuration - 1);
    expect(sim.player.action.kind).toBe('dash');
    expect(gap(sim)).toBeLessThan(TOUCH);
    step(sim, NO_INPUT);
    expect(sim.player.action.kind).toBe('idle');
    expect(gap(sim)).toBeGreaterThanOrEqual(TOUCH - EPS);
    expect(entity(sim, DUMMY).pos).toEqual({ x: 660, y: 500 });
  });
});

describe('dummy respawn', () => {
  const finish = { damage: TUNING.dummyHealth, knockback: 0, hitstop: 0 };

  it('reappears at its placement with full health after the respawn delay', () => {
    const sim = createSim(1, room([], { x: 300, y: 300 }, [{ x: 600, y: 500 }]));
    applyHit(sim, { x: 500, y: 500 }, DUMMY, { damage: 20, knockback: 380, hitstop: 0 });
    run(sim, NO_INPUT, 30);
    expect(entity(sim, DUMMY).pos.x).toBeGreaterThan(600);
    applyHit(sim, { x: 500, y: 500 }, DUMMY, finish);
    expect(entity(sim, DUMMY).defeated).toBe(true);

    run(sim, NO_INPUT, TUNING.dummyRespawn - 1);
    expect(entity(sim, DUMMY).defeated).toBe(true);
    step(sim, NO_INPUT);
    const d = entity(sim, DUMMY);
    expect(d.defeated).toBe(false);
    expect(d.pos).toEqual({ x: 600, y: 500 });
    expect(d.health).toBe(d.maxHealth);

    applyHit(sim, { x: 500, y: 500 }, DUMMY, { damage: 20, knockback: 0, hitstop: 0 });
    expect(d.health).toBe(d.maxHealth - 20);
  });

  it('moves the player out when it reappears under the player', () => {
    const sim = createSim(1, room([], { x: 300, y: 300 }, [{ x: 600, y: 500 }]));
    applyHit(sim, { x: 500, y: 500 }, DUMMY, finish);
    getPlayer(sim).pos = { x: 605, y: 500 };
    run(sim, NO_INPUT, TUNING.dummyRespawn);
    expect(entity(sim, DUMMY).defeated).toBe(false);
    expect(gap(sim)).toBeGreaterThanOrEqual(TOUCH - EPS);
    expect(entity(sim, DUMMY).pos).toEqual({ x: 600, y: 500 });
  });
});

describe('determinism with combat', () => {
  function recordedRun(): { state: SimState; events: SimEvent[] } {
    const walls: Rect[] = [
      { x: 300, y: 300, w: 100, h: 100 },
      { x: 700, y: 200, w: 60, h: 500 },
    ];
    const dummies = [
      { x: 560, y: 500 },
      { x: 500, y: 600 },
      { x: 600, y: 400 },
    ];
    const state = createSim(1234, room(walls, { x: 500, y: 500 }, dummies));
    const inputs = createRng(7);
    const events: SimEvent[] = [];
    let current = intent();
    for (let i = 0; i < 1800; i++) {
      if (i % 6 === 0) {
        // Mostly chase and swing at a standing dummy, so hits and defeats happen.
        const p = getPlayer(state).pos;
        const target = state.entities.find((e) => e.kind === 'dummy' && !e.defeated);
        const toward = target ? Math.atan2(target.pos.y - p.y, target.pos.x - p.x) : 0;
        const aim = toward + (nextFloat(inputs) - 0.5) * 0.6;
        const chase = nextFloat(inputs) < 0.7;
        current = intent({
          moveX: chase ? Math.cos(toward) : nextFloat(inputs) * 2 - 1,
          moveY: chase ? Math.sin(toward) : nextFloat(inputs) * 2 - 1,
          aim,
          attack: nextFloat(inputs) < 0.8,
          dash: nextFloat(inputs) < 0.08,
        });
      }
      events.push(...step(state, current));
    }
    return { state, events };
  }

  it('produces identical state and events from the same seed, room, and inputs', () => {
    const a = recordedRun();
    const b = recordedRun();
    expect(a.state.tick).toBe(1800);
    // The run must actually exercise combat for the comparison to mean anything.
    const types = new Set(a.events.map((e) => e.type));
    expect(types).toEqual(new Set(['attackStart', 'dashStart', 'hit', 'defeated']));
    expect(JSON.stringify(a.state)).toBe(JSON.stringify(b.state));
    expect(JSON.stringify(a.events)).toBe(JSON.stringify(b.events));
  });
});
