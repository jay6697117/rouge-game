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

    // Particle
    const particleGfx = this.make.graphics({ x: 0, y: 0 });
    particleGfx.fillStyle(0xffffff);
    particleGfx.fillRect(0, 0, 2, 2);
    particleGfx.generateTexture('particle', 2, 2);
    particleGfx.destroy();
  }
}
