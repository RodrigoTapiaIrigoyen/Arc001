// API Client para conectar con el backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = {
  // Weapons
  async getWeapons() {
    const response = await fetch(`${API_URL}/weapons`);
    return response.json();
  },
  
  async createWeapon(weapon: any) {
    const response = await fetch(`${API_URL}/weapons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weapon),
    });
    return response.json();
  },

  // Rarities
  async getRarities() {
    const response = await fetch(`${API_URL}/rarities`);
    return response.json();
  },

  // Marketplace
  async getMarketplace() {
    const response = await fetch(`${API_URL}/marketplace`);
    return response.json();
  },

  // Items (ArcForge - 339 items completos)
  async getItems() {
    const response = await fetch(`${API_URL}/items`);
    return response.json();
  },

  async syncItems() {
    const response = await fetch(`${API_URL}/sync/items`, {
      method: 'POST',
    });
    return response.json();
  },

  // Maps - Locations with items
  async getMaps() {
    const response = await fetch(`${API_URL}/maps`);
    return response.json();
  },

  // Missions (legacy)
  async getMissions() {
    const response = await fetch(`${API_URL}/missions`);
    return response.json();
  },

  async syncMissions() {
    const response = await fetch(`${API_URL}/sync/missions`, {
      method: 'POST',
    });
    return response.json();
  },

  // Projects
  async getProjects() {
    const response = await fetch(`${API_URL}/projects`);
    return response.json();
  },

  async syncProjects() {
    const response = await fetch(`${API_URL}/sync/projects`, {
      method: 'POST',
    });
    return response.json();
  },

  // Traders
  async getTraders() {
    const response = await fetch(`${API_URL}/traders`);
    return response.json();
  },

  async syncTraders() {
    const response = await fetch(`${API_URL}/sync/traders`, {
      method: 'POST',
    });
    return response.json();
  },

  // Sync external data
  async syncWeapons() {
    const response = await fetch(`${API_URL}/sync/weapons`, {
      method: 'POST',
    });
    return response.json();
  },
};

// Mantener compatibilidad con el código anterior
export const db = {
  collection: (name: string) => ({
    find: () => ({
      toArray: async () => {
        if (name === 'weapons') return api.getWeapons();
        if (name === 'rarities') return api.getRarities();
        if (name === 'marketplace_listings') return api.getMarketplace();
        return [];
      },
    }),
  }),
};

export const connectDB = async () => db;
export const getDB = () => db;
