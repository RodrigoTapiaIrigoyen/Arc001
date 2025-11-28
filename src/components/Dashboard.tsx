import { TrendingUp, Users, Activity, Database } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { label: 'Total Weapons', value: '247', change: '+12', icon: Database, color: 'cyan' },
    { label: 'Active Raiders', value: '15.2K', change: '+8.3%', icon: Users, color: 'blue' },
    { label: 'Market Volume', value: '₡2.4M', change: '+15%', icon: TrendingUp, color: 'emerald' },
    { label: 'Active Raids', value: '1,842', change: '+23', icon: Activity, color: 'violet' },
  ];

  const recentUpdates = [
    {
      type: 'Weapon Balance',
      title: 'X-70 Plasma Rifle damage increased by 8%',
      time: '2h ago',
      category: 'balance'
    },
    {
      type: 'New Content',
      title: 'Northern Wasteland map expansion released',
      time: '5h ago',
      category: 'content'
    },
    {
      type: 'Enemy Update',
      title: 'Titan-class ARC units now spawn in Raid zones',
      time: '8h ago',
      category: 'enemy'
    },
    {
      type: 'Marketplace',
      title: 'Legendary armor prices surge 45% this week',
      time: '12h ago',
      category: 'market'
    },
  ];

  const topWeapons = [
    { name: 'X-70 Plasma Rifle', usage: 87, rarity: 'Legendary', color: '#F59E0B' },
    { name: 'Tactical SMG-9', usage: 72, rarity: 'Epic', color: '#A855F7' },
    { name: 'Hardpoint Sniper', usage: 65, rarity: 'Rare', color: '#3B82F6' },
    { name: 'Arc Disruption Canon', usage: 58, rarity: 'Legendary', color: '#F59E0B' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Mission Control
        </h2>
        <p className="text-gray-500 text-sm">Real-time tactical intelligence and community insights</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-500/40 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 bg-${stat.color}-500/10 rounded-lg group-hover:bg-${stat.color}-500/20 transition-colors`}>
                  <Icon className={`text-${stat.color}-400`} size={20} />
                </div>
                <span className="text-xs text-green-400 font-medium bg-green-400/10 px-2 py-1 rounded">
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold mb-1">{stat.value}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Recent Updates</h3>
            <span className="text-xs text-cyan-400 uppercase tracking-wider">Live Feed</span>
          </div>
          <div className="space-y-4">
            {recentUpdates.map((update, idx) => (
              <div
                key={idx}
                className="flex gap-4 p-4 bg-[#0a0e1a] border border-cyan-500/10 rounded-lg hover:border-cyan-500/30 transition-colors group"
              >
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 mt-2 rounded-full ${
                    update.category === 'balance' ? 'bg-yellow-400' :
                    update.category === 'content' ? 'bg-cyan-400' :
                    update.category === 'enemy' ? 'bg-red-400' :
                    'bg-blue-400'
                  }`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{update.type}</p>
                      <p className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors">{update.title}</p>
                    </div>
                    <span className="text-xs text-gray-600 whitespace-nowrap">{update.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Meta Weapons</h3>
            <span className="text-xs text-cyan-400 uppercase tracking-wider">This Week</span>
          </div>
          <div className="space-y-4">
            {topWeapons.map((weapon, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-600">#{idx + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{weapon.name}</p>
                      <p className="text-xs" style={{ color: weapon.color }}>{weapon.rarity}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-cyan-400">{weapon.usage}%</span>
                </div>
                <div className="h-1.5 bg-[#0a0e1a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                    style={{ width: `${weapon.usage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">TACTICAL TIP</p>
            <p className="text-sm text-gray-300">Plasma weapons are currently dominating in high-tier raids. Consider equipping EMP shields for defense.</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Community Activity</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#0a0e1a] border border-cyan-500/10 rounded-lg text-center">
            <p className="text-2xl font-bold text-cyan-400 mb-1">1,247</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Guides Published</p>
          </div>
          <div className="p-4 bg-[#0a0e1a] border border-cyan-500/10 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-400 mb-1">8,392</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Builds Shared</p>
          </div>
          <div className="p-4 bg-[#0a0e1a] border border-cyan-500/10 rounded-lg text-center">
            <p className="text-2xl font-bold text-emerald-400 mb-1">24.5K</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Active Members</p>
          </div>
        </div>
      </div>
    </div>
  );
}
