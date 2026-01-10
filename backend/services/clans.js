import { ObjectId } from 'mongodb';

export default class ClansService {
  constructor(db) {
    this.db = db;
    this.clans = db.collection('clans');
    this.users = db.collection('users');
  }

  async createClan(clanData) {
    const { leader_id, name, description, tag, logo, type, visibility, max_members } = clanData;

    const clan = {
      leader_id: new ObjectId(leader_id),
      name,
      description,
      tag, // Etiqueta del clan (ej: [ABC])
      logo: logo || '',
      type, // PvP, PvE, Casual, Competitive
      visibility, // public, private, friends_only
      max_members: max_members || 50,
      members: [
        {
          user_id: new ObjectId(leader_id),
          username: clanData.leader_name,
          avatar: clanData.leader_avatar || '',
          role: 'leader',
          joined_at: new Date(),
          contribution_points: 0
        }
      ],
      level: 1,
      experience: 0,
      treasury: 0, // Dinero/recursos del clan
      banner: '',
      discord_link: '',
      website: '',
      founded_at: new Date(),
      updated_at: new Date(),
      stats: {
        total_raids: 0,
        total_wins: 0,
        average_rating: 0
      }
    };

    const result = await this.clans.insertOne(clan);
    return { ...clan, _id: result.insertedId };
  }

  async getClanById(clanId) {
    const clan = await this.clans.findOne({ _id: new ObjectId(clanId) });
    return clan;
  }

  async getClansByUser(userId) {
    const userIdObj = userId instanceof ObjectId ? userId : new ObjectId(userId);
    return await this.clans
      .find({ 'members.user_id': userIdObj })
      .sort({ founded_at: -1 })
      .toArray();
  }

  async getTopClans(limit = 50, sortBy = 'level') {
    const sortField = {};
    sortField[sortBy] = -1;

    return await this.clans
      .find({})
      .sort(sortField)
      .limit(limit)
      .toArray();
  }

  async getClansByType(type) {
    return await this.clans
      .find({ type, visibility: 'public' })
      .sort({ level: -1 })
      .toArray();
  }

  async searchClans(query) {
    return await this.clans
      .find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { tag: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ],
        visibility: { $in: ['public', 'friends_only'] }
      })
      .sort({ level: -1 })
      .toArray();
  }

  async requestToJoinClan(clanId, userId, username, avatar) {
    const clanIdObj = new ObjectId(clanId);
    const userIdObj = userId instanceof ObjectId ? userId : new ObjectId(userId);

    // Verificar si ya es miembro
    const clan = await this.clans.findOne({
      _id: clanIdObj,
      'members.user_id': userIdObj
    });

    if (clan) {
      throw new Error('Ya eres miembro de este clan');
    }

    // Crear solicitud de ingreso
    const result = await this.db.collection('clan_requests').insertOne({
      clan_id: clanIdObj,
      user_id: userIdObj,
      username,
      avatar: avatar || '',
      status: 'pending',
      requested_at: new Date()
    });

    return { _id: result.insertedId, status: 'pending' };
  }

  async respondToJoinRequest(requestId, approve, clanId, userId) {
    const requestIdObj = new ObjectId(requestId);
    const clanIdObj = new ObjectId(clanId);

    if (approve) {
      // Agregar miembro al clan
      const request = await this.db.collection('clan_requests').findOne({ _id: requestIdObj });
      
      if (!request) {
        throw new Error('Solicitud no encontrada');
      }

      const clan = await this.clans.findOne({ _id: clanIdObj });
      
      if (clan.members.length >= clan.max_members) {
        throw new Error('El clan está lleno');
      }

      // Agregar miembro
      await this.clans.updateOne(
        { _id: clanIdObj },
        {
          $push: {
            members: {
              user_id: request.user_id,
              username: request.username,
              avatar: request.avatar,
              role: 'member',
              joined_at: new Date(),
              contribution_points: 0
            }
          }
        }
      );

      // Marcar solicitud como aceptada
      await this.db.collection('clan_requests').updateOne(
        { _id: requestIdObj },
        { $set: { status: 'accepted', responded_at: new Date() } }
      );

      return { success: true, request, clan };
    } else {
      // Rechazar solicitud
      const request = await this.db.collection('clan_requests').findOne({ _id: requestIdObj });
      const clan = await this.clans.findOne({ _id: clanIdObj });

      await this.db.collection('clan_requests').updateOne(
        { _id: requestIdObj },
        { $set: { status: 'rejected', responded_at: new Date() } }
      );

      return { success: true, request, clan };
    }
  }

  async removeMemberFromClan(clanId, memberId) {
    const clanIdObj = new ObjectId(clanId);
    const memberIdObj = memberId instanceof ObjectId ? memberId : new ObjectId(memberId);

    return await this.clans.updateOne(
      { _id: clanIdObj },
      { $pull: { members: { user_id: memberIdObj } } }
    );
  }

  async updateClanStats(clanId, stats) {
    const clanIdObj = new ObjectId(clanId);
    
    return await this.clans.updateOne(
      { _id: clanIdObj },
      {
        $set: {
          'stats.total_raids': stats.total_raids || 0,
          'stats.total_wins': stats.total_wins || 0,
          'stats.average_rating': stats.average_rating || 0,
          updated_at: new Date()
        }
      }
    );
  }

  async addContributionPoints(clanId, userId, points) {
    const clanIdObj = new ObjectId(clanId);
    const userIdObj = userId instanceof ObjectId ? userId : new ObjectId(userId);

    return await this.clans.updateOne(
      { _id: clanIdObj, 'members.user_id': userIdObj },
      { $inc: { 'members.$.contribution_points': points } }
    );
  }

  async updateClan(clanId, updateData) {
    const clanIdObj = new ObjectId(clanId);
    
    return await this.clans.updateOne(
      { _id: clanIdObj },
      { $set: { ...updateData, updated_at: new Date() } }
    );
  }

  async disbandClan(clanId) {
    const clanIdObj = new ObjectId(clanId);
    return await this.clans.deleteOne({ _id: clanIdObj });
  }

  async getPendingRequests(clanId) {
    const clanIdObj = new ObjectId(clanId);
    return await this.db.collection('clan_requests')
      .find({ clan_id: clanIdObj, status: 'pending' })
      .toArray();
  }
}
