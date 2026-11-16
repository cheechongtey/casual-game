# health-and-damage Specification

## Purpose

Defines what happens when an entity is hit: health and its loss, defeat, knockback, the brief freeze that sells an impact, and the conditions under which a hit has no effect.

## Requirements

### Requirement: Health
An entity that can be hit SHALL have a maximum health and a current health that starts at the maximum and never goes below zero.

#### Scenario: Taking damage
- **WHEN** an entity with 200 health takes 20 damage
- **THEN** its health is 180

#### Scenario: Overkill
- **WHEN** an entity with 10 health takes 40 damage
- **THEN** its health is 0

### Requirement: Defeat
An entity SHALL be defeated on the step its health reaches zero. A defeated entity SHALL NOT take further damage or knockback, SHALL NOT be hit by attacks, and SHALL NOT block movement.

#### Scenario: Final blow
- **WHEN** a hit reduces an entity's health to 0
- **THEN** the entity is defeated on that step

#### Scenario: Hitting a defeated entity
- **WHEN** an attack's hit area covers a defeated entity
- **THEN** the entity is not hit

### Requirement: Knockback
A hit SHALL push its target directly away from the attacker's ground position at the hit's configured knockback speed. The target SHALL then slow to a stop, and SHALL NOT overlap walls or leave the room bounds while being pushed.

#### Scenario: Pushed away
- **WHEN** a target directly to the right of the attacker is hit
- **THEN** the target moves right over the following steps and comes to rest

#### Scenario: Stronger knockback travels farther
- **WHEN** two identical targets are hit, one with twice the knockback speed of the other
- **THEN** the target hit with the higher speed comes to rest farther from where it started

#### Scenario: Pushed into a wall
- **WHEN** a target is knocked toward a wall closer than its knockback would carry it
- **THEN** the target stops touching the wall without overlapping it

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

### Requirement: Invulnerability
An invulnerable entity SHALL take no damage and no knockback, and a hit against it SHALL cause no hitstop.

#### Scenario: Hit while invulnerable
- **WHEN** damage is applied to an invulnerable entity
- **THEN** its health and position are unchanged
- **AND** no hitstop occurs
