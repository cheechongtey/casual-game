import Phaser from 'phaser';
import type { Vec2 } from '../data/room';
import type { InputIntent } from '../sim/state';
import { unprojectGround } from '../view/projection';
import { aimAngle, moveDirection, type MoveKeys } from './intent';

const KEY_CODES: Record<string, keyof MoveKeys> = {
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
};

/** Reads keyboard and mouse state and turns it into one intent per display frame. */
export class DeviceInput {
  private readonly keys: MoveKeys = { up: false, down: false, left: false, right: false };
  private readonly cursor = new Phaser.Math.Vector2();
  private aim = 0;

  constructor(private readonly scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is not available');

    keyboard.on('keydown', this.onKeyDown, this);
    keyboard.on('keyup', this.onKeyUp, this);
    scene.game.events.on(Phaser.Core.Events.BLUR, this.releaseAll, this);
    scene.game.events.on(Phaser.Core.Events.HIDDEN, this.releaseAll, this);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off('keydown', this.onKeyDown, this);
      keyboard.off('keyup', this.onKeyUp, this);
      scene.game.events.off(Phaser.Core.Events.BLUR, this.releaseAll, this);
      scene.game.events.off(Phaser.Core.Events.HIDDEN, this.releaseAll, this);
    });
  }

  /** Samples the devices. `playerGround` is the player's ground position in world space. */
  sample(playerGround: Vec2, camera: Phaser.Cameras.Scene2D.Camera): InputIntent {
    const move = moveDirection(this.keys);

    // The pointer is in screen space; the camera gives the drawn point under
    // it, and the inverse projection gives the ground point drawn there.
    this.scene.input.activePointer.positionToCamera(camera, this.cursor);
    const cursorGround = unprojectGround(this.cursor.x, this.cursor.y);
    this.aim = aimAngle(playerGround, cursorGround, this.aim);

    return { moveX: move.x, moveY: move.y, aim: this.aim };
  }

  private onKeyDown(event: KeyboardEvent): void {
    // Auto-repeat must not re-press a key that was released by focus loss.
    if (event.repeat) return;
    const key = KEY_CODES[event.code];
    if (key) this.keys[key] = true;
  }

  private onKeyUp(event: KeyboardEvent): void {
    const key = KEY_CODES[event.code];
    if (key) this.keys[key] = false;
  }

  private releaseAll(): void {
    this.keys.up = this.keys.down = this.keys.left = this.keys.right = false;
  }
}
