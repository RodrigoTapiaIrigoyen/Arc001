import { useState, useEffect } from 'react';
import { Package, Search, Filter, Layers } from 'lucide-react';
import { api } from '../lib/mongodb';

interface Item {
  arcforge_name: string;
  name: string;
  type: string;
  rarity: string;
  quote?: string;
  special_types?: string[];
  location?: string;
  image_urls?: {
    thumb?: string;
  };
  infobox?: {
    stacksize?: number;
    weight?: number;
    sellprice?: number;
  };
  crafting?: any[];
}

const ITEM_CATEGORIES = {
  'Materials': ['Basic Material', 'Advanced Material', 'Refined Material', 'Topside Material'],
  'Nature': ['Nature'],
  'Keys & Access': ['Key'],
  'Trinkets': ['Trinket'],
  'Recyclables': ['Recyclable'],
  'Misc': ['Misc'],
};

const LOCATIONS = ['Blue Gate', 'Buried City', 'Dam', 'Spaceport', 'Stella Montis'];

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [showCraftableOnly, setShowCraftableOnly] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await api.getItems();
      
      // Filtrar items que no sean armas, augments, shields o ammo
      const filteredItems = data.filter((item: any) => 
        !['Weapon', 'Primary Weapon', 'Secondary Weapon', 'Melee', 'Augment', 'Shield', 'Ammo'].includes(item.type) &&
        !item.type?.includes('Modification')
      );
      
      setItems(filteredItems);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      'Common': 'text-gray-400 border-gray-500/30',
      'Uncommon': 'text-green-400 border-green-500/30',
      'Rare': 'text-blue-400 border-blue-500/30',
      'Epic': 'text-purple-400 border-purple-500/30',
      'Legendary': 'text-yellow-400 border-yellow-500/30',
    };
    return colors[rarity] || 'text-gray-400 border-gray-500/30';
  };

  const getRarityGradient = (rarity: string) => {
    const gradients: Record<string, string> = {
      'Common': 'from-gray-500/20 to-gray-600/10',
      'Uncommon': 'from-green-500/20 to-green-600/10',
      'Rare': 'from-blue-500/20 to-blue-600/10',
      'Epic': 'from-purple-500/20 to-purple-600/10',
      'Legendary': 'from-yellow-500/20 to-yellow-600/10',
    };
    return gradients[rarity] || 'from-gray-500/20 to-gray-600/10';
  };

  const getCategoryForType = (type: string) => {
    for (const [category, types] of Object.entries(ITEM_CATEGORIES)) {
      if (types.includes(type)) return category;
    }
    return 'Other';
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const itemCategory = getCategoryForType(item.type);
    const matchesCategory = selectedCategory === 'all' || itemCategory === selectedCategory;
    const matchesRarity = selectedRarity === 'all' || item.rarity === selectedRarity;
    const matchesLocation = selectedLocation === 'all' || item.location === selectedLocation;
    const matchesCraftable = !showCraftableOnly || (item.crafting && item.crafting.length > 0);
    
    return matchesSearch && matchesCategory && matchesRarity && matchesLocation && matchesCraftable;
  });

  const getCategoryCount = (category: string) => {
    if (category === 'all') return items.length;
    return items.filter(item => getCategoryForType(item.type) === category).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400">Loading items database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Items Database
          </h1>
          <p className="text-gray-400 mt-1">
            Materials, Resources, Keys, and Collectibles
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#1a1f2e] border border-cyan-500/20 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50 w-64"
            />
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`p-3 rounded-lg border transition-all ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border-cyan-500/50'
              : 'bg-[#1a1f2e]/50 border-gray-700/30 hover:border-cyan-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <Filter className={selectedCategory === 'all' ? 'text-cyan-400' : 'text-gray-500'} size={16} />
            <span className={`text-sm font-bold ${selectedCategory === 'all' ? 'text-cyan-400' : 'text-gray-400'}`}>
              {getCategoryCount('all')}
            </span>
          </div>
          <p className={`text-xs ${selectedCategory === 'all' ? 'text-gray-200' : 'text-gray-400'}`}>
            All Items
          </p>
        </button>

        {Object.keys(ITEM_CATEGORIES).map((category) => {
          const isActive = selectedCategory === category;
          const count = getCategoryCount(category);
          
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`p-3 rounded-lg border transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border-cyan-500/50'
                  : 'bg-[#1a1f2e]/50 border-gray-700/30 hover:border-cyan-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Layers className={isActive ? 'text-cyan-400' : 'text-gray-500'} size={16} />
                <span className={`text-sm font-bold ${isActive ? 'text-cyan-400' : 'text-gray-400'}`}>
                  {count}
                </span>
              </div>
              <p className={`text-xs ${isActive ? 'text-gray-200' : 'text-gray-400'}`}>
                {category}
              </p>
            </button>
          );
        })}
      </div>

      {/* Additional Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Rarity:</span>
          {['all', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'].map((rarity) => (
            <button
              key={rarity}
              onClick={() => setSelectedRarity(rarity)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                selectedRarity === rarity
                  ? `${getRarityColor(rarity)} bg-gradient-to-r ${getRarityGradient(rarity)}`
                  : 'bg-[#1a1f2e]/50 border-gray-700/30 text-gray-500 hover:border-gray-600'
              }`}
            >
              {rarity === 'all' ? 'All' : rarity}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Location:</span>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-1.5 bg-[#1a1f2e] border border-cyan-500/20 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Locations</option>
            {LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1f2e] border border-cyan-500/20 rounded-lg cursor-pointer hover:border-cyan-500/40 transition-colors">
          <input
            type="checkbox"
            checked={showCraftableOnly}
            onChange={(e) => setShowCraftableOnly(e.target.checked)}
            className="w-4 h-4 accent-cyan-500"
          />
          <span className="text-sm text-gray-300">Craftable Only</span>
        </label>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="text-cyan-400" size={32} />
          </div>
          <p className="text-gray-400">No items found matching your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredItems.map((item, index) => (
            <div
              key={index}
              className={`group relative bg-gradient-to-br ${getRarityGradient(item.rarity)} border ${getRarityColor(item.rarity)} rounded-lg p-3 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer`}
            >
              {/* Item Image */}
              <div className="relative mb-2">
                <div className="aspect-square bg-[#0a0e1a] rounded-lg overflow-hidden border border-gray-700/30">
                  {item.image_urls?.thumb ? (
                    <img
                      src={item.image_urls.thumb}
                      alt={item.name}
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`${item.image_urls?.thumb ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                    <Package className="text-gray-500" size={24} />
                  </div>
                </div>
                
                {/* Craftable Badge */}
                {item.crafting && item.crafting.length > 0 && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500/80 backdrop-blur-sm rounded text-xs font-medium text-white">
                    Craftable
                  </div>
                )}
              </div>

              {/* Item Info */}
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors line-clamp-2 leading-tight">
                  {item.name}
                </h3>
                
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${getRarityColor(item.rarity)}`}>
                    {item.rarity}
                  </span>
                  {item.infobox?.stacksize && (
                    <span className="text-gray-400">
                      x{item.infobox.stacksize}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 truncate">{item.type}</p>

                {item.location && (
                  <p className="text-xs text-green-400 truncate">📍 {item.location}</p>
                )}

                {item.infobox?.sellprice && (
                  <p className="text-xs text-yellow-400 font-medium">
                    {item.infobox.sellprice} 🌾
                  </p>
                )}
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none"></div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 p-4 bg-[#1a1f2e]/50 border border-cyan-500/20 rounded-lg">
        <div className="text-center">
          <p className="text-2xl font-bold text-cyan-400">{filteredItems.length}</p>
          <p className="text-sm text-gray-400">Showing</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">
            {items.filter(i => i.crafting && i.crafting.length > 0).length}
          </p>
          <p className="text-sm text-gray-400">Craftable</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-400">
            {items.filter(i => i.type === 'Key').length}
          </p>
          <p className="text-sm text-gray-400">Keys</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-400">
            {items.filter(i => ITEM_CATEGORIES['Materials'].includes(i.type)).length}
          </p>
          <p className="text-sm text-gray-400">Materials</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-400">{items.length}</p>
          <p className="text-sm text-gray-400">Total Items</p>
        </div>
      </div>
    </div>
  );
}
