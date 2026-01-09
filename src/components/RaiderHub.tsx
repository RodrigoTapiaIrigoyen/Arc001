/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Trophy, Search, Filter, Users, Sword } from 'lucide-react';

interface RaiderProfile {
  _id: string;
  username: string;
  avatar?: string;
  raider_type: string;
  raider_emoji: string;
  raider_description: string;
  community_reputation: number;
  posts_shared: number;
  friends_count: number;
  days_in_community: number;
}

export default function RaiderHub() {
  const [raiders, setRaiders] = useState<RaiderProfile[]>([]);
  const [filteredRaiders, setFilteredRaiders] = useState<RaiderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('kills');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';

  useEffect(() => {
    fetchTopRaiders();
  }, [sortBy]);

  const fetchTopRaiders = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/raider-profiles/leaderboard/top?limit=50&sortBy=${sortBy}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) throw new Error('Error al cargar raiders');
      const data = await response.json();
      setRaiders(data.raiders || []);
      setFilteredRaiders(data.raiders || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = raiders;

    // Filtrar por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.raider_type === filterType);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.raider_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRaiders(filtered);
  }, [searchTerm, filterType, raiders]);

  const raiderTypes = Array.from(new Set(raiders.map(r => r.raider_type)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">Hub de Clanes & Raiders</h1>
          </div>
          <p className="text-slate-300 text-sm">Conoce a los mejores Raiders de Esperanza</p>
        </div>

        {/* Controles */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar Raider o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Tipo de Raider</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-400"
              >
                <option value="all">Todos los tipos</option>
                {raiderTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-400"
              >
                <option value="reputation">Más Reputación</option>
                <option value="posts">Más Posts</option>
                <option value="friends">Más Amigos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listado de Raiders */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-slate-700 border-t-yellow-400 rounded-full mx-auto"></div>
          </div>
        ) : filteredRaiders.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No se encontraron Raiders</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRaiders.map((raider, index) => (
              <div
                key={raider._id}
                className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 hover:border-yellow-400/50 rounded-lg p-4 transition group"
              >
                <div className="flex items-center gap-4">
                  {/* Ranking */}
                  <div className="text-center min-w-12">
                    {index < 3 ? (
                      <div className={`text-2xl font-bold ${
                        index === 0 ? 'text-yellow-400' :
                        index === 1 ? 'text-gray-400' :
                        'text-orange-400'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                    ) : (
                      <div className="text-slate-500 font-bold">#{index + 1}</div>
                    )}
                  </div>

                  {/* Avatar y Info */}
                  <img
                    src={raider.avatar || '/default-avatar.svg'}
                    alt={raider.username}
                    className="w-12 h-12 rounded-full object-cover border border-yellow-400/30"
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold">{raider.username}</h3>
                      <span className="text-2xl">{raider.raider_emoji}</span>
                    </div>
                    <p className="text-yellow-400 text-sm font-medium">{raider.raider_type}</p>
                    <p className="text-slate-400 text-xs">{raider.raider_description}</p>
                  </div>

                  {/* Estadísticas */}
                  <div className="hidden md:grid grid-cols-4 gap-4 text-center min-w-max">
                    <div>
                      <p className="text-slate-400 text-xs">Reputación</p>
                      <p className="text-yellow-400 font-bold">⭐ {raider.community_reputation}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Posts</p>
                      <p className="text-blue-400 font-bold">{raider.posts_shared}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Amigos</p>
                      <p className="text-green-400 font-bold">{raider.friends_count}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Tiempo</p>
                      <p className="text-purple-400 font-bold">{raider.days_in_community}d</p>
                    </div>
                  </div>

                  {/* Reputación */}
                  <div className="text-center">
                    <p className="text-slate-400 text-xs">Reputación</p>
                    <p className={`font-bold text-sm ${
                      raider.community_reputation > 100 ? 'text-yellow-400' :
                      raider.community_reputation > 50 ? 'text-blue-400' :
                      'text-slate-400'
                    }`}>
                      ⭐ {raider.community_reputation}
                    </p>
                  </div>
                </div>

                {/* Estadísticas Mobile */}
                <div className="md:hidden mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-slate-700/50 p-2 rounded">
                    <p className="text-slate-400">Reputación</p>
                    <p className="text-yellow-400 font-bold">⭐{raider.community_reputation}</p>
                  </div>
                  <div className="bg-slate-700/50 p-2 rounded">
                    <p className="text-slate-400">Posts</p>
                    <p className="text-blue-400 font-bold">{raider.posts_shared}</p>
                  </div>
                  <div className="bg-slate-700/50 p-2 rounded">
                    <p className="text-slate-400">Amigos</p>
                    <p className="text-green-400 font-bold">{raider.friends_count}</p>
                  </div>
                  <div className="bg-slate-700/50 p-2 rounded">
                    <p className="text-slate-400">Días</p>
                    <p className="text-purple-400 font-bold">{raider.days_in_community}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
