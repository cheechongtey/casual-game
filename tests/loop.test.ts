import { describe, expect, it } from 'vitest';
import type { Room } from '../src/data/room';
import { advanceClock, advanceFrame, createClock } from '../src/sim/loop';
import { createSim, getPlayer, type InputIntent } from '../src/sim/state';
import { intent as makeIntent } from './helpers';

function stepsOver(frames: number, frameSeconds: number): number {
  const clock = createClock();
  let total = 0;
  for (let i = 0; i < frames; i++) total += advanceClock(clock, frameSeconds).steps;
  return total;
}

describe('fixed-timestep clock', () => {
  it('runs 60 steps in one second at 30 frames per second', () => {
    expect(stepsOver(30, 1 / 30)).toBe(60);
  });

  it('runs 60 steps in one second at 144 frames per second', () => {
    expect(stepsOver(144, 1 / 144)).toBe(60);
  });

  it('runs 5 steps after a 2-second stall and discards the rest', () => {
    const clock = createClock();
    expect(advanceClock(clock, 2).steps).toBe(5);
    expect(clock.accumulator).toBe(0);
    expect(advanceClock(clock, 1 / 60).steps).toBe(1);
  });

  it('reports alpha halfway between steps', () => {
    const clock = createClock();
    const { steps, alpha } = advanceClock(clock, 1.5 / 60);
    expect(steps).toBe(1);
    expect(alpha).toBeCloseTo(0.5, 9);
  });
});

describe('frame loop', () => {
  const room: Room = { id: 'open', width: 4000, height: 1000, walls: [], spawn: { x: 100, y: 500 }, enemies: [], dummies: [] };

  it('gives every step in a frame the same intent', () => {
    const sim = createSim(1, room);
    const intent: InputIntent = makeIntent({ moveX: 1, aim: 0.5 });
    const seen: InputIntent[] = [];
    advanceFrame(createClock(), sim, intent, 2 / 60, (_state, received) => {
      seen.push(received);
      return [];
    });
    expect(seen).toHaveLength(2);
    expect(seen[0]).toBe(intent);
    expect(seen[1]).toBe(intent);
  });

  it('covers the same distance in 2 seconds at 20 and at 240 frames per second', () => {
    const intent: InputIntent = makeIntent({ moveX: 1 });
    const distances = [20, 240].map((fps) => {
      const sim = createSim(1, room);
      const clock = createClock();
      for (let i = 0; i < fps * 2; i++) advanceFrame(clock, sim, intent, 1 / fps);
      return getPlayer(sim).pos.x - 100;
    });
    expect(distances[0]).toBeCloseTo(distances[1], 6);
  });
});
