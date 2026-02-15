export interface CampBuilding {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  costs: number[]; // cost for each level
  effects: string[];
}

export interface CampSaveData {
  bones: number;
  buildings: Record<string, number>;
  unlockedWeapons: string[];
  totalRuns: number;
  bestChapter: number;
}

const DEFAULT_SAVE: CampSaveData = {
  bones: 0,
  buildings: {
    weapon_bench: 0,
    totem_pole: 0,
    hunter_hut: 0,
  },
  unlockedWeapons: ['stone_bow'],
  totalRuns: 0,
  bestChapter: 0,
};

const BUILDINGS: CampBuilding[] = [
  {
    id: 'weapon_bench',
    name: 'Weapon Bench',
    description: 'Unlock new weapons',
    level: 0,
    maxLevel: 4,
    costs: [30, 60, 100, 200],
    effects: ['Unlock Sling', 'Unlock Blowdart', 'Unlock Throwing Spear', 'Unlock Slingshot'],
  },
  {
    id: 'totem_pole',
    name: 'Totem Pole',
    description: 'Better blessings',
    level: 0,
    maxLevel: 3,
    costs: [40, 80, 150],
    effects: ['+15% blessing drop rate', '+30% blessing drop rate', '+50% blessing drop rate'],
  },
  {
    id: 'hunter_hut',
    name: "Hunter's Hut",
    description: 'Upgrade base stats',
    level: 0,
    maxLevel: 5,
    costs: [20, 40, 70, 120, 200],
    effects: ['+10 HP', '+20 HP', '+5% crit', '+10% crit', '+15% move speed'],
  },
];

const WEAPON_UNLOCK_ORDER = ['sling', 'blowdart', 'throwing_spear', 'slingshot'];

export class CampUpgrade {
  private saveKey = 'stone_age_survivors_save';

  load(): CampSaveData {
    const raw = localStorage.getItem(this.saveKey);
    if (!raw) return { ...DEFAULT_SAVE, buildings: { ...DEFAULT_SAVE.buildings }, unlockedWeapons: [...DEFAULT_SAVE.unlockedWeapons] };
    try {
      return JSON.parse(raw) as CampSaveData;
    } catch {
      return { ...DEFAULT_SAVE, buildings: { ...DEFAULT_SAVE.buildings }, unlockedWeapons: [...DEFAULT_SAVE.unlockedWeapons] };
    }
  }

  save(data: CampSaveData): void {
    localStorage.setItem(this.saveKey, JSON.stringify(data));
  }

  getBuildings(data: CampSaveData): CampBuilding[] {
    return BUILDINGS.map(b => ({
      ...b,
      level: data.buildings[b.id] || 0,
    }));
  }

  canUpgrade(building: CampBuilding, data: CampSaveData): boolean {
    if (building.level >= building.maxLevel) return false;
    return data.bones >= building.costs[building.level];
  }

  upgrade(buildingId: string, data: CampSaveData): CampSaveData {
    const building = BUILDINGS.find(b => b.id === buildingId);
    if (!building) return data;

    const level = data.buildings[buildingId] || 0;
    if (level >= building.maxLevel) return data;
    if (data.bones < building.costs[level]) return data;

    const newData = {
      ...data,
      bones: data.bones - building.costs[level],
      buildings: {
        ...data.buildings,
        [buildingId]: level + 1,
      },
    };

    // Unlock weapon if weapon bench
    if (buildingId === 'weapon_bench' && level < WEAPON_UNLOCK_ORDER.length) {
      newData.unlockedWeapons = [...data.unlockedWeapons, WEAPON_UNLOCK_ORDER[level]];
    }

    return newData;
  }

  getStatBonuses(data: CampSaveData): { hpBonus: number; critBonus: number; speedBonus: number; totemDropBonus: number } {
    const hut = data.buildings['hunter_hut'] || 0;
    const totem = data.buildings['totem_pole'] || 0;

    return {
      hpBonus: hut >= 1 ? (hut >= 2 ? 30 : 10) : 0,
      critBonus: hut >= 3 ? (hut >= 4 ? 0.1 : 0.05) : 0,
      speedBonus: hut >= 5 ? 0.15 : 0,
      totemDropBonus: totem >= 1 ? totem * 0.15 : 0,
    };
  }
}
