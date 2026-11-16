import Phaser from 'phaser';
import type { Rect, Vec2 } from '../data/room';
import { startRoom } from '../data/rooms/start';
import { TUNING } from '../data/tuning';
import { WEAPON } from '../data/weapons';
import { DeviceInput } from '../input/DeviceInput';
import { advanceFrame, createClock, type Clock } from '../sim/loop';
import { attackArea, createSim, getPlayer, type Entity, type SimEvent, type SimState } from '../sim/state';
import { arcPoints } from './arc';
import { cameraBounds } from './camera';
import { lerp, project } from './projection';

const COLORS = {
  floor: 0x1f2633,
  grid: 0x2a3344,
  wallTop: 0x8892a6,
  wallFront: 0x4d566b,
  shadow: 0x000000,
  player: 0x4fc3f7,
  playerDash: 0xe1f5fe,
  playerEdge: 0x0d2a3a,
  aim: 0xfff176,
  dummy: 0xd7a86e,
  dummyPost: 0x8d6e4a,
  dummyEdge: 0x3e2a17,
  flash: 0xffffff,
  arc: 0xfff176,
  arcFinisher: 0xffb74d,
  barBack: 0x000000,
  barFill: 0xe57373,
  trail: 0x81d4fa,
};

// Fixed layers beneath everything that is sorted by ground depth.
const DEPTH_FLOOR = -3;
const DEPTH_SHADOW = -2;
const DEPTH_ARC = -1;
const DEPTH_BARS = 999_999;
const DEPTH_OVERLAY = 1_000_000;
const GRID_SPACING = 100;
const SEED = 1;

const FLASH_SECONDS = 0.12;
const SHAKE_PER_HITSTOP_STEP = 2.2;
const SHAKE_DECAY_PER_SECOND = 14;
const TRAIL_POOL = 16;
const TRAIL_SECONDS = 0.25;
const BAR_WIDTH = 40;
const BAR_HEIGHT = 5;

interface EntityView {
  body: Phaser.GameObjects.Graphics;
  shadow: Phaser.GameObjects.Graphics;
  bar: Phaser.GameObjects.Graphics;
  /** Seconds of hit flash left. */
  flash: number;
}

interface Ghost {
  g: Phaser.GameObjects.Graphics;
  life: number;
}

export class GameScene extends Phaser.Scene {
  private sim!: SimState;
  private clock!: Clock;
  private deviceInput!: DeviceInput;
  private views = new Map<number, EntityView>();
  private arc!: Phaser.GameObjects.Graphics;
  private ghosts: Ghost[] = [];
  private debugText!: Phaser.GameObjects.Text;
  /** Where the camera looks before shake, in screen space. */
  private cameraTarget: Vec2 = { x: 0, y: 0 };
  /** Current shake amplitude in screen pixels. Owned by the view only. */
  shakeAmplitude = 0;

  constructor() {
    super('game');
  }

  create(): void {
    this.sim = createSim(SEED, startRoom);
    this.clock = createClock();
    this.deviceInput = new DeviceInput(this);
    this.views.clear();
    this.ghosts = [];
    this.shakeAmplitude = 0;

    const { room } = this.sim;
    this.drawFloor(room.width, room.height);
    for (const wall of room.walls) this.drawWall(wall);

    for (const e of this.sim.entities) this.views.set(e.id, this.createEntityView(e));
    this.arc = this.add.graphics().setDepth(DEPTH_ARC);
    for (let i = 0; i < TRAIL_POOL; i++) {
      this.ghosts.push({ g: this.add.graphics().setVisible(false), life: 0 });
    }

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
    const dt = deltaMs / 1000;
    const camera = this.cameras.main;

    // Aim is computed from the unshaken camera, so shake never moves it.
    camera.centerOn(this.cameraTarget.x, this.cameraTarget.y);
    const player = getPlayer(this.sim);
    const intent = this.deviceInput.sample(player.pos, camera);

    const { alpha, events, steps } = advanceFrame(this.clock, this.sim, intent, dt);
    this.deviceInput.consumed(steps);

    this.handleEvents(events);
    this.updateEffects(dt);
    this.drawFrame(alpha);
  }

