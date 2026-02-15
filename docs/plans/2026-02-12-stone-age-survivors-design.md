# Stone Age Survivors - Game Design Document

## Overview

A pixel-art side-scrolling Rogue-lite shooter. Players control a primitive tribal hunter, battling through randomly generated wilderness using ranged weapons like bows, slings, and blowdarts. Collect resources to strengthen your tribe across runs.

- **Platform**: Web Browser (HTML5)
- **Tech Stack**: Phaser 3 + TypeScript + Vite
- **Art Style**: Pixel Art
- **Resolution**: 640x360 (scales to 1280x720 / 1920x1080)
- **Perspective**: Side-scrolling (horizontal)

---

## Core Loop

### Single Run
1. Depart from tribal camp into a randomly generated continuous map
2. Move left to right: shoot enemies, dodge attacks, collect drops
3. Gain "Totem Blessings" (in-run upgrades) after clearing enemy waves
4. Face a Boss at the end of each area
5. On death, return to camp with collected "Beast Bones" (permanent currency)

### Meta Progression (Cross-Run)
- **Beast Bones** upgrade camp buildings:
  - **Weapon Bench** — Unlock new weapon types
  - **Totem Pole** — Increase blessing drop rates
  - **Hunter's Hut** — Upgrade base stats (HP, speed, crit rate)

---

## Player Character

### Movement
- Run, Jump, Double Jump, Dodge Roll (with i-frames)

### Weapons
- Carry 1 primary + 1 secondary weapon, switchable anytime

| Weapon | Trait | Trajectory |
|--------|-------|-----------|
| Stone Bow | Balanced, starter weapon | Straight line |
| Sling | High damage, slow fire rate | Parabolic arc |
| Blowdart | Fast fire rate, poisonable | Straight, piercing |
| Throwing Spear | Very high single-hit damage | Straight, short range |
| Slingshot | Rapid fire, spread | Fan-shaped scatter |

### Totem Blessings (In-Run Upgrades)
After clearing enemy waves, chance to drop Totem Fragments. Pick up to choose 1 of 3 random blessings:

- Fire Enchantment — Arrows deal burn damage over time
- Piercing Force — Arrows pierce through 2 enemies
- Swift Step — +20% move speed, increased roll distance
- Bone Armor — 30% chance to halve incoming damage
- (8-10 total blessings planned)

---

## Enemies

### Beasts
- **Wolf** — Fast charge attack
- **Boar** — High HP, ramming attack
- **Poison Snake** — Ranged poison spit

### Hostile Tribe
- **Spear Thrower** — Ranged attacker
- **Shield Warrior** — Must be flanked from behind
- **Shaman** — Summons minions and buffs allies

---

## Level Design

### Structure
- Each run has **3 areas** with increasing difficulty:
  - **Chapter 1: Jungle** — Dense forest, vine platforms, tree hollows. Mostly beast enemies.
  - **Chapter 2: Wasteland** — Rocky cliffs, gap jumps, caves. Hostile tribe appears.
  - **Chapter 3: Volcano** — Lava terrain, falling rocks, traps. Final Boss.

### Continuous Map Generation
- Each area is assembled from random **Chunks** (2-3 screens wide each)
- Chunk types: combat zone, platforming zone, elite enemy, treasure, rest area
- Pacing rule: after every 2-3 combat chunks, guarantee 1 rest/treasure chunk
- Each area ends with a fixed Boss room

### Special Rooms (embedded in continuous map)
- **Mystery Totem** — Sacrifice HP for a powerful blessing
- **Hunter's Trap** — Puzzle/challenge room, double drop reward
- **Beast Lair** — Mini-elite fight, rare weapon reward

### Environmental Interaction
- Shoot vines to drop boulders on enemies
- Poison swamps deal continuous damage, must jump across
- Tall grass provides stealth, first-hit crit bonus

---

## Technical Architecture

### Project Structure
```
rouge-game/
├── src/
│   ├── main.ts              # Entry point, initialize Phaser
│   ├── config.ts            # Game config (resolution, physics, etc.)
│   ├── scenes/
│   │   ├── BootScene.ts     # Preload assets
│   │   ├── MenuScene.ts     # Main menu
│   │   ├── GameScene.ts     # Core gameplay scene
│   │   ├── CampScene.ts     # Tribal camp (meta upgrades)
│   │   └── GameOverScene.ts # End-of-run summary
│   ├── entities/
│   │   ├── Player.ts        # Player character
│   │   ├── Enemy.ts         # Enemy base class
│   │   ├── Projectile.ts    # Projectile base class
│   │   └── enemies/         # Enemy subclasses
│   ├── systems/
│   │   ├── WeaponSystem.ts  # Weapon management
│   │   ├── BlessingSystem.ts# Totem blessing system
│   │   ├── LevelGenerator.ts# Map generator
│   │   └── CampUpgrade.ts   # Camp upgrade system
│   ├── utils/
│   │   └── Constants.ts     # Constants
│   └── assets/              # Pixel art assets
├── public/
│   └── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Key Technical Decisions
- **Physics**: Phaser Arcade Physics (lightweight, good for platformers)
- **Map Generation**: Custom chunk-stitching system with predefined templates + random combination
- **Save System**: localStorage for camp upgrades and unlock progress
- **Resolution**: 640x360 pixel-perfect, scaled to 1280x720 or 1920x1080

---

## MVP Milestones

### Milestone 1: Core Feel (Run, Jump, Shoot)
- Project setup (Vite + Phaser 3 + TypeScript)
- Player character: move, jump, roll, aim, shoot
- One basic weapon (Stone Bow)
- Simple static test level
- Basic collision and physics

### Milestone 2: Combat Loop (Something to Fight)
- 2-3 basic enemies (Wolf, Boar, Spear Thrower)
- Enemy AI (patrol, chase, attack)
- Damage system (HP, hit feedback, death)
- Drop system (Beast Bones, Totem Fragments)
- HUD (health bar, weapon icon, bone counter)

### Milestone 3: Rogue Elements (Every Run is Different)
- Chunk-based map generator (5-8 chunk templates)
- Totem Blessing system (8-10 blessings)
- Second weapon + weapon switching
- First Boss
- Game over / summary screen

### Milestone 4: Meta Growth (Getting Stronger)
- Tribal camp scene
- 3 building upgrades (Weapon Bench, Totem Pole, Hunter's Hut)
- localStorage save system
- Main menu
- Sound effects and background music
