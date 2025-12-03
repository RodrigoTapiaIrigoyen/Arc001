import { useState, useEffect } from 'react';
import { Target, Zap, Shield as ShieldIcon, Search, Skull, ThumbsUp, Edit } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface EnemyComponent {
  name: string;
  type: string;
  rarity: string;
  quote?: string;
  image_urls?: {
    thumb?: string;
  };
  infobox?: {
    sellprice?: number;
    weight?: number;
  };
}

interface Enemy {
  id: string;
  name: string;
  type: string;
  threat: string;
  description: string;
  components: string[];
  hp_min: number;
  hp_max: number;
  damage_min: number;
  damage_max: number;
  abilities: string[];
  verified: boolean;
  contributions_count: number;
  last_updated: string;
}

interface EnemyType {
  id: string;
  name: string;
  type: string;
  threat: string;
  description: string;
  components: string[];
  color: string;
  borderColor: string;
  iconColor: string;
  estimatedHP: string;
  estimatedDamage: string;
  abilities: string[];
}

const ENEMY_TYPES: EnemyType[] = [
  {
    id: 'leaper',
    name: 'Leaper',
    type: 'Scout Unit',
    threat: 'Low',
    description: 'Fast-moving reconnaissance drones that patrol in packs',
    components: ['Leaper Pulse Unit'],
    color: 'from-green-500/30 to-emerald-500/20',
    borderColor: 'border-green-500/50',
    iconColor: 'text-green-400',
    estimatedHP: '150-200',
    estimatedDamage: '15-25',
    abilities: ['Quick Movement', 'Pack Tactics', 'Pulse Attack'],
  },
  {
    id: 'wasp',
    name: 'Wasp',
    type: 'Aerial Unit',
    threat: 'Medium',
    description: 'Agile flying units with ranged attacks',
    components: ['Wasp Driver', 'Damaged Wasp Driver'],
    color: 'from-yellow-500/30 to-orange-500/20',
    borderColor: 'border-yellow-500/50',
    iconColor: 'text-yellow-400',
    estimatedHP: '200-300',
    estimatedDamage: '20-35',
    abilities: ['Flight', 'Ranged Attack', 'Evasive Maneuvers'],
  },
  {
    id: 'hornet',
    name: 'Hornet',
    type: 'Heavy Aerial',
    threat: 'High',
    description: 'Heavily armed flying units with devastating firepower',
    components: ['Hornet Driver', 'Damaged Hornet Driver'],
    color: 'from-orange-500/30 to-red-500/20',
    borderColor: 'border-orange-500/50',
    iconColor: 'text-orange-400',
    estimatedHP: '400-600',
    estimatedDamage: '40-60',
    abilities: ['Heavy Armor', 'Explosive Rounds', 'Aerial Superiority'],
  },
  {
    id: 'tick',
    name: 'Tick',
    type: 'Explosive Unit',
    threat: 'Medium',
    description: 'Suicide bombers that rush targets and self-destruct',
    components: ['Tick Pod', 'Damaged Tick Pod'],
    color: 'from-red-500/30 to-pink-500/20',
    borderColor: 'border-red-500/50',
    iconColor: 'text-red-400',
    estimatedHP: '50-100',
    estimatedDamage: '100-150',
    abilities: ['Kamikaze', 'Proximity Detonation', 'Fast Rush'],
  },
  {
    id: 'bombardier',
    name: 'Bombardier',
    type: 'Artillery Unit',
    threat: 'High',
    description: 'Long-range artillery units with area-of-effect attacks',
    components: ['Bombardier Cell'],
    color: 'from-purple-500/30 to-violet-500/20',
    borderColor: 'border-purple-500/50',
    iconColor: 'text-purple-400',
    estimatedHP: '500-700',
    estimatedDamage: '50-80',
    abilities: ['Artillery Strike', 'Area Damage', 'Long Range'],
  },
  {
    id: 'bastion',
    name: 'Bastion',
    type: 'Tank Unit',
    threat: 'Very High',
    description: 'Heavily armored defensive units with shield capabilities',
    components: ['Bastion Cell'],
    color: 'from-blue-500/30 to-cyan-500/20',
    borderColor: 'border-blue-500/50',
    iconColor: 'text-blue-400',
    estimatedHP: '800-1200',
    estimatedDamage: '30-50',
    abilities: ['Heavy Armor', 'Shield Projection', 'Defensive Stance'],
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    type: 'Turret Unit',
    threat: 'High',
    description: 'Stationary defensive turrets with high accuracy',
    components: ['Sentinel Firing Core'],
    color: 'from-gray-500/30 to-slate-500/20',
    borderColor: 'border-gray-500/50',
    iconColor: 'text-gray-400',
    estimatedHP: '600-800',
    estimatedDamage: '35-55',
    abilities: ['Stationary', 'High Accuracy', 'Sustained Fire'],
  },
  {
    id: 'snitch',
    name: 'Snitch',
    type: 'Scanner Unit',
    threat: 'Low',
    description: 'Reconnaissance drones that alert nearby enemies',
    components: ['Snitch Scanner', 'Damaged Snitch Scanner'],
    color: 'from-cyan-500/30 to-teal-500/20',
    borderColor: 'border-cyan-500/50',
    iconColor: 'text-cyan-400',
    estimatedHP: '100-150',
    estimatedDamage: '5-10',
    abilities: ['Detection', 'Alert Signal', 'Evasion'],
  },
  {
    id: 'spotter',
    name: 'Spotter',
    type: 'Relay Unit',
    threat: 'Medium',
    description: 'Communication relay that coordinates enemy attacks',
    components: ['Spotter Relay'],
    color: 'from-indigo-500/30 to-blue-500/20',
    borderColor: 'border-indigo-500/50',
    iconColor: 'text-indigo-400',
    estimatedHP: '200-300',
    estimatedDamage: '10-20',
    abilities: ['Target Marking', 'Enemy Coordination', 'Buff Nearby Units'],
  },
  {
    id: 'rocketeer',
    name: 'Rocketeer',
    type: 'Missile Unit',
    threat: 'Very High',
    description: 'Advanced units with guided missile systems',
    components: ['Rocketeer Driver', 'Damaged Rocketeer Driver'],
    color: 'from-rose-500/30 to-red-500/20',
    borderColor: 'border-rose-500/50',
    iconColor: 'text-rose-400',
    estimatedHP: '400-600',
    estimatedDamage: '60-100',
    abilities: ['Guided Missiles', 'Lock-On', 'Burst Fire'],
  },
  {
    id: 'fireball',
    name: 'Fireball',
    type: 'Incendiary Unit',
    threat: 'High',
    description: 'Fire-based units that leave burning areas',
    components: ['Fireball Burner', 'Damaged Fireball Burner'],
    color: 'from-orange-500/30 to-amber-500/20',
    borderColor: 'border-orange-500/50',
    iconColor: 'text-orange-400',
    estimatedHP: '300-500',
    estimatedDamage: '25-45',
    abilities: ['Fire Damage', 'Area Denial', 'Burning Ground'],
  },
  {
    id: 'surveyor',
    name: 'Surveyor',
    type: 'Elite Unit',
    threat: 'Boss',
    description: 'Massive elite units that command entire sectors',
    components: ['Surveyor Vault'],
    color: 'from-yellow-500/30 to-orange-500/20',
    borderColor: 'border-yellow-500/50',
    iconColor: 'text-yellow-400',
    estimatedHP: '2000-3000',
    estimatedDamage: '80-120',
    abilities: ['Command', 'Multiple Phases', 'Summon Reinforcements'],
  },
  {
    id: 'matriarch',
    name: 'Matriarch',
    type: 'Boss Unit',
    threat: 'Boss',
    description: 'Powerful boss with multiple attack phases',
    components: ['Matriarch Reactor'],
    color: 'from-pink-500/30 to-rose-500/20',
    borderColor: 'border-pink-500/50',
    iconColor: 'text-pink-400',
    estimatedHP: '5000-7000',
    estimatedDamage: '100-150',
    abilities: ['Boss Fight', 'Phase Transitions', 'Enrage Mode'],
  },
  {
    id: 'queen',
    name: 'Queen',
    type: 'Boss Unit',
    threat: 'Boss',
    description: 'Ultimate boss encounter with devastating abilities',
    components: ['Queen Reactor'],
    color: 'from-purple-500/30 to-fuchsia-500/20',
    borderColor: 'border-purple-500/50',
    iconColor: 'text-purple-400',
    estimatedHP: '8000-10000',
    estimatedDamage: '120-180',
    abilities: ['Ultimate Boss', 'Multi-Phase Fight', 'Legendary Drops'],
  },
];

