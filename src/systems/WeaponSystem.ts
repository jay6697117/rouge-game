import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Projectile, TrajectoryType } from '../entities/Projectile';
import {
  STONE_BOW_FIRE_RATE,
  STONE_BOW_DAMAGE,
  STONE_BOW_SPEED,
} from '../utils/Constants';

export interface WeaponConfig {
  name: string;
  fireRate: number;
  damage: number;
  speed: number;
  projectileTexture: string;
  piercing: boolean;
  burst: number;
  spread: number;
  trajectory: TrajectoryType;
  maxRange: number; // 0 = unlimited
  poisonous: boolean;
  poisonDamage: number;
  poisonTicks: number;
}

const WEAPONS: Record<string, WeaponConfig> = {
  stone_bow: {
    name: 'Stone Bow',
    fireRate: STONE_BOW_FIRE_RATE,
    damage: STONE_BOW_DAMAGE,
    speed: STONE_BOW_SPEED,
    projectileTexture: 'arrow',
    piercing: false,
    burst: 1,
    spread: 0,
    trajectory: 'straight',
    maxRange: 0,
    poisonous: false,
    poisonDamage: 0,
    poisonTicks: 0,
  },
  sling: {
    name: 'Sling',
    fireRate: 700,
    damage: 35,
    speed: 220,
    projectileTexture: 'sling_rock',
    piercing: false,
    burst: 1,
    spread: 0,
    trajectory: 'parabolic',
    maxRange: 0,
    poisonous: false,
    poisonDamage: 0,
    poisonTicks: 0,
  },
  blowdart: {
    name: 'Blowdart',
    fireRate: 250,
    damage: 10,
    speed: 350,
    projectileTexture: 'blowdart_dart',
    piercing: true,
    burst: 1,
    spread: 0,
    trajectory: 'straight',
    maxRange: 0,
    poisonous: true,
    poisonDamage: 4,
    poisonTicks: 3,
  },
  throwing_spear: {
    name: 'Throwing Spear',
    fireRate: 900,
    damage: 50,
    speed: 280,
    projectileTexture: 'throwing_spear_proj',
    piercing: false,
    burst: 1,
    spread: 0,
    trajectory: 'straight',
    maxRange: 200,
    poisonous: false,
    poisonDamage: 0,
    poisonTicks: 0,
  },
  slingshot: {
    name: 'Slingshot',
    fireRate: 350,
    damage: 8,
    speed: 280,
    projectileTexture: 'slingshot_pebble',
    piercing: false,
    burst: 3,
    spread: 15,
    trajectory: 'straight',
    maxRange: 0,
    poisonous: false,
    poisonDamage: 0,
    poisonTicks: 0,
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

  /** Set available weapons from camp unlock data */
  setWeaponsFromUnlocks(unlockedWeapons: string[]): void {
    if (unlockedWeapons.length >= 1) {
      this.primaryWeapon = unlockedWeapons[0]; // stone_bow
    }
    if (unlockedWeapons.length >= 2) {
      // Set the most recently unlocked weapon as secondary
      this.secondaryWeapon = unlockedWeapons[unlockedWeapons.length - 1];
      // Don't set secondary same as primary
      if (this.secondaryWeapon === this.primaryWeapon && unlockedWeapons.length > 1) {
        this.secondaryWeapon = unlockedWeapons[1];
      }
    }
  }

  getCurrentWeapon(): WeaponConfig {
    const key = this.usingPrimary ? this.primaryWeapon : (this.secondaryWeapon || this.primaryWeapon);
    return WEAPONS[key] || WEAPONS['stone_bow'];
  }

  getCurrentWeaponName(): string {
    const weapon = this.getCurrentWeapon();
    const slot = this.usingPrimary ? '[1]' : '[2]';
    return `${slot} ${weapon.name}`;
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

    // Stealth crit bonus
    let stealthMultiplier = 1;
    if (this.player.stealthCritBonus) {
      stealthMultiplier = 2;
      this.player.stealthCritBonus = false;
      this.player.isStealthed = false;
    }

    for (let i = 0; i < weapon.burst; i++) {
      const proj = this.getProjectile(weapon.projectileTexture);
      if (!proj) continue;

      const offsetX = direction * 10;
      const offsetY = -2;
      proj.setPosition(this.player.x + offsetX, this.player.y + offsetY);

      const effectiveDamage = weapon.damage * this.damageMultiplier * stealthMultiplier;
      const speed = weapon.speed;
      const isPiercing = weapon.piercing || this.piercing;

      // Apply spread for burst weapons
      if (weapon.burst > 1 && weapon.spread > 0) {
        const angleOffset = (i - (weapon.burst - 1) / 2) * weapon.spread;
        const rad = Phaser.Math.DegToRad(angleOffset);
        proj.fire(direction, speed, effectiveDamage, false, {
          trajectory: weapon.trajectory,
          maxRange: weapon.maxRange,
          poisonous: weapon.poisonous,
          poisonDamage: weapon.poisonDamage,
          poisonTicks: weapon.poisonTicks,
        });
        const body = proj.body as Phaser.Physics.Arcade.Body;
        body.setVelocityY(Math.sin(rad) * speed);
      } else {
        proj.fire(direction, speed, effectiveDamage, false, {
          trajectory: weapon.trajectory,
          maxRange: weapon.maxRange,
          poisonous: weapon.poisonous,
          poisonDamage: weapon.poisonDamage,
          poisonTicks: weapon.poisonTicks,
        });
      }

      // Override piercing if blessed
      if (isPiercing) {
        // The piercing is handled at collision level in GameScene
      }

      results.push(proj);
    }

    return results.length > 0 ? results : null;
  }

  private getProjectile(texture: string): Projectile | null {
    // Try to reuse an inactive projectile with matching texture
    const children = this.projectiles.getChildren() as Projectile[];
    for (const child of children) {
      if (!child.active && child.texture.key === texture) {
        child.setActive(true);
        child.setVisible(true);
        return child;
      }
    }

    // Create new if under limit
    if (this.projectiles.getLength() < 30) {
      const proj = new Projectile(this.scene, -100, -100, texture);
      this.projectiles.add(proj);
      return proj;
    }

    // Last resort: reuse any inactive
    const existing = this.projectiles.getFirstDead(false) as Projectile | null;
    if (existing) {
      existing.setTexture(texture);
      existing.setActive(true);
      existing.setVisible(true);
      return existing;
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
