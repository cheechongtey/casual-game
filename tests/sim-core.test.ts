import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { startRoom } from '../src/data/rooms/start';
import { createRng, nextFloat } from '../src/sim/rng';
import { createSim, getPlayer, step } from '../src/sim/state';
import { intent } from './helpers';

function draw(seed: number, count: number): number[] {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => nextFloat(rng));
}

describe('seeded generator', () => {
  it('gives identical sequences for the same seed', () => {
    expect(draw(42, 100)).toEqual(draw(42, 100));
  });

  it('gives different sequences for different seeds', () => {
    expect(draw(42, 100)).not.toEqual(draw(43, 100));
  });

  it('stays within [0, 1)', () => {
    for (const v of draw(7, 1000)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('simulation without a display', () => {
  it('is created and stepped with no browser globals present', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const sim = createSim(1, startRoom);
    step(sim, intent({ moveX: 1 }));
    expect(sim.tick).toBe(1);
  });

  it('exposes previous and current positions after a step', () => {
    const sim = createSim(1, startRoom);
    const player = getPlayer(sim);
    const before = { ...player.pos };
    step(sim, intent({ moveX: 1 }));
    expect(player.prevPos).toEqual(before);
    expect(player.pos.x).toBeGreaterThan(before.x);
    expect(player).toMatchObject({ z: 0, facing: 0, radius: expect.any(Number) });
  });
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith('.ts') ? [path] : [];
  });
}

describe('simulation layer boundary', () => {
  const forbidden: [string, RegExp][] = [
    ['imports phaser', /from\s+['"]phaser/],
    ['imports the view or input layer', /from\s+['"]\.\.\/(view|input)\//],
    ['references window', /\bwindow\b/],
    ['references document', /\bdocument\b/],
    ['calls Math.random', /Math\.random/],
    ['calls Date.now', /Date\.now/],
  ];

  it('keeps src/sim free of rendering, browser, and unseeded-random access', () => {
    const files = sourceFiles(join(__dirname, '..', 'src', 'sim'));
    expect(files.length).toBeGreaterThan(0);
    const violations: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const [label, pattern] of forbidden) {
        if (pattern.test(text)) violations.push(`${file} ${label}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
