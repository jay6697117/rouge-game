import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Wolf } from '../entities/enemies/Wolf';
import { Boar } from '../entities/enemies/Boar';
import { SpearThrower } from '../entities/enemies/SpearThrower';
import { BossMammoth } from '../entities/enemies/BossMammoth';
import { PoisonSnake } from '../entities/enemies/PoisonSnake';
import { ShieldWarrior } from '../entities/enemies/ShieldWarrior';
import { Shaman } from '../entities/enemies/Shaman';
import { WeaponSystem } from '../systems/WeaponSystem';
import { BlessingSystem, Blessing } from '../systems/BlessingSystem';
import { LevelGenerator, ChunkData } from '../systems/LevelGenerator';
import { CampUpgrade } from '../systems/CampUpgrade';
import { SoundManager } from '../systems/SoundManager';
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
  private soundManager!: SoundManager;

  // Terrain
  public groundGroup!: Phaser.Physics.Arcade.StaticGroup;
  public platformGroup!: Phaser.Physics.Arcade.StaticGroup;

  // Environmental objects
  private vines: Phaser.GameObjects.Sprite[] = [];
  private boulders: Phaser.Physics.Arcade.Sprite[] = [];
  private poisonSwamps: Phaser.GameObjects.Sprite[] = [];
  private tallGrasses: Phaser.GameObjects.Sprite[] = [];
  private poisonSwampTimer: number = 0;

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

  // Special room state
  private hunterTrapActive: boolean = false;
  private hunterTrapKills: number = 0;
  private hunterTrapTimer: number = 0;
  private hunterTrapText: Phaser.GameObjects.Text | null = null;

  // Poison DoT tracking
  private poisonedTimers: Map<string, Phaser.Time.TimerEvent> = new Map();

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
    this.vines = [];
    this.boulders = [];
    this.poisonSwamps = [];
    this.tallGrasses = [];
    this.hunterTrapActive = false;
    this.hunterTrapKills = 0;
    this.hunterTrapTimer = 0;
    this.poisonedTimers.clear();
  }

  create(): void {
    // Setup systems
    this.campUpgrade = new CampUpgrade();
    this.levelGenerator = new LevelGenerator(this);
    this.blessingSystem = new BlessingSystem(this);
    this.soundManager = new SoundManager();

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

    // Weapon system - fix: set weapons from camp unlocks
    this.weaponSystem = new WeaponSystem(this, this.player);
    this.weaponSystem.setWeaponsFromUnlocks(campData.unlockedWeapons);

    // Enemies group
    this.enemies = this.add.group({ runChildUpdate: true });
    this.drops = this.add.group();

    // Spawn enemies
    this.spawnEnemies();

    // Spawn environmental objects
    this.spawnEnvironmentals();

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

    // Background decor
    this.createBackgroundDecor();

    // Start game music
    this.soundManager.startGameMusic(this.currentChapter);
  }

  private getChapterBgColor(): number {
    switch (this.currentChapter) {
      case 1: return 0x2d5a1e;
      case 2: return 0x8B7355;
      case 3: return 0x4a1a0a;
      default: return 0x2d5a1e;
    }
  }

  private buildTerrain(): void {
    for (const chunk of this.chunks) {
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

          const tile2 = this.groundGroup.create(
            seg.x + i * TILE_SIZE + TILE_SIZE / 2,
            GAME_HEIGHT + TILE_SIZE / 2,
            'ground'
          ) as Phaser.Physics.Arcade.Sprite;
          tile2.setImmovable(true);
          tile2.refreshBody();
        }
      }

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
        const enemy = this.createEnemy(spawn.type, spawn.x, spawn.y);
        enemy.setPlayer(this.player);
        this.enemies.add(enemy);

        // Boost beast lair alpha boar HP
        if (chunk.type === 'beast_lair' && spawn.type === 'boar') {
          enemy.hp = Math.floor(enemy.hp * 1.8);
          enemy.maxHp = enemy.hp;
          enemy.setTint(0xffaa44); // golden tint for alpha
        }

        // Hunter trap enemies are tagged for tracking
        if (chunk.type === 'hunter_trap') {
          enemy.setData('hunterTrap', true);
        }
      }

      // Spawn items
      for (const item of chunk.itemSpawns) {
        if (item.type === 'mystery_totem') {
          this.spawnMysteryTotem(item.x, item.y);
        } else {
          const tex = item.type === 'bone' ? 'bone' : 'totem_fragment';
          const drop = this.physics.add.sprite(item.x, item.y, tex);
          (drop.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
          drop.setData('type', item.type);
          this.drops.add(drop);

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

      // Check for hunter trap chunk - set up timer
      if (chunk.type === 'hunter_trap') {
        this.setupHunterTrap(chunk);
      }
    }
  }

  private createEnemy(type: string, x: number, y: number): Enemy {
    let enemy: Enemy;
    switch (type) {
      case 'wolf':
        enemy = new Wolf(this, x, y);
        break;
      case 'boar':
        enemy = new Boar(this, x, y);
        break;
      case 'spear_thrower':
        enemy = new SpearThrower(this, x, y);
        break;
      case 'boss_mammoth':
        enemy = new BossMammoth(this, x, y);
        this.currentBoss = enemy;
        this.soundManager.playBossAppear();
        break;
      case 'poison_snake':
        enemy = new PoisonSnake(this, x, y);
        break;
      case 'shield_warrior':
        enemy = new ShieldWarrior(this, x, y);
        break;
      case 'shaman': {
        const shaman = new Shaman(this, x, y);
        shaman.setEnemiesGroup(this.enemies);
        enemy = shaman;
        break;
      }
      default:
        enemy = new Wolf(this, x, y);
    }
    return enemy;
  }

  // --- Environmental Objects ---

  private spawnEnvironmentals(): void {
    for (const chunk of this.chunks) {
      if (!chunk.environmentals) continue;
      for (const env of chunk.environmentals) {
        switch (env.type) {
          case 'vine':
            this.spawnVine(env.x, env.y);
            break;
          case 'poison_swamp':
            this.spawnPoisonSwamp(env.x, env.y);
            break;
          case 'tall_grass':
            this.spawnTallGrass(env.x, env.y);
            break;
        }
      }
    }
  }

  private spawnVine(x: number, y: number): void {
    const vine = this.add.sprite(x, y, 'vine');
    vine.setDepth(-1);
    this.vines.push(vine);

    // Create a boulder attached above the vine (hidden until shot)
    const boulder = this.physics.add.sprite(x, y - 20, 'boulder');
    (boulder.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (boulder.body as Phaser.Physics.Arcade.Body).setImmovable(true);
    boulder.setVisible(false);
    boulder.setActive(false);
    boulder.setData('vineX', x);
    boulder.setData('vineY', y);
    boulder.setData('released', false);
    this.boulders.push(boulder);

    // Make vine shootable - overlap with player projectiles
    const vineBody = this.physics.add.sprite(x, y, 'vine');
    vineBody.setAlpha(0);
    (vineBody.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (vineBody.body as Phaser.Physics.Arcade.Body).setSize(8, 32);

    this.physics.add.overlap(
      this.weaponSystem.getProjectilesGroup(),
      vineBody,
      (_proj, _vine) => {
        const proj = _proj as Projectile;
        if (!proj.active || proj.isEnemyProjectile) return;
        if (boulder.getData('released')) return;

        // Release the boulder!
        boulder.setData('released', true);
        boulder.setVisible(true);
        boulder.setActive(true);
        (boulder.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
        (boulder.body as Phaser.Physics.Arcade.Body).setImmovable(false);
        (boulder.body as Phaser.Physics.Arcade.Body).setVelocityY(200);

        // Vine visual break
        vine.setTint(0x885522);
        this.soundManager.playEnvironmentBoulder();

        // Boulder damages enemies on contact
        this.physics.add.overlap(boulder, this.enemies, (_b, _e) => {
          const enemy = _e as Enemy;
          if (enemy.active) {
            enemy.takeDamage(80); // Heavy damage from boulder
          }
        });

        // Destroy boulder after a while
        this.time.delayedCall(2000, () => {
          boulder.destroy();
        });
      }
    );
  }

  private spawnPoisonSwamp(x: number, y: number): void {
    // Create a strip of swamp tiles (3-5 tiles wide)
    const width = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < width; i++) {
      const tile = this.add.sprite(x + i * TILE_SIZE, y - TILE_SIZE / 2, 'poison_swamp');
      tile.setDepth(-1);
      tile.setAlpha(0.8);
      this.poisonSwamps.push(tile);
    }
    // Store swamp zone data for collision check
    const zone = this.add.zone(x + (width * TILE_SIZE) / 2, y - TILE_SIZE / 2, width * TILE_SIZE, TILE_SIZE);
    this.physics.add.existing(zone, true);
    zone.setData('isSwamp', true);
    zone.setData('swampX', x);
    zone.setData('swampWidth', width * TILE_SIZE);
  }

  private spawnTallGrass(x: number, y: number): void {
    // Create a patch of tall grass (2-4 sprites)
    const count = 2 + Math.floor(Math.random() * 3);
    const sprites: Phaser.GameObjects.Sprite[] = [];
    for (let i = 0; i < count; i++) {
      const grass = this.add.sprite(x + i * 14, y, 'tall_grass');
      grass.setDepth(-1);
      grass.setAlpha(0.9);
      sprites.push(grass);
      this.tallGrasses.push(grass);
    }

    // Store zone for stealth detection
    const zone = this.add.zone(x + (count * 14) / 2, y, count * 14, 20);
    this.physics.add.existing(zone, true);
    zone.setData('isGrass', true);
  }

  // --- Special Room: Mystery Totem ---

  private spawnMysteryTotem(x: number, y: number): void {
    const totem = this.physics.add.sprite(x, y, 'mystery_totem');
    (totem.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    totem.setData('type', 'mystery_totem');

    // Glow effect
    this.tweens.add({
      targets: totem,
      alpha: 0.6,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Interact on overlap
    this.physics.add.overlap(this.player, totem, () => {
      if (!totem.active) return;
      totem.setActive(false);
      totem.setVisible(false);
      totem.destroy();
      this.showMysteryTotemChoice();
    });
  }

  private showMysteryTotemChoice(): void {
    this.isPaused = true;
    this.physics.pause();

    const cam = this.cameras.main;
    const container = this.add.container(cam.width / 2, cam.height / 2);
    container.setDepth(100);
    container.setScrollFactor(0);

    const overlay = this.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 0.8);
    container.add(overlay);

    const title = this.add.text(0, -70, 'MYSTERY TOTEM', {
      fontSize: '12px', color: '#ff66ff', fontFamily: 'monospace',
    }).setOrigin(0.5);
    container.add(title);

    const desc = this.add.text(0, -50, 'Sacrifice 25 HP for a powerful blessing?', {
      fontSize: '8px', color: '#cccccc', fontFamily: 'monospace',
    }).setOrigin(0.5);
    container.add(desc);

    // Accept button
    const acceptBg = this.add.rectangle(0, -10, 180, 28, 0x660066, 0.9)
      .setInteractive({ useHandCursor: true });
    const acceptText = this.add.text(0, -10, '[ SACRIFICE 25 HP ]', {
      fontSize: '9px', color: '#ff88ff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    acceptBg.on('pointerover', () => acceptBg.setFillStyle(0x880088, 1));
    acceptBg.on('pointerout', () => acceptBg.setFillStyle(0x660066, 0.9));
    acceptBg.on('pointerdown', () => {
      this.player.hp = Math.max(1, this.player.hp - 25);
      container.destroy(true);
      this.isPaused = false;
      this.physics.resume();
      this.soundManager.playBlessingSelect();
      // Give a blessing immediately
      this.showBlessingChoice();
    });

    container.add([acceptBg, acceptText]);

    // Decline button
    const declineBg = this.add.rectangle(0, 30, 180, 28, 0x333333, 0.9)
      .setInteractive({ useHandCursor: true });
    const declineText = this.add.text(0, 30, '[ WALK AWAY ]', {
      fontSize: '9px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);

    declineBg.on('pointerover', () => declineBg.setFillStyle(0x555555, 1));
    declineBg.on('pointerout', () => declineBg.setFillStyle(0x333333, 0.9));
    declineBg.on('pointerdown', () => {
      container.destroy(true);
      this.isPaused = false;
      this.physics.resume();
    });

    container.add([declineBg, declineText]);
  }

  // --- Special Room: Hunter's Trap ---

  private setupHunterTrap(_chunk: ChunkData): void {
    this.hunterTrapActive = true;
    this.hunterTrapKills = 0;
    this.hunterTrapTimer = 20000; // 20 seconds

    this.hunterTrapText = this.add.text(GAME_WIDTH / 2, 32, '', {
      fontSize: '8px', color: '#ff4444', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
  }

  private updateHunterTrap(delta: number): void {
    if (!this.hunterTrapActive) return;

    this.hunterTrapTimer -= delta;
    if (this.hunterTrapText) {
      const sec = Math.ceil(this.hunterTrapTimer / 1000);
      this.hunterTrapText.setText(`HUNTER'S TRAP! ${sec}s - Kills: ${this.hunterTrapKills} (x2 bones!)`);
    }

    if (this.hunterTrapTimer <= 0) {
      this.hunterTrapActive = false;
      if (this.hunterTrapText) {
        this.hunterTrapText.setText('TRAP COMPLETE!');
        this.time.delayedCall(2000, () => {
          if (this.hunterTrapText) {
            this.hunterTrapText.destroy();
            this.hunterTrapText = null;
          }
        });
      }
    }
  }

  // --- Collisions ---

  private setupCollisions(): void {
    this.physics.add.collider(this.player, this.groundGroup);
    this.physics.add.collider(this.player, this.platformGroup);
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
    const enemy = _enemy as unknown as Enemy;

    const killed = enemy.takeDamage(arrow.damage);
    this.soundManager.playHit();

    // Poison from blowdart
    if (arrow.isPoisonous && arrow.poisonTicks > 0) {
      this.applyPoisonToEnemy(enemy, arrow.poisonDamage, arrow.poisonTicks, arrow.poisonInterval);
    }

    // Burn damage from blessing
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

    // Piercing: don't deactivate if weapon/blessing is piercing
    const weapon = this.weaponSystem.getCurrentWeapon();
    if (!weapon.piercing && !this.weaponSystem.piercing) {
      arrow.deactivate();
    }
  };

  private applyPoisonToEnemy(enemy: Enemy, dmg: number, ticks: number, interval: number): void {
    const key = `poison_${enemy.x}_${enemy.y}_${Date.now()}`;
    let remaining = ticks;

    const timer = this.time.addEvent({
      delay: interval,
      callback: () => {
        if (enemy.active) {
          enemy.takeDamage(dmg);
          enemy.setTint(0x44dd44); // green tint
          this.time.delayedCall(200, () => {
            if (enemy.active) enemy.setTint(0xffffff);
          });
          this.soundManager.playPoisonHit();
        }
        remaining--;
        if (remaining <= 0) {
          timer.remove();
          this.poisonedTimers.delete(key);
        }
      },
      repeat: ticks - 1,
    });
    this.poisonedTimers.set(key, timer);
  }

  private onPlayerTouchEnemy = (_player: Phaser.GameObjects.GameObject, _enemy: Phaser.GameObjects.GameObject): void => {
    const enemy = _enemy as Enemy;
    if (!enemy.active || this.player.isRolling) return;

    const died = this.player.takeDamage(enemy.damage);
    if (died) {
      this.soundManager.playPlayerHurt();
    } else if (this.player.hp > 0) {
      this.soundManager.playPlayerHurt();
    }

    if (this.player.hp <= 0) {
      this.gameOver();
    }
  };

  private onPlayerCollectDrop = (_player: Phaser.GameObjects.GameObject, _drop: Phaser.GameObjects.GameObject): void => {
    const drop = _drop as Phaser.Physics.Arcade.Sprite;
    if (!drop.active) return;

    const type = drop.getData('type');
    if (type === 'bone') {
      const bonus = this.blessingSystem.luckyBones ? 2 : 1;
      // Hunter trap double bonus
      const trapBonus = this.hunterTrapActive ? 2 : 1;
      this.player.bones += bonus * trapBonus;
      this.soundManager.playPickupBone();
    } else if (type === 'totem') {
      this.player.totemFragments++;
      this.soundManager.playPickupTotem();
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
    this.soundManager.playEnemyDeath();

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

    // Hunter trap kill tracking
    if (enemy.getData('hunterTrap') && this.hunterTrapActive) {
      this.hunterTrapKills++;
      // Bonus bone drop for trap kills
      this.spawnDrop(enemy.x, enemy.y - 10, 'bone');
    }

    // Check if boss was defeated
    if (enemy.enemyType === 'boss_mammoth') {
      this.bossDefeated = true;
      this.currentBoss = null;
      this.soundManager.stopMusic();
      this.soundManager.playChapterComplete();
      this.time.delayedCall(1500, () => this.chapterComplete());
    }
  };

  private onBossStomp = (x: number, _y: number): void => {
    const dist = Math.abs(this.player.x - x);
    if (dist < 80 && this.player.body.onFloor()) {
      this.player.takeDamage(25);
      this.soundManager.playStomp();
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

    this.physics.add.overlap(this.player, drop, this.onPlayerCollectDrop as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
  }

  // --- Blessing UI ---

  private showBlessingChoice(): void {
    this.isPaused = true;
    this.physics.pause();

    const choices = this.blessingSystem.getRandomChoices();
    const cam = this.cameras.main;

    this.blessingUI = this.add.container(cam.width / 2, cam.height / 2);
    this.blessingUI.setDepth(100);
    this.blessingUI.setScrollFactor(0);

    const overlay = this.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 0.7);
    this.blessingUI.add(overlay);

    const title = this.add.text(0, -80, 'TOTEM BLESSING', {
      fontSize: '12px', color: '#ffcc00', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.blessingUI.add(title);

    const subtitle = this.add.text(0, -65, 'Choose one:', {
      fontSize: '8px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.blessingUI.add(subtitle);

    choices.forEach((blessing, i) => {
      const y = -30 + i * 40;
      const bg = this.add.rectangle(0, y, 200, 32, 0x333355, 0.9)
        .setInteractive({ useHandCursor: true });

      const nameText = this.add.text(-90, y - 8, `${blessing.icon} ${blessing.name}`, {
        fontSize: '8px', color: '#ffffff', fontFamily: 'monospace',
      });

      const descText = this.add.text(-90, y + 4, blessing.description, {
        fontSize: '7px', color: '#aaaaaa', fontFamily: 'monospace',
      });

      bg.on('pointerover', () => bg.setFillStyle(0x555577, 1));
      bg.on('pointerout', () => bg.setFillStyle(0x333355, 0.9));
      bg.on('pointerdown', () => this.selectBlessing(blessing));

      this.blessingUI!.add([bg, nameText, descText]);
    });
  }

  private selectBlessing(blessing: Blessing): void {
    this.blessingSystem.applyBlessing(blessing, this.player, this.weaponSystem);
    this.soundManager.playBlessingSelect();

    if (this.blessingUI) {
      this.blessingUI.destroy(true);
      this.blessingUI = null;
    }

    this.isPaused = false;
    this.physics.resume();
  }

  // --- HUD ---

  private createHUD(): void {
    const hudContainer = this.add.container(0, 0);
    hudContainer.setDepth(50);
    hudContainer.setScrollFactor(0);

    this.hpBar = this.add.graphics();
    hudContainer.add(this.hpBar);

    this.hpText = this.add.text(10, 3, '', {
      fontSize: '7px', color: '#ffffff', fontFamily: 'monospace',
    });
    hudContainer.add(this.hpText);

    this.boneText = this.add.text(10, 18, '', {
      fontSize: '7px', color: '#f0e6d2', fontFamily: 'monospace',
    });
    hudContainer.add(this.boneText);

    this.weaponText = this.add.text(GAME_WIDTH - 10, 5, '', {
      fontSize: '7px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(1, 0);
    hudContainer.add(this.weaponText);

    this.chapterText = this.add.text(GAME_WIDTH / 2, 5, '', {
      fontSize: '8px', color: '#ffcc00', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);
    hudContainer.add(this.chapterText);

    this.blessingText = this.add.text(GAME_WIDTH - 10, 18, '', {
      fontSize: '7px', color: '#9b59b6', fontFamily: 'monospace',
    }).setOrigin(1, 0);
    hudContainer.add(this.blessingText);

    // Boss HP bar
    this.bossHpBar = this.add.graphics();
    this.bossHpBar.setDepth(50);
    this.bossHpBar.setScrollFactor(0);

    this.bossHpText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 25, '', {
      fontSize: '7px', color: '#ff4444', fontFamily: 'monospace',
    }).setOrigin(0.5, 0).setDepth(50).setScrollFactor(0);
  }

  private updateHUD(): void {
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

    const chapterNames = ['Jungle', 'Wasteland', 'Volcano'];
    const chapterName = chapterNames[(this.currentChapter - 1) % 3] || '';
    this.chapterText.setText(`Ch.${this.currentChapter} - ${chapterName}`);
    this.blessingText.setText(`Blessings: ${this.blessingSystem.getBlessingCount()}`);

    // Boss HP bar
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

      // Start boss music if not already
      if (!this.bossDefeated) {
        this.soundManager.startBossMusic();
      }
    } else {
      this.bossHpBar!.clear();
      this.bossHpText!.setVisible(false);
    }
  }

  private createBackgroundDecor(): void {
    const totalWidth = this.chunks.length * GAME_WIDTH * 2;
    const bgLayer = this.add.graphics();
    bgLayer.setDepth(-10);

    for (let x = 0; x < totalWidth; x += 200) {
      const h = 40 + Math.random() * 60;
      const color = this.currentChapter === 1 ? 0x1a4010 :
        this.currentChapter === 2 ? 0x6b5040 : 0x3a0a0a;
      bgLayer.fillStyle(color, 0.5);
      bgLayer.fillTriangle(x, GAME_HEIGHT - 32, x + 100, GAME_HEIGHT - 32 - h, x + 200, GAME_HEIGHT - 32);
    }

    for (let x = 50; x < totalWidth; x += 80 + Math.random() * 120) {
      if (this.currentChapter === 1) {
        const treeH = 20 + Math.random() * 30;
        bgLayer.fillStyle(0x2a4a1a, 0.6);
        bgLayer.fillRect(x, GAME_HEIGHT - 32 - treeH, 4, treeH);
        bgLayer.fillStyle(0x3a6a2a, 0.5);
        bgLayer.fillCircle(x + 2, GAME_HEIGHT - 32 - treeH - 8, 10 + Math.random() * 6);
      } else if (this.currentChapter === 2) {
        const rockH = 8 + Math.random() * 15;
        bgLayer.fillStyle(0x7a6a5a, 0.5);
        bgLayer.fillRect(x, GAME_HEIGHT - 32 - rockH, 12 + Math.random() * 8, rockH);
      } else {
        bgLayer.fillStyle(0xff4400, 0.2);
        bgLayer.fillCircle(x, GAME_HEIGHT - 40, 15 + Math.random() * 10);
      }
    }
  }

  // --- Environmental update logic ---

  private updateEnvironmentals(delta: number): void {
    // Poison swamp damage
    this.poisonSwampTimer += delta;
    if (this.poisonSwampTimer >= 500) {
      this.poisonSwampTimer = 0;
      for (const swamp of this.poisonSwamps) {
        if (!swamp.active) continue;
        const dist = Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          swamp.x, swamp.y
        );
        if (dist < 20 && this.player.body.onFloor()) {
          this.player.takeDamage(5);
          this.soundManager.playPoisonHit();
          // Purple tint flash
          this.player.setTint(0xaa44ff);
          this.time.delayedCall(200, () => {
            if (this.player.active) this.player.setTint(0xffffff);
          });
          break; // Only damage once per tick
        }
      }
    }

    // Tall grass stealth
    let inGrass = false;
    for (const grass of this.tallGrasses) {
      if (!grass.active) continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        grass.x, grass.y
      );
      if (dist < 16) {
        inGrass = true;
        break;
      }
    }

    if (inGrass && !this.player.isStealthed) {
      this.player.isStealthed = true;
      this.player.stealthCritBonus = true;
      this.player.setAlpha(0.5); // Semi-transparent = stealthed
    } else if (!inGrass && this.player.isStealthed) {
      this.player.isStealthed = false;
      this.player.setAlpha(1);
    }
  }

  // --- Enemy projectile handling ---

  private updateEnemyProjectiles(): void {
    this.enemies.getChildren().forEach(e => {
      // SpearThrower projectiles
      if (e instanceof SpearThrower && e.active) {
        this.checkEnemyProjectiles(e.getProjectilesGroup());
      }
      // PoisonSnake projectiles
      if (e instanceof PoisonSnake && e.active) {
        this.checkEnemyProjectiles(e.getProjectilesGroup());
      }
    });
  }

  private checkEnemyProjectiles(group: Phaser.GameObjects.Group): void {
    group.getChildren().forEach(p => {
      const proj = p as Projectile;
      if (proj.active && proj.isEnemyProjectile) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, proj.x, proj.y);
        if (dist < 14) {
          this.player.takeDamage(proj.damage);

          // Poison from snake spit
          if (proj.isPoisonous && proj.poisonTicks > 0) {
            this.applyPoisonToPlayer(proj.poisonDamage, proj.poisonTicks, proj.poisonInterval);
          }

          proj.deactivate();
          this.soundManager.playPlayerHurt();
          if (this.player.hp <= 0) this.gameOver();
        }
      }
    });
  }

  private applyPoisonToPlayer(dmg: number, ticks: number, interval: number): void {
    let remaining = ticks;
    const timer = this.time.addEvent({
      delay: interval,
      callback: () => {
        if (this.player.hp > 0) {
          this.player.takeDamage(dmg);
          this.player.setTint(0x44dd44);
          this.time.delayedCall(200, () => {
            if (this.player.active) this.player.setTint(0xffffff);
          });
          this.soundManager.playPoisonHit();
          if (this.player.hp <= 0) this.gameOver();
        }
        remaining--;
        if (remaining <= 0) timer.remove();
      },
      repeat: ticks - 1,
    });
  }

  // --- Game Flow ---

  private chapterComplete(): void {
    if (this.currentChapter < 3) {
      const cam = this.cameras.main;
      const text = this.add.text(cam.width / 2, cam.height / 2, `CHAPTER ${this.currentChapter} COMPLETE!`, {
        fontSize: '14px', color: '#ffcc00', fontFamily: 'monospace',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

      this.time.delayedCall(2000, () => {
        text.destroy();
        this.soundManager.destroy();
        this.scene.restart({ chapter: this.currentChapter + 1 });
      });
    } else {
      this.soundManager.playVictory();
      this.gameWin();
    }
  }

  private gameOver(): void {
    const campData = this.campUpgrade.load();
    campData.bones += this.player.bones;
    campData.totalRuns++;
    if (this.currentChapter > campData.bestChapter) {
      campData.bestChapter = this.currentChapter;
    }
    this.campUpgrade.save(campData);

    this.soundManager.stopMusic();
    this.soundManager.playGameOver();

    this.time.delayedCall(500, () => {
      this.soundManager.destroy();
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
    campData.bones += this.player.bones + 50;
    campData.totalRuns++;
    campData.bestChapter = 3;
    this.campUpgrade.save(campData);

    this.time.delayedCall(500, () => {
      this.soundManager.destroy();
      this.scene.start('GameOverScene', {
        bones: this.player.bones + 50,
        chapter: 3,
        blessings: this.blessingSystem.getBlessingCount(),
        victory: true,
      });
    });
  }

  // --- Main Update Loop ---

  update(time: number, delta: number): void {
    if (this.isPaused) return;

    this.player.update(time, delta);

    // Enemy projectile handling
    this.updateEnemyProjectiles();

    // Shooting with weapon-specific sounds
    if (this.player.isShootKeyDown()) {
      const shots = this.weaponSystem.tryShoot(time);
      if (shots) {
        const weapon = this.weaponSystem.getCurrentWeapon();
        switch (weapon.projectileTexture) {
          case 'sling_rock': this.soundManager.playShootSling(); break;
          case 'blowdart_dart': this.soundManager.playShootBlowdart(); break;
          case 'throwing_spear_proj': this.soundManager.playShootSpear(); break;
          case 'slingshot_pebble': this.soundManager.playShootSlingshot(); break;
          default: this.soundManager.playShoot(); break;
        }
      }
    }

    // Weapon switch
    if (this.player.isSwitchWeaponJustDown()) {
      this.weaponSystem.switchWeapon();
    }

    // Environmental interactions
    this.updateEnvironmentals(delta);

    // Hunter trap timer
    this.updateHunterTrap(delta);

    // Fall death
    if (this.player.y > GAME_HEIGHT + 50) {
      this.player.hp = 0;
      this.gameOver();
    }

    this.updateHUD();
  }
}
