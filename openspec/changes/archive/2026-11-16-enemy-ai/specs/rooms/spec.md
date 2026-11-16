# Spec Delta

## MODIFIED Requirements

### Requirement: Room defined as data
A room SHALL be described entirely by data: a rectangular bounds size, a list of axis-aligned wall rectangles, a player spawn point, a list of training dummy placements, and a list of enemy placements each naming the kind of enemy, all in world units.

#### Scenario: Loading the starting room
- **WHEN** the game starts
- **THEN** the simulation contains the bounds and walls of the starting room definition
- **AND** no room geometry comes from anywhere other than that definition

#### Scenario: Starting room has targets
- **WHEN** the game starts
- **THEN** the starting room contains at least two training dummies near the spawn point

#### Scenario: Starting room has enemies
- **WHEN** the game starts
- **THEN** the starting room contains at least four chasers
- **AND** each stands farther from the spawn point than its notice range

### Requirement: Invalid rooms are rejected
Loading a room SHALL fail with a descriptive error when the bounds have non-positive size, a wall lies partly outside the bounds, the player's circle at the spawn point overlaps a wall or the bounds edge, or a dummy or enemy placed at a placement would overlap a wall, the bounds edge, the player at the spawn point, or another placed dummy or enemy.

#### Scenario: Spawn inside a wall
- **WHEN** a room is loaded whose spawn point lies inside a wall rectangle
- **THEN** loading fails with an error that identifies the spawn point as the cause

#### Scenario: Wall outside the bounds
- **WHEN** a room is loaded with a wall extending past the room bounds
- **THEN** loading fails with an error that identifies that wall

#### Scenario: Valid room
- **WHEN** a room is loaded with positive bounds, walls inside the bounds, and a clear spawn point
- **THEN** loading succeeds

#### Scenario: Dummy inside a wall
- **WHEN** a room is loaded with a dummy placement inside a wall rectangle
- **THEN** loading fails with an error that identifies that placement

#### Scenario: Dummy on the spawn point
- **WHEN** a room is loaded with a dummy placement at the spawn point
- **THEN** loading fails with an error that identifies that placement

#### Scenario: Enemy inside a wall
- **WHEN** a room is loaded with an enemy placement inside a wall rectangle
- **THEN** loading fails with an error that identifies that placement

#### Scenario: Enemy on a dummy
- **WHEN** a room is loaded with an enemy placement at the same point as a dummy placement
- **THEN** loading fails with an error that identifies the enemy placement
