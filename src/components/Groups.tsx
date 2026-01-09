/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Users, Search, Plus, Eye, UserPlus, Globe, BarChart3, ArrowLeft } from 'lucide-react';
import GroupChat from './GroupChat';
import GroupLeaderPanel from './GroupLeaderPanel';

export default function Groups() {
  const [groups, setGroups] = useState<any[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('browse'); // browse, my-groups, create
  const [sortBy, setSortBy] = useState('popular');
  const [filterType, setFilterType] = useState('all');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupData, setNewGroupData] = useState<any>({
    title: '',
    description: '',
    type: 'clan',
    tags: [],
    max_members: 50,
    visibility: 'public',
    language: 'es'
  });
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroupData, setSelectedGroupData] = useState<any>(null);
  
  // API URL configurada desde env
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';

  // Obtener usuario actual del localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  // Cargar grupos disponibles
  useEffect(() => {
    if (selectedTab === 'browse') {
      fetchGroups();
    } else if (selectedTab === 'my-groups') {
      fetchMyGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        sort_by: sortBy,
        page: '1',
        limit: '20'
      });

      if (filterType !== 'all') params.append('type', filterType);
      if (filterLanguage !== 'all') params.append('language', filterLanguage);

      const response = await fetch(`${API_URL}/groups/search?${params}`);
      if (!response.ok) throw new Error('Error al cargar grupos');

      const data = await response.json();
      setGroups(data.groups || []);
      setFilteredGroups(data.groups || []);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar grupos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/groups/user/my-groups`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar tus grupos');
      const data = await response.json();
      setMyGroups(data.groups || []);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar tus grupos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar grupos por búsqueda
  useEffect(() => {
    if (selectedTab === 'browse') {
      const filtered = groups.filter(group =>
        group.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, groups]);
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingGroup(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/groups/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newGroupData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear grupo');
      }

      const createdGroup = await response.json();
      setSuccess('¡Grupo creado exitosamente!');
      setMyGroups([createdGroup.group, ...myGroups]);
      setSelectedTab('my-groups');
      
      // Limpiar formulario
      setNewGroupData({
        title: '',
        description: '',
        type: 'clan',
        tags: [],
        max_members: 50,
        visibility: 'public'
      });

      // Limpiar mensaje de éxito
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Error al crear grupo');
      console.error('Error:', err);
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleRequestJoin = async (groupId: string) => {
    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/request-join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: '' })
      });
      if (!response.ok) throw new Error('Error al solicitar unirse');

      setSuccess('Solicitud enviada. Espera la aprobación del líder.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Error al solicitar unirse');
    }
  };

  const handleOpenGroup = async (groupId: string) => {
    try {
      const response = await fetch(`${API_URL}/groups/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar grupo');
      const data = await response.json();
      setSelectedGroupId(groupId);
      setSelectedGroupData(data.group);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar grupo');
    }
  };

  const handleCloseGroup = () => {
    setSelectedGroupId(null);
    setSelectedGroupData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3">
      <div className="max-w-7xl mx-auto">
        {/* Vista del Grupo Seleccionado */}
        {selectedGroupId && selectedGroupData && (
          <div className="space-y-3">
            {/* Header del grupo */}
            <div>
              <button
                onClick={handleCloseGroup}
                className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 mb-2 transition text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a grupos
              </button>

              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">{selectedGroupData.title}</h1>
                  <p className="text-slate-300 text-sm mb-1">{selectedGroupData.description}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{selectedGroupData.members?.length || 0}/{selectedGroupData.max_members} miembros</span>
                    <span>•</span>
                    <span className="capitalize">{selectedGroupData.type}</span>
                    <span>•</span>
                    <span className="capitalize">{selectedGroupData.language}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs del grupo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Chat - 2 columnas */}
              <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <GroupChat 
                  groupId={selectedGroupId} 
                  userId={currentUser?.userId}
                  isLeader={selectedGroupData.owner_id === currentUser?.userId || selectedGroupData.members.find((m: any) => m.user_id === currentUser?.userId)?.role === 'leader'}
                />
              </div>

              {/* Panel lateral - Miembros/Admin */}
              <div className="space-y-3">
                {/* Información del grupo */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                  <h3 className="text-sm font-bold text-white mb-2">Información</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-slate-400">Líder</p>
                      <p className="text-white font-medium">{selectedGroupData.owner_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Tipo</p>
                      <p className="text-white font-medium capitalize">{selectedGroupData.type}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Reputación</p>
                      <p className="text-yellow-400 font-medium">⭐ {selectedGroupData.reputation}</p>
                    </div>
                    {selectedGroupData.tier && (
                      <div>
                        <p className="text-slate-400">Tier</p>
                        <p className="text-white font-medium capitalize">{selectedGroupData.tier.level}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel de Admin si es líder */}
                {selectedGroupData.owner_id === currentUser?.userId && (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                    <GroupLeaderPanel 
                      groupId={selectedGroupId}
                      isLeader={true}
                    />
                  </div>
                )}

                {/* Miembros */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-4">Miembros ({selectedGroupData.members?.length || 0})</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedGroupData.members?.slice(0, 10).map((member: any) => (
                      <div key={member.user_id} className="flex items-center gap-2 p-2 hover:bg-slate-700/50 rounded transition">
                        <img
                          src={member.avatar || '/default-avatar.svg'}
                          alt={member.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{member.username}</p>
                          <p className="text-slate-400 text-xs capitalize">{member.role}</p>
                        </div>
                      </div>
                    ))}
                    {(selectedGroupData.members?.length || 0) > 10 && (
                      <p className="text-slate-400 text-sm text-center py-2">
                        +{(selectedGroupData.members?.length || 0) - 10} más
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vista de Listado de Grupos */}
        {!selectedGroupId && (
          <>
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-yellow-400" />
                <h1 className="text-2xl font-bold text-white"> Grupos</h1>
              </div>
              <p className="text-slate-300 text-sm">Encuentra o crea un grupo para jugar con otros Raiders</p>
            </div>

        {/* Mensajes de error/éxito */}
        {error && (
          <div className="mb-3 p-2 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-3 p-2 bg-green-900/50 border border-green-500 rounded-lg text-green-200 text-sm">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-slate-700">
          <button
            onClick={() => setSelectedTab('browse')}
            className={`px-3 py-2 font-medium transition-colors text-sm ${
              selectedTab === 'browse'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3 h-3 inline mr-1" />
            Explorar Grupos
          </button>
          <button
            onClick={() => setSelectedTab('my-groups')}
            className={`px-6 py-3 font-medium transition-colors ${
              selectedTab === 'my-groups'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Mis Grupos
          </button>
          <button
            onClick={() => setSelectedTab('create')}
            className={`px-3 py-2 font-medium transition-colors ml-auto text-sm ${
              selectedTab === 'create'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3 h-3 inline mr-1" />
            Crear Grupo
          </button>
        </div>

        {/* Contenido según tab */}
        {selectedTab === 'browse' && (
          <div>
            {/* Búsqueda y filtros */}
            <div className="mb-3 space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar grupos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-400"
                >
                  <option value="popular">Populares</option>
                  <option value="new">Recientes</option>
                  <option value="active">Activos</option>
                </select>
              </div>

              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-400"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="clan">Clanes</option>
                  <option value="raid-group">Raids</option>
                  <option value="trading">Trading</option>
                  <option value="social">Social</option>
                </select>

                <select
                  value={filterLanguage}
                  onChange={(e) => setFilterLanguage(e.target.value)}
                  className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-400"
                >
                  <option value="all">Todos idiomas</option>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </div>
            </div>

            {/* Grid de grupos */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-slate-700 border-t-yellow-400 rounded-full mx-auto"></div>
                <p className="text-slate-400 mt-2 text-sm">Cargando grupos...</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No se encontraron grupos</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredGroups.map(group => (
                  <GroupCard
                    key={group._id}
                    group={group}
                    currentUser={currentUser}
                    onRequestJoin={handleRequestJoin}
                    onOpenGroup={handleOpenGroup}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'my-groups' && (
          <div>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-slate-700 border-t-yellow-400 rounded-full mx-auto"></div>
              </div>
            ) : myGroups.length === 0 ? (
              <div className="text-center py-8 bg-slate-800/50 rounded-lg border border-slate-700">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 mb-3 text-sm">Aún no eres miembro de ningún grupo</p>
                <button
                  onClick={() => setSelectedTab('browse')}
                  className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition text-sm"
                >
                  Explorar Grupos
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myGroups.map(group => (
                  <div
                    key={group._id}
                    onClick={() => handleOpenGroup(group._id)}
                    className="p-6 bg-slate-800 border border-slate-700 rounded-lg hover:border-yellow-400 transition cursor-pointer hover:shadow-lg hover:shadow-yellow-400/10"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-white">{group.title}</h3>
                        <p className="text-slate-400 text-sm">{group.type}</p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-sm rounded-full">
                        {group.members?.length || 0}/{group.max_members}
                      </span>
                    </div>

                    <p className="text-slate-300 mb-4">{group.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {group.tags?.map((tag: any) => (
                        <span key={tag} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 justify-between">
                      <div className="text-slate-400 text-sm space-y-1">
                        <p>Líder: {group.owner_name}</p>
                        <p>Reputación: ⭐ {group.reputation}</p>
                      </div>
                      <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition">
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <div className="p-8 bg-slate-800 border border-slate-700 rounded-lg">
              <h2 className="text-2xl font-bold text-white mb-6">Crear Nuevo Grupo</h2>

              <form onSubmit={handleCreateGroup} className="space-y-6">
                <div>
                  <label className="block text-white font-medium mb-2">Nombre del Grupo</label>
                  <input
                    type="text"
                    required
                    value={newGroupData.title}
                    onChange={(e) => setNewGroupData({ ...newGroupData, title: e.target.value })}
                    placeholder="Ej: Los Valientes de The Rust Belt"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Descripción</label>
                  <textarea
                    required
                    value={newGroupData.description}
                    onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
                    placeholder="Describe tu grupo, objetivos, requisitos, etc."
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Tipo de Grupo</label>
                    <select
                      value={newGroupData.type}
                      onChange={(e) => setNewGroupData({ ...newGroupData, type: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    >
                      <option value="clan">Clan</option>
                      <option value="raid-group">Raid Group</option>
                      <option value="trading">Trading</option>
                      <option value="social">Social</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Máximo de Miembros</label>
                    <input
                      type="number"
                      min="4"
                      max="500"
                      value={newGroupData.max_members}
                      onChange={(e) => setNewGroupData({ ...newGroupData, max_members: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Visibilidad</label>
                    <select
                      value={newGroupData.visibility}
                      onChange={(e) => setNewGroupData({ ...newGroupData, visibility: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    >
                      <option value="public">Público</option>
                      <option value="private">Privado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Idioma</label>
                    <select
                      value={newGroupData.language || 'es'}
                      onChange={(e) => setNewGroupData({ ...newGroupData, language: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                      <option value="pt">Português</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-slate-600 text-black font-bold rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  {creatingGroup ? 'Creando grupo...' : 'Crear Grupo'}
                </button>
              </form>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}

// Componente para tarjeta de grupo
function GroupCard({ group, currentUser, onRequestJoin, onOpenGroup }: { group: any; currentUser: any; onRequestJoin: (id: string) => void; onOpenGroup?: (id: string) => void }) {
  const memberPercentage = (group.members?.length / group.max_members) * 100;
  const isOwner = currentUser && group.owner_id === currentUser.userId;

  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'diamante': return 'bg-blue-500/20 text-blue-300 border border-blue-500';
      case 'oro': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500';
      case 'plata': return 'bg-gray-400/20 text-gray-300 border border-gray-400';
      default: return 'bg-orange-500/20 text-orange-300 border border-orange-500';
    }
  };

  const getTierEmoji = (tier: string) => {
    switch(tier) {
      case 'diamante': return '💎';
      case 'oro': return '🏆';
      case 'plata': return '⭐';
      default: return '🔥';
    }
  };

  return (
    <div 
      onClick={() => onOpenGroup?.(group._id)}
      className="p-3 bg-slate-800 border border-slate-700 rounded-lg hover:border-yellow-400 transition hover:shadow-lg hover:shadow-yellow-400/10 cursor-pointer"
    >
      {/* Encabezado */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-sm font-bold text-white">{group.title}</h3>
          <p className="text-slate-400 text-xs capitalize">{group.type}</p>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <p className="text-yellow-400 font-bold text-xs">⭐ {group.reputation}</p>
          {group.tier && (
            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${getTierColor(group.tier.level)}`}>
              {getTierEmoji(group.tier.level)} {group.tier.level.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Descripción */}
      <p className="text-slate-300 text-xs mb-2 line-clamp-2">{group.description}</p>

      {/* Tags */}
      {group.tags && group.tags.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mb-2">
          {group.tags.slice(0, 3).map((tag: string) => (
            <span key={tag} className="px-1.5 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
              #{tag}
            </span>
          ))}
          {group.tags.length > 3 && (
            <span className="px-1.5 py-0.5 text-slate-400 text-xs">+{group.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Información */}
      <div className="space-y-1 mb-2 text-xs">
        <div className="flex items-center gap-1 text-slate-400">
          <Users className="w-3 h-3" />
          <span>{group.members?.length || 0}/{group.max_members}</span>
        </div>
        {group.language && (
          <div className="flex items-center gap-1 text-slate-400">
            <Globe className="w-3 h-3" />
            <span>{group.language}</span>
          </div>
        )}
        {group.success_rate && (
          <div className="flex items-center gap-1 text-slate-400">
            <BarChart3 className="w-3 h-3" />
            <span>{group.success_rate}% éxito</span>
          </div>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="mb-2">
        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-500 transition-all duration-300"
            style={{ width: `${memberPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Botón */}
      {(() => {
        const isMember = group.members?.some((m: any) => m.user_id === currentUser?.userId);
        
        if (isOwner || isMember) {
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenGroup?.(group._id);
              }}
              className="w-full px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-1 text-xs"
            >
              <Eye className="w-3 h-3" />
              Entrar
            </button>
          );
        } else {
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestJoin(group._id);
              }}
              className="w-full px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition flex items-center justify-center gap-1 text-xs"
            >
              <UserPlus className="w-3 h-3" />
              Solicitar
            </button>
          );
        }
      })()}
    </div>
  );
}
