# Roadmap

## The goal

A browser-based roguelite action game: fast melee combat in small rooms, a run made of rooms chained together, upgrades chosen between rooms that change how you fight, and permanent progression between runs.

The full scope of the game, and what is agreed versus only proposed, is in [game-design.md](game-design.md). This page is the order of work.

## Milestones

| Milestone | Outcome | Status |
|---|---|---|
| 1. Vertical slice | A five-room run that is fun to repeat | In progress: changes 1 to 3 of 6 done |
| 2. Full run | A complete run through three areas with bosses, shops, and path choice | Proposed |
| 3. Depth | More weapons, boon families and combinations, a full set of permanent upgrades | Proposed |
| 4. Finish | Interface, sound, music, art pass, settings, balance | Proposed |

Milestones 2 to 4 are a proposal. They should be re-planned once the slice has been played, because the slice will show which parts of the game deserve more.

## Milestone 1: the vertical slice

A run of five to eight minutes that is fun to repeat ten times.

| Part | Scope |
|---|---|
| Player | One melee weapon with a three-hit combo, a dash, and one special |
| Enemies | A chaser, a ranged shooter, a charger, and one mini-boss |
| Run | Five rooms: three combat, one reward choice, one boss |
| Upgrades | Eight to ten, across attack, dash, and special, offered three at a time |
| Loop | Death returns to a hub; spend a currency; start again |
| Art | Placeholder shapes, with full hit feedback and readable telegraphs |

## Changes

Each row is one OpenSpec change.

| # | Change | Status | What it adds |
|---|---|---|---|
| 1 | `core-loop-skeleton` | Done | Project setup, the simulation and view split, movement, aim, one room, the oblique view |
| 2 | `combat-feel` | Done | Three-hit combo, dash, damage, knockback, hitstop, training dummies, hit feedback |
| 3 | `enemy-ai` | Done | Chaser pursuit and attacks, per-entity hitstop, health display, defeat and restart |
| 4 | `room-flow` | Next | Several rooms, locked doors, waves, clearing a room, moving to the next, a run sequence |
| 5 | `boon-system` | Planned | Upgrades that modify weapon and dash values or react to events; the special attack |
| 6 | `meta-progression` | Planned | A hub, a currency kept between runs, permanent upgrades, saving |

The order is deliberate. Combat was tuned against stationary targets before enemy behavior was added, and upgrades come after there is a run to use them in.

### What `enemy-ai` implements

Chaser pursuit has been played and feels good. The change is archived; other combat tuning remains open.

- A chaser state machine: idle, pursue, attack phases, stagger. Shooter, charger and mini-boss remain future work.
- Seek and seeded sideways detours around rectangular walls, plus positional separation.
- Two simultaneous attackers, chosen by longest wait and then entity id.
- Enemy attacks reusing `applyHit`, the arc hit test, and the event stream.
- The first source of damage to the player, which makes dash invulnerability matter.

The hitstop question is settled: only attacker and target pause. The projectile question is explicitly deferred to the ranged-enemy follow-up because this change contains only the chaser.

## Milestones 2 to 4: candidate changes

Proposed, unordered within a milestone, and not yet planned in OpenSpec.

| Milestone | Candidate change | What it adds |
|---|---|---|
| 2 | `areas` | Three areas with their own room sets, enemy mixes, and look |
| 2 | `path-choice` | Two exits per room showing the next reward |
| 2 | `room-types` | Elite, shop, and rest rooms; run currency; healing |
| 2 | `enemy-roster` | The remaining enemy types and elite variants |
| 2 | `bosses` | Three multi-phase area bosses |
| 2 | `hazards` | Traps and damaging floor tied to an area |
| 3 | `weapons` | Three more weapons and choosing one before a run |
| 3 | `boon-families` | Status effects, rarity, combinations, upgrading and rerolling |
| 3 | `meta-tree` | The larger set of permanent upgrades and weapon unlocks |
| 3 | `difficulty-modifiers` | Optional modifiers for greater reward |
| 4 | `interface` | Title, pause, settings, run summary, victory, readiness indicators |
| 4 | `audio` | Sound effects and music |
| 4 | `art-pass` | Sprites and effects replacing placeholder shapes |
| 4 | `room-editor-pipeline` | Authoring rooms in an editor, if hand-written data has become the bottleneck |
| 4 | `gamepad` | A gamepad input mapping |

## Open questions

Technical decisions deliberately left for later, with the change that should settle them. Open design questions are in [game-design.md](game-design.md).

| Question | Settle in |
|---|---|
| Should a buffered attack be able to interrupt late recovery? Today it waits for recovery to end. | Playtesting, any time |
| Should the player have brief invulnerability after taking damage? | Group-combat playtesting |
| Should enemy hits interrupt player attacks? Currently they do not. | Group-combat playtesting |
| How should fast projectiles collide? Sub-stepping covers the dash; a swept test may be needed. | Shooter / projectile follow-up; outside the chaser-only change |
| Which editor for rooms: LDtk, Tiled, or keep hand-written data? | `room-flow` |
| How do upgrades change values: a modifier stack, replaced definitions, or event hooks? | `boon-system` |
| What is the special attack? | `boon-system` |
| Is gamepad support wanted? The simulation only sees an abstract intent, so it is a mapping, not a redesign. | Any time |
| When free asset packs replace shapes, how many facing directions do sprites have? Facing is a continuous angle in the simulation; the view would snap it. | When art is chosen |
| Is a true isometric view wanted later? It would change `view/projection.ts` and the art only. | When art is chosen |

## Known gaps

- **Chaser only.** Shooter, charger, mini-boss and projectiles remain to be built.
- **No pathfinding for concave walls.** Detours handle a single rectangle; placements avoid the L-shaped corner.
- **No room clearing.** Chasers respawn forever; room flow will replace this with encounters.
- **No hub or persistence.** Defeat currently restarts the same room and seed.
- **Feel is untuned.** The combat numbers are first guesses. See [tuning.md](tuning.md).
- **No audio.**
- **The scene and device input have no automated tests.** They are checked by hand in the browser.

## Risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| Art and animation volume | Directional attack animations are the largest cost in this genre | Stay on shapes until the slice is fun; keep attack visuals as drawn arcs |
| Combat feel | It takes more tuning time than building the systems | Values are data; a test room with dummies is always available |
| Scope | The genre invites endless content | The slice above is the whole first milestone |
| Upgrade interactions | Combinations produce bugs and balance problems | The simulation runs headless, so combinations can be tested |
| Phaser 4 ecosystem | Fewer plugins and examples than Phaser 3 | No plugins; the view layer is thin and isolated |
