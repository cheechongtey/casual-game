import { describe, expect, it } from 'vitest';
import { TUNING } from '../src/data/tuning';
import { aimAngle, moveDirection } from '../src/input/intent';
import { afterSteps, isHeld, pressButton, RELEASED, releaseButton } from '../src/input/latch';
import { makeSector } from '../src/sim/sector';
import { arcPoints } from '../src/view/arc';
import { cameraBounds } from '../src/view/camera';
import { lerp, project, unprojectGround } from '../src/view/projection';

const none = { up: false, down: false, left: false, right: false };

describe('projection', () => {
  it('compresses depth by the configured ratio', () => {
    const a = project(0, 0);
    const b = project(0, 100);
    expect(b.y - a.y).toBeCloseTo(100 * TUNING.depthRatio, 9);
    expect(b.x).toBe(a.x);
  });

  it('lifts a raised point straight up the screen', () => {
    const ground = project(50, 200, 0);
    const raised = project(50, 200, 20);
    expect(ground.y - raised.y).toBeCloseTo(20, 9);
    expect(raised.x).toBe(ground.x);
  });

  it('round-trips a ground point', () => {
    const screen = project(123.5, 456.25);
    const back = unprojectGround(screen.x, screen.y);
    expect(back.x).toBeCloseTo(123.5, 9);
    expect(back.y).toBeCloseTo(456.25, 9);
  });

  it('interpolates halfway between previous and current', () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
  });
});

describe('camera bounds', () => {
  it('equals the room when the room is larger than the viewport', () => {
    expect(cameraBounds(2000, 960, 1280, 720)).toEqual({ x: 0, y: 0, w: 2000, h: 960 });
  });

  it('centers a room smaller than the viewport', () => {
    expect(cameraBounds(800, 400, 1280, 720)).toEqual({ x: -240, y: -160, w: 1280, h: 720 });
  });
});

describe('move direction', () => {
  it('points right with length 1 for a single key', () => {
    expect(moveDirection({ ...none, right: true })).toEqual({ x: 1, y: 0 });
  });

  it('points up-right with length 1 on a diagonal', () => {
    const d = moveDirection({ ...none, up: true, right: true });
    expect(d.x).toBeGreaterThan(0);
    expect(d.y).toBeLessThan(0);
    expect(Math.hypot(d.x, d.y)).toBeCloseTo(1, 9);
  });

  it('cancels opposing keys', () => {
    expect(moveDirection({ ...none, left: true, right: true }).x).toBe(0);
  });

  it('has length 0 with no keys', () => {
    expect(moveDirection(none)).toEqual({ x: 0, y: 0 });
  });
});

describe('aim angle', () => {
  const player = { x: 300, y: 300 };

  it('is 0 with the cursor directly to the right', () => {
    expect(aimAngle(player, { x: 400, y: 300 }, 1)).toBe(0);
  });

  it('is 45 degrees up-screen for a cursor 100 right and 100 up in world space', () => {
    // Up-screen is negative y, so the angle is -45 degrees.
    expect(aimAngle(player, { x: 400, y: 200 }, 0)).toBeCloseTo(-Math.PI / 4, 9);
  });

  it('is unaffected by the view compressing the vertical axis', () => {
    const playerScreen = project(player.x, player.y);
    const cursorScreen = project(400, 200);
    // On screen the cursor is not at 45 degrees from the player...
    const screenAngle = Math.atan2(cursorScreen.y - playerScreen.y, cursorScreen.x - playerScreen.x);
    expect(screenAngle).not.toBeCloseTo(-Math.PI / 4, 3);
    // ...but un-projecting it first recovers the world-space angle.
    const ground = unprojectGround(cursorScreen.x, cursorScreen.y);
    expect(aimAngle(player, ground, 0)).toBeCloseTo(-Math.PI / 4, 9);
  });

  it('keeps the previous angle when the cursor is on the player', () => {
    expect(aimAngle(player, { x: 300.5, y: 300 }, Math.PI / 2)).toBe(Math.PI / 2);
  });
});

describe('press latching', () => {
  it('reports a click shorter than a step as held for exactly one step', () => {
    let b = pressButton();
    b = releaseButton(b);
    // Sampled for the next step: still held.
    expect(isHeld(b)).toBe(true);
    b = afterSteps(b, 1);
    expect(isHeld(b)).toBe(false);
  });

  it('keeps a tap held across a display frame in which no step runs', () => {
    let b = pressButton();
    b = releaseButton(b);
    expect(isHeld(b)).toBe(true);
    b = afterSteps(b, 0);
    expect(isHeld(b)).toBe(true);
    b = afterSteps(b, 2);
    expect(isHeld(b)).toBe(false);
  });

  it('stays held while the button is down after a step consumes the press', () => {
    let b = pressButton();
    b = afterSteps(b, 3);
    expect(isHeld(b)).toBe(true);
    b = releaseButton(b);
    expect(isHeld(b)).toBe(false);
  });

  it('starts released', () => {
    expect(isHeld(RELEASED)).toBe(false);
  });
});

describe('swing arc points', () => {
  const apex = { x: 100, y: 200 };
  const dir = 0.4;
  const range = 72;
  const angle = (110 * Math.PI) / 180;

  it('ends on the two straight edges of the hit sector', () => {
    const points = arcPoints(apex, dir, range, angle);
    const sector = makeSector(apex, dir, range, angle);
    const first = points[0];
    const last = points[points.length - 1];
    expect(first.x).toBeCloseTo(apex.x + sector.edgeA.x * range, 9);
    expect(first.y).toBeCloseTo(apex.y + sector.edgeA.y * range, 9);
    expect(last.x).toBeCloseTo(apex.x + sector.edgeB.x * range, 9);
    expect(last.y).toBeCloseTo(apex.y + sector.edgeB.y * range, 9);
  });

  it('lies on the sector boundary at the attack range', () => {
    for (const p of arcPoints(apex, dir, range, angle)) {
      expect(Math.hypot(p.x - apex.x, p.y - apex.y)).toBeCloseTo(range, 9);
    }
  });
});
