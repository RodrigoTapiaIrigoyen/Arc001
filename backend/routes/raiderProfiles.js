import express from 'express';
import { ObjectId } from 'mongodb';
import { authenticateToken } from '../middleware/auth.js';
import RaiderProfileService from '../services/raiderProfile.js';

export default function createRaiderProfileRouter(db) {
  const router = express.Router();

  if (!db) {
    console.error('❌ createRaiderProfileRouter: db is undefined');
    router.use((req, res) => {
      res.status(503).json({ error: 'Servicio de perfiles indisponible' });
    });
    return router;
  }

  const raiderProfileService = new RaiderProfileService(db);
  console.log('✅ RaiderProfileService inicializado');

  // ============ OBTENER PERFIL DEL USUARIO ============
  router.get('/:userId', authenticateToken, async (req, res) => {
    try {
      const { userId } = req.params;

      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'ID de usuario inválido' });
      }

      const profile = await raiderProfileService.getUserProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ error: 'Perfil no encontrado' });
      }

      res.json({ success: true, profile });
    } catch (error) {
      console.error('Error getting profile:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ CREAR O ACTUALIZAR PERFIL ============
  router.post('/', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const {
        equipment,
        strategy,
        company,
        raider_type,
        raider_emoji,
        raider_description,
        preferred_weapons,
        playstyle_notes
      } = req.body;

      // Validar que los campos requeridos estén presentes
      if (!equipment || !strategy || !company || !raider_type) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      // Verificar si el perfil existe
      const existingProfile = await raiderProfileService.getUserProfile(userId);

      let profile;
      if (existingProfile) {
        // Actualizar
        profile = await raiderProfileService.updateProfile(userId, {
          equipment,
          strategy,
          company,
          raider_type,
          raider_emoji,
          raider_description,
          preferred_weapons,
          playstyle_notes
        });
      } else {
        // Crear nuevo
        profile = await raiderProfileService.createProfile(
          userId,
          req.user.username,
          req.user.avatar,
          {
            equipment,
            strategy,
            company,
            raider_type,
            raider_emoji,
            raider_description,
            preferred_weapons,
            playstyle_notes
          }
        );
      }

      res.json({ success: true, profile });
    } catch (error) {
      console.error('Error creating/updating profile:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ OBTENER MEJORES RAIDERS ============
  router.get('/leaderboard/top', async (req, res) => {
    try {
      const { limit = 50, sortBy = 'community_reputation' } = req.query;
      const raiders = await raiderProfileService.getTopRaiders(
        parseInt(limit),
        sortBy
      );

      res.json({ success: true, raiders });
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ OBTENER RAIDERS POR TIPO ============
  router.get('/type/:raiderType', async (req, res) => {
    try {
      const { raiderType } = req.params;

      const raiders = await raiderProfileService.getRaidersByType(raiderType);

      res.json({ success: true, raiders });
    } catch (error) {
      console.error('Error getting raiders by type:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ BUSCAR RAIDERS ============
  router.get('/search/:query', async (req, res) => {
    try {
      const { query } = req.params;

      const raiders = await raiderProfileService.searchRaiders(query);

      res.json({ success: true, raiders });
    } catch (error) {
      console.error('Error searching raiders:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ ACTUALIZAR ESTADÍSTICAS ============
  router.put('/:userId/stats', authenticateToken, async (req, res) => {
    try {
      const { userId } = req.params;
      const stats = req.body;

      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'ID de usuario inválido' });
      }

      // Solo el propietario o un admin puede actualizar sus estadísticas
      if (userId !== req.user.userId.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No tienes permiso para actualizar estas estadísticas' });
      }

      const profile = await raiderProfileService.updateStats(userId, stats);

      res.json({ success: true, profile });
    } catch (error) {
      console.error('Error updating stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ OBTENER ESTADÍSTICAS ============
  router.get('/:userId/statistics', authenticateToken, async (req, res) => {
    try {
      const { userId } = req.params;

      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'ID de usuario inválido' });
      }

      const stats = await raiderProfileService.getStatistics(userId);

      if (!stats) {
        return res.status(404).json({ error: 'Estadísticas no encontradas' });
      }

      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error getting statistics:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
