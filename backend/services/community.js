export default class CommunityService {
  constructor(db) {
    this.db = db;
    this.postsCollection = db.collection('community_posts');
    this.commentsCollection = db.collection('post_comments');
  }

  // Crear nuevo post
  async createPost(postData) {
    const post = {
      title: postData.title,
      content: postData.content,
      category: postData.category, // 'news', 'discussion', 'bug_report', 'build_guide', 'update'
      author_name: postData.author_name || 'Anonymous',
      author_id: postData.author_id || 'anonymous',
      author_avatar: postData.author_avatar || '',
      tags: postData.tags || [],
      upvotes: 0,
      downvotes: 0,
      comment_count: 0,
      views: 0,
      pinned: false,
      locked: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await this.postsCollection.insertOne(post);
    return { ...post, _id: result.insertedId };
  }

  // Obtener todos los posts (con paginación)
  async getAllPosts(options = {}) {
    const {
      page = 1,
      limit = 20,
      category = null,
      sort = 'recent', // 'recent', 'popular', 'trending'
      search = null,
    } = options;

    const skip = (page - 1) * limit;
    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = {};
    switch (sort) {
      case 'popular':
        sortOption = { upvotes: -1, created_at: -1 };
        break;
      case 'trending':
        sortOption = { views: -1, upvotes: -1, created_at: -1 };
        break;
      case 'recent':
      default:
        sortOption = { created_at: -1 };
    }

    const posts = await this.postsCollection
      .find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await this.postsCollection.countDocuments(query);

    return {
      posts,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // Obtener post por ID
  async getPostById(postId) {
    const { ObjectId } = await import('mongodb');
    
    // Incrementar views
    await this.postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { views: 1 } }
    );

    return await this.postsCollection.findOne({ _id: new ObjectId(postId) });
  }

  async getCommentById(commentId) {
    const { ObjectId } = await import('mongodb');
    return await this.commentsCollection.findOne({ _id: new ObjectId(commentId) });
  }

  // Votar post
  async votePost(postId, voteType) {
    const { ObjectId } = await import('mongodb');
    const field = voteType === 'up' ? 'upvotes' : 'downvotes';
    
    await this.postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { [field]: 1 } }
    );

    return { success: true };
  }

  // Agregar comentario
  async addComment(postId, commentData) {
    const { ObjectId } = await import('mongodb');
    
    const comment = {
      post_id: postId,
      content: commentData.content,
      author_name: commentData.author_name || 'Anonymous',
      author_id: commentData.author_id || 'anonymous',
      upvotes: 0,
      downvotes: 0,
      parent_comment_id: commentData.parent_comment_id || null, // Para respuestas
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await this.commentsCollection.insertOne(comment);

    // Incrementar contador de comentarios en el post
    await this.postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { comment_count: 1 }, $set: { updated_at: new Date() } }
    );

    return { ...comment, _id: result.insertedId };
  }

  // Obtener comentarios de un post
  async getCommentsByPostId(postId, options = {}) {
    const { sort = 'recent', limit = 100 } = options;

    let sortOption = {};
    switch (sort) {
      case 'popular':
        sortOption = { upvotes: -1, created_at: -1 };
        break;
      case 'recent':
      default:
        sortOption = { created_at: -1 };
    }

    const comments = await this.commentsCollection
      .find({ post_id: postId, parent_comment_id: null }) // Solo comentarios principales
      .sort(sortOption)
      .limit(limit)
      .toArray();

    // Obtener respuestas para cada comentario
    for (let comment of comments) {
      comment.replies = await this.commentsCollection
        .find({ parent_comment_id: comment._id.toString() })
        .sort({ created_at: 1 })
        .toArray();
    }

    return comments;
  }

  // Votar comentario
  async voteComment(commentId, voteType) {
    const { ObjectId } = await import('mongodb');
    const field = voteType === 'up' ? 'upvotes' : 'downvotes';
    
    await this.commentsCollection.updateOne(
      { _id: new ObjectId(commentId) },
      { $inc: { [field]: 1 } }
    );

    return { success: true };
  }

  // Editar post
  async updatePost(postId, updates) {
    const { ObjectId } = await import('mongodb');
    
    const allowedUpdates = ['title', 'content', 'tags'];
    const updateData = {};
    
    for (let key of allowedUpdates) {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    }
    
    updateData.updated_at = new Date();

    await this.postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $set: updateData }
    );

    return { success: true };
  }

  // Eliminar post
  async deletePost(postId) {
    const { ObjectId } = await import('mongodb');
    
    // Eliminar comentarios asociados
    await this.commentsCollection.deleteMany({ post_id: postId });
    
    // Eliminar post
    await this.postsCollection.deleteOne({ _id: new ObjectId(postId) });

    return { success: true };
  }

  // Obtener posts por categoría
  async getPostsByCategory(category) {
    return await this.postsCollection
      .find({ category })
      .sort({ created_at: -1 })
      .limit(20)
      .toArray();
  }

  // Obtener posts recientes
  async getRecentPosts(limit = 10) {
    return await this.postsCollection
      .find({})
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
  }

  // Obtener posts populares
  async getPopularPosts(limit = 10) {
    return await this.postsCollection
      .find({})
      .sort({ upvotes: -1, views: -1 })
      .limit(limit)
      .toArray();
  }

  // Buscar posts
  async searchPosts(searchTerm) {
    return await this.postsCollection
      .find({
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { content: { $regex: searchTerm, $options: 'i' } },
          { tags: { $regex: searchTerm, $options: 'i' } },
        ],
      })
      .sort({ created_at: -1 })
      .limit(50)
      .toArray();
  }

  // Estadísticas
  async getStats() {
    const total_posts = await this.postsCollection.countDocuments();
    const total_comments = await this.commentsCollection.countDocuments();
    
    const categories = await this.postsCollection.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]).toArray();

    const recent_activity = await this.postsCollection
      .find({})
      .sort({ updated_at: -1 })
      .limit(5)
      .toArray();

    return {
      total_posts,
      total_comments,
      categories,
      recent_activity,
    };
  }

  // Pin/Unpin post (admin)
  async togglePinPost(postId) {
    const { ObjectId } = await import('mongodb');
    const post = await this.postsCollection.findOne({ _id: new ObjectId(postId) });
    
    await this.postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $set: { pinned: !post.pinned } }
    );

    return { success: true, pinned: !post.pinned };
  }

  // Lock/Unlock post (admin)
  async toggleLockPost(postId) {
    const { ObjectId } = await import('mongodb');
    const post = await this.postsCollection.findOne({ _id: new ObjectId(postId) });
    
    await this.postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $set: { locked: !post.locked } }
    );

    return { success: true, locked: !post.locked };
  }
}
