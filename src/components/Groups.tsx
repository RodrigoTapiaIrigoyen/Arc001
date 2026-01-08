/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Users, Search, Plus, Eye, UserPlus, Globe, BarChart3 } from 'lucide-react';

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
  
  // API URL configurada desde env
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">Clanes y Grupos</h1>
          </div>
          <p className="text-slate-300">Encuentra o crea un grupo para jugar con otros Raiders</p>
        </div>

        {/* Mensajes de error/éxito */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-200">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-700">
          <button
            onClick={() => setSelectedTab('browse')}
            className={`px-6 py-3 font-medium transition-colors ${
              selectedTab === 'browse'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
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
            className={`px-6 py-3 font-medium transition-colors ml-auto ${
              selectedTab === 'create'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Crear Grupo
          </button>
        </div>

        {/* Contenido según tab */}
        {selectedTab === 'browse' && (
          <div>
            {/* Búsqueda y filtros */}
            <div className="mb-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar grupos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                >
                  <option value="popular">Más populares</option>
                  <option value="new">Más recientes</option>
                  <option value="active">Más activos</option>
                </select>
              </div>

              <div className="flex gap-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="clan">Clanes</option>
                  <option value="raid-group">Raid Groups</option>
                  <option value="trading">Trading</option>
                  <option value="social">Social</option>
                </select>

                <select
                  value={filterLanguage}
                  onChange={(e) => setFilterLanguage(e.target.value)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                >
                  <option value="all">Todos los idiomas</option>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </div>
            </div>

            {/* Grid de grupos */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-slate-700 border-t-yellow-400 rounded-full mx-auto"></div>
                <p className="text-slate-400 mt-4">Cargando grupos...</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No se encontraron grupos</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map(group => (
                  <GroupCard
                    key={group._id}
                    group={group}
                    onRequestJoin={handleRequestJoin}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'my-groups' && (
          <div>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-slate-700 border-t-yellow-400 rounded-full mx-auto"></div>
              </div>
            ) : myGroups.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">Aún no eres miembro de ningún grupo</p>
                <button
                  onClick={() => setSelectedTab('browse')}
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition"
                >
                  Explorar Grupos
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myGroups.map(group => (
                  <div
                    key={group._id}
                    className="p-6 bg-slate-800 border border-slate-700 rounded-lg hover:border-yellow-400 transition cursor-pointer"
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
      </div>
    </div>
  );
}

// Componente para tarjeta de grupo
function GroupCard({ group, onRequestJoin }: { group: any; onRequestJoin: (id: string) => void }) {
  const memberPercentage = (group.members?.length / group.max_members) * 100;

  return (
    <div className="p-6 bg-slate-800 border border-slate-700 rounded-lg hover:border-yellow-400 transition hover:shadow-lg hover:shadow-yellow-400/10">
      {/* Encabezado */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-white">{group.title}</h3>
          <p className="text-slate-400 text-sm capitalize">{group.type}</p>
        </div>
        <div className="text-right">
          <p className="text-yellow-400 font-bold text-sm">⭐ {group.reputation}</p>
        </div>
      </div>

      {/* Descripción */}
      <p className="text-slate-300 text-sm mb-4 line-clamp-2">{group.description}</p>

      {/* Tags */}
      {group.tags && group.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {group.tags.slice(0, 3).map((tag: string) => (
            <span key={tag} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
              #{tag}
            </span>
          ))}
          {group.tags.length > 3 && (
            <span className="px-2 py-1 text-slate-400 text-xs">+{group.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Información */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <Users className="w-4 h-4" />
          <span>{group.members?.length || 0}/{group.max_members} miembros</span>
        </div>
        {group.language && (
          <div className="flex items-center gap-2 text-slate-400">
            <Globe className="w-4 h-4" />
            <span>{group.language}</span>
          </div>
        )}
        {group.success_rate && (
          <div className="flex items-center gap-2 text-slate-400">
            <BarChart3 className="w-4 h-4" />
            <span>{group.success_rate}% éxito</span>
          </div>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-500 transition-all duration-300"
            style={{ width: `${memberPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Botón */}
      <button
        onClick={() => onRequestJoin(group._id)}
        className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition flex items-center justify-center gap-2"
      >
        <UserPlus className="w-4 h-4" />
        Solicitar Unirse
      </button>
    </div>
  );
}
