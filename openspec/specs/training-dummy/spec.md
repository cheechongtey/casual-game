# training-dummy Specification

## Purpose

Provides a stationary target for tuning how combat feels: something that can be hit, pushed, and defeated, and that comes back so tuning can continue.

## Requirements

### Requirement: Dummies stand where the room places them
When a room is loaded, one training dummy SHALL be created at each dummy placement in the room definition, with full health.

#### Scenario: Room with two placements
- **WHEN** a room with dummy placements at (300, 300) and (600, 300) is loaded
- **THEN** the simulation contains two dummies at those ground positions, each at maximum health

#### Scenario: Room with no placements
- **WHEN** a room with no dummy placements is loaded
- **THEN** the simulation contains no dummies

### Requirement: Dummies are passive
A training dummy SHALL NOT move on its own and SHALL NOT damage the player. It moves only when knocked back.

#### Scenario: Left alone
- **WHEN** 600 steps pass without the dummy being hit
- **THEN** the dummy's position and health are unchanged

### Requirement: Dummies reappear after defeat
A defeated training dummy SHALL reappear at its placement with full health after the configured respawn delay.

#### Scenario: Respawn
- **WHEN** a dummy is defeated and the respawn delay elapses
- **THEN** the dummy is at its placement position with maximum health and can be hit again

#### Scenario: Player standing on the placement
- **WHEN** a dummy reappears while the player's circle overlaps its placement
- **THEN** on the next step the player and the dummy no longer overlap
