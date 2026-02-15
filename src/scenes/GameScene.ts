import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Wolf } from '../entities/enemies/Wolf';
import { Boar } from '../entities/enemies/Boar';
import { SpearThrower } from '../entities/enemies/SpearThrower';
import { BossMammoth } from '../entities/enemies/BossMammoth';
import { WeaponSystem } from '../systems/WeaponSystem';
import { BlessingSystem, Blessing } from '../systems/BlessingSystem';
import { LevelGenerator, ChunkData } from '../systems/LevelGenerator';
import { CampUpgrade } from '../systems/CampUpgrade';
import {
  GAME_WIDTH, GAME_HEIGHT, TILE_SIZE,
  BONE_DROP_CHANCE, TOTEM_DROP_CHANCE,
} from '../utils/Constants';

export class GameScene extends Phaser.Scene {
  // Core entities
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private drops!: Phaser.GameObjects.Group;

  // Systems
  private weaponSystem!: WeaponSystem;
  private blessingSystem!: BlessingSystem;
  private levelGenerator!: LevelGenerator;

  // Terrain
  private groundGroup!: Phaser.Physics.Arcade.StaticGroup;
  private platformGroup!: Phaser.Physics.Arcade.StaticGroup;

  // HUD
  private hpBar!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private boneText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private chapterText!: Phaser.GameObjects.Text;
  private blessingText!: Phaser.GameObjects.Text;

  // State
  private currentChapter: number = 1;
  private chunks: ChunkData[] = [];
  private bossDefeated: boolean = false;
  private isPaused: boolean = false;
  private blessingUI: Phaser.GameObjects.Container | null = null;

  // Camp data
  private campUpgrade!: CampUpgrade;

