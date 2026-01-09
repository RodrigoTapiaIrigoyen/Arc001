import { ObjectId } from 'mongodb';

export default class GroupsService {
  constructor(db) {
    this.db = db;
    this.groups = db.collection('groups');
    this.groupMessages = db.collection('group_messages');
    this.groupLogs = db.collection('group_logs');
    this.users = db.collection('users');
  }

  // ============ CREAR GRUPO ============
  async createGroup(data) {
    const group = {
      title: data.title,
      description: data.description,
      type: data.type || 'clan', // clan, raid-group, trading, social
      owner_id: data.owner_id,
      owner_name: data.owner_name,
      owner_avatar: data.owner_avatar || '',
      icon: data.icon || '',
      banner: data.banner || '',
      requirements: data.requirements || '',
      mode: data.mode || 'default',
      level_required: data.level_required || 'any',
      language: data.language || 'es',
      schedule: data.schedule || '',
      tags: data.tags || [],
      max_members: data.max_members || 50,
      
      // Estructura de miembros mejorada
      members: [{
        user_id: data.owner_id,
        username: data.owner_name,
        avatar: data.owner_avatar || '',
        role: 'leader',
        status: 'active', // active, inactive, banned
        joined_at: new Date(),
        permissions: this.getDefaultPermissions('leader')
      }],
      
      joinRequests: [],
      bannedUsers: [],
      
      // Estado y estadísticas
      status: 'open', // open, in_progress, full, closed, private
      visibility: data.visibility || 'public', // public, private, unlisted
      is_verified: false,
      reputation: 0,
      total_raids: 0,
      success_rate: 100,
      
      // Configuración de grupo
      settings: {
        allow_join_requests: true,
        auto_accept_members: false,
        require_voice_chat: false,
        members_can_invite: true,
        show_member_list: true,
        allow_trading: true,
        discord_link: data.discord_link || '',
        external_links: []
      },
      
      // Roles personalizados
      custom_roles: [],
      
      // Canales temáticos (como Discord)
      channels: [
        {
          id: 'general',
          name: 'general',
          type: 'text',
          description: 'Canal general del grupo',
          is_default: true,
          created_at: new Date()
        },
        {
          id: 'estrategia',
          name: 'estrategia',
          type: 'text',
          description: 'Discusiones sobre estrategia y táctica',
          is_default: true,
          created_at: new Date()
        },
        {
          id: 'trading',
          name: 'trading',
          type: 'text',
          description: 'Intercambio de items y recursos',
          is_default: true,
          created_at: new Date()
        },
        {
          id: 'noticias',
          name: 'noticias',
          type: 'text',
          description: 'Noticias y actualizaciones del juego',
          is_default: true,
          created_at: new Date()
        }
      ],
      
      // Sistema de Tiers
      tier: {
        level: 'bronce', // bronce, plata, oro, diamante
        next_milestone: {
          type: 'members',
          current: data.max_members ? 1 : 1,
          required: 10
        },
        achievements: [],
        calculated_at: new Date()
      },
      
      // Estadísticas
      statistics: {
        total_messages: 0,
        total_raids_completed: 0,
        average_session_duration: 0,
        member_retention_rate: 100,
        days_active: 0,
        last_activity: new Date()
      },
      
      // Auditoría
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await this.groups.insertOne(group);
    await this.logAction(result.insertedId, data.owner_id, 'group_created', `Grupo "${data.title}" creado`);
    
    return { ...group, _id: result.insertedId };
  }

  // ============ BÚSQUEDA AVANZADA DE GRUPOS ============
  async searchGroups(filters = {}, page = 1, limit = 20) {
    const query = { status: { $ne: 'closed' } };
    
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { tags: { $in: [filters.search] } }
      ];
    }
    
