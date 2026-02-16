import Phaser from 'phaser';

export type TrajectoryType = 'straight' | 'parabolic';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number = 0;
  public isEnemyProjectile: boolean = false;
  public isPoisonous: boolean = false;
  public poisonDamage: number = 0;
  public poisonTicks: number = 0;
  public poisonInterval: number = 500;
  private trajectory: TrajectoryType = 'straight';
  private maxRange: number = 0; // 0 = unlimited
  private startX: number = 0;
  private lifespan: number = 3000;
  private lived: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
  }

  fire(
    direction: number,
    speed: number,
    damage: number,
    isEnemy: boolean = false,
    options?: {
      trajectory?: TrajectoryType;
      maxRange?: number;
      poisonous?: boolean;
      poisonDamage?: number;
      poisonTicks?: number;
      poisonInterval?: number;
    }
  ): void {
    this.damage = damage;
    this.isEnemyProjectile = isEnemy;
    this.lived = 0;
    this.setActive(true);
    this.setVisible(true);
    this.setFlipX(direction < 0);
    this.setAngle(0);

    const body = this.body as Phaser.Physics.Arcade.Body;

    // Apply options
    this.trajectory = options?.trajectory || 'straight';
    this.maxRange = options?.maxRange || 0;
    this.startX = this.x;
    this.isPoisonous = options?.poisonous || false;
    this.poisonDamage = options?.poisonDamage || 0;
    this.poisonTicks = options?.poisonTicks || 0;
    this.poisonInterval = options?.poisonInterval || 500;

    if (this.trajectory === 'parabolic') {
      body.setAllowGravity(true);
      body.setGravityY(300);
      body.setVelocityX(direction * speed);
      body.setVelocityY(-120); // arc upward
    } else {
      body.setAllowGravity(false);
      body.setGravityY(0);
      body.setVelocityX(direction * speed);
    }

    body.setSize(this.width, this.height);
  }

  update(time: number, delta: number): void {
    this.lived += delta;
    if (this.lived >= this.lifespan) {
      this.deactivate();
      return;
    }

    // Parabolic rotation
    if (this.trajectory === 'parabolic') {
      const body = this.body as Phaser.Physics.Arcade.Body;
      const angle = Math.atan2(body.velocity.y, body.velocity.x);
      this.setRotation(angle);
    }

    // Max range check
    if (this.maxRange > 0) {
      const traveled = Math.abs(this.x - this.startX);
      if (traveled >= this.maxRange) {
        this.deactivate();
        return;
      }
    }

    // Off screen check
    const cam = this.scene.cameras.main;
    if (this.x < cam.scrollX - 100 || this.x > cam.scrollX + cam.width + 100) {
      this.deactivate();
    }

    // Fall off screen for parabolic
    if (this.y > this.scene.scale.height + 50) {
      this.deactivate();
    }
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);
    body.setGravityY(0);
    this.setRotation(0);
    this.setPosition(-100, -100);
  }
}
