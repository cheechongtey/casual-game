import Phaser from 'phaser';
import type { Rect } from '../data/room';
import { startRoom } from '../data/rooms/start';
import { TUNING } from '../data/tuning';
import { DeviceInput } from '../input/DeviceInput';
import { advanceFrame, createClock, type Clock } from '../sim/loop';
import { createSim, getPlayer, type SimState } from '../sim/state';
import { cameraBounds } from './camera';
import { lerp, project } from './projection';

const COLORS = {
  floor: 0x1f2633,
  grid: 0x2a3344,
  wallTop: 0x8892a6,
  wallFront: 0x4d566b,
  shadow: 0x000000,
  player: 0x4fc3f7,
  playerEdge: 0x0d2a3a,
  aim: 0xfff176,
};

// Fixed layers beneath everything that is sorted by ground depth.
const DEPTH_FLOOR = -2;
const DEPTH_SHADOW = -1;
const DEPTH_OVERLAY = 1_000_000;
const GRID_SPACING = 100;
const SEED = 1;

export class GameScene extends Phaser.Scene {
  private sim!: SimState;
  private clock!: Clock;
  private deviceInput!: DeviceInput;
  private playerBody!: Phaser.GameObjects.Graphics;
  private playerShadow!: Phaser.GameObjects.Graphics;
  private debugText!: Phaser.GameObjects.Text;

  constructor() {
    super('game');
  }

  create(): void {
    this.sim = createSim(SEED, startRoom);
    this.clock = createClock();
    this.deviceInput = new DeviceInput(this);

    const { room } = this.sim;
    this.drawFloor(room.width, room.height);
    for (const wall of room.walls) this.drawWall(wall);

    const r = getPlayer(this.sim).radius;
    this.playerShadow = this.add.graphics().setDepth(DEPTH_SHADOW);
    this.playerShadow.fillStyle(COLORS.shadow, 0.35);
    this.playerShadow.fillEllipse(0, 0, r * 2.4, r * 2.4 * TUNING.depthRatio);
    this.playerBody = this.add.graphics();

    const projectedHeight = room.height * TUNING.depthRatio;
    const bounds = cameraBounds(room.width, projectedHeight, TUNING.viewWidth, TUNING.viewHeight);
    this.cameras.main.setBounds(bounds.x, bounds.y, bounds.w, bounds.h);

    this.debugText = this.add
      .text(8, 8, '', { fontFamily: 'monospace', fontSize: '14px', color: '#9fb0c8' })
      .setScrollFactor(0)
      .setDepth(DEPTH_OVERLAY);

    if (import.meta.env.DEV) {
      // Handle for inspecting the running game from the browser console.
      (globalThis as Record<string, unknown>).__scene = this;
    }

    this.drawFrame(1);
  }

  update(_time: number, deltaMs: number): void {
    const player = getPlayer(this.sim);
    const intent = this.deviceInput.sample(player.pos, this.cameras.main);
    const alpha = advanceFrame(this.clock, this.sim, intent, deltaMs / 1000);
    this.drawFrame(alpha);
  }

  /** Draws the current simulation state. Reads the simulation, never writes it. */
  private drawFrame(alpha: number): void {
    const player = getPlayer(this.sim);
    const gx = lerp(player.prevPos.x, player.pos.x, alpha);
    const gy = lerp(player.prevPos.y, player.pos.y, alpha);
    const ground = project(gx, gy, 0);
    const anchor = project(gx, gy, player.z);

    this.playerShadow.setPosition(ground.x, ground.y);
    this.playerBody.setPosition(anchor.x, anchor.y).setDepth(gy);
    this.drawPlayerBody(player.radius, player.facing);

    this.cameras.main.centerOn(ground.x, ground.y);

    this.debugText.setText(
      `tick ${this.sim.tick}   fps ${this.game.loop.actualFps.toFixed(0)}\n` +
        `pos ${player.pos.x.toFixed(1)}, ${player.pos.y.toFixed(1)}   ` +
        `facing ${Phaser.Math.RadToDeg(player.facing).toFixed(0)} deg`,
    );
  }

  /**
   * The body stands on its anchor (the feet). The aim line starts at the feet
   * and lies on the ground, so on screen it points exactly at the cursor.
   */
  private drawPlayerBody(radius: number, facing: number): void {
    const g = this.playerBody;
    g.clear();
    g.fillStyle(COLORS.player, 1);
    g.lineStyle(2, COLORS.playerEdge, 1);
    g.fillCircle(0, -radius * 0.9, radius);
    g.strokeCircle(0, -radius * 0.9, radius);

    const reach = radius * 2.6;
    const tip = project(Math.cos(facing) * reach, Math.sin(facing) * reach, 0);
    g.lineStyle(3, COLORS.aim, 1);
    g.lineBetween(0, 0, tip.x, tip.y);
    g.fillStyle(COLORS.aim, 1);
    g.fillCircle(tip.x, tip.y, 3);
  }

  private drawFloor(width: number, height: number): void {
    const g = this.add.graphics().setDepth(DEPTH_FLOOR);
    const far = project(width, height);
    g.fillStyle(COLORS.floor, 1);
    g.fillRect(0, 0, far.x, far.y);

    g.lineStyle(1, COLORS.grid, 1);
    for (let x = 0; x <= width; x += GRID_SPACING) {
      g.lineBetween(x, 0, x, far.y);
    }
    for (let y = 0; y <= height; y += GRID_SPACING) {
      const sy = project(0, y).y;
      g.lineBetween(0, sy, far.x, sy);
    }
  }

  /** A wall is a lifted top face plus a darker front face, sorted by its front edge. */
  private drawWall(wall: Rect): void {
    const h = TUNING.wallHeight;
    const back = project(wall.x, wall.y, h);
    const front = project(wall.x, wall.y + wall.h, h);
    const base = project(wall.x, wall.y + wall.h, 0);

    const g = this.add.graphics().setDepth(wall.y + wall.h);
    g.fillStyle(COLORS.wallTop, 1);
    g.fillRect(back.x, back.y, wall.w, front.y - back.y);
    g.fillStyle(COLORS.wallFront, 1);
    g.fillRect(front.x, front.y, wall.w, base.y - front.y);
  }
}
