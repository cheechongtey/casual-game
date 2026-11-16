# world-rendering Specification

## Purpose

Defines how simulation state is drawn in the 3/4 oblique view: projection from world to screen, draw order, camera behavior, and placeholder graphics.

## Requirements

### Requirement: Oblique projection
The view SHALL place every world point on screen using one projection: horizontal position unchanged, depth compressed vertically by a single configured ratio, and height above ground shifting the point straight up the screen.

#### Scenario: Depth is compressed
- **WHEN** two ground points are 100 world units apart in depth and the ratio is 0.6
- **THEN** they are drawn 60 screen units apart vertically

#### Scenario: Height lifts the drawing
- **WHEN** an entity is 20 world units above the ground
- **THEN** it is drawn 20 screen units higher than its ground position

#### Scenario: Round trip
- **WHEN** a ground point is projected to the screen and that screen point is converted back to the ground
- **THEN** the result equals the original ground point

### Requirement: Depth-sorted drawing
Entities and walls SHALL be drawn in order of ground depth, so that whatever is nearer the bottom of the screen is drawn in front.

#### Scenario: Player behind a wall
- **WHEN** the player's ground position is farther up-screen than a wall's front edge and their drawings overlap
- **THEN** the wall is drawn over the player

#### Scenario: Player in front of a wall
- **WHEN** the player's ground position is nearer the bottom of the screen than a wall's front edge and their drawings overlap
- **THEN** the player is drawn over the wall

### Requirement: Walls shown with height
Each wall SHALL be drawn with a visible front face rising above its ground footprint, so the room reads as having depth.

#### Scenario: Wall appearance
- **WHEN** a room with one wall is displayed
- **THEN** the wall shows a top surface and a front face of distinct shades

### Requirement: Ground shadow
Each entity SHALL have a shadow drawn at its ground position, beneath all entities and walls.

#### Scenario: Raised entity
- **WHEN** an entity is 20 world units above the ground
- **THEN** its shadow is drawn at its ground position, 20 screen units below the entity

### Requirement: Facing is visible
The player's placeholder graphic SHALL show its facing angle.

#### Scenario: Aiming around
- **WHEN** the player's facing angle changes from 0 to 90 degrees
- **THEN** the facing indicator on the player's graphic points in the new direction

### Requirement: Camera follows the player
The camera SHALL keep the player in view and SHALL NOT show space beyond the room bounds when the room is larger than the viewport.

#### Scenario: Player near the room edge
- **WHEN** the player stands against the left edge of a room wider than the viewport
- **THEN** the left edge of the view aligns with the left edge of the room
- **AND** the player is visible

#### Scenario: Room smaller than the viewport
- **WHEN** the room is smaller than the viewport
- **THEN** the room is centered in the view

### Requirement: Smooth motion between steps
The view SHALL draw each entity at a position interpolated between its previous and current simulation positions, according to how far the display frame falls between two steps.

#### Scenario: Frame halfway between steps
- **WHEN** a display frame falls exactly halfway between two simulation steps
- **THEN** a moving entity is drawn halfway between its previous and current positions

### Requirement: View does not alter the simulation
Drawing SHALL NOT change simulation state.

#### Scenario: Rendering more often
- **WHEN** the same input sequence is simulated once with the view drawing every frame and once with no view at all
- **THEN** the simulation state is identical in both cases

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
