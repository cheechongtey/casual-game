# Documentation

A browser-based roguelite action game in a 3/4 oblique view, built with TypeScript, Phaser 4, and Vite. The current build is a combat test bed: one player, one walled room, and training dummies to hit.

## Where to start

| If you want to... | Read |
|---|---|
| Know what the whole game is meant to be, and what is agreed so far | [game-design.md](game-design.md) |
| Understand how the code is organized and why | [architecture.md](architecture.md) |
| Know exactly how attacking, dashing, and damage behave | [combat.md](combat.md) |
| Change how the game feels | [tuning.md](tuning.md) |
| Set up, run, test, or add something | [development.md](development.md) |
| See what is built, what is next, and what is undecided | [roadmap.md](roadmap.md) |
| Know why a design choice was made | [decisions.md](decisions.md) |

## How these docs relate to OpenSpec

Requirements live in `openspec/`, not here. The specs there say what the game must do, as testable scenarios; each change's `design.md` records how and why it was built.

These docs explain the project as a whole: how the pieces fit, how to work in it, and where it is going. When a doc and a spec disagree about required behavior, the spec is the one to fix or follow.

## Keeping docs current

Update the matching doc in the same change that alters behavior:

- A new or changed rule of play: [combat.md](combat.md), or a new doc for a new system.
- A new or renamed tunable value: [tuning.md](tuning.md).
- A new layer, a changed step order, or a new kind of data flowing between layers: [architecture.md](architecture.md).
- A finished change or a newly settled question: [roadmap.md](roadmap.md) and [decisions.md](decisions.md).
- A part of the game built, agreed, or cut: change its mark in [game-design.md](game-design.md).
