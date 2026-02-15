// Game constants
export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;
export const SCALE_FACTOR = 2;

// Physics
export const GRAVITY = 800;
export const PLAYER_SPEED = 120;
export const PLAYER_JUMP_VELOCITY = -280;
export const PLAYER_DOUBLE_JUMP_VELOCITY = -240;
export const PLAYER_ROLL_SPEED = 200;
export const PLAYER_ROLL_DURATION = 300; // ms
export const PLAYER_ROLL_COOLDOWN = 500; // ms
export const PLAYER_MAX_HP = 100;

// Weapons
export const STONE_BOW_FIRE_RATE = 400; // ms between shots
export const STONE_BOW_DAMAGE = 20;
export const STONE_BOW_SPEED = 300;

// Enemies
export const WOLF_SPEED = 80;
export const WOLF_HP = 40;
export const WOLF_DAMAGE = 15;

export const BOAR_SPEED = 50;
export const BOAR_HP = 80;
export const BOAR_DAMAGE = 25;

export const SPEAR_THROWER_SPEED = 40;
export const SPEAR_THROWER_HP = 50;
export const SPEAR_THROWER_DAMAGE = 20;

// Colors (for placeholder graphics)
export const COLORS = {
  PLAYER: 0x4a90d9,
  PLAYER_ROLL: 0x2a70b9,
  ARROW: 0xf5a623,
  WOLF: 0x888888,
  BOAR: 0x8B4513,
  SPEAR_THROWER: 0xcc4444,
  GROUND: 0x4a7a3a,
  PLATFORM: 0x6b5b3a,
  SKY: 0x87CEEB,
  HP_BAR: 0xff3333,
  HP_BG: 0x333333,
  BONE: 0xf0e6d2,
  TOTEM: 0x9b59b6,
};

// Map generation
export const CHUNK_WIDTH = 640 * 2; // 2 screens wide
export const TILE_SIZE = 16;

// Drops
export const BONE_DROP_CHANCE = 0.5;
export const TOTEM_DROP_CHANCE = 0.2;

// Blessings
export const BLESSING_CHOICES = 3;
