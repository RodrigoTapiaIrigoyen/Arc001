import { useState, useEffect } from 'react';
import { ScrollText, MapPin, User, Package, CheckCircle2, Circle, Search, Filter } from 'lucide-react';

interface QuestItem {
  item: {
    id: string;
    name: string;
    rarity: string;
    icon: string;
    type: string;
  };
  amount: number;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  trader: {
    id: string;
    name: string;
    type?: string;
    image: string;
    icon: string;
  };
  maps: Array<{
    id: string;
    name: string;
  }>;
  steps: Array<{
    title: string;
    amount?: number;
  }>;
  requiredItems: QuestItem[];
  xpReward: number;
  updatedAt: string;
}

export default function Quests() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrader, setSelectedTrader] = useState<string>('all');
  const [selectedMap, setSelectedMap] = useState<string>('all');
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null);

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/quests`);
      const data = await response.json();
      setQuests(data);
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      'common': 'text-gray-400',
      'uncommon': 'text-green-400',
      'rare': 'text-blue-400',
      'epic': 'text-purple-400',
      'legendary': 'text-yellow-400',
    };
    return colors[rarity?.toLowerCase()] || 'text-gray-400';
  };

  const getTraders = () => {
    const traders = new Set<string>();
    quests.forEach(q => traders.add(q.trader.name));
    return Array.from(traders).sort();
  };

  const getMaps = () => {
    const maps = new Set<string>();
    quests.forEach(q => q.maps.forEach(m => maps.add(m.name)));
    return Array.from(maps).sort();
  };

  const filteredQuests = quests.filter(quest => {
    const matchesSearch = 
      quest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quest.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quest.trader.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTrader = selectedTrader === 'all' || quest.trader.name === selectedTrader;
    const matchesMap = selectedMap === 'all' || quest.maps.some(m => m.name === selectedMap);
    
    return matchesSearch && matchesTrader && matchesMap;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400">Loading quests...</p>
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
            Quests & Missions
          </h1>
          <p className="text-gray-400 mt-1">
            Complete database of available quests from all traders
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search quests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#1a1f2e] border border-cyan-500/20 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50 w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <ScrollText className="text-cyan-400" size={20} />
            <span className="text-2xl font-bold text-cyan-400">{quests.length}</span>
          </div>
          <p className="text-sm text-gray-300">Total Quests</p>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <User className="text-purple-400" size={20} />
            <span className="text-2xl font-bold text-purple-400">{getTraders().length}</span>
          </div>
          <p className="text-sm text-gray-300">Traders</p>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <MapPin className="text-green-400" size={20} />
            <span className="text-2xl font-bold text-green-400">{getMaps().length}</span>
          </div>
          <p className="text-sm text-gray-300">Locations</p>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-orange-500/20 to-yellow-500/10 border border-orange-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Package className="text-orange-400" size={20} />
            <span className="text-2xl font-bold text-orange-400">
              {quests.reduce((sum, q) => sum + q.requiredItems.length, 0)}
            </span>
          </div>
          <p className="text-sm text-gray-300">Required Items</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="text-gray-500" size={16} />
          <span className="text-sm text-gray-400">Trader:</span>
          <select
            value={selectedTrader}
            onChange={(e) => setSelectedTrader(e.target.value)}
            className="px-3 py-1.5 bg-[#1a1f2e] border border-cyan-500/20 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Traders</option>
            {getTraders().map(trader => (
              <option key={trader} value={trader}>{trader}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="text-gray-500" size={16} />
          <span className="text-sm text-gray-400">Map:</span>
          <select
            value={selectedMap}
            onChange={(e) => setSelectedMap(e.target.value)}
            className="px-3 py-1.5 bg-[#1a1f2e] border border-cyan-500/20 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Maps</option>
            {getMaps().map(map => (
              <option key={map} value={map}>{map}</option>
            ))}
          </select>
        </div>

        {(searchQuery || selectedTrader !== 'all' || selectedMap !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTrader('all');
              setSelectedMap('all');
            }}
            className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400 hover:bg-red-500/30 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Quests List */}
      {filteredQuests.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ScrollText className="text-cyan-400" size={32} />
          </div>
          <p className="text-gray-400">No quests found matching your filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuests.map((quest) => (
            <div
              key={quest.id}
              className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-lg overflow-hidden hover:border-cyan-500/40 transition-all"
            >
              {/* Quest Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedQuest(expandedQuest === quest.id ? null : quest.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Trader Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-cyan-500/30 bg-[#0a0e1a]">
                      {quest.trader.icon && (
                        <img
                          src={`https://ardb.app${quest.trader.icon}`}
                          alt={quest.trader.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Quest Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                          {quest.title}
                          {expandedQuest === quest.id ? (
                            <CheckCircle2 className="text-green-400" size={20} />
                          ) : (
                            <Circle className="text-gray-500" size={20} />
                          )}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-400 mb-2">
                          <span className="flex items-center gap-1">
                            <User size={14} className="text-cyan-400" />
                            {quest.trader.name}
                          </span>
                          {quest.trader.type && (
                            <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400">
                              {quest.trader.type}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {quest.requiredItems.length > 0 && (
                        <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                          <Package className="text-orange-400" size={16} />
                          <span className="text-sm font-medium text-orange-400">
                            {quest.requiredItems.length}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {quest.description}
                    </p>

                    {/* Maps */}
                    <div className="flex flex-wrap gap-2">
                      {quest.maps.map((map) => (
                        <span
                          key={map.id}
                          className="px-2 py-1 bg-[#0a0e1a] border border-gray-700/50 rounded text-xs text-gray-300 flex items-center gap-1"
                        >
                          <MapPin size={12} className="text-green-400" />
                          {map.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedQuest === quest.id && (
                <div className="border-t border-cyan-500/20 p-4 bg-[#0a0e1a]/50 space-y-4">
                  {/* Steps */}
                  {quest.steps.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        Objectives
                      </h4>
                      <div className="space-y-2">
                        {quest.steps.map((step, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <Circle size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-300">
                              {step.title}
                              {step.amount && (
                                <span className="ml-1 text-cyan-400 font-medium">
                                  ({step.amount})
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Required Items */}
                  {quest.requiredItems.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
                        <Package size={16} />
                        Required Items
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {quest.requiredItems.map((reqItem, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-2 bg-[#1a1f2e] border border-gray-700/30 rounded-lg"
                          >
                            {reqItem.item.icon && (
                              <img
                                src={`https://ardb.app${reqItem.item.icon}`}
                                alt={reqItem.item.name}
                                className="w-10 h-10 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${getRarityColor(reqItem.item.rarity)}`}>
                                {reqItem.item.name}
                              </p>
                              <p className="text-xs text-gray-500">{reqItem.item.type}</p>
                            </div>
                            <span className="text-lg font-bold text-cyan-400">
                              x{reqItem.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rewards */}
                  {quest.xpReward > 0 && (
                    <div className="pt-3 border-t border-gray-700/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Rewards:</span>
                        <span className="text-sm font-medium text-yellow-400">
                          {quest.xpReward} XP
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
