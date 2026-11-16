import { describe, expect, it } from 'vitest';
import { startRoom } from '../src/data/rooms/start';
import { TUNING } from '../src/data/tuning';
import { createSim } from '../src/sim/state';
import { acceptsRestart, enemyTelegraphOpacity, healthFillWidth } from '../src/view/hud';

describe('restart', () => {
  it('refuses early presses and held input, accepts a fresh press after the delay', () => {
    expect(acceptsRestart(0.1, true)).toBe(false);
    expect(acceptsRestart(TUNING.restartDelay + 0.1, true)).toBe(true);
    expect(acceptsRestart(TUNING.restartDelay + 0.1, false)).toBe(false);
    expect(acceptsRestart(null, true)).toBe(false);
  });
  it('recreates identical initial state for the same seed and room', () => {
    const initial = createSim(42, startRoom);
    expect(createSim(42, startRoom)).toEqual(initial);
  });
});

it('raises telegraph opacity through windup, peaks in active, and hides recovery', () => {
  const start = enemyTelegraphOpacity('windup', 0), half = enemyTelegraphOpacity('windup', 0.5);
  const end = enemyTelegraphOpacity('windup', 1), active = enemyTelegraphOpacity('active', 1);
  expect(start).toBeGreaterThan(0);
  expect(half).toBeGreaterThan(start);
  expect(end).toBeGreaterThan(half);
  expect(active).toBeGreaterThan(end);
  expect(enemyTelegraphOpacity('recovery', 1)).toBe(0);
});

it('fills the health bar at full, 70 percent and zero health', () => {
  expect(healthFillWidth(100, 100, 200)).toBe(200);
  expect(healthFillWidth(70, 100, 200)).toBe(140);
  expect(healthFillWidth(0, 100, 200)).toBe(0);
});
