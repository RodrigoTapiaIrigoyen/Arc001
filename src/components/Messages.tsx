import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Search, 
  ArrowLeft, 
  User, 
  Check, 
  CheckCheck,
  Loader,
  X,
  Circle,
  Users,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import api from '../services/api';
import socketClient from '../services/socket';
import toast from 'react-hot-toast';
import StatusBadge from './StatusBadge';
import StatusSelector from './StatusSelector';
import OnlineUsersPanel from './OnlineUsersPanel';

interface Conversation {
  conversationId: string;
  otherUser: {
    _id: string;
    username: string;
    email?: string;
  };
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: string;
    read: boolean;
  };
  unreadCount: number;
  updatedAt: string;
}

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  senderUsername: string;
  content: string;
  read: boolean;
  createdAt: string;
  isOwn: boolean;
}

interface SearchUser {
  _id: string;
  username: string;
  email: string;
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const activeConversationRef = useRef<Conversation | null>(null);
  
  // Mantener ref sincronizado
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, { status: 'online' | 'away' | 'busy' | 'dnd', username: string }>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [showOnlinePanel, setShowOnlinePanel] = useState(true);
  const [userStatus, setUserStatus] = useState<'online' | 'away' | 'busy' | 'dnd'>('online');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Conectar al WebSocket
    const token = localStorage.getItem('token');
    if (token && !socketClient.isConnected()) {
      socketClient.connect(token);
    }

    loadConversations();
    loadUnreadCount();

    // Setup WebSocket listeners
    setupSocketListeners();