export default function Enemies() {
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [components, setComponents] = useState<EnemyComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThreat, setSelectedThreat] = useState<string>('all');
  const [selectedEnemy, setSelectedEnemy] = useState<string | null>(null);
  const [useRealData, setUseRealData] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Intentar cargar datos reales de la API
      try {
        const response = await fetch(`${API_URL}/enemies`);
        if (response.ok) {
          const realEnemies = await response.json();
          if (realEnemies.length > 0) {
            setEnemies(realEnemies);
            setUseRealData(true);
          }
        }
      } catch (apiError) {
        console.log('Using fallback data:', apiError);
      }

      // Cargar componentes de items
      const itemsResponse = await fetch(`${API_URL}/items`);
      const items = await itemsResponse.json();
      
      const enemyComponents = items.filter((item: EnemyComponent) =>
        item.name.includes('Cell') ||
        item.name.includes('Reactor') ||
        item.name.includes('Driver') ||
        item.name.includes('Pod') ||
        item.name.includes('Relay') ||
        item.name.includes('Scanner') ||
        item.name.includes('Vault') ||
        item.name.includes('Burner') ||
        item.name.includes('Core') ||
        item.name.includes('Pulse')
      );
      
      setComponents(enemyComponents);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getThreatColor = (threat: string) => {
    const colors: Record<string, string> = {
      'Low': 'text-green-400',
      'Medium': 'text-yellow-400',
      'High': 'text-orange-400',
      'Very High': 'text-red-400',
      'Boss': 'text-purple-400',
    };
    return colors[threat] || 'text-gray-400';
  };

  const getComponentsForEnemy = (enemyComponents: string[]) => {
    return components.filter(comp =>
      enemyComponents.some(name => comp.name.includes(name.split(' ')[0]))
    );
  };

  const filteredEnemies = ENEMY_TYPES.filter(enemy => {
    const matchesSearch = enemy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         enemy.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesThreat = selectedThreat === 'all' || enemy.threat === selectedThreat;
    return matchesSearch && matchesThreat;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400">Loading enemy database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            ARC Enemies Database
          </h1>
          <p className="text-gray-400 mt-1">
            Enemy types, threat levels, and component drops
          </p>
          <p className="text-xs text-yellow-500 mt-1">
            ⚠️ Note: Stats are estimated based on available data
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search enemies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#1a1f2e] border border-cyan-500/20 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50 w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button
          onClick={() => setSelectedThreat('all')}
          className={`p-4 rounded-lg border transition-all ${
            selectedThreat === 'all'
              ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border-cyan-500/50'
              : 'bg-[#1a1f2e]/50 border-gray-700/30 hover:border-cyan-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Target className={selectedThreat === 'all' ? 'text-cyan-400' : 'text-gray-500'} size={20} />
            <span className={`text-2xl font-bold ${selectedThreat === 'all' ? 'text-cyan-400' : 'text-gray-400'}`}>
              {ENEMY_TYPES.length}
            </span>
          </div>
          <p className={`text-sm ${selectedThreat === 'all' ? 'text-gray-200' : 'text-gray-400'}`}>
            All Units
          </p>
        </button>

        {['Low', 'Medium', 'High', 'Boss'].map((threat) => {
          const count = ENEMY_TYPES.filter(e => e.threat === threat || (threat === 'High' && e.threat === 'Very High')).length;
          const isActive = selectedThreat === threat;
          
          return (
            <button
              key={threat}
              onClick={() => setSelectedThreat(threat)}
              className={`p-4 rounded-lg border transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border-cyan-500/50'
                  : 'bg-[#1a1f2e]/50 border-gray-700/30 hover:border-cyan-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Skull className={isActive ? getThreatColor(threat) : 'text-gray-500'} size={20} />
                <span className={`text-2xl font-bold ${isActive ? getThreatColor(threat) : 'text-gray-400'}`}>
                  {count}
                </span>
              </div>
              <p className={`text-sm ${isActive ? 'text-gray-200' : 'text-gray-400'}`}>
                {threat}
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEnemies.map((enemy) => {
          const enemyComps = getComponentsForEnemy(enemy.components);
          const isExpanded = selectedEnemy === enemy.id;
          
          return (
            <div
              key={enemy.id}
              className={`bg-gradient-to-br ${enemy.color} border ${enemy.borderColor} rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer`}
              onClick={() => setSelectedEnemy(isExpanded ? null : enemy.id)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{enemy.name}</h3>
                    <p className="text-sm text-gray-300 mb-2">{enemy.type}</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getThreatColor(enemy.threat)} bg-black/30`}>
                      Threat: {enemy.threat}
                    </span>
                  </div>
                  <Target className={enemy.iconColor} size={32} />
                </div>

                <p className="text-sm text-gray-300 mb-4">{enemy.description}</p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-black/30 rounded-lg p-2">
                    <p className="text-xs text-gray-400">HP (Est.)</p>
                    <p className="text-sm font-bold text-green-400">{enemy.estimatedHP}</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2">
                    <p className="text-xs text-gray-400">Damage (Est.)</p>
                    <p className="text-sm font-bold text-red-400">{enemy.estimatedDamage}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-2">Abilities:</p>
                  <div className="flex flex-wrap gap-2">
                    {enemy.abilities.map((ability, idx) => (
                      <span key={idx} className="px-2 py-1 bg-black/30 rounded text-xs text-cyan-400">
                        {ability}
                      </span>
                    ))}
                  </div>
                </div>

                {enemyComps.length > 0 && (
                  <div className={`transition-all ${isExpanded ? '' : 'max-h-0 overflow-hidden'}`}>
                    <div className="border-t border-white/10 pt-4 mt-4">
                      <p className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <ShieldIcon size={16} className={enemy.iconColor} />
                        Component Drops
                      </p>
                      <div className="space-y-2">
                        {enemyComps.map((comp, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-black/30 rounded-lg p-2">
                            {comp.image_urls?.thumb ? (
                              <img
                                src={comp.image_urls.thumb}
                                alt={comp.name}
                                className="w-10 h-10 object-contain rounded bg-[#0a0e1a]"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-[#0a0e1a] rounded flex items-center justify-center">
                                <Zap className="text-gray-500" size={16} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{comp.name}</p>
                              <p className="text-xs text-gray-400">{comp.type}</p>
                            </div>
                            {comp.infobox?.sellprice && (
                              <span className="text-xs text-yellow-400 font-medium">
                                {comp.infobox.sellprice} 🌾
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-3 text-center">
                  {isExpanded ? '▲ Click to collapse' : '▼ Click for drops'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 p-4 bg-[#1a1f2e]/50 border border-cyan-500/20 rounded-lg">
        <div className="text-center">
          <p className="text-2xl font-bold text-cyan-400">{ENEMY_TYPES.length}</p>
          <p className="text-sm text-gray-400">Enemy Types</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">
            {ENEMY_TYPES.filter(e => e.threat === 'Low').length}
          </p>
          <p className="text-sm text-gray-400">Low Threat</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-400">
            {ENEMY_TYPES.filter(e => e.threat === 'High' || e.threat === 'Very High').length}
          </p>
          <p className="text-sm text-gray-400">High Threat</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-400">
            {ENEMY_TYPES.filter(e => e.threat === 'Boss').length}
          </p>
          <p className="text-sm text-gray-400">Boss Units</p>
        </div>
      </div>
    </div>
  );
}
