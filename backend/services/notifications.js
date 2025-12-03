import { ObjectId } from 'mongodb';

class NotificationService {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('notifications');
  }

  /**
   * Crear una nueva notificación
   */
  async createNotification({ userId, type, title, message, link, relatedId, senderId }) {
    const notification = {
      user_id: new ObjectId(userId),
      type, // 'comment', 'reply', 'trade', 'vote', 'mention', 'system'
      title,
      message,
      link, // URL para navegar al hacer click
      related_id: relatedId ? new ObjectId(relatedId) : null, // ID del recurso relacionado
      sender_id: senderId ? new ObjectId(senderId) : null, // Usuario que generó la notificación
      is_read: false,
      created_at: new Date()
    };

    const result = await this.collection.insertOne(notification);
    return { ...notification, _id: result.insertedId };
  }

  /**
   * Obtener notificaciones de un usuario
   */
  async getUserNotifications(userId, options = {}) {
    const { limit = 50, skip = 0, unreadOnly = false } = options;

    const query = { user_id: new ObjectId(userId) };
    if (unreadOnly) {
      query.is_read = false;
    }

    const notifications = await this.collection
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Enriquecer con datos del remitente si existe
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notif) => {
        if (notif.sender_id) {
          const sender = await this.db.collection('users').findOne(
            { _id: notif.sender_id },
            { projection: { username: 1, fullName: 1 } }
          );
          return { ...notif, sender };
        }
        return notif;
      })
    );

    return enrichedNotifications;
  }

  /**
   * Contar notificaciones sin leer
   */
  async getUnreadCount(userId) {
    return await this.collection.countDocuments({
      user_id: new ObjectId(userId),
      is_read: false
    });
  }

  /**
   * Marcar una notificación como leída
   */
  async markAsRead(notificationId, userId) {
    const result = await this.collection.updateOne(
      {
        _id: new ObjectId(notificationId),
        user_id: new ObjectId(userId)
      },
      {
        $set: { is_read: true, read_at: new Date() }
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(userId) {
    const result = await this.collection.updateMany(
      {
        user_id: new ObjectId(userId),
        is_read: false
      },
      {
        $set: { is_read: true, read_at: new Date() }
      }
    );

    return result.modifiedCount;
  }

  /**
   * Eliminar una notificación
   */
  async deleteNotification(notificationId, userId) {
    const result = await this.collection.deleteOne({
      _id: new ObjectId(notificationId),
      user_id: new ObjectId(userId)
    });

    return result.deletedCount > 0;
  }

  /**
   * Eliminar todas las notificaciones leídas de un usuario
   */
  async deleteReadNotifications(userId) {
    const result = await this.collection.deleteMany({
      user_id: new ObjectId(userId),
      is_read: true
    });

    return result.deletedCount;
  }

  /**
   * Limpiar notificaciones antiguas (más de 30 días)
   */
  async cleanOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.collection.deleteMany({
      created_at: { $lt: thirtyDaysAgo },
      is_read: true
    });

    return result.deletedCount;
  }

  /**
   * Crear notificación de comentario
   */
  async notifyComment(postOwnerId, commenterId, postId, postTitle) {
    if (postOwnerId === commenterId) return; // No notificar a uno mismo

    return await this.createNotification({
      userId: postOwnerId,
      type: 'comment',
      title: 'Nuevo comentario',
      message: `Alguien comentó en tu publicación "${postTitle}"`,
      link: `/community/post/${postId}`,
      relatedId: postId,
      senderId: commenterId
    });
  }

  /**
   * Crear notificación de respuesta a comentario
   */
  async notifyReply(commentOwnerId, replierId, postId, postTitle) {
    if (commentOwnerId === replierId) return;

    return await this.createNotification({
      userId: commentOwnerId,
      type: 'reply',
      title: 'Nueva respuesta',
      message: `Alguien respondió a tu comentario en "${postTitle}"`,
      link: `/community/post/${postId}`,
      relatedId: postId,
      senderId: replierId
    });
  }

  /**
   * Crear notificación de trade
   */
  async notifyTrade(tradeOwnerId, offerId, offererId, itemName) {
    if (tradeOwnerId === offererId) return;

    return await this.createNotification({
      userId: tradeOwnerId,
      type: 'trade',
      title: 'Nueva oferta de intercambio',
      message: `Recibiste una oferta por "${itemName}"`,
      link: `/marketplace/trade/${offerId}`,
      relatedId: offerId,
      senderId: offererId
    });
  }

  /**
   * Crear notificación de voto
   */
  async notifyVote(contributionOwnerId, voterId, contributionId, itemName, voteType) {
    if (contributionOwnerId === voterId) return;

    const emoji = voteType === 'up' ? '👍' : '👎';
    
    return await this.createNotification({
      userId: contributionOwnerId,
      type: 'vote',
      title: 'Voto en tu contribución',
      message: `${emoji} Tu contribución "${itemName}" recibió un voto`,
      link: `/weapons/contribution/${contributionId}`,
      relatedId: contributionId,
      senderId: voterId
    });
  }

  /**
   * Crear notificación de mención
   */
  async notifyMention(mentionedUserId, mentionerId, postId, postTitle) {
    if (mentionedUserId === mentionerId) return;

    return await this.createNotification({
      userId: mentionedUserId,
      type: 'mention',
      title: 'Te mencionaron',
      message: `Te mencionaron en "${postTitle}"`,
      link: `/community/post/${postId}`,
      relatedId: postId,
      senderId: mentionerId
    });
  }

  /**
   * Crear notificación del sistema
   */
  async notifySystem(userId, title, message, link = null) {
    return await this.createNotification({
      userId,
      type: 'system',
      title,
      message,
      link,
      relatedId: null,
      senderId: null
    });
  }
}

export default NotificationService;
