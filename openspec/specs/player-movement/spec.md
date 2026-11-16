# player-movement Specification

## Purpose

Defines how the player entity moves, faces, and collides inside a room in response to input intent.

## Requirements

### Requirement: Movement at constant speed
While the move direction is non-zero, the player SHALL move in that direction at the configured move speed, with no acceleration or deceleration.

#### Scenario: Moving right
- **WHEN** the move direction points right for 60 steps and no wall is in the way
- **THEN** the player has moved right by one second's worth of the configured move speed

#### Scenario: Diagonal is not faster
- **WHEN** the move direction points up-right for 60 steps and no wall is in the way
- **THEN** the distance travelled equals the distance travelled moving right for 60 steps

#### Scenario: Stopping
- **WHEN** the move direction becomes zero
- **THEN** the player's position does not change on the next step

### Requirement: Facing follows aim
The player's facing angle SHALL equal the aim angle of the current input intent, independent of the move direction.

#### Scenario: Backpedalling
- **WHEN** the move direction points left and the aim angle is 0 degrees
- **THEN** the player moves left
- **AND** the player's facing angle is 0 degrees

### Requirement: Walls block the player
The player SHALL be treated as a circle that never overlaps a wall or leaves the room bounds.

#### Scenario: Walking into a wall
- **WHEN** the player moves directly toward a wall for 120 steps
- **THEN** the player's circle touches the wall and does not overlap it

#### Scenario: Walking into the room edge
- **WHEN** the player moves directly toward the edge of the room for 600 steps
- **THEN** the player's circle remains fully inside the room bounds

### Requirement: Sliding along walls
When movement is partly blocked by a wall, the player SHALL keep the component of movement that runs parallel to the wall.

#### Scenario: Diagonal into a wall
- **WHEN** the player moves up-right against a wall that blocks rightward movement
- **THEN** the player continues to move up along the wall
- **AND** the player does not move right

#### Scenario: Wall corner
- **WHEN** the player moves diagonally past the outer corner of a wall that its circle clips
- **THEN** the player is pushed around the corner without stopping and without overlapping the wall
