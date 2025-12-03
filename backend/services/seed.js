import { weapons, quests, rarities } from '../data/seed.js';

// Seed Service - Poblar la base de datos con datos iniciales
class SeedService {
  constructor(db) {
    this.db = db;
  }

  async seedWeapons() {
    console.log('🌱 Poblando weapons...');
    
    try {
      // Limpiar colección existente
      await this.db.collection('weapons').deleteMany({ source: 'seed' });
      
      // Insertar weapons
      const result = await this.db.collection('weapons').insertMany(weapons);
      console.log(`✅ ${result.insertedCount} weapons insertadas`);
      
      return { success: true, inserted: result.insertedCount };
    } catch (error) {
      console.error('❌ Error seeding weapons:', error);
      throw error;
    }
  }

  async seedQuests() {
    console.log('🌱 Poblando quests...');
    
    try {
      await this.db.collection('quests').deleteMany({ source: 'seed' });
      const result = await this.db.collection('quests').insertMany(quests);
      console.log(`✅ ${result.insertedCount} quests insertadas`);
      
      return { success: true, inserted: result.insertedCount };
    } catch (error) {
      console.error('❌ Error seeding quests:', error);
      throw error;
    }
  }

  async seedRarities() {
    console.log('🌱 Poblando rarities...');
    
    try {
      await this.db.collection('rarities').deleteMany({});
      const result = await this.db.collection('rarities').insertMany(rarities);
      console.log(`✅ ${result.insertedCount} rarities insertadas`);
      
      return { success: true, inserted: result.insertedCount };
    } catch (error) {
      console.error('❌ Error seeding rarities:', error);
      throw error;
    }
  }

  async seedAll() {
    console.log('🚀 Iniciando seed completo...\n');
    
    const results = {
      weapons: null,
      quests: null,
      rarities: null,
      errors: []
    };

    try {
      results.weapons = await this.seedWeapons();
    } catch (error) {
      results.errors.push({ type: 'weapons', error: error.message });
    }

    try {
      results.quests = await this.seedQuests();
    } catch (error) {
      results.errors.push({ type: 'quests', error: error.message });
    }

    try {
      results.rarities = await this.seedRarities();
    } catch (error) {
      results.errors.push({ type: 'rarities', error: error.message });
    }

    console.log('\n✅ Seed completo finalizado');
    return results;
  }
}

export default SeedService;
