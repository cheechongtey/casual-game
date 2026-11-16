import { expect, it } from 'vitest';
import { CHASER } from '../src/data/enemies';
import { createSim, getPlayer, NO_INPUT, step } from '../src/sim/state';
import { intent, room, run } from './helpers';

it('reports the final hit and freezes all gameplay after defeat, counting only ticks', () => {
  const sim = createSim(1, room([], undefined, [], [
    { kind: 'chaser', x: 450, y: 500 }, { kind: 'chaser', x: 550, y: 500 },
  ]));
  getPlayer(sim).health = CHASER.attack.damage;
  run(sim, NO_INPUT, CHASER.attack.windup);
  sim.entities[2].ai!.state = { kind: 'attack', phase: 'windup', ticksLeft: 10, dir: Math.PI, hasHit: false };
  const events = step(sim, NO_INPUT);
  expect(getPlayer(sim).defeated).toBe(true);
  expect(events).toContainEqual(expect.objectContaining({ type: 'defeated', targetId: sim.playerId }));
  expect(sim.entities[2].ai?.state).toMatchObject({ kind: 'attack', phase: 'windup', ticksLeft: 9 });
  const { tick, ...before } = structuredClone(sim);
  expect(run(sim, intent({ moveX: 1, moveY: 1, attack: true, dash: true }), 120)).toEqual([]);
  const { tick: afterTick, ...after } = sim;
  expect(afterTick).toBe(tick + 120);
  expect(after).toEqual(before);
});
