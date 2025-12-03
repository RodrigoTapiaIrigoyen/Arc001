import { io, Socket } from 'socket.io-client';
import { notificationService } from './notifications';

class SocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    // Inicializar listeners map
    this.listeners = new Map();
  }

  /**
   * Conectar al servidor WebSocket
   */
  connect(token: string) {
    // Si ya hay un socket conectado con el mismo token, no reconectar
    if (this.socket && this.socket.connected && this.token === token) {
      console.log('✅ Socket ya conectado, reutilizando conexión');
      return;
    }

    // Si hay un socket pero no está conectado o es diferente token, desconectar
    if (this.socket) {
      console.log('🔄 Desconectando socket anterior...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.token = token;
    // Socket.io debe conectarse a la raíz del servidor, NO a /api
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const serverUrl = apiUrl.replace('/api', '');

    console.log('🔌 Conectando WebSocket a:', serverUrl);
    console.log('🔑 Token recibido:', token ? 'SÍ (length: ' + token.length + ')' : 'NO');

    this.socket = io(serverUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      transports: ['polling', 'websocket'], // Polling primero, luego upgrade
      forceNew: true,
      withCredentials: false,
      autoConnect: true,
      timeout: 20000
    });

    this.setupEventListeners();
  }

  /**
   * Configurar listeners del socket
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Conectado a WebSocket');
      console.log('🌐 Socket ID:', this.socket?.id);
      console.log('🔗 URL del socket:', this.socket?.io.uri);
      this.reconnectAttempts = 0;
      this.emit('connection-status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Desconectado de WebSocket:', reason);
      this.emit('connection-status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('❌ Error de conexión WebSocket:', error.message);
      
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Máximo de intentos de reconexión alcanzado');
        this.emit('connection-failed', { error: error.message });
      }
    });

    // Listeners de eventos del servidor
    this.socket.on('user-online', (data) => {
      console.log('👤 Socket recibió user-online:', data);
      this.emit('user-online', data);
    });

    this.socket.on('user-offline', (data) => {
      console.log('👤 Socket recibió user-offline:', data);
      this.emit('user-offline', data);
    });

    this.socket.on('online-users', (data) => {
      console.log('👥 Socket recibió online-users, cantidad:', data?.length || 0);
      this.emit('online-users', data);
    });

    this.socket.on('user-status-changed', (data) => {
      this.emit('user-status-changed', data);
    });

    this.socket.on('new-message', (data) => {
      console.log('📨 Socket recibió new-message:', data);
      // Mostrar notificación del navegador
      notificationService.showMessageNotification(
        data.sender?.username || 'Usuario',
        data.content
      );
      this.emit('new-message', data);
    });

    this.socket.on('message-sent', (data) => {
      console.log('✅ Socket recibió message-sent:', data);
      this.emit('message-sent', data);
    });

    this.socket.on('message-read', (data) => {
      this.emit('message-read', data);
    });

    this.socket.on('message-error', (data) => {
      this.emit('message-error', data);
    });

    this.socket.on('user-typing', (data) => {
      this.emit('user-typing', data);
    });

    this.socket.on('user-stopped-typing', (data) => {
      this.emit('user-stopped-typing', data);
    });

    this.socket.on('conversation-updated', (data) => {
      this.emit('conversation-updated', data);
    });

    this.socket.on('new-notification', (data) => {
      this.emit('new-notification', data);
    });

    this.socket.on('new-trade-offer', (data) => {
      // Notificación de nueva oferta
      notificationService.showOfferNotification(
        'new',
        data.listing?.item_name || 'un ítem',
        data.buyer?.username
      );
      this.emit('new-trade-offer', data);
    });

    this.socket.on('trade-offer-updated', (data) => {
      // Notificación según el tipo de actualización
      const type = data.status === 'accepted' ? 'accepted' 
                 : data.status === 'rejected' ? 'rejected'
                 : 'countered';
      
      notificationService.showOfferNotification(
        type,
        data.listing?.item_name || 'un ítem',
        data.seller?.username || data.buyer?.username
      );
      this.emit('trade-offer-updated', data);
    });
  }

  /**
   * Desconectar del servidor
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('Socket desconectado');
    }
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Unirse a una conversación
   */
  joinConversation(otherUserId: string) {
    this.socket?.emit('join-conversation', otherUserId);
  }

  /**
   * Salir de una conversación
   */
  leaveConversation(otherUserId: string) {
    this.socket?.emit('leave-conversation', otherUserId);
  }

  /**
   * Enviar mensaje
   */
  sendMessage(receiverId: string, content: string) {
    this.socket?.emit('send-message', { receiverId, content });
  }

  /**
   * Notificar que el usuario está escribiendo
   */
  startTyping(otherUserId: string) {
    this.socket?.emit('typing-start', { otherUserId });
  }

  /**
   * Notificar que el usuario dejó de escribir
   */
  stopTyping(otherUserId: string) {
    this.socket?.emit('typing-stop', { otherUserId });
  }

  /**
   * Cambiar estado del usuario
   */
  changeStatus(status: 'online' | 'away' | 'busy' | 'dnd') {
    this.socket?.emit('change-status', status);
  }

  /**
   * Solicitar lista de usuarios online
   */
  requestOnlineUsers() {
    console.log('📞 Solicitando lista de usuarios online...');
    this.socket?.emit('get-online-users');
  }

  /**
   * Marcar mensaje como leído
   */
  markMessageAsRead(messageId: string, senderId: string) {
    this.socket?.emit('mark-read', { messageId, senderId });
  }

  /**
   * Suscribirse a un evento
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Desuscribirse de un evento
   */
  off(event: string, callback?: Function) {
    if (!callback) {
      this.listeners.delete(event);
    } else {
      this.listeners.get(event)?.delete(callback);
    }
  }

  /**
   * Emitir evento a los listeners locales
   */
  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en listener de ${event}:`, error);
        }
      });
    }
  }

  /**
   * Obtener el socket (para casos avanzados)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Singleton instance
const socketClient = new SocketClient();

export default socketClient;
