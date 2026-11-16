# Game Design

The scope of the whole game, from what is playable today to what a finished version contains.

Each part is marked with where it stands:

| Mark | Meaning |
|---|---|
| **Built** | In the game now |
| **Slice** | Agreed for the first milestone, the vertical slice |
| **Proposed** | Suggested for the full game; not yet agreed, and open to change |

Everything marked Proposed is a starting point for discussion, sized so the game stays finishable by a small team. Nothing here overrides the specs in `openspec/`; when a part is built, its requirements are written there.

## Vision

A fast, readable action game played in short runs. You fight through a chain of small rooms, choose upgrades that change how you fight, die, come back a little stronger and a little wiser, and go again.

The theme, world, characters, and names are original and still to be chosen. The genre and its mechanics are the reference point.

### Pillars

1. **Combat feels good on its own.** Hitting, dodging, and moving must be satisfying against a single stationary target before anything else is added.
2. **Everything is readable.** Every attack, the player's and the enemies', is telegraphed by a shape that matches what it will hit.
3. **Choices change how you play.** An upgrade should alter what you do with your hands, not only make a number bigger.
4. **Runs are short and different.** A run fits in a sitting, and two runs in a row should not feel the same.
5. **Small enough to finish.** Content is added only when the existing content is fun.

## The loops

```
  MOMENT (seconds)        attack, dash, reposition, read a telegraph
       |
       v
  ROOM (1-2 minutes)      doors lock -> waves -> clear -> reward -> choose a door
       |
       v
  RUN (15-25 minutes)     a chain of rooms through several areas, ending in a boss
       |
       v
  META (hours)            return to the hub, spend what you kept, unlock, go again
```

| Loop | Status |
|---|---|
| Moment | **Built** against training dummies and chasers |
| Room | **Slice** |
| Run | **Slice** as five rooms; **Proposed** at full length |
| Meta | **Slice** as one currency and a few upgrades; **Proposed** in full |

## The player

### Core actions

| Action | Description | Status |
|---|---|---|
| Move | Eight-way movement at constant speed | **Built** |
| Aim | Free 360-degree aim with the mouse | **Built** |
| Attack | Three-hit melee combo ending in a finisher | **Built** |
| Dash | Fast burst with invulnerability; cancels attacks | **Built** |
| Special | A second attack with a different shape and a cost or cooldown | **Slice** |
| Health | A health pool and fixed display; zero stops play, then a fresh press restarts the room | **Built** |
| Cast / ranged option | A limited ranged attack | **Proposed** |

The rules for the built actions are in [combat.md](combat.md).

### Weapons

A weapon defines the attack combo and the special. The weapon is chosen before a run and kept for all of it.

| Weapon | Character | Status |
|---|---|---|
| Blade | Balanced three-hit combo, wide finisher | **Built** (the current combo) |
| Heavy weapon | Slow, long reach, large knockback, charge attack | **Proposed** |
| Paired light weapon | Fast, short reach, long combo, dash strike | **Proposed** |
| Ranged weapon | Projectiles, keeps distance, weak up close | **Proposed** |

Proposed full-game total: four weapons. Each is a data definition plus, where needed, a small amount of new behavior.

## Enemies

### Principles

- Every enemy attack has a windup drawn as the shape it will hit.
- Only a limited number of enemies attack at once.
- Each type asks a different question of the player: close the gap, dodge on time, pick a target, hold position.

### Roster

| Type | Asks the player to... | Status |
|---|---|---|
| Chaser | Deal with pressure at close range | **Built** |
| Shooter | Close distance or dodge projectiles | **Slice** |
| Charger | Dodge sideways at the right moment | **Slice** |
| Mini-boss | Use everything learned so far | **Slice** |
| Shielded | Attack from the side or behind | **Proposed** |
| Summoner | Pick the right target first | **Proposed** |
| Bomber | Keep moving; area denial | **Proposed** |
| Leaper | Watch the landing marker | **Proposed** |
| Turret | Use cover and line of sight | **Proposed** |
| Elite variants | Handle a stronger version with one added trait | **Proposed** |
| Area bosses | Learn a multi-phase pattern | **Proposed** |

Proposed full-game total: about ten regular types, elite variants of most, and three area bosses.

## Rooms and runs

### Rooms

Rooms are hand-authored layouts. Encounters, rewards, and the order of rooms vary; the walls do not.

| Room type | What happens | Status |
|---|---|---|
| Test room | Walls, training dummies and four chasers | **Built** |
| Combat | Doors lock, enemies arrive in waves, a reward appears when cleared | **Slice** |
| Reward choice | Pick one of three upgrades | **Slice** |
| Boss | A single large fight | **Slice** (mini-boss) |
| Elite combat | Harder fight, better reward | **Proposed** |
| Shop | Spend run currency on upgrades or healing | **Proposed** |
| Rest | Heal or improve an upgrade, with no fight | **Proposed** |
| Hub | The safe place between runs | **Slice** as a screen; **Proposed** as a walkable room |

### Choosing the path

After a room is cleared, its exits show what the next room offers. Where there are two exits the player picks one. **Slice** has a fixed sequence; **Proposed** adds the choice.

### Run structure

| | Slice | Proposed full game |
|---|---|---|
| Areas | 1 | 3, each with its own enemies, hazards, and look |
| Rooms per run | 5 | About 24: three areas of about 8 rooms |
| Bosses | 1 mini-boss | 3 area bosses |
| Run length | 5 to 8 minutes | 15 to 25 minutes |
| Room layouts | About 5 | About 30 |
| Hazards | None | Area-specific: traps, damaging floor, moving obstacles |