  private handleEvents(events: SimEvent[]): void {
    for (const ev of events) {
      if (ev.type === 'hit') {
        const view = this.views.get(ev.targetId);
        if (view) view.flash = FLASH_SECONDS;
        this.shakeAmplitude = Math.max(this.shakeAmplitude, ev.hitstop * SHAKE_PER_HITSTOP_STEP);
      }
    }
  }

  private updateEffects(dt: number): void {
    for (const view of this.views.values()) view.flash = Math.max(0, view.flash - dt);
    this.shakeAmplitude *= Math.exp(-SHAKE_DECAY_PER_SECOND * dt);
    if (this.shakeAmplitude < 0.2) this.shakeAmplitude = 0;

    for (const ghost of this.ghosts) {
      if (ghost.life <= 0) continue;
      ghost.life -= dt;
      if (ghost.life <= 0) ghost.g.setVisible(false);
      else ghost.g.setAlpha((ghost.life / TRAIL_SECONDS) * 0.5);
    }
  }

  /** Draws the current simulation state. Reads the simulation, never writes it. */
  private drawFrame(alpha: number): void {
    for (const e of this.sim.entities) this.drawEntity(e, alpha);

    const player = getPlayer(this.sim);
    const gx = lerp(player.prevPos.x, player.pos.x, alpha);
    const gy = lerp(player.prevPos.y, player.pos.y, alpha);
    const ground = project(gx, gy, 0);

    this.drawArc(gx, gy);
    if (this.sim.player.action.kind === 'dash') this.dropGhost(gx, gy, player.radius);

    this.cameraTarget = ground;
    const ox = (Math.random() * 2 - 1) * this.shakeAmplitude;
    const oy = (Math.random() * 2 - 1) * this.shakeAmplitude;
    this.cameras.main.centerOn(ground.x + ox, ground.y + oy);

    this.debugText.setText(
      `tick ${this.sim.tick}   fps ${this.game.loop.actualFps.toFixed(0)}\n` +
        `pos ${player.pos.x.toFixed(1)}, ${player.pos.y.toFixed(1)}   ` +
        `facing ${Phaser.Math.RadToDeg(player.facing).toFixed(0)} deg\n` +
        `action ${this.describeAction()}\n` +
        `combo next ${this.nextComboAttack()}   dash cooldown ${this.sim.player.dashCooldown}   ` +
        `hitstop ${this.sim.hitstop}`,
    );
  }

  private describeAction(): string {
    const a = this.sim.player.action;
    if (a.kind === 'attack') return `attack ${a.index + 1} ${a.phase} (${a.ticksLeft})`;
    if (a.kind === 'dash') return `dash (${a.ticksLeft})`;
    return 'idle';
  }

  private nextComboAttack(): string {
    const c = this.sim.player;
    return c.comboTicksLeft > 0 ? `${c.comboIndex + 1} (${c.comboTicksLeft})` : '1';
  }

  private createEntityView(e: Entity): EntityView {
    const shadow = this.add.graphics().setDepth(DEPTH_SHADOW);
    shadow.fillStyle(COLORS.shadow, 0.35);
    shadow.fillEllipse(0, 0, e.radius * 2.4, e.radius * 2.4 * TUNING.depthRatio);
    return {
      body: this.add.graphics(),
      shadow,
      bar: this.add.graphics().setDepth(DEPTH_BARS),
      flash: 0,
    };
  }

  private drawEntity(e: Entity, alpha: number): void {
    const view = this.views.get(e.id);
    if (!view) return;

    const visible = !e.defeated;
    view.body.setVisible(visible);
    view.shadow.setVisible(visible);
    if (!visible) {
      view.bar.setVisible(false);
      return;
    }

    const gx = lerp(e.prevPos.x, e.pos.x, alpha);
    const gy = lerp(e.prevPos.y, e.pos.y, alpha);
    const ground = project(gx, gy, 0);
    const anchor = project(gx, gy, e.z);

    view.shadow.setPosition(ground.x, ground.y);
    view.body.setPosition(anchor.x, anchor.y).setDepth(gy);
    const flashing = view.flash > 0;
    if (e.kind === 'player') this.drawPlayerBody(view.body, e.radius, e.facing, flashing);
    else this.drawDummyBody(view.body, e.radius, flashing);

    const damaged = e.maxHealth > 0 && e.health < e.maxHealth;
    view.bar.setVisible(damaged);
    if (damaged) this.drawHealthBar(view.bar, anchor, e);
  }

