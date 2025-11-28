import { useState } from 'react';
import { CheckCircle2, Circle, Trophy, Target, Sword, Book } from 'lucide-react';

export default function Trackers() {
  const [activeTracker, setActiveTracker] = useState<'quests' | 'weapons' | 'recipes'>('quests');

  const questsData = [
    { id: 1, name: 'Establish Forward Base', progress: 3, total: 5, status: 'in_progress', type: 'Main' },
    { id: 2, name: 'Secure Northern Perimeter', progress: 2, total: 3, status: 'in_progress', type: 'Main' },
    { id: 3, name: 'Collect ARC Data Samples', progress: 5, total: 5, status: 'completed', type: 'Side' },
    { id: 4, name: 'Raid Elite Command Center', progress: 0, total: 1, status: 'locked', type: 'Raid' },
  ];

  const weaponsData = [
    { name: 'X-70 Plasma Rifle', rarity: 'Legendary', owned: true, color: '#F59E0B' },
    { name: 'Tactical SMG-9', rarity: 'Epic', owned: true, color: '#A855F7' },
    { name: 'Arc Devastator', rarity: 'Legendary', owned: false, color: '#F59E0B' },
    { name: 'Quantum Sniper', rarity: 'Epic', owned: true, color: '#A855F7' },
  ];

  const recipesData = [
    { name: 'Plasma Cell Battery', category: 'Energy', unlocked: true, materials: 3 },
    { name: 'Reinforced Plating', category: 'Armor', unlocked: true, materials: 4 },
    { name: 'Advanced Medkit', category: 'Consumable', unlocked: false, materials: 5 },
    { name: 'EMP Grenade', category: 'Tactical', unlocked: true, materials: 3 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Personal Trackers
        </h2>
        <p className="text-gray-500 text-sm">Track your progression and collection</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Target className="text-cyan-400" size={20} />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Quests</span>
          </div>
          <p className="text-2xl font-bold mb-1">12 / 28</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-[#0a0e1a] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: '43%' }}></div>
            </div>
            <span className="text-xs text-cyan-400 font-medium">43%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Sword className="text-blue-400" size={20} />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Weapons</span>
          </div>
          <p className="text-2xl font-bold mb-1">47 / 247</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-[#0a0e1a] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: '19%' }}></div>
            </div>
            <span className="text-xs text-blue-400 font-medium">19%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Book className="text-emerald-400" size={20} />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Recipes</span>
          </div>
          <p className="text-2xl font-bold mb-1">34 / 156</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-[#0a0e1a] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500" style={{ width: '22%' }}></div>
            </div>
            <span className="text-xs text-emerald-400 font-medium">22%</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl overflow-hidden">
        <div className="flex border-b border-cyan-500/10">
          <button
            onClick={() => setActiveTracker('quests')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTracker === 'quests'
                ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Quest Tracker
          </button>
          <button
            onClick={() => setActiveTracker('weapons')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTracker === 'weapons'
                ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Weapons Collection
          </button>
          <button
            onClick={() => setActiveTracker('recipes')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTracker === 'recipes'
                ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Crafting Recipes
          </button>
        </div>

        <div className="p-6">
          {activeTracker === 'quests' && (
            <div className="space-y-3">
              {questsData.map((quest) => (
                <div
                  key={quest.id}
                  className="bg-[#0a0e1a] border border-cyan-500/10 rounded-lg p-4 hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {quest.status === 'completed' ? (
                        <CheckCircle2 className="text-green-400" size={20} />
                      ) : quest.status === 'locked' ? (
                        <Circle className="text-gray-600" size={20} />
                      ) : (
                        <Circle className="text-cyan-400" size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-medium mb-1">{quest.name}</h4>
                          <span className="text-xs text-gray-500 uppercase tracking-wider">{quest.type} Quest</span>
                        </div>
                        {quest.status !== 'locked' && (
                          <span className="text-sm font-medium text-cyan-400">
                            {quest.progress}/{quest.total}
                          </span>
                        )}
                      </div>
                      {quest.status === 'in_progress' && (
                        <div className="h-1.5 bg-[#1a1f2e] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                          ></div>
                        </div>
                      )}
                      {quest.status === 'completed' && (
                        <p className="text-xs text-green-400">Quest Completed</p>
                      )}
                      {quest.status === 'locked' && (
                        <p className="text-xs text-gray-600">Complete previous quests to unlock</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTracker === 'weapons' && (
            <div className="grid md:grid-cols-2 gap-3">
              {weaponsData.map((weapon, idx) => (
                <div
                  key={idx}
                  className={`bg-[#0a0e1a] border rounded-lg p-4 ${
                    weapon.owned
                      ? 'border-cyan-500/20 hover:border-cyan-500/40'
                      : 'border-gray-800 opacity-50'
                  } transition-all`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {weapon.owned ? (
                        <CheckCircle2 className="text-cyan-400" size={20} />
                      ) : (
                        <Circle className="text-gray-600" size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium mb-1">{weapon.name}</h4>
                      <span className="text-xs uppercase tracking-wider" style={{ color: weapon.color }}>
                        {weapon.rarity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTracker === 'recipes' && (
            <div className="space-y-3">
              {recipesData.map((recipe, idx) => (
                <div
                  key={idx}
                  className={`bg-[#0a0e1a] border rounded-lg p-4 ${
                    recipe.unlocked
                      ? 'border-cyan-500/20 hover:border-cyan-500/40'
                      : 'border-gray-800 opacity-50'
                  } transition-all`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {recipe.unlocked ? (
                        <CheckCircle2 className="text-green-400" size={20} />
                      ) : (
                        <Circle className="text-gray-600" size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{recipe.name}</h4>
                        <span className="text-xs text-gray-500">{recipe.materials} materials</span>
                      </div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider">{recipe.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
            <Trophy className="text-cyan-400" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Achievement Progress</h3>
            <p className="text-sm text-gray-500">Complete challenges to earn rewards</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 bg-[#0a0e1a] border border-cyan-500/10 rounded-lg">
            <p className="text-sm mb-2">Arsenal Master</p>
            <p className="text-xs text-gray-500 mb-2">Collect 100 unique weapons</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-[#1a1f2e] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: '47%' }}></div>
              </div>
              <span className="text-xs text-cyan-400">47/100</span>
            </div>
          </div>

          <div className="p-4 bg-[#0a0e1a] border border-cyan-500/10 rounded-lg">
            <p className="text-sm mb-2">Quest Seeker</p>
            <p className="text-xs text-gray-500 mb-2">Complete 50 quests</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-[#1a1f2e] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500" style={{ width: '24%' }}></div>
              </div>
              <span className="text-xs text-emerald-400">12/50</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
