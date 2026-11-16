# player-input Specification

## Purpose

Turns device input into an abstract per-step intent (move direction and aim angle) so the simulation never depends on a specific input device.

## Requirements

### Requirement: Keyboard movement intent
The system SHALL derive a move direction from the W, A, S, and D keys, where W is up-screen, S is down-screen, A is left, and D is right.

#### Scenario: Single key
- **WHEN** only D is held
- **THEN** the move direction points right with length 1

#### Scenario: Diagonal
- **WHEN** W and D are held together
- **THEN** the move direction points up-right with length 1

#### Scenario: Opposing keys
- **WHEN** A and D are held together
- **THEN** the horizontal component of the move direction is 0

#### Scenario: No keys
- **WHEN** no movement key is held
- **THEN** the move direction has length 0

### Requirement: Mouse aim intent
The system SHALL derive an aim angle from the direction between the player's ground position and the ground position under the mouse cursor, measured in world space.

#### Scenario: Cursor to the right
- **WHEN** the cursor is over a ground point directly to the right of the player
- **THEN** the aim angle is 0 degrees

#### Scenario: Cursor diagonally on screen
- **WHEN** the cursor is over the ground point that is 100 world units right and 100 world units up-screen from the player
- **THEN** the aim angle is 45 degrees up-screen from right, regardless of how the view compresses the vertical axis

### Requirement: Aim retained when undefined
The system SHALL keep the previous aim angle when the cursor's ground position is within 1 world unit of the player's ground position.

#### Scenario: Cursor on the player
- **WHEN** the aim angle is 90 degrees and the cursor moves onto the player's ground position
- **THEN** the aim angle remains 90 degrees

### Requirement: Input released on focus loss
The system SHALL treat all movement keys as released when the game loses keyboard focus.

#### Scenario: Switching away while moving
- **WHEN** D is held and the browser window loses focus
- **THEN** the move direction has length 0 until a movement key is pressed again

### Requirement: One intent per simulation step
The system SHALL supply the simulation with exactly one input intent per step, containing a move direction and an aim angle.

#### Scenario: Several steps in one display frame
- **WHEN** the simulation advances 2 steps within one display frame
- **THEN** each step receives an intent
- **AND** both intents reflect the input state sampled for that frame
