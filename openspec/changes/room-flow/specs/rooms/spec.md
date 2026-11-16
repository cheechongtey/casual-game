# Spec Delta

## REMOVED Requirements

### Requirement: Room defined as data
**Reason**: Its scenarios describe a single starting room that the game always loads. The game now has a test room and the rooms of a run, and a room definition gains exits.
**Migration**: The data shape is specified by "Room definition", which adds the list of exits. The contents of the former starting room are specified for the test room by "Authored rooms", together with the rooms of the run.

## ADDED Requirements

### Requirement: Room definition
A room SHALL be described entirely by data: a rectangular bounds size, a list of axis-aligned wall rectangles, a player spawn point, a list of training dummy placements, a list of enemy placements each naming the kind of enemy, and a list of exits each given as an axis-aligned rectangle, all in world units. The list of exits MAY be empty.

#### Scenario: Loading a room
- **WHEN** a room is loaded
- **THEN** the simulation contains the bounds, walls, and exits of that room definition
- **AND** no room geometry comes from anywhere other than that definition

#### Scenario: Room with two exits
- **WHEN** a room definition lists two valid exits
- **THEN** loading succeeds and the simulation contains both

### Requirement: Authored rooms
The game SHALL provide a test room for tuning combat, containing training dummies and chasers and no exit, and the rooms of the run, each containing chasers, no training dummies, and exactly one exit. In every authored room each chaser SHALL stand farther from the spawn point than its notice range.

#### Scenario: Test room has targets
- **WHEN** the test room is loaded
- **THEN** it contains at least two training dummies near the spawn point

#### Scenario: Test room has enemies
- **WHEN** the test room is loaded
- **THEN** it contains at least four chasers
- **AND** each stands farther from the spawn point than its notice range

#### Scenario: Test room has no exit
- **WHEN** the test room is loaded
- **THEN** its list of exits is empty

#### Scenario: Rooms of the run
- **WHEN** each room of the run sequence is loaded
- **THEN** it contains at least one chaser, no training dummies, and exactly one exit
- **AND** each chaser stands farther from the spawn point than its notice range

### Requirement: Invalid exits are rejected
Loading a room SHALL fail with a descriptive error that identifies the exit when an exit has a width or height smaller than the player's diameter, lies partly outside the bounds, does not touch an edge of the bounds, overlaps a wall or another exit, or overlaps the player's circle at the spawn point or a dummy or enemy at its placement.

#### Scenario: Exit away from the edge
- **WHEN** a room is loaded with an exit that touches no edge of the bounds
- **THEN** loading fails with an error that identifies that exit

#### Scenario: Exit outside the bounds
- **WHEN** a room is loaded with an exit extending past the room bounds
- **THEN** loading fails with an error that identifies that exit

#### Scenario: Exit too small to enter
- **WHEN** a room is loaded with an exit narrower than the player's diameter
- **THEN** loading fails with an error that identifies that exit

#### Scenario: Exit inside a wall
- **WHEN** a room is loaded with an exit that overlaps a wall rectangle
- **THEN** loading fails with an error that identifies that exit

#### Scenario: Exit on the spawn point
- **WHEN** a room is loaded with an exit that overlaps the player's circle at the spawn point
- **THEN** loading fails with an error that identifies that exit

#### Scenario: Enemy placed in an exit
- **WHEN** a room is loaded with an enemy placement whose circle overlaps an exit
- **THEN** loading fails with an error that identifies that exit

#### Scenario: Valid exit
- **WHEN** a room is loaded with an exit that touches the right edge of the bounds, is clear of walls, the spawn point and every placement, and is at least the player's diameter in both dimensions
- **THEN** loading succeeds
