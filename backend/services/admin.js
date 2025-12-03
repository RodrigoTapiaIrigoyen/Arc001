import { ObjectId } from 'mongodb';

class AdminService {
  constructor(db) {
    this.db = db;
    this.users = db.collection('users');
    this.posts = db.collection('community_posts');
    this.marketplace = db.collection('marketplace_listings');
    this.messages = db.collection('messages');
    this.reports = db.collection('reports');
    this.auditLog = db.collection('audit_log');
  }

  // ========== GESTIÓN DE USUARIOS ==========

  async getAllUsers(page = 1, limit = 20, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      const query = {};

      if (filters.role) query.role = filters.role;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;
      if (filters.search) {
        query.$or = [
          { username: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } },
          { fullName: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const users = await this.users
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await this.users.countDocuments(query);

      // Ocultar contraseñas
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      return {
        users: sanitizedUsers,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Error getting users: ${error.message}`);
    }
  }

  async getUserDetails(userId) {
    try {
      const user = await this.users.findOne({ _id: new ObjectId(userId) });
      if (!user) throw new Error('User not found');

      const { password, ...userWithoutPassword } = user;

      // Estadísticas del usuario
      const [postsCount, listingsCount, messagesCount] = await Promise.all([
        this.posts.countDocuments({ userId }),
        this.marketplace.countDocuments({ userId }),
        this.messages.countDocuments({ senderId: userId })
      ]);

      return {
        ...userWithoutPassword,
        stats: {
          posts: postsCount,
          listings: listingsCount,
          messages: messagesCount
        }
      };
    } catch (error) {
      throw new Error(`Error getting user details: ${error.message}`);
    }
  }

  async banUser(userId, adminId, reason, duration = null) {
    try {
      const bannedUntil = duration ? new Date(Date.now() + duration) : null;

      await this.users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            isActive: false,
            bannedAt: new Date(),
            bannedBy: adminId,
            banReason: reason,
            bannedUntil,
            updatedAt: new Date()
          }
        }
      );

      // Log de auditoría
      await this.logAction(adminId, 'ban_user', { 
        userId, 
        reason, 
        duration: duration ? `${duration}ms` : 'permanent' 
      });

      return { success: true, message: 'User banned successfully' };
    } catch (error) {
      throw new Error(`Error banning user: ${error.message}`);
    }
  }

  async unbanUser(userId, adminId) {
    try {
      await this.users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            isActive: true,
            updatedAt: new Date()
          },
          $unset: {
            bannedAt: '',
            bannedBy: '',
            banReason: '',
            bannedUntil: ''
          }
        }
      );

      await this.logAction(adminId, 'unban_user', { userId });

      return { success: true, message: 'User unbanned successfully' };
    } catch (error) {
      throw new Error(`Error unbanning user: ${error.message}`);
    }
  }

  async warnUser(userId, adminId, reason) {
    try {
      await this.users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $push: {
            warnings: {
              reason,
              adminId,
              date: new Date()
            }
          },
          $set: { updatedAt: new Date() }
        }
      );

      await this.logAction(adminId, 'warn_user', { userId, reason });

      return { success: true, message: 'User warned successfully' };
    } catch (error) {
      throw new Error(`Error warning user: ${error.message}`);
    }
  }

  async updateUserRole(userId, adminId, newRole) {
    try {
      const validRoles = ['user', 'moderator', 'admin'];
      if (!validRoles.includes(newRole)) {
        throw new Error('Invalid role');
      }

      await this.users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: { role: newRole, updatedAt: new Date() }
        }
      );

      await this.logAction(adminId, 'update_role', { userId, newRole });

      return { success: true, message: 'User role updated successfully' };
    } catch (error) {
      throw new Error(`Error updating user role: ${error.message}`);
    }
  }

  // ========== GESTIÓN DE CONTENIDO ==========

  async deletePost(postId, adminId, reason) {
    try {
      const post = await this.posts.findOne({ _id: new ObjectId(postId) });
      if (!post) throw new Error('Post not found');

      await this.posts.updateOne(
        { _id: new ObjectId(postId) },
        {
          $set: {
            deleted: true,
            deletedBy: adminId,
            deleteReason: reason,
            deletedAt: new Date()
          }
        }
      );

      await this.logAction(adminId, 'delete_post', { postId, reason, originalAuthor: post.userId });

      return { success: true, message: 'Post deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting post: ${error.message}`);
    }
  }

  async deleteListing(listingId, adminId, reason) {
    try {
      const listing = await this.marketplace.findOne({ _id: new ObjectId(listingId) });
      if (!listing) throw new Error('Listing not found');

      await this.marketplace.updateOne(
        { _id: new ObjectId(listingId) },
        {
          $set: {
            deleted: true,
            deletedBy: adminId,
            deleteReason: reason,
            deletedAt: new Date()
          }
        }
      );

      await this.logAction(adminId, 'delete_listing', { listingId, reason, originalAuthor: listing.userId });

      return { success: true, message: 'Listing deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting listing: ${error.message}`);
    }
  }

  async deleteComment(postId, commentId, adminId, reason) {
    try {
      const post = await this.posts.findOne({ _id: new ObjectId(postId) });
      if (!post) throw new Error('Post not found');

      await this.posts.updateOne(
        { _id: new ObjectId(postId), 'comments._id': new ObjectId(commentId) },
        {
          $set: {
            'comments.$.deleted': true,
            'comments.$.deletedBy': adminId,
            'comments.$.deleteReason': reason,
            'comments.$.deletedAt': new Date()
          }
        }
      );

      await this.logAction(adminId, 'delete_comment', { postId, commentId, reason });

      return { success: true, message: 'Comment deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting comment: ${error.message}`);
    }
  }

  // ========== REPORTES ==========

  async getReports(page = 1, limit = 20, status = null) {
    try {
      const skip = (page - 1) * limit;
      const query = status ? { status } : {};

      const reports = await this.reports
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await this.reports.countDocuments(query);

      return {
        reports,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Error getting reports: ${error.message}`);
    }
  }

  async resolveReport(reportId, adminId, action, notes) {
    try {
      await this.reports.updateOne(
        { _id: new ObjectId(reportId) },
        {
          $set: {
            status: 'resolved',
            resolvedBy: adminId,
            resolvedAt: new Date(),
            action,
            notes
          }
        }
      );

      await this.logAction(adminId, 'resolve_report', { reportId, action, notes });

      return { success: true, message: 'Report resolved successfully' };
    } catch (error) {
      throw new Error(`Error resolving report: ${error.message}`);
    }
  }

  // ========== ESTADÍSTICAS ==========

  async getDashboardStats() {
    try {
      const [
        totalUsers,
        activeUsers,
        bannedUsers,
        totalPosts,
        totalListings,
        pendingReports,
        todayUsers,
        todayPosts
      ] = await Promise.all([
        this.users.countDocuments(),
        this.users.countDocuments({ isActive: true }),
        this.users.countDocuments({ isActive: false }),
        this.posts.countDocuments({ deleted: { $ne: true } }),
        this.marketplace.countDocuments({ deleted: { $ne: true } }),
        this.reports.countDocuments({ status: 'pending' }),
        this.users.countDocuments({
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }),
        this.posts.countDocuments({
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        })
      ]);

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          banned: bannedUsers,
          today: todayUsers
        },
        content: {
          posts: totalPosts,
          listings: totalListings,
          postsToday: todayPosts
        },
        reports: {
          pending: pendingReports
        }
      };
    } catch (error) {
      throw new Error(`Error getting dashboard stats: ${error.message}`);
    }
  }

  async getRecentActivity(limit = 50) {
    try {
      const activity = await this.auditLog
        .find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      return activity;
    } catch (error) {
      throw new Error(`Error getting recent activity: ${error.message}`);
    }
  }

  // ========== AUDIT LOG ==========

  async logAction(adminId, action, details = {}) {
    try {
      await this.auditLog.insertOne({
        adminId,
        action,
        details,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  // ========== ÍNDICES ==========

  async createIndexes() {
    try {
      await this.reports.createIndex({ status: 1, createdAt: -1 });
      await this.auditLog.createIndex({ timestamp: -1 });
      await this.auditLog.createIndex({ adminId: 1 });
      console.log('✅ Admin service indexes created');
    } catch (error) {
      console.error('Error creating admin indexes:', error);
    }
  }
}

export default AdminService;
