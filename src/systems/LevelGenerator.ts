import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../utils/Constants';

export interface EnvironmentalObject {
  x: number;
  y: number;
  type: 'vine' | 'poison_swamp' | 'tall_grass';
}

export interface ChunkData {
  type: 'combat' | 'platforming' | 'rest' | 'treasure' | 'elite' | 'boss'
    | 'mystery_totem' | 'hunter_trap' | 'beast_lair';
  platforms: { x: number; y: number; width: number }[];
  groundSegments: { x: number; width: number; height?: number }[];
  enemySpawns: { x: number; y: number; type: string }[];
  itemSpawns: { x: number; y: number; type: string }[];
  environmentals: EnvironmentalObject[];
}

export class LevelGenerator {
  private scene: Phaser.Scene;
  private readonly GROUND_Y = GAME_HEIGHT - TILE_SIZE * 2;
  private readonly CHUNK_WIDTH = GAME_WIDTH * 2;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  generateLevel(chapter: number): ChunkData[] {
    const chunks: ChunkData[] = [];
    const chunkCount = 6 + chapter * 2;
    let combatStreak = 0;
    let hasSpecialRoom = false;

    // Start chunk - always safe
    chunks.push(this.generateStartChunk());

    for (let i = 1; i < chunkCount - 1; i++) {
      if (combatStreak >= 2) {
        chunks.push(Math.random() > 0.5 ? this.generateRestChunk(i) : this.generateTreasureChunk(i));
        combatStreak = 0;
      } else {
        const roll = Math.random();
        if (roll < 0.40) {
          chunks.push(this.generateCombatChunk(i, chapter));
          combatStreak++;
        } else if (roll < 0.55) {
          chunks.push(this.generatePlatformingChunk(i, chapter));
          combatStreak = 0;
        } else if (roll < 0.70) {
          chunks.push(this.generateEliteChunk(i, chapter));
          combatStreak++;
        } else if (roll < 0.82) {
          chunks.push(this.generateTreasureChunk(i));
          combatStreak = 0;
        } else if (!hasSpecialRoom && roll < 0.94) {
          // Special rooms: only one per level
          const specialRoll = Math.random();
          if (specialRoll < 0.33) {
            chunks.push(this.generateMysteryTotemChunk(i));
          } else if (specialRoll < 0.66) {
            chunks.push(this.generateHunterTrapChunk(i, chapter));
          } else {
            chunks.push(this.generateBeastLairChunk(i, chapter));
          }
          hasSpecialRoom = true;
          combatStreak = 0;
        } else {
          chunks.push(this.generateRestChunk(i));
          combatStreak = 0;
        }
      }
    }

    // Boss chunk at the end
    chunks.push(this.generateBossChunk(chunkCount - 1, chapter));

    return chunks;
  }

  /** Get chapter-appropriate enemy types */
  private getEnemyTypes(chapter: number): string[] {
    switch (chapter) {
      case 1:
        // Jungle: beasts + snakes
        return ['wolf', 'boar', 'poison_snake'];
      case 2:
        // Wasteland: hostile tribe + beasts
        return ['wolf', 'spear_thrower', 'shield_warrior', 'boar'];
      case 3:
        // Volcano: all enemy types
        return ['wolf', 'boar', 'spear_thrower', 'shield_warrior', 'poison_snake', 'shaman'];
      default:
        return ['wolf', 'boar'];
    }
  }

