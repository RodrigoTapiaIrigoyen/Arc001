import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import FriendsService from '../services/friendsService.js';

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
  console.log('✅ FriendsService inicializado para el router');

  // RUTAS MÁS ESPECÍFICAS PRIMERO

  // GET /api/friends/requests/pending - Obtener solicitudes pendientes
  router.get('/requests/pending', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
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
      const userId = req.user.userId;
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
      const userId = req.user.userId;
      
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
      const senderId = req.user.userId;
      const { userId } = req.params;

      // Validar que no sea la misma persona
      if (senderId === userId) {
        return res.status(400).json({ error: 'No puedes enviar solicitud a ti mismo' });
      }

      const result = await friendsService.sendFriendRequest(senderId, userId);
      res.status(201).json({ friendshipId: result });
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/friends/request/:friendshipId - Cancelar solicitud enviada
  router.delete('/request/:friendshipId', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
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
      const userId = req.user.userId;
      const { friendshipId } = req.params;
      const { accept } = req.body;

      if (typeof accept !== 'boolean') {
        return res.status(400).json({ error: 'El parámetro accept debe ser boolean' });
      }

      const result = await friendsService.respondToFriendRequest(friendshipId, userId, accept);
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
      const userId = req.user.userId;
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
      const userId = req.user.userId;
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
