# game-simulation Specification

## Purpose

Defines the renderer-independent game simulation: how game time advances, what makes a run reproducible, and what the simulation exposes to the view.

## Requirements

### Requirement: Fixed simulation rate
The simulation SHALL advance in fixed steps of 1/60 second, independent of the display frame rate.

#### Scenario: Slow display
- **WHEN** the display renders at 30 frames per second for one second
- **THEN** the simulation has advanced 60 steps

#### Scenario: Fast display
- **WHEN** the display renders at 144 frames per second for one second
- **THEN** the simulation has advanced 60 steps

### Requirement: Bounded catch-up
The simulation SHALL advance at most 5 steps per display frame and SHALL discard any elapsed time beyond that limit.

#### Scenario: Returning from a long stall
- **WHEN** a display frame arrives 2 seconds after the previous one
- **THEN** the simulation advances 5 steps in that frame
- **AND** the remaining elapsed time is not carried into later frames

### Requirement: Deterministic outcome
Given the same seed, the same room, and the same sequence of per-step input intents, the simulation SHALL produce identical state at every step.

#### Scenario: Replaying a recorded input sequence
- **WHEN** the simulation is run twice with the same seed, room, and 600 recorded input intents
- **THEN** the full simulation state after step 600 is identical in both runs

### Requirement: Seeded randomness
All random values used by the simulation SHALL come from a generator initialized from the run's seed.

#### Scenario: Same seed
- **WHEN** two simulations are created with the same seed and each draws 100 random values
- **THEN** both sequences are identical

#### Scenario: Different seeds
- **WHEN** two simulations are created with different seeds and each draws 100 random values
- **THEN** the sequences differ

### Requirement: Runs without a display
The simulation SHALL be runnable with no browser, canvas, or rendering engine present.

#### Scenario: Headless run
- **WHEN** the simulation is created and stepped in a command-line test environment with no browser
- **THEN** it advances and reports state without error

### Requirement: Readable state for the view
After each step the simulation SHALL expose, for every entity, its current and previous ground position, height above ground, facing angle, and radius.

#### Scenario: View reads the player
- **WHEN** the simulation has completed a step in which the player moved
- **THEN** the player's previous position equals its position before that step
- **AND** its current position equals its position after that step
