// RaidTheory Data Service
// Fuente: https://github.com/RaidTheory/arcraiders-data
// Data completa de misiones, traders, proyectos, hideout modules, skill nodes

const RAIDTHEORY_BASE_URL = 'https://raw.githubusercontent.com/RaidTheory/arcraiders-data/main';

class RaidTheoryService {
  constructor() {
    this.baseURL = RAIDTHEORY_BASE_URL;
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

  // Obtener todas las misiones
  async getMissions() {
    try {
      return await this.fetch('/missions.json');
    } catch (error) {
      console.warn('No se pudieron obtener missions, retornando array vacío');
      return [];
    }
  }

  // Obtener todos los traders/comerciantes
  async getTraders() {
    try {
      return await this.fetch('/traders.json');
    } catch (error) {
      console.warn('No se pudieron obtener traders, retornando array vacío');
      return [];
    }
  }

  // Obtener proyectos del hideout
  async getProjects() {
    try {
      return await this.fetch('/projects.json');
    } catch (error) {
      console.warn('No se pudieron obtener projects, retornando array vacío');
      return [];
    }
  }

  // Obtener módulos del hideout
  async getHideoutModules() {
    try {
      return await this.fetch('/hideout_modules.json');
    } catch (error) {
      console.warn('No se pudieron obtener hideout_modules, retornando array vacío');
      return [];
    }
  }

  // Obtener skill nodes
  async getSkillNodes() {
    try {
      return await this.fetch('/skill_nodes.json');
    } catch (error) {
      console.warn('No se pudieron obtener skill_nodes, retornando array vacío');
      return [];
    }
  }

  // Obtener info de ARC enemies
  async getARCData() {
    try {
      return await this.fetch('/arc.json');
    } catch (error) {
      console.warn('No se pudieron obtener arc data, retornando array vacío');
      return [];
    }
  }

  // Transformar mission a formato local
  transformMission(mission) {
    return {
      id: mission.id,
      name: mission.name?.en || mission.name || 'Unknown Mission',
      description: mission.description?.en || mission.description || '',
      trader: mission.trader || 'Unknown',
      objectives: mission.objectives || [],
      required_items: mission.requiredItemIds || [],
      reward_items: mission.rewardItemIds || [],
      reward_xp: mission.xp || 0,
      reward_coins: mission.coins || 0,
      previous_quests: mission.previousQuestIds || [],
      next_quests: mission.nextQuestIds || [],
      raidtheory_id: mission.id,
      source: 'raidtheory',
      synced_at: new Date()
    };
  }

  // Transformar project a formato local
  transformProject(project) {
    return {
      id: project.id,
      name: project.name?.en || project.name || 'Unknown Project',
      description: project.description?.en || project.description || '',
      phases: (project.phases || []).map((phase, idx) => ({
        phase_number: idx + 1,
        name: phase.name?.en || phase.name || `Phase ${idx + 1}`,
        required_items: phase.requirementItemIds || [],
        required_categories: phase.requirementCategories || [],
        coins_required: phase.coinsRequired || 0
      })),
      raidtheory_id: project.id,
      source: 'raidtheory',
      synced_at: new Date()
    };
  }

  // Transformar trader a formato local
  transformTrader(trader) {
    return {
      id: trader.id,
      name: trader.name?.en || trader.name || 'Unknown Trader',
      description: trader.description?.en || trader.description || '',
      location: trader.location || 'Unknown',
      items_sold: trader.itemsSold || [],
      missions_available: trader.missionsAvailable || [],
      raidtheory_id: trader.id,
      source: 'raidtheory',
      synced_at: new Date()
    };
  }
}

export default new RaidTheoryService();