  /**
   * The body stands on its anchor (the feet). The aim line starts at the feet
   * and lies on the ground, so on screen it points exactly at the cursor.
   */
  private drawPlayerBody(g: Phaser.GameObjects.Graphics, radius: number, facing: number, flashing: boolean): void {
    const dashing = this.sim.player.action.kind === 'dash';
    const fill = flashing ? COLORS.flash : dashing ? COLORS.playerDash : COLORS.player;
    g.clear();
    g.fillStyle(fill, 1);
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

  /** A training dummy: a post with a round head, so it reads differently from the player. */
  private drawDummyBody(g: Phaser.GameObjects.Graphics, radius: number, flashing: boolean): void {
    const postW = radius * 0.5;
    const postH = radius * 1.6;
    const headR = radius * 0.8;
    g.clear();
    g.lineStyle(2, COLORS.dummyEdge, 1);
    g.fillStyle(flashing ? COLORS.flash : COLORS.dummyPost, 1);
    g.fillRect(-postW / 2, -postH, postW, postH);
    g.strokeRect(-postW / 2, -postH, postW, postH);
    g.fillStyle(flashing ? COLORS.flash : COLORS.dummy, 1);
    g.fillCircle(0, -postH - headR * 0.6, headR);
    g.strokeCircle(0, -postH - headR * 0.6, headR);
    // A cross-bar for arms.
    g.fillStyle(flashing ? COLORS.flash : COLORS.dummyPost, 1);
    g.fillRect(-radius, -postH * 0.75, radius * 2, postW * 0.6);
  }

  private drawHealthBar(g: Phaser.GameObjects.Graphics, anchor: Vec2, e: Entity): void {
    const x = anchor.x - BAR_WIDTH / 2;
    const y = anchor.y - e.radius * 3.4;
    g.clear();
    g.fillStyle(COLORS.barBack, 0.7);
    g.fillRect(x - 1, y - 1, BAR_WIDTH + 2, BAR_HEIGHT + 2);
    g.fillStyle(COLORS.barFill, 1);
    g.fillRect(x, y, BAR_WIDTH * (e.health / e.maxHealth), BAR_HEIGHT);
  }

  /** The attack's hit sector on the ground: faint in windup, bright in the active phase. */
  private drawArc(gx: number, gy: number): void {
    const g = this.arc;
    g.clear();
    const area = attackArea(this.sim);
    if (!area || area.phase === 'recovery') return;

    const color = area.index === WEAPON.length - 1 ? COLORS.arcFinisher : COLORS.arc;
    const active = area.phase === 'active';
    const ground = [{ x: gx, y: gy }, ...arcPoints({ x: gx, y: gy }, area.dir, area.range, area.angle)];
    const screen = ground.map((p) => {
      const s = project(p.x, p.y, 0);
      return new Phaser.Math.Vector2(s.x, s.y);
    });
    g.fillStyle(color, active ? 0.5 : 0.12);
    g.fillPoints(screen, true);
    g.lineStyle(active ? 2 : 1, color, active ? 0.9 : 0.35);
    g.strokePoints(screen, true);
  }

  private dropGhost(gx: number, gy: number, radius: number): void {
    const ghost = this.ghosts.find((x) => x.life <= 0) ?? this.ghosts[0];
    const anchor = project(gx, gy, 0);
    ghost.life = TRAIL_SECONDS;
    ghost.g
      .clear()
      .fillStyle(COLORS.trail, 1)
      .fillCircle(0, -radius * 0.9, radius)
      .setPosition(anchor.x, anchor.y)
      .setDepth(gy - 0.5)
      .setAlpha(0.5)
      .setVisible(true);
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
