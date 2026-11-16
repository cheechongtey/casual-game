import { describe, expect, it } from 'vitest';
import { applyHit } from '../src/sim/damage';
import { CHASER } from '../src/data/enemies';
import { createSim, enemyAttackAreas, getPlayer, NO_INPUT, step, type Entity } from '../src/sim/state';
import { intent, room, run } from './helpers';

const A = CHASER.attack;
function setup() {
  const sim = createSim(1, room([], { x: 500, y: 500 }, [], [{ kind: 'chaser', x: 450, y: 500 }]));
  return { sim, e: sim.entities[1], p: getPlayer(sim) };
}
const action = (e: Entity) => e.ai!.state;

describe('committed enemy attacks', () => {
  it('lasts the configured steps in each phase and lunges only during active', () => {
    const { sim, e, p } = setup();
    step(sim, NO_INPUT);
    const start = { ...e.pos };
    // Move the target away so contact does not shorten the lunge.
    p.pos = { x: 800, y: 800 };
    for (let n = 1; n < A.windup; n++) {
      expect(action(e)).toMatchObject({ kind: 'attack', phase: 'windup', ticksLeft: A.windup - n + 1 });
      step(sim, NO_INPUT);
      expect(e.pos).toEqual(start);
    }
    for (let n = 0; n < A.active; n++) {
      step(sim, NO_INPUT);
      expect(action(e)).toMatchObject({ kind: 'attack', phase: 'active', ticksLeft: A.active - n });
    }
    expect(e.pos.x - start.x).toBeCloseTo(A.lunge);
    expect(e.pos.y).toBe(start.y);
    const after = { ...e.pos };
    for (let n = 0; n < A.recovery; n++) {
      step(sim, NO_INPUT);
      expect(action(e)).toMatchObject({ kind: 'attack', phase: 'recovery', ticksLeft: A.recovery - n });
      expect(e.pos).toEqual(after);
    }
    step(sim, NO_INPUT);
    expect(action(e).kind).toBe('pursue');
  });

  it('locks facing and attack direction despite a sidestep', () => {
    const { sim, e, p } = setup();
    step(sim, NO_INPUT);
    p.pos = { x: e.pos.x, y: e.pos.y + 100 };
    for (let n = 1; n < A.windup + A.active + A.recovery; n++) {
      step(sim, NO_INPUT);
      expect(e.facing).toBe(0);
      expect(action(e)).toMatchObject({ kind: 'attack', dir: 0 });
    }
    expect(p.health).toBe(p.maxHealth);
  });
});

describe('enemy damage', () => {
  it('hits on the first active step, once, with none in windup or recovery', () => {
    const { sim, p, e } = setup();
    expect(run(sim, NO_INPUT, A.windup).filter(x => x.type === 'hit')).toEqual([]);
    const hits = step(sim, NO_INPUT).filter(x => x.type === 'hit');
    expect(hits).toMatchObject([{ sourceId: e.id, targetId: p.id, damage: A.damage }]);
    expect(p.health).toBe(p.maxHealth - A.damage);
    expect(run(sim, NO_INPUT, A.active + A.hitstop + A.recovery).filter(x => x.type === 'hit')).toEqual([]);
  });

  it('does not hit a sidestepping player or a player entering only in recovery', () => {
    const { sim, e, p } = setup();
    step(sim, NO_INPUT);
    p.pos = { x: 450, y: 600 };
    expect(run(sim, NO_INPUT, A.windup + A.active).filter(x => x.type === 'hit')).toEqual([]);
    p.pos = { x: e.pos.x + 40, y: e.pos.y };
    expect(run(sim, NO_INPUT, A.recovery - 1).filter(x => x.type === 'hit')).toEqual([]);
    expect(p.health).toBe(p.maxHealth);
  });

  it('does not damage a dashing player', () => {
    const { sim, p } = setup();
    run(sim, NO_INPUT, A.windup);
    const events = step(sim, intent({ dash: true, moveX: -1 }));
    expect(events.some(x => x.type === 'hit')).toBe(false);
    expect(p.health).toBe(p.maxHealth);
    expect(sim.player.action.kind).toBe('dash');
  });

  it('leaves a dummy and another chaser inside the sector unharmed', () => {
    const { sim, e, p } = setup();
    // Valid placements are moved into the arc after room validation.
    const extras = createSim(1, room([], undefined, [{ x: 700, y: 700 }], [{ kind: 'chaser', x: 800, y: 700 }]));
    for (const [i, extra] of extras.entities.slice(1).entries()) {
      extra.id = 3 + i;
      extra.pos = { x: 510, y: 490 + i * 20 };
      if (extra.ai) extra.ai.cooldown = 10000;
      sim.entities.push(extra);
    }
    run(sim, NO_INPUT, A.windup + 1);
    expect(p.health).toBe(p.maxHealth - A.damage);
    for (const extra of sim.entities.slice(2)) expect(extra.health).toBe(extra.maxHealth);
    expect(action(e)).toMatchObject({ hasHit: true });
  });
});

