import Phaser from 'phaser';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number = 0;
  public isEnemyProjectile: boolean = false;
  private lifespan: number = 3000;
  private lived: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
  }

  fire(direction: number, speed: number, damage: number, isEnemy: boolean = false): void {
    this.damage = damage;
    this.isEnemyProjectile = isEnemy;
    this.lived = 0;
    this.setActive(true);
    this.setVisible(true);
    this.setFlipX(direction < 0);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(direction * speed);
    body.setSize(this.width, this.height);
  }

  update(time: number, delta: number): void {
    this.lived += delta;
    if (this.lived >= this.lifespan) {
      this.deactivate();
      return;
    }

    // Off screen check
    const cam = this.scene.cameras.main;
    if (this.x < cam.scrollX - 100 || this.x > cam.scrollX + cam.width + 100) {
      this.deactivate();
    }
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.setPosition(-100, -100);
  }
}
