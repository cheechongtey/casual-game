# Spec Delta

## Purpose

Defines a run: an ordered sequence of rooms played one after another, what the player carries from one room to the next, how a run ends, and the test room that can be played outside a run.

## ADDED Requirements

### Requirement: A run is an ordered sequence of rooms
A run SHALL consist of a fixed, ordered sequence of rooms defined as data. The game SHALL start a run in the first room of the sequence. The run for this stage of the game SHALL contain three rooms.

#### Scenario: Starting the game
- **WHEN** the game starts with no test room requested
- **THEN** the player is in the first room of the run sequence

#### Scenario: Length of the run
- **WHEN** the run sequence is read
- **THEN** it lists three rooms

### Requirement: Every room of a run can be left
Creating a run SHALL fail with a descriptive error when any room in its sequence has no exit.

#### Scenario: Room without an exit in the sequence
- **WHEN** a run is created from a sequence whose second room has an empty exit list
- **THEN** creation fails with an error that identifies that room

### Requirement: Moving to the next room
When an exit is reached in a room that is not the last of the run, the player SHALL be placed in the next room of the sequence at its spawn point, with that room's enemies at their placements at full health.

#### Scenario: Leaving the first room
- **WHEN** the player reaches the exit of the first room
- **THEN** the player is at the spawn point of the second room
- **AND** the second room is in the fighting phase with all of its enemies at full health

### Requirement: Health carries between rooms
The player SHALL enter each room after the first with the health they had when they left the previous room, and with the same maximum health. No health SHALL be restored between rooms.

#### Scenario: Damaged in the first room
- **WHEN** the player leaves the first room with 60 of 100 health
- **THEN** the player enters the second room with 60 of 100 health

#### Scenario: Unhurt in the first room
- **WHEN** the player leaves the first room with 100 of 100 health
- **THEN** the player enters the second room with 100 of 100 health

### Requirement: Only health carries between rooms
The player SHALL enter every room with no action in progress, no dash cooldown, no combo in progress, no remembered attack or dash press, no knockback, and no hit pause, whatever their state when they left the previous room.

#### Scenario: Leaving mid-dash
- **WHEN** the player reaches an exit while dashing
- **THEN** the player is idle in the next room and can dash at once

### Requirement: Run complete
When an exit is reached in the last room of the run, the run SHALL be complete: no further room is entered and play stops.

#### Scenario: Leaving the third room
- **WHEN** the player reaches the exit of the third room
- **THEN** the run is complete
- **AND** no further room is loaded

### Requirement: Starting again after a completed run
After a run is complete and the restart delay has passed, a new press of any keyboard key or mouse button SHALL start a new run from the first room with the player at full health. A press within the restart delay, or a key or button held since before the delay passed, SHALL NOT start it.

#### Scenario: New press after the delay
- **WHEN** the run is complete, the restart delay passes, and a key is pressed
- **THEN** a new run starts in the first room with the player at maximum health

#### Scenario: Button held through the delay
- **WHEN** the attack button is held from before the run completes until after the restart delay has passed
- **THEN** no new run starts until a key or button is pressed anew

### Requirement: Run seed
Each run SHALL have a seed, and each room of the run SHALL receive its own seed derived only from the run seed and the room's position in the sequence. Rooms at different positions SHALL receive different seeds.

#### Scenario: Same run seed
- **WHEN** two runs are created with the same seed
- **THEN** the seed given to each room is the same in both runs

#### Scenario: Different rooms
- **WHEN** a run is created
- **THEN** the seeds given to its first and second rooms differ

### Requirement: Reproducible run
Given the same run seed and the same sequence of per-step input intents, a run SHALL produce identical state at every step of every room.

#### Scenario: Replaying a run
- **WHEN** a run is played twice with the same seed and the same recorded inputs through its first two rooms
- **THEN** the simulation state at the end is identical in both

### Requirement: Choosing the run seed
When the game is opened with a seed given in the page address, the first run SHALL use that seed. Otherwise, and for every run started after a defeat or a completed run, the seed SHALL be newly chosen.

#### Scenario: Seed in the address
- **WHEN** the game is opened with seed 42 given in the page address
- **THEN** the first run uses seed 42

#### Scenario: No seed in the address
- **WHEN** the game is opened twice with no seed given
- **THEN** the two runs are not required to use the same seed

### Requirement: Test room
When the game is opened with the test room requested in the page address, the player SHALL be placed in the test room instead of a run. The test room SHALL NOT be part of the run sequence.

#### Scenario: Opening the test room
- **WHEN** the game is opened with the test room requested
- **THEN** the player is in the test room with its training dummies and chasers

#### Scenario: Normal start
- **WHEN** the game is opened with no test room requested
- **THEN** no room of the run is the test room
