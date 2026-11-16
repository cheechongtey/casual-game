# Spec Delta

## ADDED Requirements

### Requirement: Step events
Each simulation step SHALL report the gameplay events that occurred during it: an attack starting, a dash starting, a hit with its target, damage, and position, and an entity being defeated. Events from every step run in a display frame SHALL reach the view.

#### Scenario: A hit is reported
- **WHEN** an attack hits a target during a step
- **THEN** that step reports one hit event naming the target, the damage dealt, and the target's ground position

#### Scenario: Quiet step
- **WHEN** a step passes in which nothing starts, hits, or is defeated
- **THEN** that step reports no events

#### Scenario: Two steps in one display frame
- **WHEN** two steps run in one display frame and a hit occurs in the first
- **THEN** the view receives the hit event for that frame

### Requirement: Combat state readable by the view
After each step the simulation SHALL expose the player's current action (idle, attacking with its phase, or dashing), the active attack's direction, range, and angle, and for every entity with health its current and maximum health and whether it is defeated.

#### Scenario: Reading an attack in progress
- **WHEN** the player is in the active phase of the second attack
- **THEN** the exposed state identifies the action as attacking, the phase as active, and gives that attack's direction, range, and angle
