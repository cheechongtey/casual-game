# Spec Delta

## Purpose

Defines the information drawn on the screen itself and not in the world: the player's health and the message shown when the player is defeated.

## ADDED Requirements

### Requirement: Player health display
The view SHALL show the player's current health as a fraction of maximum health in a bar at a fixed place on the screen, together with the current and maximum values as numbers. The display SHALL be visible whenever the game is being played, including at full health.

#### Scenario: Full health
- **WHEN** the player has 100 of 100 health
- **THEN** the bar is completely filled and reads 100 / 100

#### Scenario: After taking damage
- **WHEN** the player with 100 maximum health has 70 health
- **THEN** the bar is 70 percent filled and reads 70 / 100

#### Scenario: Defeated
- **WHEN** the player's health is 0
- **THEN** the bar is empty

### Requirement: Screen-fixed display
On-screen displays SHALL stay at the same place on the screen when the camera moves or shakes, and SHALL be drawn over the world.

#### Scenario: Camera follows the player
- **WHEN** the player moves across the room and the camera follows
- **THEN** the health display stays at the same screen position

#### Scenario: Screen shake
- **WHEN** the camera shakes after a hit
- **THEN** the health display does not move

### Requirement: Defeat message
While the player is defeated, the view SHALL show a message that the player was defeated. Once the restart delay has passed, it SHALL also show how to restart.

#### Scenario: Just defeated
- **WHEN** the player has just been defeated
- **THEN** a defeat message is shown over the stopped game

#### Scenario: Restart available
- **WHEN** the restart delay has passed
- **THEN** the message also says that pressing any key or button restarts

#### Scenario: After restarting
- **WHEN** the room has been restarted
- **THEN** no defeat message is shown
