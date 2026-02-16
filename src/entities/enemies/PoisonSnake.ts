import Phaser from 'phaser';
import { Enemy } from '../Enemy';
import { Projectile } from '../Projectile';
import {
  POISON_SNAKE_SPEED,
  POISON_SNAKE_HP,
  POISON_SNAKE_DAMAGE,
  POISON_SNAKE_SPIT_SPEED,
  POISON_DOT_DAMAGE,
  POISON_DOT_TICKS,
  POISON_DOT_INTERVAL,
} from '../../utils/Constants';

export class PoisonSnake extends Enemy {
  private projectiles: Phaser.GameObjects.Group;
  private spitCooldown: number = 2000;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'poison_snake');
    this.init(POISON_SNAKE_HP, POISON_SNAKE_DAMAGE, POISON_SNAKE_SPEED);
    this.enemyType = 'poison_snake';
    this.detectionRange = 160;
    this.attackRange = 130;
    this.attackCooldown = this.spitCooldown;
    this.body.setSize(16, 6);
    this.body.setOffset(2, 1);

    this.projectiles = scene.add.group({
      classType: Projectile,
      maxSize: 4,
      runChildUpdate: true,
    });
  }

  protected chase(distX: number, dist: number, time: number): void {
    const dir = distX > 0 ? 1 : -1;
    this.setFlipX(dir < 0);

    if (dist < this.attackRange && dist > 50) {
      // In spit range - stop and spit
      this.body.setVelocityX(0);
      this.trySpit(dir, time);
    } else if (dist <= 50) {
      // Too close, slither away
      this.body.setVelocityX(-dir * this.speed * 1.2);
    } else {
      // Approach with a slithering movement
      this.body.setVelocityX(dir * this.speed);
    }
  }

  private trySpit(dir: number, time: number): void {
    if (time - this.lastAttackTime < this.attackCooldown) return;
    this.lastAttackTime = time;

    let spit = this.projectiles.getFirstDead(false) as Projectile | null;
    if (!spit) {
      if (this.projectiles.getLength() < 4) {
        spit = new Projectile(this.scene, this.x, this.y, 'poison_spit');
        this.projectiles.add(spit);
      } else {
        return;
      }
    }

    spit.setPosition(this.x + dir * 8, this.y);
    spit.fire(dir, POISON_SNAKE_SPIT_SPEED, POISON_SNAKE_DAMAGE, true, {
      trajectory: 'parabolic',
      poisonous: true,
      poisonDamage: POISON_DOT_DAMAGE,
      poisonTicks: POISON_DOT_TICKS,
      poisonInterval: POISON_DOT_INTERVAL,
    });

    // Spit animation tint
    this.setTint(0x88ff88);
    this.scene.time.delayedCall(200, () => {
      if (this.active) this.setTint(0xffffff);
    });
  }

  getProjectilesGroup(): Phaser.GameObjects.Group {
    return this.projectiles;
  }
}
