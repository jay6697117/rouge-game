import { Enemy } from '../Enemy';
import { BOAR_SPEED, BOAR_HP, BOAR_DAMAGE } from '../../utils/Constants';

export class Boar extends Enemy {
  private isCharging: boolean = false;
  private chargeSpeed: number = BOAR_SPEED * 3;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'boar');
    this.init(BOAR_HP, BOAR_DAMAGE, BOAR_SPEED);
    this.enemyType = 'boar';
    this.detectionRange = 140;
    this.attackRange = 30;
    this.attackCooldown = 2000;
    this.patrolDuration = 3000;
    this.body.setSize(24, 16);
    this.body.setOffset(2, 2);
  }

  protected chase(distX: number, dist: number, time: number): void {
    const dir = distX > 0 ? 1 : -1;
    this.setFlipX(dir < 0);

    if (this.isCharging) return;

    if (dist < 100) {
      this.tryCharge(dir, time);
    } else {
      this.body.setVelocityX(dir * this.speed);
    }
  }

  private tryCharge(dir: number, time: number): void {
    if (time - this.lastAttackTime < this.attackCooldown) {
      this.body.setVelocityX(dir * this.speed);
      return;
    }

    this.lastAttackTime = time;
    this.isCharging = true;

    // Brief pause before charge
    this.body.setVelocityX(0);
    this.setTint(0xff8888);

    this.scene.time.delayedCall(300, () => {
      if (this.state === 'dead') return;
      this.body.setVelocityX(dir * this.chargeSpeed);
      this.setTint(0xff4444);

      this.scene.time.delayedCall(600, () => {
        this.isCharging = false;
        this.setTint(0xffffff);
      });
    });
  }
}
