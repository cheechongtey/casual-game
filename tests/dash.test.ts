import { describe, expect, it } from 'vitest';
import type { Rect } from '../src/data/room';
import { TUNING } from '../src/data/tuning';
import { WEAPON } from '../src/data/weapons';
import { applyHit } from '../src/sim/damage';
import { createSim, getPlayer, NO_INPUT, step } from '../src/sim/state';
import { distanceToRect, entity, intent, room, run, runEach, stepsWith } from './helpers';

const R = TUNING.playerRadius;
const D = TUNING.dashDuration;
const DIST = TUNING.dashDistance;
/** First step a dash may start after one that started on step 1. */
const COOLDOWN_END = D + 1 + TUNING.dashCooldown;

describe('dash movement', () => {
  it('moves the dash distance over the dash duration', () => {
    const sim = createSim(1, room());
    step(sim, intent({ dash: true, moveX: 1 }));
    expect(sim.player.action.kind).toBe('dash');
    run(sim, NO_INPUT, D - 1);
    expect(getPlayer(sim).pos.x - 500).toBeCloseTo(DIST, 9);
    step(sim, NO_INPUT);
    expect(sim.player.action.kind).toBe('idle');
    expect(getPlayer(sim).pos.x - 500).toBeCloseTo(DIST, 9);
  });

  it('travels in the held move direction, not the aim', () => {
    const sim = createSim(1, room());
    step(sim, intent({ dash: true, moveX: -1, aim: 0 }));
    run(sim, NO_INPUT, D - 1);
    expect(getPlayer(sim).pos.x - 500).toBeCloseTo(-DIST, 9);
  });

  it('travels along the facing angle with no move direction held', () => {
    const sim = createSim(1, room());
    step(sim, intent({ dash: true, aim: Math.PI / 2 }));
    run(sim, intent({ aim: Math.PI / 2 }), D - 1);
    const p = getPlayer(sim).pos;
    expect(p.x).toBeCloseTo(500, 9);
    expect(p.y - 500).toBeCloseTo(DIST, 9);
  });

  it('ignores steering during the dash', () => {
    const sim = createSim(1, room());
    step(sim, intent({ dash: true, moveX: 1 }));
    run(sim, intent({ moveY: -1 }), D - 1);
    const p = getPlayer(sim).pos;
    expect(p.x - 500).toBeCloseTo(DIST, 9);
    expect(p.y).toBe(500);
  });
});

describe('dash and walls', () => {
  it('stops on the near face of a 20-unit-thick wall', () => {
    const wall: Rect = { x: 600, y: 300, w: 20, h: 400 };
    const sim = createSim(1, room([wall], { x: 540, y: 500 }));
    step(sim, intent({ dash: true, moveX: 1 }));
    for (let i = 1; i < D; i++) {
      step(sim, NO_INPUT);
      expect(distanceToRect(getPlayer(sim).pos, wall)).toBeGreaterThanOrEqual(R - 1e-6);
    }
    expect(getPlayer(sim).pos.x).toBeCloseTo(wall.x - R, 9);
  });

  it('slides along a wall on a diagonal dash', () => {
    const wall: Rect = { x: 600, y: 300, w: 100, h: 400 };
    const sim = createSim(1, room([wall], { x: 560, y: 650 }));
    const dir = { moveX: Math.SQRT1_2, moveY: -Math.SQRT1_2 };
    step(sim, intent({ dash: true, ...dir }));
    run(sim, NO_INPUT, D - 1);
    const p = getPlayer(sim).pos;
    expect(p.x).toBeCloseTo(wall.x - R, 9);
    expect(650 - p.y).toBeCloseTo(DIST * Math.SQRT1_2, 9);
  });
});

