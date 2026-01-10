import express from 'express';
import { ObjectId } from 'mongodb';
import { authenticateToken } from '../middleware/auth.js';
import GroupsService from '../services/groups.js';
import RaiderProfileService from '../services/raiderProfile.js';

export default function createGroupsRouter(db, notificationService) {
  const router = express.Router();
  
  if (!db) {
    console.error('❌ createGroupsRouter: db is undefined');
    // Devolver un router con endpoints que retornan error
    router.use((req, res) => {
      res.status(503).json({ error: 'Servicio de grupos no disponible (sin conexión a DB)' });
    });
    return router;
  }
  
  const groupsService = new GroupsService(db);
  const raiderProfileService = new RaiderProfileService(db);
  console.log('✅ GroupsService inicializado para el router');
  console.log('✅ RaiderProfileService inicializado para el router');

  // Helper para validar ObjectId
  const validateObjectId = (id) => ObjectId.isValid(id);

  // ============ CREAR GRUPO ============
  router.post('/create', authenticateToken, async (req, res) => {
    try {
      const { title, description, type, tags, max_members, mode, language, visibility, discord_link } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ error: 'Título y descripción requeridos' });
      }

      const user = req.user;
      const group = await groupsService.createGroup({
        title,
        description,
        type,
        owner_id: user.userId,
        owner_name: user.username,
        owner_avatar: user.avatar || '',
        tags: tags || [],
        max_members: max_members || 50,
        mode: mode || 'default',
        language: language || 'es',
        visibility: visibility || 'public',
        discord_link: discord_link || ''
      });

      // Incrementar groups_created en el perfil del raider
      try {
        await raiderProfileService.incrementStat(user.userId, 'groups_created', 1);
      } catch (err) {
        console.log('Raider profile not found, skipping stats update:', err.message);
      }

      res.json({ success: true, group });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ BÚSQUEDA AVANZADA ============
  router.get('/search', async (req, res) => {
    try {
      const { search, type, mode, language, level_required, status, visibility, tags, min_reputation, sort_by, page = 1, limit = 20 } = req.query;
      
      const filters = {
        search,
        type,
        mode,
        language,
        level_required,
        status,
        visibility,
        tags: tags ? tags.split(',') : [],
        min_reputation: min_reputation ? parseInt(min_reputation) : undefined,
        sort_by
      };

      const groups = await groupsService.searchGroups(filters, parseInt(page), parseInt(limit));
      const total = await db.collection('groups').countDocuments(
        filters.search ? { $text: { $search: filters.search } } : {}
      );

      res.json({ success: true, groups, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ SOLICITAR UNIRSE ============
  router.post('/:groupId/request-join', authenticateToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      const { message } = req.body;
      
      // Validar que groupId sea un ObjectId válido
      if (!ObjectId.isValid(groupId)) {
        return res.status(400).json({ error: 'ID de grupo inválido' });
      }
      
      await groupsService.requestJoin(groupId, {
        user_id: req.user.userId,
        username: req.user.username,
        avatar: req.user.avatar || '',
        message
      });

      res.json({ success: true, message: 'Solicitud enviada' });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ACEPTAR SOLICITUD ============
  router.post('/:groupId/accept-request/:userId', authenticateToken, async (req, res) => {
    try {
      const { groupId, userId } = req.params;
      
      if (!validateObjectId(groupId)) {
        return res.status(400).json({ error: 'ID de grupo inválido' });
      }
      
      // Obtener datos del grupo antes de aceptar
      const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) });
      if (!group) {
        return res.status(404).json({ error: 'Grupo no encontrado' });
      }
      
      await groupsService.acceptJoinRequest(groupId, userId, req.user.userId);
      
      // Enviar notificación al usuario que se unió
      if (notificationService) {
        try {
          await notificationService.notifyGroupJoined(
            userId,
            groupId,
            group.title,
            req.user.userId
          );
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      }
      
      res.json({ success: true, message: 'Solicitud aceptada' });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  });

  // ============ RECHAZAR SOLICITUD ============
  router.post('/:groupId/reject-request/:userId', authenticateToken, async (req, res) => {
    try {
      const { groupId, userId } = req.params;
      const { reason } = req.body;
      
      if (!validateObjectId(groupId)) {
        return res.status(400).json({ error: 'ID de grupo inválido' });
      }
      
      // Obtener datos del grupo antes de rechazar
      const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) });
      if (!group) {
        return res.status(404).json({ error: 'Grupo no encontrado' });
      }
      
      await groupsService.rejectJoinRequest(groupId, userId, req.user.userId, reason);
      
      // Enviar notificación al usuario rechazado
      if (notificationService) {
        try {
          await notificationService.notifyGroupRejected(
            userId,
            groupId,
            group.title,
            req.user.userId,
            reason
          );
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      }
      
      res.json({ success: true, message: 'Solicitud rechazada' });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  });

  // ============ REMOVER MIEMBRO ============
  router.post('/:groupId/remove-member/:userId', authenticateToken, async (req, res) => {
    try {
      const { groupId, userId } = req.params;
      const { reason } = req.body;
      
      if (!validateObjectId(groupId)) {
        return res.status(400).json({ error: 'ID de grupo inválido' });
      }
      
      await groupsService.removeMember(groupId, userId, req.user.userId, reason);
      res.json({ success: true, message: 'Miembro removido' });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  });

  // ============ BANEAR MIEMBRO ============
  router.post('/:groupId/ban-member/:userId', authenticateToken, async (req, res) => {
    try {
      const { groupId, userId } = req.params;
      const { reason } = req.body;
      
      if (!validateObjectId(groupId)) {
        return res.status(400).json({ error: 'ID de grupo inválido' });
      }
      
      await groupsService.banMember(groupId, userId, req.user.userId, reason);
      res.json({ success: true, message: 'Miembro baneado' });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  });

  // ============ PROMOVER A MODERADOR ============
  router.post('/:groupId/promote/:userId', authenticateToken, async (req, res) => {
    try {
      const { groupId, userId } = req.params;
      
      if (!validateObjectId(groupId)) {
        return res.status(400).json({ error: 'ID de grupo inválido' });
      }
      
      await groupsService.promoteToModerator(groupId, userId, req.user.userId);
      res.json({ success: true, message: 'Miembro promovido' });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  });

  // ============ SALIR DEL GRUPO ============
  router.post('/:groupId/leave', authenticateToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      
      if (!validateObjectId(groupId)) {
        return res.status(400).json({ error: 'ID de grupo inválido' });
      }
      
      await groupsService.leaveClan(groupId, req.user.userId);
      res.json({ success: true, message: 'Has dejado el grupo' });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ENVIAR MENSAJE ============
  router.post('/:groupId/messages', authenticateToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      const { content, attachments, channelId = 'general' } = req.body;
      
      console.log(`📨 Enviando mensaje a grupo ${groupId}, canal ${channelId}`);
      console.log(`   Usuario: ${req.user.userId}, Contenido: "${content}"`);
      
      // Validar que groupId sea un ObjectId válido
      if (!validateObjectId(groupId)) {
        console.log(`❌ ID de grupo inválido: ${groupId}`);
        return res.status(400).json({ error: 'ID de grupo inválido' });
      }
      
      if (!content && (!attachments || attachments.length === 0)) {
        console.log(`❌ Mensaje vacío`);
        return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
      }

      const message = await groupsService.sendMessage(groupId, {
        user_id: req.user.userId,
        username: req.user.username,
        avatar: req.user.avatar || ''
      }, content, channelId, attachments || []);

      console.log(`✅ Mensaje enviado exitosamente: ${message._id}`);
      res.json({ success: true, message });
    } catch (error) {
      console.error(`❌ Error al enviar mensaje:`, error);
      res.status(400).json({ error: error.message });
    }
  });

  // ============ EDITAR MENSAJE ============
  router.put('/messages/:messageId', authenticateToken, async (req, res) => {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'El contenido es requerido' });
      }

      await groupsService.editMessage(messageId, content, req.user.userId);
      res.json({ success: true, message: 'Mensaje actualizado' });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ELIMINAR MENSAJE ============
  router.delete('/messages/:messageId', authenticateToken, async (req, res) => {
    try {
      const { messageId } = req.params;
      
      await groupsService.deleteMessage(messageId, req.user.userId);
      res.json({ success: true, message: 'Mensaje eliminado' });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  });

  // ============ OBTENER MENSAJES ============
  router.get('/:groupId/messages', async (req, res) => {
    try {
      const { groupId } = req.params;
      const { limit = 50, page = 1, channelId = 'general' } = req.query;
      
      // Validar que groupId sea un ObjectId válido
      if (!ObjectId.isValid(groupId)) {
        return res.status(400).json({ error: 'ID de grupo inválido' });
      }
      
      const messages = await groupsService.getMessages(groupId, parseInt(limit), parseInt(page), channelId);
      res.json({ success: true, messages });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ AGREGAR REACCIÓN ============
  router.post('/messages/:messageId/reaction', authenticateToken, async (req, res) => {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      
      if (!emoji) {
        return res.status(400).json({ error: 'Emoji requerido' });
      }

      await groupsService.addReaction(messageId, req.user.userId, emoji);
      res.json({ success: true, message: 'Reacción agregada' });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ACTUALIZAR CONFIGURACIÓN ============
  router.put('/:groupId/settings', authenticateToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      const settings = req.body;
      
      if (!validateObjectId(groupId)) {
        return res.status(400).json({ error: 'ID de grupo inválido' });
      }
      
      await groupsService.updateGroupSettings(groupId, settings, req.user.userId);
      res.json({ success: true, message: 'Configuración actualizada' });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ACTUALIZAR INFORMACIÓN ============
  router.put('/:groupId/info', authenticateToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      const info = req.body;
      
      if (!validateObjectId(groupId)) {
        return res.status(400).json({ error: 'ID de grupo inválido' });
      }
      
      await groupsService.updateGroupInfo(groupId, info, req.user.userId);
      res.json({ success: true, message: 'Información actualizada' });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  });

  // ============ OBTENER LOGS (SOLO LÍDER) ============
  router.get('/:groupId/logs', authenticateToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      const group = await groupsService.getGroupById(groupId);
      
      if (!group) {
        return res.status(404).json({ error: 'Grupo no encontrado' });
      }

      const member = group.members.find(m => m.user_id === req.user.userId);
      if (!member || member.role !== 'leader') {
        return res.status(403).json({ error: 'No tienes permisos' });
      }

      const logs = await groupsService.getGroupLogs(groupId);
      res.json({ success: true, logs });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ OBTENER ESTADÍSTICAS ============
  router.get('/:groupId/stats', async (req, res) => {
    try {
      const { groupId } = req.params;
      const stats = await groupsService.getGroupStats(groupId);
      
      res.json({ success: true, stats });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ MIS GRUPOS ============
  router.get('/user/my-groups', authenticateToken, async (req, res) => {
    try {
      const groups = await groupsService.getGroupsByUser(req.user.userId);
      res.json({ success: true, groups });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ SISTEMA DE TIERS ============
  router.get('/:groupId/tier', async (req, res) => {
    try {
      const { groupId } = req.params;
      const tier = await groupsService.calculateGroupTier(groupId);
      res.json({ success: true, tier });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ GESTIÓN DE CANALES ============
  router.get('/:groupId/channels', async (req, res) => {
    try {
      const { groupId } = req.params;
      const channels = await groupsService.getGroupChannels(groupId);
      res.json({ success: true, channels });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:groupId/channels', authenticateToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'El nombre del canal es requerido' });
      }

      const channel = await groupsService.createChannel(groupId, req.user.userId, { name, description });
      res.json({ success: true, channel });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/:groupId/channels/:channelId', authenticateToken, async (req, res) => {
    try {
      const { groupId, channelId } = req.params;
      await groupsService.deleteChannel(groupId, channelId, req.user.userId);
      res.json({ success: true, message: 'Canal eliminado' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ OBTENER DETALLES DEL GRUPO (al final para no capturar otras rutas) ============
  router.get('/:groupId', async (req, res) => {
    try {
      const { groupId } = req.params;
      const group = await groupsService.getGroupById(groupId);
      
      if (!group) {
        return res.status(404).json({ error: 'Grupo no encontrado' });
      }

      // No mostrar banned users a menos que sea líder
      if (req.user && group.owner_id !== req.user.userId) {
        group.bannedUsers = [];
      }

      res.json({ success: true, group });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
