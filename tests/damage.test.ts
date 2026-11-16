import { describe, expect, it } from 'vitest';
import type { Rect } from '../src/data/room';
import { TUNING } from '../src/data/tuning';
import { WEAPON } from '../src/data/weapons';
import { applyHit } from '../src/sim/damage';
import { createSim, getPlayer, NO_INPUT, step, type SimState } from '../src/sim/state';
import { distanceToRect, entity, intent, room, run } from './helpers';

const DUMMY = 2;
const SOURCE = { x: 500, y: 500 };

function withDummy(at = { x: 600, y: 500 }, walls: Rect[] = []): SimState {
  return createSim(1, room(walls, { x: 300, y: 300 }, [at]));
}

/** Steps until the dummy stops moving, up to a limit. */
function settle(sim: SimState): void {
  for (let i = 0; i < 600; i++) {
    step(sim, NO_INPUT);
    const d = entity(sim, DUMMY);
    if (d.vel.x === 0 && d.vel.y === 0) return;
  }
  throw new Error('dummy never came to rest');
}

describe('health and defeat', () => {
  it('reduces health by the damage and reports a hit', () => {
    const sim = withDummy();
    const events = applyHit(sim, SOURCE, DUMMY, { damage: 20, knockback: 0, hitstop: 0 });
    expect(entity(sim, DUMMY).health).toBe(TUNING.dummyHealth - 20);
    expect(events).toEqual([
      { type: 'hit', sourceId: null, targetId: DUMMY, damage: 20, pos: { x: 600, y: 500 }, hitstop: 0 },
    ]);
  });

  it('never goes below zero on overkill', () => {
    const sim = withDummy();
    entity(sim, DUMMY).health = 10;
    applyHit(sim, SOURCE, DUMMY, { damage: 40, knockback: 0, hitstop: 0 });
    expect(entity(sim, DUMMY).health).toBe(0);
  });

  it('defeats an entity on the final blow and reports it', () => {
    const sim = withDummy();
    entity(sim, DUMMY).health = 20;
    const events = applyHit(sim, SOURCE, DUMMY, { damage: 20, knockback: 380, hitstop: 0 });
    expect(entity(sim, DUMMY).defeated).toBe(true);
    expect(entity(sim, DUMMY).vel).toEqual({ x: 0, y: 0 });
    expect(events.map((e) => e.type)).toEqual(['hit', 'defeated']);
  });

  it('ignores a hit on a defeated entity', () => {
    const sim = withDummy();
    entity(sim, DUMMY).health = 20;
    applyHit(sim, SOURCE, DUMMY, { damage: 20, knockback: 0, hitstop: 0 });
    const events = applyHit(sim, SOURCE, DUMMY, { damage: 20, knockback: 380, hitstop: 3 });
    expect(events).toEqual([]);
    expect(entity(sim, DUMMY).vel).toEqual({ x: 0, y: 0 });
    expect(sim.hitstop).toBe(0);
  });

  it('does not let an attack hit a defeated entity', () => {
    const sim = createSim(1, room([], { x: 500, y: 500 }, [{ x: 550, y: 500 }]));
    entity(sim, DUMMY).health = 1;
    applyHit(sim, SOURCE, DUMMY, { damage: 1, knockback: 0, hitstop: 0 });
    const events = run(sim, intent({ attack: true }), 15);
    expect(events.filter((e) => e.type === 'hit')).toEqual([]);
  });

  it('does not let a defeated entity block the player', () => {
    const sim = createSim(1, room([], { x: 500, y: 500 }, [{ x: 600, y: 500 }]));
    entity(sim, DUMMY).health = 1;
    applyHit(sim, SOURCE, DUMMY, { damage: 1, knockback: 0, hitstop: 0 });
    run(sim, intent({ moveX: 1 }), 30);
    expect(getPlayer(sim).pos.x).toBeCloseTo(500 + TUNING.moveSpeed / 2, 6);
  });
});

