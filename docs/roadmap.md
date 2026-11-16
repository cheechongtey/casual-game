# Roadmap

## The goal

A browser-based roguelite action game: fast melee combat in small rooms, a run made of rooms chained together, upgrades chosen between rooms that change how you fight, and permanent progression between runs.

The full scope of the game, and what is agreed versus only proposed, is in [game-design.md](game-design.md). This page is the order of work.

## Milestones

| Milestone | Outcome | Status |
|---|---|---|
| 1. Vertical slice | A five-room run that is fun to repeat | In progress: changes 1 and 2 of 6 done |
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
| 3 | `enemy-ai` | Next | Enemies that move and attack, damage to the player, a player health display, defeat |
| 4 | `room-flow` | Planned | Several rooms, locked doors, waves, clearing a room, moving to the next, a run sequence |
| 5 | `boon-system` | Planned | Upgrades that modify weapon and dash values or react to events; the special attack |
| 6 | `meta-progression` | Planned | A hub, a currency kept between runs, permanent upgrades, saving |

The order is deliberate. Combat was tuned against stationary targets before enemy behavior was added, and upgrades come after there is a run to use them in.

### What `enemy-ai` is expected to need

- A state machine per enemy: approach, telegraph, attack, recover.
- Steering toward the player with separation between enemies, not pathfinding, while rooms stay open.
- A limit on how many enemies attack at once.
- Enemy attacks reusing `applyHit`, the arc hit test, and the event stream.
- The first source of damage to the player, which makes dash invulnerability matter.

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
| Should hitstop freeze only the attacker and target? Today it pauses the whole simulation. | `enemy-ai` |
| How should fast projectiles collide? Sub-stepping covers the dash; a swept test may be needed. | `enemy-ai` |
| Which editor for rooms: LDtk, Tiled, or keep hand-written data? | `room-flow` |
| How do upgrades change values: a modifier stack, replaced definitions, or event hooks? | `boon-system` |
| What is the special attack? | `boon-system` |
| Is gamepad support wanted? The simulation only sees an abstract intent, so it is a mapping, not a redesign. | Any time |
| When free asset packs replace shapes, how many facing directions do sprites have? Facing is a continuous angle in the simulation; the view would snap it. | When art is chosen |
| Is a true isometric view wanted later? It would change `view/projection.ts` and the art only. | When art is chosen |

## Known gaps

- **Main specs are behind the code.** `openspec/specs/` holds the five capabilities from `core-loop-skeleton`. The requirements added and changed by `combat-feel` are in its archived change but have not been merged into the main specs.
- **Nothing damages the player.** Player health and dash invulnerability exist and are tested, but cannot be seen in play.
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
