# Spec Delta

## Purpose

Defines when a room counts as cleared, how its exits behave before and after that, and what happens when the player leaves through an exit.

## ADDED Requirements

### Requirement: Room phase
A room SHALL be in the fighting phase while at least one of its enemies is not defeated, and SHALL become cleared on the step in which its last enemy is defeated. A cleared room SHALL stay cleared. Training dummies SHALL NOT count as enemies.

#### Scenario: Entering a room with enemies
- **WHEN** a room with three chaser placements is loaded
- **THEN** the room is in the fighting phase

#### Scenario: Defeating the last enemy
- **WHEN** the last undefeated chaser in a room is defeated
- **THEN** the room is cleared on that step

#### Scenario: One enemy left
- **WHEN** two of a room's three chasers are defeated
- **THEN** the room is still in the fighting phase

#### Scenario: Dummies do not hold a room
- **WHEN** every chaser in a room is defeated while a training dummy remains undefeated
- **THEN** the room is cleared

#### Scenario: Room without enemies
- **WHEN** a room with no enemy placements is loaded
- **THEN** the room is cleared from the start

### Requirement: Clearing is reported once
The step on which a room becomes cleared SHALL report a room-cleared event, and no later step in that room SHALL report it again. A room that is cleared from the start SHALL NOT report the event.

#### Scenario: Event on the clearing step
- **WHEN** the last enemy in a room is defeated
- **THEN** that step reports one room-cleared event

#### Scenario: After clearing
- **WHEN** 120 steps pass after a room is cleared
- **THEN** none of those steps reports a room-cleared event

### Requirement: Closed exits block movement
While a room is in the fighting phase, each of its exits SHALL block the movement of the player and of every other entity in the same way a wall does, including during a dash and under knockback.

#### Scenario: Walking into a closed exit
- **WHEN** the player moves into an exit while the room is in the fighting phase
- **THEN** the player's circle does not overlap the exit

#### Scenario: Dashing into a closed exit
- **WHEN** the player dashes at an exit while the room is in the fighting phase
- **THEN** the player stops against the exit and does not pass through it

### Requirement: Exits open when the room is cleared
From the step on which a room becomes cleared, its exits SHALL NOT block movement.

#### Scenario: Walking into an open exit
- **WHEN** the room is cleared and the player moves into an exit
- **THEN** the player's circle can overlap the exit

### Requirement: Leaving through an exit
When the room is cleared and the centre of the player's circle is inside an exit, the step SHALL report an exit-reached event that identifies which of the room's exits was reached.

#### Scenario: Reaching the exit
- **WHEN** the room is cleared and the player walks until the centre of their circle is inside the room's exit
- **THEN** that step reports an exit-reached event naming that exit

#### Scenario: Touching the edge of the exit
- **WHEN** the room is cleared and the player's circle overlaps an exit while its centre is outside the exit
- **THEN** no exit-reached event is reported

#### Scenario: Second exit of two
- **WHEN** a cleared room has two exits and the player's centre enters the second
- **THEN** the exit-reached event names the second exit

### Requirement: The room stops once an exit is reached
After a step reports an exit-reached event, the simulation of that room SHALL stop changing: on every later step no entity moves, no health changes, no timer advances, and no event is reported, whatever the input. Simulation steps SHALL continue to be counted.

#### Scenario: Steps after leaving
- **WHEN** 60 steps pass after an exit-reached event, with move and attack input held
- **THEN** every entity's position and health are the same as on the step of the event
- **AND** those steps report no events
