import { CHASER } from '../data/enemies';
import { STEP_SECONDS, TUNING } from '../data/tuning';
import { applyHit } from './damage';
import { makeSector, sectorHitsCircle } from './sector';
import { nextFloat } from './rng';
import { moveCircle, resolveCircle } from './collision';
import type { ChaserAI, Entity, SimEvent, SimState } from './types';

export function createChaserAI(): ChaserAI {
  return { kind: 'chaser', state: { kind: 'idle' }, cooldown: 0, waited: 0, detour: null, lastSide: null };
}

/** Three passes keep phase advancement, attack grants, and movement independent. */
export function updateEnemies(state: SimState, player: Entity, frozen: ReadonlySet<number>): void {
  const enemies = state.entities.filter(e => e.ai && !e.defeated && !frozen.has(e.id));
  for (const e of enemies) {
    const ai = e.ai!;
    if (ai.cooldown > 0) ai.cooldown -= 1;
    const a = ai.state;
    if (a.kind === 'attack') {
      a.ticksLeft -= 1;
      if (a.ticksLeft <= 0) {
        if (a.phase === 'windup') { a.phase = 'active'; a.ticksLeft = CHASER.attack.active; }
        else if (a.phase === 'active') { a.phase = 'recovery'; a.ticksLeft = CHASER.attack.recovery; }
        else { ai.state = { kind: 'pursue' }; ai.cooldown = CHASER.cooldown; }
      }
    } else if (a.kind === 'stagger') {
      a.ticksLeft -= 1;
      if (a.ticksLeft <= 0) ai.state = { kind: 'pursue' };
    } else if (a.kind === 'idle' && distance(e, player) <= CHASER.noticeRange) ai.state = { kind: 'pursue' };
  }
  let attacking = state.entities.filter(e => !e.defeated && isAttacking(e)).length;
  const ready = enemies.filter(e => {
    const ai = e.ai!;
    const eligible = ai.state.kind === 'pursue' && ai.cooldown === 0 && distance(e, player) <= CHASER.attackDistance + 1e-6;
    if (!eligible) ai.waited = 0;
    return eligible;
  }).sort((a, b) => b.ai!.waited - a.ai!.waited || a.id - b.id);
  for (const e of ready) {
    const ai = e.ai!;
    if (attacking >= TUNING.attackerLimit) { ai.waited += 1; continue; }
    const dir = Math.atan2(player.pos.y - e.pos.y, player.pos.x - e.pos.x);
    ai.state = { kind: 'attack', phase: 'windup', ticksLeft: CHASER.attack.windup, dir, hasHit: false };
    e.facing = dir;
    ai.detour = null;
    ai.waited = 0;
    attacking += 1;
  }
  for (const e of enemies) {
    const a = e.ai!.state;
    if (a.kind === 'pursue') {
      e.facing = Math.atan2(player.pos.y - e.pos.y, player.pos.x - e.pos.x);
      const travel = Math.min(CHASER.speed * STEP_SECONDS, Math.max(0, distance(e, player) - CHASER.attackDistance));
      pursue(state, e, travel);
    } else if (a.kind === 'attack' && a.phase === 'active') {
      const lunge = CHASER.attack.lunge / CHASER.attack.active;
      moveCircle(e.pos, Math.cos(a.dir) * lunge, Math.sin(a.dir) * lunge, e.radius, state.room);
    }
  }
}

function distance(a: Entity, b: Entity): number {
  return Math.hypot(a.pos.x - b.pos.x, a.pos.y - b.pos.y);
}

