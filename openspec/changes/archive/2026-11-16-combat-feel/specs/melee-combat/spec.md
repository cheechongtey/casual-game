# Spec Delta

## Purpose

Defines the player's melee attacks: how an attack unfolds over time, how attacks chain into a combo, where an attack can hit, and how attack input is interpreted.

## ADDED Requirements

### Requirement: Attack phases
An attack SHALL proceed through windup, active, and recovery phases in that order, each lasting its configured number of simulation steps, and SHALL be able to hit only during the active phase.

#### Scenario: Target in range throughout
- **WHEN** the player attacks with a target inside the hit area for the whole attack
- **THEN** the target takes no damage during windup
- **AND** the target takes damage on the first step of the active phase

#### Scenario: Target arrives during recovery
- **WHEN** a target enters the hit area only after the active phase has ended
- **THEN** the target takes no damage from that attack

### Requirement: Starting an attack
The player SHALL start an attack when attack input is held or buffered and the player is neither attacking nor dashing.

#### Scenario: Attack from idle
- **WHEN** the player is idle and attack input becomes held
- **THEN** the first attack of the combo starts on that step

#### Scenario: Holding attack
- **WHEN** attack input stays held after an attack's recovery ends
- **THEN** the next attack starts on the following step without a new press

### Requirement: Three-attack combo
Attacks SHALL advance through a sequence of three. The next attack in the sequence is used when it starts within the configured combo window after the previous attack ended; otherwise the sequence restarts from the first attack. After the third attack the sequence restarts.

#### Scenario: Chaining
- **WHEN** the player starts a second attack within the combo window after the first ends
- **THEN** the second attack of the sequence is performed

#### Scenario: Window expires
- **WHEN** the player starts an attack after the combo window has passed
- **THEN** the first attack of the sequence is performed

#### Scenario: After the finisher
- **WHEN** the player starts an attack immediately after the third attack ends
- **THEN** the first attack of the sequence is performed

### Requirement: Each attack has its own values
Each attack in the sequence SHALL use its own configured phase durations, damage, knockback, hit range, hit angle, lunge distance, and hitstop.

#### Scenario: Finisher hits harder
- **WHEN** the third attack hits a target
- **THEN** the damage dealt equals the third attack's configured damage, which is greater than the first attack's

### Requirement: Attack input buffering
An attack press made while the player is attacking or dashing SHALL be remembered for the configured buffer duration and SHALL start an attack if the player becomes able to attack within that time.

#### Scenario: Press late in recovery
- **WHEN** attack is pressed and released during recovery, within the buffer duration of the recovery ending
- **THEN** the next attack starts on the step after recovery ends

#### Scenario: Press too early
- **WHEN** attack is pressed and released earlier than the buffer duration before the attack ends
- **THEN** no attack starts when the attack ends

### Requirement: Attack direction is locked
An attack's direction SHALL be the aim angle on the step it starts and SHALL NOT change until the attack ends.

#### Scenario: Aiming elsewhere mid-swing
- **WHEN** an attack starts with the aim angle at 0 degrees and the aim angle changes to 90 degrees during windup
- **THEN** the hit area during the active phase is centered on 0 degrees

### Requirement: Arc-shaped hit area
An attack's hit area SHALL be the circular sector with its apex at the player's ground position, centered on the attack direction, with the attack's configured range and angle. A target is hit when its circle overlaps that sector.

#### Scenario: Target directly ahead in range
- **WHEN** a target's circle lies in front of the player within the attack range
- **THEN** the target is hit

#### Scenario: Target behind the player
- **WHEN** a target is within range but directly behind the attack direction
- **THEN** the target is not hit

#### Scenario: Target beyond range
- **WHEN** the nearest point of a target's circle is farther than the attack range
- **THEN** the target is not hit

#### Scenario: Target clipped by the edge of the arc
- **WHEN** a target's center is outside the sector's angle but its circle crosses the sector's edge within range
- **THEN** the target is hit

### Requirement: One hit per target per attack
A single attack SHALL damage each target at most once.

#### Scenario: Target stays in the arc
- **WHEN** a target remains inside the hit area for every step of the active phase
- **THEN** the target takes that attack's damage exactly once

### Requirement: Lunge
On the first step of the active phase the player SHALL begin moving forward along the attack direction, covering the attack's configured lunge distance by the end of the active phase, subject to wall collision.

#### Scenario: Lunge in the open
- **WHEN** an attack with a lunge distance of 12 units completes its active phase with no move input and no obstacle
- **THEN** the player has moved 12 units along the attack direction

#### Scenario: Lunge into a wall
- **WHEN** the player attacks while touching a wall in the attack direction
- **THEN** the player does not overlap the wall
