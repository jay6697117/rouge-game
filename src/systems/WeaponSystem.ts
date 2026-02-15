import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import {
  STONE_BOW_FIRE_RATE,
  STONE_BOW_DAMAGE,
  STONE_BOW_SPEED,
} from '../utils/Constants';

export interface WeaponConfig {
  name: string;
  texture: string;
  fireRate: number;
  damage: number;
  speed: number;
  projectileTexture: string;
  piercing: boolean;
  burst: number; // number of projectiles per shot
  spread: number; // angle spread for burst
}

const WEAPONS: Record<string, WeaponConfig> = {
  stone_bow: {
    name: 'Stone Bow',
    texture: 'arrow',
    fireRate: STONE_BOW_FIRE_RATE,
    damage: STONE_BOW_DAMAGE,
    speed: STONE_BOW_SPEED,
    projectileTexture: 'arrow',
    piercing: false,
    burst: 1,
    spread: 0,
  },
  sling: {
    name: 'Sling',
    texture: 'arrow',
    fireRate: 700,
    damage: 35,
    speed: 200,
    projectileTexture: 'arrow',
    piercing: false,
    burst: 1,
    spread: 0,
  },
  blowdart: {
    name: 'Blowdart',
    texture: 'arrow',
    fireRate: 250,
    damage: 10,
    speed: 350,
    projectileTexture: 'arrow',
    piercing: true,
    burst: 1,
    spread: 0,
  },
  throwing_spear: {
    name: 'Throwing Spear',
    texture: 'arrow',
    fireRate: 900,
    damage: 50,
    speed: 250,
    projectileTexture: 'arrow',
    piercing: false,
    burst: 1,
    spread: 0,
  },
  slingshot: {
    name: 'Slingshot',
    texture: 'arrow',
    fireRate: 350,
    damage: 8,
    speed: 280,
    projectileTexture: 'arrow',
    piercing: false,
    burst: 3,
    spread: 15,
  },
};

export class WeaponSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private projectiles: Phaser.GameObjects.Group;
  private lastFireTime: number = 0;

  public primaryWeapon: string = 'stone_bow';
  public secondaryWeapon: string | null = null;
  private usingPrimary: boolean = true;

  // Blessing modifiers
  public damageMultiplier: number = 1;
  public fireRateMultiplier: number = 1;
  public piercing: boolean = false;
  public burnDamage: number = 0;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.projectiles = scene.add.group({
      classType: Projectile,
      maxSize: 30,
      runChildUpdate: true,
    });
  }

  getCurrentWeapon(): WeaponConfig {
    const key = this.usingPrimary ? this.primaryWeapon : (this.secondaryWeapon || this.primaryWeapon);
    return WEAPONS[key];
  }

  getCurrentWeaponName(): string {
    return this.getCurrentWeapon().name;
  }

  switchWeapon(): void {
    if (this.secondaryWeapon) {
      this.usingPrimary = !this.usingPrimary;
    }
  }

  tryShoot(time: number): Projectile[] | null {
    if (!this.player.canShoot()) return null;

    const weapon = this.getCurrentWeapon();
    const effectiveFireRate = weapon.fireRate * this.fireRateMultiplier;

    if (time - this.lastFireTime < effectiveFireRate) return null;

    this.lastFireTime = time;
    const direction = this.player.getShootDirection();
    const results: Projectile[] = [];

    for (let i = 0; i < weapon.burst; i++) {
      const proj = this.getProjectile();
      if (!proj) continue;

      const offsetX = direction * 10;
      const offsetY = -2;
      proj.setPosition(this.player.x + offsetX, this.player.y + offsetY);

      const effectiveDamage = weapon.damage * this.damageMultiplier;
      let speed = weapon.speed;

      // Apply spread for burst weapons
      if (weapon.burst > 1 && weapon.spread > 0) {
        const angleOffset = (i - (weapon.burst - 1) / 2) * weapon.spread;
        const rad = Phaser.Math.DegToRad(angleOffset);
        const body = proj.body as Phaser.Physics.Arcade.Body;
        proj.fire(direction, speed, effectiveDamage);
        body.setVelocityY(Math.sin(rad) * speed);
      } else {
        proj.fire(direction, speed, effectiveDamage);
      }

      results.push(proj);
    }

    return results.length > 0 ? results : null;
  }

  private getProjectile(): Projectile | null {
    // Try to reuse an inactive projectile
    const existing = this.projectiles.getFirstDead(false) as Projectile | null;
    if (existing) {
      existing.setActive(true);
      existing.setVisible(true);
      return existing;
    }

    // Create new if under limit
    if (this.projectiles.getLength() < 30) {
      const proj = new Projectile(this.scene, -100, -100, this.getCurrentWeapon().projectileTexture);
      this.projectiles.add(proj);
      return proj;
    }

    return null;
  }

  getProjectilesGroup(): Phaser.GameObjects.Group {
    return this.projectiles;
  }

  static getWeaponConfig(key: string): WeaponConfig | undefined {
    return WEAPONS[key];
  }

  static getAllWeaponKeys(): string[] {
    return Object.keys(WEAPONS);
  }
}
