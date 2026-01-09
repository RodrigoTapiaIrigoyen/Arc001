import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import FriendsService from '../services/friendsService.js';
import RaiderProfileService from '../services/raiderProfile.js';

export default function createFriendsRouter(db) {
  const router = express.Router();
  
  if (!db) {
    console.error('❌ createFriendsRouter: db is undefined');
    // Devolver un router con endpoints que retornan error
    router.use((req, res) => {
      res.status(503).json({ error: 'Servicio de amigos no disponible (sin conexión a DB)' });
    });
    return router;
  }
  
  const friendsService = new FriendsService(db);
  const raiderProfileService = new RaiderProfileService(db);
  console.log('✅ FriendsService inicializado para el router');
  console.log('✅ RaiderProfileService inicializado para el router');

  // Helper para convertir userId a string
  const getUserIdString = (userId) => {
    return userId.toString ? userId.toString() : userId;
  };

  // RUTAS MÁS ESPECÍFICAS PRIMERO

  // GET /api/friends/requests/pending - Obtener solicitudes pendientes
  router.get('/requests/pending', authenticateToken, async (req, res) => {
    try {
      const userId = getUserIdString(req.user.userId);
      const requests = await friendsService.getPendingRequests(userId);
      res.json(requests || []);
    } catch (error) {
      console.error('Error al obtener solicitudes pendientes:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/friends/requests/sent - Obtener solicitudes enviadas
  router.get('/requests/sent', authenticateToken, async (req, res) => {
    try {
      const userId = getUserIdString(req.user.userId);
      const requests = await friendsService.getSentRequests(userId);
      res.json(requests || []);
    } catch (error) {
      console.error('Error al obtener solicitudes enviadas:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/friends/search - Buscar usuarios
  router.get('/search', authenticateToken, async (req, res) => {
    try {
      const { q } = req.query;
      const userId = getUserIdString(req.user.userId);
      
      if (!q || q.length < 2) {
        return res.status(400).json({ error: 'Mínimo 2 caracteres para buscar' });
      }

      const results = await friendsService.searchUsers(userId, q);
      res.json(results || []);
    } catch (error) {
      console.error('Error al buscar usuarios:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/friends/request/:userId - Enviar solicitud de amistad
  router.post('/request/:userId', authenticateToken, async (req, res) => {
    try {
      const senderId = getUserIdString(req.user.userId);
      const { userId } = req.params;

      console.log('👥 POST /api/friends/request/:userId - senderId:', senderId, 'targetUserId:', userId);

      // Validar que no sea la misma persona
      if (senderId === userId) {
        console.error('❌ Intentando enviar solicitud a sí mismo');
        return res.status(400).json({ error: 'No puedes enviar solicitud a ti mismo' });
      }

      console.log('📤 Enviando solicitud de amistad de', senderId, 'a', userId);
      const result = await friendsService.sendFriendRequest(senderId, userId);
      console.log('✅ Solicitud enviada:', result);
      res.status(201).json({ friendshipId: result });
    } catch (error) {
      console.error('❌ Error al enviar solicitud:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/friends/request/:friendshipId - Cancelar solicitud enviada
  router.delete('/request/:friendshipId', authenticateToken, async (req, res) => {
    try {
      const userId = getUserIdString(req.user.userId);
      const { friendshipId } = req.params;

      const result = await friendsService.cancelFriendRequest(friendshipId, userId);
      res.json(result);
    } catch (error) {
      console.error('Error al cancelar solicitud:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/friends/respond/:friendshipId - Responder a solicitud
  router.post('/respond/:friendshipId', authenticateToken, async (req, res) => {
    try {
      const userId = getUserIdString(req.user.userId);
      const { friendshipId } = req.params;
      const { accept } = req.body;

      if (typeof accept !== 'boolean') {
        return res.status(400).json({ error: 'El parámetro accept debe ser boolean' });
      }

      const result = await friendsService.respondToFriendRequest(friendshipId, userId, accept);
      
      // Si se aceptó la solicitud, incrementar friends_count para ambos usuarios
      if (accept && result) {
        try {
          // result debería contener requester_id y receiver_id
          const requesterUserId = result.requester_id;
          const receiverUserId = result.receiver_id;
          
          // Incrementar friends_count para ambos usuarios
          if (raiderProfileService && requesterUserId) {
            await raiderProfileService.incrementStat(requesterUserId, 'friends_count', 1);
          }
          if (raiderProfileService && receiverUserId) {
            await raiderProfileService.incrementStat(receiverUserId, 'friends_count', 1);
          }
        } catch (err) {
          console.log('Raider profile not found, skipping stats update:', err.message);
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error al responder solicitud:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // RUTAS GENÉRICAS AL FINAL

  // GET /api/friends - Obtener lista de amigos del usuario
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const userId = getUserIdString(req.user.userId);
      const friends = await friendsService.getFriends(userId);
      res.json(friends || []);
    } catch (error) {
      console.error('Error al obtener amigos:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/friends/:friendshipId - Eliminar amigo
  router.delete('/:friendshipId', authenticateToken, async (req, res) => {
    try {
      const userId = getUserIdString(req.user.userId);
      const { friendshipId } = req.params;

      const result = await friendsService.removeFriend(friendshipId, userId);
      res.json(result);
    } catch (error) {
      console.error('Error al eliminar amigo:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
