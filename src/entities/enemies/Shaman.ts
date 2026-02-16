import Phaser from 'phaser';
import { Enemy } from '../Enemy';
import { Wolf } from './Wolf';
import {
  SHAMAN_SPEED,
  SHAMAN_HP,
  SHAMAN_DAMAGE,
  SHAMAN_SUMMON_COOLDOWN,
  SHAMAN_BUFF_RANGE,
} from '../../utils/Constants';

export class Shaman extends Enemy {
  private summonCooldown: number = SHAMAN_SUMMON_COOLDOWN;
  private lastSummonTime: number = 0;
  private buffCooldown: number = 3000;
  private lastBuffTime: number = 0;
  private summonedMinions: Enemy[] = [];
  private maxMinions: number = 2;
  private enemiesGroup: Phaser.GameObjects.Group | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'shaman');
    this.init(SHAMAN_HP, SHAMAN_DAMAGE, SHAMAN_SPEED);
    this.enemyType = 'shaman';
    this.detectionRange = 200;
    this.attackRange = 180;
    this.attackCooldown = 2000;
    this.body.setSize(12, 22);
    this.body.setOffset(2, 1);
  }

  setEnemiesGroup(group: Phaser.GameObjects.Group): void {
    this.enemiesGroup = group;
  }

  protected updateAI(time: number, delta: number): void {
    if (!this.player) {
      this.patrol(delta);
      return;
    }

    const distX = this.player.x - this.x;
    const dist = Math.abs(distX);
    const dir = distX > 0 ? 1 : -1;
    this.setFlipX(dir < 0);

    // Clean up dead minions
    this.summonedMinions = this.summonedMinions.filter(m => m.active);

    if (dist < this.detectionRange) {
      // Try to summon minions
      if (this.summonedMinions.length < this.maxMinions &&
          time - this.lastSummonTime > this.summonCooldown) {
        this.summonMinion(time);
      }

      // Try to buff nearby allies
      if (time - this.lastBuffTime > this.buffCooldown) {
        this.buffAllies(time);
      }

      // Keep distance from player - stay at range
      if (dist < 80) {
        // Too close, retreat
        this.body.setVelocityX(-dir * this.speed * 1.5);
      } else if (dist > 160) {
        // Too far, approach
        this.body.setVelocityX(dir * this.speed);
      } else {
        // Good range, strafe
        this.body.setVelocityX(0);
      }
    } else {
      this.patrol(delta);
    }
  }

  private summonMinion(time: number): void {
    this.lastSummonTime = time;

    // Summon effect
    this.setTint(0xff00ff);
    this.scene.time.delayedCall(300, () => {
      if (!this.active) return;
      this.setTint(0xffffff);
    });

    // Portal effect
    const portalX = this.x + (Math.random() > 0.5 ? 40 : -40);
    const portalY = this.y;

    const portal = this.scene.add.sprite(portalX, portalY, 'summon_portal');
    this.scene.tweens.add({
      targets: portal,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 600,
      onComplete: () => portal.destroy(),
    });

    // Spawn wolf minion after brief delay
    this.scene.time.delayedCall(400, () => {
      if (!this.active) return;

      const minion = new Wolf(this.scene, portalX, portalY - 10);
      if (this.player) minion.setPlayer(this.player);

      // Summoned minions have reduced HP
      minion.hp = Math.floor(minion.hp * 0.6);
      minion.maxHp = minion.hp;

      this.summonedMinions.push(minion);

      if (this.enemiesGroup) {
        this.enemiesGroup.add(minion);
      }

      // Add collision with ground groups
      const gameScene = this.scene as any;
      if (gameScene.groundGroup) {
        this.scene.physics.add.collider(minion, gameScene.groundGroup);
      }
      if (gameScene.platformGroup) {
        this.scene.physics.add.collider(minion, gameScene.platformGroup);
      }
    });
  }

  private buffAllies(time: number): void {
    if (!this.enemiesGroup) return;

    this.lastBuffTime = time;
    let buffed = false;

    this.enemiesGroup.getChildren().forEach(child => {
      const enemy = child as Enemy;
      if (enemy === this || !enemy.active) return;

      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (dist < SHAMAN_BUFF_RANGE) {
        // Speed buff
        enemy.speed *= 1.3;
        enemy.setTint(0xff88ff);
        buffed = true;

        // Reset buff after duration
        this.scene.time.delayedCall(3000, () => {
          if (enemy.active) {
            enemy.speed /= 1.3;
            enemy.setTint(0xffffff);
          }
        });
      }
    });

    if (buffed) {
      // Buff cast visual
      const particles = this.scene.add.particles(this.x, this.y, 'particle', {
        speed: { min: 20, max: 60 },
        lifespan: 400,
        quantity: 8,
        scale: { start: 1.5, end: 0 },
        tint: 0xff88ff,
      });
      this.scene.time.delayedCall(400, () => particles.destroy());
    }
  }
}
