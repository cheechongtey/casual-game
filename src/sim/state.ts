import type { Room, Vec2 } from '../data/room';
import { STEP_SECONDS, TUNING } from '../data/tuning';
import { resolveCircle } from './collision';
import { createRng, type Rng } from './rng';
import { loadRoom } from './room';

/** Device-independent input for one simulation step. */
export interface InputIntent {
  /** Move direction. Length above 1 is treated as 1. */
  moveX: number;
  moveY: number;
  /** Aim angle in radians from +x, in world space (y grows down-screen). */
  aim: number;
}

export type EntityKind = 'player';

export interface Entity {
  id: number;
  kind: EntityKind;
  /** Ground position after the latest step. */
  pos: Vec2;
  /** Ground position before the latest step. */
  prevPos: Vec2;
  /** Height above the ground. */
  z: number;
  /** Facing angle in radians from +x. */
  facing: number;
  radius: number;
}

export interface SimState {
  tick: number;
  rng: Rng;
  room: Room;
  entities: Entity[];
  playerId: number;
}

export const NO_INPUT: InputIntent = { moveX: 0, moveY: 0, aim: 0 };

/** Creates a simulation in the given room with the player at its spawn point. */
export function createSim(seed: number, roomDef: Room): SimState {
  const room = loadRoom(roomDef);
  const player: Entity = {
    id: 1,
    kind: 'player',
    pos: { ...room.spawn },
    prevPos: { ...room.spawn },
    z: 0,
    facing: 0,
    radius: TUNING.playerRadius,
  };
  return { tick: 0, rng: createRng(seed), room, entities: [player], playerId: player.id };
}

export function getPlayer(state: SimState): Entity {
  const player = state.entities.find((e) => e.id === state.playerId);
  if (!player) throw new Error('Simulation has no player entity');
  return player;
}

function movePlayer(player: Entity, intent: InputIntent, room: Room): void {
  player.facing = intent.aim;

  let mx = intent.moveX;
  let my = intent.moveY;
  const len2 = mx * mx + my * my;
  if (len2 === 0) return;
  if (len2 > 1) {
    const len = Math.sqrt(len2);
    mx /= len;
    my /= len;
  }

  const dist = TUNING.moveSpeed * STEP_SECONDS;
  player.pos.x += mx * dist;
  player.pos.y += my * dist;
  resolveCircle(player.pos, player.radius, room);
}

/** Advances the simulation by exactly one fixed step. */
export function step(state: SimState, intent: InputIntent): void {
  for (const e of state.entities) {
    e.prevPos.x = e.pos.x;
    e.prevPos.y = e.pos.y;
  }
  movePlayer(getPlayer(state), intent, state.room);
  state.tick += 1;
}
