import { ObjectId } from 'mongodb';

export class TrackerService {
  constructor(db) {
    this.db = db;
    this.trackers = db.collection('user_trackers');
  }

  async connect() {
    // No need to connect, we receive the db instance
  }

  // Create a new tracker
  async createTracker(trackerData) {
    
    const tracker = {
      ...trackerData,
      current_progress: trackerData.current_progress || 0,
      completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await this.trackers.insertOne(tracker);
    return { ...tracker, _id: result.insertedId };
  }

  // Get all trackers for a user
  async getUserTrackers(username, options = {}) {
    
    const {
      category,
      completed,
      sort = 'recent',
      page = 1,
      limit = 50,
    } = options;

    const query = { username };
    
    if (category) {
      query.category = category;
    }

    if (completed !== undefined) {
      query.completed = completed === 'true' || completed === true;
    }

    let sortOptions = { created_at: -1 };
    if (sort === 'progress') {
      sortOptions = { progress_percentage: -1 };
    } else if (sort === 'alphabetical') {
      sortOptions = { title: 1 };
    }

    const skip = (page - 1) * limit;
    const [trackers, total] = await Promise.all([
      this.trackers.find(query).sort(sortOptions).skip(skip).limit(limit).toArray(),
      this.trackers.countDocuments(query),
    ]);

    // Calculate progress percentage
    const trackersWithProgress = trackers.map(t => ({
      ...t,
      progress_percentage: t.target_value > 0 ? Math.round((t.current_progress / t.target_value) * 100) : 0,
    }));

    return {
      trackers: trackersWithProgress,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get tracker by ID
  async getTrackerById(trackerId) {
    
    const tracker = await this.trackers.findOne({ _id: new ObjectId(trackerId) });
    if (tracker) {
      tracker.progress_percentage = tracker.target_value > 0 
        ? Math.round((tracker.current_progress / tracker.target_value) * 100) 
        : 0;
    }
    return tracker;
  }

  // Update tracker progress
  async updateProgress(trackerId, newProgress, username) {
    
    const tracker = await this.trackers.findOne({ 
      _id: new ObjectId(trackerId),
      username 
    });

    if (!tracker) {
      throw new Error('Tracker not found or unauthorized');
    }

    const completed = newProgress >= tracker.target_value;
    
    const result = await this.trackers.updateOne(
      { _id: new ObjectId(trackerId) },
      { 
        $set: { 
          current_progress: newProgress,
          completed,
          completed_at: completed && !tracker.completed ? new Date() : tracker.completed_at,
          updated_at: new Date(),
        } 
      }
    );

    return await this.getTrackerById(trackerId);
  }

  // Increment progress by amount
  async incrementProgress(trackerId, amount, username) {
    
    const tracker = await this.trackers.findOne({ 
      _id: new ObjectId(trackerId),
      username 
    });

    if (!tracker) {
      throw new Error('Tracker not found or unauthorized');
    }

    const newProgress = Math.min(tracker.current_progress + amount, tracker.target_value);
    return await this.updateProgress(trackerId, newProgress, username);
  }

  // Delete tracker
  async deleteTracker(trackerId, username) {
    
    const result = await this.trackers.deleteOne({ 
      _id: new ObjectId(trackerId),
      username 
    });

    return { deleted: result.deletedCount > 0 };
  }

  // Get user statistics
  async getUserStats(username) {
    
    const [
      total,
      completed,
      inProgress,
      byCategory,
    ] = await Promise.all([
      this.trackers.countDocuments({ username }),
      this.trackers.countDocuments({ username, completed: true }),
      this.trackers.countDocuments({ username, completed: false }),
      this.trackers.aggregate([
        { $match: { username } },
        { 
          $group: { 
            _id: '$category', 
            count: { $sum: 1 },
            completed: { $sum: { $cond: ['$completed', 1, 0] } },
          } 
        },
      ]).toArray(),
    ]);

    return {
      total,
      completed,
      inProgress,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      byCategory,
    };
  }

  // Get predefined achievements (static data)
  async getAchievements() {
    return [
      {
        id: 'arsenal_master',
        title: 'Arsenal Master',
        description: 'Collect 50 unique weapons',
        category: 'weapons',
        target_value: 50,
        icon: 'Sword',
        rarity: 'legendary',
      },
      {
        id: 'item_collector',
        title: 'Item Collector',
        description: 'Collect 100 different items',
        category: 'items',
        target_value: 100,
        icon: 'Package',
        rarity: 'epic',
      },
      {
        id: 'enemy_slayer',
        title: 'Enemy Slayer',
        description: 'Defeat 500 enemies',
        category: 'enemies',
        target_value: 500,
        icon: 'Target',
        rarity: 'rare',
      },
      {
        id: 'trader_friend',
        title: 'Trader\'s Friend',
        description: 'Complete 25 trades',
        category: 'trading',
        target_value: 25,
        icon: 'ShoppingCart',
        rarity: 'uncommon',
      },
      {
        id: 'community_star',
        title: 'Community Star',
        description: 'Get 100 upvotes on your posts',
        category: 'community',
        target_value: 100,
        icon: 'Users',
        rarity: 'epic',
      },
      {
        id: 'quest_seeker',
        title: 'Quest Seeker',
        description: 'Complete 50 quests',
        category: 'quests',
        target_value: 50,
        icon: 'ScrollText',
        rarity: 'rare',
      },
    ];
  }
}

export default TrackerService;