    return () => {
      // Cleanup socket listeners
      cleanupSocketListeners();
      
      // Salir de conversación activa
      if (activeConversation) {
        socketClient.leaveConversation(activeConversation.otherUser._id);
      }
    };
  }, []);

  useEffect(() => {
    // Cuando cambia la conversación activa
    if (activeConversation) {
      socketClient.joinConversation(activeConversation.otherUser._id);
      loadMessages(activeConversation.otherUser._id);
    }

    return () => {
      if (activeConversation) {
        socketClient.leaveConversation(activeConversation.otherUser._id);
      }
    };
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    console.log('👥 onlineUsers cambió, tamaño:', onlineUsers.size);
    console.log('👥 Usuarios en Map:', Array.from(onlineUsers.entries()));
  }, [onlineUsers]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const setupSocketListeners = () => {
    // Estado de conexión
    socketClient.on('connection-status', (data: any) => {
      console.log('🔌 Estado de conexión:', data.connected);
      setIsConnected(data.connected);
      if (data.connected) {
        toast.success('Conectado al chat en tiempo real');
      }
    });

    // Usuarios online con estados
    socketClient.on('online-users', (users: any[]) => {
      console.log('👥 Lista de usuarios online recibida:', users.length);
      console.log('👥 Usuarios:', users);
      const usersMap = new Map();
      users.forEach((u: any) => {
        usersMap.set(u.userId, { status: u.status || 'online', username: u.username });
      });
      setOnlineUsers(usersMap);
      console.log('👥 OnlineUsers Map actualizado, tamaño:', usersMap.size);
    });

    socketClient.on('user-online', (data: any) => {
      console.log('✅ Usuario online:', data.username, data.userId);
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(data.userId, { status: data.status || 'online', username: data.username });
        console.log('👥 Usuario agregado al Map, tamaño:', newMap.size);
        return newMap;
      });
    });

    socketClient.on('user-offline', (data: any) => {
      console.log('❌ Usuario offline:', data.username, data.userId);
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        console.log('👥 Usuario eliminado del Map, tamaño:', newMap.size);
        return newMap;
      });
    });

    // Cambio de estado de usuario
    socketClient.on('user-status-changed', (data: any) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        const userData = newMap.get(data.userId);
        if (userData) {
          newMap.set(data.userId, { ...userData, status: data.status });
        }
        return newMap;
      });
    });

    // Nuevo mensaje recibido
    socketClient.on('new-message', (data: any) => {
      console.log('📨 Mensaje recibido:', data);
      
      // Si es de la conversación activa, agregarlo
      const currentActive = activeConversationRef.current;
      if (currentActive && data.senderId === currentActive.otherUser._id) {
        console.log('✅ Agregando mensaje a conversación activa');
        setMessages(prev => {
          // Evitar duplicados
          const exists = prev.some(msg => msg._id === data._id);
          if (exists) return prev;
          return [...prev, data];
        });
        
        // Marcar como leído automáticamente
        socketClient.markMessageAsRead(data._id, data.senderId);
      } else {
        console.log('📬 Mensaje de otra conversación, actualizando lista');
      }

      // Actualizar conversaciones
      loadConversations();
      loadUnreadCount();

      // Notificación sonora (opcional)
      playNotificationSound();
    });

    // Mensaje enviado (confirmación)
    socketClient.on('message-sent', (data: any) => {
      console.log('📤 Confirmación de mensaje enviado:', data);
      const currentActive = activeConversationRef.current;
      if (currentActive && data.receiverId === currentActive.otherUser._id) {
        setMessages(prev => {
          // Evitar duplicados
          const exists = prev.some(msg => msg._id === data._id);
          if (exists) return prev;
          return [...prev, data];
        });
      }
      loadConversations();
    });

    // Mensaje leído
    socketClient.on('message-read', (data: any) => {
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId ? { ...msg, read: true } : msg
      ));
    });

    // Usuario escribiendo
    socketClient.on('user-typing', (data: any) => {
      const currentActive = activeConversationRef.current;
      if (currentActive && data.userId === currentActive.otherUser._id) {
        setTypingUsers(prev => new Set(prev).add(data.userId));
      }
    });

    // Usuario dejó de escribir
    socketClient.on('user-stopped-typing', (data: any) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    // Notificación de nueva oferta de trade
    socketClient.on('new-trade-offer', (data: any) => {
      toast.success(data.message || 'Nueva oferta de intercambio');
      playNotificationSound();
    });

    // Notificación genérica
    socketClient.on('new-notification', (data: any) => {
      toast(data.message, { icon: '🔔' });
    });
  };

  const cleanupSocketListeners = () => {
    socketClient.off('connection-status');
    socketClient.off('online-users');
    socketClient.off('user-online');
    socketClient.off('user-offline');
    socketClient.off('user-status-changed');
    socketClient.off('new-message');
    socketClient.off('message-sent');
    socketClient.off('message-read');
    socketClient.off('user-typing');
    socketClient.off('user-stopped-typing');
    socketClient.off('new-trade-offer');
    socketClient.off('new-notification');
  };

  const playNotificationSound = () => {
    // Opcional: reproducir sonido de notificación
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (error) {
      // Ignorar si falla
    }
  };

  const loadConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      console.log('📋 Conversaciones recibidas:', response.conversations?.length || 0);
      console.log('📋 Datos completos:', JSON.stringify(response.conversations, null, 2));
      const loadedConversations = response.conversations || [];
      
      if (loadedConversations.length === 0) {
        console.warn('⚠️ No se recibieron conversaciones del backend');
      }
      
      setConversations(loadedConversations);
      
      // Si hay una conversación activa temporal, actualizarla con la real
      if (activeConversation && activeConversation.conversationId.startsWith('temp_')) {
        const realConversation = loadedConversations.find(
          (c: Conversation) => c.otherUser._id === activeConversation.otherUser._id
        );
        if (realConversation) {
          console.log('✅ Actualizando conversación temporal a real');
          setActiveConversation(realConversation);
        }
      }
    } catch (error: any) {
      console.error('❌ Error al cargar conversaciones:', error);
      console.error('Detalles del error:', error.response || error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await api.get('/messages/unread/count');
      setUnreadCount(response.count || 0);
    } catch (error) {
      console.error('Error al cargar contador:', error);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    try {
      const response = await api.get(`/messages/conversation/${otherUserId}`);
      setMessages(response.messages || []);

      // Marcar conversación como leída
      await api.patch(`/messages/conversation/${otherUserId}/read`);
      
      // Actualizar conversaciones
      loadConversations();
      loadUnreadCount();
    } catch (error: any) {
      console.error('Error al cargar mensajes:', error);
      toast.error('Error al cargar mensajes');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !activeConversation || sending) return;

    setSending(true);
    const receiverId = activeConversation.otherUser._id;

    try {
      // Enviar a través de WebSocket en lugar de HTTP
      if (socketClient.isConnected()) {
        socketClient.sendMessage(receiverId, messageInput.trim());
        setMessageInput('');
        
        // Detener indicador de escritura
        socketClient.stopTyping(receiverId);
        
        // Recargar conversaciones después de un breve delay para obtener la conversación real
        setTimeout(async () => {
          await loadConversations();
        }, 500);
      } else {
        // Fallback a HTTP si no hay conexión WebSocket
        await api.post('/messages', {
          receiverId: receiverId,
          content: messageInput.trim()
        });

        setMessageInput('');
        await loadMessages(receiverId);
        await loadConversations();
        toast.success('Mensaje enviado');
      }
    } catch (error: any) {
      console.error('Error al enviar mensaje:', error);
      toast.error(error.message || 'Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (value: string) => {
    setMessageInput(value);

    if (!activeConversation) return;

    // Enviar indicador de "escribiendo"
    if (value.trim().length > 0) {
      socketClient.startTyping(activeConversation.otherUser._id);

      // Limpiar timeout anterior
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Detener indicador después de 2 segundos sin escribir
      typingTimeoutRef.current = setTimeout(() => {
        socketClient.stopTyping(activeConversation.otherUser._id);
      }, 2000);
    } else {
      socketClient.stopTyping(activeConversation.otherUser._id);
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    try {
      const response = await api.get(`/messages/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.users || []);
    } catch (error: any) {
      console.error('Error al buscar usuarios:', error);
      toast.error('Error al buscar usuarios');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user: SearchUser) => {
    // Buscar si ya existe una conversación con este usuario
    const existingConversation = conversations.find(
      (c) => c.otherUser._id === user._id
    );
    
    if (existingConversation) {
      // Usar la conversación existente
      console.log('✅ Conversación existente encontrada desde búsqueda');
      setActiveConversation(existingConversation);
      loadMessages(user._id);
    } else {
      // Crear conversación temporal solo si no existe
      console.log('🆕 Creando conversación temporal desde búsqueda');
      const tempConversation: Conversation = {
        conversationId: `temp_${user._id}`,
        otherUser: {
          _id: user._id,
          username: user.username,
          email: user.email
        },
        lastMessage: {
          content: '',
          senderId: '',
          createdAt: new Date().toISOString(),
          read: true
        },
        unreadCount: 0,
        updatedAt: new Date().toISOString()
      };

      setActiveConversation(tempConversation);
      setMessages([]);
    }
    
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('es-ES', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader className="animate-spin text-yellow-400" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-[#0f1420]/80 backdrop-blur-xl border border-red-500/20 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500/10 to-yellow-500/10 border-b border-yellow-500/30 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <MessageSquare className="text-yellow-400" size={32} />
              <div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-green-500">
                  Mensajes
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-yellow-400">
                    {unreadCount} mensaje{unreadCount !== 1 ? 's' : ''} sin leer
                  </p>
                )}
              </div>
              {isConnected && (
                <StatusSelector 
                  currentStatus={userStatus} 
                  onChange={setUserStatus}
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOnlinePanel(!showOnlinePanel)}
                className="px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold rounded-lg hover:bg-cyan-500/20 transition-all flex items-center gap-2"
                title="Ver usuarios online"
              >
                <Users size={18} />
                <span className="hidden sm:inline">({onlineUsers.size})</span>
              </button>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all"
              >
                Nuevo mensaje
              </button>
            </div>
          </div>
        </div>

        {/* Search Modal */}
        {showSearch && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f1420] border border-yellow-500/30 rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-yellow-400">Buscar Usuario</h3>
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  placeholder="Buscar por usuario o email..."
                  className="w-full bg-[#1a1f2e] border border-yellow-500/20 rounded-lg pl-10 pr-4 py-3 text-white focus:border-yellow-500/50 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {searching ? (
                  <div className="text-center py-8">
                    <Loader className="animate-spin text-yellow-400 mx-auto" size={24} />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <button
                      key={user._id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 p-3 bg-[#1a1f2e] hover:bg-[#252b3b] border border-blue-500/10 rounded-lg transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-bold text-white">{user.username}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </button>
                  ))
                ) : searchQuery.length >= 2 ? (
                  <div className="text-center py-8 text-gray-400">
                    No se encontraron usuarios
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    Escribe al menos 2 caracteres
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
          {/* Conversations List */}
          <div className="md:col-span-1 border-r border-red-500/20 overflow-y-auto">
            {(() => {
              console.log('🎨 Renderizando conversaciones:', conversations.length);
              return null;
            })()}
            {conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="text-gray-600 mx-auto mb-4" size={48} />
                <p className="text-gray-400 mb-2">No tienes conversaciones</p>
                <p className="text-sm text-gray-500">Inicia una nueva conversación</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.conversationId}
                  onClick={() => {
                    setActiveConversation(conv);
                    loadMessages(conv.otherUser._id);
                  }}
                  className={`w-full p-4 border-b border-yellow-500/10 hover:bg-yellow-500/5 transition-all text-left ${
                    activeConversation?.conversationId === conv.conversationId
                      ? 'bg-yellow-500/10 border-l-4 border-l-yellow-500'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                      <User size={24} className="text-white" />
                      {/* Status indicator */}
                      {onlineUsers.has(conv.otherUser._id) && (
                        <div className="absolute bottom-0 right-0">
                          <StatusBadge 
                            status={onlineUsers.get(conv.otherUser._id)?.status || 'online'} 
                            size="sm" 
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold truncate ${conv.unreadCount > 0 ? 'text-yellow-400' : 'text-white'}`}>
                          {conv.otherUser.username}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-gray-300 font-medium' : 'text-gray-500'}`}>
                          {conv.lastMessage.content || 'Nueva conversación'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded-full flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Messages Area */}
          <div className="md:col-span-2 flex flex-col">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-green-500/10 border-b border-green-500/20 flex items-center gap-3">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="text-gray-400 hover:text-yellow-400 transition-colors group"
                    title="Regresar a conversaciones"
                  >
                    <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                    <User size={20} className="text-white" />
                    {/* Status indicator */}
                    {onlineUsers.has(activeConversation.otherUser._id) && (
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <StatusBadge 
                          status={onlineUsers.get(activeConversation.otherUser._id)?.status || 'online'} 
                          size="sm" 
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{activeConversation.otherUser.username}</h3>
                    <p className="text-xs text-gray-400">
                      {onlineUsers.has(activeConversation.otherUser._id) ? (
                        <StatusBadge 
                          status={onlineUsers.get(activeConversation.otherUser._id)?.status || 'online'} 
                          size="sm" 
                          showLabel 
                        />
                      ) : (
                        activeConversation.otherUser.email
                      )}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <MessageSquare className="mx-auto mb-2 text-gray-600" size={32} />
                      Escribe el primer mensaje
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div
                        key={msg._id}
                        className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${msg.isOwn ? 'order-2' : 'order-1'}`}>
                          {!msg.isOwn && (
                            <div className="text-xs text-gray-400 mb-1 ml-2">
                              {msg.senderUsername}
                            </div>
                          )}
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              msg.isOwn
                                ? 'bg-gradient-to-r from-yellow-500 to-green-500 text-black'
                                : 'bg-[#1a1f2e] text-white border border-blue-500/20'
                            }`}
                          >
                            <p className="break-words">{msg.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${msg.isOwn ? 'text-black/70' : 'text-gray-500'}`}>
                              <span>{formatTime(msg.createdAt)}</span>
                              {msg.isOwn && (
                                msg.read ? <CheckCheck size={14} /> : <Check size={14} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 bg-[#0a0e1a] border-t border-yellow-500/20">
                  {/* Typing indicator */}
                  {typingUsers.has(activeConversation.otherUser._id) && (
                    <div className="mb-2 text-sm text-yellow-400 flex items-center gap-2">
                      <Loader className="animate-spin" size={14} />
                      {activeConversation.otherUser.username} está escribiendo...
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => handleTyping(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 bg-[#1a1f2e] border border-green-500/20 rounded-lg px-4 py-3 text-white focus:border-green-500/50 focus:outline-none"
                      maxLength={1000}
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim() || sending}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {sending ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                  </div>
                  
                  {/* Connection status */}
                  {!isConnected && (
                    <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                      <Circle size={8} fill="currentColor" />
                      Modo offline - Los mensajes se enviarán cuando te reconectes
                    </div>
                  )}
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquare className="mx-auto mb-4 text-gray-600" size={64} />
                  <p className="text-xl mb-2">Selecciona una conversación</p>
                  <p className="text-sm text-gray-500">o inicia una nueva</p>
                </div>
              </div>
            )}
          </div>

          {/* Online Users Panel */}
          {showOnlinePanel && (
            <div className="hidden md:block">
              <OnlineUsersPanel
                users={onlineUsers}
                onUserClick={(userId, username) => {
                  // Buscar si ya existe una conversación con este usuario
                  const existingConversation = conversations.find(
                    (c) => c.otherUser._id === userId
                  );
                  
                  if (existingConversation) {
                    // Usar la conversación existente
                    console.log('✅ Conversación existente encontrada');
                    setActiveConversation(existingConversation);
                    loadMessages(userId);
                  } else {
                    // Crear conversación temporal solo si no existe
                    console.log('🆕 Creando conversación temporal');
                    const tempConversation: Conversation = {
                      conversationId: `temp_${userId}`,
                      otherUser: {
                        _id: userId,
                        username: username
                      },
                      lastMessage: {
                        content: '',
                        senderId: '',
                        createdAt: new Date().toISOString(),
                        read: true
                      },
                      unreadCount: 0,
                      updatedAt: new Date().toISOString()
                    };
                    setActiveConversation(tempConversation);
                    setMessages([]); // Limpiar mensajes para nueva conversación
                  }
                  setShowOnlinePanel(false); // Cerrar en mobile
                }}
                onClose={() => setShowOnlinePanel(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
