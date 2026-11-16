import { describe, expect, it } from 'vitest';
import { TUNING } from '../src/data/tuning';
import { WEAPON } from '../src/data/weapons';
import { advanceFrame, createClock } from '../src/sim/loop';
import { attackArea, createSim, getPlayer, step } from '../src/sim/state';
import { intent, room, run } from './helpers';

describe('entity state', () => {
  it('gives a dummy its respawn delay and no AI', () => {
    const dummy = createSim(1, room([], undefined, [{ x: 700, y: 500 }])).entities[1];
    expect(dummy.respawnDelay).toBe(TUNING.dummyRespawn);
    expect(dummy.ai).toBeNull();
    expect(dummy.hitstop).toBe(0);
  });
  it('gives the player its configured health', () => {
    const player = getPlayer(createSim(1, room()));
    expect(player.health).toBe(TUNING.playerHealth);
    expect(player.maxHealth).toBe(TUNING.playerHealth);
    expect(player.defeated).toBe(false);
  });
});

describe('step events', () => {
  it('reports no events for a quiet step', () => {
    const sim = createSim(1, room([], { x: 500, y: 500 }, [{ x: 700, y: 500 }]));
    expect(step(sim, intent({ moveX: 1 }))).toEqual([]);
  });

  it('reports one hit naming the target, damage, and position', () => {
    const sim = createSim(1, room([], { x: 500, y: 500 }, [{ x: 550, y: 500 }]));
    const events = run(sim, intent({ attack: true }), WEAPON[0].windup + 1);
    const hits = events.filter((e) => e.type === 'hit');
    expect(hits).toEqual([
      { type: 'hit', sourceId: 1, targetId: 2, damage: WEAPON[0].damage, pos: { x: 550, y: 500 }, hitstop: WEAPON[0].hitstop },
    ]);
  });

  it('returns the events of every step run in one display frame', () => {
    const sim = createSim(1, room([], { x: 500, y: 500 }, [{ x: 550, y: 500 }]));
    const attack = intent({ attack: true });
    // Windup takes 4 steps; the hit lands on the next one.
    run(sim, attack, WEAPON[0].windup - 1);
    const frame = advanceFrame(createClock(), sim, attack, 2 / 60);
    expect(frame.steps).toBe(2);
    expect(frame.events.filter((e) => e.type === 'hit')).toHaveLength(1);
  });
});

describe('combat state for the view', () => {
  it('exposes the second attack in its active phase with its direction, range, and angle', () => {
    const sim = createSim(1, room());
    const aim = 0.3;
    // Hold attack through the first attack and into the second one's active phase.
    const first = WEAPON[0].windup + WEAPON[0].active + WEAPON[0].recovery;
    run(sim, intent({ attack: true, aim }), first + WEAPON[1].windup + 1);
    expect(sim.player.action).toMatchObject({ kind: 'attack', index: 1, phase: 'active' });
    expect(attackArea(sim)).toMatchObject({
      index: 1,
      phase: 'active',
      dir: aim,
      range: WEAPON[1].range,
      angle: WEAPON[1].angle,
      apex: getPlayer(sim).pos,
    });
  });

  it('exposes no attack area while idle', () => {
    expect(attackArea(createSim(1, room()))).toBeNull();
  });
});
