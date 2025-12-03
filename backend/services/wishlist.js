import { ObjectId } from 'mongodb';

class WishlistService {
  constructor(db) {
    this.db = db;
    this.wishlist = db.collection('wishlist');
    this.users = db.collection('users');
  }

  /**
   * Agregar item a wishlist
   */
  async addItem(userId, itemData) {
    try {
      const item = {
        userId: new ObjectId(userId),
        itemName: itemData.itemName.trim(),
        itemType: itemData.itemType, // 'weapon', 'armor', 'item'
        rarity: itemData.rarity || null,
        description: itemData.description?.trim() || null,
        maxPrice: itemData.maxPrice?.trim() || null,
        notifyOnAvailable: itemData.notifyOnAvailable !== false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await this.wishlist.insertOne(item);
      
      return {
        _id: result.insertedId.toString(),
        ...item,
        userId: userId
      };
    } catch (error) {
      console.error('Error adding wishlist item:', error);
      throw error;
    }
  }

  /**
   * Obtener wishlist de un usuario
   */
  async getUserWishlist(userId) {
    try {
      const items = await this.wishlist
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .toArray();

      return items.map(item => ({
        _id: item._id.toString(),
        itemName: item.itemName,
        itemType: item.itemType,
        rarity: item.rarity,
        description: item.description,
        maxPrice: item.maxPrice,
        notifyOnAvailable: item.notifyOnAvailable,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      throw error;
    }
  }

  /**
   * Actualizar item de wishlist
   */
  async updateItem(itemId, userId, updates) {
    try {
      const result = await this.wishlist.updateOne(
        { 
          _id: new ObjectId(itemId),
          userId: new ObjectId(userId)
        },
        { 
          $set: {
            ...updates,
            updatedAt: new Date()
          }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating wishlist item:', error);
      throw error;
    }
  }

  /**
   * Eliminar item de wishlist
   */
  async deleteItem(itemId, userId) {
    try {
      const result = await this.wishlist.deleteOne({
        _id: new ObjectId(itemId),
        userId: new ObjectId(userId)
      });

      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting wishlist item:', error);
      throw error;
    }
  }

  /**
   * Buscar usuarios que tienen un item en su wishlist
   */
  async findUsersLookingFor(itemName) {
    try {
      const items = await this.wishlist
        .find({
          itemName: new RegExp(itemName, 'i'),
          notifyOnAvailable: true
        })
        .toArray();

      const userIds = [...new Set(items.map(item => item.userId.toString()))];
      
      return userIds;
    } catch (error) {
      console.error('Error finding users looking for item:', error);
      throw error;
    }
  }

  /**
   * Crear índices
   */
  async createIndexes() {
    try {
      await this.wishlist.createIndex({ userId: 1, createdAt: -1 });
      await this.wishlist.createIndex({ itemName: 1, notifyOnAvailable: 1 });
      console.log('✅ Índices de wishlist creados');
    } catch (error) {
      console.error('Error creating wishlist indexes:', error);
    }
  }
}

export default WishlistService;
