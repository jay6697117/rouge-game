import Phaser from 'phaser';
import {
  PLAYER_SPEED,
  PLAYER_JUMP_VELOCITY,
  PLAYER_DOUBLE_JUMP_VELOCITY,
  PLAYER_ROLL_SPEED,
  PLAYER_ROLL_DURATION,
  PLAYER_ROLL_COOLDOWN,
  PLAYER_MAX_HP,
} from '../utils/Constants';

export class Player extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  // Stats
  public hp: number = PLAYER_MAX_HP;
  public maxHp: number = PLAYER_MAX_HP;
  public bones: number = 0;
  public totemFragments: number = 0;

  // Movement state
  private canDoubleJump: boolean = false;
  private hasDoubleJumped: boolean = false;

  // Rolling state
  public isRolling: boolean = false;
  private rollTime: number = 0;
  private rollCooldownTime: number = 0;
  private rollDirection: number = 1;

  // Combat
  public facingRight: boolean = true;
  private invincible: boolean = false;
  private invincibleTimer: number = 0;
  private readonly INVINCIBLE_DURATION = 500;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private rollKey!: Phaser.Input.Keyboard.Key;
  private shootKey!: Phaser.Input.Keyboard.Key;
  private switchWeaponKey!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;

  // Jump buffer
  private jumpBufferTime: number = 0;
  private readonly JUMP_BUFFER = 100;
  // Coyote time
  private coyoteTime: number = 0;
  private readonly COYOTE_DURATION = 80;
  private wasOnFloor: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(12, 22);
    this.body.setOffset(2, 1);
    this.body.setCollideWorldBounds(false);
    this.body.setMaxVelocityY(500);

    this.setupInput();
  }

  private setupInput(): void {
    const keyboard = this.scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.jumpKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.rollKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.shootKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.switchWeaponKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    // Also support WASD
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  }

  update(time: number, delta: number): void {
    if (this.hp <= 0) return;

    this.updateInvincibility(delta);
    this.updateRoll(delta);

    if (!this.isRolling) {
      this.updateMovement();
      this.updateJump(delta);
    }

    this.updateCoyoteTime(delta);
  }

  private updateMovement(): void {
    const leftDown = this.cursors.left.isDown || this.keyA.isDown;
    const rightDown = this.cursors.right.isDown || this.keyD.isDown;

    if (leftDown) {
      this.body.setVelocityX(-PLAYER_SPEED);
      this.facingRight = false;
      this.setFlipX(true);
    } else if (rightDown) {
      this.body.setVelocityX(PLAYER_SPEED);
      this.facingRight = true;
      this.setFlipX(false);
    } else {
      this.body.setVelocityX(0);
    }
  }

  private updateJump(delta: number): void {
    const onFloor = this.body.onFloor();

    // Reset double jump when landing
    if (onFloor) {
      this.hasDoubleJumped = false;
      this.canDoubleJump = true;
    }

    // Jump buffer
    if (this.jumpBufferTime > 0) {
      this.jumpBufferTime -= delta;
    }

    const justPressedJump = Phaser.Input.Keyboard.JustDown(this.jumpKey) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keyW);

    if (justPressedJump) {
      this.jumpBufferTime = this.JUMP_BUFFER;
    }

    // Try to jump
    if (this.jumpBufferTime > 0) {
      if (onFloor || this.coyoteTime > 0) {
        // Normal jump
        this.body.setVelocityY(PLAYER_JUMP_VELOCITY);
        this.jumpBufferTime = 0;
        this.coyoteTime = 0;
        this.canDoubleJump = true;
      } else if (this.canDoubleJump && !this.hasDoubleJumped) {
        // Double jump
        this.body.setVelocityY(PLAYER_DOUBLE_JUMP_VELOCITY);
        this.hasDoubleJumped = true;
        this.jumpBufferTime = 0;
        this.emitJumpParticles();
      }
    }
  }

  private updateCoyoteTime(delta: number): void {
    const onFloor = this.body.onFloor();
    if (this.wasOnFloor && !onFloor && this.body.velocity.y >= 0) {
      this.coyoteTime = this.COYOTE_DURATION;
    }
    if (this.coyoteTime > 0) {
      this.coyoteTime -= delta;
    }
    this.wasOnFloor = onFloor;
  }

  public tryRoll(): boolean {
    if (this.isRolling || this.rollCooldownTime > 0) return false;

    this.isRolling = true;
    this.rollTime = PLAYER_ROLL_DURATION;
    this.rollDirection = this.facingRight ? 1 : -1;
    this.invincible = true;
    this.setTexture('player_roll');
    this.body.setSize(18, 12);

    return true;
  }

  private updateRoll(delta: number): void {
    // Check roll input
    if (Phaser.Input.Keyboard.JustDown(this.rollKey)) {
      this.tryRoll();
    }

    if (this.rollCooldownTime > 0) {
      this.rollCooldownTime -= delta;
    }

    if (!this.isRolling) return;

    this.rollTime -= delta;
    this.body.setVelocityX(this.rollDirection * PLAYER_ROLL_SPEED);

    if (this.rollTime <= 0) {
      this.isRolling = false;
      this.invincible = false;
      this.rollCooldownTime = PLAYER_ROLL_COOLDOWN;
      this.setTexture('player');
      this.body.setSize(12, 22);
      this.body.setOffset(2, 1);
    }
  }

  private updateInvincibility(delta: number): void {
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= delta;
      // Flicker effect
      this.setAlpha(Math.floor(this.invincibleTimer / 60) % 2 === 0 ? 0.4 : 1);
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.setAlpha(1);
      }
    }
  }

  public takeDamage(amount: number): boolean {
    if (this.invincible || this.hp <= 0) return false;

    this.hp = Math.max(0, this.hp - amount);
    this.invincible = true;
    this.invincibleTimer = this.INVINCIBLE_DURATION;

    // Knockback
    const knockDir = this.facingRight ? -1 : 1;
    this.body.setVelocityX(knockDir * 120);
    this.body.setVelocityY(-100);

    // Hit particles
    this.emitHitParticles();

    return this.hp <= 0;
  }

  public isInvincible(): boolean {
    return this.invincible;
  }

  public canShoot(): boolean {
    return !this.isRolling && this.hp > 0;
  }

  public getShootDirection(): number {
    return this.facingRight ? 1 : -1;
  }

  public isShootKeyDown(): boolean {
    return this.shootKey.isDown;
  }

  public isShootKeyJustDown(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.shootKey);
  }

  public isSwitchWeaponJustDown(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.switchWeaponKey);
  }

  private emitJumpParticles(): void {
    if (!this.scene.add.particles) return;
    const particles = this.scene.add.particles(this.x, this.y + 10, 'particle', {
      speed: { min: 20, max: 50 },
      angle: { min: 220, max: 320 },
      lifespan: 200,
      quantity: 5,
      scale: { start: 1, end: 0 },
      tint: 0xaaaaaa,
    });
    this.scene.time.delayedCall(200, () => particles.destroy());
  }

  private emitHitParticles(): void {
    if (!this.scene.add.particles) return;
    const particles = this.scene.add.particles(this.x, this.y, 'particle', {
      speed: { min: 50, max: 100 },
      lifespan: 300,
      quantity: 8,
      scale: { start: 1.5, end: 0 },
      tint: 0xff0000,
    });
    this.scene.time.delayedCall(300, () => particles.destroy());
  }
}
