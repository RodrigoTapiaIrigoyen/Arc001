import { ObjectId } from 'mongodb';

export default class RaiderProfileService {
  constructor(db) {
    this.db = db;
    this.profiles = db.collection('raider_profiles');
    this.users = db.collection('users');
  }

  async getUserProfile(userId) {
    try {
      const userIdObj = userId instanceof ObjectId ? userId : new ObjectId(userId);
      return await this.profiles.findOne({ user_id: userIdObj });
    } catch (err) {
      console.error('Error getting user profile:', err);
      return null;
    }
  }

  async createProfile(userId, username, avatar, profileData) {
    const userIdObj = userId instanceof ObjectId ? userId : new ObjectId(userId);
    
    const profile = {
      user_id: userIdObj,
      username,
      avatar: avatar || '',
      equipment: profileData.equipment,
      strategy: profileData.strategy,
      company: profileData.company,
      raider_type: profileData.raider_type,
      raider_emoji: profileData.raider_emoji,
      raider_description: profileData.raider_description,
      preferred_weapons: profileData.preferred_weapons || [],
      playstyle_notes: profileData.playstyle_notes || '',
      community_reputation: 0,
      posts_shared: 0,
      groups_created: 0,
      friends_count: 0,
      days_in_community: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await this.profiles.insertOne(profile);
    return { ...profile, _id: result.insertedId };
  }

  async updateProfile(userId, profileData) {
    const userIdObj = userId instanceof ObjectId ? userId : new ObjectId(userId);
    
    const updateData = {
      username: profileData.username,
      avatar: profileData.avatar,
      equipment: profileData.equipment,
      strategy: profileData.strategy,
      company: profileData.company,
      raider_type: profileData.raider_type,
      raider_emoji: profileData.raider_emoji,
      raider_description: profileData.raider_description,
      preferred_weapons: profileData.preferred_weapons || [],
      playstyle_notes: profileData.playstyle_notes || '',
      updated_at: new Date()
    };

    return await this.profiles.findOneAndUpdate(
      { user_id: userIdObj },
      { $set: updateData },
      { returnDocument: 'after', upsert: true }
    );
  }

  async getTopRaiders(limit = 50, sortBy = 'community_reputation') {
    const sortField = {};
    sortField[sortBy] = -1;

    return await this.profiles
      .find({})
      .sort(sortField)
      .limit(limit)
      .toArray();
  }

  async getRaidersByType(raiderType) {
    return await this.profiles
      .find({ raider_type: raiderType })
      .sort({ community_reputation: -1 })
      .toArray();
  }

  async searchRaiders(query) {
    return await this.profiles
      .find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { raider_type: { $regex: query, $options: 'i' } },
          { playstyle_notes: { $regex: query, $options: 'i' } }
        ]
      })
      .sort({ community_reputation: -1 })
      .toArray();
  }

  async updateStats(userId, stats) {
    const userIdObj = userId instanceof ObjectId ? userId : new ObjectId(userId);
    
    const updateData = {};
    if (stats.hasOwnProperty('community_reputation')) {
      updateData.community_reputation = Math.max(0, stats.community_reputation);
    }
    if (stats.hasOwnProperty('posts_shared')) {
      updateData.posts_shared = Math.max(0, stats.posts_shared);
    }
    if (stats.hasOwnProperty('groups_created')) {
      updateData.groups_created = Math.max(0, stats.groups_created);
    }
    if (stats.hasOwnProperty('friends_count')) {
      updateData.friends_count = Math.max(0, stats.friends_count);
    }
    
    updateData.updated_at = new Date();

    return await this.profiles.findOneAndUpdate(
      { user_id: userIdObj },
      { $set: updateData },
      { returnDocument: 'after' }
    );
  }

  async incrementStat(userId, statName, amount = 1) {
    const userIdObj = userId instanceof ObjectId ? userId : new ObjectId(userId);
    
    const validStats = ['community_reputation', 'posts_shared', 'groups_created', 'friends_count'];
    if (!validStats.includes(statName)) {
      throw new Error(`Invalid stat: ${statName}`);
    }

    const updateData = {
      [statName]: amount,
      updated_at: new Date()
    };

    return await this.profiles.findOneAndUpdate(
      { user_id: userIdObj },
      { $inc: updateData },
      { returnDocument: 'after' }
    );
  }

  async getStatistics(userId) {
    const userIdObj = userId instanceof ObjectId ? userId : new ObjectId(userId);
    const profile = await this.profiles.findOne({ user_id: userIdObj });
    
    if (!profile) {
      return {
        community_reputation: 0,
        posts_shared: 0,
        groups_created: 0,
        friends_count: 0,
        days_in_community: 0,
        raider_type: 'sin clasificar'
      };
    }

    return {
      community_reputation: profile.community_reputation || 0,
      posts_shared: profile.posts_shared || 0,
      groups_created: profile.groups_created || 0,
      friends_count: profile.friends_count || 0,
      days_in_community: Math.floor((Date.now() - profile.created_at.getTime()) / (1000 * 60 * 60 * 24)),
      raider_type: profile.raider_type,
      raider_emoji: profile.raider_emoji
    };
  }
}
