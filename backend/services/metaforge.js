// ARDB API Service  
// Documentación: https://github.com/Teyk0o/ARDB
// API pública: https://ardb.app/api/items

const ARDB_BASE_URL = 'https://ardb.app/api';

class ARDBService {
  constructor() {
    this.baseURL = ARDB_BASE_URL;
  }

  // Helper para hacer requests
  async fetch(endpoint) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`📡 Fetching: ${url}`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ Error fetching ${endpoint}:`, error.message);
      throw error;
    }
  }

  // Get all items (485+ items with full data)
  async getItems(language = 'en') {
    return this.fetch(`/items?lang=${language}`);
  }

  // Search item by name (exact or fuzzy match)
  async searchItem(query, language = 'en') {
    return this.fetch(`/item/${encodeURIComponent(query)}?lang=${language}`);
  }

  // Transformar datos de ARDB a formato de weapons
  transformItemToWeapon(item) {
    // ARDB tiene una estructura completa con stats, crafting, etc.
    const statBlock = item.stat_block || {};
    
    return {
      name: item.name || item.nameEn || 'Unknown',
      type: item.type || 'Item',
      damage: statBlock.damage || 0,
      dps: this.calculateDPS(statBlock),
      fire_rate: statBlock.firerate || statBlock.fireRate,
      magazine_size: statBlock.magsize || statBlock.magazineSize,
      reload_speed: statBlock.reload_speed || statBlock.reloadSpeed,
      range: statBlock.range,
      accuracy: statBlock.accuracy,
      rarity: item.rarity || 'common',
      description: item.description || '',
      value: item.value || 0,
      weight: item.weight || item.infobox?.weight,
      image_url: item.icon || item.image_urls?.thumb,
      workbench: item.workbench,
      crafting_components: item.components || item.crafting_components,
      ardb_id: item.id,
      source: 'ardb',
      synced_at: new Date()
    };
  }

  calculateDPS(statBlock) {
    if (statBlock.dps) return statBlock.dps;
    if (statBlock.damage && statBlock.firerate) {
      return Math.round(statBlock.damage * statBlock.firerate);
    }
    return 0;
  }

  // Filtrar solo armas del dataset completo
  filterWeapons(items) {
    const weaponTypes = ['hand cannon', 'dmr', 'assault rifle', 'battle rifle', 
                         'lmg', 'pistol', 'smg', 'shotgun', 'sniper rifle'];
    return items.filter(item => {
      const type = (item.type || '').toLowerCase();
      return weaponTypes.some(wType => type.includes(wType));
    });
  }

  // Filtrar items por categoría
  filterByCategory(items, category) {
    const categories = {
      weapons: ['hand cannon', 'dmr', 'assault rifle', 'battle rifle', 'lmg', 'pistol', 'smg', 'shotgun', 'sniper rifle'],
      medical: ['heal', 'medical', 'quick use', 'bandage', 'stim'],
      materials: ['material', 'refined material', 'raw material', 'component'],
      equipment: ['modification', 'shield', 'augment', 'gear'],
      ammunition: ['ammunition', 'ammo', 'magazine'],
    };
    
    const keywords = categories[category] || [];
    return items.filter(item => {
      const type = (item.type || '').toLowerCase();
      return keywords.some(keyword => type.includes(keyword));
    });
  }
}

export default new ARDBService();
