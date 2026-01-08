/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { Send, Heart, Smile, Settings, Users, MoreVertical, Plus, Trash2 } from 'lucide-react';

export default function GroupChat({ groupId, userId, isLeader = false }: { groupId: any; userId: any; username?: string; isLeader?: boolean }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('general');
  const [showNewChannelForm, setShowNewChannelForm] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';

  // Cargar canales
  useEffect(() => {
    fetchChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Cargar mensajes cuando cambia el canal
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, selectedChannel]);

  // Auto scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChannels = async () => {
    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/channels`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar canales');

      const data = await response.json();
      setChannels(data.channels || []);
    } catch (err) {
      console.error('Error cargando canales:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/messages?channelId=${selectedChannel}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar mensajes');

      const data = await response.json();
      setMessages(data.messages?.reverse() || []);
      setLoading(false);
    } catch (err) {
      setError((err as any)?.message || 'Error al cargar mensajes');
      console.error('Error:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageToSend = newMessage;
    setNewMessage('');

    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: messageToSend, channelId: selectedChannel })
      });

      if (!response.ok) throw new Error('Error al enviar mensaje');

      await fetchMessages();
    } catch (err: any) {
      setError(err?.message || 'Error al enviar mensaje');
      setNewMessage(messageToSend);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;

    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          name: newChannelName, 
          description: newChannelDescription 
        })
      });

      if (!response.ok) throw new Error('Error al crear canal');

      setNewChannelName('');
      setNewChannelDescription('');
      setShowNewChannelForm(false);
      await fetchChannels();
    } catch (err: any) {
      setError(err?.message || 'Error al crear canal');
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!window.confirm('¿Eliminar este canal?')) return;

    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/channels/${channelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al eliminar canal');
      await fetchChannels();
      if (selectedChannel === channelId) setSelectedChannel('general');
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar canal');
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch(`${API_URL}/groups/messages/${messageId}/reaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ emoji })
      });

      await fetchMessages();
    } catch (err) {
      console.error('Error al agregar reacción:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Canales */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {channels.map(channel => (
            <div key={channel.id} className="flex items-center">
              <button
                onClick={() => setSelectedChannel(channel.id)}
                className={`px-3 py-1 rounded-lg transition text-sm font-medium flex items-center gap-1 ${
                  selectedChannel === channel.id
                    ? 'bg-yellow-500 text-black'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                title={channel.description}
              >
                #{channel.name}
              </button>
              {isLeader && !channel.is_default && (
                <button
                  onClick={() => handleDeleteChannel(channel.id)}
                  className="p-0.5 ml-1 hover:bg-red-500/20 rounded transition text-red-400"
                  title="Eliminar canal"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          {isLeader && (
            <button
              onClick={() => setShowNewChannelForm(!showNewChannelForm)}
              className="px-3 py-1 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition text-sm font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
          )}
        </div>

        {/* Formulario crear canal */}
        {showNewChannelForm && isLeader && (
          <div className="bg-slate-700 p-3 rounded-lg mt-2 space-y-2">
            <input
              type="text"
              placeholder="Nombre del canal (ej: guias, eventos)"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:border-yellow-400"
            />
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={newChannelDescription}
              onChange={(e) => setNewChannelDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:border-yellow-400"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateChannel}
                className="flex-1 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded text-sm transition"
              >
                Crear
              </button>
              <button
                onClick={() => setShowNewChannelForm(false)}
                className="flex-1 px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded text-sm transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Header del chat */}
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white">#{selectedChannel}</h2>
          <p className="text-slate-400 text-sm">{messages.length} mensajes</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400">
            <Users className="w-5 h-5" />
          </button>
          {isLeader && (
            <button className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400">
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-slate-700 border-t-yellow-400 rounded-full mx-auto"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Sin mensajes aún. ¡Sé el primero en escribir!</p>
          </div>
        ) : (
          messages.map((msg: any) => (
            <div
              key={msg._id?.toString() || msg.id}
              className="flex gap-3 hover:bg-slate-800/50 p-2 rounded-lg transition group"
            >
              {/* Avatar */}
              <img
                src={msg.avatar || '/default-avatar.svg'}
                alt={msg.username}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{msg.username}</span>
                  <span className="text-slate-500 text-xs">
                    {msg.created_at && new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                </div>

                {msg.content !== '[Mensaje eliminado]' ? (
                  <p className="text-slate-200 break-words">{msg.content}</p>
                ) : (
                  <p className="text-slate-500 italic">[Mensaje eliminado]</p>
                )}

                {/* Reacciones */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex gap-1 mt-2 text-sm">
                    {Object.entries(msg.reactions).map(([emoji, users]: [string, any]) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msg._id, emoji)}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded transition"
                      >
                        {emoji} {(users as any)?.length || 0}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="opacity-0 group-hover:opacity-100 transition flex gap-1">
                <button
                  onClick={() => handleReaction(msg._id, '👍')}
                  className="p-1 hover:bg-slate-700 rounded transition text-slate-400"
                  title="Me gusta"
                >
                  <Heart className="w-4 h-4" />
                </button>
                {(msg.user_id === userId || isLeader) && (
                  <button className="p-1 hover:bg-slate-700 rounded transition text-slate-400">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-yellow-400"
        />
        <button
          type="button"
          className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400"
        >
          <Smile className="w-5 h-5" />
        </button>
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-slate-600 text-black font-medium rounded-lg transition flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {error && (
        <div className="p-3 bg-red-900/50 border border-red-500 text-red-200 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
