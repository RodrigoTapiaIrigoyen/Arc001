import { useState, useEffect } from 'react';
import { 
  Trophy, Target, Plus, Check, X, Trash2, TrendingUp,
  Sword, Package, Users, ShoppingCart, ScrollText, Filter,
  BarChart3, Clock, CheckCircle2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api/trackers';

const categories = [
  { id: 'all', label: 'All', icon: BarChart3 },
  { id: 'weapons', label: 'Weapons', icon: Sword },
  { id: 'items', label: 'Items', icon: Package },
  { id: 'enemies', label: 'Enemies', icon: Target },
  { id: 'trading', label: 'Trading', icon: ShoppingCart },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'quests', label: 'Quests', icon: ScrollText },
  { id: 'custom', label: 'Custom', icon: Trophy },
];

const rarityColors: any = {
  legendary: 'from-orange-500 to-yellow-500',
  epic: 'from-purple-500 to-pink-500',
  rare: 'from-blue-500 to-cyan-500',
  uncommon: 'from-green-500 to-emerald-500',
  common: 'from-gray-500 to-gray-400',
};

export default function Trackers() {
  const [username, setUsername] = useState('Player1'); // Simulated user
  const [trackers, setTrackers] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [filterCompleted, setFilterCompleted] = useState<string>('all');
  
  // Modal states
  const [showNewTracker, setShowNewTracker] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [newTrackerTitle, setNewTrackerTitle] = useState('');
  const [newTrackerDescription, setNewTrackerDescription] = useState('');
  const [newTrackerCategory, setNewTrackerCategory] = useState('custom');
  const [newTrackerTarget, setNewTrackerTarget] = useState(10);

  useEffect(() => {
    loadData();
  }, [username, category, filterCompleted]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trackersRes, achievementsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/user/${username}?${category !== 'all' ? `category=${category}` : ''}${filterCompleted !== 'all' ? `&completed=${filterCompleted}` : ''}`),
        fetch(`${API_URL}/achievements`),
        fetch(`${API_URL}/user/${username}/stats`),
      ]);

      const trackersData = await trackersRes.json();
      const achievementsData = await achievementsRes.json();
      const statsData = await statsRes.json();

      setTrackers(trackersData.trackers || []);
      setAchievements(achievementsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading trackers:', error);
    }
    setLoading(false);
  };

  const createTracker = async () => {
    if (!newTrackerTitle || newTrackerTarget <= 0) return;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          title: newTrackerTitle,
          description: newTrackerDescription,
          category: newTrackerCategory,
          target_value: newTrackerTarget,
        }),
      });

      if (response.ok) {
        setShowNewTracker(false);
        setNewTrackerTitle('');
        setNewTrackerDescription('');
        setNewTrackerCategory('custom');
        setNewTrackerTarget(10);
        loadData();
      }
    } catch (error) {
      console.error('Error creating tracker:', error);
    }
  };

  const createFromAchievement = async (achievement: any) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          title: achievement.title,
          description: achievement.description,
          category: achievement.category,
          target_value: achievement.target_value,
          achievement_id: achievement.id,
        }),
      });

      if (response.ok) {
        setShowAchievements(false);
        loadData();
      }
    } catch (error) {
      console.error('Error creating tracker from achievement:', error);
    }
  };

  const updateProgress = async (trackerId: string, newProgress: number) => {
    try {
      await fetch(`${API_URL}/${trackerId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress, username }),
      });
      loadData();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const incrementProgress = async (trackerId: string, amount: number = 1) => {
    try {
      await fetch(`${API_URL}/${trackerId}/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, username }),
      });
      loadData();
    } catch (error) {
      console.error('Error incrementing progress:', error);
    }
  };

  const deleteTracker = async (trackerId: string) => {
    if (!confirm('Are you sure you want to delete this tracker?')) return;

    try {
      await fetch(`${API_URL}/${trackerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      loadData();
    } catch (error) {
      console.error('Error deleting tracker:', error);
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.icon : Trophy;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Progress Trackers
          </h2>
          <p className="text-gray-400 text-sm">Track your goals and achievements</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAchievements(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
          >
            <Trophy size={20} />
            Achievements
          </button>
          <button
            onClick={() => setShowNewTracker(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            New Tracker
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Target className="text-red-400" size={20} />
              </div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Total</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.total}</p>
            <p className="text-xs text-red-400">Trackers</p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="text-green-400" size={20} />
              </div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Completed</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.completed}</p>
            <p className="text-xs text-green-400">Goals reached</p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-orange-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="text-orange-400" size={20} />
              </div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">In Progress</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.inProgress}</p>
            <p className="text-xs text-orange-400">Active goals</p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <TrendingUp className="text-yellow-400" size={20} />
              </div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Completion</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.completionRate}%</p>
            <p className="text-xs text-yellow-400">Success rate</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="text-gray-500" size={20} />
        
        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                  category === cat.id
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                    : 'bg-[#1a1f2e]/50 border-gray-700/30 text-gray-400 hover:border-blue-500/30'
                }`}
              >
                <Icon size={16} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Completion filter */}
        <select
          value={filterCompleted}
          onChange={(e) => setFilterCompleted(e.target.value)}
          className="px-4 py-2 bg-[#1a1f2e] border border-gray-700/30 rounded-lg text-gray-300 focus:outline-none focus:border-green-500/50"
        >
          <option value="all">All Status</option>
          <option value="false">In Progress</option>
          <option value="true">Completed</option>
        </select>
      </div>

      {/* Trackers List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading trackers...</div>
        ) : trackers.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1f2e]/50 border border-gray-700/30 rounded-lg">
            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No trackers yet</p>
            <button
              onClick={() => setShowNewTracker(true)}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Create Your First Tracker
            </button>
          </div>
        ) : (
          trackers.map((tracker) => {
            const Icon = getCategoryIcon(tracker.category);
            const progressPercentage = tracker.progress_percentage || 0;
            const isCompleted = tracker.completed;

            return (
              <div
                key={tracker._id}
                className={`bg-gradient-to-br from-[#1a1f2e] to-[#0a0e1a] border rounded-xl p-6 transition-all ${
                  isCompleted ? 'border-green-500/30' : 'border-yellow-500/20 hover:border-yellow-500/40'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${isCompleted ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                      <Icon className={isCompleted ? 'text-green-400' : 'text-yellow-400'} size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-white">{tracker.title}</h3>
                        {isCompleted && (
                          <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400 flex items-center gap-1">
                            <Check size={14} />
                            Completed
                          </span>
                        )}
                      </div>
                      {tracker.description && (
                        <p className="text-gray-400 text-sm mb-2">{tracker.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-gray-500 uppercase tracking-wider">{tracker.category}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-yellow-400">
                          {tracker.current_progress} / {tracker.target_value}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteTracker(tracker._id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                    title="Delete tracker"
                  >
                    <Trash2 className="text-gray-500 group-hover:text-red-400" size={18} />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="h-3 bg-[#0a0e1a] rounded-full overflow-hidden border border-cyan-500/10">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">{progressPercentage}%</p>
                </div>

                {/* Action Buttons */}
                {!isCompleted && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => incrementProgress(tracker._id, 1)}
                      className="flex-1 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      +1
                    </button>
                    <button
                      onClick={() => incrementProgress(tracker._id, 5)}
                      className="flex-1 px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      +5
                    </button>
                    <button
                      onClick={() => {
                        const newProgress = prompt(`Current: ${tracker.current_progress}/${tracker.target_value}\nEnter new progress:`);
                        if (newProgress !== null) {
                          updateProgress(tracker._id, parseInt(newProgress) || 0);
                        }
                      }}
                      className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors"
                    >
                      Set
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Tracker Modal */}
      {showNewTracker && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-lg max-w-2xl w-full border border-cyan-500/30">
            <div className="flex items-center justify-between p-6 border-b border-cyan-500/20">
              <h2 className="text-2xl font-bold text-cyan-400">Create New Tracker</h2>
              <button
                onClick={() => setShowNewTracker(false)}
                className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
              >
                <X className="text-gray-400" size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={newTrackerTitle}
                  onChange={(e) => setNewTrackerTitle(e.target.value)}
                  placeholder="e.g., Collect 50 Legendary Weapons"
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={newTrackerDescription}
                  onChange={(e) => setNewTrackerDescription(e.target.value)}
                  placeholder="Optional details about your goal..."
                  rows={3}
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                  <select
                    value={newTrackerCategory}
                    onChange={(e) => setNewTrackerCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    {categories.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Value *</label>
                  <input
                    type="number"
                    value={newTrackerTarget}
                    onChange={(e) => setNewTrackerTarget(parseInt(e.target.value) || 0)}
                    min="1"
                    className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewTracker(false)}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createTracker}
                  disabled={!newTrackerTitle || newTrackerTarget <= 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Tracker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Modal */}
      {showAchievements && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-cyan-500/30">
            <div className="flex items-center justify-between p-6 border-b border-cyan-500/20 sticky top-0 bg-[#1a1f2e] z-10">
              <h2 className="text-2xl font-bold text-cyan-400">Predefined Achievements</h2>
              <button
                onClick={() => setShowAchievements(false)}
                className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
              >
                <X className="text-gray-400" size={24} />
              </button>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-4">
              {achievements.map((achievement) => {
                const Icon = getCategoryIcon(achievement.category);
                const gradient = rarityColors[achievement.rarity] || rarityColors.common;
                
                return (
                  <div
                    key={achievement.id}
                    className="bg-[#0a0e1a] border border-cyan-500/20 rounded-lg p-6 hover:border-cyan-500/40 transition-all"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`p-3 bg-gradient-to-br ${gradient} rounded-lg`}>
                        <Icon className="text-white" size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">{achievement.title}</h3>
                        <p className="text-sm text-gray-400 mb-2">{achievement.description}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs uppercase tracking-wider bg-gradient-to-r ${gradient} bg-clip-text text-transparent font-bold`}>
                            {achievement.rarity}
                          </span>
                          <span className="text-gray-600">•</span>
                          <span className="text-xs text-gray-500">{achievement.category}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => createFromAchievement(achievement)}
                      className="w-full px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Track This Achievement
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