describe('dash triggering and cooldown', () => {
  it('dashes once when dash is held for 3 seconds', () => {
    const sim = createSim(1, room());
    const perStep = runEach(sim, 180, () => intent({ dash: true, moveX: 1 }));
    expect(stepsWith(perStep, 'dashStart')).toEqual([1]);
  });

  it('ignores a press made early in the cooldown', () => {
    const sim = createSim(1, room());
    const pressAt = COOLDOWN_END - TUNING.inputBuffer - 5;
    const perStep = runEach(sim, COOLDOWN_END + 20, (n) => intent({ dash: n === 1 || n === pressAt, moveX: 1 }));
    expect(stepsWith(perStep, 'dashStart')).toEqual([1]);
  });

  it('starts a dash when the cooldown ends for a press shortly before', () => {
    const sim = createSim(1, room());
    const pressAt = COOLDOWN_END - 3;
    const perStep = runEach(sim, COOLDOWN_END + 5, (n) => intent({ dash: n === 1 || n === pressAt, moveX: 1 }));
    expect(stepsWith(perStep, 'dashStart')).toEqual([1, COOLDOWN_END]);
  });

  it('starts a dash on the step it is pressed after the cooldown', () => {
    const sim = createSim(1, room());
    const pressAt = COOLDOWN_END + 10;
    const perStep = runEach(sim, pressAt + 1, (n) => intent({ dash: n === 1 || n === pressAt, moveX: 1 }));
    expect(stepsWith(perStep, 'dashStart')).toEqual([1, pressAt]);
  });
});

describe('dash cancels attacks', () => {
  it('ends an attack in windup without a hit and dashes on that step', () => {
    const sim = createSim(1, room([], { x: 500, y: 500 }, [{ x: 550, y: 500 }]));
    step(sim, intent({ attack: true }));
    const events = step(sim, intent({ dash: true, moveY: 1 }));
    expect(events.map((e) => e.type)).toEqual(['dashStart']);
    expect(sim.player.action.kind).toBe('dash');
    const later = run(sim, NO_INPUT, 40);
    expect(later.filter((e) => e.type === 'hit')).toEqual([]);
    expect(entity(sim, 2).health).toBe(TUNING.dummyHealth);
  });

  it('restarts the combo after cancelling the second attack', () => {
    const sim = createSim(1, room());
    const first = WEAPON[0].windup + WEAPON[0].active + WEAPON[0].recovery;
    const perStep = runEach(sim, first + 1, () => intent({ attack: true }));
    expect(perStep[first + 1].find((e) => e.type === 'attackStart')).toMatchObject({ index: 1 });
    step(sim, intent({ dash: true, moveY: 1 }));
    run(sim, NO_INPUT, D);
    expect(sim.player.action.kind).toBe('idle');
    const events = step(sim, intent({ attack: true }));
    expect(events.find((e) => e.type === 'attackStart')).toMatchObject({ index: 0 });
  });

  it('dashes rather than attacks when both are pressed on one step', () => {
    const sim = createSim(1, room());
    const events = step(sim, intent({ attack: true, dash: true, moveX: 1 }));
    expect(events.map((e) => e.type)).toEqual(['dashStart']);
  });
});

describe('dash invulnerability', () => {
  const hit = { damage: 30, knockback: 0, hitstop: 0 };

  it('takes no damage midway through a dash', () => {
    const sim = createSim(1, room());
    step(sim, intent({ dash: true, moveX: 1 }));
    run(sim, NO_INPUT, Math.floor(D / 2));
    applyHit(sim, { x: 0, y: 0 }, sim.playerId, hit);
    expect(getPlayer(sim).health).toBe(TUNING.playerHealth);
  });

  it('takes damage on the step after a dash ends', () => {
    const sim = createSim(1, room());
    step(sim, intent({ dash: true, moveX: 1 }));
    run(sim, NO_INPUT, D);
    expect(sim.player.action.kind).toBe('idle');
    applyHit(sim, { x: 0, y: 0 }, sim.playerId, hit);
    expect(getPlayer(sim).health).toBe(TUNING.playerHealth - hit.damage);
  });
});
