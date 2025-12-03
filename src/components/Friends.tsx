import { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Check, X, Search, Users, Clock, Loader } from 'lucide-react';
import api from '../services/api';
import socketClient from '../services/socket';
import toast from 'react-hot-toast';

interface Friend {
  friendshipId: string;
  userId: string;
  username: string;
  email: string;
  avatar: string | null;
  since?: string;
  requestedAt?: string;
  sentAt?: string;
}

interface SearchResult {
  _id: string;
  username: string;
  email: string;
  avatar: string | null;
}

type Tab = 'friends' | 'requests' | 'sent' | 'search';

export default function Friends() {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
    loadSentRequests();
    setupSocketListeners();

    return () => {
      cleanupSocketListeners();
    };
  }, []);

  const setupSocketListeners = () => {
    // Nueva solicitud de amistad recibida
    socketClient.on('new-friend-request', (data: any) => {
      toast.success(`${data.senderUsername} te envió una solicitud de amistad`);
      loadPendingRequests();
    });

    // Solicitud aceptada
    socketClient.on('friend-request-accepted', (data: any) => {
      toast.success(`${data.username} aceptó tu solicitud de amistad`);
      loadFriends();
      loadSentRequests();
    });
  };

  const cleanupSocketListeners = () => {
    socketClient.off('new-friend-request');
    socketClient.off('friend-request-accepted');
  };

  const loadFriends = async () => {
    try {
      const response = await api.get('/friends');
      setFriends(response.data);
    } catch (error: any) {
      console.error('Error loading friends:', error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const response = await api.get('/friends/requests/pending');
      setPendingRequests(response.data);
    } catch (error: any) {
      console.error('Error loading pending requests:', error);
    }
  };

  const loadSentRequests = async () => {
    try {
      const response = await api.get('/friends/requests/sent');
      setSentRequests(response.data);
    } catch (error: any) {
      console.error('Error loading sent requests:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await api.get(`/friends/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error: any) {
      console.error('Error searching users:', error);
      toast.error('Error al buscar usuarios');
    } finally {
      setSearchLoading(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    setLoading(true);
    try {
      await api.post(`/friends/request/${userId}`);
      toast.success('Solicitud enviada');
      setSearchResults(prev => prev.filter(u => u._id !== userId));
      loadSentRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (friendshipId: string, accept: boolean) => {
    setLoading(true);
    try {
      await api.post(`/friends/respond/${friendshipId}`, { accept });
      toast.success(accept ? 'Solicitud aceptada' : 'Solicitud rechazada');
      loadPendingRequests();
      if (accept) {
        loadFriends();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al responder solicitud');
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async (friendshipId: string) => {
    if (!confirm('¿Cancelar esta solicitud?')) return;

    setLoading(true);
    try {
      await api.delete(`/friends/request/${friendshipId}`);
      toast.success('Solicitud cancelada');
      loadSentRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cancelar solicitud');
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendshipId: string) => {
    if (!confirm('¿Eliminar este amigo?')) return;

    setLoading(true);
    try {
      await api.delete(`/friends/${friendshipId}`);
      toast.success('Amigo eliminado');
      loadFriends();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar amigo');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6" />
            Amigos
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'friends'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              Amigos ({friends.length})
            </div>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'requests'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Solicitudes ({pendingRequests.length})
              {pendingRequests.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'sent'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Enviadas ({sentRequests.length})
            </div>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Search className="w-4 h-4" />
              Buscar
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Friends List */}
          {activeTab === 'friends' && (
            <div className="space-y-3">
              {friends.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No tienes amigos agregados</p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="mt-4 text-purple-400 hover:text-purple-300"
                  >
                    Buscar usuarios
                  </button>
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.friendshipId}
                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {friend.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{friend.username}</h4>
                        <p className="text-xs text-gray-400">
                          Amigos desde {new Date(friend.since!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFriend(friend.friendshipId)}
                      disabled={loading}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar amigo"
                    >
                      <UserMinus className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Pending Requests */}
          {activeTab === 'requests' && (
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No tienes solicitudes pendientes</p>
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <div
                    key={request.friendshipId}
                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {request.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{request.username}</h4>
                        <p className="text-xs text-gray-400">
                          {new Date(request.requestedAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondToRequest(request.friendshipId, true)}
                        disabled={loading}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Aceptar"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => respondToRequest(request.friendshipId, false)}
                        disabled={loading}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Rechazar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sent Requests */}
          {activeTab === 'sent' && (
            <div className="space-y-3">
              {sentRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No has enviado solicitudes</p>
                </div>
              ) : (
                sentRequests.map((request) => (
                  <div
                    key={request.friendshipId}
                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {request.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{request.username}</h4>
                        <p className="text-xs text-gray-400">
                          Enviada {new Date(request.sentAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelRequest(request.friendshipId)}
                      disabled={loading}
                      className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Search Users */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Buscar usuarios..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                />
                {searchLoading && (
                  <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400 animate-spin" />
                )}
              </div>

              <div className="space-y-3">
                {searchQuery.length < 2 ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Escribe al menos 2 caracteres para buscar</p>
                  </div>
                ) : searchResults.length === 0 && !searchLoading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No se encontraron usuarios</p>
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {user.username[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{user.username}</h4>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => sendFriendRequest(user._id)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <UserPlus className="w-4 h-4" />
                        Agregar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
