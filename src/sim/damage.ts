import type { Vec2 } from '../data/room';
import { STEP_SECONDS, TUNING } from '../data/tuning';
import { moveCircle } from './collision';
import type { SimEvent, SimState } from './types';

/** What a single hit does to its target. */
export interface HitSpec {
  damage: number;
  /** Knockback speed in world units per second. */
  knockback: number;
  /** Steps of global pause when the hit lands. */
  hitstop: number;
}

/**
 * The only way health changes. Ignores missing, defeated, invulnerable, and
 * health-less targets. Otherwise reduces health (not below zero), pushes the
 * target directly away from `sourcePos`, raises the hitstop, and reports a
 * `hit` event, plus `defeated` when health reaches zero.
 */
export function applyHit(
  state: SimState,
  sourcePos: Vec2,
  targetId: number,
  hit: HitSpec,
  sourceId: number | null = null,
): SimEvent[] {
  const target = state.entities.find((e) => e.id === targetId);
  if (!target || target.defeated || target.invulnerable || target.maxHealth <= 0) return [];

  const pos = { x: target.pos.x, y: target.pos.y };
  target.health = Math.max(0, target.health - hit.damage);

  let dx = target.pos.x - sourcePos.x;
  let dy = target.pos.y - sourcePos.y;
  const len = Math.hypot(dx, dy);
  if (len > 0) {
    dx /= len;
    dy /= len;
  } else {
    dx = 1;
    dy = 0;
  }
  target.vel.x = dx * hit.knockback;
  target.vel.y = dy * hit.knockback;

  state.hitstop = Math.max(state.hitstop, hit.hitstop);

  const events: SimEvent[] = [
    { type: 'hit', sourceId, targetId, damage: hit.damage, pos, hitstop: hit.hitstop },
  ];

  if (target.health === 0) {
    target.defeated = true;
    target.vel.x = 0;
    target.vel.y = 0;
    target.respawnTicks = target.home ? TUNING.dummyRespawn : 0;
    events.push({ type: 'defeated', targetId, pos: { ...pos } });
  }
  return events;
}

/** Moves every pushed entity by its knockback velocity, then slows it down. */
export function integrateKnockback(state: SimState): void {
  for (const e of state.entities) {
    if (e.defeated || (e.vel.x === 0 && e.vel.y === 0)) continue;
    moveCircle(e.pos, e.vel.x * STEP_SECONDS, e.vel.y * STEP_SECONDS, e.radius, state.room);
    e.vel.x *= TUNING.knockbackDecay;
    e.vel.y *= TUNING.knockbackDecay;
    if (Math.hypot(e.vel.x, e.vel.y) < TUNING.knockbackStopSpeed) {
      e.vel.x = 0;
      e.vel.y = 0;
    }
  }
}

/** Counts down respawn timers and restores defeated entities at their home. */
export function updateRespawns(state: SimState): void {
  for (const e of state.entities) {
    if (!e.defeated || !e.home) continue;
    e.respawnTicks -= 1;
    if (e.respawnTicks > 0) continue;
    e.respawnTicks = 0;
    e.defeated = false;
    e.health = e.maxHealth;
    e.pos.x = e.prevPos.x = e.home.x;
    e.pos.y = e.prevPos.y = e.home.y;
    e.vel.x = 0;
    e.vel.y = 0;
  }
}
