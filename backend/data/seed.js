// Seed Data - Arc Raiders
// Datos base para desarrollo mientras se encuentra la API correcta
// Última actualización: Parche 1.11.0 - 13 de Enero 2026

export const weapons = [
  {
    name: 'Kettle',
    type: 'Marksman Rifle',
    damage: 85,
    dps: 425,
    fire_rate: 450,
    magazine_size: 1,
    reload_speed: 2.8,
    range: 800,
    accuracy: 95,
    rarity: 'Rare',
    description: 'Precision marksman weapon. Fire rate reduced in patch 1.11.0 to prevent macro abuse and create fair PVP dynamics.',
    patch_version: '1.11.0',
    patch_notes: 'Reduced fire rate from 600 to 450 - previously only achievable with macros',
    source: 'ardb',
    synced_at: new Date()
  },
  {
    name: 'Trigger Grenade',
    type: 'Grenade',
    damage: 120,
    dps: 240,
    fire_rate: 2,
    magazine_size: 1,
    reload_speed: 1.5,
    range: 400,
    accuracy: 85,
    rarity: 'Uncommon',
    description: 'Detonates on trigger press. Previously dominated PVP - now balanced for both air and sticky bomb playstyles.',
    patch_version: '1.11.0',
    patch_notes: 'Increased trigger delay from 0.7s to 1.5s, rebalanced damage falloff closer to explosion center',
    source: 'ardb',
    synced_at: new Date()
  },
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
      items: ['Basic Med Kit']
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
      items: ['Epic Armor Plate']
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
