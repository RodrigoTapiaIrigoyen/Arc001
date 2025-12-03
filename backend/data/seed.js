// Seed Data - Arc Raiders
// Datos base para desarrollo mientras se encuentra la API correcta

export const weapons = [
  {
    name: 'ARC-9 Assault Rifle',
    type: 'Rifle',
    damage: 45,
    dps: 340,
    fire_rate: 7.5,
    magazine_size: 30,
    reload_speed: 2.3,
    range: 500,
    accuracy: 85,
    rarity: 'Common',
    description: 'Standard issue assault rifle. Reliable and versatile for all situations.',
    source: 'seed',
    synced_at: new Date()
  },
  {
    name: 'Plasma Devastator',
    type: 'Heavy',
    damage: 180,
    dps: 450,
    fire_rate: 2.5,
    magazine_size: 8,
    reload_speed: 3.5,
    range: 300,
    accuracy: 70,
    rarity: 'Legendary',
    description: 'Experimental plasma weapon with devastating power. Use with caution.',
    source: 'seed',
    synced_at: new Date()
  },
  {
    name: 'Viper SMG',
    type: 'SMG',
    damage: 28,
    dps: 420,
    fire_rate: 15,
    magazine_size: 40,
    reload_speed: 1.8,
    range: 250,
    accuracy: 75,
    rarity: 'Rare',
    description: 'High rate of fire SMG perfect for close-quarters combat.',
    source: 'seed',
    synced_at: new Date()
  },
  {
    name: 'Precision Sniper',
    type: 'Sniper',
    damage: 250,
    dps: 250,
    fire_rate: 1,
    magazine_size: 5,
    reload_speed: 3.2,
    range: 1000,
    accuracy: 98,
    rarity: 'Epic',
    description: 'Long-range precision rifle. One shot, one kill.',
    source: 'seed',
    synced_at: new Date()
  },
  {
    name: 'Scatter Shotgun',
    type: 'Shotgun',
    damage: 120,
    dps: 360,
    fire_rate: 3,
    magazine_size: 8,
    reload_speed: 2.5,
    range: 150,
    accuracy: 60,
    rarity: 'Uncommon',
    description: 'Devastating at close range. Spreads pellets in a wide cone.',
    source: 'seed',
    synced_at: new Date()
  },
  {
    name: 'Guardian LMG',
    type: 'Heavy',
    damage: 55,
    dps: 550,
    fire_rate: 10,
    magazine_size: 100,
    reload_speed: 4.5,
    range: 600,
    accuracy: 70,
    rarity: 'Rare',
    description: 'Suppressive fire machine gun. High capacity, sustained damage.',
    source: 'seed',
    synced_at: new Date()
  }
];

export const quests = [
  {
    name: 'First Contact',
    type: 'Main',
    level: 1,
    description: 'Your first encounter with the ARC threat. Learn the basics of survival.',
    objectives: [
      'Explore the crash site',
      'Collect 5 supply crates',
      'Defeat 3 ARC scouts'
    ],
    rewards: {
      xp: 500,
      credits: 1000,
      items: ['Basic Med Kit', 'ARC-9 Assault Rifle']
    },
    location: 'Northern Wastes',
    source: 'seed',
    synced_at: new Date()
  },
  {
    name: 'Supply Run',
    type: 'Side',
    level: 3,
    description: 'The settlement needs supplies. Raid an abandoned facility.',
    objectives: [
      'Reach the Old Research Facility',
      'Find 10 food rations',
      'Extract safely'
    ],
    rewards: {
      xp: 300,
      credits: 750,
      items: ['Backpack Upgrade']
    },
    location: 'Research Facility Alpha',
    source: 'seed',
    synced_at: new Date()
  },
  {
    name: 'ARC Hunters',
    type: 'Main',
    level: 5,
    description: 'Hunt down elite ARC units terrorizing the region.',
    objectives: [
      'Locate ARC command post',
      'Eliminate 2 ARC Commanders',
      'Destroy the communication array'
    ],
    rewards: {
      xp: 1200,
      credits: 2500,
      items: ['Plasma Devastator', 'Epic Armor Plate']
    },
    location: 'Frozen Valley',
    source: 'seed',
    synced_at: new Date()
  }
];

export const rarities = [
  { name: 'Common', color: '#9CA3AF', tier: 1, drop_rate: 60 },
  { name: 'Uncommon', color: '#10B981', tier: 2, drop_rate: 25 },
  { name: 'Rare', color: '#3B82F6', tier: 3, drop_rate: 10 },
  { name: 'Epic', color: '#8B5CF6', tier: 4, drop_rate: 4 },
  { name: 'Legendary', color: '#F59E0B', tier: 5, drop_rate: 1 }
];
