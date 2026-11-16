import { STEP_SECONDS, TUNING } from '../data/tuning';
import { WEAPON } from '../data/weapons';
import { moveCircle, resolveCircle } from './collision';
import { applyHit } from './damage';
import { makeSector, sectorHitsCircle } from './sector';
import type { Entity, InputIntent, PlayerCombat, SimEvent, SimState } from './types';

const SEPARATION_PASSES = 4;

export function createPlayerCombat(): PlayerCombat {
  return {
    action: { kind: 'idle' },
    comboIndex: 0,
    comboTicksLeft: 0,
    dashCooldown: 0,
    attackBuffer: 0,
    dashBuffer: 0,
    attackWasHeld: false,
    dashWasHeld: false,
  };
}

/** Turns held input into presses and remembers them. Runs even during hitstop. */
export function readPresses(c: PlayerCombat, intent: InputIntent): void {
  if (intent.attack && !c.attackWasHeld) c.attackBuffer = TUNING.inputBuffer;
  if (intent.dash && !c.dashWasHeld) c.dashBuffer = TUNING.inputBuffer;
  c.attackWasHeld = intent.attack;
  c.dashWasHeld = intent.dash;
}

/** Counts down the timers that gate starting an action. */
export function countDownPlayerTimers(c: PlayerCombat): void {
  if (c.dashCooldown > 0) c.dashCooldown -= 1;
  if (c.comboTicksLeft > 0) c.comboTicksLeft -= 1;
}

/** Moves the current action to this step's phase, ending it when it is done. */
function advanceAction(c: PlayerCombat, player: Entity): void {
  const a = c.action;
  if (a.kind === 'attack') {
    a.ticksLeft -= 1;
    if (a.ticksLeft > 0) return;
    const def = WEAPON[a.index];
    if (a.phase === 'windup') {
      a.phase = 'active';
      a.ticksLeft = def.active;
    } else if (a.phase === 'active') {
      a.phase = 'recovery';
      a.ticksLeft = def.recovery;
    } else {
      const next = a.index + 1;
      c.comboIndex = next < WEAPON.length ? next : 0;
      c.comboTicksLeft = next < WEAPON.length ? TUNING.comboWindow : 0;
      c.action = { kind: 'idle' };
    }
  } else if (a.kind === 'dash') {
    a.ticksLeft -= 1;
    if (a.ticksLeft > 0) return;
    c.action = { kind: 'idle' };
    player.invulnerable = false;
    c.dashCooldown = TUNING.dashCooldown;
  }
}

function tryDash(c: PlayerCombat, player: Entity, intent: InputIntent, events: SimEvent[]): void {
  if (c.dashBuffer <= 0 || c.dashCooldown > 0 || c.action.kind === 'dash') return;

  let dirX = intent.moveX;
  let dirY = intent.moveY;
  const len = Math.hypot(dirX, dirY);
  if (len > 0) {
    dirX /= len;
    dirY /= len;
  } else {
    dirX = Math.cos(player.facing);
    dirY = Math.sin(player.facing);
  }

  if (c.action.kind === 'attack') {
    // Cancelling an attack ends it and restarts the combo.
    c.comboIndex = 0;
    c.comboTicksLeft = 0;
  }
  c.action = { kind: 'dash', ticksLeft: TUNING.dashDuration, dirX, dirY };
  c.dashBuffer = 0;
  player.invulnerable = true;
  events.push({ type: 'dashStart', entityId: player.id, dirX, dirY });
}

function tryAttack(c: PlayerCombat, player: Entity, intent: InputIntent, events: SimEvent[]): void {
  if (c.action.kind !== 'idle') return;
  if (!intent.attack && c.attackBuffer <= 0) return;

  const index = c.comboTicksLeft > 0 ? c.comboIndex : 0;
  const dir = intent.aim;
  c.action = { kind: 'attack', index, phase: 'windup', ticksLeft: WEAPON[index].windup, dir, hitIds: [] };
  c.comboTicksLeft = 0;
  c.attackBuffer = 0;
  player.facing = dir;
  events.push({ type: 'attackStart', entityId: player.id, index, dir });
}