## Upgrades

Called boons in the project's plans.

### How they work

- Offered three at a time as a room reward; the player takes one.
- Each belongs to a slot: attack, dash, special, or passive. Taking a second boon for an occupied slot replaces the first.
- A boon either changes a value (damage, range, cooldown, dash distance) or adds a behavior that reacts to something happening (on hit, on dash, on defeat).
- All boons are lost at the end of the run.

| Feature | Status |
|---|---|
| Eight to ten boons across attack, dash, and special | **Slice** |
| Three offered at a time | **Slice** |
| Rarity tiers that scale a boon's strength | **Proposed** |
| Families of boons sharing a status effect (for example burn, chill, shock, mark) | **Proposed** |
| Combination boons that need two families | **Proposed** |
| Upgrading a boon already held | **Proposed** |
| Rerolling an offer | **Proposed** |

Proposed full-game total: about 40 boons in four families, plus about eight combinations.

### Other things found during a run

| Item | Purpose | Status |
|---|---|---|
| Healing | Restore health between rooms | **Proposed** |
| Run currency | Spent in shops; lost when the run ends | **Proposed** |
| Maximum health increase | A room reward | **Proposed** |
| Meta currency | Kept after the run; spent in the hub | **Slice** |

## Progression between runs

| Feature | Status |
|---|---|
| One currency kept between runs | **Slice** |
| Three or four permanent upgrades (for example health, damage, an extra dash) | **Slice** |
| Progress saved in the browser | **Slice** |
| Unlocking weapons | **Proposed** |
| A larger tree of permanent upgrades, about 12 | **Proposed** |
| Optional difficulty modifiers chosen before a run, for greater reward | **Proposed** |
| A record of enemies met, boons found, and best runs | **Proposed** |
| Short story beats delivered in the hub between runs | **Proposed** |

Death is the normal way a run ends. The player always returns with something.

## Screens and interface

| Screen or element | Status |
|---|---|
| Debug overlay | **Built** |
| Health bars over damaged targets | **Built** |
| Player health display | **Built** in the lower left, fixed through camera movement and shake |
| Boon choice screen | **Slice** |
| Death screen | **Built** with delayed room restart; **Slice** for returning to the hub |
| Hub upgrade screen | **Slice** |
| Dash cooldown and special readiness indicators | **Proposed** |
| Title screen | **Proposed** |
| Pause menu with settings: volume, key bindings, screen shake strength | **Proposed** |
| Run summary: rooms cleared, boons held, time | **Proposed** |
| Victory screen | **Proposed** |
| Door reward icons | **Proposed** |

## Look and sound

| Aspect | Now | Later |
|---|---|---|
| View | 3/4 oblique, flat simulation | Same. True isometric is possible by changing one projection file and the art. |
| Characters | Placeholder shapes | **Proposed:** free asset packs first, then a consistent style once the theme is chosen |
| Attack visuals | Drawn arcs that match hit areas | Kept, even with sprites; they are the telegraphs |
| Effects | Hit flash, screen shake, dash trail | **Proposed:** particles, damage numbers as an option |
| Sound | None | **Proposed:** hit, swing, dash, enemy telegraph, and interface sounds |
| Music | None | **Proposed:** one track per area and one for the hub |

## Platform

| | Decision | Status |
|---|---|---|
| Target | Desktop browsers | **Built** |
| Input | Keyboard and mouse | **Built** |
| Frame rate | 60 simulation steps per second at any display rate | **Built** |
| Resolution | 1280 x 720, scaled to fit the window | **Built** |
| Saving | Local browser storage, with a version number | **Slice** |
| Gamepad | Supported by the input design; not yet mapped | **Proposed** |
| Touch and mobile | Not planned | |

## Content at a glance

| | Now | Slice | Proposed full game |
|---|---|---|---|
| Weapons | 1 | 1 | 4 |
| Enemy types | 1 (chaser), plus dummies | 3 and a mini-boss | About 10, with elites |
| Bosses | 0 | 1 mini-boss | 3 |
| Areas | 1 test room | 1 | 3 |
| Room layouts | 1 | About 5 | About 30 |
| Rooms per run | | 5 | About 24 |
| Boons | 0 | 8 to 10 | About 40, plus combinations |
| Permanent upgrades | 0 | 3 to 4 | About 12 |
| Run length | | 5 to 8 minutes | 15 to 25 minutes |

## Not in scope

These are left out on purpose. Any of them would be a new decision.

- Multiplayer or co-op.
- Procedurally generated room layouts.
- Voice acting or long written dialogue.
- Mobile and touch controls.
- Accounts, cloud saves, or leaderboards.
- Any form of payment or advertising.
- A level editor for players.

## Design questions still open

| Question | Why it matters |
|---|---|
| What is the theme and setting? | It names everything and guides art, enemies, and boon families |
| Is the full-game size above right, or should it stop at the slice plus a little? | It sets how long the project runs |
| What is the special attack? | It completes the player's kit and is needed for the slice |
| Does a replaced boon give anything back? | It affects how risky a choice feels |
| How does the player heal during a run? | It sets how punishing a run is |
| Is there an ending, or do runs repeat with rising difficulty? | It decides what the last third of the meta game is |
| Should there be a story at all? | It is the easiest part to cut and the hardest to add late |
