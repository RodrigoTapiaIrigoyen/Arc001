/**
 * Script para verificar que las imágenes de armas estén correctamente mapeadas
 */

import weaponImages from './services/weaponImages.js';

console.log('🔍 Verificando mapeo de imágenes de armas...\n');

const testWeapons = [
  'Kettle',
  'Kettle I',
  'Bobcat II',
  'Torrente IV',
  'Anvil III',
  'Osprey',
  'Jupiter',
  'Hullcracker',
  'Equalizer'
];

testWeapons.forEach(weaponName => {
  const imageUrl = weaponImages.getWeaponImageUrl(weaponName);
  const status = imageUrl ? '✅' : '❌';
  console.log(`${status} ${weaponName}`);
  if (imageUrl) {
    console.log(`   URL: ${imageUrl}\n`);
  } else {
    console.log(`   No hay imagen mapeada\n`);
  }
});

console.log(`\n📊 Total de armas mapeadas: ${Object.keys(weaponImages.weaponImageMap).length}`);
