import { ObjectId } from 'mongodb';

class ProfileService {
  constructor(db) {
    this.db = db;
    this.users = db.collection('users');
    this.posts = db.collection('community_posts');
    this.listings = db.collection('marketplace_listings');
    this.trackers = db.collection('trackers');
    this.messages = db.collection('messages');
  }

  /**
   * Obtener perfil público de usuario
   */
  async getProfile(userId) {
    try {
      const user = await this.users.findOne(
        { _id: new ObjectId(userId) },
        {
          projection: {
            password: 0, // Nunca exponer contraseña
            __v: 0
          }
        }
      );

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Formatear respuesta
      return {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName || user.username,
        bio: user.bio || '',
        avatar: user.avatar || null,
        role: user.role || 'user',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isActive: user.isActive !== false
      };
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      throw error;
    }
  }

  /**
   * Actualizar perfil de usuario
   */
  async updateProfile(userId, updates) {
    try {
      // Campos permitidos para actualizar
      const allowedFields = ['fullName', 'bio', 'avatar'];
      const sanitizedUpdates = {};

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          sanitizedUpdates[field] = updates[field];
        }
      }

      // Validaciones
      if (sanitizedUpdates.bio && sanitizedUpdates.bio.length > 500) {
        throw new Error('La biografía no puede exceder 500 caracteres');
      }

      if (sanitizedUpdates.fullName && sanitizedUpdates.fullName.length > 100) {
        throw new Error('El nombre completo no puede exceder 100 caracteres');
      }

      sanitizedUpdates.updatedAt = new Date();

      const result = await this.users.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: sanitizedUpdates },
        { returnDocument: 'after', projection: { password: 0 } }
      );

      if (!result) {
        throw new Error('Usuario no encontrado');
      }

      return {
        _id: result._id.toString(),
        username: result.username,
        email: result.email,
        fullName: result.fullName,
        bio: result.bio,
        avatar: result.avatar,
        updatedAt: result.updatedAt
      };
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas del usuario
   */
  async getUserStats(userId) {
    try {
      const userObjectId = new ObjectId(userId);

      // Ejecutar consultas en paralelo
      const [
        postsCount,
        listingsCount,
        trackersCount,
        messagesCount,
        receivedMessagesCount
      ] = await Promise.all([
        this.posts.countDocuments({ author_id: userObjectId }),
        this.listings.countDocuments({ seller_id: userObjectId }),
        this.trackers.countDocuments({ user_id: userObjectId }),
        this.messages.countDocuments({ senderId: userObjectId }),
        this.messages.countDocuments({ receiverId: userObjectId })
      ]);

      // Calcular trackers completados
      const completedTrackers = await this.trackers.countDocuments({
        user_id: userObjectId,
        completed: true
      });

      // Obtener post más votado
      const topPost = await this.posts
        .find({ author_id: userObjectId })
        .sort({ votes: -1 })
        .limit(1)
        .toArray();

      return {
        posts: {
          total: postsCount,
          topVotes: topPost.length > 0 ? topPost[0].votes : 0
        },
        marketplace: {
          listings: listingsCount
        },
        trackers: {
          total: trackersCount,
          completed: completedTrackers,
          completionRate: trackersCount > 0 
            ? Math.round((completedTrackers / trackersCount) * 100) 
            : 0
        },
        messages: {
          sent: messagesCount,
          received: receivedMessagesCount,
          total: messagesCount + receivedMessagesCount
        }
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  /**
   * Obtener actividad reciente del usuario
   */
  async getUserActivity(userId, limit = 20) {
    try {
      const userObjectId = new ObjectId(userId);
      const activities = [];

      // Obtener posts recientes
      const recentPosts = await this.posts
        .find({ author_id: userObjectId })
        .sort({ created_at: -1 })
        .limit(5)
        .toArray();

      recentPosts.forEach(post => {
        activities.push({
          type: 'post',
          title: post.title,
          content: post.content?.substring(0, 100),
          category: post.category,
          votes: post.votes || 0,
          timestamp: post.created_at,
          id: post._id.toString()
        });
      });

      // Obtener listings recientes
      const recentListings = await this.listings
        .find({ seller_id: userObjectId })
        .sort({ created_at: -1 })
        .limit(5)
        .toArray();

      recentListings.forEach(listing => {
        activities.push({
          type: 'listing',
          title: listing.item_name,
          content: listing.looking_for,
          status: listing.status,
          timestamp: listing.created_at,
          id: listing._id.toString()
        });
      });

      // Obtener trackers completados recientemente
      const recentTrackers = await this.trackers
        .find({ 
          user_id: userObjectId,
          completed: true
        })
        .sort({ updated_at: -1 })
        .limit(5)
        .toArray();

      recentTrackers.forEach(tracker => {
        activities.push({
          type: 'tracker',
          title: tracker.title,
          content: tracker.description?.substring(0, 100),
          category: tracker.category,
          timestamp: tracker.updated_at,
          id: tracker._id.toString()
        });
      });

      // Ordenar por fecha y limitar
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return activities.slice(0, limit);
    } catch (error) {
      console.error('Error al obtener actividad:', error);
      throw error;
    }
  }

  /**
   * Buscar usuarios públicos
   */
  async searchUsers(query, limit = 10) {
    try {
      const users = await this.users
        .find({
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { fullName: { $regex: query, $options: 'i' } }
          ],
          isActive: true
        })
        .limit(limit)
        .project({
          username: 1,
          fullName: 1,
          avatar: 1,
          bio: 1,
          createdAt: 1
        })
        .toArray();

      return users.map(u => ({
        _id: u._id.toString(),
        username: u.username,
        fullName: u.fullName,
        avatar: u.avatar,
        bio: u.bio,
        createdAt: u.createdAt
      }));
    } catch (error) {
      console.error('Error al buscar usuarios:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de usuarios (con paginación)
   */
  async getUsers(skip = 0, limit = 20, sortBy = 'createdAt') {
    try {
      const users = await this.users
        .find({ isActive: true })
        .sort({ [sortBy]: -1 })
        .skip(skip)
        .limit(limit)
        .project({
          username: 1,
          fullName: 1,
          avatar: 1,
          role: 1,
          createdAt: 1
        })
        .toArray();

      const total = await this.users.countDocuments({ isActive: true });

      return {
        users: users.map(u => ({
          _id: u._id.toString(),
          username: u.username,
          fullName: u.fullName,
          avatar: u.avatar,
          role: u.role,
          createdAt: u.createdAt
        })),
        total,
        skip,
        limit
      };
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  }

  /**
   * Crear índices necesarios
   */
  async createIndexes() {
    try {
      await this.users.createIndex({ username: 1 }, { unique: true });
      await this.users.createIndex({ email: 1 }, { unique: true });
      await this.users.createIndex({ createdAt: -1 });
      console.log('✅ Índices de perfiles creados');
    } catch (error) {
      console.error('Error al crear índices:', error);
    }
  }
}

export default ProfileService;
