# dash Specification

## Purpose

Defines the player's dash: a short, fast, committed burst of movement used to reposition and avoid harm, and how it interacts with walls, other entities, and attacks.

## Requirements

### Requirement: Dash movement
A dash SHALL move the player the configured dash distance over the configured dash duration in a fixed direction, ignoring move input while it lasts.

#### Scenario: Dash in the open
- **WHEN** the player dashes right with no obstacle
- **THEN** after the dash duration the player has moved right by the dash distance

#### Scenario: Steering during a dash
- **WHEN** the move direction changes from right to up during a dash that started to the right
- **THEN** the player continues right until the dash ends

### Requirement: Dash direction
A dash SHALL travel in the move direction held on the step it starts, or in the player's facing direction when no move direction is held.

#### Scenario: Moving while dashing
- **WHEN** the player dashes while holding the move direction left and aiming right
- **THEN** the dash travels left

#### Scenario: Standing still
- **WHEN** the player dashes with no move direction held and a facing angle of 90 degrees
- **THEN** the dash travels along 90 degrees

### Requirement: Dash is triggered by a press
A dash SHALL start only on a new dash press, never from dash input that has stayed held.

#### Scenario: Holding dash
- **WHEN** dash input is pressed once and held for 3 seconds
- **THEN** exactly one dash occurs

### Requirement: Dash cooldown
After a dash ends, a new dash SHALL NOT start until the configured cooldown has elapsed.

#### Scenario: Pressing during cooldown
- **WHEN** dash is pressed and released early in the cooldown, more than the buffer duration before it ends
- **THEN** no dash occurs

#### Scenario: Pressing after cooldown
- **WHEN** dash is pressed after the cooldown has elapsed
- **THEN** a dash starts on that step

### Requirement: Dash input buffering
A dash press made while a dash cannot start SHALL be remembered for the configured buffer duration and SHALL start a dash if one becomes possible within that time.

#### Scenario: Press just before cooldown ends
- **WHEN** dash is pressed within the buffer duration before the cooldown ends
- **THEN** a dash starts on the step the cooldown ends

### Requirement: Walls stop a dash
A dashing player SHALL NOT overlap or pass through a wall or leave the room bounds, whatever the wall's thickness.

#### Scenario: Dashing at a thin wall
- **WHEN** the player dashes directly at a wall 20 units thick from a short distance
- **THEN** the player ends the dash touching the near face of the wall

#### Scenario: Dashing along a wall
- **WHEN** the player dashes diagonally into a wall
- **THEN** the player slides along the wall for the rest of the dash

### Requirement: Dash passes through entities
A dashing player SHALL pass through other entities. When a dash ends with the player overlapping a solid entity, the player SHALL be moved out of it.

#### Scenario: Dashing through a target
- **WHEN** the player dashes at a solid entity with enough distance to clear it
- **THEN** the player ends the dash on the far side of the entity

#### Scenario: Dash ends inside a target
- **WHEN** a dash ends with the player's circle overlapping a solid entity
- **THEN** on the next step the two circles no longer overlap

### Requirement: Dash cancels an attack
A dash SHALL be able to start during any phase of an attack. Starting it SHALL end the attack immediately and restart the combo sequence.

#### Scenario: Dashing out of windup
- **WHEN** the player dashes during an attack's windup
- **THEN** the attack ends without hitting anything
- **AND** the dash starts on that step

#### Scenario: Combo after a cancel
- **WHEN** the player attacks after cancelling the second attack of the combo with a dash
- **THEN** the first attack of the sequence is performed

### Requirement: Invulnerable while dashing
The player SHALL be invulnerable from the step a dash starts until the step it ends.

#### Scenario: Damage during a dash
- **WHEN** damage is applied to the player midway through a dash
- **THEN** the player's health does not change

#### Scenario: Damage after a dash
- **WHEN** damage is applied to the player on the step after a dash ends
- **THEN** the player's health is reduced
