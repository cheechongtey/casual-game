# Spec Delta

## Purpose

Defines what happens when the player's health reaches zero: play stops so the player can see what happened, and the room can be started again.

## ADDED Requirements

### Requirement: Defeat stops play
When the player is defeated, the simulation SHALL stop changing: on every later step no entity moves, no health changes, no timer advances, and no event is reported, whatever the input. Simulation steps SHALL continue to be counted.

#### Scenario: The final hit
- **WHEN** a hit reduces the player's health to 0
- **THEN** the player is defeated on that step
- **AND** that step reports the defeat as an event

#### Scenario: After defeat
- **WHEN** 120 steps pass after the player is defeated, with move, attack, and dash input held
- **THEN** every entity's position and health are the same as on the step of the defeat
- **AND** those steps report no events

#### Scenario: An attack already under way
- **WHEN** the player is defeated while another enemy is in the windup of an attack
- **THEN** that attack does not progress

### Requirement: Restarting the room
After the player is defeated and the restart delay has passed, a new press of any keyboard key or mouse button SHALL start the room again: the player at the spawn point with full health and no action in progress, and every training dummy and enemy at its placement with full health.

#### Scenario: Restart
- **WHEN** the player is defeated, the restart delay passes, and a key is pressed
- **THEN** the player is at the spawn point with maximum health
- **AND** every dummy and enemy is at its placement with maximum health
- **AND** play continues

#### Scenario: Restart with the mouse
- **WHEN** the player is defeated, the restart delay passes, and a mouse button is pressed
- **THEN** the room starts again

### Requirement: Restart delay
A press made within the configured restart delay after the defeat SHALL NOT restart the room, and neither SHALL a key or button that has been held down since before the delay passed.

#### Scenario: Still attacking at the moment of defeat
- **WHEN** the attack button is pressed 0.1 seconds after the defeat
- **THEN** the room does not restart

#### Scenario: Button held through the delay
- **WHEN** the attack button is held from before the defeat until after the restart delay has passed
- **THEN** the room does not restart until a button or key is pressed anew

### Requirement: No restart during play
While the player is not defeated, no key or mouse button SHALL restart the room.

#### Scenario: Playing normally
- **WHEN** keys and mouse buttons are pressed while the player has health remaining
- **THEN** the room does not restart
