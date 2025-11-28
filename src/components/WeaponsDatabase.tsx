import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Weapon, Rarity } from '../types/database';
import { Filter, SortAsc, Loader2 } from 'lucide-react';

export default function WeaponsDatabase() {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [rarities, setRarities] = useState<Rarity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [weaponsRes, raritiesRes] = await Promise.all([
      supabase
        .from('weapons')
        .select(`
          *,
          rarity:rarities(*)
        `)
        .order('name'),
      supabase.from('rarities').select('*').order('tier')
    ]);

    if (weaponsRes.data) setWeapons(weaponsRes.data);
    if (raritiesRes.data) setRarities(raritiesRes.data);
    setLoading(false);
  };

  const weaponTypes = ['Rifle', 'SMG', 'Shotgun', 'Sniper', 'Pistol', 'Heavy'];

  const filteredWeapons = weapons.filter(weapon => {
    const matchesSearch = weapon.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = selectedRarity === 'all' || weapon.rarity_id === selectedRarity;
    const matchesType = selectedType === 'all' || weapon.type === selectedType;
    return matchesSearch && matchesRarity && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-cyan-400" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Weapons Arsenal
          </h2>
          <p className="text-gray-500 text-sm">Complete tactical weapons database</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Showing</span>
          <span className="text-cyan-400 font-bold">{filteredWeapons.length}</span>
          <span className="text-gray-500">weapons</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search weapons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0e1a] border border-cyan-500/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="appearance-none bg-[#0a0e1a] border border-cyan-500/20 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors cursor-pointer"
              >
                <option value="all">All Types</option>
                {weaponTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
            </div>

            <div className="relative">
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="appearance-none bg-[#0a0e1a] border border-cyan-500/20 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors cursor-pointer"
              >
                <option value="all">All Rarities</option>
                {rarities.map(rarity => (
                  <option key={rarity.id} value={rarity.id}>{rarity.name}</option>
                ))}
              </select>
              <SortAsc className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
            </div>
          </div>
        </div>
      </div>

      {filteredWeapons.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl">
          <p className="text-gray-500 mb-2">No weapons found</p>
          <p className="text-sm text-gray-600">Connect to external APIs to populate the database</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredWeapons.map((weapon) => (
            <div
              key={weapon.id}
              className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-5 hover:border-cyan-500/40 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold group-hover:text-cyan-400 transition-colors">{weapon.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">{weapon.type}</span>
                    {weapon.rarity && (
                      <>
                        <span className="text-gray-700">•</span>
                        <span
                          className="text-xs font-medium uppercase tracking-wider"
                          style={{ color: weapon.rarity.color }}
                        >
                          {weapon.rarity.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {weapon.description && (
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{weapon.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0a0e1a] border border-cyan-500/10 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Damage</p>
                  <p className="text-lg font-bold text-cyan-400">{weapon.damage}</p>
                </div>
                <div className="bg-[#0a0e1a] border border-cyan-500/10 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">DPS</p>
                  <p className="text-lg font-bold text-blue-400">{weapon.dps}</p>
                </div>
              </div>

              {(weapon.fire_rate || weapon.magazine_size) && (
                <div className="mt-3 pt-3 border-t border-cyan-500/10 flex items-center justify-between text-xs">
                  {weapon.fire_rate && (
                    <div>
                      <span className="text-gray-500">Fire Rate: </span>
                      <span className="text-gray-300">{weapon.fire_rate}/s</span>
                    </div>
                  )}
                  {weapon.magazine_size && (
                    <div>
                      <span className="text-gray-500">Mag: </span>
                      <span className="text-gray-300">{weapon.magazine_size}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <Filter className="text-cyan-400" size={20} />
          </div>
          <div>
            <h4 className="font-bold mb-2 text-cyan-400">API Integration Ready</h4>
            <p className="text-sm text-gray-400">
              This database is designed to connect to external APIs (like ardb.app) for real-time data synchronization.
              Configure API endpoints to automatically populate and update weapon stats, rarities, and availability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
