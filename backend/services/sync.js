import metaforge from './metaforge.js';
import arcforge from './arcforge.js';

// Sync Service - Maneja la sincronización con APIs externas
class SyncService {
  constructor(db) {
    this.db = db;
  }

  // Sincronizar Items/Weapons desde ARDB
  async syncItems() {
    console.log('🔄 Iniciando sincronización de items desde ARDB...');
    
    try {
      // Obtener todos los items de ARDB
      const allItems = await metaforge.getItems('en');
      console.log(`📦 Obtenidos ${allItems.length} items de ARDB`);

      // Filtrar solo armas
      const weaponItems = metaforge.filterWeapons(allItems);
      console.log(`🔫 Filtradas ${weaponItems.length} armas`);

      // Transformar a formato local
      const weapons = weaponItems.map(item => metaforge.transformItemToWeapon(item));

      if (weapons.length === 0) {
        console.log('⚠️ No se encontraron armas');
        return { success: true, inserted: 0, updated: 0 };
      }

      // Upsert en MongoDB (insertar o actualizar)
      let inserted = 0;
      let updated = 0;

      for (const weapon of weapons) {
        const result = await this.db.collection('weapons').updateOne(
          { ardb_id: weapon.ardb_id },
          { $set: weapon },
          { upsert: true }
        );

        if (result.upsertedCount > 0) inserted++;
        if (result.modifiedCount > 0) updated++;
      }

      console.log(`✅ Sincronización completada: ${inserted} insertadas, ${updated} actualizadas`);
      
      return {
        success: true,
        inserted,
        updated,
        total: weapons.length
      };
    } catch (error) {
      console.error('❌ Error sincronizando items:', error);
      throw error;
    }
  }

  // Sincronizar todos los items por categoría desde ARDB
  async syncAllItems() {
    console.log('🔄 Iniciando sincronización completa desde ARDB...');
    
    try {
      // Obtener todos los items
      const allItems = await metaforge.getItems('en');
      console.log(`📦 Obtenidos ${allItems.length} items totales de ARDB`);

      // Separar por categorías
      const categorized = {
        weapons: metaforge.filterByCategory(allItems, 'weapons'),
        medical: metaforge.filterByCategory(allItems, 'medical'),
        materials: metaforge.filterByCategory(allItems, 'materials'),
        equipment: metaforge.filterByCategory(allItems, 'equipment'),
        ammunition: metaforge.filterByCategory(allItems, 'ammunition'),
      };

      console.log('📊 Items por categoría:');
      Object.entries(categorized).forEach(([cat, items]) => {
        console.log(`  ${cat}: ${items.length} items`);
      });

      // Sincronizar cada categoría
      const results = {};
      
      for (const [category, items] of Object.entries(categorized)) {
        let inserted = 0;
        let updated = 0;
        
        for (const item of items) {
          const result = await this.db.collection(category).updateOne(
            { ardb_id: item.id },
            { $set: { ...item, source: 'ardb', synced_at: new Date() } },
            { upsert: true }
          );
          
          if (result.upsertedCount > 0) inserted++;
          if (result.modifiedCount > 0) updated++;
        }
        
        results[category] = { inserted, updated, total: items.length };
        console.log(`✅ ${category}: ${inserted} insertadas, ${updated} actualizadas`);
      }

      return { success: true, results };
    } catch (error) {
      console.error('❌ Error sincronizando items:', error);
      throw error;
    }
  }

  // Legacy: mantener compatibilidad con syncQuests
  async syncQuests() {
    console.log('ℹ️ ARDB no tiene quests separadas, sincronizando todos los items...');
    return this.syncAllItems();
  }

  // Sincronizar items completos desde ArcForge (485+ items)
  async syncArcForgeItems() {
    console.log('🔄 Iniciando sincronización de items desde ArcForge...');
    
    try {
      const items = await arcforge.getItemsDatabase();
      console.log(`📦 Obtenidos ${items.length} items de ArcForge`);

      if (items.length === 0) {
        return { success: true, inserted: 0, updated: 0 };
      }

      let inserted = 0;
      let updated = 0;

      for (const item of items) {
        const transformed = arcforge.transformItem(item);
        const result = await this.db.collection('items').updateOne(
          { arcforge_name: transformed.arcforge_name },
          { $set: transformed },
          { upsert: true }
        );

        if (result.upsertedCount > 0) inserted++;
        if (result.modifiedCount > 0) updated++;
      }

      console.log(`✅ Items sincronizados: ${inserted} insertados, ${updated} actualizados`);
      
      return {
        success: true,
        inserted,
        updated,
        total: items.length
      };
    } catch (error) {
      console.error('❌ Error sincronizando items:', error);
      throw error;
    }
  }

  // Projects ahora vienen incluidos en items de ArcForge
  async syncProjects() {
    console.log('ℹ️ Projects están incluidos en items de ArcForge');
    return { success: true, message: 'Projects included in ArcForge items' };
  }

  // Sincronizar traders desde ArcForge (5 traders completos)
  async syncTraders() {
    console.log('🔄 Iniciando sincronización de traders desde ArcForge...');
    
    try {
      const traders = await arcforge.getTradersDatabase();
      console.log(`📦 Obtenidos ${traders.length} traders de ArcForge`);

      if (traders.length === 0) {
        return { success: true, inserted: 0, updated: 0 };
      }

      let inserted = 0;
      let updated = 0;

      for (const trader of traders) {
        const transformed = arcforge.transformTrader(trader);
        const result = await this.db.collection('traders').updateOne(
          { arcforge_name: transformed.arcforge_name },
          { $set: transformed },
          { upsert: true }
        );

        if (result.upsertedCount > 0) inserted++;
        if (result.modifiedCount > 0) updated++;
      }

      console.log(`✅ Traders sincronizados: ${inserted} insertados, ${updated} actualizados`);
      
      return {
        success: true,
        inserted,
        updated,
        total: traders.length
      };
    } catch (error) {
      console.error('❌ Error sincronizando traders:', error);
      throw error;
    }
  }

  // Sincronizar todo desde ArcForge + ARDB
  async syncAll() {
    console.log('🚀 Sincronización completa iniciada...');
    
    const results = {
      weapons: null,
      arcforge_items: null,
      traders: null,
      errors: []
    };

    // Mantener weapons de ARDB (70 armas)
    try {
      results.weapons = await this.syncItems();
    } catch (error) {
      results.errors.push({ type: 'weapons', error: error.message });
    }

    // Agregar items completos de ArcForge (485+)
    try {
      results.arcforge_items = await this.syncArcForgeItems();
    } catch (error) {
      results.errors.push({ type: 'arcforge_items', error: error.message });
    }

    // Traders de ArcForge (5 traders)
    try {
      results.traders = await this.syncTraders();
    } catch (error) {
      results.errors.push({ type: 'traders', error: error.message });
    }

    console.log('✅ Sincronización completa finalizada');
    return results;
  }

  // Obtener estadísticas de sincronización
  async getSyncStats() {
    const stats = {
      weapons: await this.db.collection('weapons').countDocuments(),
      items: await this.db.collection('items').countDocuments(),
      traders: await this.db.collection('traders').countDocuments(),
      last_sync: await this.getLastSyncTime()
    };

    return stats;
  }

  async getLastSyncTime() {
    const lastWeapon = await this.db.collection('weapons')
      .findOne({}, { sort: { synced_at: -1 } });
    
    return lastWeapon?.synced_at || null;
  }
}

export default SyncService;
