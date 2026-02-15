import Phaser from 'phaser';
import { WeaponSystem } from './WeaponSystem';
import { Player } from '../entities/Player';
import { BLESSING_CHOICES } from '../utils/Constants';

export interface Blessing {
  id: string;
  name: string;
  description: string;
  icon: string;
  apply: (player: Player, weapons: WeaponSystem) => void;
}

const ALL_BLESSINGS: Blessing[] = [
  {
    id: 'fire_enchant',
    name: 'Fire Enchantment',
    description: 'Arrows deal burn damage',
    icon: '🔥',
    apply: (_player, weapons) => { weapons.burnDamage += 5; },
  },
  {
    id: 'piercing',
    name: 'Piercing Force',
    description: 'Arrows pierce enemies',
    icon: '🎯',
    apply: (_player, weapons) => { weapons.piercing = true; },
  },
  {
    id: 'swift_step',
    name: 'Swift Step',
    description: '+20% move speed',
    icon: '💨',
    apply: (player, _weapons) => {
      const body = player.body as Phaser.Physics.Arcade.Body;
      body.setMaxVelocityX((body.maxVelocity.x || 200) * 1.2);
    },
  },
  {
    id: 'bone_armor',
    name: 'Bone Armor',
    description: '+20 max HP',
    icon: '🦴',
    apply: (player, _weapons) => {
      player.maxHp += 20;
      player.hp += 20;
    },
  },
  {
    id: 'rapid_fire',
    name: 'Rapid Fire',
    description: '25% faster attack speed',
    icon: '⚡',
    apply: (_player, weapons) => { weapons.fireRateMultiplier *= 0.75; },
  },
  {
    id: 'power_shot',
    name: 'Power Shot',
    description: '+30% damage',
    icon: '💪',
    apply: (_player, weapons) => { weapons.damageMultiplier *= 1.3; },
  },
  {
    id: 'heal',
    name: 'Healing Herbs',
    description: 'Restore 30 HP',
    icon: '🌿',
    apply: (player, _weapons) => {
      player.hp = Math.min(player.maxHp, player.hp + 30);
    },
  },
  {
    id: 'thick_skin',
    name: 'Thick Skin',
    description: '+40 max HP',
    icon: '🛡',
    apply: (player, _weapons) => {
      player.maxHp += 40;
      player.hp += 40;
    },
  },
  {
    id: 'double_shot',
    name: 'Double Shot',
    description: 'Fire 2 arrows at once',
    icon: '🏹',
    apply: (_player, weapons) => {
      const weapon = weapons.getCurrentWeapon();
      (weapon as any).burst = Math.min((weapon.burst || 1) + 1, 5);
      (weapon as any).spread = 10;
    },
  },
  {
    id: 'lucky_bones',
    name: 'Lucky Bones',
    description: '+50% bone drops',
    icon: '🍀',
    apply: () => {
      // This is tracked separately in GameScene
    },
  },
];

export class BlessingSystem {
  private scene: Phaser.Scene;
  public activeBlessing: Blessing[] = [];
  public luckyBones: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  getRandomChoices(): Blessing[] {
    const available = ALL_BLESSINGS.filter(
      b => !this.activeBlessing.find(ab => ab.id === b.id) || b.id === 'heal'
    );

    const shuffled = Phaser.Utils.Array.Shuffle([...available]);
    return shuffled.slice(0, Math.min(BLESSING_CHOICES, shuffled.length));
  }

  applyBlessing(blessing: Blessing, player: Player, weapons: WeaponSystem): void {
    blessing.apply(player, weapons);
    this.activeBlessing.push(blessing);
    if (blessing.id === 'lucky_bones') {
      this.luckyBones = true;
    }
  }

  getBlessingCount(): number {
    return this.activeBlessing.length;
  }
}
