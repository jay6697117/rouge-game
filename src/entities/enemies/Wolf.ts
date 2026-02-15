import { Enemy } from '../Enemy';
import { WOLF_SPEED, WOLF_HP, WOLF_DAMAGE } from '../../utils/Constants';

export class Wolf extends Enemy {
  private lungeTimer: number = 0;
  private isLunging: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'wolf');
    this.init(WOLF_HP, WOLF_DAMAGE, WOLF_SPEED);
    this.enemyType = 'wolf';
    this.detectionRange = 160;
    this.attackRange = 40;
    this.attackCooldown = 1500;
    this.body.setSize(18, 12);
    this.body.setOffset(2, 2);
  }

  protected chase(distX: number, dist: number, time: number): void {
    const dir = distX > 0 ? 1 : -1;
    this.setFlipX(dir < 0);

    if (this.isLunging) return;

    if (dist < 80 && dist > this.attackRange) {
      this.tryLunge(dir, time);
    } else if (dist < this.attackRange) {
      this.body.setVelocityX(0);
      this.tryAttack(time);
    } else {
      this.body.setVelocityX(dir * this.speed);
    }
  }

  private tryLunge(dir: number, time: number): void {
    if (time - this.lastAttackTime < this.attackCooldown) {
      this.body.setVelocityX(dir * this.speed);
      return;
    }
    this.lastAttackTime = time;
    this.isLunging = true;
    this.body.setVelocityX(dir * this.speed * 3);
    this.body.setVelocityY(-80);
    this.setTint(0xffaaaa);

    this.scene.time.delayedCall(400, () => {
      this.isLunging = false;
      this.setTint(0xffffff);
    });
  }
}
