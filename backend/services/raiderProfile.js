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
      kills: 0,
      deaths: 0,
      raids_completed: 0,
      resources_extracted: 0,
      survival_rate: 100,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await this.profiles.insertOne(profile);
    return { ...profile, _id: result.insertedId };
  }

  async updateProfile(userId, profileData) {
    const userIdObj = userId instanceof ObjectId ? userId : new ObjectId(userId);
    
    const update = {
      $set: {
        equipment: profileData.equipment,
        strategy: profileData.strategy,
        company: profileData.company,
        raider_type: profileData.raider_type,
        raider_emoji: profileData.raider_emoji,
        raider_description: profileData.raider_description,
        preferred_weapons: profileData.preferred_weapons || [],
        playstyle_notes: profileData.playstyle_notes || '',
        updated_at: new Date()
      }
    };

    const result = await this.profiles.findOneAndUpdate(
      { user_id: userIdObj },
      update,
      { returnDocument: 'after' }
    );

    return result.value;
  }

  async getTopRaiders(limit = 20, sortBy = 'kills') {
    const sortField = sortBy === 'survival' ? { survival_rate: -1 } : { kills: -1 };
    return this.profiles
      .find({})
      .sort(sortField)
      .limit(limit)
      .toArray();
  }

  async getRaidersByType(raiderType, limit = 10) {
    return this.profiles
      .find({ raider_type: raiderType })
      .limit(limit)
      .toArray();
  }

  async updateStats(userId, stats) {
    const userIdObj = userId instanceof ObjectId ? userId : new ObjectId(userId);
    
    const update = {
      $inc: {
        kills: stats.kills || 0,
        deaths: stats.deaths || 0,
        raids_completed: stats.raids_completed || 0,
        resources_extracted: stats.resources_extracted || 0
      }
    };

    // Recalcular survival_rate
    const profile = await this.profiles.findOne({ user_id: userIdObj });
    if (profile) {
      const totalRaids = (profile.raids_completed || 0) + (stats.raids_completed || 0);
      const totalDeaths = (profile.deaths || 0) + (stats.deaths || 0);
      const survivalRate = totalRaids > 0 ? ((totalRaids - totalDeaths) / totalRaids) * 100 : 100;
      
      update.$set = {
        survival_rate: Math.max(0, Math.min(100, survivalRate)),
        updated_at: new Date()
      };
    }

    const result = await this.profiles.findOneAndUpdate(
      { user_id: userIdObj },
      update,
      { returnDocument: 'after' }
    );

    return result.value;
  }

  async searchRaiders(query = '', limit = 10) {
    const searchRegex = { $regex: query, $options: 'i' };
    return this.profiles
      .find({
        $or: [
          { username: searchRegex },
          { raider_type: searchRegex },
          { playstyle_notes: searchRegex }
        ]
      })
      .limit(limit)
      .toArray();
  }

  async getStatistics(userId) {
    const userIdObj = userId instanceof ObjectId ? userId : new ObjectId(userId);
    const profile = await this.profiles.findOne({ user_id: userIdObj });
    
    if (!profile) return null;

    return {
      kd_ratio: (profile.kills || 0) / Math.max(profile.deaths || 1, 1),
      survival_rate: profile.survival_rate || 0,
      raids_completed: profile.raids_completed || 0,
      resources_extracted: profile.resources_extracted || 0,
      total_engagements: (profile.kills || 0) + (profile.deaths || 0)
    };
  }
}
