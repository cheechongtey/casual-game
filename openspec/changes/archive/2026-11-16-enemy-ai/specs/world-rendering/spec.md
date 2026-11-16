# Spec Delta

## ADDED Requirements

### Requirement: Enemy attacks are telegraphed
While an enemy is in the windup or active phase of an attack, the view SHALL draw that attack's hit area on the ground as the projection of the same sector the simulation uses, in a color distinct from the player's swing arc. During windup the shape SHALL grow more opaque as the windup progresses, and in the active phase it SHALL be drawn at full strength.

#### Scenario: Windup begins
- **WHEN** an enemy starts the windup of an attack
- **THEN** a faint shape is drawn whose apex, direction, range, and angle are those of the attack's hit area

#### Scenario: Windup nearly over
- **WHEN** an enemy is near the end of its windup
- **THEN** the shape is more opaque than it was at the start of the windup

#### Scenario: Active phase
- **WHEN** an enemy's attack is in its active phase
- **THEN** the shape is drawn at full strength

#### Scenario: Attack interrupted
- **WHEN** an enemy is hit during its windup
- **THEN** its shape is no longer drawn

#### Scenario: Not attacking
- **WHEN** an enemy is idle, pursuing, staggered, or in the recovery phase
- **THEN** no shape is drawn for it

### Requirement: Chasers are drawn as entities
Each chaser SHALL be drawn as a placeholder shape distinct from the player and from training dummies, showing its facing angle, with a ground shadow, depth-sorted like any other entity.

#### Scenario: Chaser facing the player
- **WHEN** a chaser pursues the player
- **THEN** the facing indicator on its graphic points toward the player

#### Scenario: Chaser behind the player
- **WHEN** a chaser's ground position is farther up-screen than the player's and their drawings overlap
- **THEN** the player is drawn over the chaser

## MODIFIED Requirements

### Requirement: Swing arc matches the hit area
During the active phase of the player's attack the view SHALL draw the attack's hit area on the ground as the projection of the same sector the simulation uses. During windup it SHALL draw the same shape faintly as a telegraph.

#### Scenario: Active phase
- **WHEN** the player's attack is in its active phase
- **THEN** a bright arc is drawn whose apex, direction, range, and angle are those of the attack's hit area

#### Scenario: Windup
- **WHEN** the player's attack is in its windup phase
- **THEN** the same arc is drawn faintly

#### Scenario: Not attacking
- **WHEN** the player is idle or dashing
- **THEN** no swing arc is drawn for the player

### Requirement: Health bars
An entity other than the player, with health that is below its maximum and not defeated, SHALL have a health bar drawn above it showing current health as a fraction of maximum. The player's health SHALL be shown by the on-screen health display instead.

#### Scenario: Damaged dummy
- **WHEN** a dummy with 200 maximum health has 100 health
- **THEN** a bar above it is half filled

#### Scenario: Undamaged dummy
- **WHEN** a dummy is at maximum health
- **THEN** no health bar is drawn for it

#### Scenario: Damaged chaser
- **WHEN** a chaser has lost health and is not defeated
- **THEN** a bar above it shows its remaining health

#### Scenario: Damaged player
- **WHEN** the player has lost health
- **THEN** no health bar is drawn above the player
