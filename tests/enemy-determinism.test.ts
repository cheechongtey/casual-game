import { expect, it } from 'vitest';
import { createSim, step, type SimEvent } from '../src/sim/state';
import { intent, room } from './helpers';

it('replays a detour, enemy hits, and recorded move/attack/dash input identically', () => {
  const definition = room([{ x: 450, y: 450, w: 100, h: 100 }], { x: 500, y: 700 }, [], [
    { kind: 'chaser', x: 500, y: 300 }, { kind: 'chaser', x: 600, y: 300 },
  ]);
  const recorded = Array.from({ length: 900 }, (_, n) => intent({
    moveX: n >= 400 && n < 440 ? 1 : 0,
    moveY: n >= 450 && n < 480 ? -1 : 0,
    attack: n >= 500 && n < 650,
    aim: -Math.PI / 2,
    dash: n === 480 || n === 700,
  }));
  const replay = () => {
    const sim = createSim(73, definition);
    const events: SimEvent[][] = [];
    const snapshots: string[] = [];
    let detoured = false;
    for (const input of recorded) {
      events.push(step(sim, input));
      detoured ||= sim.entities.some(e => e.ai?.detour !== null && e.ai?.detour !== undefined);
      snapshots.push(JSON.stringify(sim));
    }
    return { sim, snapshots, events, detoured };
  };
  const a = replay(), b = replay();
  expect(a.detoured).toBe(true);
  expect(a.events.flat().some(e => e.type === 'hit' && e.targetId === a.sim.playerId)).toBe(true);
  expect(a.events.flat().some(e => e.type === 'attackStart')).toBe(true);
  expect(a.events.flat().some(e => e.type === 'dashStart')).toBe(true);
  expect(a).toEqual(b);
});