  /** Get chapter-appropriate environmental objects */
  private getChapterEnvironmentals(chapter: number, offsetX: number): EnvironmentalObject[] {
    const envs: EnvironmentalObject[] = [];

    switch (chapter) {
      case 1: // Jungle: vines and tall grass
        if (Math.random() < 0.6) {
          envs.push({
            x: offsetX + 200 + Math.random() * (this.CHUNK_WIDTH - 400),
            y: this.GROUND_Y - 100,
            type: 'vine',
          });
        }
        if (Math.random() < 0.5) {
          envs.push({
            x: offsetX + 300 + Math.random() * (this.CHUNK_WIDTH - 600),
            y: this.GROUND_Y - 8,
            type: 'tall_grass',
          });
        }
        if (Math.random() < 0.3) {
          envs.push({
            x: offsetX + 100 + Math.random() * (this.CHUNK_WIDTH - 200),
            y: this.GROUND_Y - 8,
            type: 'tall_grass',
          });
        }
        break;

      case 2: // Wasteland: poison swamps
        if (Math.random() < 0.5) {
          envs.push({
            x: offsetX + 200 + Math.random() * (this.CHUNK_WIDTH - 400),
            y: this.GROUND_Y,
            type: 'poison_swamp',
          });
        }
        if (Math.random() < 0.3) {
          envs.push({
            x: offsetX + 400 + Math.random() * 200,
            y: this.GROUND_Y,
            type: 'poison_swamp',
          });
        }
        break;

      case 3: // Volcano: all types mixed
        if (Math.random() < 0.4) {
          envs.push({
            x: offsetX + 200 + Math.random() * 300,
            y: this.GROUND_Y - 100,
            type: 'vine',
          });
        }
        if (Math.random() < 0.5) {
          envs.push({
            x: offsetX + 300 + Math.random() * 300,
            y: this.GROUND_Y,
            type: 'poison_swamp',
          });
        }
        if (Math.random() < 0.3) {
          envs.push({
            x: offsetX + 100 + Math.random() * 300,
            y: this.GROUND_Y - 8,
            type: 'tall_grass',
          });
        }
        break;
    }

    return envs;
  }

  private generateStartChunk(): ChunkData {
    return {
      type: 'rest',
      platforms: [],
      groundSegments: [{ x: 0, width: this.CHUNK_WIDTH }],
      enemySpawns: [],
      itemSpawns: [],
      environmentals: [],
    };
  }

  private generateCombatChunk(index: number, chapter: number): ChunkData {
    const offsetX = index * this.CHUNK_WIDTH;
    const platforms = this.randomPlatforms(offsetX, 2 + Math.floor(Math.random() * 3));
    const groundSegments = this.randomGround(offsetX);
    const enemyCount = 2 + chapter + Math.floor(Math.random() * 2);
    const enemyTypes = this.getEnemyTypes(chapter);

    const enemySpawns = [];
    for (let i = 0; i < enemyCount; i++) {
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      enemySpawns.push({
        x: offsetX + 200 + Math.random() * (this.CHUNK_WIDTH - 400),
        y: this.GROUND_Y - 30,
        type,
      });
    }

    return {
      type: 'combat',
      platforms,
      groundSegments,
      enemySpawns,
      itemSpawns: [],
      environmentals: this.getChapterEnvironmentals(chapter, offsetX),
    };
  }

  private generatePlatformingChunk(index: number, chapter: number): ChunkData {
    const offsetX = index * this.CHUNK_WIDTH;
    const platforms = this.randomPlatforms(offsetX, 4 + Math.floor(Math.random() * 3));

    const groundSegments = [
      { x: offsetX, width: this.CHUNK_WIDTH * 0.3 },
      { x: offsetX + this.CHUNK_WIDTH * 0.45, width: this.CHUNK_WIDTH * 0.15 },
      { x: offsetX + this.CHUNK_WIDTH * 0.75, width: this.CHUNK_WIDTH * 0.25 },
    ];

    return {
      type: 'platforming',
      platforms,
      groundSegments,
      enemySpawns: [],
      itemSpawns: [
        { x: offsetX + this.CHUNK_WIDTH * 0.5, y: this.GROUND_Y - 80, type: 'bone' },
      ],
      environmentals: chapter === 1 ? [
        { x: offsetX + this.CHUNK_WIDTH * 0.35, y: this.GROUND_Y - 120, type: 'vine' as const },
      ] : [],
    };
  }

