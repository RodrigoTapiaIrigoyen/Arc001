import { ObjectId } from 'mongodb';

class MessageService {
  constructor(db) {
    this.db = db;
    this.messages = db.collection('messages');
    this.users = db.collection('users');
  }

  /**
   * Enviar un nuevo mensaje
   */
  async sendMessage(senderId, receiverId, content) {
    try {
      // Validar que el receptor existe
      const receiver = await this.users.findOne({ _id: new ObjectId(receiverId) });
      if (!receiver) {
        throw new Error('Usuario receptor no encontrado');
      }

      // Crear ID de conversación (siempre el mismo orden para ambos usuarios)
      const conversationId = this.generateConversationId(senderId, receiverId);

      const message = {
        senderId: new ObjectId(senderId),
        receiverId: new ObjectId(receiverId),
        content: content.trim(),
        conversationId,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await this.messages.insertOne(message);
      
      // Retornar mensaje con IDs como strings
      return {
        _id: result.insertedId.toString(),
        senderId: senderId,
        receiverId: receiverId,
        content: message.content,
        conversationId,
        read: false,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      };
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las conversaciones de un usuario
   */
  async getConversations(userId) {
    try {
      const userObjectId = new ObjectId(userId);

      // Obtener todos los mensajes donde el usuario es sender o receiver
      const messages = await this.messages
        .find({
          $or: [
            { senderId: userObjectId },
            { receiverId: userObjectId }
          ]
        })
        .sort({ createdAt: -1 })
        .toArray();
      
      console.log(`📋 Usuario ${userId}: encontrados ${messages.length} mensajes`);

      // Agrupar por conversationId y obtener el último mensaje + conteo de no leídos
      const conversationsMap = new Map();

      for (const msg of messages) {
        const convId = msg.conversationId;
        
        if (!conversationsMap.has(convId)) {
          // Determinar el otro usuario en la conversación
          const otherUserId = msg.senderId.toString() === userId 
            ? msg.receiverId 
            : msg.senderId;

          // Contar mensajes no leídos recibidos
          const unreadCount = await this.messages.countDocuments({
            conversationId: convId,
            receiverId: userObjectId,
            read: false
          });

          // Obtener info del otro usuario
          const otherUser = await this.users.findOne(
            { _id: otherUserId },
            { projection: { username: 1, email: 1 } }
          );

          conversationsMap.set(convId, {
            conversationId: convId,
            otherUser: {
              _id: otherUserId.toString(),
              username: otherUser?.username || 'Usuario desconocido',
              email: otherUser?.email
            },
            lastMessage: {
              content: msg.content,
              senderId: msg.senderId.toString(),
              createdAt: msg.createdAt,
              read: msg.read
            },
            unreadCount,
            updatedAt: msg.createdAt
          });
        }
      }

      // Convertir Map a array y ordenar por fecha
      const conversations = Array.from(conversationsMap.values())
        .sort((a, b) => b.updatedAt - a.updatedAt);

      console.log(`📋 Usuario ${userId}: retornando ${conversations.length} conversaciones`);
      console.log(`📋 Conversaciones:`, conversations.map(c => ({ 
        conversationId: c.conversationId, 
        otherUser: c.otherUser.username 
      })));

      return conversations;
    } catch (error) {
      console.error('Error al obtener conversaciones:', error);
      throw error;
    }
  }

  /**
   * Obtener mensajes de una conversación específica
   */
  async getConversationMessages(userId, otherUserId, limit = 50, skip = 0) {
    try {
      const conversationId = this.generateConversationId(userId, otherUserId);

      const messages = await this.messages
        .find({ conversationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      // Obtener info de ambos usuarios
      const [user, otherUser] = await Promise.all([
        this.users.findOne(
          { _id: new ObjectId(userId) },
          { projection: { username: 1 } }
        ),
        this.users.findOne(
          { _id: new ObjectId(otherUserId) },
          { projection: { username: 1 } }
        )
      ]);

      // Formatear mensajes
      const formattedMessages = messages.map(msg => ({
        _id: msg._id.toString(),
        senderId: msg.senderId.toString(),
        receiverId: msg.receiverId.toString(),
        senderUsername: msg.senderId.toString() === userId ? user?.username : otherUser?.username,
        content: msg.content,
        read: msg.read,
        createdAt: msg.createdAt,
        isOwn: msg.senderId.toString() === userId
      })).reverse(); // Invertir para mostrar más antiguos primero

      return formattedMessages;
    } catch (error) {
      console.error('Error al obtener mensajes de conversación:', error);
      throw error;
    }
  }

  /**
   * Marcar mensaje(s) como leído
   */
  async markAsRead(messageId, userId) {
    try {
      const result = await this.messages.updateOne(
        { 
          _id: new ObjectId(messageId),
          receiverId: new ObjectId(userId) // Solo el receptor puede marcar como leído
        },
        { 
          $set: { 
            read: true,
            updatedAt: new Date()
          } 
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al marcar mensaje como leído:', error);
      throw error;
    }
  }

  /**
   * Marcar todos los mensajes de una conversación como leídos
   */
  async markConversationAsRead(userId, otherUserId) {
    try {
      const conversationId = this.generateConversationId(userId, otherUserId);

      const result = await this.messages.updateMany(
        {
          conversationId,
          receiverId: new ObjectId(userId),
          read: false
        },
        {
          $set: {
            read: true,
            updatedAt: new Date()
          }
        }
      );

      return result.modifiedCount;
    } catch (error) {
      console.error('Error al marcar conversación como leída:', error);
      throw error;
    }
  }

  /**
   * Contar mensajes no leídos de un usuario
   */
  async getUnreadCount(userId) {
    try {
      const count = await this.messages.countDocuments({
        receiverId: new ObjectId(userId),
        read: false
      });

      return count;
    } catch (error) {
      console.error('Error al contar mensajes no leídos:', error);
      throw error;
    }
  }

  /**
   * Eliminar un mensaje (solo el sender puede eliminar)
   */
  async deleteMessage(messageId, userId) {
    try {
      const result = await this.messages.deleteOne({
        _id: new ObjectId(messageId),
        senderId: new ObjectId(userId)
      });

      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error al eliminar mensaje:', error);
      throw error;
    }
  }

  /**
   * Buscar usuarios para iniciar conversación
   */
  async searchUsers(query, currentUserId, limit = 10) {
    try {
      const users = await this.users
        .find({
          _id: { $ne: new ObjectId(currentUserId) }, // Excluir usuario actual
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        })
        .limit(limit)
        .project({ username: 1, email: 1, createdAt: 1 })
        .toArray();

      return users.map(u => ({
        _id: u._id.toString(),
        username: u.username,
        email: u.email,
        createdAt: u.createdAt
      }));
    } catch (error) {
      console.error('Error al buscar usuarios:', error);
      throw error;
    }
  }

  /**
   * Generar ID único de conversación (mismo para ambos usuarios)
   */
  generateConversationId(userId1, userId2) {
    const ids = [userId1.toString(), userId2.toString()].sort();
    return `${ids[0]}_${ids[1]}`;
  }

  /**
   * Crear índices necesarios
   */
  async createIndexes() {
    try {
      await this.messages.createIndex({ conversationId: 1, createdAt: -1 });
      await this.messages.createIndex({ senderId: 1, createdAt: -1 });
      await this.messages.createIndex({ receiverId: 1, read: 1 });
      await this.messages.createIndex({ createdAt: -1 });
      console.log('✅ Índices de mensajes creados');
    } catch (error) {
      console.error('Error al crear índices:', error);
    }
  }
}

export default MessageService;
