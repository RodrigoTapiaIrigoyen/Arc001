const { ObjectId } = require('mongodb');

class FriendsService {
  constructor(db) {
    this.db = db;
    this.friendsCollection = db.collection('friendships');
    this.usersCollection = db.collection('users');
    this.notificationsCollection = db.collection('notifications');
  }

  /**
   * Enviar solicitud de amistad
   */
  async sendFriendRequest(senderId, receiverId) {
    // Verificar que no sean el mismo usuario
    if (senderId === receiverId) {
      throw new Error('No puedes enviarte solicitud a ti mismo');
    }

    // Verificar que el receptor exista
    const receiver = await this.usersCollection.findOne({ 
      _id: new ObjectId(receiverId) 
    });
    
    if (!receiver) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que no exista ya una solicitud o amistad
    const existingRelation = await this.friendsCollection.findOne({
      $or: [
        { user1Id: new ObjectId(senderId), user2Id: new ObjectId(receiverId) },
        { user1Id: new ObjectId(receiverId), user2Id: new ObjectId(senderId) }
      ]
    });

    if (existingRelation) {
      if (existingRelation.status === 'pending') {
        throw new Error('Ya existe una solicitud pendiente');
      }
      if (existingRelation.status === 'accepted') {
        throw new Error('Ya son amigos');
      }
      if (existingRelation.status === 'rejected') {
        // Permitir reenviar después de un rechazo
        await this.friendsCollection.updateOne(
          { _id: existingRelation._id },
          { 
            $set: { 
              status: 'pending',
              requesterId: new ObjectId(senderId),
              updatedAt: new Date()
            }
          }
        );
        return existingRelation._id;
      }
    }

    // Crear nueva solicitud
    const result = await this.friendsCollection.insertOne({
      user1Id: new ObjectId(senderId),
      user2Id: new ObjectId(receiverId),
      requesterId: new ObjectId(senderId),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Crear notificación
    const sender = await this.usersCollection.findOne({ 
      _id: new ObjectId(senderId) 
    });

    await this.notificationsCollection.insertOne({
      userId: new ObjectId(receiverId),
      type: 'friend_request',
      title: 'Nueva solicitud de amistad',
      message: `${sender.username} te ha enviado una solicitud de amistad`,
      data: {
        friendshipId: result.insertedId,
        senderId: senderId,
        senderUsername: sender.username
      },
      read: false,
      createdAt: new Date()
    });

    return result.insertedId;
  }

  /**
   * Responder a solicitud de amistad
   */
  async respondToFriendRequest(friendshipId, userId, accept) {
    const friendship = await this.friendsCollection.findOne({
      _id: new ObjectId(friendshipId)
    });

    if (!friendship) {
      throw new Error('Solicitud no encontrada');
    }

    // Verificar que el usuario sea el receptor de la solicitud
    const isReceiver = friendship.user2Id.toString() === userId && 
                       friendship.requesterId.toString() !== userId;
    
    if (!isReceiver) {
      throw new Error('No tienes permiso para responder esta solicitud');
    }

    if (friendship.status !== 'pending') {
      throw new Error('Esta solicitud ya fue respondida');
    }

    const newStatus = accept ? 'accepted' : 'rejected';
    
    await this.friendsCollection.updateOne(
      { _id: new ObjectId(friendshipId) },
      { 
        $set: { 
          status: newStatus,
          respondedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Crear notificación para el solicitante
    const responder = await this.usersCollection.findOne({ 
      _id: new ObjectId(userId) 
    });

    if (accept) {
      await this.notificationsCollection.insertOne({
        userId: friendship.requesterId,
        type: 'friend_request_accepted',
        title: 'Solicitud aceptada',
        message: `${responder.username} aceptó tu solicitud de amistad`,
        data: {
          friendshipId: friendshipId,
          userId: userId,
          username: responder.username
        },
        read: false,
        createdAt: new Date()
      });
    }

    return { status: newStatus };
  }

  /**
   * Obtener lista de amigos
   */
  async getFriends(userId) {
    const friendships = await this.friendsCollection.find({
      $or: [
        { user1Id: new ObjectId(userId) },
        { user2Id: new ObjectId(userId) }
      ],
      status: 'accepted'
    }).toArray();

    // Obtener información de los amigos
    const friendsData = await Promise.all(
      friendships.map(async (friendship) => {
        const friendId = friendship.user1Id.toString() === userId 
          ? friendship.user2Id 
          : friendship.user1Id;
        
        const friend = await this.usersCollection.findOne(
          { _id: friendId },
          { projection: { password: 0 } }
        );

        return {
          friendshipId: friendship._id,
          userId: friendId,
          username: friend.username,
          email: friend.email,
          avatar: friend.avatar || null,
          since: friendship.respondedAt || friendship.createdAt
        };
      })
    );

    return friendsData;
  }

  /**
   * Obtener solicitudes pendientes (recibidas)
   */
  async getPendingRequests(userId) {
    const requests = await this.friendsCollection.find({
      user2Id: new ObjectId(userId),
      status: 'pending'
    }).toArray();

    // Obtener información de los solicitantes
    const requestsData = await Promise.all(
      requests.map(async (request) => {
        const requester = await this.usersCollection.findOne(
          { _id: request.user1Id },
          { projection: { password: 0 } }
        );

        return {
          friendshipId: request._id,
          userId: request.user1Id,
          username: requester.username,
          email: requester.email,
          avatar: requester.avatar || null,
          requestedAt: request.createdAt
        };
      })
    );

    return requestsData;
  }

  /**
   * Obtener solicitudes enviadas
   */
  async getSentRequests(userId) {
    const requests = await this.friendsCollection.find({
      user1Id: new ObjectId(userId),
      status: 'pending'
    }).toArray();

    // Obtener información de los receptores
    const requestsData = await Promise.all(
      requests.map(async (request) => {
        const receiver = await this.usersCollection.findOne(
          { _id: request.user2Id },
          { projection: { password: 0 } }
        );

        return {
          friendshipId: request._id,
          userId: request.user2Id,
          username: receiver.username,
          email: receiver.email,
          avatar: receiver.avatar || null,
          sentAt: request.createdAt
        };
      })
    );

    return requestsData;
  }

  /**
   * Cancelar solicitud enviada
   */
  async cancelFriendRequest(friendshipId, userId) {
    const friendship = await this.friendsCollection.findOne({
      _id: new ObjectId(friendshipId)
    });

    if (!friendship) {
      throw new Error('Solicitud no encontrada');
    }

    // Verificar que el usuario sea el solicitante
    if (friendship.user1Id.toString() !== userId) {
      throw new Error('No tienes permiso para cancelar esta solicitud');
    }

    if (friendship.status !== 'pending') {
      throw new Error('Solo puedes cancelar solicitudes pendientes');
    }

    await this.friendsCollection.deleteOne({
      _id: new ObjectId(friendshipId)
    });

    return { message: 'Solicitud cancelada' };
  }

  /**
   * Eliminar amistad
   */
  async removeFriend(friendshipId, userId) {
    const friendship = await this.friendsCollection.findOne({
      _id: new ObjectId(friendshipId)
    });

    if (!friendship) {
      throw new Error('Amistad no encontrada');
    }

    // Verificar que el usuario sea parte de la amistad
    const isParticipant = friendship.user1Id.toString() === userId || 
                          friendship.user2Id.toString() === userId;
    
    if (!isParticipant) {
      throw new Error('No tienes permiso para eliminar esta amistad');
    }

    if (friendship.status !== 'accepted') {
      throw new Error('Solo puedes eliminar amistades aceptadas');
    }

    await this.friendsCollection.deleteOne({
      _id: new ObjectId(friendshipId)
    });

    return { message: 'Amistad eliminada' };
  }

  /**
   * Verificar si dos usuarios son amigos
   */
  async areFriends(userId1, userId2) {
    const friendship = await this.friendsCollection.findOne({
      $or: [
        { user1Id: new ObjectId(userId1), user2Id: new ObjectId(userId2) },
        { user1Id: new ObjectId(userId2), user2Id: new ObjectId(userId1) }
      ],
      status: 'accepted'
    });

    return !!friendship;
  }

  /**
   * Obtener estado de relación entre dos usuarios
   */
  async getRelationshipStatus(userId1, userId2) {
    const friendship = await this.friendsCollection.findOne({
      $or: [
        { user1Id: new ObjectId(userId1), user2Id: new ObjectId(userId2) },
        { user1Id: new ObjectId(userId2), user2Id: new ObjectId(userId1) }
      ]
    });

    if (!friendship) {
      return { status: 'none' };
    }

    return {
      status: friendship.status,
      friendshipId: friendship._id,
      requesterId: friendship.requesterId,
      canRespond: friendship.status === 'pending' && 
                  friendship.requesterId.toString() !== userId1
    };
  }

  /**
   * Buscar usuarios (excluyendo amigos actuales)
   */
  async searchUsers(userId, query, limit = 20) {
    // Obtener IDs de amigos actuales y solicitudes
    const friendships = await this.friendsCollection.find({
      $or: [
        { user1Id: new ObjectId(userId) },
        { user2Id: new ObjectId(userId) }
      ],
      status: { $in: ['accepted', 'pending'] }
    }).toArray();

    const excludeIds = [
      new ObjectId(userId), // Excluir al usuario actual
      ...friendships.map(f => 
        f.user1Id.toString() === userId ? f.user2Id : f.user1Id
      )
    ];

    // Buscar usuarios
    const users = await this.usersCollection.find({
      _id: { $nin: excludeIds },
      username: { $regex: query, $options: 'i' }
    }, {
      projection: { password: 0 },
      limit: limit
    }).toArray();

    return users;
  }
}

module.exports = FriendsService;
