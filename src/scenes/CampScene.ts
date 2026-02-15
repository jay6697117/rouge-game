import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';
import { CampUpgrade, CampSaveData } from '../systems/CampUpgrade';

export class CampScene extends Phaser.Scene {
  private campUpgrade!: CampUpgrade;
  private saveData!: CampSaveData;
  private boneText!: Phaser.GameObjects.Text;
  private buildingTexts: Phaser.GameObjects.Text[] = [];
  private statusTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'CampScene' });
  }

  create(): void {
    this.campUpgrade = new CampUpgrade();
    this.saveData = this.campUpgrade.load();
    this.buildingTexts = [];
    this.statusTexts = [];

    this.cameras.main.setBackgroundColor(0x2a1a0a);

    // Title
    this.add.text(GAME_WIDTH / 2, 20, 'TRIBAL CAMP', {
      fontSize: '14px',
      color: '#f5a623',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Bone count
    this.boneText = this.add.text(GAME_WIDTH / 2, 42, '', {
      fontSize: '9px',
      color: '#f0e6d2',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Stats
    this.add.text(GAME_WIDTH / 2, 58, `Total Runs: ${this.saveData.totalRuns}  |  Best Chapter: ${this.saveData.bestChapter}`, {
      fontSize: '7px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Buildings
    const buildings = this.campUpgrade.getBuildings(this.saveData);
    buildings.forEach((building, i) => {
      const y = 90 + i * 70;
      const x = GAME_WIDTH / 2;

      // Building name and level
      const nameText = this.add.text(x, y, `${building.name} (Lv.${building.level}/${building.maxLevel})`, {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'monospace',
      }).setOrigin(0.5);

      // Description
      this.add.text(x, y + 14, building.description, {
        fontSize: '7px',
        color: '#aaaaaa',
        fontFamily: 'monospace',
      }).setOrigin(0.5);

      // Current effect
      const effectText = building.level > 0 ?
        `Current: ${building.effects[building.level - 1]}` :
        'Not built yet';
      const statusText = this.add.text(x, y + 26, effectText, {
        fontSize: '7px',
        color: '#88cc88',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.statusTexts.push(statusText);

      // Upgrade button
      if (building.level < building.maxLevel) {
        const canAfford = this.campUpgrade.canUpgrade(building, this.saveData);
        const cost = building.costs[building.level];
        const nextEffect = building.effects[building.level];
        const btnText = this.add.text(x, y + 42, `[ UPGRADE: ${cost} Bones → ${nextEffect} ]`, {
          fontSize: '8px',
          color: canAfford ? '#ffcc00' : '#666666',
          fontFamily: 'monospace',
        }).setOrigin(0.5);

        if (canAfford) {
          btnText.setInteractive({ useHandCursor: true });
          btnText.on('pointerover', () => btnText.setColor('#ffffff'));
          btnText.on('pointerout', () => btnText.setColor('#ffcc00'));
          btnText.on('pointerdown', () => {
            this.saveData = this.campUpgrade.upgrade(building.id, this.saveData);
            this.campUpgrade.save(this.saveData);
            this.scene.restart();
          });
        }

        this.buildingTexts.push(btnText);
      } else {
        this.add.text(x, y + 42, '[ MAX LEVEL ]', {
          fontSize: '8px',
          color: '#44cc44',
          fontFamily: 'monospace',
        }).setOrigin(0.5);
      }
    });

    // Unlocked weapons
    this.add.text(GAME_WIDTH / 2, 310, `Weapons: ${this.saveData.unlockedWeapons.join(', ')}`, {
      fontSize: '7px',
      color: '#cccccc',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.text(GAME_WIDTH / 2, 340, '[ BACK TO MENU ]', {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setColor('#f5a623'));
    backBtn.on('pointerout', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    this.updateBoneText();
  }

  private updateBoneText(): void {
    this.boneText.setText(`Beast Bones: ${this.saveData.bones}`);
  }
}
