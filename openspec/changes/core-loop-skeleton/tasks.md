# Tasks

## 1. Project setup

- [x] 1.1 Initialize git and add a `.gitignore` covering `node_modules` and `dist`; verify `git status` shows neither after an install and build
- [x] 1.2 Create `package.json` with `phaser` pinned to exactly 4.2.1 and dev dependencies `typescript`, `vite`, and `vitest`; verify `npm install` completes without errors
- [x] 1.3 Add `tsconfig.json` with strict mode and `index.html` plus `src/main.ts` booting an empty 1280x720 Phaser game scaled to fit; verify `npm run dev` shows a blank canvas with no console errors
- [x] 1.4 Add `dev`, `build`, `test`, and `typecheck` scripts; verify `npm run build` and `npm run typecheck` both succeed
- [x] 1.5 Create the `src/sim`, `src/data`, `src/input`, and `src/view` folders and a `README.md` describing the layer rule and the scripts; verify the README commands run as written

## 2. Simulation core

- [x] 2.1 Add `data/tuning.ts` with move speed, player radius, depth ratio, and wall height; verify it type-checks and is imported by no Phaser-dependent file
- [x] 2.2 Implement the seeded generator in `sim/rng.ts`; verify tests show identical sequences for the same seed and different sequences for different seeds
- [x] 2.3 Define the simulation state, entity, and `InputIntent` types and a `createSim(seed, room)` function; verify a test creates a simulation in Node with no browser globals
- [x] 2.4 Implement `step(state, intent)` that copies each entity's position to its previous position and increments the tick; verify a test confirms previous and current positions after a step
- [x] 2.5 Add the boundary test that fails if any file in `src/sim` imports `phaser`, references `window` or `document`, or calls `Math.random` or `Date.now`; verify it fails when a violation is added temporarily and passes when removed

## 3. Rooms

- [x] 3.1 Define the `Room` type and write the starting room in `data/rooms/` with bounds larger than the viewport, at least four walls, and a spawn point; verify it type-checks
- [x] 3.2 Implement `loadRoom` validation in `sim` for non-positive bounds, walls outside the bounds, and a blocked spawn point; verify tests cover each rejection with an error naming the cause, plus one valid room
- [x] 3.3 Place the player at the spawn point when a simulation is created; verify a test reads the player position after `createSim`

## 4. Player movement and collision

- [x] 4.1 Implement constant-speed movement from the intent's move direction, normalizing diagonals; verify tests for distance after 60 steps, equal diagonal distance, and no movement on zero intent
- [x] 4.2 Set the player's facing from the intent's aim angle; verify a test with opposing move and aim directions
- [x] 4.3 Implement circle-versus-rectangle resolution with up to 3 passes and the room bounds clamp; verify tests for walking into a wall, into the room edge, sliding along a wall, and rounding an outer corner, with no overlap in any of them
- [x] 4.4 Add a determinism test that runs 600 recorded intents twice with the same seed and compares the full state; verify it passes

## 5. Fixed-timestep loop

- [x] 5.1 Implement the accumulator as a plain function that takes elapsed time and returns the number of steps to run and the interpolation alpha, capped at 5 steps with the remainder dropped; verify tests for 30 fps, 144 fps, and a 2-second stall
- [x] 5.2 Call the accumulator from the Phaser scene's update and step the simulation; verify in the browser that the tick counter shown on a debug overlay advances by about 60 per second

## 6. Oblique view

- [x] 6.1 Implement `project` and `unprojectGround` in `view/projection.ts`; verify tests for depth compression, height offset, and a round trip
- [x] 6.2 Draw the room floor and each wall with a top face and a darker front face, with wall depth set from its front edge; verify in the browser that the starting room shows walls with visible height
- [x] 6.3 Draw the player as a circle with a facing line and a ground shadow, positioned by interpolating previous and current positions with alpha; verify in the browser that motion is smooth and the shadow stays at the ground position
- [x] 6.4 Set entity depth from ground `y`; verify in the browser that the player is hidden behind a wall when above its front edge and drawn over it when below
- [x] 6.5 Make the camera follow the player's projected ground point, bounded to the projected room and centered when the room is smaller than the viewport; verify in the browser that no space outside the room is shown at any room edge

## 7. Input

- [x] 7.1 Implement the move direction from W, A, S, and D as a pure function of key state; verify tests for single key, diagonal length 1, opposing keys, and no keys
- [x] 7.2 Implement the aim angle as a pure function of player ground position and cursor ground position, retaining the previous angle within 1 world unit; verify tests for cursor to the right, the 45-degree case, and cursor on the player
- [x] 7.3 Wire Phaser keyboard and pointer state into those functions, using `unprojectGround` on the cursor, and clear held keys on window blur; verify in the browser that the facing line tracks the cursor exactly and that switching windows while holding a key stops the player
- [x] 7.4 Pass one intent per display frame to every simulation step in that frame; verify with a test of the scene-independent loop function that two steps in one frame receive the same intent

## 8. Integration check

- [x] 8.1 Run `npm run typecheck`, `npm test`, and `npm run build`; verify all three succeed
- [x] 8.2 Play the built game with `npm run preview`: move in all eight directions, aim through a full circle, slide along every wall, and reach all four room edges; verify no overlap, no jitter, and no console errors
- [x] 8.3 Throttle the browser to a low frame rate and to a high refresh rate; verify the time to cross the room is the same in both
- [x] 8.4 Run `openspec validate core-loop-skeleton --strict`; verify it reports no errors
