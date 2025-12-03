import { ObjectId } from 'mongodb';

export default class MarkerService {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('map_markers');
  }

  // Obtener todos los marcadores de un usuario en un mapa específico
  async getUserMarkersForMap(userId, mapName) {
    try {
      const markers = await this.collection
        .find({ user_id: userId, map_name: mapName })
        .sort({ created_at: -1 })
        .toArray();
      
      return markers;
    } catch (error) {
      console.error('Error fetching user markers:', error);
      throw error;
    }
  }

  // Obtener todos los marcadores de un usuario (todos los mapas)
  async getAllUserMarkers(userId) {
    try {
      const markers = await this.collection
        .find({ user_id: userId })
        .sort({ map_name: 1, created_at: -1 })
        .toArray();
      
      // Agrupar por mapa
      const markersByMap = {};
      markers.forEach(marker => {
        if (!markersByMap[marker.map_name]) {
          markersByMap[marker.map_name] = [];
        }
        markersByMap[marker.map_name].push(marker);
      });
      
      return markersByMap;
    } catch (error) {
      console.error('Error fetching all user markers:', error);
      throw error;
    }
  }

  // Crear un nuevo marcador
  async createMarker(markerData) {
    try {
      const marker = {
        user_id: markerData.user_id,
        map_name: markerData.map_name,
        position: {
          lat: markerData.position.lat,
          lng: markerData.position.lng
        },
        title: markerData.title || 'Sin título',
        description: markerData.description || '',
        type: markerData.type || 'poi', // poi, loot, enemy, boss, extraction, other
        image: markerData.image || null, // base64 o URL
        is_public: markerData.is_public || false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = await this.collection.insertOne(marker);
      return {
        ...marker,
        _id: result.insertedId
      };
    } catch (error) {
      console.error('Error creating marker:', error);
      throw error;
    }
  }

  // Actualizar un marcador
  async updateMarker(markerId, userId, updateData) {
    try {
      const update = {
        $set: {
          ...updateData,
          updated_at: new Date()
        }
      };

      // Solo permitir actualizar si es el dueño
      const result = await this.collection.updateOne(
        { _id: new ObjectId(markerId), user_id: userId },
        update
      );

      if (result.matchedCount === 0) {
        throw new Error('Marcador no encontrado o no tienes permisos para editarlo');
      }

      return result;
    } catch (error) {
      console.error('Error updating marker:', error);
      throw error;
    }
  }

  // Eliminar un marcador
  async deleteMarker(markerId, userId) {
    try {
      const result = await this.collection.deleteOne({
        _id: new ObjectId(markerId),
        user_id: userId
      });

      if (result.deletedCount === 0) {
        throw new Error('Marcador no encontrado o no tienes permisos para eliminarlo');
      }

      return { success: true, deleted: result.deletedCount };
    } catch (error) {
      console.error('Error deleting marker:', error);
      throw error;
    }
  }

  // Eliminar todos los marcadores de un usuario en un mapa
  async deleteAllUserMarkersForMap(userId, mapName) {
    try {
      const result = await this.collection.deleteMany({
        user_id: userId,
        map_name: mapName
      });

      return { success: true, deleted: result.deletedCount };
    } catch (error) {
      console.error('Error deleting markers:', error);
      throw error;
    }
  }

  // Obtener marcadores públicos de un mapa (para compartir con la comunidad)
  async getPublicMarkersForMap(mapName, limit = 100) {
    try {
      const markers = await this.collection
        .find({ 
          map_name: mapName, 
          is_public: true 
        })
        .limit(limit)
        .sort({ created_at: -1 })
        .toArray();
      
      return markers;
    } catch (error) {
      console.error('Error fetching public markers:', error);
      throw error;
    }
  }

  // Migrar marcadores desde localStorage (útil para migración inicial)
  async migrateFromLocalStorage(userId, localStorageMarkers) {
    try {
      const markersToInsert = [];
      
      // localStorageMarkers es un objeto: { mapName: [markers] }
      for (const [mapName, markers] of Object.entries(localStorageMarkers)) {
        markers.forEach(marker => {
          markersToInsert.push({
            user_id: userId,
            map_name: mapName,
            position: marker.position,
            title: marker.title || 'Sin título',
            description: marker.description || '',
            type: marker.type || 'poi',
            image: marker.image || null,
            is_public: false,
            created_at: marker.created_at ? new Date(marker.created_at) : new Date(),
            updated_at: new Date(),
          });
        });
      }

      if (markersToInsert.length > 0) {
        const result = await this.collection.insertMany(markersToInsert);
        return {
          success: true,
          migrated: result.insertedCount,
          markers: markersToInsert
        };
      }

      return { success: true, migrated: 0 };
    } catch (error) {
      console.error('Error migrating markers:', error);
      throw error;
    }
  }

  // Obtener estadísticas de marcadores de un usuario
  async getUserMarkerStats(userId) {
    try {
      const stats = await this.collection.aggregate([
        { $match: { user_id: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byMap: {
              $push: {
                map: '$map_name',
                type: '$type'
              }
            }
          }
        }
      ]).toArray();

      if (stats.length === 0) {
        return {
          total: 0,
          byMap: {},
          byType: {}
        };
      }

      // Contar por mapa
      const byMap = {};
      const byType = {};
      
      stats[0].byMap.forEach(item => {
        byMap[item.map] = (byMap[item.map] || 0) + 1;
        byType[item.type] = (byType[item.type] || 0) + 1;
      });

      return {
        total: stats[0].total,
        byMap,
        byType
      };
    } catch (error) {
      console.error('Error fetching marker stats:', error);
      throw error;
    }
  }

  // Exportar marcadores de un usuario (para backup)
  async exportUserMarkers(userId) {
    try {
      const markers = await this.collection
        .find({ user_id: userId })
        .toArray();
      
      return {
        export_date: new Date(),
        user_id: userId,
        total_markers: markers.length,
        markers: markers
      };
    } catch (error) {
      console.error('Error exporting markers:', error);
      throw error;
    }
  }

  // Importar marcadores (desde backup)
  async importUserMarkers(userId, markersData) {
    try {
      const markersToInsert = markersData.markers.map(marker => ({
        ...marker,
        _id: undefined, // Crear nuevos IDs
        user_id: userId, // Asegurar que pertenezcan al usuario actual
        created_at: marker.created_at ? new Date(marker.created_at) : new Date(),
        updated_at: new Date()
      }));

      const result = await this.collection.insertMany(markersToInsert);
      return {
        success: true,
        imported: result.insertedCount
      };
    } catch (error) {
      console.error('Error importing markers:', error);
      throw error;
    }
  }
}
