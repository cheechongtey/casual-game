# Spec Delta

## MODIFIED Requirements

### Requirement: Hitstop
When a hit lands, the attacker and the target SHALL each pause for the hit's configured number of steps: neither moves, and their attack and dash progress, cooldowns, and knockback do not advance. Entities not involved in the hit SHALL continue unaffected. Simulation steps SHALL continue to be counted, and input presses made while the player is paused SHALL still be buffered.

#### Scenario: Freeze on impact
- **WHEN** the player's attack with 3 steps of hitstop hits a target
- **THEN** for the next 3 steps neither the player nor the target changes position and the attack's phase does not advance
- **AND** on the 4th step the attack and the knockback continue

#### Scenario: Bystanders keep moving
- **WHEN** the player's attack hits one enemy while a second enemy, outside the hit area, is pursuing the player
- **THEN** the second enemy keeps moving during the pause

#### Scenario: Player hit by an enemy
- **WHEN** an enemy's attack with 4 steps of hitstop hits the player
- **THEN** for the next 4 steps neither the player nor that enemy changes position
- **AND** on the 5th step the player can move again

#### Scenario: Press during the freeze
- **WHEN** attack is pressed during hitstop
- **THEN** the press is buffered as it would be outside hitstop

#### Scenario: A miss does not freeze
- **WHEN** an attack's active phase passes without hitting anything
- **THEN** no pause occurs
