/** One attack in the weapon's combo. Durations are in simulation steps. */
export interface AttackDef {
  /** Steps before the attack can hit. */
  windup: number;
  /** Steps during which the attack can hit. */
  active: number;
  /** Steps after the hit window before the player can act again. */
  recovery: number;
  damage: number;
  /** Knockback speed given to the target, in world units per second. */
  knockback: number;
  /** Radius of the hit sector, in world units. */
  range: number;
  /** Full opening angle of the hit sector, in radians. */
  angle: number;
  /** Distance the player moves forward over the active phase, in world units. */
  lunge: number;
  /** Steps the simulation pauses when this attack lands. */
  hitstop: number;
}

const deg = (d: number): number => (d * Math.PI) / 180;

/** The player's melee weapon: a three-attack combo, performed in order. */
export const WEAPON: readonly AttackDef[] = [
  { windup: 4, active: 3, recovery: 8, damage: 20, knockback: 380, range: 72, angle: deg(110), lunge: 10, hitstop: 3 },
  { windup: 4, active: 3, recovery: 8, damage: 20, knockback: 380, range: 72, angle: deg(110), lunge: 10, hitstop: 3 },
  { windup: 7, active: 4, recovery: 14, damage: 40, knockback: 720, range: 84, angle: deg(150), lunge: 18, hitstop: 6 },
];
