import Phaser from 'phaser';
import { COLORS, TILE_SIZE } from '../utils/Constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Generate all placeholder textures
    this.createPlaceholderTextures();
  }

  create(): void {
    this.scene.start('MenuScene');
  }

  private createPlaceholderTextures(): void {
    // Player - 16x24 character
    const playerGfx = this.make.graphics({ x: 0, y: 0 });
    // Body
    playerGfx.fillStyle(COLORS.PLAYER);
    playerGfx.fillRect(2, 4, 12, 12);
    // Head
    playerGfx.fillStyle(0xdeb887);
    playerGfx.fillRect(4, 0, 8, 6);
    // Eyes
    playerGfx.fillStyle(0x000000);
    playerGfx.fillRect(9, 2, 2, 2);
    // Legs
    playerGfx.fillStyle(0x654321);
    playerGfx.fillRect(3, 16, 4, 8);
    playerGfx.fillRect(9, 16, 4, 8);
    playerGfx.generateTexture('player', 16, 24);
    playerGfx.destroy();

    // Player rolling - wider, shorter
    const rollGfx = this.make.graphics({ x: 0, y: 0 });
    rollGfx.fillStyle(COLORS.PLAYER_ROLL);
    rollGfx.fillRoundedRect(0, 4, 20, 14, 4);
    rollGfx.generateTexture('player_roll', 20, 20);
    rollGfx.destroy();

    // Arrow projectile
    const arrowGfx = this.make.graphics({ x: 0, y: 0 });
    arrowGfx.fillStyle(COLORS.ARROW);
    arrowGfx.fillRect(0, 2, 10, 2);
    // Arrow tip
    arrowGfx.fillStyle(0xcccccc);
    arrowGfx.fillTriangle(10, 0, 14, 3, 10, 6);
    arrowGfx.generateTexture('arrow', 14, 6);
    arrowGfx.destroy();

    // Wolf enemy - 20x14
    const wolfGfx = this.make.graphics({ x: 0, y: 0 });
    wolfGfx.fillStyle(COLORS.WOLF);
    wolfGfx.fillRect(2, 2, 14, 8);
    // Head
    wolfGfx.fillRect(16, 0, 6, 8);
    // Legs
    wolfGfx.fillRect(3, 10, 3, 6);
    wolfGfx.fillRect(12, 10, 3, 6);
    // Eye
    wolfGfx.fillStyle(0xff0000);
    wolfGfx.fillRect(18, 2, 2, 2);
    wolfGfx.generateTexture('wolf', 22, 16);
    wolfGfx.destroy();

    // Boar enemy - 24x18
    const boarGfx = this.make.graphics({ x: 0, y: 0 });
    boarGfx.fillStyle(COLORS.BOAR);
    boarGfx.fillRect(2, 4, 18, 10);
    // Head
    boarGfx.fillRect(20, 2, 8, 10);
    // Tusks
    boarGfx.fillStyle(0xffffff);
    boarGfx.fillRect(26, 8, 2, 4);
    // Legs
    boarGfx.fillStyle(0x5a3a0a);
    boarGfx.fillRect(4, 14, 4, 6);
    boarGfx.fillRect(14, 14, 4, 6);
    boarGfx.generateTexture('boar', 28, 20);
    boarGfx.destroy();

    // Spear thrower enemy - 14x24
    const spearGfx = this.make.graphics({ x: 0, y: 0 });
    spearGfx.fillStyle(COLORS.SPEAR_THROWER);
    spearGfx.fillRect(2, 4, 10, 12);
    // Head
    spearGfx.fillStyle(0xc19a6b);
    spearGfx.fillRect(3, 0, 8, 6);
    // Spear in hand
    spearGfx.fillStyle(0x8B7355);
    spearGfx.fillRect(12, 6, 2, 16);
    // Legs
    spearGfx.fillStyle(0x654321);
    spearGfx.fillRect(3, 16, 4, 8);
    spearGfx.fillRect(8, 16, 4, 8);
    spearGfx.generateTexture('spear_thrower', 16, 24);
    spearGfx.destroy();

    // Enemy spear projectile
    const enemySpearGfx = this.make.graphics({ x: 0, y: 0 });
    enemySpearGfx.fillStyle(0x8B7355);
    enemySpearGfx.fillRect(0, 1, 12, 2);
    enemySpearGfx.fillStyle(0xcccccc);
    enemySpearGfx.fillTriangle(12, 0, 16, 2, 12, 4);
    enemySpearGfx.generateTexture('enemy_spear', 16, 4);
    enemySpearGfx.destroy();

    // Ground tile - more visible with dirt/grass pattern
    const groundGfx = this.make.graphics({ x: 0, y: 0 });
    groundGfx.fillStyle(0x5a4a2a); // Dirt brown
    groundGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    groundGfx.fillStyle(0x4a8a2a); // Grass green top
    groundGfx.fillRect(0, 0, TILE_SIZE, 4);
    groundGfx.fillStyle(0x3a7a1a); // Darker grass line
    groundGfx.fillRect(0, 3, TILE_SIZE, 1);
    // Add dirt specks
    groundGfx.fillStyle(0x6a5a3a);
    groundGfx.fillRect(3, 8, 2, 2);
    groundGfx.fillRect(10, 12, 2, 1);
    groundGfx.fillRect(7, 6, 1, 2);
    groundGfx.generateTexture('ground', TILE_SIZE, TILE_SIZE);
    groundGfx.destroy();

    // Platform tile - wooden look
    const platGfx = this.make.graphics({ x: 0, y: 0 });
    platGfx.fillStyle(0x7a6a4a); // Wood brown
    platGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    platGfx.fillStyle(0x8a7a5a); // Lighter top
    platGfx.fillRect(0, 0, TILE_SIZE, 3);
    platGfx.fillStyle(0x6a5a3a); // Dark line
    platGfx.fillRect(0, 3, TILE_SIZE, 1);
    // Wood grain
    platGfx.fillStyle(0x6a5a3a);
    platGfx.fillRect(4, 6, 8, 1);
    platGfx.fillRect(2, 10, 6, 1);
    platGfx.generateTexture('platform', TILE_SIZE, TILE_SIZE);
    platGfx.destroy();

    // Bone drop
    const boneGfx = this.make.graphics({ x: 0, y: 0 });
    boneGfx.fillStyle(COLORS.BONE);
    boneGfx.fillRect(1, 3, 6, 2);
    boneGfx.fillCircle(1, 3, 2);
    boneGfx.fillCircle(7, 3, 2);
    boneGfx.generateTexture('bone', 10, 8);
    boneGfx.destroy();

    // Totem fragment
    const totemGfx = this.make.graphics({ x: 0, y: 0 });
    totemGfx.fillStyle(COLORS.TOTEM);
    totemGfx.fillTriangle(5, 0, 0, 10, 10, 10);
    totemGfx.fillStyle(0xffffff);
    totemGfx.fillCircle(5, 5, 2);
    totemGfx.generateTexture('totem_fragment', 10, 10);
    totemGfx.destroy();

    // Boss placeholder - big mammoth 48x40
    const bossGfx = this.make.graphics({ x: 0, y: 0 });
    bossGfx.fillStyle(0x8B6914);
    bossGfx.fillRect(8, 6, 32, 24);
    // Head
    bossGfx.fillRect(38, 2, 14, 20);
    // Tusks
    bossGfx.fillStyle(0xffffff);
    bossGfx.fillRect(48, 16, 3, 14);
    bossGfx.fillRect(44, 16, 3, 12);
    // Trunk
    bossGfx.fillStyle(0x7B5914);
    bossGfx.fillRect(50, 8, 4, 18);
    // Legs
    bossGfx.fillStyle(0x6B4914);
    bossGfx.fillRect(10, 30, 6, 10);
    bossGfx.fillRect(20, 30, 6, 10);
    bossGfx.fillRect(28, 30, 6, 10);
    // Eye
    bossGfx.fillStyle(0xff0000);
    bossGfx.fillRect(44, 6, 3, 3);
    bossGfx.generateTexture('boss_mammoth', 54, 40);
    bossGfx.destroy();

    // Poison Snake - 16x8 green snake
    const snakeGfx = this.make.graphics({ x: 0, y: 0 });
    snakeGfx.fillStyle(COLORS.POISON_SNAKE);
    snakeGfx.fillRect(0, 2, 12, 4);
    // Head
    snakeGfx.fillRect(12, 0, 5, 6);
    // Eye
    snakeGfx.fillStyle(0xff0000);
    snakeGfx.fillRect(14, 1, 2, 2);
    // Tongue
    snakeGfx.fillStyle(0xff3333);
    snakeGfx.fillRect(17, 2, 3, 1);
    // Tail
    snakeGfx.fillStyle(0x1d6b1d);
    snakeGfx.fillRect(0, 3, 3, 2);
    snakeGfx.generateTexture('poison_snake', 20, 8);
    snakeGfx.destroy();

    // Poison spit projectile - 6x4 green blob
    const spitGfx = this.make.graphics({ x: 0, y: 0 });
    spitGfx.fillStyle(0x44dd44);
    spitGfx.fillCircle(3, 2, 3);
    spitGfx.fillStyle(0x88ff88);
    spitGfx.fillCircle(2, 1, 1);
    spitGfx.generateTexture('poison_spit', 6, 5);
    spitGfx.destroy();

    // Shield Warrior - 16x24 humanoid with shield
    const shieldGfx = this.make.graphics({ x: 0, y: 0 });
    // Body
    shieldGfx.fillStyle(COLORS.SHIELD_WARRIOR);
    shieldGfx.fillRect(2, 4, 10, 12);
    // Head
    shieldGfx.fillStyle(0xc19a6b);
    shieldGfx.fillRect(3, 0, 8, 6);
    // Shield (right side)
    shieldGfx.fillStyle(0xaaaacc);
    shieldGfx.fillRect(12, 2, 4, 14);
    shieldGfx.fillStyle(0x8888aa);
    shieldGfx.fillRect(13, 4, 2, 10);
    // Legs
    shieldGfx.fillStyle(0x555577);
    shieldGfx.fillRect(3, 16, 4, 8);
    shieldGfx.fillRect(8, 16, 4, 8);
    shieldGfx.generateTexture('shield_warrior', 16, 24);
    shieldGfx.destroy();

    // Shaman - 14x24 with staff and headdress
    const shamanGfx = this.make.graphics({ x: 0, y: 0 });
    // Body (robes)
    shamanGfx.fillStyle(COLORS.SHAMAN);
    shamanGfx.fillRect(2, 6, 10, 12);
    // Head
    shamanGfx.fillStyle(0xc19a6b);
    shamanGfx.fillRect(3, 1, 8, 6);
    // Headdress
    shamanGfx.fillStyle(0xff4444);
    shamanGfx.fillRect(2, 0, 10, 2);
    shamanGfx.fillStyle(0xffcc00);
    shamanGfx.fillRect(4, 0, 2, 1);
    shamanGfx.fillRect(8, 0, 2, 1);
    // Staff
    shamanGfx.fillStyle(0x8B7355);
    shamanGfx.fillRect(12, 0, 2, 20);
    // Staff orb
    shamanGfx.fillStyle(0xff00ff);
    shamanGfx.fillCircle(13, 0, 2);
    // Legs
    shamanGfx.fillStyle(0x6a2a8a);
    shamanGfx.fillRect(3, 18, 4, 6);
    shamanGfx.fillRect(8, 18, 4, 6);
    shamanGfx.generateTexture('shaman', 16, 24);
    shamanGfx.destroy();

    // Summon portal effect
    const portalGfx = this.make.graphics({ x: 0, y: 0 });
    portalGfx.fillStyle(0x9933cc, 0.6);
    portalGfx.fillCircle(6, 6, 6);
    portalGfx.fillStyle(0xff00ff, 0.4);
    portalGfx.fillCircle(6, 6, 3);
    portalGfx.generateTexture('summon_portal', 12, 12);
    portalGfx.destroy();

    // Sling rock projectile - 6x6 brown rock
    const rockGfx = this.make.graphics({ x: 0, y: 0 });
    rockGfx.fillStyle(0x887766);
    rockGfx.fillCircle(3, 3, 3);
    rockGfx.fillStyle(0xaa9988);
    rockGfx.fillRect(1, 1, 2, 2);
    rockGfx.generateTexture('sling_rock', 6, 6);
    rockGfx.destroy();

    // Blowdart projectile - 10x2 thin dart
    const dartGfx = this.make.graphics({ x: 0, y: 0 });
    dartGfx.fillStyle(0x8B7355);
    dartGfx.fillRect(0, 1, 8, 1);
    dartGfx.fillStyle(0x44dd44);
    dartGfx.fillRect(8, 0, 3, 3);
    dartGfx.generateTexture('blowdart_dart', 11, 3);
    dartGfx.destroy();

    // Throwing spear projectile - 14x4
    const tSpearGfx = this.make.graphics({ x: 0, y: 0 });
    tSpearGfx.fillStyle(0x8B7355);
    tSpearGfx.fillRect(0, 1, 10, 2);
    tSpearGfx.fillStyle(0xcccccc);
    tSpearGfx.fillTriangle(10, 0, 14, 2, 10, 4);
    tSpearGfx.generateTexture('throwing_spear_proj', 14, 4);
    tSpearGfx.destroy();

    // Slingshot pebble - 4x4
    const pebbleGfx = this.make.graphics({ x: 0, y: 0 });
    pebbleGfx.fillStyle(0x999999);
    pebbleGfx.fillCircle(2, 2, 2);
    pebbleGfx.generateTexture('slingshot_pebble', 4, 4);
    pebbleGfx.destroy();

    // Vine - hanging vine segment
    const vineGfx = this.make.graphics({ x: 0, y: 0 });
    vineGfx.fillStyle(0x228b22);
    vineGfx.fillRect(3, 0, 2, 32);
    vineGfx.fillStyle(0x33aa33);
    vineGfx.fillRect(1, 6, 6, 3);
    vineGfx.fillRect(0, 16, 8, 3);
    vineGfx.fillRect(1, 26, 6, 3);
    vineGfx.generateTexture('vine', 8, 32);
    vineGfx.destroy();

    // Boulder - 16x14 grey rock
    const boulderGfx = this.make.graphics({ x: 0, y: 0 });
    boulderGfx.fillStyle(0x808080);
    boulderGfx.fillRoundedRect(0, 0, 16, 14, 3);
    boulderGfx.fillStyle(0x999999);
    boulderGfx.fillRect(3, 2, 4, 3);
    boulderGfx.fillStyle(0x666666);
    boulderGfx.fillRect(8, 6, 5, 3);
    boulderGfx.generateTexture('boulder', 16, 14);
    boulderGfx.destroy();

    // Poison swamp tile - purple-green
    const swampGfx = this.make.graphics({ x: 0, y: 0 });
    swampGfx.fillStyle(0x2a1a3a);
    swampGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    swampGfx.fillStyle(0x4a0080, 0.6);
    swampGfx.fillRect(0, 0, TILE_SIZE, 4);
    swampGfx.fillStyle(0x33cc33, 0.3);
    swampGfx.fillRect(2, 1, 4, 2);
    swampGfx.fillRect(10, 2, 3, 1);
    // Bubbles
    swampGfx.fillStyle(0x66ff66, 0.5);
    swampGfx.fillCircle(4, 2, 1);
    swampGfx.fillCircle(12, 1, 1);
    swampGfx.generateTexture('poison_swamp', TILE_SIZE, TILE_SIZE);
    swampGfx.destroy();

    // Tall grass - 16x20
    const grassGfx = this.make.graphics({ x: 0, y: 0 });
    grassGfx.fillStyle(0x3a6b1a);
    grassGfx.fillTriangle(2, 20, 3, 0, 5, 20);
    grassGfx.fillStyle(0x4a8b2a);
    grassGfx.fillTriangle(6, 20, 8, 2, 10, 20);
    grassGfx.fillStyle(0x3a7b1a);
    grassGfx.fillTriangle(10, 20, 12, 4, 14, 20);
    grassGfx.fillStyle(0x5a9b3a);
    grassGfx.fillTriangle(0, 20, 1, 6, 3, 20);
    grassGfx.fillTriangle(13, 20, 15, 3, 16, 20);
    grassGfx.generateTexture('tall_grass', 16, 20);
    grassGfx.destroy();

    // Mystery totem object
    const mysteryTotemGfx = this.make.graphics({ x: 0, y: 0 });
    mysteryTotemGfx.fillStyle(0x8B4513);
    mysteryTotemGfx.fillRect(4, 8, 8, 24);
    // Face
    mysteryTotemGfx.fillStyle(0xffcc00);
    mysteryTotemGfx.fillRect(5, 10, 3, 3);
    mysteryTotemGfx.fillRect(10, 10, 3, 3);
    mysteryTotemGfx.fillStyle(0xff4444);
    mysteryTotemGfx.fillRect(6, 16, 6, 2);
    // Top
    mysteryTotemGfx.fillStyle(0x9b59b6);
    mysteryTotemGfx.fillTriangle(8, 0, 0, 10, 16, 10);
    mysteryTotemGfx.generateTexture('mystery_totem', 16, 32);
    mysteryTotemGfx.destroy();

    // Particle
    const particleGfx = this.make.graphics({ x: 0, y: 0 });
    particleGfx.fillStyle(0xffffff);
    particleGfx.fillRect(0, 0, 2, 2);
    particleGfx.generateTexture('particle', 2, 2);
    particleGfx.destroy();
  }
}
