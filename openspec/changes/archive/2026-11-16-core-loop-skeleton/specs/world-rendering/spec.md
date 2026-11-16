# Spec Delta

## Purpose

Defines how simulation state is drawn in the 3/4 oblique view: projection from world to screen, draw order, camera behavior, and placeholder graphics.

## ADDED Requirements

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
