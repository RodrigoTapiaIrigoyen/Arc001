import { ThumbsUp, MessageSquare, Users, TrendingUp, Star } from 'lucide-react';

export default function CommunityHub() {
  const guides = [
    {
      title: 'Ultimate Beginner\'s Guide to ARC Raiders',
      author: 'TacticalGamer',
      upvotes: 342,
      comments: 45,
      views: 2847,
      tags: ['Beginner', 'Guide', 'Tips'],
    },
    {
      title: 'Best Weapon Builds for High-Tier Raids',
      author: 'ProRaider',
      upvotes: 289,
      comments: 67,
      views: 3124,
      tags: ['Builds', 'Weapons', 'Advanced'],
    },
    {
      title: 'Complete Map Guide: Northern Wasteland',
      author: 'MapExplorer',
      upvotes: 215,
      comments: 32,
      views: 1956,
      tags: ['Maps', 'Locations', 'Guide'],
    },
    {
      title: 'Meta Loadouts Season 3 Analysis',
      author: 'DataHunter',
      upvotes: 178,
      comments: 41,
      views: 1432,
      tags: ['Meta', 'Analysis', 'Loadouts'],
    },
  ];

  const topContributors = [
    { name: 'TacticalGamer', contributions: 47, reputation: 2840 },
    { name: 'ProRaider', contributions: 38, reputation: 2156 },
    { name: 'MapExplorer', contributions: 32, reputation: 1987 },
    { name: 'DataHunter', contributions: 28, reputation: 1654 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Community Hub
        </h2>
        <p className="text-gray-500 text-sm">Guides, builds, and community contributions</p>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-cyan-400" size={20} />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Members</span>
          </div>
          <p className="text-2xl font-bold">24.5K</p>
        </div>

        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="text-blue-400" size={20} />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Guides</span>
          </div>
          <p className="text-2xl font-bold">1,247</p>
        </div>

        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-emerald-400" size={20} />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Builds</span>
          </div>
          <p className="text-2xl font-bold">8,392</p>
        </div>

        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Star className="text-yellow-400" size={20} />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Reviews</span>
          </div>
          <p className="text-2xl font-bold">15.2K</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Top Guides</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-400 hover:bg-cyan-500/20 transition-colors">
                  Most Popular
                </button>
                <button className="px-3 py-1.5 bg-[#0a0e1a] border border-cyan-500/10 rounded-lg text-xs text-gray-400 hover:text-gray-200 transition-colors">
                  Recent
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {guides.map((guide, idx) => (
                <div
                  key={idx}
                  className="bg-[#0a0e1a] border border-cyan-500/10 rounded-lg p-5 hover:border-cyan-500/30 transition-all cursor-pointer group"
                >
                  <h4 className="font-medium mb-3 group-hover:text-cyan-400 transition-colors">{guide.title}</h4>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {guide.tags.map((tag, tagIdx) => (
                      <span
                        key={tagIdx}
                        className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-xs text-cyan-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span className="text-gray-500">by {guide.author}</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <ThumbsUp size={14} />
                        <span>{guide.upvotes}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageSquare size={14} />
                        <span>{guide.comments}</span>
                      </div>
                      <span className="text-gray-600">{guide.views.toLocaleString()} views</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6">
            <h3 className="font-bold mb-4">Top Contributors</h3>
            <div className="space-y-4">
              {topContributors.map((contributor, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{contributor.name}</p>
                    <p className="text-xs text-gray-500">{contributor.contributions} contributions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-cyan-400">{contributor.reputation}</p>
                    <p className="text-xs text-gray-600">rep</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6">
            <h3 className="font-bold mb-3 text-cyan-400">Share Your Knowledge</h3>
            <p className="text-sm text-gray-400 mb-4">
              Create guides, share builds, and help the community grow. Earn reputation and unlock exclusive badges.
            </p>
            <button className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-medium text-sm hover:from-cyan-600 hover:to-blue-600 transition-all">
              Create Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
