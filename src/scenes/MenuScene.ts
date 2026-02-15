import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x1a1a2e);

    // Title
    this.add.text(GAME_WIDTH / 2, 60, 'STONE AGE', {
      fontSize: '24px',
      color: '#f5a623',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 90, 'SURVIVORS', {
      fontSize: '20px',
      color: '#e8941a',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 120, 'A Rogue-lite Tribal Shooter', {
      fontSize: '8px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Menu options
    const startBtn = this.add.text(GAME_WIDTH / 2, 180, '[ START HUNT ]', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setColor('#f5a623'));
    startBtn.on('pointerout', () => startBtn.setColor('#ffffff'));
    startBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { chapter: 1 });
    });

    const campBtn = this.add.text(GAME_WIDTH / 2, 210, '[ TRIBAL CAMP ]', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    campBtn.on('pointerover', () => campBtn.setColor('#f5a623'));
    campBtn.on('pointerout', () => campBtn.setColor('#ffffff'));
    campBtn.on('pointerdown', () => {
      this.scene.start('CampScene');
    });

    // Controls info
    this.add.text(GAME_WIDTH / 2, 270, 'CONTROLS', {
      fontSize: '8px',
      color: '#cccccc',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const controls = [
      'Arrow Keys / WASD - Move',
      'C / Up Arrow - Jump (x2)',
      'X - Shoot',
      'Shift - Dodge Roll',
      'Z - Switch Weapon',
    ];

    controls.forEach((line, i) => {
      this.add.text(GAME_WIDTH / 2, 285 + i * 12, line, {
        fontSize: '7px',
        color: '#888888',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    });

    // Version
    this.add.text(GAME_WIDTH - 5, GAME_HEIGHT - 8, 'v0.1', {
      fontSize: '6px',
      color: '#444444',
      fontFamily: 'monospace',
    }).setOrigin(1, 1);
  }
}
