import type { Room, Vec2 } from '../data/room';
import { TUNING } from '../data/tuning';
import { WEAPON } from '../data/weapons';
import { integrateKnockback, updateRespawns } from './damage';
import {
  countDownPlayerTimers,
  createPlayerCombat,
  readPresses,
  resolvePlayerHits,
  separatePlayer,
  updatePlayer,
} from './player';
import { createRng } from './rng';
import { loadRoom } from './room';
import type { AttackPhase, Entity, EntityKind, InputIntent, SimEvent, SimState } from './types';

export type {
  AttackPhase,
  Entity,
  EntityKind,
  InputIntent,
  PlayerAction,
  PlayerCombat,
  SimEvent,
  SimState,
} from './types';
export { NO_INPUT } from './types';

function createEntity(id: number, kind: EntityKind, pos: Vec2, radius: number, health: number): Entity {
  return {
    id,
    kind,
    pos: { ...pos },
    prevPos: { ...pos },
    z: 0,
    facing: 0,
    radius,
    vel: { x: 0, y: 0 },
    health,
    maxHealth: health,
    defeated: false,
    invulnerable: false,
    solid: true,
    home: kind === 'dummy' ? { ...pos } : null,
    respawnTicks: 0,
  };
}

/** Creates a simulation in the given room with the player at its spawn point and its dummies placed. */
export function createSim(seed: number, roomDef: Room): SimState {
  const room = loadRoom(roomDef);
  const player = createEntity(1, 'player', room.spawn, TUNING.playerRadius, TUNING.playerHealth);
  const dummies = room.dummies.map((p, i) => createEntity(2 + i, 'dummy', p, TUNING.dummyRadius, TUNING.dummyHealth));
  return {
    tick: 0,
    rng: createRng(seed),
    room,
    entities: [player, ...dummies],
    playerId: player.id,
    player: createPlayerCombat(),
    hitstop: 0,
  };
}

export function getPlayer(state: SimState): Entity {
  const player = state.entities.find((e) => e.id === state.playerId);
  if (!player) throw new Error('Simulation has no player entity');
  return player;
}

/** The hit area of the player's current attack, as the view should draw it. */
export interface AttackArea {
  index: number;
  phase: AttackPhase;
  apex: Vec2;
  /** Direction in radians from +x. */
  dir: number;
  range: number;
  /** Full opening angle in radians. */
  angle: number;
}

export function attackArea(state: SimState): AttackArea | null {
  const a = state.player.action;
  if (a.kind !== 'attack') return null;
  const def = WEAPON[a.index];
  const p = getPlayer(state).pos;
  return { index: a.index, phase: a.phase, apex: { x: p.x, y: p.y }, dir: a.dir, range: def.range, angle: def.angle };
}

/**
 * Advances the simulation by exactly one fixed step and returns the gameplay
 * events that occurred in it.
 */
export function step(state: SimState, intent: InputIntent): SimEvent[] {
  const events: SimEvent[] = [];
  for (const e of state.entities) {
    e.prevPos.x = e.pos.x;
    e.prevPos.y = e.pos.y;
  }

  // Presses are read even while frozen so they can be buffered.
  readPresses(state.player, intent);

  if (state.hitstop > 0) {
    state.hitstop -= 1;
    state.tick += 1;
    return events;
  }

  countDownPlayerTimers(state.player);
  updateRespawns(state);

  const player = getPlayer(state);
  updatePlayer(state, player, intent, events);
  resolvePlayerHits(state, player, events);
  integrateKnockback(state);
  separatePlayer(state, player);

  state.tick += 1;
  return events;
}
