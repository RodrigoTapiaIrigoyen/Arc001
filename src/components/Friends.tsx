import { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Check, X, Search, Users, Clock, Loader, MessageCircle } from 'lucide-react';
import api from '../services/api';
import socketClient from '../services/socket';
import toast from 'react-hot-toast';
import GuestBanner from './GuestBanner';

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

interface FriendsProps {
  user?: any;
  onViewChange?: (view: string) => void;
  onSelectUser?: (userId: string, username: string) => void;
  onSwitchToRegister?: () => void;
  onSwitchToLogin?: () => void;
}

export default function Friends({ user, onViewChange, onSelectUser, onSwitchToRegister, onSwitchToLogin }: FriendsProps = {}) {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    // Verificar si hay un tab guardado en sessionStorage (desde notificación)
    const savedTab = sessionStorage.getItem('friendsActiveTab');
    if (savedTab && ['friends', 'requests', 'sent', 'search'].includes(savedTab)) {
      setActiveTab(savedTab as Tab);
      sessionStorage.removeItem('friendsActiveTab'); // Limpiar después de usar
    }
    
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
      setFriends(Array.isArray(response) ? response : []);
    } catch (error: any) {
      console.error('Error loading friends:', error);
      setFriends([]); // Asegurar que siempre sea un array
      // Si es 404, significa que el endpoint aún no está disponible
      if (error.response?.status !== 404 && error.message !== 'Failed to fetch') {
        toast.error('Error al cargar amigos');
      }
    }
  };

  const loadPendingRequests = async () => {
    try {
      const response = await api.get('/friends/requests/pending');
      setPendingRequests(Array.isArray(response) ? response : []);
    } catch (error: any) {
      console.error('Error loading pending requests:', error);
      setPendingRequests([]); // Asegurar que siempre sea un array
      if (error.response?.status !== 404 && error.message !== 'Failed to fetch') {
        toast.error('Error al cargar solicitudes');
      }
    }
  };

  const loadSentRequests = async () => {
    try {
      const response = await api.get('/friends/requests/sent');
      setSentRequests(Array.isArray(response) ? response : []);
    } catch (error: any) {
      console.error('Error loading sent requests:', error);
      setSentRequests([]); // Asegurar que siempre sea un array
      if (error.response?.status !== 404 && error.message !== 'Failed to fetch') {
        toast.error('Error al cargar solicitudes enviadas');
      }
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
      setSearchResults(Array.isArray(response) ? response : []);
    } catch (error: any) {
      console.error('❌ Error searching users:', error);
      setSearchResults([]);
      if (error.message !== 'Failed to fetch') {
        toast.error('Error al buscar usuarios');
      }
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
      console.error('Error enviando solicitud:', error);
      toast.error(error.message || 'Error al enviar solicitud');
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
      console.error('Error respondiendo solicitud:', error);
      toast.error(error.message || 'Error al responder solicitud');
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
      console.error('Error cancelando solicitud:', error);
      toast.error(error.message || 'Error al cancelar solicitud');
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
      console.error('Error eliminando amigo:', error);
      toast.error(error.message || 'Error al eliminar amigo');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const handleSendMessage = (userId: string, username: string) => {
    // Guardar el usuario seleccionado en localStorage para Messages
    localStorage.setItem('selectedUserId', userId);
    localStorage.setItem('selectedUsername', username);
    
    // Llamar a onSelectUser si existe
    if (onSelectUser) {
      onSelectUser(userId, username);
    }
    
    // Cambiar a la vista de mensajes
    if (onViewChange) {
      onViewChange('messages');
    }
    
    toast.success(`Abriendo chat con ${username}`);
  };

  // Si no hay usuario (modo guest), mostrar banner
  if (!user) {
    return (
      <GuestBanner 
        message="Necesitas una cuenta para conectar con otros Raiders y formar tu equipo."
        onRegister={onSwitchToRegister || (() => {})}
        onLogin={onSwitchToLogin || (() => {})}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6">
      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            Amigos
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 min-w-[80px] px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'friends'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Amigos</span>
              <span className="text-xs">({friends?.length || 0})</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 min-w-[80px] px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors relative ${
              activeTab === 'requests'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Solicitudes</span>
              <span className="sm:hidden">Recibidas</span>
              <span className="text-xs">({pendingRequests?.length || 0})</span>
              {(pendingRequests?.length || 0) > 0 && (
                <span className="absolute top-1 right-1 sm:top-2 sm:right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 min-w-[80px] px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'sent'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Enviadas</span>
              <span className="text-xs">({sentRequests?.length || 0})</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 min-w-[80px] px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Buscar</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6">
          {/* Friends List */}
          {activeTab === 'friends' && (
            <div className="space-y-2 sm:space-y-3">
              {!friends || friends.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-gray-400">No tienes amigos agregados</p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="mt-3 sm:mt-4 text-sm sm:text-base text-purple-400 hover:text-purple-300"
                  >
                    Buscar usuarios
                  </button>
                </div>
              ) : (
                (friends || []).map((friend) => (
                  <div
                    key={friend.friendshipId}
                    className="flex items-center justify-between p-3 sm:p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm sm:text-base text-white font-bold">
                          {friend.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base text-white font-medium truncate">{friend.username}</h4>
                        <p className="text-xs text-gray-400 truncate">
                          Amigos desde {new Date(friend.since!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleSendMessage(friend.userId, friend.username)}
                        className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 rounded-lg transition-colors"
                        title="Enviar mensaje"
                      >
                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={() => removeFriend(friend.friendshipId)}
                        disabled={loading}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Eliminar amigo"
                      >
                        <UserMinus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Pending Requests */}
          {activeTab === 'requests' && (
            <div className="space-y-2 sm:space-y-3">
              {!pendingRequests || pendingRequests.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-gray-400">No tienes solicitudes pendientes</p>
                </div>
              ) : (
                (pendingRequests || []).map((request) => (
                  <div
                    key={request.friendshipId}
                    className="flex items-center justify-between p-3 sm:p-4 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm sm:text-base text-white font-bold">
                          {request.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base text-white font-medium truncate">{request.username}</h4>
                        <p className="text-xs text-gray-400 truncate">
                          {new Date(request.requestedAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={() => respondToRequest(request.friendshipId, true)}
                        disabled={loading}
                        className="p-1.5 sm:p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Aceptar"
                      >
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={() => respondToRequest(request.friendshipId, false)}
                        disabled={loading}
                        className="p-1.5 sm:p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Rechazar"
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sent Requests */}
          {activeTab === 'sent' && (
            <div className="space-y-2 sm:space-y-3">
              {!sentRequests || sentRequests.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-gray-400">No has enviado solicitudes</p>
                </div>
              ) : (
                (sentRequests || []).map((request) => (
                  <div
                    key={request.friendshipId}
                    className="flex items-center justify-between p-3 sm:p-4 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm sm:text-base text-white font-bold">
                          {request.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base text-white font-medium truncate">{request.username}</h4>
                        <p className="text-xs text-gray-400 truncate">
                          Enviada {new Date(request.sentAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelRequest(request.friendshipId)}
                      disabled={loading}
                      className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
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
            <div className="space-y-3 sm:space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Buscar usuarios..."
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                />
                {searchLoading && (
                  <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-purple-400 animate-spin" />
                )}
              </div>

              <div className="space-y-2 sm:space-y-3">
                {searchQuery.length < 2 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-gray-400 px-4">Escribe al menos 2 caracteres para buscar</p>
                  </div>
                ) : (!searchResults || searchResults.length === 0) && !searchLoading ? (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-sm sm:text-base text-gray-400">No se encontraron usuarios</p>
                  </div>
                ) : (
                  (searchResults || []).map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 sm:p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm sm:text-base text-white font-bold">
                            {user.username[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm sm:text-base text-white font-medium truncate">{user.username}</h4>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => sendFriendRequest(user._id)}
                        disabled={loading}
                        className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                      >
                        <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Agregar</span>
                        <span className="sm:hidden">+</span>
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