it('pauses only the participants, knocks the player away, and preserves their attack', () => {
  const { sim, e, p } = setup();
  run(sim, NO_INPUT, A.windup - 1);
  step(sim, intent({ attack: true, aim: 0 }));
  const events = step(sim, intent({ aim: 0 }));
  expect(events).toContainEqual(expect.objectContaining({ type: 'hit', sourceId: e.id, targetId: p.id }));
  expect(p.vel.x).toBeGreaterThan(0);
  expect(sim.player.action.kind).toBe('attack');
  expect(p.hitstop).toBe(A.hitstop);
  expect(e.hitstop).toBe(A.hitstop);
  const positions = sim.entities.map(x => ({ ...x.pos }));
  const attack = structuredClone(sim.player.action);
  for (let i = 0; i < A.hitstop; i++) {
    step(sim, intent({ moveX: 1 }));
    expect(sim.entities.map(x => x.pos)).toEqual(positions);
    expect(sim.player.action).toEqual(attack);
  }
  step(sim, intent({ moveX: 1 }));
  expect(p.pos.x).toBeGreaterThan(positions[0].x);
  expect(e.pos.x).toBeGreaterThan(positions[1].x);
  expect(sim.player.action).not.toEqual(attack);
});

describe('attack scheduling', () => {
  function group() {
    const sim = createSim(1, room([], undefined, [], [
      { kind: 'chaser', x: 450, y: 500 }, { kind: 'chaser', x: 550, y: 500 },
      { kind: 'chaser', x: 500, y: 450 }, { kind: 'chaser', x: 500, y: 550 },
    ]));
    getPlayer(sim).invulnerable = true;
    return sim;
  }
  const occupying = (e: Entity) => e.ai?.state.kind === 'attack' && e.ai.state.phase !== 'recovery';

  it('never exceeds two attackers and grants a released place immediately', () => {
    const sim = group();
    step(sim, NO_INPUT);
    expect(sim.entities.filter(occupying).map(e => e.id)).toEqual([2, 3]);
    const waiting = sim.entities[3];
    for (let i = 1; i < A.windup + A.active; i++) {
      step(sim, NO_INPUT);
      expect(sim.entities.filter(occupying).length).toBeLessThanOrEqual(2);
      expect(action(waiting).kind).toBe('pursue');
    }
    step(sim, NO_INPUT);
    expect(action(waiting)).toMatchObject({ kind: 'attack', phase: 'windup' });
    for (let i = 0; i < 300; i++) {
      step(sim, NO_INPUT);
      expect(sim.entities.filter(occupying).length).toBeLessThanOrEqual(2);
    }
  });

  it('grants by longest wait, breaking ties by id independently of entity order', () => {
    const sim = group();
    sim.entities[4].ai!.waited = 100;
    sim.entities.reverse();
    step(sim, NO_INPUT);
    expect(sim.entities.filter(occupying).map(e => e.id).sort()).toEqual([2, 5]);
  });

  it('waits the cooldown measured from the end of recovery', () => {
    const { sim, e, p } = setup();
    p.invulnerable = true;
    run(sim, NO_INPUT, A.windup + A.active + A.recovery);
    step(sim, NO_INPUT);
    expect(action(e).kind).toBe('pursue');
    expect(e.ai!.cooldown).toBe(CHASER.cooldown);
    run(sim, NO_INPUT, CHASER.cooldown - 1);
    expect(action(e).kind).toBe('pursue');
    step(sim, NO_INPUT);
    expect(action(e)).toMatchObject({ kind: 'attack', phase: 'windup' });
  });
});

