import type { Room, Vec2 } from '../data/room';
import type { Rng } from './rng';

/** Device-independent input for one simulation step. */
export interface InputIntent {
  /** Move direction. Length above 1 is treated as 1. */
  moveX: number;
  moveY: number;
  /** Aim angle in radians from +x, in world space (y grows down-screen). */
  aim: number;
  /** Attack input is held. The simulation detects new presses itself. */
  attack: boolean;
  /** Dash input is held. The simulation detects new presses itself. */
  dash: boolean;
}

export const NO_INPUT: InputIntent = { moveX: 0, moveY: 0, aim: 0, attack: false, dash: false };

export type EntityKind = 'player' | 'dummy' | 'chaser';

export interface ChaserAI {
  kind: 'chaser';
  state: { kind: 'idle' } | { kind: 'pursue' }
    | { kind: 'attack'; phase: AttackPhase; ticksLeft: number; dir: number; hasHit: boolean }
    | { kind: 'stagger'; ticksLeft: number };
  cooldown: number;
  waited: number;
  detour: { side: -1 | 1; ticksLeft: number } | null;
  lastSide: -1 | 1 | null;
}

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
  /** Knockback velocity in world units per second. */
  vel: Vec2;
  health: number;
  maxHealth: number;
  /** At zero health. Defeated entities are not hit, pushed, or collided with. */
  defeated: boolean;
  /** Hits against an invulnerable entity have no effect. */
  invulnerable: boolean;
  /** Blocks the player's movement. */
  solid: boolean;
  /** Where a defeated entity reappears, or null if it never does. */
  home: Vec2 | null;
  /** Steps until a defeated entity reappears. */
  respawnTicks: number;
  respawnDelay: number;
  hitstop: number;
  ai: ChaserAI | null;
}

export type AttackPhase = 'windup' | 'active' | 'recovery';

export type PlayerAction =
  | { kind: 'idle' }
  | {
      kind: 'attack';
      /** Position in the weapon's combo. */
      index: number;
      phase: AttackPhase;
      /** Steps left in the current phase, counting the current step. */
      ticksLeft: number;
      /** Attack direction, locked when the attack starts. */
      dir: number;
      /** Entities this attack has already hit. */
      hitIds: number[];
    }
  | { kind: 'dash'; ticksLeft: number; dirX: number; dirY: number };

/** The player's action state machine and its timers, all in steps. */
export interface PlayerCombat {
  action: PlayerAction;
  /** Which attack of the combo comes next, while `comboTicksLeft` is above zero. */
  comboIndex: number;
  /** Steps left in which the next attack continues the combo. */
  comboTicksLeft: number;
  dashCooldown: number;
  attackBuffer: number;
  dashBuffer: number;
  attackWasHeld: boolean;
  dashWasHeld: boolean;
}

export interface SimState {
  tick: number;
  rng: Rng;
  room: Room;
  entities: Entity[];
  playerId: number;
  player: PlayerCombat;
}

/** Gameplay events reported by a step. Not part of the simulation state. */
export type SimEvent =
  | { type: 'attackStart'; entityId: number; index: number; dir: number }
  | { type: 'dashStart'; entityId: number; dirX: number; dirY: number }
  | {
      type: 'hit';
      sourceId: number | null;
      targetId: number;
      damage: number;
      /** Target's ground position when hit. */
      pos: Vec2;
      hitstop: number;
    }
  | { type: 'defeated'; targetId: number; pos: Vec2 };
