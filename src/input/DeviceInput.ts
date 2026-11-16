import Phaser from 'phaser';
import type { Vec2 } from '../data/room';
import type { InputIntent } from '../sim/state';
import { unprojectGround } from '../view/projection';
import { aimAngle, moveDirection, type MoveKeys } from './intent';
import { afterSteps, isHeld, pressButton, RELEASED, releaseButton, type ButtonLatch } from './latch';

const KEY_CODES: Record<string, keyof MoveKeys> = {
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
};

const DASH_CODE = 'Space';
const LEFT_BUTTON = 0;

/** Reads keyboard and mouse state and turns it into one intent per display frame. */
export class DeviceInput {
  private readonly keys: MoveKeys = { up: false, down: false, left: false, right: false };
  private readonly cursor = new Phaser.Math.Vector2();
  private aim = 0;
  private attack: ButtonLatch = RELEASED;
  private dash: ButtonLatch = RELEASED;

  constructor(private readonly scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is not available');

    // Space must not scroll the page, and right-click must not open a menu over the game.
    keyboard.addCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);
    scene.input.mouse?.disableContextMenu();

    keyboard.on('keydown', this.onKeyDown, this);
    keyboard.on('keyup', this.onKeyUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp, this);
    scene.game.events.on(Phaser.Core.Events.BLUR, this.releaseAll, this);
    scene.game.events.on(Phaser.Core.Events.HIDDEN, this.releaseAll, this);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off('keydown', this.onKeyDown, this);
      keyboard.off('keyup', this.onKeyUp, this);
      scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
      scene.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
      scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp, this);
      scene.game.events.off(Phaser.Core.Events.BLUR, this.releaseAll, this);
      scene.game.events.off(Phaser.Core.Events.HIDDEN, this.releaseAll, this);
    });
  }

  /**
   * Samples the devices. `playerGround` is the player's ground position in
   * world space; `camera` must already be positioned without screen shake.
   */
  sample(playerGround: Vec2, camera: Phaser.Cameras.Scene2D.Camera): InputIntent {
    const move = moveDirection(this.keys);

    // The pointer is in screen space; the camera's current scroll gives the
    // drawn point under it, and the inverse projection gives the ground point
    // drawn there. The scroll is read directly rather than through the
    // camera's matrix, which is only rebuilt at render time and would still
    // hold last frame's screen shake.
    const pointer = this.scene.input.activePointer;
    const ox = camera.width * camera.originX;
    const oy = camera.height * camera.originY;
    this.cursor.set(
      camera.scrollX + ox + (pointer.x - camera.x - ox) / camera.zoom,
      camera.scrollY + oy + (pointer.y - camera.y - oy) / camera.zoom,
    );
    const cursorGround = unprojectGround(this.cursor.x, this.cursor.y);
    this.aim = aimAngle(playerGround, cursorGround, this.aim);

    return { moveX: move.x, moveY: move.y, aim: this.aim, attack: isHeld(this.attack), dash: isHeld(this.dash) };
  }

  /** Tells the input layer how many steps consumed the last sampled intent. */
  consumed(steps: number): void {
    this.attack = afterSteps(this.attack, steps);
    this.dash = afterSteps(this.dash, steps);
  }

  private onKeyDown(event: KeyboardEvent): void {
    // Auto-repeat must not re-press a key that was released by focus loss.
    if (event.repeat) return;
    if (event.code === DASH_CODE) {
      this.dash = pressButton();
      return;
    }
    const key = KEY_CODES[event.code];
    if (key) this.keys[key] = true;
  }

  private onKeyUp(event: KeyboardEvent): void {
    if (event.code === DASH_CODE) {
      this.dash = releaseButton(this.dash);
      return;
    }
    const key = KEY_CODES[event.code];
    if (key) this.keys[key] = false;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (pointer.button === LEFT_BUTTON) this.attack = pressButton();
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.button === LEFT_BUTTON) this.attack = releaseButton(this.attack);
  }

  private releaseAll(): void {
    this.keys.up = this.keys.down = this.keys.left = this.keys.right = false;
    this.attack = RELEASED;
    this.dash = RELEASED;
  }
}