    if (filters.type) query.type = filters.type;
    if (filters.mode) query.mode = filters.mode;
    if (filters.language) query.language = filters.language;
    if (filters.level_required) query.level_required = filters.level_required;
    if (filters.status) query.status = filters.status;
    if (filters.visibility && filters.visibility !== 'all') query.visibility = filters.visibility;
    if (filters.tags && filters.tags.length > 0) query.tags = { $in: filters.tags };
    if (filters.min_reputation) query.reputation = { $gte: filters.min_reputation };
    if (filters.sort_by === 'new') {
      return this.groups
        .find(query)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
    } else if (filters.sort_by === 'popular') {
      return this.groups
        .find(query)
        .sort({ reputation: -1, total_raids: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
    }
    
    return this.groups
      .find(query)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
  }

  async getGroupById(groupId) {
    return this.groups.findOne({ _id: new ObjectId(groupId) });
  }

  async getGroupsByUser(userId) {
    // Convertir a string para comparar con miembros
    const userIdStr = userId instanceof ObjectId ? userId.toString() : userId;
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    // Buscar grupos donde el usuario es miembro (comparar tanto como string como ObjectId)
    return this.groups.find({
      $or: [
        { 'members.user_id': userIdStr },
        { 'members.user_id': userIdObj }
      ]
    }).toArray();
  }

  // ============ GESTIÓN DE MIEMBROS ============
  async requestJoin(groupId, user) {
    const group = await this.groups.findOne({ _id: new ObjectId(groupId) });
    if (!group) throw new Error('Grupo no encontrado');
    if (group.owner_id === user.user_id) throw new Error('No puedes solicitar unirse a tu propio grupo');
    if (group.members.find(m => m.user_id === user.user_id)) throw new Error('Ya eres miembro');
    if (group.bannedUsers.includes(user.user_id)) throw new Error('Has sido baneado de este grupo');
    if (group.joinRequests?.find(r => r.user_id === user.user_id)) throw new Error('Ya tienes una solicitud pendiente');
    if (group.members.length >= group.max_members && group.status !== 'in_progress') throw new Error('Grupo lleno');
    
    await this.groups.updateOne(
      { _id: new ObjectId(groupId) },
      {
        $push: {
          joinRequests: {
            user_id: user.user_id,
            username: user.username,
            avatar: user.avatar,
            message: user.message || '',
            requested_at: new Date()
          }
        },
        $set: { updated_at: new Date() }
      }
    );
    
    await this.logAction(groupId, user.user_id, 'join_request', `${user.username} solicitó unirse`);
    return true;
  }

  async acceptJoinRequest(groupId, userId, actingUserId) {
    const group = await this.groups.findOne({ _id: new ObjectId(groupId) });
    if (!group) throw new Error('Grupo no encontrado');
    
    const actor = group.members.find(m => m.user_id === actingUserId && ['leader', 'moderator'].includes(m.role));
    if (!actor) throw new Error('No tienes permiso para aceptar solicitudes');
    
    const req = group.joinRequests?.find(r => r.user_id === userId);
    if (!req) throw new Error('Solicitud no encontrada');
    
    if (group.members.length >= group.max_members && group.status !== 'in_progress') throw new Error('Grupo lleno');
    
    const userData = await this.users.findOne({ _id: new ObjectId(userId) });
    
    await this.groups.updateOne(
      { _id: new ObjectId(groupId) },
      {
        $push: {
          members: {
            user_id: userId,
            username: req.username,
            avatar: req.avatar,
            role: 'member',
            status: 'active',
            joined_at: new Date(),
            permissions: this.getDefaultPermissions('member')
          }
        },
        $pull: { joinRequests: { user_id: userId } },
        $set: { updated_at: new Date() }
      }
    );
    
    await this.logAction(groupId, actingUserId, 'member_accepted', `${req.username} fue aceptado`);
    return true;
  }

  async rejectJoinRequest(groupId, userId, actingUserId, reason = '') {
    const group = await this.groups.findOne({ _id: new ObjectId(groupId) });
    if (!group) throw new Error('Grupo no encontrado');
    
    const actor = group.members.find(m => m.user_id === actingUserId && ['leader', 'moderator'].includes(m.role));
    if (!actor) throw new Error('No tienes permiso para rechazar solicitudes');
    
    const req = group.joinRequests?.find(r => r.user_id === userId);
    if (!req) throw new Error('Solicitud no encontrada');
    
    await this.groups.updateOne(
      { _id: new ObjectId(groupId) },
      {
        $pull: { joinRequests: { user_id: userId } },
        $set: { updated_at: new Date() }
      }
    );
    
    await this.logAction(groupId, actingUserId, 'member_rejected', `${req.username} fue rechazado: ${reason}`);
    return true;
  }

  async removeMember(groupId, userId, actingUserId, reason = '') {
    const group = await this.groups.findOne({ _id: new ObjectId(groupId) });
    if (!group) throw new Error('Grupo no encontrado');
    
    const actor = group.members.find(m => m.user_id === actingUserId && ['leader', 'moderator'].includes(m.role));
    if (!actor) throw new Error('No tienes permiso para remover miembros');
    
    const member = group.members.find(m => m.user_id === userId);
    if (!member) throw new Error('Miembro no encontrado');
    if (member.role === 'leader') throw new Error('No puedes remover al líder');
    
    await this.groups.updateOne(
      { _id: new ObjectId(groupId) },
      {
        $pull: { members: { user_id: userId } },
        $set: { updated_at: new Date() }
      }
    );
    
    await this.logAction(groupId, actingUserId, 'member_removed', `${member.username} fue removido: ${reason}`);
    return true;
  }

  async banMember(groupId, userId, actingUserId, reason = '') {
    const group = await this.groups.findOne({ _id: new ObjectId(groupId) });
    if (!group) throw new Error('Grupo no encontrado');
    
    const actor = group.members.find(m => m.user_id === actingUserId && m.role === 'leader');
    if (!actor) throw new Error('Solo el líder puede banear miembros');
    
    const member = group.members.find(m => m.user_id === userId);
    if (!member) throw new Error('Miembro no encontrado');
    
    await this.groups.updateOne(
      { _id: new ObjectId(groupId) },
      {
        $pull: { members: { user_id: userId } },
        $push: { bannedUsers: userId },
        $set: { updated_at: new Date() }
      }
    );
    
    await this.logAction(groupId, actingUserId, 'member_banned', `${member.username} fue baneado: ${reason}`);
    return true;
  }

  async promoteToModerator(groupId, userId, actingUserId) {
    const group = await this.groups.findOne({ _id: new ObjectId(groupId) });
    if (!group) throw new Error('Grupo no encontrado');
    
    const actor = group.members.find(m => m.user_id === actingUserId && m.role === 'leader');
    if (!actor) throw new Error('Solo el líder puede promover miembros');
    
    await this.groups.updateOne(
      { _id: new ObjectId(groupId) },
      {
        $set: {
          'members.$[elem].role': 'moderator',
          'members.$[elem].permissions': this.getDefaultPermissions('moderator'),
          updated_at: new Date()
        }
      },
      { arrayFilters: [{ 'elem.user_id': userId }] }
    );
    
    const member = group.members.find(m => m.user_id === userId);
    await this.logAction(groupId, actingUserId, 'member_promoted', `${member.username} promovido a moderador`);
    return true;
  }

  async leaveClan(groupId, userId) {
    const group = await this.groups.findOne({ _id: new ObjectId(groupId) });
    if (!group) throw new Error('Grupo no encontrado');
    
    const member = group.members.find(m => m.user_id === userId);
    if (!member) throw new Error('No eres miembro de este grupo');
    
    if (member.role === 'leader') throw new Error('El líder no puede salir del grupo');
    
    await this.groups.updateOne(
      { _id: new ObjectId(groupId) },
      {
        $pull: { members: { user_id: userId } },
        $set: { updated_at: new Date() }
      }
    );
    
    await this.logAction(groupId, userId, 'member_left', `${member.username} salió del grupo`);
    return true;
  }

  // ============ CHAT DE GRUPO ============
  async sendMessage(groupId, user, content, channelId = 'general', attachments = []) {
    const group = await this.groups.findOne({ _id: new ObjectId(groupId) });
    if (!group) throw new Error('Grupo no encontrado');
    
    // Comparar user_id como string para ambos lados
    const userIdStr = user.user_id instanceof ObjectId ? user.user_id.toString() : user.user_id;
    const member = group.members.find(m => {
      const memberIdStr = m.user_id instanceof ObjectId ? m.user_id.toString() : m.user_id;
      return memberIdStr === userIdStr;
    });
    if (!member) throw new Error('No eres miembro de este grupo');

    const channel = group.channels.find(c => c.id === channelId);
    if (!channel) throw new Error('Canal no encontrado');
    
    const msg = {
      group_id: new ObjectId(groupId),
      channel_id: channelId,
      user_id: userIdStr,
      username: user.username,
      avatar: user.avatar,
      content,
      attachments,
      edited: false,
      edited_at: null,
      deleted: false,
      reactions: {},
      created_at: new Date()
    };
    
    await this.groupMessages.insertOne(msg);
    await this.groups.updateOne(
      { _id: new ObjectId(groupId) },
      { $inc: { 'statistics.total_messages': 1 } }
    );
    
    return msg;
  }

  async editMessage(messageId, content, userId) {
    const msg = await this.groupMessages.findOne({ _id: new ObjectId(messageId) });
    if (!msg) throw new Error('Mensaje no encontrado');
    if (msg.user_id !== userId) throw new Error('No puedes editar el mensaje de otro usuario');
    
    await this.groupMessages.updateOne(
      { _id: new ObjectId(messageId) },
      {
        $set: {
          content,
          edited: true,
          edited_at: new Date()
        }
      }
    );
    
    return true;
  }

  async deleteMessage(messageId, userId) {
    const msg = await this.groupMessages.findOne({ _id: new ObjectId(messageId) });
    if (!msg) throw new Error('Mensaje no encontrado');
    
    const group = await this.groups.findOne({ _id: msg.group_id });
    const actor = group.members.find(m => m.user_id === userId && ['leader', 'moderator'].includes(m.role));
    
    if (msg.user_id !== userId && !actor) throw new Error('No puedes eliminar este mensaje');
    
    await this.groupMessages.updateOne(
      { _id: new ObjectId(messageId) },
      { $set: { deleted: true, content: '[Mensaje eliminado]' } }
    );
    
    return true;
  }

  async getMessages(groupId, limit = 50, page = 1, channelId = 'general') {
    const skip = (page - 1) * limit;
    return this.groupMessages
      .find({ group_id: new ObjectId(groupId), channel_id: channelId, deleted: { $ne: true } })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  async addReaction(messageId, userId, emoji) {
    const msg = await this.groupMessages.findOne({ _id: new ObjectId(messageId) });
    if (!msg) throw new Error('Mensaje no encontrado');
    
    const reactionKey = `reactions.${emoji}`;
    const reaction = msg.reactions?.[emoji] || [];
    
    if (reaction.includes(userId)) {
      // Remover reacción
      await this.groupMessages.updateOne(
        { _id: new ObjectId(messageId) },
        { $pull: { [reactionKey]: userId } }
      );
    } else {
      // Agregar reacción
      await this.groupMessages.updateOne(
        { _id: new ObjectId(messageId) },
        { $push: { [reactionKey]: userId } }
      );
    }
    
    return true;
  }

  // ============ CONFIGURACIÓN DE GRUPO ============
  async updateGroupSettings(groupId, settings, actingUserId) {
    const group = await this.groups.findOne({ _id: new ObjectId(groupId) });
    if (!group) throw new Error('Grupo no encontrado');
    
    const actor = group.members.find(m => m.user_id === actingUserId && m.role === 'leader');
    if (!actor) throw new Error('Solo el líder puede cambiar la configuración');
    
    await this.groups.updateOne(
      { _id: new ObjectId(groupId) },
      {
        $set: {
          'settings': { ...group.settings, ...settings },
          updated_at: new Date()
        }
      }
    );
    
    await this.logAction(groupId, actingUserId, 'settings_updated', 'Configuración del grupo actualizada');
    return true;
  }

  async updateGroupInfo(groupId, info, actingUserId) {
    const group = await this.groups.findOne({ _id: new ObjectId(groupId) });
    if (!group) throw new Error('Grupo no encontrado');
    
    const actor = group.members.find(m => m.user_id === actingUserId && ['leader', 'moderator'].includes(m.role));
    if (!actor) throw new Error('No tienes permiso para actualizar el grupo');
    
    const updateData = {};
    if (info.title) updateData.title = info.title;
    if (info.description) updateData.description = info.description;
    if (info.icon) updateData.icon = info.icon;
    if (info.banner) updateData.banner = info.banner;
    if (info.tags) updateData.tags = info.tags;
    if (info.max_members) updateData.max_members = info.max_members;
    updateData.updated_at = new Date();
    
    await this.groups.updateOne(
      { _id: new ObjectId(groupId) },
      { $set: updateData }
    );
    
    await this.logAction(groupId, actingUserId, 'group_updated', 'Información del grupo actualizada');
    return true;
  }

  // ============ AUDITORÍA Y LOGS ============
  async logAction(groupId, userId, action, description) {
    const log = {
      group_id: new ObjectId(groupId),
      user_id: userId,
      action,
      description,
      timestamp: new Date()
    };
    
    await this.groupLogs.insertOne(log);
  }

  async getGroupLogs(groupId, limit = 100) {
    return this.groupLogs
      .find({ group_id: new ObjectId(groupId) })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  // ============ UTILIDADES ============
  getDefaultPermissions(role) {
    const permissions = {
      member: {
        send_messages: true,
        edit_own_messages: true,
        delete_own_messages: true,
        invite_members: false,
        edit_group: false,
        manage_members: false,
        manage_roles: false,
        view_logs: false,
        ban_members: false
      },
      moderator: {
        send_messages: true,
        edit_own_messages: true,
        delete_own_messages: true,
        delete_others_messages: true,
        invite_members: true,
        edit_group: true,
        manage_members: true,
        manage_roles: false,
        view_logs: true,
        ban_members: false
      },
      leader: {
        send_messages: true,
        edit_own_messages: true,
        delete_own_messages: true,
        delete_others_messages: true,
        invite_members: true,
        edit_group: true,
        manage_members: true,
        manage_roles: true,
        view_logs: true,
        ban_members: true,
        delete_group: true,
        transfer_ownership: true
      }
    };
    
    return permissions[role] || permissions.member;
  }

  async getGroupStats(groupId) {
    const group = await this.groups.findOne({ _id: new ObjectId(groupId) });
    if (!group) throw new Error('Grupo no encontrado');
    
    return {
      total_members: group.members.length,
      total_messages: group.statistics.total_messages,
      total_raids: group.statistics.total_raids_completed,
      success_rate: group.success_rate,
      reputation: group.reputation,
      created_at: group.created_at
    };
  }

  // ============ SISTEMA DE TIERS ============
  async calculateGroupTier(groupId) {
    const group = await this.groups.findOne({ _id: new ObjectId(groupId) });
    if (!group) throw new Error('Grupo no encontrado');

    const memberCount = group.members.length;
    const messageCount = group.statistics.total_messages || 0;
    const daysActive = Math.floor((new Date() - new Date(group.created_at)) / (1000 * 60 * 60 * 24));

    let tierLevel = 'bronce';
    let nextMilestone = { type: 'members', current: memberCount, required: 10 };

    // Lógica de tiers
    if (memberCount >= 100 && messageCount >= 5000 && daysActive >= 30) {
      tierLevel = 'diamante';
      nextMilestone = { type: 'reputation', current: group.reputation, required: 1000 };
    } else if (memberCount >= 50 && messageCount >= 2000 && daysActive >= 14) {
      tierLevel = 'oro';
      nextMilestone = { type: 'messages', current: messageCount, required: 5000 };
    } else if (memberCount >= 25 && messageCount >= 500 && daysActive >= 7) {
      tierLevel = 'plata';
      nextMilestone = { type: 'members', current: memberCount, required: 50 };
    } else {
      tierLevel = 'bronce';
      nextMilestone = { type: 'members', current: memberCount, required: 25 };
    }

    const tierData = {
      level: tierLevel,
      next_milestone: nextMilestone,
      achievements: this.calculateAchievements(group),
      calculated_at: new Date()
    };

    await this.groups.updateOne(
      { _id: new ObjectId(groupId) },
      { $set: { 'tier': tierData, 'statistics.days_active': daysActive } }
    );

    return tierData;
  }

  calculateAchievements(group) {
    const achievements = [];
    const memberCount = group.members.length;
    const messageCount = group.statistics.total_messages || 0;

    if (memberCount >= 10) achievements.push('10_members');
    if (memberCount >= 25) achievements.push('25_members');
    if (memberCount >= 50) achievements.push('50_members');
    if (memberCount >= 100) achievements.push('100_members');
    if (messageCount >= 500) achievements.push('500_messages');
    if (messageCount >= 2000) achievements.push('2000_messages');
    if (messageCount >= 5000) achievements.push('5000_messages');

    const daysActive = Math.floor((new Date() - new Date(group.created_at)) / (1000 * 60 * 60 * 24));
    if (daysActive >= 7) achievements.push('week_active');
    if (daysActive >= 30) achievements.push('month_active');

    return achievements;
  }

  // ============ GESTIÓN DE CANALES ============
  async createChannel(groupId, actingUserId, channelData) {
    const group = await this.groups.findOne({ _id: new ObjectId(groupId) });
    if (!group) throw new Error('Grupo no encontrado');

    const actor = group.members.find(m => m.user_id === actingUserId && ['leader', 'moderator'].includes(m.role));
    if (!actor) throw new Error('No tienes permiso para crear canales');

    const newChannel = {
      id: channelData.name.toLowerCase().replace(/\s+/g, '-'),
      name: channelData.name,
      type: 'text',
      description: channelData.description || '',
      is_default: false,
      created_at: new Date()
    };

    await this.groups.updateOne(
      { _id: new ObjectId(groupId) },
      { $push: { channels: newChannel } }
    );

    await this.logAction(groupId, actingUserId, 'channel_created', `Canal "${newChannel.name}" creado`);
    return newChannel;
  }

  async deleteChannel(groupId, channelId, actingUserId) {
    const group = await this.groups.findOne({ _id: new ObjectId(groupId) });
    if (!group) throw new Error('Grupo no encontrado');

    const actor = group.members.find(m => m.user_id === actingUserId && m.role === 'leader');
    if (!actor) throw new Error('Solo el líder puede eliminar canales');

    const channel = group.channels.find(c => c.id === channelId);
    if (!channel) throw new Error('Canal no encontrado');
    if (channel.is_default) throw new Error('No puedes eliminar canales por defecto');

    await this.groups.updateOne(
      { _id: new ObjectId(groupId) },
      { $pull: { channels: { id: channelId } } }
    );

    // Eliminar todos los mensajes del canal
    await this.groupMessages.deleteMany({
      group_id: new ObjectId(groupId),
      channel_id: channelId
    });

    await this.logAction(groupId, actingUserId, 'channel_deleted', `Canal "${channel.name}" eliminado`);
    return true;
  }

  async getGroupChannels(groupId) {
    const group = await this.groups.findOne({ _id: new ObjectId(groupId) });
    if (!group) throw new Error('Grupo no encontrado');

    return group.channels || [];
  }
}

