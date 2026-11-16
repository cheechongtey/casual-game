# Spec Delta

## Purpose

Defines how enemies act on their own: when they notice the player, how they move, when and how they attack, how they share the right to attack, and how they react to being hit. The first enemy is the chaser, a melee enemy that closes in and swings.

## ADDED Requirements

### Requirement: Chasers stand where the room places them
When a room is loaded, one chaser SHALL be created at each chaser placement in the room definition, with full health, idle and not moving.

#### Scenario: Room with two chaser placements
- **WHEN** a room with chaser placements at (300, 300) and (600, 300) is loaded
- **THEN** the simulation contains two chasers at those ground positions, each at maximum health

#### Scenario: Room with no enemy placements
- **WHEN** a room with no enemy placements is loaded
- **THEN** the simulation contains no chasers

### Requirement: Noticing the player
A chaser SHALL remain idle until the player's ground position comes within the chaser's configured notice range, or until the chaser is hit. From then on it SHALL pursue the player until it is defeated.

#### Scenario: Player stays far away
- **WHEN** the player stays farther from an idle chaser than its notice range for 600 steps
- **THEN** the chaser's position is unchanged

#### Scenario: Player comes near
- **WHEN** the player moves within an idle chaser's notice range
- **THEN** the chaser begins moving toward the player

#### Scenario: Hit from beyond notice range
- **WHEN** an idle chaser is hit while the player is beyond its notice range
- **THEN** the chaser pursues the player once its stagger ends

#### Scenario: Player retreats after being noticed
- **WHEN** the player moves beyond the notice range of a chaser that has already noticed the player
- **THEN** the chaser keeps pursuing

### Requirement: Pursuit
A pursuing chaser SHALL move toward the player at its configured speed, facing the player, and SHALL stop advancing once the player is within its configured attack distance. It SHALL NOT overlap walls or leave the room bounds.

#### Scenario: Closing in over open ground
- **WHEN** a pursuing chaser is 300 units from a stationary player with nothing between them
- **THEN** after 60 steps the distance between them has shrunk by one second's worth of the chaser's speed

#### Scenario: Arriving
- **WHEN** a pursuing chaser reaches its attack distance from a stationary player
- **THEN** it stops advancing and its circle does not overlap the player's

#### Scenario: Facing while pursuing
- **WHEN** a chaser pursues a player who is directly to its right
- **THEN** the chaser's facing angle is 0 degrees

### Requirement: Steering around a wall
A pursuing chaser whose direct path to the player is blocked by a single rectangular wall SHALL go around the wall and reach the player.

#### Scenario: Pillar in the way
- **WHEN** a 100 by 100 unit wall lies directly between a pursuing chaser and a stationary player
- **THEN** the chaser reaches its attack distance from the player within 10 seconds

#### Scenario: Wide wall in the way
- **WHEN** a wall 300 units wide and 60 units thick lies directly between a pursuing chaser and a stationary player
- **THEN** the chaser reaches its attack distance from the player within 15 seconds

### Requirement: Enemies keep apart
Enemies SHALL NOT come to rest overlapping each other. An enemy's own movement SHALL NOT move the player or a training dummy, and SHALL NOT leave the enemy overlapping either.

#### Scenario: Two chasers converge
- **WHEN** two chasers pursue the same stationary player from the same side until both have stopped advancing
- **THEN** their circles do not overlap

#### Scenario: Chaser reaches a standing player
- **WHEN** a chaser pursues a player who gives no input, until the chaser stops advancing
- **THEN** the player's position is unchanged

#### Scenario: Dummy in the way
- **WHEN** a chaser's path to the player passes through a training dummy
- **THEN** the dummy's position is unchanged and the chaser's circle never overlaps it

### Requirement: Attack phases
A chaser SHALL start an attack when the player is within its attack distance, its attack cooldown has elapsed, and the attacker limit allows it. The attack SHALL proceed through windup, active, and recovery phases, each lasting its configured number of steps, and SHALL be able to hit only during the active phase.

#### Scenario: Player stands still
- **WHEN** a chaser attacks a player who stays inside the attack's hit area
- **THEN** the player takes no damage during windup
- **AND** the player takes the attack's configured damage on the first step of the active phase

#### Scenario: Player steps out during windup
- **WHEN** the player leaves the attack's hit area before the windup ends and stays out
- **THEN** the player takes no damage from that attack

