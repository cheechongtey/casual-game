# Spec Delta

## ADDED Requirements

### Requirement: Exits are drawn
Each exit of the room SHALL be drawn at its ground rectangle using the same projection as the rest of the world. A closed exit SHALL be drawn as a barrier with height, like a wall but distinguishable from one. An open exit SHALL be drawn as a flat marking on the ground with no barrier, clearly different from its closed appearance.

#### Scenario: Fighting
- **WHEN** the room is in the fighting phase
- **THEN** its exit is drawn as a raised barrier that is visibly not an ordinary wall

#### Scenario: Cleared
- **WHEN** the room becomes cleared
- **THEN** the barrier is no longer drawn and the exit is shown as an open marking on the ground

#### Scenario: Room without exits
- **WHEN** the room has no exits
- **THEN** no exit is drawn
