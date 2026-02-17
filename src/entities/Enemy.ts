import Phaser from 'phaser';
import { Player } from './Player';

export type EnemyState = 'idle' | 'patrol' | 'chase' | 'attack' | 'hurt' | 'dead';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  public hp: number = 40;
  public maxHp: number = 40;
  public damage: number = 15;
  public speed: number = 60;
  public score: number = 10;
  public enemyType: string = 'generic';

  protected aiState: EnemyState = 'patrol';
  protected player: Player | null = null;
  protected patrolDirection: number = 1;
  protected patrolTimer: number = 0;
  protected patrolDuration: number = 2000;
  protected detectionRange: number = 150;
  protected attackRange: number = 30;
  protected attackCooldown: number = 1000;
  protected lastAttackTime: number = 0;
  protected hurtTimer: number = 0;

  private hpBar: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setCollideWorldBounds(false);
  }

  setPlayer(player: Player): void {
    this.player = player;
  }

  init(hp: number, damage: number, speed: number): void {
    this.hp = hp;
    this.maxHp = hp;
    this.damage = damage;
    this.speed = speed;
  }

  update(time: number, delta: number): void {
    if (this.aiState === 'dead') return;

    if (this.hurtTimer > 0) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
      this.aiState = 'patrol';
        this.setTint(0xffffff);
      }
      return;
    }

    // Check off screen - deactivate if too far
    if (this.player) {
      const dist = Math.abs(this.x - this.player.x);
      if (dist > 600) {
        // Too far, stay idle
        this.body.setVelocityX(0);
        return;
      }
    }

    this.updateAI(time, delta);
    this.updateHpBar();
  }

  protected updateAI(time: number, delta: number): void {
    if (!this.player) {
      this.patrol(delta);
      return;
    }

    const distX = this.player.x - this.x;
    const dist = Math.abs(distX);

    if (dist < this.detectionRange) {
      this.aiState = 'chase';
      this.chase(distX, dist, time);
    } else {
      this.aiState = 'patrol';
      this.patrol(delta);
    }
  }

  protected patrol(delta: number): void {
    this.patrolTimer += delta;
    if (this.patrolTimer >= this.patrolDuration) {
      this.patrolTimer = 0;
      this.patrolDirection *= -1;
    }

    this.body.setVelocityX(this.patrolDirection * this.speed * 0.5);
    this.setFlipX(this.patrolDirection < 0);
  }

  protected chase(distX: number, dist: number, time: number): void {
    const dir = distX > 0 ? 1 : -1;
    this.setFlipX(dir < 0);

    if (dist < this.attackRange) {
      this.body.setVelocityX(0);
      this.tryAttack(time);
    } else {
      this.body.setVelocityX(dir * this.speed);
    }
  }

  protected tryAttack(time: number): void {
    if (time - this.lastAttackTime < this.attackCooldown) return;
    this.lastAttackTime = time;
    this.aiState = 'attack';
    // Default melee attack - handled by collision in GameScene
  }

  takeDamage(amount: number): boolean {
    if (this.aiState === 'dead') return false;

    this.hp -= amount;
    this.hurtTimer = 200;
    this.setTint(0xff0000);

    // Knockback
    const kbDir = this.player ? (this.x > this.player.x ? 1 : -1) : 1;
    this.body.setVelocityX(kbDir * 100);
    this.body.setVelocityY(-60);

    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  protected die(): void {
    this.aiState = 'dead';
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(false);

    // Death particles
    const particles = this.scene.add.particles(this.x, this.y, 'particle', {
      speed: { min: 30, max: 80 },
      lifespan: 400,
      quantity: 10,
      scale: { start: 1.5, end: 0 },
      tint: 0xff6666,
    });
    this.scene.time.delayedCall(400, () => particles.destroy());

    // Emit death event
    this.scene.events.emit('enemyDeath', this);

    // Fade and destroy
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.destroyHpBar();
        this.destroy();
      },
    });
  }

  private updateHpBar(): void {
    if (this.hp >= this.maxHp) {
      if (this.hpBar) {
        this.hpBar.destroy();
        this.hpBar = null;
      }
      return;
    }

    if (!this.hpBar) {
      this.hpBar = this.scene.add.graphics();
    }

    this.hpBar.clear();
    const barWidth = 20;
    const barHeight = 3;
    const x = this.x - barWidth / 2;
    const y = this.y - this.height / 2 - 6;

    // Background
    this.hpBar.fillStyle(0x333333);
    this.hpBar.fillRect(x, y, barWidth, barHeight);

    // HP fill
    const ratio = this.hp / this.maxHp;
    this.hpBar.fillStyle(ratio > 0.5 ? 0x00ff00 : ratio > 0.25 ? 0xffff00 : 0xff0000);
    this.hpBar.fillRect(x, y, barWidth * ratio, barHeight);
  }

  private destroyHpBar(): void {
    if (this.hpBar) {
      this.hpBar.destroy();
      this.hpBar = null;
    }
  }
}
