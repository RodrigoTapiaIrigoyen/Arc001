import { ObjectId } from 'mongodb';

class MarketplaceService {
  constructor(db) {
    this.db = db;
    this.tradeListings = db.collection('trade_listings');
    this.tradeOffers = db.collection('trade_offers');
    this.discussions = db.collection('item_discussions');
    this.discussionComments = db.collection('discussion_comments');
    this.userRatings = db.collection('user_ratings');
    this.tradeTransactions = db.collection('trade_transactions');
    this.weapons = db.collection('weapons');
    this.items = db.collection('items');
    this.traders = db.collection('traders');
    this.enemies = db.collection('enemies');
  }

  // ==================== TRADE LISTINGS ====================

  async createTradeListing(listingData) {
    const listing = {
      ...listingData,
      status: 'active', // active, completed, cancelled
      offer_count: 0,
      views: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await this.tradeListings.insertOne(listing);
    return { ...listing, _id: result.insertedId };
  }

  async getAllTradeListings(options = {}) {
    const {
      status = 'active',
      item_type,
      search,
      sort = 'recent',
      page = 1,
      limit = 20,
    } = options;

    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }

    if (item_type && item_type !== 'all') {
      query['offering.item_type'] = item_type;
    }

    if (search) {
      query.$or = [
        { 'offering.item_name': { $regex: search, $options: 'i' } },
        { 'wanted.item_name': { $regex: search, $options: 'i' } },
        { trader_name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOptions = { created_at: -1 };
    if (sort === 'popular') {
      sortOptions = { offer_count: -1, views: -1 };
    }

    const skip = (page - 1) * limit;
    const [listings, total] = await Promise.all([
      this.tradeListings.find(query).sort(sortOptions).skip(skip).limit(limit).toArray(),
      this.tradeListings.countDocuments(query),
    ]);

    return {
      listings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTradeListingById(listingId) {
    // Increment views
    await this.tradeListings.updateOne(
      { _id: new ObjectId(listingId) },
      { $inc: { views: 1 } }
    );

    return await this.tradeListings.findOne({ _id: new ObjectId(listingId) });
  }

  async getTradeListingsByTrader(traderName) {
    return await this.tradeListings
      .find({ trader_name: traderName })
      .sort({ created_at: -1 })
      .toArray();
  }

  async updateTradeListingStatus(listingId, status) {
    return await this.tradeListings.updateOne(
      { _id: new ObjectId(listingId) },
      { 
        $set: { 
          status,
          updated_at: new Date()
        }
      }
    );
  }

  async deleteTradeListingById(listingId) {
    // Delete all associated offers
    await this.tradeOffers.deleteMany({ listing_id: listingId });
    
    // Delete the listing
    return await this.tradeListings.deleteOne({ _id: new ObjectId(listingId) });
  }

  // ==================== TRADE OFFERS ====================

  async createTradeOffer(offerData) {
    const offer = {
      ...offerData,
      status: 'pending', // pending, accepted, rejected, cancelled
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await this.tradeOffers.insertOne(offer);

    // Increment offer count on listing
    await this.tradeListings.updateOne(
      { _id: new ObjectId(offerData.listing_id) },
      { $inc: { offer_count: 1 } }
    );

    return { ...offer, _id: result.insertedId };
  }

  async getOffersByListingId(listingId, status = null) {
    const query = { listing_id: listingId };
    if (status) {
      query.status = status;
    }

    return await this.tradeOffers
      .find(query)
      .sort({ created_at: -1 })
      .toArray();
  }

  async getOffersByTrader(traderName, status = null) {
    const query = { trader_name: traderName };
    if (status) {
      query.status = status;
    }

    return await this.tradeOffers
      .find(query)
      .sort({ created_at: -1 })
      .toArray();
  }

  async updateOfferStatus(offerId, status) {
    const offer = await this.tradeOffers.findOne({ _id: new ObjectId(offerId) });
    
    if (!offer) {
      throw new Error('Offer not found');
    }

    // If accepting an offer, mark listing as completed
    if (status === 'accepted') {
      await this.tradeListings.updateOne(
        { _id: new ObjectId(offer.listing_id) },
        { 
          $set: { 
            status: 'completed',
            updated_at: new Date()
          }
        }
      );

      // Reject all other pending offers for this listing
      await this.tradeOffers.updateMany(
        { 
          listing_id: offer.listing_id,
          _id: { $ne: new ObjectId(offerId) },
          status: 'pending'
        },
        { 
          $set: { 
            status: 'rejected',
            updated_at: new Date()
          }
        }
      );
    }

    return await this.tradeOffers.updateOne(
      { _id: new ObjectId(offerId) },
      { 
        $set: { 
          status,
          updated_at: new Date()
        }
      }
    );
  }

  async deleteOfferById(offerId) {
    const offer = await this.tradeOffers.findOne({ _id: new ObjectId(offerId) });
    
    if (offer) {
      // Decrement offer count on listing
      await this.tradeListings.updateOne(
        { _id: new ObjectId(offer.listing_id) },
        { $inc: { offer_count: -1 } }
      );
    }

    return await this.tradeOffers.deleteOne({ _id: new ObjectId(offerId) });
  }

  // ==================== SEARCH GAME ITEMS ====================

  async searchGameItems(searchTerm, itemType = null) {
    const regex = { $regex: searchTerm, $options: 'i' };
    const results = {
      weapons: [],
      items: [],
      traders: [],
      enemies: [],
    };

    if (!itemType || itemType === 'weapon') {
      results.weapons = await this.weapons
        .find({ 
          $or: [
            { name: regex },
            { shortName: regex }
          ]
        })
        .limit(10)
        .toArray();
    }

    if (!itemType || itemType === 'item') {
      results.items = await this.items
        .find({ name: regex })
        .limit(10)
        .toArray();
    }

    if (!itemType || itemType === 'trader') {
      results.traders = await this.traders
        .find({ name: regex })
        .limit(10)
        .toArray();
    }

    if (!itemType || itemType === 'enemy') {
      results.enemies = await this.enemies
        .find({ name: regex })
        .limit(10)
        .toArray();
    }

    return results;
  }

  // ==================== STATISTICS ====================

  async getMarketplaceStats() {
    const [activeListings, completedTrades, totalOffers, listingsByType] = await Promise.all([
      this.tradeListings.countDocuments({ status: 'active' }),
      this.tradeListings.countDocuments({ status: 'completed' }),
      this.tradeOffers.countDocuments(),
      this.tradeListings.aggregate([
        {
          $group: {
            _id: '$offering.item_type',
            count: { $sum: 1 }
          }
        }
      ]).toArray(),
    ]);

    return {
      active_listings: activeListings,
      completed_trades: completedTrades,
      total_offers: totalOffers,
      by_type: listingsByType,
    };
  }

  // ==================== DISCUSSIONS (Keep existing) ====================

  async createDiscussion(discussionData) {
    const discussion = {
      ...discussionData,
      author_id: discussionData.author_id || 'anonymous',
      upvotes: 0,
      downvotes: 0,
      comment_count: 0,
      views: 0,
      pinned: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await this.discussions.insertOne(discussion);
    return { ...discussion, _id: result.insertedId };
  }

  async getAllDiscussions(options = {}) {
    const {
      item_type,
      item_id,
      search,
      sort = 'recent',
      page = 1,
      limit = 20,
    } = options;

    const query = {};
    
    if (item_type) {
      query.item_type = item_type;
    }

    if (item_id) {
      query.item_id = item_id;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { item_name: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOptions = { created_at: -1 };
    if (sort === 'popular') {
      sortOptions = { upvotes: -1, views: -1 };
    } else if (sort === 'trending') {
      sortOptions = { comment_count: -1, views: -1 };
    }

    const skip = (page - 1) * limit;
    const [discussions, total] = await Promise.all([
      this.discussions.find(query).sort(sortOptions).skip(skip).limit(limit).toArray(),
      this.discussions.countDocuments(query),
    ]);

    return {
      discussions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDiscussionById(discussionId) {
    await this.discussions.updateOne(
      { _id: new ObjectId(discussionId) },
      { $inc: { views: 1 } }
    );

    return await this.discussions.findOne({ _id: new ObjectId(discussionId) });
  }

  async voteDiscussion(discussionId, voteType) {
    const update = voteType === 'up' 
      ? { $inc: { upvotes: 1 } }
      : { $inc: { downvotes: 1 } };

    return await this.discussions.updateOne(
      { _id: new ObjectId(discussionId) },
      update
    );
  }

  async addComment(discussionId, commentData) {
    const comment = {
      discussion_id: discussionId,
      ...commentData,
      author_id: commentData.author_id || 'anonymous',
      upvotes: 0,
      downvotes: 0,
      parent_comment_id: commentData.parent_comment_id || null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await this.discussionComments.insertOne(comment);

    await this.discussions.updateOne(
      { _id: new ObjectId(discussionId) },
      { $inc: { comment_count: 1 } }
    );

    return { ...comment, _id: result.insertedId };
  }

  async getCommentsByDiscussionId(discussionId) {
    const comments = await this.discussionComments
      .find({ discussion_id: discussionId, parent_comment_id: null })
      .sort({ created_at: -1 })
      .toArray();

    for (const comment of comments) {
      comment.replies = await this.discussionComments
        .find({ parent_comment_id: comment._id.toString() })
        .sort({ created_at: 1 })
        .toArray();
    }

    return comments;
  }

  async voteComment(commentId, voteType) {
    const update = voteType === 'up' 
      ? { $inc: { upvotes: 1 } }
      : { $inc: { downvotes: 1 } };

    return await this.discussionComments.updateOne(
      { _id: new ObjectId(commentId) },
      update
    );
  }

  async deleteDiscussion(discussionId) {
    await this.discussionComments.deleteMany({ discussion_id: discussionId });
    return await this.discussions.deleteOne({ _id: new ObjectId(discussionId) });
  }

  // ==================== USER RATINGS SYSTEM ====================

  async createUserRating(ratingData) {
    const {
      transaction_id,
      rater_user,
      rated_user,
      rating,
      comment,
      trade_completed
    } = ratingData;

    // Validar que no haya calificado ya
    const existing = await this.userRatings.findOne({
      transaction_id,
      rater_user
    });

    if (existing) {
      throw new Error('Ya has calificado esta transacción');
    }

    const userRating = {
      transaction_id,
      rater_user,
      rated_user,
      rating, // 1-5 stars
      comment: comment || '',
      trade_completed: trade_completed || true,
      created_at: new Date()
    };

    const result = await this.userRatings.insertOne(userRating);
    
    // Actualizar estadísticas del usuario
    await this.updateUserStats(rated_user);
    
    return { ...userRating, _id: result.insertedId };
  }

  async getUserRatings(username) {
    const ratings = await this.userRatings
      .find({ rated_user: username })
      .sort({ created_at: -1 })
      .toArray();

    const stats = await this.getUserStats(username);

    return {
      ratings,
      stats
    };
  }

  async getUserStats(username) {
    const ratings = await this.userRatings
      .find({ rated_user: username })
      .toArray();

    if (ratings.length === 0) {
      return {
        username,
        total_trades: 0,
        average_rating: 0,
        rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        completed_trades: 0,
        reputation: 'Nuevo'
      };
    }

    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / ratings.length;
    
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(r => {
      breakdown[r.rating]++;
    });

    const completedTrades = ratings.filter(r => r.trade_completed).length;

    // Sistema de reputación
    let reputation = 'Nuevo';
    if (completedTrades >= 50 && averageRating >= 4.8) reputation = 'Leyenda';
    else if (completedTrades >= 30 && averageRating >= 4.5) reputation = 'Élite';
    else if (completedTrades >= 15 && averageRating >= 4.0) reputation = 'Veterano';
    else if (completedTrades >= 5 && averageRating >= 3.5) reputation = 'Confiable';
    else if (completedTrades >= 1) reputation = 'Principiante';

    return {
      username,
      total_trades: ratings.length,
      average_rating: Math.round(averageRating * 10) / 10,
      rating_breakdown: breakdown,
      completed_trades: completedTrades,
      reputation
    };
  }

  async updateUserStats(username) {
    // Este método se llama automáticamente al agregar rating
    return await this.getUserStats(username);
  }

  // ==================== OFERTAS CON COMENTARIOS ====================

  async addOfferComment(offerData) {
    const {
      listing_id,
      offer_user,
      offer_text,
      offer_items,
      image_url
    } = offerData;

    const offer = {
      listing_id,
      offer_user,
      offer_text,
      offer_items: offer_items || [],
      image_url: image_url || null,
      status: 'pending',
      replies: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await this.tradeOffers.insertOne(offer);

    // Incrementar contador de ofertas
    await this.tradeListings.updateOne(
      { _id: new ObjectId(listing_id) },
      { 
        $inc: { offers_count: 1 },
        $set: { updated_at: new Date() }
      }
    );

    return { ...offer, _id: result.insertedId };
  }

  async replyToOffer(offerId, replyData) {
    const { reply_user, reply_text } = replyData;

    const reply = {
      reply_user,
      reply_text,
      created_at: new Date()
    };

    return await this.tradeOffers.updateOne(
      { _id: new ObjectId(offerId) },
      { 
        $push: { replies: reply },
        $set: { updated_at: new Date() }
      }
    );
  }

  async getOffersByListing(listingId) {
    return await this.tradeOffers
      .find({ listing_id: listingId })
      .sort({ created_at: -1 })
      .toArray();
  }

  async acceptOffer(offerId, listingOwnerId) {
    console.log('acceptOffer called with:', { offerId, listingOwnerId });
    const offer = await this.tradeOffers.findOne({ _id: new ObjectId(offerId) });
    console.log('Offer found:', offer);
    
    if (!offer) {
      throw new Error('Oferta no encontrada');
    }

    // Crear transacción
    const transaction = {
      listing_id: offer.listing_id,
      offer_id: offerId,
      seller: listingOwnerId,
      buyer: offer.offer_user,
      status: 'completed',
      completed_at: new Date(),
      created_at: new Date()
    };

    const transactionResult = await this.tradeTransactions.insertOne(transaction);

    // Actualizar estado de oferta
    await this.tradeOffers.updateOne(
      { _id: new ObjectId(offerId) },
      { 
        $set: { 
          status: 'accepted',
          transaction_id: transactionResult.insertedId.toString(),
          updated_at: new Date()
        }
      }
    );

    // Marcar listing como completado
    await this.tradeListings.updateOne(
      { _id: new ObjectId(offer.listing_id) },
      { 
        $set: { 
          status: 'completed',
          completed_at: new Date(),
          updated_at: new Date()
        }
      }
    );

    // Rechazar otras ofertas pendientes
    await this.tradeOffers.updateMany(
      { 
        listing_id: offer.listing_id,
        _id: { $ne: new ObjectId(offerId) },
        status: 'pending'
      },
      { 
        $set: { 
          status: 'rejected',
          updated_at: new Date()
        }
      }
    );

    return {
      transaction: { ...transaction, _id: transactionResult.insertedId },
      message: 'Oferta aceptada. Ahora ambos pueden calificarse mutuamente.'
    };
  }

  async getTransactionById(transactionId) {
    return await this.tradeTransactions.findOne({ 
      _id: new ObjectId(transactionId) 
    });
  }

  async canUserRate(transactionId, username) {
    const transaction = await this.getTransactionById(transactionId);
    
    if (!transaction) {
      return { can_rate: false, reason: 'Transacción no encontrada' };
    }

    if (transaction.seller !== username && transaction.buyer !== username) {
      return { can_rate: false, reason: 'No eres parte de esta transacción' };
    }

    const hasRated = await this.userRatings.findOne({
      transaction_id: transactionId,
      rater_user: username
    });

    if (hasRated) {
      return { can_rate: false, reason: 'Ya has calificado esta transacción' };
    }

    return { 
      can_rate: true, 
      rated_user: transaction.seller === username ? transaction.buyer : transaction.seller
    };
  }

  // ==================== SISTEMA DE OFERTAS (métodos auxiliares) ====================

  // ==================== HISTORIAL DE INTERCAMBIOS ====================

  async recordTradeHistory(listingId, tradedItems) {
    const listing = await this.tradeListings.findOne({ _id: new ObjectId(listingId) });
    
    if (!listing) return;

    const tradeHistory = this.db.collection('trade_history');
    
    await tradeHistory.insertOne({
      item_offered: listing.offering,
      item_wanted: listing.looking_for,
      traded_for: tradedItems,
      seller_id: listing.user_id,
      listing_id: new ObjectId(listingId),
      traded_at: new Date()
    });
  }

  async getTradeHistory(itemName, days = 30) {
    const tradeHistory = this.db.collection('trade_history');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const history = await tradeHistory
      .find({ 
        $or: [
          { item_offered: { $regex: itemName, $options: 'i' } },
          { item_wanted: { $regex: itemName, $options: 'i' } },
          { traded_for: { $elemMatch: { $regex: itemName, $options: 'i' } } }
        ],
        traded_at: { $gte: cutoffDate }
      })
      .sort({ traded_at: -1 })
      .limit(50)
      .toArray();

    return {
      item_name: itemName,
      data: history,
      stats: {
        total_trades: history.length,
        last_trade: history.length > 0 ? history[0].traded_at : null
      }
    };
  }

  // ==================== WISHLIST ====================

  async addToWishlist(userId, wishlistData) {
    const wishlist = this.db.collection('wishlists');
    
    // Verificar si ya existe
    const existing = await wishlist.findOne({
      user_id: userId,
      item_name: wishlistData.item_name
    });

    if (existing) {
      throw new Error('Este item ya está en tu wishlist');
    }

    const item = {
      user_id: userId,
      item_name: wishlistData.item_name,
      item_type: wishlistData.item_type || 'weapon',
      max_price: wishlistData.max_price || null,
      notes: wishlistData.notes || '',
      notify: wishlistData.notify !== false,
      created_at: new Date()
    };

    const result = await wishlist.insertOne(item);
    return { ...item, _id: result.insertedId };
  }

  async getWishlist(userId) {
    const wishlist = this.db.collection('wishlists');
    return await wishlist
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .toArray();
  }

  async removeFromWishlist(userId, wishlistId) {
    const wishlist = this.db.collection('wishlists');
    const result = await wishlist.deleteOne({
      _id: new ObjectId(wishlistId),
      user_id: userId
    });

    if (result.deletedCount === 0) {
      throw new Error('Item no encontrado en wishlist');
    }

    return { success: true, message: 'Item eliminado de wishlist' };
  }

  async checkWishlistMatches(listingData) {
    const wishlist = this.db.collection('wishlists');
    
    const matches = await wishlist.find({
      item_name: listingData.item_name,
      notify: true,
      $or: [
        { max_price: null },
        { max_price: { $gte: listingData.price } }
      ]
    }).toArray();

    return matches;
  }

  // ==================== SISTEMA DE REPUTACIÓN ====================

  async rateUser(ratedUserId, raterUserId, ratingData) {
    const ratings = this.db.collection('user_trade_ratings');
    
    // Verificar que existe una transacción entre estos usuarios
    const hasTraded = await this.tradeTransactions.findOne({
      $or: [
        { buyer_id: raterUserId, seller_id: ratedUserId },
        { seller_id: raterUserId, buyer_id: ratedUserId }
      ],
      status: 'completed'
    });

    if (!hasTraded) {
      throw new Error('Solo puedes calificar a usuarios con los que has tradea do');
    }

    // Verificar si ya calificó
    const existing = await ratings.findOne({
      rated_user_id: ratedUserId,
      rater_user_id: raterUserId,
      transaction_id: hasTraded._id
    });

    if (existing) {
      throw new Error('Ya has calificado a este usuario por esta transacción');
    }

    const rating = {
      rated_user_id: ratedUserId,
      rater_user_id: raterUserId,
      transaction_id: hasTraded._id,
      rating: ratingData.rating, // 1-5
      communication: ratingData.communication, // 1-5
      speed: ratingData.speed, // 1-5
      fairness: ratingData.fairness, // 1-5
      comment: ratingData.comment || '',
      created_at: new Date()
    };

    const result = await ratings.insertOne(rating);
    
    // Actualizar stats de reputación del usuario
    await this.updateUserReputation(ratedUserId);

    return { ...rating, _id: result.insertedId };
  }

  async updateUserReputation(userId) {
    const ratings = this.db.collection('user_trade_ratings');
    const users = this.db.collection('users');
    
    const userRatings = await ratings.find({ rated_user_id: userId }).toArray();
    
    if (userRatings.length === 0) {
      await users.updateOne(
        { userId: userId },
        { 
          $set: { 
            reputation: {
              avg_rating: 0,
              total_ratings: 0,
              communication: 0,
              speed: 0,
              fairness: 0,
              total_trades: 0
            }
          } 
        }
      );
      return;
    }

    const totalTrades = await this.tradeTransactions.countDocuments({
      $or: [{ buyer_id: userId }, { seller_id: userId }],
      status: 'completed'
    });

    const stats = {
      avg_rating: userRatings.reduce((a, b) => a + b.rating, 0) / userRatings.length,
      total_ratings: userRatings.length,
      communication: userRatings.reduce((a, b) => a + b.communication, 0) / userRatings.length,
      speed: userRatings.reduce((a, b) => a + b.speed, 0) / userRatings.length,
      fairness: userRatings.reduce((a, b) => a + b.fairness, 0) / userRatings.length,
      total_trades: totalTrades,
      last_updated: new Date()
    };

    await users.updateOne(
      { userId: userId },
      { $set: { reputation: stats } }
    );

    return stats;
  }

  async getUserReputation(userId) {
    const users = this.db.collection('users');
    const user = await users.findOne({ userId: userId });
    
    if (!user || !user.reputation) {
      return {
        avg_rating: 0,
        total_ratings: 0,
        communication: 0,
        speed: 0,
        fairness: 0,
        total_trades: 0
      };
    }

    return user.reputation;
  }

  async getUserRatings(userId, page = 1, limit = 10) {
    const ratings = this.db.collection('user_trade_ratings');
    const skip = (page - 1) * limit;

    const userRatings = await ratings
      .find({ rated_user_id: userId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await ratings.countDocuments({ rated_user_id: userId });

    return {
      ratings: userRatings,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }
}

export default MarketplaceService;
