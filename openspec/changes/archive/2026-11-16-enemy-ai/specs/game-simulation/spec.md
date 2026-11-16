# Spec Delta

## ADDED Requirements

### Requirement: Enemy state readable by the view
After each step the simulation SHALL expose, for every enemy, what it is doing (idle, pursuing, attacking with its phase, or staggered) and, while it is attacking, the attack's direction, range, angle, and how far through the windup it is.

#### Scenario: Reading a telegraph
- **WHEN** a chaser is halfway through the windup of an attack
- **THEN** the exposed state identifies it as attacking in the windup phase, gives the attack's direction, range, and angle, and reports the windup as half complete

#### Scenario: Reading a pursuing enemy
- **WHEN** a chaser is pursuing the player
- **THEN** the exposed state identifies it as pursuing and gives no attack area for it
