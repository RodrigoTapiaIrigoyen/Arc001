import React, { useEffect, useState } from 'react';
import GroupCard from './GroupCard';
import { GroupDetails } from './GroupDetails';
import { fetchGroups, createGroup } from '../../services/groupsApi';

// Boceto inicial del componente principal del Buscador de Grupos
import type { Group } from '../../types/group';

export default function GroupFinder() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group|null>(null);
  // Filtros avanzados
  const [filters, setFilters] = useState({
    mode: '',
    language: '',
    level: '',
    tags: '',
    status: '',
    minMembers: '',
    maxMembers: '',
    discord: '',
    schedule: '',
    requirements: '',
  });
  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    setLoading(true);
    // Adaptar filtros para backend (ej: tags como array, min/max miembros)
    const backendFilters: any = { ...filters };
    if (filters.tags) backendFilters.tags = filters.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    if (filters.minMembers) backendFilters.min_members = filters.minMembers;
    if (filters.maxMembers) backendFilters.max_members = filters.maxMembers;
    delete backendFilters.minMembers;
    delete backendFilters.maxMembers;
    fetchGroups(backendFilters)
      .then(setGroups)
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [filters]);

  // Manejo de creación de grupo (boceto)
  // Estado para el formulario de creación
  const [createData, setCreateData] = useState({
    title: '',
    description: '',
    requirements: '',
    mode: '',
    level: '',
    language: '',
    schedule: '',
    tags: '',
    max_members: 4,
    discord_link: '',
  });
  const [createError, setCreateError] = useState('');

  async function handleCreateGroup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreateError('');
    // Validaciones básicas
    if (!createData.title || !createData.description || !createData.mode || !createData.language) {
      setCreateError('Completa todos los campos obligatorios.');
      return;
    }
    if (createData.title.length < 3) {
      setCreateError('El nombre del grupo debe tener al menos 3 caracteres.');
      return;
    }
    if (createData.max_members < 2 || createData.max_members > 20) {
      setCreateError('El grupo debe tener entre 2 y 20 miembros.');
      return;
    }
    // Preparar datos para backend
    const data = {
      ...createData,
      tags: createData.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    try {
      await createGroup(data, token);
      setShowCreate(false);
      setLoading(true);
      fetchGroups(filters).then(setGroups).finally(() => setLoading(false));
      setCreateData({
        title: '', description: '', requirements: '', mode: '', level: '', language: '', schedule: '', tags: '', max_members: 4, discord_link: '',
      });
    } catch (err) {
      setCreateError('Error al crear grupo.');
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400 bg-clip-text text-transparent">Buscador de Grupos</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-bold hover:from-green-600 hover:to-blue-600 transition-colors shadow-lg"
        >
          + Crear Grupo
        </button>
      </div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 bg-[#1a1f2e]/60 border border-blue-500/20 rounded-lg p-4">
        <input type="text" placeholder="Modo de juego" className="px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={filters.mode} onChange={e => setFilters(f => ({ ...f, mode: e.target.value }))} />
        <input type="text" placeholder="Idioma" className="px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={filters.language} onChange={e => setFilters(f => ({ ...f, language: e.target.value }))} />
        <input type="text" placeholder="Nivel" className="px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={filters.level} onChange={e => setFilters(f => ({ ...f, level: e.target.value }))} />
        <input type="text" placeholder="Tags (separados por coma)" className="px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={filters.tags} onChange={e => setFilters(f => ({ ...f, tags: e.target.value }))} />
        <input type="text" placeholder="Estado (open, full, etc)" className="px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} />
        <input type="number" min="1" placeholder="Mín. miembros" className="px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={filters.minMembers} onChange={e => setFilters(f => ({ ...f, minMembers: e.target.value }))} />
        <input type="number" min="1" placeholder="Máx. miembros" className="px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={filters.maxMembers} onChange={e => setFilters(f => ({ ...f, maxMembers: e.target.value }))} />
        <input type="text" placeholder="Discord" className="px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={filters.discord} onChange={e => setFilters(f => ({ ...f, discord: e.target.value }))} />
        <input type="text" placeholder="Horario" className="px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={filters.schedule} onChange={e => setFilters(f => ({ ...f, schedule: e.target.value }))} />
        <input type="text" placeholder="Requisitos" className="px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={filters.requirements} onChange={e => setFilters(f => ({ ...f, requirements: e.target.value }))} />
      </div>
      {/* Listado de grupos */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="text-center text-gray-400 py-12">Cargando grupos...</div>
        ) : groups.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No hay grupos activos. ¡Sé el primero en crear uno!</div>
        ) : (
          <>
            {groups.map((group, idx) => (
              <GroupCard key={group._id || idx} group={group} onJoin={() => setSelectedGroup(group)} onView={() => setSelectedGroup(group)} />
            ))}
          </>
        )}
      </div>
      {/* Modal para crear grupo (boceto) */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-lg max-w-lg w-full border border-yellow-500/30 p-6">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Crear Nuevo Grupo</h2>
            <form onSubmit={handleCreateGroup} className="space-y-3">
              <input type="text" placeholder="Nombre del grupo *" className="w-full px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={createData.title} onChange={e => setCreateData(d => ({ ...d, title: e.target.value }))} required />
              <textarea placeholder="Descripción *" className="w-full px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={createData.description} onChange={e => setCreateData(d => ({ ...d, description: e.target.value }))} required />
              <input type="text" placeholder="Requisitos" className="w-full px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={createData.requirements} onChange={e => setCreateData(d => ({ ...d, requirements: e.target.value }))} />
              <input type="text" placeholder="Modo de juego *" className="w-full px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={createData.mode} onChange={e => setCreateData(d => ({ ...d, mode: e.target.value }))} required />
              <input type="text" placeholder="Nivel" className="w-full px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={createData.level} onChange={e => setCreateData(d => ({ ...d, level: e.target.value }))} />
              <input type="text" placeholder="Idioma *" className="w-full px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={createData.language} onChange={e => setCreateData(d => ({ ...d, language: e.target.value }))} required />
              <input type="text" placeholder="Horario" className="w-full px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={createData.schedule} onChange={e => setCreateData(d => ({ ...d, schedule: e.target.value }))} />
              <input type="text" placeholder="Tags (separados por coma)" className="w-full px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={createData.tags} onChange={e => setCreateData(d => ({ ...d, tags: e.target.value }))} />
              <input type="number" min="2" max="20" placeholder="Máximo de miembros *" className="w-full px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={createData.max_members} onChange={e => setCreateData(d => ({ ...d, max_members: Number(e.target.value) }))} required />
              <input type="text" placeholder="Enlace de Discord" className="w-full px-3 py-2 rounded bg-[#0a0e1a] text-white border border-gray-700/30" value={createData.discord_link} onChange={e => setCreateData(d => ({ ...d, discord_link: e.target.value }))} />
              {createError && <div className="text-red-400 text-sm">{createError}</div>}
              <div className="flex gap-2 mt-4">
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg">Crear</button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-red-500 text-white rounded-lg ml-2">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Detalles del grupo seleccionado */}
      {selectedGroup && (
        <GroupDetails group={selectedGroup} token={token} onClose={() => setSelectedGroup(null)} />
      )}
    </div>
  );
}
