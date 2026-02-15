import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: { bones: number; chapter: number; blessings: number; victory: boolean }): void {
    this.cameras.main.setBackgroundColor(data.victory ? 0x1a2a1a : 0x2a1a1a);

    // Title
    const title = data.victory ? 'VICTORY!' : 'FALLEN IN BATTLE';
    const color = data.victory ? '#44cc44' : '#cc4444';

    this.add.text(GAME_WIDTH / 2, 60, title, {
      fontSize: '16px',
      color: color,
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Stats
    const stats = [
      `Chapter Reached: ${data.chapter}`,
      `Bones Collected: ${data.bones}`,
      `Blessings Gained: ${data.blessings}`,
    ];

    if (data.victory) {
      stats.push('', 'All chapters cleared!');
    }

    stats.forEach((line, i) => {
      this.add.text(GAME_WIDTH / 2, 110 + i * 16, line, {
        fontSize: '9px',
        color: '#cccccc',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    });

    // Bones saved message
    this.add.text(GAME_WIDTH / 2, 200, `+${data.bones} bones saved to camp`, {
      fontSize: '9px',
      color: '#f0e6d2',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Buttons
    const retryBtn = this.add.text(GAME_WIDTH / 2, 250, '[ HUNT AGAIN ]', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerover', () => retryBtn.setColor('#f5a623'));
    retryBtn.on('pointerout', () => retryBtn.setColor('#ffffff'));
    retryBtn.on('pointerdown', () => this.scene.start('GameScene', { chapter: 1 }));

    const campBtn = this.add.text(GAME_WIDTH / 2, 280, '[ TRIBAL CAMP ]', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    campBtn.on('pointerover', () => campBtn.setColor('#f5a623'));
    campBtn.on('pointerout', () => campBtn.setColor('#ffffff'));
    campBtn.on('pointerdown', () => this.scene.start('CampScene'));

    const menuBtn = this.add.text(GAME_WIDTH / 2, 310, '[ MAIN MENU ]', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setColor('#f5a623'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#ffffff'));
    menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
