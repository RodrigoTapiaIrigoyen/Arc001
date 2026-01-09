/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Trophy, Search, Filter, Users, Sword, X, UserPlus, MessageSquare, Users2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface RaiderProfile {
  _id: string;
  user_id: string;
  username: string;
  avatar?: string;
  raider_type: string;
  raider_emoji: string;
  raider_description: string;
  community_reputation: number;
  posts_shared: number;
  friends_count: number;
  days_in_community: number;
  equipment?: string;
  strategy?: string;
  company?: string;
  preferred_weapons?: string[];
  playstyle_notes?: string;
}

export default function RaiderHub() {
  // v3.0.1 - Clean rebuild
  const [raiders, setRaiders] = useState<RaiderProfile[]>([]);
  const [filteredRaiders, setFilteredRaiders] = useState<RaiderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('community_reputation');
  const [selectedRaider, setSelectedRaider] = useState<RaiderProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    fetchTopRaiders();
  }, [sortBy]);

  const sendMessage = async (targetUserId: string, targetUsername?: string) => {
    try {
      if (!targetUserId) {
        toast.error('ID de usuario inválido');
        return;
      }
      const username = targetUsername || selectedRaider?.username || 'usuario';
      const payload = { receiverId: targetUserId, content: `Hola ${username}, me gustaría conectar contigo` };
      await api.post('/messages', payload);
      toast.success('Mensaje enviado');
      setSelectedRaider(null);
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar mensaje');
    }
  };

  const inviteToGroup = async (targetUserId: string, targetUsername?: string) => {
    try {
      if (!targetUserId) {
        toast.error('ID de usuario inválido');
        return;
      }
      const username = targetUsername || selectedRaider?.username || 'usuario';
      const payload = { receiverId: targetUserId, content: `¡Hola ${username}! Te invito a unirte a mi grupo. Habla conmigo para más detalles. 👥` };
      await api.post('/messages', payload);
      toast.success('Invitación enviada');
      setSelectedRaider(null);
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar invitación');
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    try {
      if (!targetUserId) {
        toast.error('ID de usuario inválido');
        return;
      }
      await api.post(`/friends/request/${targetUserId}`, {});
      toast.success('Solicitud de amistad enviada');
      setSelectedRaider(null);
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar solicitud');
    }
  };

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
                key={raider.user_id}
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

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedRaider(raider)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition group/btn"
                      title="Ver perfil"
                    >
                      <Eye size={16} className="text-blue-400" />
                    </button>
                    {currentUser?.userId !== raider.user_id && (
                      <>
                        <button
                          onClick={() => sendFriendRequest(raider.user_id)}
                          className="p-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg transition group/btn"
                          title="Enviar solicitud de amistad"
                        >
                          <UserPlus size={16} className="text-green-400" />
                        </button>
                        <button
                          onClick={() => sendMessage(raider.user_id, raider.username)}
                          className="p-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition group/btn"
                          title="Enviar mensaje"
                        >
                          <MessageSquare size={16} className="text-purple-400" />
                        </button>
                        <button
                          onClick={() => inviteToGroup(raider.user_id, raider.username)}
                          className="p-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg transition group/btn"
                          title="Invitar a grupo"
                        >
                          <Users2 size={16} className="text-orange-400" />
                        </button>
                      </>
                    )}
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
        {/* Modal de Perfil Detallado */}
        {selectedRaider && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedRaider.avatar || '/default-avatar.svg'}
                    alt={selectedRaider.username}
                    className="w-16 h-16 rounded-full object-cover border border-yellow-400"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedRaider.username}</h2>
                    <p className="text-yellow-400 text-lg">{selectedRaider.raider_emoji} {selectedRaider.raider_type}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRaider(null)}
                  className="p-2 hover:bg-slate-600 rounded-lg transition"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>

              {/* Contenido */}
              <div className="p-6 space-y-6">
                {/* Descripción */}
                <div>
                  <h3 className="text-white font-bold mb-2">Descripción del Playstyle</h3>
                  <p className="text-slate-300 text-sm">{selectedRaider.raider_description || 'Sin descripción'}</p>
                </div>

                {/* Estilo de Juego */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <p className="text-slate-400 text-xs mb-1">Equipo</p>
                    <p className="text-white font-bold capitalize">{selectedRaider.equipment || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <p className="text-slate-400 text-xs mb-1">Estrategia</p>
                    <p className="text-white font-bold capitalize">{selectedRaider.strategy || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <p className="text-slate-400 text-xs mb-1">Compañía</p>
                    <p className="text-white font-bold capitalize">{selectedRaider.company || 'N/A'}</p>
                  </div>
                </div>

                {/* Armas Preferidas */}
                {selectedRaider.preferred_weapons && selectedRaider.preferred_weapons.length > 0 && (
                  <div>
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                      <Sword size={16} className="text-yellow-400" />
                      Armas Preferidas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRaider.preferred_weapons.map((weapon, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-sm"
                        >
                          {weapon}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notas de Playstyle */}
                {selectedRaider.playstyle_notes && (
                  <div>
                    <h3 className="text-white font-bold mb-2">Notas de Playstyle</h3>
                    <p className="text-slate-300 text-sm italic">{selectedRaider.playstyle_notes}</p>
                  </div>
                )}

                {/* Estadísticas Completas */}
                <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
                  <h3 className="text-white font-bold mb-4">Estadísticas Comunitarias</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-slate-400 text-xs mb-1">Reputación</p>
                      <p className="text-yellow-400 font-bold text-lg">⭐ {selectedRaider.community_reputation}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400 text-xs mb-1">Posts Compartidos</p>
                      <p className="text-blue-400 font-bold text-lg">💬 {selectedRaider.posts_shared}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400 text-xs mb-1">Amigos</p>
                      <p className="text-green-400 font-bold text-lg">👫 {selectedRaider.friends_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400 text-xs mb-1">En la Comunidad</p>
                      <p className="text-purple-400 font-bold text-lg">📅 {selectedRaider.days_in_community} días</p>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                {currentUser?.userId !== selectedRaider.user_id && (
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        sendFriendRequest(selectedRaider.user_id);
                        setSelectedRaider(null);
                      }}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition"
                    >
                      <UserPlus size={16} />
                      Agregar Amigo
                    </button>
                    <button
                      onClick={() => {
                        sendMessage(selectedRaider.user_id);
                      }}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition"
                    >
                      <MessageSquare size={16} />
                      Mensajear
                    </button>
                    <button
                      onClick={() => inviteToGroup(selectedRaider.user_id)}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition"
                    >
                      <Users2 size={16} />
                      Invitar Grupo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}      </div>
    </div>
  );
}
