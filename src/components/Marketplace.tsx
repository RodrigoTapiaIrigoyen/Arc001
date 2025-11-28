import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MarketplaceListing } from '../types/database';
import { TrendingUp, TrendingDown, Minus, DollarSign } from 'lucide-react';

export default function Marketplace() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    const { data } = await supabase
      .from('marketplace_listings')
      .select('*')
      .order('volume_24h', { ascending: false })
      .limit(20);

    if (data) setListings(data);
    setLoading(false);
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="text-green-400" size={16} />;
    if (trend === 'down') return <TrendingDown className="text-red-400" size={16} />;
    return <Minus className="text-gray-400" size={16} />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-green-400';
    if (trend === 'down') return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Marketplace
        </h2>
        <p className="text-gray-500 text-sm">Real-time pricing and market trends</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <DollarSign className="text-cyan-400" size={20} />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">24h Volume</span>
          </div>
          <p className="text-2xl font-bold text-cyan-400">₡12.8M</p>
          <p className="text-xs text-green-400 mt-1">+18.4% from yesterday</p>
        </div>

        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp className="text-blue-400" size={20} />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Avg Price</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">₡4,250</p>
          <p className="text-xs text-red-400 mt-1">-2.1% from last week</p>
        </div>

        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingUp className="text-emerald-400" size={20} />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Total Listings</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">3,842</p>
          <p className="text-xs text-green-400 mt-1">+124 new today</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-cyan-500/10">
          <h3 className="font-bold">Active Listings</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading marketplace data...</div>
        ) : listings.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-2">No active listings</p>
            <p className="text-sm text-gray-600">Market data will appear here once populated</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-500/10">
                  <th className="text-left p-4 text-xs text-gray-500 uppercase tracking-wider font-medium">Item</th>
                  <th className="text-left p-4 text-xs text-gray-500 uppercase tracking-wider font-medium">Type</th>
                  <th className="text-right p-4 text-xs text-gray-500 uppercase tracking-wider font-medium">Price</th>
                  <th className="text-right p-4 text-xs text-gray-500 uppercase tracking-wider font-medium">24h Vol</th>
                  <th className="text-center p-4 text-xs text-gray-500 uppercase tracking-wider font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr
                    key={listing.id}
                    className="border-b border-cyan-500/5 hover:bg-cyan-500/5 transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <p className="font-medium">{listing.item_name}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-400 capitalize">{listing.item_type}</span>
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-bold text-cyan-400">₡{listing.current_price.toLocaleString()}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-sm text-gray-400">{listing.volume_24h.toLocaleString()}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {getTrendIcon(listing.trend)}
                        <span className={`text-sm font-medium ${getTrendColor(listing.trend)}`}>
                          {listing.trend === 'stable' ? 'Stable' : listing.trend === 'up' ? '+12%' : '-8%'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6">
          <h3 className="font-bold mb-4">Trending Up</h3>
          <div className="space-y-3">
            {['Plasma Cell Battery', 'Titanium Plating', 'Quantum Core'].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-[#0a0e1a] border border-green-500/20 rounded-lg">
                <span className="text-sm">{item}</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-green-400" size={14} />
                  <span className="text-sm font-bold text-green-400">+{15 + idx * 5}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6">
          <h3 className="font-bold mb-4">Trending Down</h3>
          <div className="space-y-3">
            {['Steel Scrap', 'Basic Ammo Pack', 'Standard Medkit'].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-[#0a0e1a] border border-red-500/20 rounded-lg">
                <span className="text-sm">{item}</span>
                <div className="flex items-center gap-2">
                  <TrendingDown className="text-red-400" size={14} />
                  <span className="text-sm font-bold text-red-400">-{8 + idx * 3}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
