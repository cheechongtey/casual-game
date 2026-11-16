# Spec Delta

## ADDED Requirements

### Requirement: Defeated chasers stay defeated
A defeated chaser SHALL remain defeated for as long as the room it was defeated in is being played. It SHALL NOT reappear, move, attack, or be hit.

#### Scenario: Long after defeat
- **WHEN** a chaser is defeated and 1200 steps pass
- **THEN** the chaser is still defeated

#### Scenario: Defeated chaser is harmless
- **WHEN** a chaser is defeated during the windup of an attack
- **THEN** the player takes no damage from that attack

## REMOVED Requirements

### Requirement: Chasers reappear after defeat
**Reason**: A room can only be cleared if its enemies stay defeated. Reappearing chasers were a stand-in for encounters, which room clearing now provides.
**Migration**: A room's chasers are restored by entering the room again: a new run after defeat or completion, or reloading the page in the test room. The "Defeated chaser is harmless" scenario moves to the requirement "Defeated chasers stay defeated".
