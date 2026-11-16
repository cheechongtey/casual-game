import { describe, expect, it } from 'vitest';
import { TUNING } from '../src/data/tuning';
import { aimAngle, moveDirection } from '../src/input/intent';
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
