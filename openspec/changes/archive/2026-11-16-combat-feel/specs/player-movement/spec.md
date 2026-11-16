# Spec Delta

## ADDED Requirements

### Requirement: Solid entities block the player
While not dashing, the player's circle SHALL NOT overlap the circle of a solid entity. The player SHALL be moved out of the overlap and the other entity SHALL NOT be moved by the contact.

#### Scenario: Walking into a dummy
- **WHEN** the player walks directly at a training dummy for 120 steps
- **THEN** the player's circle touches the dummy's circle without overlapping it
- **AND** the dummy's position is unchanged

#### Scenario: Walking around a dummy
- **WHEN** the player walks at a training dummy off-center
- **THEN** the player slides around it without stopping

## MODIFIED Requirements

### Requirement: Movement at constant speed
While the move direction is non-zero and the player is neither attacking nor dashing, the player SHALL move in that direction at the configured move speed, with no acceleration or deceleration. While attacking, the player SHALL move at the configured fraction of that speed instead.

#### Scenario: Moving right
- **WHEN** the move direction points right for 60 steps and no wall is in the way
- **THEN** the player has moved right by one second's worth of the configured move speed

#### Scenario: Diagonal is not faster
- **WHEN** the move direction points up-right for 60 steps and no wall is in the way
- **THEN** the distance travelled equals the distance travelled moving right for 60 steps

#### Scenario: Stopping
- **WHEN** the move direction becomes zero
- **THEN** the player's position does not change on the next step

#### Scenario: Moving while attacking
- **WHEN** the move direction points right during an attack's windup
- **THEN** the player moves right at the configured attack fraction of the move speed

### Requirement: Facing follows aim
The player's facing angle SHALL equal the aim angle of the current input intent, independent of the move direction, except during an attack, when it SHALL equal the attack direction.

#### Scenario: Backpedalling
- **WHEN** the move direction points left and the aim angle is 0 degrees
- **THEN** the player moves left
- **AND** the player's facing angle is 0 degrees

#### Scenario: Aiming during an attack
- **WHEN** an attack started at 0 degrees is in progress and the aim angle changes to 90 degrees
- **THEN** the player's facing angle remains 0 degrees until the attack ends
