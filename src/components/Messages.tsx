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
import GuestBanner from './GuestBanner';

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

interface MessagesProps {
  user?: any;
  onSwitchToRegister?: () => void;
  onSwitchToLogin?: () => void;
}

export default function Messages({ user, onSwitchToRegister, onSwitchToLogin }: MessagesProps = {}) {
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
    // Setup WebSocket listeners PRIMERO
    setupSocketListeners();

    // Conectar al WebSocket DESPUÉS de configurar listeners
    const token = localStorage.getItem('token');
    console.log('🔌 Verificando conexión WebSocket...');
    console.log('🔌 Token existe:', !!token);
    console.log('🔌 Socket conectado:', socketClient.isConnected());
    
    if (token && !socketClient.isConnected()) {
      console.log('🔌 Conectando socket...');
      socketClient.connect(token);
    }

    // Solicitar lista de usuarios online si ya está conectado
    if (socketClient.isConnected()) {
      console.log('📞 Socket ya conectado, solicitando usuarios online...');
      socketClient.requestOnlineUsers();
      
      // Reintentar después de 2 segundos si no recibe respuesta
      setTimeout(() => {
        console.log('🔄 Reintentando solicitud de usuarios online...');
        socketClient.requestOnlineUsers();
      }, 2000);
    }

    loadConversations();
    loadUnreadCount();

    // Verificar si hay un usuario seleccionado desde Friends
    const selectedUserId = localStorage.getItem('selectedUserId');
    const selectedUsername = localStorage.getItem('selectedUsername');
    
    if (selectedUserId && selectedUsername) {
      console.log('👤 Usuario seleccionado desde Friends:', selectedUsername);
      // Crear o buscar conversación con ese usuario
      startConversationWithUser(selectedUserId, selectedUsername);
      // Limpiar el localStorage
      localStorage.removeItem('selectedUserId');
      localStorage.removeItem('selectedUsername');
    }

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
        console.log('📞 Socket conectado, solicitando usuarios online...');
        socketClient.requestOnlineUsers();
        // toast.success('Conectado al chat en tiempo real');
      }
    });

    // Usuarios online con estados
    socketClient.on('online-users', (users: any[]) => {
      console.log('👥 Lista de usuarios online recibida:', users?.length || 0);
      console.log('👥 Usuarios completos:', JSON.stringify(users, null, 2));
      const usersMap = new Map();
      users?.forEach((u: any) => {
        console.log('👥 Agregando usuario al Map:', u.userId, u.username, u.status);
        usersMap.set(u.userId, { status: u.status || 'online', username: u.username });
      });
      console.log('👥 Map creado con tamaño:', usersMap.size);
      console.log('👥 Contenido del Map:', Array.from(usersMap.entries()));
      setOnlineUsers(usersMap);
      console.log('👥 setOnlineUsers llamado');
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
      // toast.success(data.message || 'Nueva oferta de intercambio');
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
      // toast.error('Error al cargar mensajes');
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
        // toast.success('Mensaje enviado');
      }
    } catch (error: any) {
      console.error('Error al enviar mensaje:', error);
      // toast.error(error.message || 'Error al enviar mensaje');
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
      // toast.error('Error al buscar usuarios');
    } finally {
      setSearching(false);
    }
  };

  const startConversationWithUser = (userId: string, username: string) => {
    // Buscar si ya existe una conversación con este usuario
    const existingConversation = conversations.find(
      (c) => c.otherUser._id === userId
    );
    
    if (existingConversation) {
      console.log('✅ Conversación existente encontrada desde Friends');
      setActiveConversation(existingConversation);
      loadMessages(userId);
    } else {
      console.log('🆕 Creando conversación temporal desde Friends');
      const tempConversation: Conversation = {
        conversationId: `temp_${userId}`,
        otherUser: {
          _id: userId,
          username: username,
          email: ''
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

  // Si no hay usuario (modo guest), mostrar banner
  if (!user) {
    return (
      <GuestBanner 
        message="Necesitas una cuenta para enviar y recibir mensajes con otros Raiders."
        onRegister={onSwitchToRegister || (() => {})}
        onLogin={onSwitchToLogin || (() => {})}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader className="animate-spin text-yellow-400" size={32} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0f1420]">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500/10 via-yellow-500/10 to-green-500/10 border-b border-yellow-500/20 px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-yellow-500 rounded-lg">
              <MessageSquare className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-green-500">
                Mensajes
              </h1>
              {unreadCount > 0 && (
                <p className="text-xs text-yellow-300 font-semibold">
                  {unreadCount} sin leer
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected && (
              <StatusSelector 
                currentStatus={userStatus} 
                onChange={setUserStatus}
              />
            )}
            <button
              onClick={() => setShowOnlinePanel(!showOnlinePanel)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold rounded-lg transition-all"
              title="Ver usuarios online"
            >
              <Users size={18} />
              <span className="text-sm">({onlineUsers.size})</span>
            </button>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-green-500/50 transition-all"
            >
              + Nuevo
            </button>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#1a1f2e] to-[#0f1420] border border-yellow-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-yellow-500/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-yellow-400">Buscar usuario</h3>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="p-1 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-400 hover:text-red-400" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                placeholder="Username, email..."
                className="w-full bg-[#0a0e1a] border border-yellow-500/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:border-yellow-500/60 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all"
                autoFocus
              />
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {searching ? (
                <div className="text-center py-8">
                  <Loader className="animate-spin text-yellow-400 mx-auto" size={24} />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(user => (
                  <button
                    key={user._id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 p-3 bg-[#0a0e1a] hover:bg-[#151a2a] border border-blue-500/20 hover:border-blue-500/40 rounded-lg transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center flex-shrink-0 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all">
                      <User size={20} className="text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-bold text-white group-hover:text-yellow-400 transition-colors">{user.username}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </button>
                ))
              ) : searchQuery.length >= 2 ? (
                <div className="text-center py-8 text-gray-500">
                  <User size={32} className="mx-auto mb-2 text-gray-700" />
                  No hay usuarios
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <Search size={32} className="mx-auto mb-2 text-gray-700" />
                  Escribe para buscar
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden bg-[#0a0e1a]">
        {/* Conversations Sidebar */}
        <div className={`w-full md:w-80 bg-gradient-to-b from-[#151a2a] to-[#0f1420] border-r border-red-500/20 flex flex-col ${ activeConversation ? 'hidden md:flex' : ''}`}>
          {/* Search Bar Sidebar */}
          <div className="p-3 border-b border-red-500/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <input
                type="text"
                placeholder="Filtrar conversaciones..."
                className="w-full bg-[#0a0e1a] border border-yellow-500/20 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-700 focus:border-yellow-500/40 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                  <MessageSquare className="text-blue-400" size={32} />
                </div>
                <p className="text-gray-400 font-semibold">No hay conversaciones</p>
                <p className="text-xs text-gray-600 mt-1">Inicia una nueva conversación</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.conversationId}
                  onClick={() => {
                    setActiveConversation(conv);
                    loadMessages(conv.otherUser._id);
                  }}
                  className={`w-full px-4 py-3 border-b border-red-500/10 hover:bg-red-500/5 transition-colors text-left group ${
                    activeConversation?.conversationId === conv.conversationId
                      ? 'bg-yellow-500/10 border-l-4 border-l-yellow-500'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      {/* Status indicator */}
                      {onlineUsers.has(conv.otherUser._id) && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-[#0f1420]" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`font-semibold truncate ${conv.unreadCount > 0 ? 'text-yellow-400' : 'text-white'}`}>
                          {conv.otherUser.username}
                        </span>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-gray-200 font-medium' : 'text-gray-600'}`}>
                          {conv.lastMessage.content || 'Nueva conversación'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 w-5 h-5 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
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
        </div>

        {/* Chat Area */}
        <div className="flex-1 md:col-span-2 flex flex-col bg-[#0a0e1a]">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-yellow-500/5 to-green-500/5 border-b border-green-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden text-gray-400 hover:text-yellow-400 transition-colors p-1"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  
                  {/* Chat User Info */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                    {onlineUsers.has(activeConversation.otherUser._id) && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-[#0a0e1a]" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-white">{activeConversation.otherUser.username}</h3>
                    <p className="text-xs text-gray-500">
                      {onlineUsers.has(activeConversation.otherUser._id) ? (
                        <span className="text-green-400">● En línea</span>
                      ) : (
                        'Desconectado'
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveConversation(null)}
                  className="text-gray-400 hover:text-red-400 transition-colors p-1"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-yellow-500/20 scrollbar-track-transparent">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                      <MessageSquare className="text-green-400" size={40} />
                    </div>
                    <p className="text-gray-400 font-semibold">Inicia la conversación</p>
                    <p className="text-xs text-gray-600 mt-1">Envía el primer mensaje</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg._id}
                      className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${msg.isOwn ? '' : 'mr-auto'}`}>
                        {!msg.isOwn && (
                          <div className="text-xs text-gray-500 mb-1.5 ml-1">
                            {msg.senderUsername}
                          </div>
                        )}
                        <div
                          className={`px-4 py-2.5 rounded-2xl break-words ${
                            msg.isOwn
                              ? 'bg-gradient-to-r from-yellow-500 to-green-500 text-black rounded-br-none shadow-lg shadow-yellow-500/20'
                              : 'bg-[#151a2a] text-white border border-blue-500/20 rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <div className={`flex items-center justify-end gap-1 mt-2 text-xs ${msg.isOwn ? 'text-black/60' : 'text-gray-500'}`}>
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

              {/* Typing Indicator */}
              {typingUsers.has(activeConversation.otherUser._id) && (
                <div className="px-6 py-2 text-sm text-yellow-400 flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </span>
                  <span>{activeConversation.otherUser.username} está escribiendo...</span>
                </div>
              )}

              {/* Input Area */}
              <div className="px-6 py-4 bg-gradient-to-t from-[#0f1420] to-[#0a0e1a] border-t border-yellow-500/20">
                {!isConnected && (
                  <div className="mb-3 text-xs text-red-400 flex items-center gap-2 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                    <Circle size={6} fill="currentColor" />
                    Modo offline - Se enviará cuando te reconectes
                  </div>
                )}
                
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => handleTyping(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-[#151a2a] border border-green-500/20 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all disabled:opacity-50"
                    maxLength={1000}
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sending}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {sending ? (
                      <Loader className="animate-spin" size={18} />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#151a2a] to-[#0a0e1a]">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500/20 to-green-500/20 flex items-center justify-center mb-6">
                <MessageSquare className="text-yellow-400" size={48} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Selecciona una conversación</h3>
              <p className="text-gray-500 text-sm">O inicia una nueva para comenzar a chatear</p>
            </div>
          )}
        </div>

        {/* Online Users Panel - Desktop */}
        {showOnlinePanel && (
          <div className="hidden md:flex md:w-64 bg-gradient-to-b from-[#151a2a] to-[#0f1420] border-l border-cyan-500/20 flex-col">
            <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between">
              <h3 className="font-bold text-cyan-400 flex items-center gap-2">
                <Users size={18} />
                En línea ({onlineUsers.size})
              </h3>
              <button
                onClick={() => setShowOnlinePanel(false)}
                className="text-gray-400 hover:text-cyan-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 p-3">
              {onlineUsers.size === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <Users size={32} className="mx-auto mb-2 text-gray-700" />
                  <p className="text-xs">Sin usuarios en línea</p>
                </div>
              ) : (
                Array.from(onlineUsers.entries()).map(([userId, user]) => (
                  <button
                    key={userId}
                    onClick={() => {
                      const existingConv = conversations.find((c) => c.otherUser._id === userId);
                      if (existingConv) {
                        setActiveConversation(existingConv);
                        loadMessages(userId);
                      } else {
                        setActiveConversation({
                          conversationId: `temp_${userId}`,
                          otherUser: {
                            _id: userId,
                            username: user.username
                          },
                          lastMessage: {
                            content: '',
                            senderId: '',
                            createdAt: new Date().toISOString(),
                            read: true
                          },
                          unreadCount: 0,
                          updatedAt: new Date().toISOString()
                        });
                        setMessages([]);
                      }
                    }}
                    className="w-full flex items-center gap-2 p-2 bg-[#0a0e1a] hover:bg-[#151a2a] rounded-lg transition-all group border border-cyan-500/10 hover:border-cyan-500/30"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                        <User size={16} className="text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0f1420]" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                        {user.username}
                      </p>
                      <p className="text-xs text-gray-600">
                        {user.status === 'online' ? '🟢 En línea' : user.status === 'away' ? '🟡 Ausente' : user.status === 'busy' ? '🔴 Ocupado' : '⚫ No molestar'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
