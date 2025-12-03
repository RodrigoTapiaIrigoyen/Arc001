export default class EnemiesService {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('enemies');
    this.contributionsCollection = db.collection('enemy_contributions');
  }

  // Seed inicial con datos estimados
  async seedEnemies() {
    const enemies = [
      {
        id: 'leaper',
        name: 'Leaper',
        type: 'Scout Unit',
        threat: 'Low',
        description: 'Fast-moving reconnaissance drones that patrol in packs',
        components: ['Leaper Pulse Unit'],
        hp_min: 150,
        hp_max: 200,
        damage_min: 15,
        damage_max: 25,
        abilities: ['Quick Movement', 'Pack Tactics', 'Pulse Attack'],
        verified: false,
        contributions_count: 0,
        last_updated: new Date(),
      },
      {
        id: 'wasp',
        name: 'Wasp',
        type: 'Aerial Unit',
        threat: 'Medium',
        description: 'Agile flying units with ranged attacks',
        components: ['Wasp Driver', 'Damaged Wasp Driver'],
        hp_min: 200,
        hp_max: 300,
        damage_min: 20,
        damage_max: 35,
        abilities: ['Flight', 'Ranged Attack', 'Evasive Maneuvers'],
        verified: false,
        contributions_count: 0,
        last_updated: new Date(),
      },
      {
        id: 'hornet',
        name: 'Hornet',
        type: 'Heavy Aerial',
        threat: 'High',
        description: 'Heavily armed flying units with devastating firepower',
        components: ['Hornet Driver', 'Damaged Hornet Driver'],
        hp_min: 400,
        hp_max: 600,
        damage_min: 40,
        damage_max: 60,
        abilities: ['Heavy Armor', 'Explosive Rounds', 'Aerial Superiority'],
        verified: false,
        contributions_count: 0,
        last_updated: new Date(),
      },
      {
        id: 'tick',
        name: 'Tick',
        type: 'Explosive Unit',
        threat: 'Medium',
        description: 'Suicide bombers that rush targets and self-destruct',
        components: ['Tick Pod', 'Damaged Tick Pod'],
        hp_min: 50,
        hp_max: 100,
        damage_min: 100,
        damage_max: 150,
        abilities: ['Kamikaze', 'Proximity Detonation', 'Fast Rush'],
        verified: false,
        contributions_count: 0,
        last_updated: new Date(),
      },
      {
        id: 'bombardier',
        name: 'Bombardier',
        type: 'Artillery Unit',
        threat: 'High',
        description: 'Long-range artillery units with area-of-effect attacks',
        components: ['Bombardier Cell'],
        hp_min: 500,
        hp_max: 700,
        damage_min: 50,
        damage_max: 80,
        abilities: ['Artillery Strike', 'Area Damage', 'Long Range'],
        verified: false,
        contributions_count: 0,
        last_updated: new Date(),
      },
      {
        id: 'bastion',
        name: 'Bastion',
        type: 'Tank Unit',
        threat: 'Very High',
        description: 'Heavily armored defensive units with shield capabilities',
        components: ['Bastion Cell'],
        hp_min: 800,
        hp_max: 1200,
        damage_min: 30,
        damage_max: 50,
        abilities: ['Heavy Armor', 'Shield Projection', 'Defensive Stance'],
        verified: false,
        contributions_count: 0,
        last_updated: new Date(),
      },
      {
        id: 'sentinel',
        name: 'Sentinel',
        type: 'Turret Unit',
        threat: 'High',
        description: 'Stationary defensive turrets with high accuracy',
        components: ['Sentinel Firing Core'],
        hp_min: 600,
        hp_max: 800,
        damage_min: 35,
        damage_max: 55,
        abilities: ['Stationary', 'High Accuracy', 'Sustained Fire'],
        verified: false,
        contributions_count: 0,
        last_updated: new Date(),
      },
      {
        id: 'snitch',
        name: 'Snitch',
        type: 'Scanner Unit',
        threat: 'Low',
        description: 'Reconnaissance drones that alert nearby enemies',
        components: ['Snitch Scanner', 'Damaged Snitch Scanner'],
        hp_min: 100,
        hp_max: 150,
        damage_min: 5,
        damage_max: 10,
        abilities: ['Detection', 'Alert Signal', 'Evasion'],
        verified: false,
        contributions_count: 0,
        last_updated: new Date(),
      },
      {
        id: 'spotter',
        name: 'Spotter',
        type: 'Relay Unit',
        threat: 'Medium',
        description: 'Communication relay that coordinates enemy attacks',
        components: ['Spotter Relay'],
        hp_min: 200,
        hp_max: 300,
        damage_min: 10,
        damage_max: 20,
        abilities: ['Target Marking', 'Enemy Coordination', 'Buff Nearby Units'],
        verified: false,
        contributions_count: 0,
        last_updated: new Date(),
      },
      {
        id: 'rocketeer',
        name: 'Rocketeer',
        type: 'Missile Unit',
        threat: 'Very High',
        description: 'Advanced units with guided missile systems',
        components: ['Rocketeer Driver', 'Damaged Rocketeer Driver'],
        hp_min: 400,
        hp_max: 600,
        damage_min: 60,
        damage_max: 100,
        abilities: ['Guided Missiles', 'Lock-On', 'Burst Fire'],
        verified: false,
        contributions_count: 0,
        last_updated: new Date(),
      },
      {
        id: 'fireball',
        name: 'Fireball',
        type: 'Incendiary Unit',
        threat: 'High',
        description: 'Fire-based units that leave burning areas',
        components: ['Fireball Burner', 'Damaged Fireball Burner'],
        hp_min: 300,
        hp_max: 500,
        damage_min: 25,
        damage_max: 45,
        abilities: ['Fire Damage', 'Area Denial', 'Burning Ground'],
        verified: false,
        contributions_count: 0,
        last_updated: new Date(),
      },
      {
        id: 'surveyor',
        name: 'Surveyor',
        type: 'Elite Unit',
        threat: 'Boss',
        description: 'Massive elite units that command entire sectors',
        components: ['Surveyor Vault'],
        hp_min: 2000,
        hp_max: 3000,
        damage_min: 80,
        damage_max: 120,
        abilities: ['Command', 'Multiple Phases', 'Summon Reinforcements'],
        verified: false,
        contributions_count: 0,
        last_updated: new Date(),
      },
      {
        id: 'matriarch',
        name: 'Matriarch',
        type: 'Boss Unit',
        threat: 'Boss',
        description: 'Powerful boss with multiple attack phases',
        components: ['Matriarch Reactor'],
        hp_min: 5000,
        hp_max: 7000,
        damage_min: 100,
        damage_max: 150,
        abilities: ['Boss Fight', 'Phase Transitions', 'Enrage Mode'],
        verified: false,
        contributions_count: 0,
        last_updated: new Date(),
      },
      {
        id: 'queen',
        name: 'Queen',
        type: 'Boss Unit',
        threat: 'Boss',
        description: 'Ultimate boss encounter with devastating abilities',
        components: ['Queen Reactor'],
        hp_min: 8000,
        hp_max: 10000,
        damage_min: 120,
        damage_max: 180,
        abilities: ['Ultimate Boss', 'Multi-Phase Fight', 'Legendary Drops'],
        verified: false,
        contributions_count: 0,
        last_updated: new Date(),
      },
    ];

    const existingCount = await this.collection.countDocuments();
    if (existingCount === 0) {
      const result = await this.collection.insertMany(enemies);
      return { inserted: result.insertedCount };
    }
    return { inserted: 0, message: 'Enemies already exist' };
  }

  // Obtener todos los enemigos
  async getAllEnemies() {
    return await this.collection.find({}).sort({ threat: 1, name: 1 }).toArray();
  }

  // Obtener enemigo por ID
  async getEnemyById(id) {
    return await this.collection.findOne({ id });
  }

  // Contribuir actualización de stats
  async contributeEnemyStats(enemyId, contribution) {
    const enemy = await this.getEnemyById(enemyId);
    if (!enemy) {
      throw new Error('Enemy not found');
    }

    // Guardar contribución
    const contributionDoc = {
      enemy_id: enemyId,
      enemy_name: enemy.name,
      contribution_type: contribution.type, // 'hp', 'damage', 'ability', 'description'
      old_value: contribution.old_value,
      new_value: contribution.new_value,
      user_id: contribution.user_id || 'anonymous',
      user_name: contribution.user_name || 'Anonymous',
      evidence: contribution.evidence || null, // URL a screenshot/video
      votes_up: 0,
      votes_down: 0,
      status: 'pending', // 'pending', 'approved', 'rejected'
      created_at: new Date(),
    };

    const result = await this.contributionsCollection.insertOne(contributionDoc);

    // Si es la primera contribución o tiene suficientes votos, actualizar automáticamente
    if (contribution.auto_approve) {
      await this.approveContribution(result.insertedId);
    }

    return result;
  }

  // Aprobar contribución y actualizar enemy
  async approveContribution(contributionId) {
    const contribution = await this.contributionsCollection.findOne({ _id: contributionId });
    if (!contribution) {
      throw new Error('Contribution not found');
    }

    // Actualizar enemy según tipo de contribución
    const updateData = {
      last_updated: new Date(),
      $inc: { contributions_count: 1 },
    };

    switch (contribution.contribution_type) {
      case 'hp':
        updateData.hp_min = contribution.new_value.min;
        updateData.hp_max = contribution.new_value.max;
        break;
      case 'damage':
        updateData.damage_min = contribution.new_value.min;
        updateData.damage_max = contribution.new_value.max;
        break;
      case 'ability':
        updateData.$push = { abilities: contribution.new_value };
        break;
      case 'description':
        updateData.description = contribution.new_value;
        break;
    }

    await this.collection.updateOne({ id: contribution.enemy_id }, { $set: updateData });

    // Marcar contribución como aprobada
    await this.contributionsCollection.updateOne(
      { _id: contributionId },
      { $set: { status: 'approved', approved_at: new Date() } }
    );

    return { success: true };
  }

  // Votar contribución
  async voteContribution(contributionId, vote) {
    const field = vote === 'up' ? 'votes_up' : 'votes_down';
    await this.contributionsCollection.updateOne(
      { _id: contributionId },
      { $inc: { [field]: 1 } }
    );

    // Auto-aprobar si tiene 5+ votos positivos
    const contribution = await this.contributionsCollection.findOne({ _id: contributionId });
    if (contribution.votes_up >= 5 && contribution.status === 'pending') {
      await this.approveContribution(contributionId);
    }

    return { success: true };
  }

  // Obtener contribuciones pendientes
  async getPendingContributions() {
    return await this.contributionsCollection
      .find({ status: 'pending' })
      .sort({ created_at: -1 })
      .toArray();
  }

  // Estadísticas
  async getStats() {
    const total = await this.collection.countDocuments();
    const verified = await this.collection.countDocuments({ verified: true });
    const pendingContributions = await this.contributionsCollection.countDocuments({ status: 'pending' });

    return {
      total_enemies: total,
      verified_enemies: verified,
      pending_contributions: pendingContributions,
    };
  }
}
