import { useState, useEffect } from 'react';
import { Shield, Zap, Package, Search, Filter } from 'lucide-react';
import { api } from '../lib/mongodb';

interface ArmorItem {
  id?: string;
  arcforge_name: string;
  name: string;
  type: string;
  rarity: string;
  quote?: string;
  image_urls?: {
    thumb?: string;
  };
  infobox?: {
    stacksize?: number;
    weight?: number;
    sellprice?: number;
    bslots?: number;
    spslots?: number;
    quslots?: number;
    wslots?: number;
    sCharge?: number;
    healing?: number;
  };
}

export default function Armor() {
  const [items, setItems] = useState<ArmorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'augments' | 'shields' | 'ammo'>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');

  useEffect(() => {
    loadArmorData();
  }, []);

  const loadArmorData = async () => {
    try {
      setLoading(true);
      const data = await api.getItems();
      
      // Filtrar items de tipo Augment, Shield y Ammo
      const armorItems = data.filter((item: any) => 
        item.type === 'Augment' || 
        item.type === 'Shield' || 
        item.type === 'Ammo'
      );
      
      setItems(armorItems);
    } catch (error) {
      console.error('Error loading armor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    const colors: { [key: string]: string } = {
      'Common': 'text-gray-400 border-gray-500/30',
      'Uncommon': 'text-green-400 border-green-500/30',
      'Rare': 'text-blue-400 border-blue-500/30',
      'Epic': 'text-purple-400 border-purple-500/30',
      'Legendary': 'text-yellow-400 border-yellow-500/30',
    };
    return colors[rarity] || 'text-gray-400 border-gray-500/30';
  };

  const getRarityGradient = (rarity: string) => {
    const gradients: { [key: string]: string } = {
      'Common': 'from-gray-500/20 to-gray-600/10',
      'Uncommon': 'from-green-500/20 to-green-600/10',
      'Rare': 'from-blue-500/20 to-blue-600/10',
      'Epic': 'from-purple-500/20 to-purple-600/10',
      'Legendary': 'from-yellow-500/20 to-yellow-600/10',
    };
    return gradients[rarity] || 'from-gray-500/20 to-gray-600/10';
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'Augment':
        return <Zap className="text-cyan-400" size={20} />;
      case 'Shield':
        return <Shield className="text-blue-400" size={20} />;
      case 'Ammo':
        return <Package className="text-orange-400" size={20} />;
      default:
        return <Package className="text-gray-400" size={20} />;
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      (selectedCategory === 'augments' && item.type === 'Augment') ||
      (selectedCategory === 'shields' && item.type === 'Shield') ||
      (selectedCategory === 'ammo' && item.type === 'Ammo');
    const matchesRarity = selectedRarity === 'all' || item.rarity === selectedRarity;
    
    return matchesSearch && matchesCategory && matchesRarity;
  });

  const getCategoryCount = (category: string) => {
    if (category === 'all') return items.length;
    if (category === 'augments') return items.filter(i => i.type === 'Augment').length;
    if (category === 'shields') return items.filter(i => i.type === 'Shield').length;
    if (category === 'ammo') return items.filter(i => i.type === 'Ammo').length;
    return 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400">Loading armor & equipment...</p>
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
            Armor & Equipment
          </h1>
          <p className="text-gray-400 mt-1">
            Augments, Shields, and Ammunition Database
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#1a1f2e] border border-cyan-500/20 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50 w-64"
            />
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { id: 'all', label: 'All Equipment', icon: Filter },
          { id: 'augments', label: 'Augments', icon: Zap },
          { id: 'shields', label: 'Shields', icon: Shield },
          { id: 'ammo', label: 'Ammunition', icon: Package },
        ].map((category) => {
          const Icon = category.icon;
          const isActive = selectedCategory === category.id;
          const count = getCategoryCount(category.id);
          
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className={`p-4 rounded-lg border transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                  : 'bg-[#1a1f2e]/50 border-gray-700/30 hover:border-cyan-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={isActive ? 'text-cyan-400' : 'text-gray-500'} size={20} />
                <span className={`text-lg font-bold ${isActive ? 'text-cyan-400' : 'text-gray-400'}`}>
                  {count}
                </span>
              </div>
              <p className={`text-sm font-medium ${isActive ? 'text-gray-200' : 'text-gray-400'}`}>
                {category.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Rarity Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-400">Filter by rarity:</span>
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

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-cyan-400" size={32} />
          </div>
          <p className="text-gray-400">No equipment found matching your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item, index) => (
            <div
              key={index}
              className={`group relative bg-gradient-to-br ${getRarityGradient(item.rarity)} border ${getRarityColor(item.rarity)} rounded-lg p-4 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer`}
            >
              {/* Item Image */}
              <div className="relative mb-3">
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
                    {getCategoryIcon(item.type)}
                  </div>
                </div>
                
                {/* Type Badge */}
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-xs font-medium flex items-center gap-1">
                  {getCategoryIcon(item.type)}
                  <span className="text-gray-300">{item.type}</span>
                </div>
              </div>

              {/* Item Info */}
              <div className="space-y-2">
                <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                  {item.name}
                </h3>
                
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${getRarityColor(item.rarity)}`}>
                    {item.rarity}
                  </span>
                  {item.infobox?.stacksize && (
                    <span className="text-gray-400">
                      Stack: {item.infobox.stacksize}
                    </span>
                  )}
                </div>

                {item.quote && (
                  <p className="text-xs text-gray-400 italic line-clamp-2">
                    "{item.quote}"
                  </p>
                )}

                {/* Stats */}
                <div className="pt-2 border-t border-gray-700/30 space-y-1">
                  {item.infobox?.bslots && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Body Slots:</span>
                      <span className="text-cyan-400 font-medium">{item.infobox.bslots}</span>
                    </div>
                  )}
                  {item.infobox?.sCharge && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Shield Charge:</span>
                      <span className="text-blue-400 font-medium">{item.infobox.sCharge}</span>
                    </div>
                  )}
                  {item.infobox?.healing && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Healing:</span>
                      <span className="text-green-400 font-medium">{item.infobox.healing}</span>
                    </div>
                  )}
                  {item.infobox?.weight && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Weight:</span>
                      <span className="text-gray-400 font-medium">{item.infobox.weight}</span>
                    </div>
                  )}
                  {item.infobox?.sellprice && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Value:</span>
                      <span className="text-yellow-400 font-medium">{item.infobox.sellprice} 🌾</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none"></div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 p-4 bg-[#1a1f2e]/50 border border-cyan-500/20 rounded-lg">
        <div className="text-center">
          <p className="text-2xl font-bold text-cyan-400">{items.filter(i => i.type === 'Augment').length}</p>
          <p className="text-sm text-gray-400">Augments</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-400">{items.filter(i => i.type === 'Shield').length}</p>
          <p className="text-sm text-gray-400">Shields</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-400">{items.filter(i => i.type === 'Ammo').length}</p>
          <p className="text-sm text-gray-400">Ammunition</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-400">{filteredItems.length}</p>
          <p className="text-sm text-gray-400">Total Showing</p>
        </div>
      </div>
    </div>
  );
}
