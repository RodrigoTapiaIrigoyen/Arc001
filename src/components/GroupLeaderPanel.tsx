/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Settings, Users, Shield, UserX, Edit, Save, X } from 'lucide-react';

export default function GroupLeaderPanel({ groupId, isLeader = false }: { groupId: any; isLeader?: boolean }) {
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members'); // members, requests, settings
  const [editingGroup, setEditingGroup] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [showMemberMenu, setShowMemberMenu] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar datos del grupo
  useEffect(() => {
    fetchGroupData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const fetchGroupData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar grupo');

      const data = await response.json();
      setGroup(data.group);
      setMembers(data.group.members || []);
      setJoinRequests(data.group.joinRequests || []);
      setEditData({
        title: data.group.title,
        description: data.group.description,
        max_members: data.group.max_members,
        visibility: data.group.visibility
      });
    } catch (err: any) {
      setError(err?.message || 'Error al cargar datos del grupo');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (userId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/accept-request/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al aceptar solicitud');

      setSuccess('Solicitud aceptada');
      fetchGroupData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Error al aceptar solicitud');
    }
  };

  const handleRejectRequest = async (userId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/reject-request/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Rechazado por el líder' })
      });

      if (!response.ok) throw new Error('Error al rechazar solicitud');

      setSuccess('Solicitud rechazada');
      fetchGroupData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Error al rechazar solicitud');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres remover a este miembro?')) return;

    try {
      const response = await fetch(`/api/groups/${groupId}/remove-member/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Removido por el líder' })
      });

      if (!response.ok) throw new Error('Error al remover miembro');

      setSuccess('Miembro removido');
      fetchGroupData();
      setShowMemberMenu(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Error al remover miembro');
    }
  };

  const handleBanMember = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres banear a este miembro? No podrá volver a unirse.')) return;

    try {
      const response = await fetch(`/api/groups/${groupId}/ban-member/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Baneado por el líder' })
      });

      if (!response.ok) throw new Error('Error al banear miembro');

      setSuccess('Miembro baneado');
      fetchGroupData();
      setShowMemberMenu(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Error al banear miembro');
    }
  };

  const handlePromote = async (userId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/promote/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al promover');

      setSuccess('Miembro promovido a moderador');
      fetchGroupData();
      setShowMemberMenu(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Error al promover miembro');
    }
  };

  const handleSaveGroupSettings = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editData)
      });

      if (!response.ok) throw new Error('Error al guardar cambios');

      setSuccess('Cambios guardados correctamente');
      setEditingGroup(false);
      fetchGroupData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Error al guardar cambios');
    }
  };

  if (!isLeader) {
    return (
      <div className="p-8 bg-slate-800 border border-slate-700 rounded-lg text-center">
        <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">Solo los líderes del grupo pueden acceder a este panel</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-slate-700 border-t-yellow-400 rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-yellow-400" />
        <h2 className="text-2xl font-bold text-white">Panel de Administración</h2>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-200">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'members'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Miembros ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'requests'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Solicitudes
          {joinRequests.length > 0 && (
            <span className="absolute top-1 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              {joinRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Configuración
        </button>
      </div>

      {/* Contenido */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Miembros del Grupo</h3>
          <div className="space-y-2">
            {members.map(member => (
              <div
                key={member.user_id}
                className="p-4 bg-slate-800 border border-slate-700 rounded-lg flex justify-between items-center hover:border-yellow-400 transition group"
              >
                <div className="flex items-center gap-3 flex-1">
                  <img
                    src={member.avatar || '/default-avatar.png'}
                    alt={member.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-white">{member.username}</p>
                    <p className="text-slate-400 text-sm capitalize">
                      {member.role === 'leader' ? '👑 Líder' : member.role === 'moderator' ? '🛡️ Moderador' : 'Miembro'}
                    </p>
                  </div>
                </div>

                <div className="text-slate-400 text-sm mr-4">
                  Unido hace {Math.floor((Date.now() - new Date(member.joined_at).getTime()) / (1000 * 60 * 60 * 24))} días
                </div>

                {member.role !== 'leader' && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMemberMenu(showMemberMenu === member.user_id ? null : member.user_id)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition opacity-0 group-hover:opacity-100"
                    >
                      ⋮
                    </button>

                    {showMemberMenu === member.user_id && (
                      <div className="absolute right-0 mt-2 w-48 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-10">
                        {member.role === 'member' && (
                          <button
                            onClick={() => handlePromote(member.user_id)}
                            className="w-full text-left px-4 py-2 hover:bg-slate-600 text-white flex items-center gap-2 border-b border-slate-600"
                          >
                            <Shield className="w-4 h-4" />
                            Promover a Moderador
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="w-full text-left px-4 py-2 hover:bg-slate-600 text-yellow-200 flex items-center gap-2 border-b border-slate-600"
                        >
                          <UserX className="w-4 h-4" />
                          Remover
                        </button>
                        <button
                          onClick={() => handleBanMember(member.user_id)}
                          className="w-full text-left px-4 py-2 hover:bg-red-900/50 text-red-300 flex items-center gap-2"
                        >
                          <UserX className="w-4 h-4" />
                          Banear
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Solicitudes Pendientes</h3>
          {joinRequests.length === 0 ? (
            <div className="p-8 bg-slate-800/50 rounded-lg text-center text-slate-400">
              No hay solicitudes pendientes
            </div>
          ) : (
            <div className="space-y-2">
              {joinRequests.map(request => (
                <div
                  key={request.user_id}
                  className="p-4 bg-slate-800 border border-slate-700 rounded-lg flex justify-between items-center"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={request.avatar || '/default-avatar.png'}
                      alt={request.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-white">{request.username}</p>
                      {request.message && <p className="text-slate-400 text-sm">{request.message}</p>}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request.user_id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.user_id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white mb-6">Configuración del Grupo</h3>

          {editingGroup ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveGroupSettings();
              }}
              className="space-y-4 bg-slate-800 p-6 rounded-lg border border-slate-700"
            >
              <div>
                <label className="block text-white font-medium mb-2">Nombre del Grupo</label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Descripción</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Máximo de Miembros</label>
                  <input
                    type="number"
                    value={editData.max_members}
                    onChange={(e) => setEditData({ ...editData, max_members: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Visibilidad</label>
                  <select
                    value={editData.visibility}
                    onChange={(e) => setEditData({ ...editData, visibility: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                  >
                    <option value="public">Público</option>
                    <option value="private">Privado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={() => setEditingGroup(false)}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-slate-400">Nombre</p>
                  <button
                    onClick={() => setEditingGroup(true)}
                    className="text-yellow-400 hover:text-yellow-300 transition flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-white font-bold">{group?.title}</p>
              </div>

              <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                <p className="text-slate-400 mb-2">Descripción</p>
                <p className="text-white">{group?.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                  <p className="text-slate-400 mb-2">Máximo de Miembros</p>
                  <p className="text-white font-bold">{group?.max_members}</p>
                </div>

                <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                  <p className="text-slate-400 mb-2">Visibilidad</p>
                  <p className="text-white font-bold capitalize">{group?.visibility}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
