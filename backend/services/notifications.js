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

  /**
   * Crear notificación de aceptación a grupo
   */
  async notifyGroupJoined(userId, groupId, groupName, groupLeaderId) {
    return await this.createNotification({
      userId,
      type: 'group_joined',
      title: '✅ ¡Bienvenido al grupo!',
      message: `Tu solicitud fue aceptada en "${groupName}"`,
      link: `/groups/${groupId}`,
      relatedId: groupId,
      senderId: groupLeaderId
    });
  }

  /**
   * Crear notificación de rechazo a grupo
   */
  async notifyGroupRejected(userId, groupId, groupName, groupLeaderId, reason = '') {
    const message = reason ? `Tu solicitud fue rechazada: ${reason}` : `Tu solicitud fue rechazada en "${groupName}"`;
    return await this.createNotification({
      userId,
      type: 'group_rejected',
      title: '❌ Solicitud rechazada',
      message,
      link: `/groups/${groupId}`,
      relatedId: groupId,
      senderId: groupLeaderId
    });
  }

  /**
   * Crear notificación de nuevo miembro en grupo
   */
  async notifyNewGroupMember(groupLeaderId, newMemberUsername, groupName, groupId) {
    return await this.createNotification({
      userId: groupLeaderId,
      type: 'member_joined_group',
      title: '👤 Nuevo miembro en tu grupo',
      message: `${newMemberUsername} se unió a "${groupName}"`,
      link: `/groups/${groupId}`,
      relatedId: groupId,
      senderId: null
    });
  }

  /**
   * Crear notificación de aceptación a clan
   */
  async notifyClanJoined(userId, clanId, clanName, clanLeaderId) {
    return await this.createNotification({
      userId,
      type: 'clan_joined',
      title: '✅ ¡Bienvenido al clan!',
      message: `Tu solicitud fue aceptada en "${clanName}"`,
      link: `/clans/${clanId}`,
      relatedId: clanId,
      senderId: clanLeaderId
    });
  }

  /**
   * Crear notificación de rechazo a clan
   */
  async notifyClanRejected(userId, clanId, clanName, clanLeaderId, reason = '') {
    const message = reason ? `Tu solicitud fue rechazada: ${reason}` : `Tu solicitud fue rechazada en "${clanName}"`;
    return await this.createNotification({
      userId,
      type: 'clan_rejected',
      title: '❌ Solicitud rechazada',
      message,
      link: `/clans/${clanId}`,
      relatedId: clanId,
      senderId: clanLeaderId
    });
  }

  /**
   * Crear notificación de nuevo miembro en clan
   */
  async notifyNewClanMember(clanLeaderId, newMemberUsername, clanName, clanId) {
    return await this.createNotification({
      userId: clanLeaderId,
      type: 'member_joined_clan',
      title: '👤 Nuevo miembro en tu clan',
      message: `${newMemberUsername} se unió a "${clanName}"`,
      link: `/clans/${clanId}`,
      relatedId: clanId,
      senderId: null
    });
  }

  /**
   * Crear notificación de friend request
   */
  async notifyFriendRequest(userId, friendUsername, friendId) {
    return await this.createNotification({
      userId,
      type: 'friend_request',
      title: '👋 Nueva solicitud de amistad',
      message: `${friendUsername} te envió una solicitud de amistad`,
      link: `/profile/${friendId}`,
      relatedId: friendId,
      senderId: friendId
    });
  }

  /**
   * Crear notificación de amistad aceptada
   */
  async notifyFriendAccepted(userId, friendUsername, friendId) {
    return await this.createNotification({
      userId,
      type: 'friend_accepted',
      title: '✅ Solicitud aceptada',
      message: `${friendUsername} aceptó tu solicitud de amistad`,
      link: `/profile/${friendId}`,
      relatedId: friendId,
      senderId: friendId
    });
  }
}

export default NotificationService;
