# Spec Delta

## ADDED Requirements

### Requirement: Swing arc matches the hit area
During an attack's active phase the view SHALL draw the attack's hit area on the ground as the projection of the same sector the simulation uses. During windup it SHALL draw the same shape faintly as a telegraph.

#### Scenario: Active phase
- **WHEN** an attack is in its active phase
- **THEN** a bright arc is drawn whose apex, direction, range, and angle are those of the attack's hit area

#### Scenario: Windup
- **WHEN** an attack is in its windup phase
- **THEN** the same arc is drawn faintly

#### Scenario: Not attacking
- **WHEN** the player is idle or dashing
- **THEN** no arc is drawn

### Requirement: Hit flash
An entity SHALL be drawn in a bright flash color for a short time after it is hit.

#### Scenario: Dummy is hit
- **WHEN** a hit event names a dummy
- **THEN** that dummy is drawn in the flash color and returns to its normal color within a quarter of a second

### Requirement: Screen shake on hit
The view SHALL shake the camera briefly when a hit lands, more strongly for a hit with more hitstop. The shake SHALL NOT change simulation state or the aim angle.

#### Scenario: Shake leaves aim alone
- **WHEN** the camera shakes while the cursor is held still
- **THEN** the aim angle does not change

#### Scenario: Finisher shakes harder
- **WHEN** the third attack of the combo hits
- **THEN** the camera shake is stronger than for the first attack

### Requirement: Health bars
An entity with health that is below its maximum and not defeated SHALL have a health bar drawn above it showing current health as a fraction of maximum.

#### Scenario: Damaged dummy
- **WHEN** a dummy with 200 maximum health has 100 health
- **THEN** a bar above it is half filled

#### Scenario: Undamaged dummy
- **WHEN** a dummy is at maximum health
- **THEN** no health bar is drawn for it

### Requirement: Defeated entities are not drawn
A defeated entity and its shadow SHALL NOT be drawn until it reappears.

#### Scenario: Dummy defeated
- **WHEN** a dummy is defeated
- **THEN** it and its shadow disappear from the view
- **AND** they are drawn again when the dummy reappears

### Requirement: Dash is visible
While the player is dashing the view SHALL draw a trail behind the player and draw the player in a distinct tint.

#### Scenario: Dashing
- **WHEN** the player dashes
- **THEN** a fading trail marks the path of the dash and the player's tint returns to normal when the dash ends

### Requirement: Dummies are drawn as entities
Each training dummy SHALL be drawn as a placeholder shape distinct from the player, with a ground shadow, depth-sorted like any other entity.

#### Scenario: Player behind a dummy
- **WHEN** the player's ground position is farther up-screen than a dummy's and their drawings overlap
- **THEN** the dummy is drawn over the player