describe('knockback', () => {
  it('pushes the target directly away from the source and comes to rest', () => {
    const sim = withDummy();
    applyHit(sim, SOURCE, DUMMY, { damage: 1, knockback: 380, hitstop: 0 });
    let lastX = 600;
    for (let i = 0; i < 5; i++) {
      step(sim, NO_INPUT);
      const d = entity(sim, DUMMY);
      expect(d.pos.x).toBeGreaterThan(lastX);
      expect(d.pos.y).toBe(500);
      lastX = d.pos.x;
    }
    settle(sim);
    const restX = entity(sim, DUMMY).pos.x;
    run(sim, NO_INPUT, 10);
    expect(entity(sim, DUMMY).pos.x).toBe(restX);
  });

  it('carries a target farther with a stronger hit', () => {
    const travel = (knockback: number) => {
      const sim = withDummy();
      applyHit(sim, SOURCE, DUMMY, { damage: 1, knockback, hitstop: 0 });
      settle(sim);
      return entity(sim, DUMMY).pos.x - 600;
    };
    expect(travel(760)).toBeGreaterThan(travel(380));
  });

  it('stops a target touching a wall without overlapping it', () => {
    const wall: Rect = { x: 640, y: 300, w: 20, h: 400 };
    const sim = withDummy({ x: 600, y: 500 }, [wall]);
    applyHit(sim, SOURCE, DUMMY, { damage: 1, knockback: 720, hitstop: 0 });
    for (let i = 0; i < 60; i++) {
      step(sim, NO_INPUT);
      expect(distanceToRect(entity(sim, DUMMY).pos, wall)).toBeGreaterThanOrEqual(TUNING.dummyRadius - 1e-6);
    }
    expect(entity(sim, DUMMY).pos.x).toBeCloseTo(wall.x - TUNING.dummyRadius, 6);
  });
});

describe('hitstop', () => {
  const def = WEAPON[0];

  it('freezes everything for the configured steps, then resumes', () => {
    const sim = createSim(1, room([], { x: 500, y: 500 }, [{ x: 550, y: 500 }]));
    const attack = intent({ attack: true, moveX: 1 });
    run(sim, attack, def.windup);
    const hitEvents = step(sim, attack);
    expect(hitEvents.some((e) => e.type === 'hit')).toBe(true);
    expect(sim.hitstop).toBe(def.hitstop);

    const frozen = JSON.stringify({ entities: sim.entities.map((e) => e.pos), action: sim.player.action });
    for (let i = 0; i < def.hitstop; i++) {
      const tick = sim.tick;
      step(sim, attack);
      expect(sim.tick).toBe(tick + 1);
      expect(JSON.stringify({ entities: sim.entities.map((e) => e.pos), action: sim.player.action })).toBe(frozen);
    }

    const dummyX = entity(sim, DUMMY).pos.x;
    const ticksLeft = sim.player.action.kind === 'attack' ? sim.player.action.ticksLeft : -1;
    step(sim, attack);
    expect(entity(sim, DUMMY).pos.x).toBeGreaterThan(dummyX);
    expect(sim.player.action).toMatchObject({ kind: 'attack', phase: 'active', ticksLeft: ticksLeft - 1 });
  });

  it('does not pause when an attack misses', () => {
    const sim = createSim(1, room());
    const total = def.windup + def.active + def.recovery;
    for (let i = 0; i < total; i++) {
      step(sim, intent({ attack: i === 0 }));
      expect(sim.hitstop).toBe(0);
    }
    step(sim, NO_INPUT);
    expect(sim.player.action.kind).toBe('idle');
  });

  it('still buffers a press made during the freeze', () => {
    const sim = createSim(1, room([], { x: 500, y: 500 }, [{ x: 550, y: 500 }]));
    run(sim, intent({ attack: true }), def.windup + 1);
    expect(sim.hitstop).toBe(def.hitstop);
    step(sim, NO_INPUT);
    step(sim, intent({ attack: true }));
    expect(sim.player.attackBuffer).toBe(TUNING.inputBuffer);
    run(sim, NO_INPUT, sim.hitstop);
    // The buffer did not run down while frozen.
    expect(sim.player.attackBuffer).toBe(TUNING.inputBuffer);
  });

  it('starts a dash pressed during the freeze on the first step after it', () => {
    const sim = createSim(1, room([], { x: 500, y: 500 }, [{ x: 550, y: 500 }]));
    run(sim, intent({ attack: true }), def.windup + 1);
    step(sim, intent({ dash: true, moveY: 1 }));
    const remaining = sim.hitstop;
    expect(run(sim, intent({ moveY: 1 }), remaining).filter((e) => e.type === 'dashStart')).toEqual([]);
    expect(step(sim, intent({ moveY: 1 })).some((e) => e.type === 'dashStart')).toBe(true);
  });
});

describe('invulnerability', () => {
  it('ignores hits on an invulnerable target, with no knockback or hitstop', () => {
    const sim = withDummy();
    entity(sim, DUMMY).invulnerable = true;
    const events = applyHit(sim, SOURCE, DUMMY, { damage: 20, knockback: 380, hitstop: 3 });
    expect(events).toEqual([]);
    expect(entity(sim, DUMMY).health).toBe(TUNING.dummyHealth);
    expect(sim.hitstop).toBe(0);
    step(sim, NO_INPUT);
    expect(entity(sim, DUMMY).pos).toEqual({ x: 600, y: 500 });
  });
});
