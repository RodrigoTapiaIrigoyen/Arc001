import React, { useEffect, useState } from 'react';
import { fetchGroupMessages, sendGroupMessage, requestJoinGroup, acceptJoinRequest, rejectJoinRequest } from '../../services/groupsApi';
import type { Group, GroupMember, JoinRequest, GroupMessage } from '../../types/group';

interface GroupDetailsProps {
  group: Group;
  token: string;
  onClose: () => void;
}
export function GroupDetails({ group, token, onClose }: GroupDetailsProps) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [msg, setMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [groupData, setGroupData] = useState<Group>(group);

  useEffect(() => {
    if (!group) return;
    setGroupData(group);
    setLoading(true);
    fetchGroupMessages(group._id, token)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [group, token]);

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!msg.trim()) return;
    await sendGroupMessage(group._id, msg, token);
    setMsg('');
    fetchGroupMessages(group._id, token).then(setMessages);
  }


  // Solicitar ingreso
  function getErrorMessage(e: unknown): string {
    if (typeof e === 'object' && e && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
      return (e as { message: string }).message;
    }
    return 'Error desconocido';
  }
  async function handleRequestJoin() {
    try {
      await requestJoinGroup(group._id, token);
      setError('Solicitud enviada. Espera aprobación.');
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    }
  }

  // Aceptar/rechazar solicitud (solo líder/co-líder)
  async function handleAccept(userId: string) {
    try {
      await acceptJoinRequest(groupData._id, userId, token);
      // Opcional: recargar grupo actualizado desde backend si es necesario
      setGroupData({
        ...groupData,
        joinRequests: groupData.joinRequests?.filter((r: JoinRequest) => r.user_id !== userId) || [],
        members: [
          ...groupData.members,
          groupData.joinRequests?.find((r: JoinRequest) => r.user_id === userId) as GroupMember
        ].filter(Boolean)
      });
      setError('');
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    }
  }
  async function handleReject(userId: string) {
    try {
      await rejectJoinRequest(groupData._id, userId, token);
      // Opcional: recargar grupo actualizado desde backend si es necesario
      setGroupData({
        ...groupData,
        joinRequests: groupData.joinRequests?.filter((r: JoinRequest) => r.user_id !== userId) || []
      });
      setError('');
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a1f2e] rounded-lg max-w-2xl w-full border border-blue-500/30 p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-400 text-xl">✕</button>
          <h2 className="text-2xl font-bold text-blue-400 mb-2 flex items-center gap-2">
            {groupData.title}
            {groupData.tags && groupData.tags.length > 0 && (
              <span className="flex flex-wrap gap-1">
                {groupData.tags.map((tag: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-blue-700/30 rounded text-xs text-blue-300 ml-1">#{tag}</span>
                ))}
              </span>
            )}
          </h2>
          <div className="text-gray-300 mb-2 whitespace-pre-line">{groupData.description}</div>
          <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-2">
            <span>Líder: <b className="text-yellow-400">{groupData.owner_name}</b></span>
            <span>Miembros: <b className="text-yellow-400">{groupData.members?.length}/{groupData.max_members}</b></span>
            <span>Modo: <b className="text-yellow-400">{groupData.mode}</b></span>
            <span>Idioma: <b className="text-yellow-400">{groupData.language}</b></span>
            <span>Nivel: <b className="text-yellow-400">{groupData.level}</b></span>
            <span>Estado: <b className="text-green-400">{groupData.status}</b></span>
          </div>
          {groupData.requirements && (
            <div className="mb-2 text-sm text-gray-300"><b className="text-yellow-400">Requisitos:</b> {groupData.requirements}</div>
          )}
          {groupData.schedule && (
            <div className="mb-2 text-sm text-gray-300"><b className="text-yellow-400">Horario:</b> {groupData.schedule}</div>
          )}
          {groupData.discord_link && (
            <div className="mb-2 text-sm text-blue-400">
              <b>Discord:</b> <a href={groupData.discord_link} target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-400">{groupData.discord_link}</a>
            </div>
          )}
          <div className="mb-4 flex flex-wrap gap-2">
            <button onClick={handleRequestJoin} className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-bold">Solicitar ingreso</button>
            <button className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-red-500 text-white rounded-lg font-bold">Agregar a amigos</button>
          </div>
          {/* Solicitudes pendientes (solo líder/co-líder) */}
          {groupData.joinRequests && groupData.joinRequests.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 font-bold text-yellow-400">Solicitudes pendientes:</div>
              <div className="flex flex-wrap gap-3 mb-2">
                {groupData.joinRequests.map((r: JoinRequest, i: number) => (
                  <div key={i} className="flex items-center gap-2 bg-[#2a2d3a] px-3 py-1 rounded-full border border-yellow-500/20">
                    <img src={r.avatar || '/default-avatar.png'} alt={r.name} className="w-6 h-6 rounded-full border border-yellow-500/30" />
                    <span className="text-white text-sm">{r.name}</span>
                    <button onClick={() => handleAccept(r.user_id)} className="ml-2 px-2 py-1 bg-green-500/80 text-xs text-white rounded hover:bg-green-600">Aceptar</button>
                    <button onClick={() => handleReject(r.user_id)} className="ml-2 px-2 py-1 bg-red-500/80 text-xs text-white rounded hover:bg-red-600">Rechazar</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {error && <div className="text-red-400 mb-2">{error}</div>}
          <div className="bg-[#0a0e1a] border border-blue-500/20 rounded-lg p-4 h-64 overflow-y-auto mb-2">
            {loading ? <div className="text-gray-400">Cargando chat...</div> : messages.length === 0 ? <div className="text-gray-400">Sin mensajes aún.</div> : messages.slice().reverse().map((m: GroupMessage, i: number) => (
              <div key={i} className="mb-2">
                <span className="text-green-400 font-bold">{m.name}:</span> <span className="text-gray-200">{m.content}</span>
                <span className="text-xs text-gray-500 ml-2">{new Date(m.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} className="flex gap-2">
            <input value={msg} onChange={e => setMsg(e.target.value)} className="flex-1 px-3 py-2 rounded bg-[#1a1f2e] text-white border border-gray-700/30" placeholder="Escribe un mensaje..." />
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg">Enviar</button>
          </form>
          <div className="mb-4">
            <div className="mb-2 font-bold text-yellow-400">Miembros del grupo:</div>
            <div className="flex flex-wrap gap-3 mb-2">
              {groupData.members?.map((m: GroupMember, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-[#23263a] px-3 py-1 rounded-full border border-blue-500/20">
                  <img src={m.avatar || '/default-avatar.png'} alt={m.name} className="w-6 h-6 rounded-full border border-green-500/30" />
                  <span className="text-white text-sm">{m.name}</span>
                  {m.user_id === groupData.owner_id && <span className="text-xs text-yellow-400 font-bold ml-1">Líder</span>}
                  <button className="ml-2 px-2 py-1 bg-green-500/80 text-xs text-white rounded hover:bg-green-600">Agregar a amigo</button>
                </div>
              ))}
            </div>
          </div>
          {/* Historial y enlaces sociales futuros aquí */}
        </div>
      </div>
    </>
  );
}
