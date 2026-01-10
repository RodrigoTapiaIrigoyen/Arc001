import express from 'express';
import { ObjectId } from 'mongodb';
import { authenticateToken } from '../middleware/auth.js';
import ClansService from '../services/clans.js';

export default function createClansRouter(db, notificationService) {
  const router = express.Router();

  if (!db) {
    console.error('❌ createClansRouter: db is undefined');
    router.use((req, res) => {
      res.status(503).json({ error: 'Servicio de clanes no disponible' });
    });
    return router;
  }

  const clansService = new ClansService(db);
  console.log('✅ ClansService inicializado');

  const validateObjectId = (id) => ObjectId.isValid(id);

  // ============ CREAR CLAN ============
  router.post('/create', authenticateToken, async (req, res) => {
    try {
      const { name, description, tag, type, visibility, max_members, logo } = req.body;

      if (!name || !tag) {
        return res.status(400).json({ error: 'Nombre y etiqueta requeridos' });
      }

      const clan = await clansService.createClan({
        leader_id: req.user.userId,
        leader_name: req.user.username,
        leader_avatar: req.user.avatar || '',
        name,
        description,
        tag: tag.toUpperCase().slice(0, 6),
        type: type || 'Casual',
        visibility: visibility || 'public',
        max_members: max_members || 50,
        logo: logo || ''
      });

      res.json({ success: true, clan });
    } catch (error) {
      console.error('Error creating clan:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ OBTENER CLAN POR ID ============
  router.get('/:clanId', async (req, res) => {
    try {
      const { clanId } = req.params;

      if (!validateObjectId(clanId)) {
        return res.status(400).json({ error: 'ID de clan inválido' });
      }

      const clan = await clansService.getClanById(clanId);

      if (!clan) {
        return res.status(404).json({ error: 'Clan no encontrado' });
      }

      res.json({ success: true, clan });
    } catch (error) {
      console.error('Error getting clan:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ OBTENER CLANES DEL USUARIO ============
  router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
      const { userId } = req.params;

      if (!validateObjectId(userId)) {
        return res.status(400).json({ error: 'ID de usuario inválido' });
      }

      const clans = await clansService.getClansByUser(userId);
      res.json({ success: true, clans });
    } catch (error) {
      console.error('Error getting user clans:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ OBTENER MEJORES CLANES ============
  router.get('/leaderboard/top', async (req, res) => {
    try {
      const { limit = 50, sortBy = 'level' } = req.query;
      const clans = await clansService.getTopClans(parseInt(limit), sortBy);

      res.json({ success: true, clans });
    } catch (error) {
      console.error('Error getting top clans:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ OBTENER CLANES POR TIPO ============
  router.get('/type/:clanType', async (req, res) => {
    try {
      const { clanType } = req.params;
      const clans = await clansService.getClansByType(clanType);

      res.json({ success: true, clans });
    } catch (error) {
      console.error('Error getting clans by type:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ BUSCAR CLANES ============
  router.get('/search/:query', async (req, res) => {
    try {
      const { query } = req.params;
      const clans = await clansService.searchClans(query);

      res.json({ success: true, clans });
    } catch (error) {
      console.error('Error searching clans:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ SOLICITAR INGRESO A CLAN ============
  router.post('/:clanId/request', authenticateToken, async (req, res) => {
    try {
      const { clanId } = req.params;

      if (!validateObjectId(clanId)) {
        return res.status(400).json({ error: 'ID de clan inválido' });
      }

      const request = await clansService.requestToJoinClan(
        clanId,
        req.user.userId,
        req.user.username,
        req.user.avatar
      );

      res.json({ success: true, request });
    } catch (error) {
      console.error('Error requesting to join clan:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // ============ RESPONDER SOLICITUD DE INGRESO ============
  router.post('/:clanId/respond/:requestId', authenticateToken, async (req, res) => {
    try {
      const { clanId, requestId } = req.params;
      const { approve } = req.body;

      if (!validateObjectId(clanId) || !validateObjectId(requestId)) {
        return res.status(400).json({ error: 'IDs inválidos' });
      }

      // Verificar que el usuario sea líder del clan
      const clan = await clansService.getClanById(clanId);
      if (!clan || clan.leader_id.toString() !== req.user.userId) {
        return res.status(403).json({ error: 'No tienes permiso para responder solicitudes' });
      }

      const result = await clansService.respondToJoinRequest(requestId, approve, clanId, req.user.userId);

      // Enviar notificación
      if (notificationService && result.request) {
        try {
          if (approve) {
            await notificationService.notifyClanJoined(
              result.request.user_id,
              clanId,
              result.clan.name,
              req.user.userId
            );
          } else {
            await notificationService.notifyClanRejected(
              result.request.user_id,
              clanId,
              result.clan.name,
              req.user.userId
            );
          }
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      }

      res.json({ success: true, result });
    } catch (error) {
      console.error('Error responding to join request:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // ============ OBTENER SOLICITUDES PENDIENTES ============
  router.get('/:clanId/requests', authenticateToken, async (req, res) => {
    try {
      const { clanId } = req.params;

      if (!validateObjectId(clanId)) {
        return res.status(400).json({ error: 'ID de clan inválido' });
      }

      // Verificar que el usuario sea líder
      const clan = await clansService.getClanById(clanId);
      if (!clan || clan.leader_id.toString() !== req.user.userId) {
        return res.status(403).json({ error: 'No tienes permiso' });
      }

      const requests = await clansService.getPendingRequests(clanId);
      res.json({ success: true, requests });
    } catch (error) {
      console.error('Error getting pending requests:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ ELIMINAR MIEMBRO DEL CLAN ============
  router.delete('/:clanId/members/:memberId', authenticateToken, async (req, res) => {
    try {
      const { clanId, memberId } = req.params;

      if (!validateObjectId(clanId) || !validateObjectId(memberId)) {
        return res.status(400).json({ error: 'IDs inválidos' });
      }

      // Verificar que el usuario sea líder
      const clan = await clansService.getClanById(clanId);
      if (!clan || (clan.leader_id.toString() !== req.user.userId && req.user.role !== 'admin')) {
        return res.status(403).json({ error: 'No tienes permiso' });
      }

      await clansService.removeMemberFromClan(clanId, memberId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing member:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ ABANDONAR CLAN ============
  router.post('/:clanId/leave', authenticateToken, async (req, res) => {
    try {
      const { clanId } = req.params;

      if (!validateObjectId(clanId)) {
        return res.status(400).json({ error: 'ID de clan inválido' });
      }

      const clan = await clansService.getClanById(clanId);
      if (!clan) {
        return res.status(404).json({ error: 'Clan no encontrado' });
      }

      // No permitir que el líder abandone (debe disolver el clan)
      if (clan.leader_id.toString() === req.user.userId) {
        return res.status(400).json({ error: 'El líder no puede abandonar. Disuelve el clan primero.' });
      }

      await clansService.removeMemberFromClan(clanId, req.user.userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error leaving clan:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ ACTUALIZAR CLAN ============
  router.put('/:clanId', authenticateToken, async (req, res) => {
    try {
      const { clanId } = req.params;

      if (!validateObjectId(clanId)) {
        return res.status(400).json({ error: 'ID de clan inválido' });
      }

      const clan = await clansService.getClanById(clanId);
      if (!clan || clan.leader_id.toString() !== req.user.userId) {
        return res.status(403).json({ error: 'No tienes permiso' });
      }

      const updatableFields = ['description', 'discord_link', 'website', 'banner'];
      const updateData = {};

      updatableFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      await clansService.updateClan(clanId, updateData);
      const updated = await clansService.getClanById(clanId);

      res.json({ success: true, clan: updated });
    } catch (error) {
      console.error('Error updating clan:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ DISOLVER CLAN ============
  router.delete('/:clanId', authenticateToken, async (req, res) => {
    try {
      const { clanId } = req.params;

      if (!validateObjectId(clanId)) {
        return res.status(400).json({ error: 'ID de clan inválido' });
      }

      const clan = await clansService.getClanById(clanId);
      if (!clan || clan.leader_id.toString() !== req.user.userId) {
        return res.status(403).json({ error: 'No tienes permiso' });
      }

      await clansService.disbandClan(clanId);
      res.json({ success: true, message: 'Clan disuelto' });
    } catch (error) {
      console.error('Error disbanding clan:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
