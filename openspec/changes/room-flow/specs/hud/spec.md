# Spec Delta

## MODIFIED Requirements

### Requirement: Defeat message
While the player is defeated, the view SHALL show a message that the player was defeated. Once the restart delay has passed, it SHALL also show how to restart.

#### Scenario: Just defeated
- **WHEN** the player has just been defeated
- **THEN** a defeat message is shown over the stopped game

#### Scenario: Restart available
- **WHEN** the restart delay has passed
- **THEN** the message also says that pressing any key or button restarts

#### Scenario: After restarting
- **WHEN** a new run has started after a defeat
- **THEN** no defeat message is shown

## ADDED Requirements

### Requirement: Room progress display
While a run is being played, the view SHALL show the position of the current room in the run and the number of rooms in the run, at a fixed place on the screen. It SHALL NOT be shown in the test room.

#### Scenario: Second room of three
- **WHEN** the player is in the second room of a three-room run
- **THEN** the display reads room 2 of 3

#### Scenario: Test room
- **WHEN** the player is in the test room
- **THEN** no room progress is shown

### Requirement: Run complete message
While the run is complete, the view SHALL show a message that the run is complete. Once the restart delay has passed, it SHALL also show how to start a new run.

#### Scenario: Just completed
- **WHEN** the player has just reached the exit of the last room
- **THEN** a run complete message is shown over the stopped game

#### Scenario: New run available
- **WHEN** the restart delay has passed after the run completed
- **THEN** the message also says that pressing any key or button starts a new run

#### Scenario: After starting again
- **WHEN** a new run has started after a completed run
- **THEN** no run complete message is shown
