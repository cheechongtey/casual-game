# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Restarting the room`
- TO: `### Requirement: Restarting after defeat`

## MODIFIED Requirements

### Requirement: Restarting after defeat
After the player is defeated during a run and the restart delay has passed, a new press of any keyboard key or mouse button SHALL start a new run: the player in the first room of the run at its spawn point with full health and no action in progress, and every enemy of that room at its placement with full health. After a defeat in the test room, the same press SHALL start the test room again in the same way, with its training dummies and enemies at their placements with full health.

#### Scenario: Restart
- **WHEN** the player is defeated in the first room of a run, the restart delay passes, and a key is pressed
- **THEN** the player is at the spawn point of the first room with maximum health
- **AND** every enemy of that room is at its placement with maximum health
- **AND** play continues

#### Scenario: Restart with the mouse
- **WHEN** the player is defeated, the restart delay passes, and a mouse button is pressed
- **THEN** a new run starts

#### Scenario: Defeated in a later room
- **WHEN** the player is defeated in the third room of a run, the restart delay passes, and a key is pressed
- **THEN** the player is in the first room of a new run with maximum health

#### Scenario: Defeated in the test room
- **WHEN** the player is defeated in the test room, the restart delay passes, and a key is pressed
- **THEN** the player is at the spawn point of the test room with maximum health
- **AND** every dummy and enemy is at its placement with maximum health

### Requirement: Restart delay
A press made within the configured restart delay after the defeat SHALL NOT start a new run or restart the test room, and neither SHALL a key or button that has been held down since before the delay passed.

#### Scenario: Still attacking at the moment of defeat
- **WHEN** the attack button is pressed 0.1 seconds after the defeat
- **THEN** no new run starts

#### Scenario: Button held through the delay
- **WHEN** the attack button is held from before the defeat until after the restart delay has passed
- **THEN** no new run starts until a button or key is pressed anew

### Requirement: No restart during play
While the player is not defeated and the run is not complete, no key or mouse button SHALL start a new run or restart the room.

#### Scenario: Playing normally
- **WHEN** keys and mouse buttons are pressed while the player has health remaining and the run is not complete
- **THEN** the run continues in the same room
