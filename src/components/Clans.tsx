/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Shield, Plus, Users, Trophy, Search, X, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface ClanProfile {
  _id: string;
  name: string;
  tag: string;
  logo?: string;
  type: string;
  description: string;
  level: number;
  experience: number;
  members: any[];
  leader_id: string;
  visibility: string;
  founded_at: string;
  stats: {
    total_raids: number;
    total_wins: number;
    average_rating: number;
  };
}

export default function Clans() {
  const [clans, setClans] = useState<ClanProfile[]>([]);
  const [userClans, setUserClans] = useState<ClanProfile[]>([]);
  const [filteredClans, setFilteredClans] = useState<ClanProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('level');
  const [selectedClan, setSelectedClan] = useState<ClanProfile | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'explore' | 'my-clans'>('explore');
  
  // Form para crear clan
  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    description: '',
    type: 'Casual',
    visibility: 'public',
    max_members: 50
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
  const clanTypes = ['Casual', 'PvE', 'PvP', 'Competitive', 'Roleplay'];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    fetchClans();
    if (user.userId) {
      fetchUserClans(user.userId);
    }
  }, [sortBy]);

  const fetchClans = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/clans/leaderboard/top?limit=50&sortBy=${sortBy}`
      );

      if (!response.ok) throw new Error('Error al cargar clanes');
      const data = await response.json();
      setClans(data.clans || []);
      setFilteredClans(data.clans || []);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error al cargar clanes');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserClans = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/clans/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserClans(data.clans || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  useEffect(() => {
    let filtered = clans;

    if (filterType !== 'all') {
      filtered = filtered.filter(c => c.type === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClans(filtered);
  }, [searchTerm, filterType, clans]);

  const createClan = async () => {
    if (!formData.name || !formData.tag) {
      toast.error('Nombre y etiqueta requeridos');
      return;
    }

    try {
      const response = await api.post('/clans/create', formData);
      toast.success('Clan creado exitosamente');
      setShowCreateModal(false);
      setFormData({ name: '', tag: '', description: '', type: 'Casual', visibility: 'public', max_members: 50 });
      fetchClans();
      if (currentUser?.userId) {
        fetchUserClans(currentUser.userId);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear clan');
    }
  };

  const requestToJoinClan = async (clanId: string) => {
    try {
      await api.post(`/clans/${clanId}/request`);
      toast.success('Solicitud enviada al clan');
      setSelectedClan(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al solicitar ingreso');
    }
  };

  const leaveClan = async (clanId: string) => {
    if (!confirm('¿Estás seguro de que quieres abandonar el clan?')) return;

    try {
      await api.post(`/clans/${clanId}/leave`);
      toast.success('Has abandonado el clan');
      if (currentUser?.userId) {
        fetchUserClans(currentUser.userId);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al abandonar clan');
    }
  };

  const clanTypes_list = Array.from(new Set(clans.map(c => c.type)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-500" />
              <h1 className="text-3xl font-bold text-white">Sistema de Clanes</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg flex items-center gap-2 transition"
            >
              <Plus size={18} />
              Crear Clan
            </button>
          </div>
          <p className="text-slate-300 text-sm">Únete a un clan o crea uno propio para formar equipos</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-2 font-bold transition ${
              activeTab === 'explore'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Explorar Clanes
          </button>
          <button
            onClick={() => setActiveTab('my-clans')}
            className={`px-4 py-2 font-bold transition ${
              activeTab === 'my-clans'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Mis Clanes ({userClans.length})
          </button>
        </div>

        {activeTab === 'explore' && (
          <>
            {/* Controles */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar clan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-red-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Tipo de Clan</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-400"
                  >
                    <option value="all">Todos los tipos</option>
                    {clanTypes_list.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Ordenar por</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-400"
                  >
                    <option value="level">Nivel</option>
                    <option value="members">Miembros</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Listado de Clanes */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-slate-700 border-t-red-500 rounded-full mx-auto"></div>
              </div>
            ) : filteredClans.length === 0 ? (
              <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
                <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No se encontraron clanes</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClans.map((clan) => (
                  <div
                    key={clan._id}
                    className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-red-500/50 rounded-lg p-4 transition cursor-pointer group"
                    onClick={() => setSelectedClan(clan)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition">
                            {clan.tag}
                          </h3>
                          <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                            {clan.type}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm">{clan.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-400 font-bold text-lg">Lv. {clan.level}</p>
                        <p className="text-slate-400 text-xs">⭐ {clan.experience} XP</p>
                      </div>
                    </div>

                    <p className="text-slate-300 text-sm mb-3 line-clamp-2">{clan.description}</p>

                    <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs">
                      <div className="bg-slate-700/50 p-2 rounded">
                        <p className="text-slate-400">Miembros</p>
                        <p className="text-blue-400 font-bold">{clan.members.length}/{clan.level * 10}</p>
                      </div>
                      <div className="bg-slate-700/50 p-2 rounded">
                        <p className="text-slate-400">Raids</p>
                        <p className="text-green-400 font-bold">{clan.stats.total_raids}</p>
                      </div>
                      <div className="bg-slate-700/50 p-2 rounded">
                        <p className="text-slate-400">Rating</p>
                        <p className="text-orange-400 font-bold">{clan.stats.average_rating.toFixed(1)}</p>
                      </div>
                    </div>

                    <p className="text-slate-500 text-xs mb-3">
                      Fundado hace {Math.floor((Date.now() - new Date(clan.founded_at).getTime()) / (1000 * 60 * 60 * 24))} días
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'my-clans' && (
          <div className="space-y-4">
            {userClans.length === 0 ? (
              <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
                <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-4">Aún no eres miembro de ningún clan</p>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition"
                >
                  Explorar Clanes
                </button>
              </div>
            ) : (
              userClans.map((clan) => (
                <div
                  key={clan._id}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-red-500/50 transition"
                  onClick={() => setSelectedClan(clan)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">[{clan.tag}] {clan.name}</h3>
                        {clan.leader_id === currentUser?.userId && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                            LÍDER
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm">{clan.description}</p>
                    </div>
                    <div className="text-right min-w-max ml-4">
                      <p className="text-red-400 font-bold text-lg">Lv. {clan.level}</p>
                      <p className="text-slate-400 text-xs">{clan.members.length} miembros</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal de Clan Detallado */}
        {selectedClan && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-red-900 to-slate-900 p-6 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">[{selectedClan.tag}] {selectedClan.name}</h2>
                  <p className="text-slate-300">{selectedClan.description}</p>
                </div>
                <button
                  onClick={() => setSelectedClan(null)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-slate-800 p-4 rounded-lg text-center">
                    <p className="text-slate-400 text-xs mb-1">Nivel</p>
                    <p className="text-red-400 font-bold text-lg">{selectedClan.level}</p>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg text-center">
                    <p className="text-slate-400 text-xs mb-1">Miembros</p>
                    <p className="text-blue-400 font-bold">{selectedClan.members.length}</p>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg text-center">
                    <p className="text-slate-400 text-xs mb-1">Tipo</p>
                    <p className="text-yellow-400 font-bold text-xs">{selectedClan.type}</p>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg text-center">
                    <p className="text-slate-400 text-xs mb-1">Raid Win %</p>
                    <p className="text-green-400 font-bold">{selectedClan.stats.average_rating.toFixed(0)}%</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Users size={18} className="text-red-400" />
                    Miembros ({selectedClan.members.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedClan.members.map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-800 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <img
                            src={member.avatar || '/default-avatar.svg'}
                            alt={member.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-white text-sm font-bold">{member.username}</p>
                            <p className="text-slate-400 text-xs capitalize">{member.role}</p>
                          </div>
                        </div>
                        <p className="text-yellow-400 text-sm font-bold">{member.contribution_points} pts</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex gap-3">
                  {userClans.find(c => c._id === selectedClan._id) ? (
                    <>
                      {selectedClan.leader_id === currentUser?.userId ? (
                        <button
                          onClick={() => {
                            toast.success('Panel de administración del clan en desarrollo');
                            setSelectedClan(null);
                          }}
                          className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition"
                        >
                          Administrar
                        </button>
                      ) : null}
                      <button
                        onClick={() => {
                          leaveClan(selectedClan._id);
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
                      >
                        Abandonar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        requestToJoinClan(selectedClan._id);
                      }}
                      className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition"
                    >
                      Solicitar Ingreso
                    </button>
                  )}
                  <button
                    onClick={() => toast.success('Chat del clan en desarrollo')}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg flex items-center gap-2 transition"
                  >
                    <MessageSquare size={16} />
                    Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Crear Clan */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full">
              <div className="bg-red-900 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Crear Clan</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-red-800 rounded-lg transition"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-white font-bold mb-2">Nombre del Clan</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Guerreros del Apocalipsis"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-400"
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">Etiqueta (1-6 caracteres)</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value.toUpperCase().slice(0, 6) })}
                    placeholder="Ej: GUERRA"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-400"
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe tu clan..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-400 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white font-bold mb-2 text-sm">Tipo</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-400 text-sm"
                    >
                      {clanTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-bold mb-2 text-sm">Visibilidad</label>
                    <select
                      value={formData.visibility}
                      onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-400 text-sm"
                    >
                      <option value="public">Público</option>
                      <option value="friends_only">Solo Amigos</option>
                      <option value="private">Privado</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createClan}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition"
                  >
                    Crear Clan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
