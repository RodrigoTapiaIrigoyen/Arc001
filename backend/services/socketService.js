import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

class SocketService {
  constructor(server, messageService, notificationService) {
    // Configurar orígenes permitidos
    const allowedOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];

    this.io = new Server(server, {
      cors: {
        origin: (origin, callback) => {
          // Permitir requests sin origin
          if (!origin) return callback(null, true);
          
          // Verificar si está en la lista permitida
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          
          // Permitir localhost en desarrollo (incluyendo 127.0.0.1)
          if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
            return callback(null, true);
          }
          
          // Permitir cualquier Vercel origin
          if (origin && origin.includes('vercel.app')) {
            return callback(null, true);
          }
          
          console.warn('⚠️ Socket.io CORS rechazado:', origin);
          callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['polling', 'websocket'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.messageService = messageService;
    this.notificationService = notificationService;
    
    // Tracking de usuarios conectados
    this.onlineUsers = new Map(); // userId -> { socketId, status, lastSeen }
    this.typingUsers = new Map(); // conversationId -> Set of userIds
    
    // Manejador de errores global
    this.io.engine.on("connection_error", (err) => {
      console.error('⚠️ Socket.io connection_error:', err.message);
    });
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Middleware de autenticación para sockets
   */
  setupMiddleware() {
    // Autenticación se maneja en el evento 'connection'
    // No necesitamos middleware aquí
  }

  /**
   * Configurar event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      // Validar token
      const token = socket.handshake.auth.token;
      const jwtSecret = process.env.JWT_SECRET || 'arc-raiders-super-secret-key-change-in-production-2024';
      
      if (!token) {
        console.log('⚠️ Socket connection without token');
        socket.disconnect(true);
        return;
      }

      try {
        const decoded = jwt.verify(token, jwtSecret);
        socket.userId = decoded.userId;
        socket.username = decoded.username;
        socket.isAuthenticated = true;
        
        console.log(`✅ Usuario conectado: ${socket.username} (${socket.userId})`);
      } catch (jwtError) {
        console.error('❌ Invalid JWT token:', jwtError.message);
        socket.disconnect(true);
        return;
      }
      
      // Registrar usuario online
      this.handleUserOnline(socket);

      // Event: Usuario se une a una conversación
      socket.on('join-conversation', (otherUserId) => {
        this.handleJoinConversation(socket, otherUserId);
      });

      // Event: Usuario sale de una conversación
      socket.on('leave-conversation', (otherUserId) => {
        this.handleLeaveConversation(socket, otherUserId);
      });

      // Event: Enviar mensaje
      socket.on('send-message', async (data) => {
        await this.handleSendMessage(socket, data);
      });

      // Event: Usuario está escribiendo
      socket.on('typing-start', (data) => {
        this.handleTypingStart(socket, data);
      });

      // Event: Usuario dejó de escribir
      socket.on('typing-stop', (data) => {
        this.handleTypingStop(socket, data);
      });

      // Event: Cambiar estado (online, away, busy)
      socket.on('change-status', (status) => {
        this.handleChangeStatus(socket, status);
      });

      // Event: Solicitar lista de usuarios online
      socket.on('get-online-users', () => {
        this.handleGetOnlineUsers(socket);
      });

      // Event: Marcar mensaje como leído
      socket.on('mark-read', async (data) => {
        await this.handleMarkRead(socket, data);
      });

      // Event: Desconexión
      socket.on('disconnect', () => {
        this.handleUserOffline(socket);
      });
    });
  }

  /**
   * Manejar usuario online
   */
  handleUserOnline(socket) {
    this.onlineUsers.set(socket.userId, {
      socketId: socket.id,
      status: 'online',
      lastSeen: new Date(),
      username: socket.username
    });

    console.log(`👥 Total usuarios online: ${this.onlineUsers.size}`);
    console.log(`👥 Usuarios:`, Array.from(this.onlineUsers.keys()).map(id => {
      const user = this.onlineUsers.get(id);
      return `${user.username} (${id})`;
    }));

    // Emitir a todos los usuarios que este usuario está online
    this.io.emit('user-online', {
      userId: socket.userId,
      username: socket.username,
      status: 'online'
    });

    // Enviar lista de usuarios online al que se conectó
    const onlineUsersList = Array.from(this.onlineUsers.entries()).map(([userId, data]) => ({
      userId,
      username: data.username,
      status: data.status
    }));

    console.log(`📤 Enviando lista de ${onlineUsersList.length} usuarios online a ${socket.username}`);
    socket.emit('online-users', onlineUsersList);
  }

  /**
   * Manejar usuario offline
   */
  handleUserOffline(socket) {
    console.log(`❌ Usuario desconectado: ${socket.username} (${socket.userId})`);
    
    const userData = this.onlineUsers.get(socket.userId);
    if (userData) {
      // Actualizar last seen
      this.onlineUsers.set(socket.userId, {
        ...userData,
        status: 'offline',
        lastSeen: new Date()
      });

      // Emitir a todos que el usuario está offline
      this.io.emit('user-offline', {
        userId: socket.userId,
        username: socket.username,
        lastSeen: new Date()
      });

      // Remover después de 5 minutos para el cache
      setTimeout(() => {
        this.onlineUsers.delete(socket.userId);
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Enviar lista de usuarios online a solicitud
   */
  handleGetOnlineUsers(socket) {
    const onlineUsersList = Array.from(this.onlineUsers.entries()).map(([userId, data]) => ({
      userId,
      username: data.username,
      status: data.status
    }));

    console.log(`📤 Enviando lista actualizada de ${onlineUsersList.length} usuarios online a ${socket.username}`);
    socket.emit('online-users', onlineUsersList);
  }

  /**
   * Usuario se une a una conversación
   */
  handleJoinConversation(socket, otherUserId) {
    const conversationId = this.generateConversationId(socket.userId, otherUserId);
    socket.join(conversationId);
    console.log(`👥 ${socket.username} se unió a conversación: ${conversationId}`);
  }

  /**
   * Usuario sale de una conversación
   */
  handleLeaveConversation(socket, otherUserId) {
    const conversationId = this.generateConversationId(socket.userId, otherUserId);
    socket.leave(conversationId);
    
    // Limpiar typing si estaba escribiendo
    this.handleTypingStop(socket, { otherUserId });
    
    console.log(`👋 ${socket.username} salió de conversación: ${conversationId}`);
  }

  /**
   * Enviar mensaje en tiempo real
   */
  async handleSendMessage(socket, data) {
    try {
      const { receiverId, content } = data;
      
      // Guardar mensaje en DB
      const message = await this.messageService.sendMessage(
        socket.userId,
        receiverId,
        content
      );

      const conversationId = this.generateConversationId(socket.userId, receiverId);

      // Formatear mensaje para enviar
      const formattedMessage = {
        _id: message._id,
        senderId: socket.userId,
        receiverId: receiverId,
        senderUsername: socket.username,
        content: message.content,
        read: false,
        createdAt: message.createdAt,
        isOwn: false // Para el receptor
      };

      // Emitir mensaje al receptor si está conectado
      const receiverData = this.onlineUsers.get(receiverId);
      if (receiverData) {
        console.log(`📤 Enviando mensaje a ${receiverId} (socket: ${receiverData.socketId})`);
        this.io.to(receiverData.socketId).emit('new-message', {
          ...formattedMessage,
          conversationId
        });

        // Notificación en tiempo real
        this.io.to(receiverData.socketId).emit('new-notification', {
          type: 'message',
          title: `Nuevo mensaje de ${socket.username}`,
          message: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          from: socket.username,
          timestamp: new Date()
        });
      } else {
        console.log(`⚠️ Receptor ${receiverId} no está conectado`);
      }

      // También emitir al sender para confirmación
      console.log(`✅ Confirmando envío al sender ${socket.userId}`);
      socket.emit('message-sent', {
        ...formattedMessage,
        isOwn: true,
        conversationId
      });

      // Actualizar conversación en ambos lados
      this.io.to(conversationId).emit('conversation-updated', {
        conversationId,
        lastMessage: {
          content: message.content,
          senderId: socket.userId,
          createdAt: message.createdAt
        }
      });

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      socket.emit('message-error', { error: error.message });
    }
  }

  /**
   * Usuario comenzó a escribir
   */
  handleTypingStart(socket, data) {
    const { otherUserId } = data;
    const conversationId = this.generateConversationId(socket.userId, otherUserId);

    // Agregar a typing users
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }
    this.typingUsers.get(conversationId).add(socket.userId);

    // Notificar al otro usuario
    const otherUserData = this.onlineUsers.get(otherUserId);
    if (otherUserData) {
      this.io.to(otherUserData.socketId).emit('user-typing', {
        userId: socket.userId,
        username: socket.username,
        conversationId
      });
    }
  }

  /**
   * Usuario dejó de escribir
   */
  handleTypingStop(socket, data) {
    const { otherUserId } = data;
    const conversationId = this.generateConversationId(socket.userId, otherUserId);

    // Remover de typing users
    if (this.typingUsers.has(conversationId)) {
      this.typingUsers.get(conversationId).delete(socket.userId);
      
      if (this.typingUsers.get(conversationId).size === 0) {
        this.typingUsers.delete(conversationId);
      }
    }

    // Notificar al otro usuario
    const otherUserData = this.onlineUsers.get(otherUserId);
    if (otherUserData) {
      this.io.to(otherUserData.socketId).emit('user-stopped-typing', {
        userId: socket.userId,
        conversationId
      });
    }
  }

  /**
   * Cambiar estado del usuario
   */
  handleChangeStatus(socket, status) {
    const validStatuses = ['online', 'away', 'busy', 'dnd'];
    if (!validStatuses.includes(status)) {
      return socket.emit('error', { message: 'Estado inválido' });
    }

    const userData = this.onlineUsers.get(socket.userId);
    if (userData) {
      this.onlineUsers.set(socket.userId, {
        ...userData,
        status,
        lastSeen: new Date()
      });

      // Emitir cambio de estado
      this.io.emit('user-status-changed', {
        userId: socket.userId,
        username: socket.username,
        status
      });
    }
  }

  /**
   * Marcar mensaje como leído en tiempo real
   */
  async handleMarkRead(socket, data) {
    try {
      const { messageId, senderId } = data;

      await this.messageService.markAsRead(messageId, socket.userId);

      // Notificar al sender que su mensaje fue leído
      const senderData = this.onlineUsers.get(senderId);
      if (senderData) {
        this.io.to(senderData.socketId).emit('message-read', {
          messageId,
          readBy: socket.userId,
          readAt: new Date()
        });
      }

    } catch (error) {
      console.error('Error al marcar como leído:', error);
    }
  }

  /**
   * Enviar notificación de nueva oferta en trade
   */
  notifyNewOffer(receiverId, offerData) {
    const receiverData = this.onlineUsers.get(receiverId);
    if (receiverData) {
      this.io.to(receiverData.socketId).emit('new-trade-offer', {
        type: 'trade-offer',
        ...offerData,
        timestamp: new Date()
      });

      // Notificación visual
      this.io.to(receiverData.socketId).emit('new-notification', {
        type: 'trade',
        title: 'Nueva oferta de intercambio',
        message: `Recibiste una oferta por "${offerData.itemName}"`,
        timestamp: new Date()
      });
    }
  }

  /**
   * Enviar notificación de actualización en oferta
   */
  notifyOfferUpdate(userId, updateData) {
    const userData = this.onlineUsers.get(userId);
    if (userData) {
      this.io.to(userData.socketId).emit('trade-offer-updated', {
        ...updateData,
        timestamp: new Date()
      });
    }
  }

  /**
   * Generar ID de conversación
   */
  generateConversationId(userId1, userId2) {
    const ids = [userId1.toString(), userId2.toString()].sort();
    return `${ids[0]}_${ids[1]}`;
  }

  /**
   * Obtener usuarios online
   */
  getOnlineUsers() {
    return Array.from(this.onlineUsers.entries()).map(([userId, data]) => ({
      userId,
      username: data.username,
      status: data.status,
      lastSeen: data.lastSeen
    }));
  }

  /**
   * Verificar si un usuario está online
   */
  isUserOnline(userId) {
    const userData = this.onlineUsers.get(userId);
    return userData && userData.status !== 'offline';
  }

  /**
   * Obtener estado de un usuario
   */
  getUserStatus(userId) {
    const userData = this.onlineUsers.get(userId);
    return userData ? userData.status : 'offline';
  }

  /**
   * Emitir evento a un usuario específico
   */
  emitToUser(userId, event, data) {
    const userData = this.onlineUsers.get(userId);
    if (userData && userData.socketId) {
      console.log(`📤 Emitiendo '${event}' a usuario ${userId}`);
      this.io.to(userData.socketId).emit(event, data);
      return true;
    }
    console.log(`⚠️ Usuario ${userId} no está online para recibir '${event}'`);
    return false;
  }
}

export default SocketService;