  private generateRestChunk(index: number): ChunkData {
    const offsetX = index * this.CHUNK_WIDTH;
    return {
      type: 'rest',
      platforms: [
        { x: offsetX + 200, y: this.GROUND_Y - 60, width: 80 },
      ],
      groundSegments: [{ x: offsetX, width: this.CHUNK_WIDTH }],
      enemySpawns: [],
      itemSpawns: [
        { x: offsetX + this.CHUNK_WIDTH * 0.5, y: this.GROUND_Y - 20, type: 'bone' },
      ],
      environmentals: [],
    };
  }

  private generateTreasureChunk(index: number): ChunkData {
    const offsetX = index * this.CHUNK_WIDTH;
    return {
      type: 'treasure',
      platforms: [
        { x: offsetX + 300, y: this.GROUND_Y - 50, width: 60 },
        { x: offsetX + 500, y: this.GROUND_Y - 100, width: 60 },
      ],
      groundSegments: [{ x: offsetX, width: this.CHUNK_WIDTH }],
      enemySpawns: [],
      itemSpawns: [
        { x: offsetX + 330, y: this.GROUND_Y - 70, type: 'bone' },
        { x: offsetX + 530, y: this.GROUND_Y - 120, type: 'totem' },
        { x: offsetX + 600, y: this.GROUND_Y - 20, type: 'bone' },
      ],
      environmentals: [],
    };
  }

  private generateEliteChunk(index: number, chapter: number): ChunkData {
    const offsetX = index * this.CHUNK_WIDTH;
    const enemyTypes = this.getEnemyTypes(chapter);

    return {
      type: 'elite',
      platforms: this.randomPlatforms(offsetX, 2),
      groundSegments: [{ x: offsetX, width: this.CHUNK_WIDTH }],
      enemySpawns: [
        { x: offsetX + this.CHUNK_WIDTH * 0.5, y: this.GROUND_Y - 30, type: 'boar' },
        { x: offsetX + this.CHUNK_WIDTH * 0.3, y: this.GROUND_Y - 30, type: enemyTypes[Math.floor(Math.random() * enemyTypes.length)] },
        { x: offsetX + this.CHUNK_WIDTH * 0.7, y: this.GROUND_Y - 30, type: enemyTypes[Math.floor(Math.random() * enemyTypes.length)] },
      ],
      itemSpawns: [
        { x: offsetX + this.CHUNK_WIDTH * 0.5, y: this.GROUND_Y - 20, type: 'totem' },
      ],
      environmentals: this.getChapterEnvironmentals(chapter, offsetX),
    };
  }

  // --- Special Room: Mystery Totem ---
  // Sacrifice HP in exchange for a powerful blessing
  private generateMysteryTotemChunk(index: number): ChunkData {
    const offsetX = index * this.CHUNK_WIDTH;
    return {
      type: 'mystery_totem',
      platforms: [
        { x: offsetX + this.CHUNK_WIDTH * 0.5 - 40, y: this.GROUND_Y - 60, width: 80 },
      ],
      groundSegments: [{ x: offsetX, width: this.CHUNK_WIDTH }],
      enemySpawns: [],
      itemSpawns: [
        // The mystery_totem item is special - handled differently in GameScene
        { x: offsetX + this.CHUNK_WIDTH * 0.5, y: this.GROUND_Y - 40, type: 'mystery_totem' },
      ],
      environmentals: [],
    };
  }

  // --- Special Room: Hunter's Trap ---
  // Timed challenge: defeat enemies quickly for double bone rewards
  private generateHunterTrapChunk(index: number, chapter: number): ChunkData {
    const offsetX = index * this.CHUNK_WIDTH;
    const enemyTypes = this.getEnemyTypes(chapter);

    // Dense combat with bonus rewards
    const enemyCount = 4 + chapter;
    const enemySpawns = [];
    for (let i = 0; i < enemyCount; i++) {
      enemySpawns.push({
        x: offsetX + 200 + Math.random() * (this.CHUNK_WIDTH - 400),
        y: this.GROUND_Y - 30,
        type: enemyTypes[Math.floor(Math.random() * enemyTypes.length)],
      });
    }

    return {
      type: 'hunter_trap',
      platforms: this.randomPlatforms(offsetX, 3),
      groundSegments: [{ x: offsetX, width: this.CHUNK_WIDTH }],
      enemySpawns,
      itemSpawns: [],
      environmentals: [],
    };
  }

