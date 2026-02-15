import Phaser from 'phaser';
import { Enemy } from '../Enemy';
import { Projectile } from '../Projectile';
import { SPEAR_THROWER_SPEED, SPEAR_THROWER_HP, SPEAR_THROWER_DAMAGE } from '../../utils/Constants';

export class SpearThrower extends Enemy {
  private projectiles: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'spear_thrower');
    this.init(SPEAR_THROWER_HP, SPEAR_THROWER_DAMAGE, SPEAR_THROWER_SPEED);
    this.enemyType = 'spear_thrower';
    this.detectionRange = 200;
    this.attackRange = 160;
    this.attackCooldown = 1800;
    this.body.setSize(12, 22);
    this.body.setOffset(2, 1);

    this.projectiles = scene.add.group({
      classType: Projectile,
      maxSize: 5,
      runChildUpdate: true,
    });
  }

  protected chase(distX: number, dist: number, time: number): void {
    const dir = distX > 0 ? 1 : -1;
    this.setFlipX(dir < 0);

    if (dist < this.attackRange && dist > 60) {
      // In throwing range - stop and throw
      this.body.setVelocityX(0);
      this.tryThrow(dir, time);
    } else if (dist <= 60) {
      // Too close, back away
      this.body.setVelocityX(-dir * this.speed);
    } else {
      // Approach
      this.body.setVelocityX(dir * this.speed);
    }
  }

  private tryThrow(dir: number, time: number): void {
    if (time - this.lastAttackTime < this.attackCooldown) return;
    this.lastAttackTime = time;

    // Create or reuse projectile
    let spear = this.projectiles.getFirstDead(false) as Projectile | null;
    if (!spear) {
      if (this.projectiles.getLength() < 5) {
        spear = new Projectile(this.scene, this.x, this.y, 'enemy_spear');
        this.projectiles.add(spear);
      } else {
        return;
      }
    }

    spear.setPosition(this.x + dir * 10, this.y - 2);
    spear.fire(dir, 180, this.damage, true);
  }

  getProjectilesGroup(): Phaser.GameObjects.Group {
    return this.projectiles;
  }
}
