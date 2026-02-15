import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../utils/Constants';

export interface ChunkData {
  type: 'combat' | 'platforming' | 'rest' | 'treasure' | 'elite' | 'boss';
  platforms: { x: number; y: number; width: number }[];
  groundSegments: { x: number; width: number; height?: number }[];
  enemySpawns: { x: number; y: number; type: string }[];
  itemSpawns: { x: number; y: number; type: string }[];
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
    const chunkCount = 6 + chapter * 2; // more chunks per chapter
    let combatStreak = 0;

    // Start chunk - always safe
    chunks.push(this.generateStartChunk());

    for (let i = 1; i < chunkCount - 1; i++) {
      if (combatStreak >= 2) {
        // Force a rest or treasure chunk
        chunks.push(Math.random() > 0.5 ? this.generateRestChunk(i) : this.generateTreasureChunk(i));
        combatStreak = 0;
      } else {
        const roll = Math.random();
        if (roll < 0.5) {
          chunks.push(this.generateCombatChunk(i, chapter));
          combatStreak++;
        } else if (roll < 0.7) {
          chunks.push(this.generatePlatformingChunk(i));
          combatStreak = 0;
        } else if (roll < 0.85) {
          chunks.push(this.generateEliteChunk(i, chapter));
          combatStreak++;
        } else {
          chunks.push(this.generateTreasureChunk(i));
          combatStreak = 0;
        }
      }
    }

    // Boss chunk at the end
    chunks.push(this.generateBossChunk(chunkCount - 1, chapter));

    return chunks;
  }

  private generateStartChunk(): ChunkData {
    return {
      type: 'rest',
      platforms: [],
      groundSegments: [{ x: 0, width: this.CHUNK_WIDTH }],
      enemySpawns: [],
      itemSpawns: [],
    };
  }

  private generateCombatChunk(index: number, chapter: number): ChunkData {
    const offsetX = index * this.CHUNK_WIDTH;
    const platforms = this.randomPlatforms(offsetX, 2 + Math.floor(Math.random() * 3));
    const groundSegments = this.randomGround(offsetX);
    const enemyCount = 2 + chapter + Math.floor(Math.random() * 2);

    const enemySpawns = [];
    const enemyTypes = chapter === 1 ? ['wolf', 'boar'] :
      chapter === 2 ? ['wolf', 'boar', 'spear_thrower'] :
        ['wolf', 'boar', 'spear_thrower'];

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
    };
  }

  private generatePlatformingChunk(index: number): ChunkData {
    const offsetX = index * this.CHUNK_WIDTH;
    const platforms = this.randomPlatforms(offsetX, 4 + Math.floor(Math.random() * 3));

    // Add gaps in ground
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
    };
  }

  private generateEliteChunk(index: number, chapter: number): ChunkData {
    const offsetX = index * this.CHUNK_WIDTH;
    return {
      type: 'elite',
      platforms: this.randomPlatforms(offsetX, 2),
      groundSegments: [{ x: offsetX, width: this.CHUNK_WIDTH }],
      enemySpawns: [
        { x: offsetX + this.CHUNK_WIDTH * 0.5, y: this.GROUND_Y - 30, type: 'boar' },
        { x: offsetX + this.CHUNK_WIDTH * 0.3, y: this.GROUND_Y - 30, type: 'wolf' },
        { x: offsetX + this.CHUNK_WIDTH * 0.7, y: this.GROUND_Y - 30, type: 'wolf' },
      ],
      itemSpawns: [
        { x: offsetX + this.CHUNK_WIDTH * 0.5, y: this.GROUND_Y - 20, type: 'totem' },
      ],
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
    // Mostly full ground with occasional small gaps
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
