import { describe, expect, it } from 'vitest';
import type { Rect } from '../src/data/room';
import { STEP_SECONDS, TUNING } from '../src/data/tuning';
import { WEAPON } from '../src/data/weapons';
import { makeSector, sectorHitsCircle } from '../src/sim/sector';
import { attackArea, createSim, getPlayer, NO_INPUT, step, type SimEvent } from '../src/sim/state';
import { distanceToRect, entity, intent, room, run, runEach, stepsWith } from './helpers';

const R = TUNING.playerRadius;
const DUMMY = 2;
const [A1, , A3] = WEAPON;
const A1_TOTAL = A1.windup + A1.active + A1.recovery;

/** Player at (500, 500) and one dummy 50 units to its right. */
function duel(dummy = { x: 550, y: 500 }) {
  return createSim(1, room([], { x: 500, y: 500 }, [dummy]));
}

function attackStarts(perStep: SimEvent[][]): { step: number; index: number }[] {
  const out: { step: number; index: number }[] = [];
  perStep.forEach((events, n) => {
    for (const e of events) if (e.type === 'attackStart') out.push({ step: n, index: e.index });
  });
  return out;
}

describe('sector hit test', () => {
  const sector = makeSector({ x: 0, y: 0 }, 0, 72, (110 * Math.PI) / 180);

  it('hits a target directly ahead in range', () => {
    expect(sectorHitsCircle(sector, { x: 50, y: 0 }, 20)).toBe(true);
  });

  it('misses a target directly behind', () => {
    expect(sectorHitsCircle(sector, { x: -50, y: 0 }, 20)).toBe(false);
  });

  it('misses a target whose nearest point is beyond range', () => {
    expect(sectorHitsCircle(sector, { x: 72 + 20 + 1, y: 0 }, 20)).toBe(false);
    expect(sectorHitsCircle(sector, { x: 72 + 20 - 1, y: 0 }, 20)).toBe(true);
  });

  it('hits a target clipped by the edge of the arc', () => {
    // Center at 70 degrees, outside the 55-degree half angle, circle crossing the edge.
    const a = (70 * Math.PI) / 180;
    const center = { x: Math.cos(a) * 50, y: Math.sin(a) * 50 };
    expect(sectorHitsCircle(sector, center, 20)).toBe(true);
    // The same direction with a small circle does not reach the edge.
    expect(sectorHitsCircle(sector, center, 5)).toBe(false);
  });

  it('hits a target containing the apex', () => {
    expect(sectorHitsCircle(sector, { x: -10, y: 0 }, 20)).toBe(true);
  });
});

describe('attack phases', () => {
  it('lands damage on the first active step and never in windup', () => {
    const sim = duel();
    const perStep = runEach(sim, A1.windup + 1, (n) => intent({ attack: n === 1 }));
    expect(stepsWith(perStep, 'hit')).toEqual([A1.windup + 1]);
    expect(sim.player.action).toMatchObject({ kind: 'attack', phase: 'active' });
    expect(entity(sim, DUMMY).health).toBe(TUNING.dummyHealth - A1.damage);
  });

  it('does not hit a target that arrives during recovery', () => {
    const sim = duel({ x: 800, y: 500 });
    run(sim, intent({ attack: true }), 1);
    run(sim, NO_INPUT, A1.windup + A1.active);
    expect(sim.player.action).toMatchObject({ kind: 'attack', phase: 'recovery' });
    const d = entity(sim, DUMMY);
    d.pos = { x: getPlayer(sim).pos.x + 50, y: 500 };
    const events = run(sim, NO_INPUT, A1.recovery + 2);
    expect(events.filter((e) => e.type === 'hit')).toEqual([]);
    expect(d.health).toBe(TUNING.dummyHealth);
  });

  it('starts the first attack on the step attack becomes held', () => {
    const sim = createSim(1, room());
    const events = step(sim, intent({ attack: true }));
    expect(events).toEqual([{ type: 'attackStart', entityId: 1, index: 0, dir: 0 }]);
  });
});

describe('attack direction', () => {
  it('locks the hit area and facing to the aim at attack start', () => {
    // One dummy at 0 degrees, one at 90 degrees (down-screen).
    const sim = createSim(1, room([], { x: 500, y: 500 }, [{ x: 550, y: 500 }, { x: 500, y: 560 }]));
    step(sim, intent({ attack: true, aim: 0 }));
    const perStep = runEach(sim, A1.windup + A1.active, () => intent({ aim: Math.PI / 2 }));
    const hits = perStep.flat().filter((e) => e.type === 'hit');
    expect(hits.map((e) => e.type === 'hit' && e.targetId)).toEqual([2]);
    expect(getPlayer(sim).facing).toBe(0);
    expect(attackArea(sim)?.dir).toBe(0);
  });

  it('keeps facing at the attack direction until the attack ends', () => {
    const sim = createSim(1, room());
    step(sim, intent({ attack: true, aim: 0 }));
    for (let i = 1; i < A1_TOTAL; i++) {
      step(sim, intent({ aim: Math.PI / 2 }));
      expect(getPlayer(sim).facing).toBe(0);
    }
    step(sim, intent({ aim: Math.PI / 2 }));
    expect(sim.player.action.kind).toBe('idle');
    expect(getPlayer(sim).facing).toBe(Math.PI / 2);
  });
});