  // --- Special Room: Beast Lair ---
  // Elite enemy with guaranteed totem + rare weapon drop
  private generateBeastLairChunk(index: number, chapter: number): ChunkData {
    const offsetX = index * this.CHUNK_WIDTH;

    // One tough elite enemy (always boar for the "lair" feel) + guards
    return {
      type: 'beast_lair',
      platforms: [
        { x: offsetX + 200, y: this.GROUND_Y - 80, width: 64 },
        { x: offsetX + this.CHUNK_WIDTH - 264, y: this.GROUND_Y - 80, width: 64 },
      ],
      groundSegments: [{ x: offsetX, width: this.CHUNK_WIDTH }],
      enemySpawns: [
        // Alpha beast (boar) in center
        { x: offsetX + this.CHUNK_WIDTH * 0.5, y: this.GROUND_Y - 30, type: 'boar' },
        // Guards
        { x: offsetX + this.CHUNK_WIDTH * 0.3, y: this.GROUND_Y - 30, type: 'wolf' },
        { x: offsetX + this.CHUNK_WIDTH * 0.7, y: this.GROUND_Y - 30, type: 'wolf' },
        // Chapter 3 adds shaman
        ...(chapter >= 3 ? [{ x: offsetX + this.CHUNK_WIDTH * 0.4, y: this.GROUND_Y - 30, type: 'shaman' }] : []),
      ],
      itemSpawns: [
        // Guaranteed totem reward (placed after enemies are defeated in GameScene)
        { x: offsetX + this.CHUNK_WIDTH * 0.5, y: this.GROUND_Y - 20, type: 'totem' },
        { x: offsetX + this.CHUNK_WIDTH * 0.5 + 30, y: this.GROUND_Y - 20, type: 'totem' },
        { x: offsetX + this.CHUNK_WIDTH * 0.5 - 30, y: this.GROUND_Y - 20, type: 'bone' },
      ],
      environmentals: [],
    };
  }

  private generateBossChunk(index: number, _chapter: number): ChunkData {
    const offsetX = index * this.CHUNK_WIDTH;
    return {
      type: 'boss',
      platforms: [
        { x: offsetX + 200, y: this.GROUND_Y - 70, width: 80 },
        { x: offsetX + this.CHUNK_WIDTH - 280, y: this.GROUND_Y - 70, width: 80 },
        { x: offsetX + this.CHUNK_WIDTH * 0.5 - 40, y: this.GROUND_Y - 130, width: 80 },
      ],
      groundSegments: [{ x: offsetX, width: this.CHUNK_WIDTH }],
      enemySpawns: [
        { x: offsetX + this.CHUNK_WIDTH * 0.5, y: this.GROUND_Y - 50, type: 'boss_mammoth' },
      ],
      itemSpawns: [],
      environmentals: [],
    };
  }

  private randomPlatforms(offsetX: number, count: number): { x: number; y: number; width: number }[] {
    const platforms: { x: number; y: number; width: number }[] = [];
    for (let i = 0; i < count; i++) {
      platforms.push({
        x: offsetX + 100 + Math.random() * (this.CHUNK_WIDTH - 200),
        y: this.GROUND_Y - 40 - Math.random() * 100,
        width: 48 + Math.floor(Math.random() * 64),
      });
    }
    return platforms;
  }

  private randomGround(offsetX: number): { x: number; width: number }[] {
    if (Math.random() > 0.4) {
      return [{ x: offsetX, width: this.CHUNK_WIDTH }];
    }

    const gapX = offsetX + this.CHUNK_WIDTH * (0.3 + Math.random() * 0.4);
    const gapWidth = 48 + Math.random() * 48;
    return [
      { x: offsetX, width: gapX - offsetX },
      { x: gapX + gapWidth, width: this.CHUNK_WIDTH - (gapX - offsetX) - gapWidth },
    ];
  }
}