  // Boss HP bar
  private bossHpBar: Phaser.GameObjects.Graphics | null = null;
  private bossHpText: Phaser.GameObjects.Text | null = null;
  private currentBoss: Enemy | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { chapter?: number }): void {
    this.currentChapter = data.chapter || 1;
    this.bossDefeated = false;
    this.isPaused = false;
    this.currentBoss = null;
  }

  create(): void {
    // Setup systems
    this.campUpgrade = new CampUpgrade();
    this.levelGenerator = new LevelGenerator(this);
    this.blessingSystem = new BlessingSystem(this);

    // Background
    this.cameras.main.setBackgroundColor(this.getChapterBgColor());

    // Create terrain groups
    this.groundGroup = this.physics.add.staticGroup();
    this.platformGroup = this.physics.add.staticGroup();

    // Generate level
    this.chunks = this.levelGenerator.generateLevel(this.currentChapter);
    this.buildTerrain();

    // Create player
    const campData = this.campUpgrade.load();
    const bonuses = this.campUpgrade.getStatBonuses(campData);
    this.player = new Player(this, 100, GAME_HEIGHT - TILE_SIZE * 2 - 30);
    this.player.maxHp += bonuses.hpBonus;
    this.player.hp = this.player.maxHp;

    // Weapon system
    this.weaponSystem = new WeaponSystem(this, this.player);

    // Enemies group
    this.enemies = this.add.group({ runChildUpdate: true });
    this.drops = this.add.group();

    // Spawn enemies
    this.spawnEnemies();

    // Collisions
    this.setupCollisions();

    // Camera
    const totalWidth = this.chunks.length * GAME_WIDTH * 2;
    this.cameras.main.setBounds(0, 0, totalWidth, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.physics.world.setBounds(0, 0, totalWidth, GAME_HEIGHT);

    // HUD
    this.createHUD();

    // Events
    this.events.on('enemyDeath', this.onEnemyDeath, this);
    this.events.on('bossStomp', this.onBossStomp, this);

    // Add parallax background elements
    this.createBackgroundDecor();
  }

  private getChapterBgColor(): number {
    switch (this.currentChapter) {
      case 1: return 0x2d5a1e; // Jungle green
      case 2: return 0x8B7355; // Wasteland brown
      case 3: return 0x4a1a0a; // Volcano red-brown
      default: return 0x2d5a1e;
    }
  }

  private buildTerrain(): void {
    for (const chunk of this.chunks) {
      // Ground segments
      for (const seg of chunk.groundSegments) {
        const tileCount = Math.ceil(seg.width / TILE_SIZE);
        for (let i = 0; i < tileCount; i++) {
          const tile = this.groundGroup.create(
            seg.x + i * TILE_SIZE + TILE_SIZE / 2,
            GAME_HEIGHT - TILE_SIZE + TILE_SIZE / 2,
            'ground'
          ) as Phaser.Physics.Arcade.Sprite;
          tile.setImmovable(true);
          tile.refreshBody();

          // Second layer of ground below
          const tile2 = this.groundGroup.create(
            seg.x + i * TILE_SIZE + TILE_SIZE / 2,
            GAME_HEIGHT + TILE_SIZE / 2,
            'ground'
          ) as Phaser.Physics.Arcade.Sprite;
          tile2.setImmovable(true);
          tile2.refreshBody();
        }
      }

      // Platforms
      for (const plat of chunk.platforms) {
        const tileCount = Math.ceil(plat.width / TILE_SIZE);
        for (let i = 0; i < tileCount; i++) {
          const tile = this.platformGroup.create(
            plat.x + i * TILE_SIZE + TILE_SIZE / 2,
            plat.y + TILE_SIZE / 2,
            'platform'
          ) as Phaser.Physics.Arcade.Sprite;
          tile.setImmovable(true);
          tile.refreshBody();
        }
      }
    }
  }

  private spawnEnemies(): void {
    for (const chunk of this.chunks) {
      for (const spawn of chunk.enemySpawns) {
        let enemy: Enemy;
        switch (spawn.type) {
          case 'wolf':
            enemy = new Wolf(this, spawn.x, spawn.y);
            break;
          case 'boar':
            enemy = new Boar(this, spawn.x, spawn.y);
            break;
          case 'spear_thrower':
            enemy = new SpearThrower(this, spawn.x, spawn.y);
            break;
          case 'boss_mammoth':
            enemy = new BossMammoth(this, spawn.x, spawn.y);
            this.currentBoss = enemy;
            break;
          default:
            enemy = new Wolf(this, spawn.x, spawn.y);
        }
        enemy.setPlayer(this.player);
        this.enemies.add(enemy);
      }

      // Spawn items
      for (const item of chunk.itemSpawns) {
        const drop = this.physics.add.sprite(item.x, item.y, item.type === 'bone' ? 'bone' : 'totem_fragment');
        (drop.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        drop.setData('type', item.type);
        this.drops.add(drop);

        // Float animation
        this.tweens.add({
          targets: drop,
          y: item.y - 5,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }
  }

  private setupCollisions(): void {
    // Player vs terrain
    this.physics.add.collider(this.player, this.groundGroup);
    this.physics.add.collider(this.player, this.platformGroup);

    // Enemies vs terrain
    this.physics.add.collider(this.enemies, this.groundGroup);
    this.physics.add.collider(this.enemies, this.platformGroup);

    // Player arrows vs enemies
    this.physics.add.overlap(
      this.weaponSystem.getProjectilesGroup(),
      this.enemies,
      this.onArrowHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Player vs enemies (contact damage)
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.onPlayerTouchEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Player vs drops
    this.physics.add.overlap(
      this.player,
      this.drops,
      this.onPlayerCollectDrop as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
  }

  private onArrowHitEnemy = (_arrow: Phaser.GameObjects.GameObject, _enemy: Phaser.GameObjects.GameObject): void => {
    const arrow = _arrow as Projectile;
    const enemy = _enemy as Enemy;

    if (!arrow.active || !enemy.active) return;

    enemy.takeDamage(arrow.damage);

    // Burn damage
    if (this.weaponSystem.burnDamage > 0) {
      let ticks = 3;
      const timer = this.time.addEvent({
        delay: 500,
        callback: () => {
          if (enemy.active) {
            enemy.takeDamage(this.weaponSystem.burnDamage);
          }
          ticks--;
          if (ticks <= 0) timer.remove();
        },
        repeat: 2,
      });
    }

    if (!this.weaponSystem.piercing) {
      arrow.deactivate();
    }
  };

  private onPlayerTouchEnemy = (_player: Phaser.GameObjects.GameObject, _enemy: Phaser.GameObjects.GameObject): void => {
    const enemy = _enemy as Enemy;
    if (!enemy.active || this.player.isRolling) return;
    this.player.takeDamage(enemy.damage);

    if (this.player.hp <= 0) {
      this.gameOver();
    }
  };

  private onPlayerCollectDrop = (_player: Phaser.GameObjects.GameObject, _drop: Phaser.GameObjects.GameObject): void => {
    const drop = _drop as Phaser.Physics.Arcade.Sprite;
    if (!drop.active) return;

    const type = drop.getData('type');
    if (type === 'bone') {
      this.player.bones += this.blessingSystem.luckyBones ? 2 : 1;
    } else if (type === 'totem') {
      this.player.totemFragments++;
      if (this.player.totemFragments >= 3) {
        this.player.totemFragments = 0;
        this.showBlessingChoice();
      }
    }

    // Collect effect
    const particles = this.add.particles(drop.x, drop.y, 'particle', {
      speed: { min: 20, max: 40 },
      lifespan: 200,
      quantity: 5,
      scale: { start: 1, end: 0 },
      tint: type === 'bone' ? 0xf0e6d2 : 0x9b59b6,
    });
    this.time.delayedCall(200, () => particles.destroy());

    drop.setActive(false);
    drop.setVisible(false);
    drop.destroy();
  };

  private onEnemyDeath = (enemy: Enemy): void => {
    // Drop items
    if (Math.random() < BONE_DROP_CHANCE) {
      this.spawnDrop(enemy.x, enemy.y, 'bone');
    }

    const campData = this.campUpgrade.load();
    const bonuses = this.campUpgrade.getStatBonuses(campData);
    const effectiveTotemChance = TOTEM_DROP_CHANCE + bonuses.totemDropBonus;
    if (Math.random() < effectiveTotemChance) {
      this.spawnDrop(enemy.x, enemy.y, 'totem');
    }

    // Check if boss was defeated
    if (enemy.enemyType === 'boss_mammoth') {
      this.bossDefeated = true;
      this.currentBoss = null;
      this.time.delayedCall(1500, () => this.chapterComplete());
    }
  };

  private onBossStomp = (x: number, _y: number): void => {
    const dist = Math.abs(this.player.x - x);
    if (dist < 80 && this.player.body.onFloor()) {
      this.player.takeDamage(25);
      if (this.player.hp <= 0) this.gameOver();
    }
  };

  private spawnDrop(x: number, y: number, type: string): void {
    const tex = type === 'bone' ? 'bone' : 'totem_fragment';
    const drop = this.physics.add.sprite(x, y - 10, tex);
    (drop.body as Phaser.Physics.Arcade.Body).setVelocityY(-80);
    (drop.body as Phaser.Physics.Arcade.Body).setVelocityX(Phaser.Math.Between(-30, 30));
    drop.setData('type', type);
    this.drops.add(drop);

    // Setup collection overlap
    this.physics.add.overlap(this.player, drop, this.onPlayerCollectDrop as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
  }

  private showBlessingChoice(): void {
    this.isPaused = true;
    this.physics.pause();

    const choices = this.blessingSystem.getRandomChoices();
    const cam = this.cameras.main;
    const centerX = cam.scrollX + cam.width / 2;
    const centerY = cam.scrollY + cam.height / 2;

    this.blessingUI = this.add.container(centerX, centerY);
    this.blessingUI.setDepth(100);
    this.blessingUI.setScrollFactor(0);
    this.blessingUI.setPosition(cam.width / 2, cam.height / 2);

    // Background overlay
    const overlay = this.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 0.7);
    this.blessingUI.add(overlay);

    // Title
    const title = this.add.text(0, -80, 'TOTEM BLESSING', {
      fontSize: '12px',
      color: '#ffcc00',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.blessingUI.add(title);

    const subtitle = this.add.text(0, -65, 'Choose one:', {
      fontSize: '8px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.blessingUI.add(subtitle);

    // Blessing options
    choices.forEach((blessing, i) => {
      const y = -30 + i * 40;
      const bg = this.add.rectangle(0, y, 200, 32, 0x333355, 0.9)
        .setInteractive({ useHandCursor: true });

      const nameText = this.add.text(-90, y - 8, `${blessing.icon} ${blessing.name}`, {
        fontSize: '8px',
        color: '#ffffff',
        fontFamily: 'monospace',
      });

      const descText = this.add.text(-90, y + 4, blessing.description, {
        fontSize: '7px',
        color: '#aaaaaa',
        fontFamily: 'monospace',
      });

      bg.on('pointerover', () => bg.setFillStyle(0x555577, 1));
      bg.on('pointerout', () => bg.setFillStyle(0x333355, 0.9));
      bg.on('pointerdown', () => this.selectBlessing(blessing));

      this.blessingUI!.add([bg, nameText, descText]);
    });
  }

  private selectBlessing(blessing: Blessing): void {
    this.blessingSystem.applyBlessing(blessing, this.player, this.weaponSystem);

    if (this.blessingUI) {
      this.blessingUI.destroy(true);
      this.blessingUI = null;
    }

    this.isPaused = false;
    this.physics.resume();
  }

  private createHUD(): void {
    const hudContainer = this.add.container(0, 0);
    hudContainer.setDepth(50);
    hudContainer.setScrollFactor(0);

    // HP bar background
    this.hpBar = this.add.graphics();
    hudContainer.add(this.hpBar);

    // HP text
    this.hpText = this.add.text(10, 3, '', {
      fontSize: '7px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    hudContainer.add(this.hpText);

    // Bone counter
    this.boneText = this.add.text(10, 18, '', {
      fontSize: '7px',
      color: '#f0e6d2',
      fontFamily: 'monospace',
    });
    hudContainer.add(this.boneText);

    // Weapon indicator
    this.weaponText = this.add.text(GAME_WIDTH - 10, 5, '', {
      fontSize: '7px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(1, 0);
    hudContainer.add(this.weaponText);

    // Chapter indicator
    this.chapterText = this.add.text(GAME_WIDTH / 2, 5, '', {
      fontSize: '8px',
      color: '#ffcc00',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0);
    hudContainer.add(this.chapterText);

    // Blessing count
    this.blessingText = this.add.text(GAME_WIDTH - 10, 18, '', {
      fontSize: '7px',
      color: '#9b59b6',
      fontFamily: 'monospace',
    }).setOrigin(1, 0);
    hudContainer.add(this.blessingText);

    // Boss HP bar
    this.bossHpBar = this.add.graphics();
    this.bossHpBar.setDepth(50);
    this.bossHpBar.setScrollFactor(0);

    this.bossHpText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 25, '', {
      fontSize: '7px',
      color: '#ff4444',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0).setDepth(50).setScrollFactor(0);
  }

  private updateHUD(): void {
    // HP bar
    this.hpBar.clear();
    const barWidth = 80;
    const barHeight = 6;
    this.hpBar.fillStyle(0x333333);
    this.hpBar.fillRect(10, 10, barWidth, barHeight);
    const hpRatio = this.player.hp / this.player.maxHp;
    this.hpBar.fillStyle(hpRatio > 0.5 ? 0x44cc44 : hpRatio > 0.25 ? 0xcccc44 : 0xcc4444);
    this.hpBar.fillRect(10, 10, barWidth * hpRatio, barHeight);

    this.hpText.setText(`HP: ${this.player.hp}/${this.player.maxHp}`);
    this.boneText.setText(`Bones: ${this.player.bones}  Totem: ${this.player.totemFragments}/3`);
    this.weaponText.setText(this.weaponSystem.getCurrentWeaponName());
    this.chapterText.setText(`Chapter ${this.currentChapter}`);
    this.blessingText.setText(`Blessings: ${this.blessingSystem.getBlessingCount()}`);

    // Boss HP bar - only show when player is near boss
    if (this.currentBoss && this.currentBoss.active &&
        Math.abs(this.player.x - this.currentBoss.x) < 400) {
      const bossBarWidth = 150;
      const bossBarHeight = 6;
      const bossBarX = GAME_WIDTH / 2 - bossBarWidth / 2;
      const bossBarY = GAME_HEIGHT - 18;

      this.bossHpBar!.clear();
      this.bossHpBar!.fillStyle(0x333333);
      this.bossHpBar!.fillRect(bossBarX, bossBarY, bossBarWidth, bossBarHeight);
      const bossRatio = this.currentBoss.hp / this.currentBoss.maxHp;
      this.bossHpBar!.fillStyle(0xff4444);
      this.bossHpBar!.fillRect(bossBarX, bossBarY, bossBarWidth * bossRatio, bossBarHeight);

      this.bossHpText!.setText('MAMMOTH');
      this.bossHpText!.setVisible(true);
    } else {
      this.bossHpBar!.clear();
      this.bossHpText!.setVisible(false);
    }
  }

  private createBackgroundDecor(): void {
    // Simple background parallax trees/mountains
    const totalWidth = this.chunks.length * GAME_WIDTH * 2;
    const bgLayer = this.add.graphics();
    bgLayer.setDepth(-10);

    // Far mountains
    for (let x = 0; x < totalWidth; x += 200) {
      const h = 40 + Math.random() * 60;
      const color = this.currentChapter === 1 ? 0x1a4010 :
        this.currentChapter === 2 ? 0x6b5040 : 0x3a0a0a;
      bgLayer.fillStyle(color, 0.5);
      bgLayer.fillTriangle(x, GAME_HEIGHT - 32, x + 100, GAME_HEIGHT - 32 - h, x + 200, GAME_HEIGHT - 32);
    }

    // Trees/rocks depending on chapter
    for (let x = 50; x < totalWidth; x += 80 + Math.random() * 120) {
      if (this.currentChapter === 1) {
        // Trees
        const treeH = 20 + Math.random() * 30;
        bgLayer.fillStyle(0x2a4a1a, 0.6);
        bgLayer.fillRect(x, GAME_HEIGHT - 32 - treeH, 4, treeH);
        bgLayer.fillStyle(0x3a6a2a, 0.5);
        bgLayer.fillCircle(x + 2, GAME_HEIGHT - 32 - treeH - 8, 10 + Math.random() * 6);
      } else if (this.currentChapter === 2) {
        // Rocks
        const rockH = 8 + Math.random() * 15;
        bgLayer.fillStyle(0x7a6a5a, 0.5);
        bgLayer.fillRect(x, GAME_HEIGHT - 32 - rockH, 12 + Math.random() * 8, rockH);
      } else {
        // Lava glow
        bgLayer.fillStyle(0xff4400, 0.2);
        bgLayer.fillCircle(x, GAME_HEIGHT - 40, 15 + Math.random() * 10);
      }
    }
  }

  private chapterComplete(): void {
    if (this.currentChapter < 3) {
      // Show chapter complete and advance
      const cam = this.cameras.main;
      const text = this.add.text(cam.width / 2, cam.height / 2, `CHAPTER ${this.currentChapter} COMPLETE!`, {
        fontSize: '14px',
        color: '#ffcc00',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

      this.time.delayedCall(2000, () => {
        text.destroy();
        this.scene.restart({ chapter: this.currentChapter + 1 });
      });
    } else {
      // Victory!
      this.gameWin();
    }
  }

  private gameOver(): void {
    // Save bones
    const campData = this.campUpgrade.load();
    campData.bones += this.player.bones;
    campData.totalRuns++;
    if (this.currentChapter > campData.bestChapter) {
      campData.bestChapter = this.currentChapter;
    }
    this.campUpgrade.save(campData);

    this.time.delayedCall(500, () => {
      this.scene.start('GameOverScene', {
        bones: this.player.bones,
        chapter: this.currentChapter,
        blessings: this.blessingSystem.getBlessingCount(),
        victory: false,
      });
    });
  }

  private gameWin(): void {
    const campData = this.campUpgrade.load();
    campData.bones += this.player.bones + 50; // Bonus for winning
    campData.totalRuns++;
    campData.bestChapter = 3;
    this.campUpgrade.save(campData);

    this.time.delayedCall(500, () => {
      this.scene.start('GameOverScene', {
        bones: this.player.bones + 50,
        chapter: 3,
        blessings: this.blessingSystem.getBlessingCount(),
        victory: true,
      });
    });
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;

    this.player.update(time, delta);

    // Handle enemy spear thrower projectiles vs player
    this.enemies.getChildren().forEach(e => {
      if (e instanceof SpearThrower && e.active) {
        const group = e.getProjectilesGroup();
        group.getChildren().forEach(p => {
          const proj = p as Projectile;
          if (proj.active && proj.isEnemyProjectile) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, proj.x, proj.y);
            if (dist < 14) {
              this.player.takeDamage(proj.damage);
              proj.deactivate();
              if (this.player.hp <= 0) this.gameOver();
            }
          }
        });
      }
    });

    // Shooting
    if (this.player.isShootKeyDown()) {
      this.weaponSystem.tryShoot(time);
    }

    // Weapon switch
    if (this.player.isSwitchWeaponJustDown()) {
      this.weaponSystem.switchWeapon();
    }

    // Fall death
    if (this.player.y > GAME_HEIGHT + 50) {
      this.player.hp = 0;
      this.gameOver();
    }

    this.updateHUD();
  }
}
