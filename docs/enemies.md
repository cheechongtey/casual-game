# Enemies

The chaser is a melee enemy defined in `src/data/enemies.ts`. Rooms place it by kind and ground position. The starting room has four on open ground above the pillars, beyond notice range from spawn.

## States

| State | Behaviour |
|---|---|
| Idle | Stands still until the player is within 420 units, or it is hit |
| Pursue | Faces and approaches the player at 150 units/s, stopping at 56 units |
| Attack | Direction locked at the start; 24 steps windup, 3 active, 30 recovery |
| Stagger | No self-movement or attack for 20 unfrozen steps, then pursuit |

Once noticed, the player remains a target even beyond notice range. Noticing uses distance, including through walls.

## Steering and separation

Pursuit seeks directly through wall collision, which slides along faces. Moving less than half the intended distance starts a 30-step detour at 75° to the seek direction. The first side follows the slide, or uses seeded randomness when square-on. Later detours keep that side; a blocked detour flips it. This handles single rectangular obstacles; concave layouts need future pathfinding.

Two separation passes keep chasers apart and push them out of the player and dummies, then resolve walls. Only enemies move from their own contact; a frozen entity does not move. The player's existing separation still handles player movement into solid entities, except during a dash or hitstop.

## Attacks

Windup and recovery have no self-movement. Active steps lunge a total of 16 units through wall collision. The sector follows the enemy's ground position with a locked direction, 64-unit range and 90° angle. Only the player's circle is tested: each swing deals 10 damage once, with 260 units/s knockback and 4 steps of hitstop for both participants. Dash invulnerability prevents damage. Enemy hits leave the player's action running.

At most two enemies may occupy windup or active. Three passes advance states, grant attacks, then move enemies. Recovery frees a place immediately. Grants go to the longest-waiting ready enemy, then lowest entity id. Readiness requires pursuit, distance at most 56, and no cooldown. Cooldown starts after recovery and lasts 50 steps.

## Being hit and defeated

A hit interrupts any chaser attack, removes its telegraph and restarts stagger. Stagger counts down after hitstop; knockback is its only movement. Hitting an idle enemy also makes it pursue after stagger.

Chasers have 60 health and radius 16. At zero health they disappear, stop blocking and cannot attack. After their 180-step respawn timer they return home with full health, idle AI and zero hitstop. Timers pause during their own hitstop. Player defeat stops all gameplay until a fresh room is created by restart.
