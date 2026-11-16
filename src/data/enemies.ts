import type { AttackDef } from './weapons';

/** Chaser values; durations are simulation steps and distances are world units. */
export const CHASER = {
  health: 60,
  radius: 16,
  speed: 150,
  noticeRange: 420,
  attackDistance: 56,
  attack: {
    windup: 24, active: 3, recovery: 30,
    damage: 10, knockback: 260, hitstop: 4,
    range: 64, angle: Math.PI / 2, lunge: 16,
  } satisfies AttackDef,
  cooldown: 50,
  stagger: 20,
  respawnDelay: 180,
  detourTicks: 30,
  detourAngle: 75 * Math.PI / 180,
} as const;