function pursue(state: SimState, e: Entity, travel: number): void {
  const ai = e.ai!;
  if (travel <= 0) return;
  const detour = ai.detour;
  const dir = e.facing + (detour ? detour.side * CHASER.detourAngle : 0);
  const before = { ...e.pos };
  moveCircle(e.pos, Math.cos(dir) * travel, Math.sin(dir) * travel, e.radius, state.room);
  const dx = e.pos.x - before.x, dy = e.pos.y - before.y;
  const blocked = Math.hypot(dx, dy) < travel * 0.5;
  if (detour) {
    detour.ticksLeft -= 1;
    if (blocked) {
      detour.side = detour.side === 1 ? -1 : 1;
      detour.ticksLeft = CHASER.detourTicks;
      ai.lastSide = detour.side;
    } else if (detour.ticksLeft <= 0) ai.detour = null;
  } else if (blocked) {
    const slide = Math.cos(e.facing) * dy - Math.sin(e.facing) * dx;
    const side = ai.lastSide ?? (Math.abs(slide) > 1e-6 ? (slide > 0 ? 1 : -1) : (nextFloat(state.rng) < 0.5 ? -1 : 1));
    ai.detour = { side, ticksLeft: CHASER.detourTicks };
    ai.lastSide = side;
  }
}

/** Two positional passes; frozen entities act as immovable obstacles. */
export function separateEnemies(state: SimState, frozen: ReadonlySet<number>): void {
  const enemies = state.entities.filter(e => e.ai && !e.defeated);
  const fixed = state.entities.filter(e => !e.ai && !e.defeated && e.solid);
  const pushOut = (e: Entity, other: Entity, fraction: number) => {
    const dx = e.pos.x - other.pos.x, dy = e.pos.y - other.pos.y;
    const d = Math.hypot(dx, dy), min = e.radius + other.radius;
    if (d >= min) return;
    const nx = d > 0 ? dx / d : (e.id < other.id ? -1 : 1);
    const ny = d > 0 ? dy / d : 0;
    e.pos.x += nx * (min - d) * fraction;
    e.pos.y += ny * (min - d) * fraction;
  };
  for (let pass = 0; pass < 2; pass++) {
    for (const e of enemies) {
      if (frozen.has(e.id)) continue;
      for (const other of fixed) pushOut(e, other, 1);
    }
    for (let i = 0; i < enemies.length; i++) {
      for (let j = i + 1; j < enemies.length; j++) {
        const a = enemies[i], b = enemies[j];
        const af = frozen.has(a.id), bf = frozen.has(b.id);
        if (af && bf) continue;
        if (af) pushOut(b, a, 1);
        else if (bf) pushOut(a, b, 1);
        else {
          const before = { ...a.pos };
          pushOut(a, b, 0.5);
          b.pos.x -= a.pos.x - before.x;
          b.pos.y -= a.pos.y - before.y;
        }
      }
    }
    for (const e of enemies) {
      if (frozen.has(e.id)) continue;
      // Pair correction must never transfer an enemy's movement to the player.
      for (const other of fixed) pushOut(e, other, 1);
      resolveCircle(e.pos, e.radius, state.room);
    }
  }
}

/** Only the player is a candidate; a successful hit consumes this swing. */
export function resolveEnemyHits(state: SimState, player: Entity, frozen: ReadonlySet<number>, events: SimEvent[]): void {
  for (const e of state.entities) {
    const a = e.ai?.state;
    if (e.defeated || frozen.has(e.id) || a?.kind !== 'attack' || a.phase !== 'active' || a.hasHit) continue;
    const sector = makeSector(e.pos, a.dir, CHASER.attack.range, CHASER.attack.angle);
    if (!sectorHitsCircle(sector, player.pos, player.radius)) continue;
    const hits = applyHit(state, e.pos, player.id, CHASER.attack, e.id);
    if (hits.length > 0) a.hasHit = true;
    events.push(...hits);
  }
}

export function isAttacking(e: Entity): boolean {
  const a = e.ai?.state;
  return a?.kind === 'attack' && a.phase !== 'recovery';
}

/** Behaviour reaction kept separate from damage arithmetic. */
export function staggerEnemy(e: Entity): void {
  if (!e.ai) return;
  e.ai.state = { kind: 'stagger', ticksLeft: CHASER.stagger };
  e.ai.waited = 0;
  e.ai.detour = null;
}