function movePlayer(c: PlayerCombat, player: Entity, intent: InputIntent, state: SimState): void {
  const a = c.action;
  const room = state.room;

  if (a.kind === 'dash') {
    const perStep = TUNING.dashDistance / TUNING.dashDuration;
    moveCircle(player.pos, a.dirX * perStep, a.dirY * perStep, player.radius, room);
    return;
  }

  let dx = 0;
  let dy = 0;
  let mx = intent.moveX;
  let my = intent.moveY;
  const len2 = mx * mx + my * my;
  if (len2 > 0) {
    if (len2 > 1) {
      const len = Math.sqrt(len2);
      mx /= len;
      my /= len;
    }
    const fraction = a.kind === 'attack' ? TUNING.attackMoveFraction : 1;
    const dist = TUNING.moveSpeed * fraction * STEP_SECONDS;
    dx += mx * dist;
    dy += my * dist;
  }

  if (a.kind === 'attack' && a.phase === 'active') {
    const def = WEAPON[a.index];
    const lunge = def.lunge / def.active;
    dx += Math.cos(a.dir) * lunge;
    dy += Math.sin(a.dir) * lunge;
  }

  if (dx === 0 && dy === 0) return;
  player.pos.x += dx;
  player.pos.y += dy;
  resolveCircle(player.pos, player.radius, room);
}

/**
 * The player's part of a step: advance the current action, try a dash, then
 * an attack, set facing, and move. Dash is tried first so it wins a tie and
 * can cancel an attack.
 */
export function updatePlayer(state: SimState, player: Entity, intent: InputIntent, events: SimEvent[]): void {
  const c = state.player;
  advanceAction(c, player);
  if (c.action.kind !== 'attack') player.facing = intent.aim;
  tryDash(c, player, intent, events);
  tryAttack(c, player, intent, events);
  movePlayer(c, player, intent, state);

  // A remembered press stays valid for `inputBuffer` steps, counting the step it was made.
  if (c.attackBuffer > 0) c.attackBuffer -= 1;
  if (c.dashBuffer > 0) c.dashBuffer -= 1;
}

/** Hits every target inside the active attack's sector that it has not hit yet. */
export function resolvePlayerHits(state: SimState, player: Entity, events: SimEvent[]): void {
  const a = state.player.action;
  if (a.kind !== 'attack' || a.phase !== 'active') return;

  const def = WEAPON[a.index];
  const sector = makeSector(player.pos, a.dir, def.range, def.angle);
  for (const e of state.entities) {
    if (e === player || e.defeated || e.maxHealth <= 0 || a.hitIds.includes(e.id)) continue;
    if (!sectorHitsCircle(sector, e.pos, e.radius)) continue;
    a.hitIds.push(e.id);
    events.push(...applyHit(state, player.pos, e.id, def, player.id));
  }
}

/**
 * Moves the player out of every solid, undefeated entity without moving the
 * other entity, then resolves walls again. Skipped while dashing, so a dash
 * passes through.
 */
export function separatePlayer(state: SimState, player: Entity): void {
  if (state.player.action.kind === 'dash') return;

  for (let pass = 0; pass < SEPARATION_PASSES; pass++) {
    let moved = false;
    for (const e of state.entities) {
      if (e === player || !e.solid || e.defeated) continue;
      let dx = player.pos.x - e.pos.x;
      let dy = player.pos.y - e.pos.y;
      const min = player.radius + e.radius;
      const d2 = dx * dx + dy * dy;
      if (d2 >= min * min) continue;
      const d = Math.sqrt(d2);
      if (d > 0) {
        dx /= d;
        dy /= d;
      } else {
        dx = Math.cos(player.facing + Math.PI);
        dy = Math.sin(player.facing + Math.PI);
      }
      player.pos.x = e.pos.x + dx * min;
      player.pos.y = e.pos.y + dy * min;
      moved = true;
    }
    if (!moved) break;
    resolveCircle(player.pos, player.radius, state.room);
  }
}
