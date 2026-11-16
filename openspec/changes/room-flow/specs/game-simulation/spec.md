# Spec Delta

## MODIFIED Requirements

### Requirement: Deterministic outcome
Given the same seed, the same room, the same health for the player on entering, and the same sequence of per-step input intents, the simulation SHALL produce identical state at every step.

#### Scenario: Replaying a recorded input sequence
- **WHEN** the simulation is run twice with the same seed, room, and 600 recorded input intents
- **THEN** the full simulation state after step 600 is identical in both runs

#### Scenario: Entering with reduced health
- **WHEN** the simulation is run twice with the same seed, room, an entering health of 60, and the same 600 recorded input intents
- **THEN** the full simulation state after step 600 is identical in both runs

## ADDED Requirements

### Requirement: Entering a room with given health
A simulation SHALL be creatable with a stated current health for the player, which the player then has at the start with maximum health unchanged. When no health is stated the player SHALL start at maximum health. A stated health of zero or less, or above the maximum, SHALL be rejected with a descriptive error.

#### Scenario: Stated health
- **WHEN** a simulation is created with an entering health of 60 for a player whose maximum is 100
- **THEN** the player has 60 of 100 health

#### Scenario: No stated health
- **WHEN** a simulation is created without an entering health
- **THEN** the player is at maximum health

#### Scenario: Invalid health
- **WHEN** a simulation is created with an entering health of 0
- **THEN** creation fails with an error that names the health value

### Requirement: Room events
Each simulation step SHALL report, alongside its other gameplay events, the room becoming cleared and an exit being reached together with which exit. These events SHALL reach the view under the same rule as other step events.

#### Scenario: Clearing and leaving in one display frame
- **WHEN** two steps run in one display frame, the room is cleared in the first, and nothing else happens in the second
- **THEN** the view receives the room-cleared event for that frame

### Requirement: Room phase readable by the view
After each step the simulation SHALL expose whether the room is in the fighting phase, cleared, or has been left through an exit, and the rectangle of each exit.

#### Scenario: Reading a cleared room
- **WHEN** the last enemy of a room has been defeated
- **THEN** the exposed state identifies the room as cleared and gives the rectangle of its exit
