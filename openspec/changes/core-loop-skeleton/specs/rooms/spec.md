# Spec Delta

## Purpose

Defines a room as data (its bounds, walls, and spawn point) and how a room becomes the playable space of the simulation.

## ADDED Requirements

### Requirement: Room defined as data
A room SHALL be described entirely by data: a rectangular bounds size, a list of axis-aligned wall rectangles, and a player spawn point, all in world units.

#### Scenario: Loading the starting room
- **WHEN** the game starts
- **THEN** the simulation contains the bounds and walls of the starting room definition
- **AND** no room geometry comes from anywhere other than that definition

### Requirement: Player starts at the spawn point
When a room is loaded, the player SHALL be placed at the room's spawn point.

#### Scenario: Entering a room
- **WHEN** a room with spawn point (200, 300) is loaded
- **THEN** the player's ground position is (200, 300)

### Requirement: Invalid rooms are rejected
Loading a room SHALL fail with a descriptive error when the bounds have non-positive size, a wall lies partly outside the bounds, or the player's circle at the spawn point overlaps a wall or the bounds edge.

#### Scenario: Spawn inside a wall
- **WHEN** a room is loaded whose spawn point lies inside a wall rectangle
- **THEN** loading fails with an error that identifies the spawn point as the cause

#### Scenario: Wall outside the bounds
- **WHEN** a room is loaded with a wall extending past the room bounds
- **THEN** loading fails with an error that identifies that wall

#### Scenario: Valid room
- **WHEN** a room is loaded with positive bounds, walls inside the bounds, and a clear spawn point
- **THEN** loading succeeds
