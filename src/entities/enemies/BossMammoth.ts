import Phaser from 'phaser';
import { Enemy } from '../Enemy';

export class BossMammoth extends Enemy {
  private phase: number = 1;
  private stompCooldown: number = 3000;
  private chargeCooldown: number = 5000;
  private lastStompTime: number = 0;
  private lastChargeTime: number = 0;
  private isCharging: boolean = false;
  private isStopping: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'boss_mammoth');
    this.init(300, 30, 40);
    this.enemyType = 'boss_mammoth';
    this.detectionRange = 400;
    this.attackRange = 50;
    this.attackCooldown = 1500;
    this.score = 100;
    this.body.setSize(48, 36);
    this.body.setOffset(3, 2);
    this.setScale(1);
  }

  protected updateAI(time: number, delta: number): void {
    if (!this.player) return;

    // Phase 2 at 50% HP
    if (this.hp < this.maxHp * 0.5 && this.phase === 1) {
      this.phase = 2;
      this.speed = 55;
      this.stompCooldown = 2000;
      this.chargeCooldown = 3500;
      this.setTint(0xff8800);
    }

    const distX = this.player.x - this.x;
    const dist = Math.abs(distX);
    const dir = distX > 0 ? 1 : -1;
    this.setFlipX(dir < 0);

    if (this.isCharging || this.isStopping) return;

    // Stomp attack
    if (dist < 120 && time - this.lastStompTime > this.stompCooldown) {
      this.stomp(time);
      return;
    }

    // Charge attack
    if (dist > 100 && dist < 350 && time - this.lastChargeTime > this.chargeCooldown) {
      this.charge(dir, time);
      return;
    }

    // Move toward player
    if (dist > this.attackRange) {
      this.body.setVelocityX(dir * this.speed);
    } else {
      this.body.setVelocityX(0);
      this.tryAttack(time);
    }
  }

  private stomp(time: number): void {
    this.lastStompTime = time;
    this.isStopping = true;
    this.body.setVelocityX(0);

    // Jump up
    this.body.setVelocityY(-200);

    this.scene.time.delayedCall(500, () => {
      if (this.aiState === 'dead') return;
      // Slam down
      this.body.setVelocityY(400);

      this.scene.time.delayedCall(300, () => {
        if (this.aiState === 'dead') return;
        this.isStopping = false;
        // Screen shake
        this.scene.cameras.main.shake(200, 0.01);

        // Emit stomp event for damage in area
        this.scene.events.emit('bossStomp', this.x, this.y);
      });
    });
  }

  private charge(dir: number, time: number): void {
    this.lastChargeTime = time;
    this.isCharging = true;
    this.setTint(this.phase === 2 ? 0xff4400 : 0xff6666);

    // Pause then charge
    this.body.setVelocityX(0);

    this.scene.time.delayedCall(400, () => {
      if (this.aiState === 'dead') return;
      this.body.setVelocityX(dir * this.speed * 4);

      this.scene.time.delayedCall(800, () => {
        this.isCharging = false;
        this.setTint(this.phase === 2 ? 0xff8800 : 0xffffff);
        this.body.setVelocityX(0);
      });
    });
  }
}
