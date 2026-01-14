import { useState } from 'react';
import { Search } from 'lucide-react';

// Datos estáticos de armas del wiki oficial
const WEAPONS_DATA = [
  // Assault Rifles
  { id: 1, name: 'Kettle', type: 'Assault Rifle', damage: 26, dps: 280, fireRate: '10', magazine: 42, description: 'Quick and accurate, but has low bullet velocity and takes a long time to reload.' },
  { id: 2, name: 'Rattler', type: 'Assault Rifle', damage: 33.3, dps: 299.7, fireRate: '9', magazine: 36, description: 'A cheap offensive option, but has to be reloaded 2 bullets at a time.' },
  { id: 3, name: 'Arpeggio', type: 'Assault Rifle', damage: 18.3, dps: 173.9, fireRate: '9.5', magazine: 54, description: 'Has decent damage output and accuracy.' },
  { id: 4, name: 'Tempest', type: 'Assault Rifle', damage: 36.7, dps: 367, fireRate: '10', magazine: 30, description: 'Has moderate fire rate and accuracy.' },
  { id: 5, name: 'Bettina', type: 'Assault Rifle', damage: 32, dps: 448, fireRate: '14', magazine: 36, description: 'Has slow fire rate and high damage output.' },

  // Battle Rifles
  { id: 6, name: 'Ferro', type: 'Battle Rifle', damage: 40, dps: 264, fireRate: '6.6', magazine: 20, description: 'Packs a punch, but must be reloaded between every shot.' },
  { id: 7, name: 'Renegade', type: 'Battle Rifle', damage: 35, dps: 735, fireRate: '21', magazine: 30, description: 'Has high damage output, accuracy, and headshot damage.' },
  { id: 8, name: 'Aphelion', type: 'Battle Rifle', damage: 25, dps: 216, fireRate: '9', magazine: 24, description: 'Fires high velocity energy rounds.' },

  // SMG
  { id: 9, name: 'Stitcher', type: 'SMG', damage: 7, dps: 317.1, fireRate: '45.3', magazine: 25, description: 'Deals good damage, but has a low fire-rate and can be hard to control.' },
  { id: 10, name: 'Bobcat', type: 'SMG', damage: 6, dps: 400, fireRate: '66.7', magazine: 24, description: 'Has high fire rate but low accuracy.' },

  // Shotguns
  { id: 11, name: 'Il Toro', type: 'Shotgun', damage: 67.5, dps: 965.3, fireRate: '14.3', magazine: 20, description: 'Has a large bullet spread, sharp falloff, and high damage output.' },
  { id: 12, name: 'Vulcano', type: 'Shotgun', damage: 49.5, dps: 1302.9, fireRate: '26.3', magazine: 26, description: 'Has good bullet spread but sharp falloff.' },

  // Pistols
  { id: 13, name: 'Hairpin', type: 'Pistol', damage: 20, dps: 180, fireRate: '9', magazine: 12, description: 'Has a built-in silencer. Great for stealth, but tricky in combat.' },
  { id: 14, name: 'Burletta', type: 'Pistol', damage: 10, dps: 280, fireRate: '28', magazine: 20, description: 'Has decent damage output and accuracy. Can be fired as fast as you can pull the trigger.' },
  { id: 15, name: 'Venator', type: 'Pistol', damage: 18, dps: 660.6, fireRate: '36.7', magazine: 20, description: 'Fires two shots at a time.' },

  // Hand Cannons
  { id: 16, name: 'Anvil', type: 'Hand Cannon', damage: 40, dps: 652, fireRate: '16.3', magazine: 8, description: 'Has high damage output and headshot damage, but slow handling.' },

  // Light Machine Guns
  { id: 17, name: 'Torrente', type: 'Light Machine Gun', damage: 8, dps: 466.4, fireRate: '58.3', magazine: 100, description: 'Has a large ammo capacity, but is only accurate while crouched.' },

  // Sniper Rifles
  { id: 18, name: 'Osprey', type: 'Sniper Rifle', damage: 45, dps: 796.5, fireRate: '17.7', magazine: 10, description: 'Has reliable damage output and accuracy.' },
  { id: 19, name: 'Jupiter', type: 'Sniper Rifle', damage: 60, dps: 423.5, fireRate: '7.7', magazine: 4, description: 'Fires projectiles at an incredible velocity, capable of damaging multiple targets with one shot.' },

  // Special
  { id: 20, name: 'Hullcracker', type: 'Launcher', damage: 100, dps: 2030, fireRate: '20.3', magazine: 6, description: 'Devastating launcher weapon.' },
  { id: 21, name: 'Equalizer', type: 'Special', damage: 8, dps: 266.4, fireRate: '33.3', magazine: 30, description: 'Energy-based special weapon.' },
  { id: 22, name: 'Trigger Grenade', type: 'Grenade', damage: 120, dps: 240, fireRate: '2', magazine: 1, description: 'Detonates on trigger press. Quick and responsive.' },
];

const WEAPON_TYPES = ['Assault Rifle', 'Battle Rifle', 'SMG', 'Shotgun', 'Pistol', 'Hand Cannon', 'Light Machine Gun', 'Sniper Rifle', 'Launcher', 'Special', 'Grenade'];

export default function WeaponsDatabase() {

  // Filtrar armas
  const filteredWeapons = WEAPONS_DATA.filter(weapon => {
    const matchesSearch = weapon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         weapon.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || weapon.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Agrupar por tipo
  const groupedByType = WEAPON_TYPES.reduce((acc, type) => {
    const typeWeapons = filteredWeapons.filter(w => w.type === type);
    if (typeWeapons.length > 0) {
      acc[type] = typeWeapons;
    }
    return acc;
  }, {} as Record<string, typeof WEAPONS_DATA>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-4xl font-bold mb-2 text-white">Weapons</h2>
        <p className="text-gray-400">Complete tactical weapons database</p>
      </div>

      {/* Búsqueda y Filtros */}
      <div className="flex gap-4 flex-col md:flex-row">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search weapons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0a0e1a] border border-yellow-500/30 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/60"
            />
          </div>
        </div>
        
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 bg-[#0a0e1a] border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500/60 cursor-pointer"
        >
          <option value="all">All Types</option>
          {WEAPON_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-400">
        Showing <span className="text-yellow-400 font-bold">{filteredWeapons.length}</span> of <span className="text-yellow-400 font-bold">{WEAPONS_DATA.length}</span> weapons
      </div>

      {/* Weapons por tipo */}
      <div className="space-y-12">
        {Object.entries(groupedByType).map(([type, typeWeapons]) => (
          <div key={type}>
            <h3 className="text-2xl font-bold mb-6 text-white border-b border-red-500/20 pb-3">
              {type}
            </h3>
            
            {/* Tabla de armas */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-red-500/20">
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Name</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-semibold">Damage</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-semibold">DPS</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-semibold">Fire Rate</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-semibold">Magazine</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {typeWeapons.map((weapon) => (
                    <tr key={weapon.id} className="border-b border-red-500/10 hover:bg-red-950/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{weapon.name}</div>
                      </td>
                      <td className="py-3 px-4 text-center text-yellow-400 font-semibold">{weapon.damage.toFixed(1)}</td>
                      <td className="py-3 px-4 text-center text-yellow-400 font-semibold">{weapon.dps.toFixed(1)}</td>
                      <td className="py-3 px-4 text-center text-gray-300">{weapon.fireRate}</td>
                      <td className="py-3 px-4 text-center text-gray-300">{weapon.magazine}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs">{weapon.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {filteredWeapons.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-2">No weapons found</p>
          <p className="text-sm text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
