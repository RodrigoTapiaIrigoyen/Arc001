import fetch from 'node-fetch';

console.log('🧪 Probando integración con MetaForge...\n');

// Test 1: Health check
console.log('1️⃣ Verificando backend...');
try {
  const health = await fetch('http://localhost:3001/api/health');
  const data = await health.json();
  console.log('✅ Backend OK:', data);
} catch (error) {
  console.error('❌ Backend no responde:', error.message);
  process.exit(1);
}

// Test 2: Sync stats before
console.log('\n2️⃣ Estadísticas antes de sincronizar...');
const statsBefore = await fetch('http://localhost:3001/api/sync/stats');
console.log('📊', await statsBefore.json());

// Test 3: Sync items
console.log('\n3️⃣ Sincronizando items desde MetaForge...');
try {
  const syncItems = await fetch('http://localhost:3001/api/sync/items', {
    method: 'POST'
  });
  const itemsResult = await syncItems.json();
  console.log('📦 Items:', itemsResult);
} catch (error) {
  console.error('❌ Error:', error.message);
}

// Test 4: Sync quests
console.log('\n4️⃣ Sincronizando quests desde MetaForge...');
try {
  const syncQuests = await fetch('http://localhost:3001/api/sync/quests', {
    method: 'POST'
  });
  const questsResult = await syncQuests.json();
  console.log('📋 Quests:', questsResult);
} catch (error) {
  console.error('❌ Error:', error.message);
}

// Test 5: Sync stats after
console.log('\n5️⃣ Estadísticas después de sincronizar...');
const statsAfter = await fetch('http://localhost:3001/api/sync/stats');
console.log('📊', await statsAfter.json());

// Test 6: Get weapons
console.log('\n6️⃣ Obteniendo armas desde MongoDB...');
const weapons = await fetch('http://localhost:3001/api/weapons');
const weaponsData = await weapons.json();
console.log(`🔫 Total armas: ${weaponsData.length}`);
if (weaponsData.length > 0) {
  console.log('   Ejemplo:', weaponsData[0]);
}

console.log('\n✅ Tests completados!');