#### Scenario: Player returns during recovery
- **WHEN** the player enters the attack's hit area only after the active phase has ended
- **THEN** the player takes no damage from that attack

### Requirement: Attack direction and hit area
A chaser's attack direction SHALL be the direction from the chaser to the player on the step the attack starts and SHALL NOT change until the attack ends. Its hit area SHALL be the circular sector with its apex at the chaser's ground position, centered on that direction, with the attack's configured range and angle.

#### Scenario: Player sidesteps
- **WHEN** a chaser starts an attack toward a player directly to its right and the player moves to directly below the chaser, outside the sector, before the active phase
- **THEN** the hit area stays centered on 0 degrees
- **AND** the player is not hit

#### Scenario: Facing during an attack
- **WHEN** a chaser is attacking and the player moves around it
- **THEN** the chaser's facing angle stays equal to the attack direction until the attack ends

### Requirement: Committed while attacking
A chaser SHALL NOT pursue or turn during an attack. During the active phase it SHALL move forward along the attack direction by the attack's configured lunge distance, subject to wall collision, and SHALL NOT move by itself in windup or recovery.

#### Scenario: Windup in place
- **WHEN** a chaser is in the windup phase and is not hit
- **THEN** its position does not change

#### Scenario: Lunge
- **WHEN** a chaser's attack with a lunge distance of 16 units completes its active phase with no obstacle
- **THEN** the chaser has moved 16 units along the attack direction

### Requirement: Enemy attacks hit only the player
An enemy attack SHALL damage only the player, at most once per attack, and SHALL have no effect on other enemies or training dummies inside its hit area.

#### Scenario: Another chaser in the arc
- **WHEN** a chaser's hit area covers both the player and another chaser during the active phase
- **THEN** the player is damaged and the other chaser is not

#### Scenario: Player stays in the arc
- **WHEN** the player remains inside the hit area for every step of the active phase
- **THEN** the player takes that attack's damage exactly once

#### Scenario: Dashing through the attack
- **WHEN** the player is dashing while inside the hit area during the active phase
- **THEN** the player's health does not change

### Requirement: Limit on simultaneous attackers
At most the configured number of enemies SHALL be in the windup or active phase of an attack at the same time. An enemy prevented from attacking by this limit SHALL wait and SHALL attack once the limit allows, the enemy that has waited longest going first.

#### Scenario: More chasers than the limit
- **WHEN** four chasers are within attack distance of the player and the limit is 2
- **THEN** on no step are more than two chasers in windup or active

#### Scenario: A place frees up
- **WHEN** a chaser's attack leaves its active phase while another chaser is waiting within attack distance
- **THEN** the waiting chaser starts its attack no later than the following step

### Requirement: Attack cooldown
After a chaser's attack ends, the chaser SHALL NOT start another attack until its configured cooldown has elapsed.

#### Scenario: Player stays in reach
- **WHEN** a chaser finishes an attack and the player stays within its attack distance
- **THEN** the chaser's next attack starts no sooner than the cooldown after the previous one ended

### Requirement: Hits interrupt and stagger
A hit on a chaser SHALL end any attack it is performing without further damage, and the chaser SHALL neither move by itself nor attack until its configured stagger duration has elapsed. It SHALL then resume pursuit.

#### Scenario: Hit during windup
- **WHEN** a chaser is hit during the windup of an attack aimed at a player who stays in the hit area
- **THEN** the player takes no damage from that attack

#### Scenario: Staggered
- **WHEN** a chaser has been hit and its stagger duration has not elapsed
- **THEN** it moves only by knockback and starts no attack

#### Scenario: Recovering from stagger
- **WHEN** a chaser's stagger duration elapses
- **THEN** it pursues the player again

#### Scenario: Interrupted attacker frees its place
- **WHEN** a chaser in windup is hit while another chaser waits because of the attacker limit
- **THEN** the waiting chaser can start its attack

### Requirement: Chasers reappear after defeat
A defeated chaser SHALL reappear at its placement with full health, idle, after its configured respawn delay.

#### Scenario: Respawn
- **WHEN** a chaser is defeated and its respawn delay elapses
- **THEN** the chaser is at its placement position with maximum health and is idle until it notices the player again

#### Scenario: Defeated chaser is harmless
- **WHEN** a chaser is defeated during the windup of an attack
- **THEN** the player takes no damage from that attack
