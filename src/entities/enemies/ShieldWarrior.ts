import { Enemy } from '../Enemy';
import { Player } from '../Player';
import {
  SHIELD_WARRIOR_SPEED,
  SHIELD_WARRIOR_HP,
  SHIELD_WARRIOR_DAMAGE,
} from '../../utils/Constants';

export class ShieldWarrior extends Enemy {
  private shieldUp: boolean = true;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'shield_warrior');
    this.init(SHIELD_WARRIOR_HP, SHIELD_WARRIOR_DAMAGE, SHIELD_WARRIOR_SPEED);
    this.enemyType = 'shield_warrior';
    this.detectionRange = 140;
    this.attackRange = 28;
    this.attackCooldown = 1200;
    this.patrolDuration = 2500;
    this.body.setSize(14, 22);
    this.body.setOffset(1, 1);
  }

  takeDamage(amount: number): boolean {
    if (this.aiState === 'dead') return false;

    // Shield blocks frontal attacks: check if attack comes from the direction the warrior is facing
    if (this.shieldUp && this.player) {
      const attackFromRight = this.player.x > this.x;
      const facingRight = !this.flipX;

      // If attack comes from the direction we're facing, shield blocks it
      if ((attackFromRight && facingRight) || (!attackFromRight && !facingRight)) {
        // Shield block! Take reduced damage and show block effect
        this.hurtTimer = 100;
        this.setTint(0xaaaaff);

        // Small knockback but reduced
        const kbDir = this.player ? (this.x > this.player.x ? 1 : -1) : 1;
        this.body.setVelocityX(kbDir * 30);

        // Block particle effect
        const particles = this.scene.add.particles(this.x, this.y, 'particle', {
          speed: { min: 20, max: 50 },
          lifespan: 200,
          quantity: 3,
          scale: { start: 1, end: 0 },
          tint: 0xaaaaff,
        });
        this.scene.time.delayedCall(200, () => particles.destroy());

        // Only take 20% damage through shield
        const reducedAmount = Math.max(1, Math.floor(amount * 0.2));
        this.hp -= reducedAmount;

        if (this.hp <= 0) {
          this.die();
          return true;
        }
        return false;
      }
    }

    // Attack from behind - full damage!
    return super.takeDamage(amount);
  }

  protected chase(distX: number, dist: number, time: number): void {
    const dir = distX > 0 ? 1 : -1;
    this.setFlipX(dir < 0);

    // Shield warrior faces the player and advances slowly
    if (dist < this.attackRange) {
      this.body.setVelocityX(0);
      this.tryAttack(time);

      // Drop shield briefly during attack
      if (time - this.lastAttackTime < 300) {
        this.shieldUp = false;
        this.scene.time.delayedCall(400, () => {
          this.shieldUp = true;
        });
      }
    } else {
      this.body.setVelocityX(dir * this.speed);
      this.shieldUp = true;
    }
  }
}
