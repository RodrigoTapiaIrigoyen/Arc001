import fetch from 'node-fetch';

const ARCFORGE_BASE_URL = 'https://raw.githubusercontent.com/wangyz1999/arcforge/main/data';

/**
 * Servicio para obtener datos de ArcForge GitHub
 * - items_database.json: 485+ items con infobox, crafting, upgrades, repairs, recycling
 * - traders_database.json: 5 traders con inventarios completos
 * - items_relation.json: Grafo de relaciones para crafting trees
 */

/**
 * Obtiene la base de datos completa de items de ArcForge
 * @returns {Promise<Array>} Array de items con toda la información
 */
async function getItemsDatabase() {
  try {
    console.log('📡 Fetching: ' + ARCFORGE_BASE_URL + '/items_database.json');
    const response = await fetch(ARCFORGE_BASE_URL + '/items_database.json');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const items = await response.json();
    console.log(`📦 Obtenidos ${items.length} items de ArcForge`);
    return items;
  } catch (error) {
    console.error(`❌ Error fetching items_database.json: ${error.message}`);
    return [];
  }
}

/**
 * Obtiene la base de datos de traders de ArcForge
 * @returns {Promise<Array>} Array de traders con inventarios
 */
async function getTradersDatabase() {
  try {
    console.log('📡 Fetching: ' + ARCFORGE_BASE_URL + '/traders_database.json');
    const response = await fetch(ARCFORGE_BASE_URL + '/traders_database.json');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const traders = await response.json();
    console.log(`📦 Obtenidos ${traders.length} traders de ArcForge`);
    return traders;
  } catch (error) {
    console.error(`❌ Error fetching traders_database.json: ${error.message}`);
    return [];
  }
}

/**
 * Obtiene el grafo de relaciones de items (crafting trees)
 * @returns {Promise<Array>} Array de items con edges para grafo
 */
async function getItemsRelation() {
  try {
    console.log('📡 Fetching: ' + ARCFORGE_BASE_URL + '/items_relation.json');
    const response = await fetch(ARCFORGE_BASE_URL + '/items_relation.json');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const relations = await response.json();
    console.log(`📦 Obtenidas ${relations.length} relaciones de items de ArcForge`);
    return relations;
  } catch (error) {
    console.error(`❌ Error fetching items_relation.json: ${error.message}`);
    return [];
  }
}

/**
 * Transforma un item de ArcForge al esquema local
 * @param {Object} item - Item de ArcForge
 * @returns {Object} Item en formato local
 */
function transformItem(item) {
  const infobox = item.infobox || {};
  
  return {
    // Identificadores
    arcforge_name: item.name,
    name: item.name,
    
    // URLs
    wiki_url: item.wiki_url || null,
    source_url: item.source_url || null,
    
    // Información básica del infobox
    rarity: infobox.rarity || 'Common',
    type: infobox.type || 'Item',
    special_types: infobox.special_types || [],
    quote: infobox.quote || null,
    
    // Imágenes
    image: infobox.image || null,
    image_urls: item.image_urls || {},
    
    // Estadísticas
    weight: infobox.weight || 0,
    stacksize: infobox.stacksize || 1,
    sellprice: infobox.sellprice || 0,
    
    // Estadísticas de armas (si aplica)
    damage: infobox.damage || null,
    firerate: infobox.firerate || null,
    magsize: infobox.magsize || null,
    range: infobox.range || null,
    stability: infobox.stability || null,
    
    // Crafting y recetas
    crafting: item.crafting || [],
    upgrades: item.upgrades || [],
    repairs: item.repairs || [],
    recycling: item.recycling || {},
    
    // Fuentes y localización
    sources: item.sources || [],
    location: infobox.location || null,
    
    // Infobox completo para referencia
    infobox_full: infobox,
    
    // Metadata
    source: 'arcforge',
    last_updated: new Date()
  };
}

/**
 * Transforma un trader de ArcForge al esquema local
 * @param {Object} trader - Trader de ArcForge
 * @returns {Object} Trader en formato local
 */
function transformTrader(trader) {
  return {
    // Identificadores
    arcforge_name: trader.name,
    name: trader.name,
    
    // URLs
    wiki_url: trader.wiki_url || null,
    source_url: trader.source_url || null,
    
    // Imágenes
    image_filename: trader.image_filename || null,
    image_urls: trader.image_urls || {},
    
    // Inventario (shop)
    shop: (trader.shop || []).map(item => ({
      name: item.name,
      price: item.price || 0,
      currency: item.currency || 'Coins',
      stock: item.stock || null,
      is_limited: item.is_limited || false,
      ammo_count: item.ammo_count || null,
      category_icon: item.category_icon || null,
      rarity: item.rarity || null
    })),
    
    // Metadata
    source: 'arcforge',
    last_updated: new Date()
  };
}

export default {
  getItemsDatabase,
  getTradersDatabase,
  getItemsRelation,
  transformItem,
  transformTrader
};
