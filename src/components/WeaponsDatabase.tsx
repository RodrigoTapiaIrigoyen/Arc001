import { useState, useEffect } from 'react';
import { db } from '../lib/mongodb';
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
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
      // Cargar items de ArcForge + weapons de ARDB
      const [itemsData, weaponsData, raritiesData] = await Promise.all([
        (await fetch(`${API_URL}/items`)).json(),
        db.collection('weapons').find().toArray(),
        db.collection('rarities').find().toArray()
      ]);
      
      // Filtrar solo armas de items de ArcForge
      const weaponItems = itemsData.filter((item: any) => 
        item.type && ['Weapon', 'Primary Weapon', 'Secondary Weapon', 'Melee'].includes(item.type)
      );

      // Combinar armas de ArcForge con weapons de ARDB
      const allWeapons = [
        ...weaponItems.map((item: any) => ({
          id: item._id,
          name: item.name,
          type: item.type || 'Weapon',
          description: item.quote || item.infobox_full?.quote,
          damage: item.damage || item.infobox_full?.damage || 0,
          dps: item.infobox_full?.dps || 0,
          fire_rate: item.firerate || item.infobox_full?.firerate || 0,
          magazine_size: item.magsize || item.infobox_full?.magsize || 0,
          rarity: item.rarity || 'Common',
          rarity_id: item.rarity?.toLowerCase(),
          source: 'arcforge',
          crafting: item.crafting || [],
          upgrades: item.upgrades || [],
          image_urls: item.image_urls || {}
        })),
        ...weaponsData as any
      ];
      
      setWeapons(allWeapons);
      setRarities(raritiesData as any);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const weaponTypes = ['Rifle', 'SMG', 'Shotgun', 'Sniper', 'Pistol', 'Heavy'];

  // Armas que no se deben mostrar a los usuarios
  const hiddenWeapons = [
    'Viper SMG',
    'Guardian LMG',
    'ARC-9 Assault Rifle',
    'Scatter Shotgun',
    'Plasma Devastator',
    'Precision Sniper'
  ];

  const filteredWeapons = weapons.filter(weapon => {
    const isNotHidden = !hiddenWeapons.includes(weapon.name);
    const matchesSearch = weapon.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = selectedRarity === 'all' || weapon.rarity_id === selectedRarity;
    const matchesType = selectedType === 'all' || weapon.type === selectedType;
    return isNotHidden && matchesSearch && matchesRarity && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-red-400" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 bg-clip-text text-transparent">
            Weapons Arsenal
          </h2>
          <p className="text-gray-500 text-sm">Complete tactical weapons database</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Showing</span>
          <span className="text-yellow-400 font-bold">{filteredWeapons.length}</span>
          <span className="text-gray-500">weapons</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-red-500/20 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search weapons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0e1a] border border-yellow-500/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500/50 transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="appearance-none bg-[#0a0e1a] border border-green-500/20 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-green-500/50 transition-colors cursor-pointer"
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
                className="appearance-none bg-[#0a0e1a] border border-blue-500/20 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
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
        <div className="text-center py-16 bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-blue-500/20 rounded-xl">
          <p className="text-gray-500 mb-2">No weapons found</p>
          <p className="text-sm text-gray-600">Connect to external APIs to populate the database</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredWeapons.map((weapon) => (
            <div
              key={weapon.id}
              className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-red-500/20 rounded-xl p-5 hover:border-yellow-500/40 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold group-hover:text-yellow-400 transition-colors">{weapon.name}</h3>
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
                <div className="bg-[#0a0e1a] border border-red-500/10 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Damage</p>
                  <p className="text-lg font-bold text-red-400">{weapon.damage}</p>
                </div>
                <div className="bg-[#0a0e1a] border border-yellow-500/10 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">DPS</p>
                  <p className="text-lg font-bold text-yellow-400">{weapon.dps}</p>
                </div>
              </div>

              {(weapon.fire_rate || weapon.magazine_size) && (
                <div className="mt-3 pt-3 border-t border-green-500/10 flex items-center justify-between text-xs">
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

      <div className="bg-gradient-to-r from-red-500/10 to-blue-500/10 border border-yellow-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <Filter className="text-yellow-400" size={20} />
          </div>
          <div>
            <h4 className="font-bold mb-2 text-yellow-400">Base de Datos Completa</h4>
            <p className="text-sm text-gray-400">
              Explora toda la información de armas disponibles en Arc Raiders. Filtra por tipo, rareza y categoría para encontrar exactamente lo que buscas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