describe('stagger', () => {
  it('interrupts windup, freezes the stagger timer during hitstop, then resumes pursuit', () => {
    const { sim, e, p } = setup();
    step(sim, NO_INPUT);
    applyHit(sim, p.pos, e.id, { damage: 1, knockback: 120, hitstop: 3 }, p.id);
    p.pos = { x: 800, y: 500 };
    const before = { ...e.pos };
    run(sim, NO_INPUT, 3);
    expect(e.pos).toEqual(before);
    expect(action(e)).toMatchObject({ kind: 'stagger', ticksLeft: CHASER.stagger });
    const events = run(sim, NO_INPUT, CHASER.stagger - 1);
    expect(events.filter(x => x.type === 'hit')).toEqual([]);
    expect(action(e).kind).toBe('stagger');
    expect(e.pos.x).toBeLessThan(before.x); // knockback away from the original source
    e.vel = { x: 0, y: 0 };
    const x = e.pos.x;
    step(sim, NO_INPUT);
    expect(action(e).kind).toBe('pursue');
    expect(e.pos.x).toBeGreaterThan(x);
    expect(p.health).toBe(p.maxHealth);
  });

  it('makes an idle enemy hit beyond notice range pursue when stagger ends', () => {
    const sim = createSim(1, room([], { x: 100, y: 500 }, [], [{ kind: 'chaser', x: 800, y: 500 }]));
    const e = sim.entities[1];
    applyHit(sim, getPlayer(sim).pos, e.id, { damage: 1, knockback: 0, hitstop: 0 });
    run(sim, NO_INPUT, CHASER.stagger - 1);
    expect(e.pos.x).toBe(800);
    step(sim, NO_INPUT);
    expect(action(e).kind).toBe('pursue');
    expect(e.pos.x).toBeLessThan(800);
  });

  it('frees an interrupted attacker place for a waiting chaser', () => {
    const sim = createSim(1, room([], undefined, [], [
      { kind: 'chaser', x: 450, y: 500 }, { kind: 'chaser', x: 550, y: 500 }, { kind: 'chaser', x: 500, y: 450 },
    ]));
    step(sim, NO_INPUT);
    expect(action(sim.entities[3]).kind).toBe('pursue');
    applyHit(sim, getPlayer(sim).pos, 2, { damage: 1, knockback: 0, hitstop: 3 }, 1);
    step(sim, NO_INPUT);
    expect(action(sim.entities[3])).toMatchObject({ kind: 'attack', phase: 'windup' });
  });

  it('deals no damage from a chaser defeated during windup', () => {
    const { sim, e, p } = setup();
    step(sim, NO_INPUT);
    applyHit(sim, p.pos, e.id, { damage: e.health, knockback: 0, hitstop: 0 });
    expect(run(sim, NO_INPUT, A.windup + A.active + A.recovery).filter(x => x.type === 'hit')).toEqual([]);
    expect(p.health).toBe(p.maxHealth);
  });
});

it('exposes a half-complete telegraph and no area for pursuit', () => {
  const { sim, e } = setup();
  run(sim, NO_INPUT, 1 + A.windup / 2);
  expect(enemyAttackAreas(sim)).toEqual([{
    entityId: e.id, phase: 'windup', windupProgress: 0.5,
    apex: { ...e.pos }, dir: 0, range: A.range, angle: A.angle,
  }]);
  e.ai!.state = { kind: 'pursue' };
  expect(enemyAttackAreas(sim)).toEqual([]);
});