describe('one hit per target', () => {
  it('damages a target that stays in the arc only once', () => {
    const sim = duel();
    const d = entity(sim, DUMMY);
    const hits: SimEvent[] = [];
    for (let n = 1; n <= A1_TOTAL + A1.hitstop; n++) {
      // Hold the target in the arc for the whole attack.
      d.pos = { x: getPlayer(sim).pos.x + 50, y: 500 };
      d.vel = { x: 0, y: 0 };
      hits.push(...step(sim, intent({ attack: n === 1 })).filter((e) => e.type === 'hit'));
    }
    expect(hits).toHaveLength(1);
    expect(d.health).toBe(TUNING.dummyHealth - A1.damage);
  });
});

describe('combo', () => {
  it('chains three attacks while held, then restarts after the finisher', () => {
    const sim = createSim(1, room());
    const perStep = runEach(sim, 60, () => intent({ attack: true }));
    const starts = attackStarts(perStep);
    expect(starts.map((s) => s.index)).toEqual([0, 1, 2, 0]);
    // Each next attack starts on the step after the previous recovery ends.
    expect(starts.map((s) => s.step)).toEqual([1, 1 + A1_TOTAL, 1 + 2 * A1_TOTAL, 1 + 2 * A1_TOTAL + 25]);
  });

  it('continues the combo when the next attack starts within the window', () => {
    const sim = createSim(1, room());
    const pressAt = A1_TOTAL + TUNING.comboWindow; // last step of the window
    const perStep = runEach(sim, pressAt + 1, (n) => intent({ attack: n === 1 || n === pressAt }));
    expect(attackStarts(perStep)).toEqual([
      { step: 1, index: 0 },
      { step: pressAt, index: 1 },
    ]);
  });

  it('restarts the combo when the window has passed', () => {
    const sim = createSim(1, room());
    const pressAt = A1_TOTAL + TUNING.comboWindow + 1;
    const perStep = runEach(sim, pressAt + 1, (n) => intent({ attack: n === 1 || n === pressAt }));
    expect(attackStarts(perStep)).toEqual([
      { step: 1, index: 0 },
      { step: pressAt, index: 0 },
    ]);
  });

  it('deals each attack its own damage, the finisher more than the first', () => {
    const sim = duel();
    const d = entity(sim, DUMMY);
    const hits: number[] = [];
    for (let n = 0; n < 90; n++) {
      d.pos = { x: getPlayer(sim).pos.x + 50, y: 500 };
      d.vel = { x: 0, y: 0 };
      d.health = d.maxHealth;
      for (const e of step(sim, intent({ attack: true }))) if (e.type === 'hit') hits.push(e.damage);
    }
    expect(hits.slice(0, 3)).toEqual([WEAPON[0].damage, WEAPON[1].damage, WEAPON[2].damage]);
    expect(A3.damage).toBeGreaterThan(A1.damage);
  });
});

describe('attack input buffering', () => {
  const recoveryEnd = A1_TOTAL; // last step of the first attack

  it('starts the next attack after recovery for a press late in recovery', () => {
    const sim = createSim(1, room());
    const pressAt = recoveryEnd - (TUNING.inputBuffer - 2);
    const perStep = runEach(sim, recoveryEnd + 5, (n) => intent({ attack: n === 1 || n === pressAt }));
    expect(attackStarts(perStep)).toEqual([
      { step: 1, index: 0 },
      { step: recoveryEnd + 1, index: 1 },
    ]);
  });

  it('ignores a press made too early before the attack ends', () => {
    const sim = createSim(1, room());
    const pressAt = recoveryEnd - TUNING.inputBuffer - 2;
    // Press at step 1, release, press again early in the same attack, release.
    const perStep = runEach(sim, recoveryEnd + 30, (n) => intent({ attack: n === 1 || n === pressAt }));
    expect(attackStarts(perStep)).toEqual([{ step: 1, index: 0 }]);
  });

  it('repeats attacks while held through recovery', () => {
    const sim = createSim(1, room());
    const perStep = runEach(sim, recoveryEnd + 1, () => intent({ attack: true }));
    expect(attackStarts(perStep).map((s) => s.step)).toEqual([1, recoveryEnd + 1]);
  });
});

describe('lunge and movement while attacking', () => {
  it('lunges the configured distance over the active phase in the open', () => {
    const sim = createSim(1, room());
    run(sim, intent({ attack: true }), 1);
    run(sim, NO_INPUT, A1.windup - 1);
    expect(getPlayer(sim).pos.x).toBe(500);
    run(sim, NO_INPUT, A1.active);
    expect(getPlayer(sim).pos.x - 500).toBeCloseTo(A1.lunge, 9);
    run(sim, NO_INPUT, A1.recovery);
    expect(getPlayer(sim).pos.x - 500).toBeCloseTo(A1.lunge, 9);
  });

  it('does not lunge into a wall', () => {
    const wall: Rect = { x: 600, y: 300, w: 100, h: 400 };
    const sim = createSim(1, room([wall], { x: wall.x - R, y: 500 }));
    for (let i = 0; i < A1_TOTAL; i++) {
      step(sim, intent({ attack: i === 0 }));
      expect(distanceToRect(getPlayer(sim).pos, wall)).toBeGreaterThanOrEqual(R - 1e-6);
    }
  });

  it('moves at the attack fraction of the move speed during windup', () => {
    const sim = createSim(1, room());
    run(sim, intent({ attack: true, moveX: 1 }), A1.windup);
    const expected = A1.windup * TUNING.moveSpeed * TUNING.attackMoveFraction * STEP_SECONDS;
    expect(getPlayer(sim).pos.x - 500).toBeCloseTo(expected, 9);
  });
});
