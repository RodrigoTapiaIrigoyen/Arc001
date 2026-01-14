/**
 * Servicio para obtener imágenes de armas del wiki de Arc Raiders
 * Las imágenes están en: https://arcraiders.wiki/w/images/
 */

// Mapeo de nombres de armas a URLs de imágenes del wiki
const weaponImageMap = {
  // Assault Rifles
  'Kettle': 'https://arcraiders.wiki/w/images/c/c1/Kettle-Level1.png',
  'Kettle I': 'https://arcraiders.wiki/w/images/c/c1/Kettle-Level1.png',
  'Kettle II': 'https://arcraiders.wiki/w/images/c/c1/Kettle-Level1.png',
  'Kettle III': 'https://arcraiders.wiki/w/images/c/c1/Kettle-Level1.png',
  'Kettle IV': 'https://arcraiders.wiki/w/images/c/c1/Kettle-Level1.png',
  
  'Rattler': 'https://arcraiders.wiki/w/images/5/54/Rattler-Level1.png',
  'Rattler I': 'https://arcraiders.wiki/w/images/5/54/Rattler-Level1.png',
  'Rattler II': 'https://arcraiders.wiki/w/images/5/54/Rattler-Level1.png',
  'Rattler III': 'https://arcraiders.wiki/w/images/5/54/Rattler-Level1.png',
  'Rattler IV': 'https://arcraiders.wiki/w/images/5/54/Rattler-Level1.png',
  
  'Arpeggio': 'https://arcraiders.wiki/w/images/d/dd/Arpeggio-Level1.png',
  'Arpeggio I': 'https://arcraiders.wiki/w/images/d/dd/Arpeggio-Level1.png',
  'Arpeggio II': 'https://arcraiders.wiki/w/images/d/dd/Arpeggio-Level1.png',
  'Arpeggio III': 'https://arcraiders.wiki/w/images/d/dd/Arpeggio-Level1.png',
  'Arpeggio IV': 'https://arcraiders.wiki/w/images/d/dd/Arpeggio-Level1.png',
  
  'Tempest': 'https://arcraiders.wiki/w/images/e/e7/Tempest-Level1.png',
  'Tempest I': 'https://arcraiders.wiki/w/images/e/e7/Tempest-Level1.png',
  'Tempest II': 'https://arcraiders.wiki/w/images/e/e7/Tempest-Level1.png',
  'Tempest III': 'https://arcraiders.wiki/w/images/e/e7/Tempest-Level1.png',
  'Tempest IV': 'https://arcraiders.wiki/w/images/e/e7/Tempest-Level1.png',
  
  'Bettina': 'https://arcraiders.wiki/w/images/6/6d/Bettina-Level1.png',
  'Bettina I': 'https://arcraiders.wiki/w/images/6/6d/Bettina-Level1.png',
  'Bettina II': 'https://arcraiders.wiki/w/images/6/6d/Bettina-Level1.png',
  'Bettina III': 'https://arcraiders.wiki/w/images/6/6d/Bettina-Level1.png',
  'Bettina IV': 'https://arcraiders.wiki/w/images/6/6d/Bettina-Level1.png',

  // Battle Rifles
  'Ferro': 'https://arcraiders.wiki/w/images/1/1a/Ferro-Level1.png',
  'Ferro I': 'https://arcraiders.wiki/w/images/1/1a/Ferro-Level1.png',
  'Ferro II': 'https://arcraiders.wiki/w/images/1/1a/Ferro-Level1.png',
  'Ferro III': 'https://arcraiders.wiki/w/images/1/1a/Ferro-Level1.png',
  'Ferro IV': 'https://arcraiders.wiki/w/images/1/1a/Ferro-Level1.png',
  
  'Renegade': 'https://arcraiders.wiki/w/images/5/5c/Renegade-Level1.png',
  'Renegade I': 'https://arcraiders.wiki/w/images/5/5c/Renegade-Level1.png',
  'Renegade II': 'https://arcraiders.wiki/w/images/5/5c/Renegade-Level1.png',
  'Renegade III': 'https://arcraiders.wiki/w/images/5/5c/Renegade-Level1.png',
  'Renegade IV': 'https://arcraiders.wiki/w/images/5/5c/Renegade-Level1.png',
  
  'Aphelion': 'https://arcraiders.wiki/w/images/1/1f/Aphelion-Level1.png',

  // Submachine Guns
  'Stitcher': 'https://arcraiders.wiki/w/images/4/43/Stitcher-Level1.png',
  'Stitcher I': 'https://arcraiders.wiki/w/images/4/43/Stitcher-Level1.png',
  'Stitcher II': 'https://arcraiders.wiki/w/images/4/43/Stitcher-Level1.png',
  'Stitcher III': 'https://arcraiders.wiki/w/images/4/43/Stitcher-Level1.png',
  'Stitcher IV': 'https://arcraiders.wiki/w/images/4/43/Stitcher-Level1.png',
  
  'Bobcat': 'https://arcraiders.wiki/w/images/3/36/Bobcat-Level1.png',
  'Bobcat I': 'https://arcraiders.wiki/w/images/3/36/Bobcat-Level1.png',
  'Bobcat II': 'https://arcraiders.wiki/w/images/3/36/Bobcat-Level1.png',
  'Bobcat III': 'https://arcraiders.wiki/w/images/3/36/Bobcat-Level1.png',
  'Bobcat IV': 'https://arcraiders.wiki/w/images/3/36/Bobcat-Level1.png',

  // Shotguns
  'Il Toro': 'https://arcraiders.wiki/w/images/9/9a/Il_Toro-Level1.png',
  'Il Toro I': 'https://arcraiders.wiki/w/images/9/9a/Il_Toro-Level1.png',
  'Il Toro II': 'https://arcraiders.wiki/w/images/9/9a/Il_Toro-Level1.png',
  'Il Toro III': 'https://arcraiders.wiki/w/images/9/9a/Il_Toro-Level1.png',
  'Il Toro IV': 'https://arcraiders.wiki/w/images/9/9a/Il_Toro-Level1.png',
  
  'Vulcano': 'https://arcraiders.wiki/w/images/b/ba/Vulcano-Level1.png',
  'Vulcano I': 'https://arcraiders.wiki/w/images/b/ba/Vulcano-Level1.png',
  'Vulcano II': 'https://arcraiders.wiki/w/images/b/ba/Vulcano-Level1.png',
  'Vulcano III': 'https://arcraiders.wiki/w/images/b/ba/Vulcano-Level1.png',
  'Vulcano IV': 'https://arcraiders.wiki/w/images/b/ba/Vulcano-Level1.png',

  // Pistols
  'Hairpin': 'https://arcraiders.wiki/w/images/2/29/Hairpin-Level1.png',
  'Hairpin I': 'https://arcraiders.wiki/w/images/2/29/Hairpin-Level1.png',
  'Hairpin II': 'https://arcraiders.wiki/w/images/2/29/Hairpin-Level1.png',
  'Hairpin III': 'https://arcraiders.wiki/w/images/2/29/Hairpin-Level1.png',
  'Hairpin IV': 'https://arcraiders.wiki/w/images/2/29/Hairpin-Level1.png',
  
  'Burletta': 'https://arcraiders.wiki/w/images/a/aa/Burletta-Level1.png',
  'Burletta I': 'https://arcraiders.wiki/w/images/a/aa/Burletta-Level1.png',
  'Burletta II': 'https://arcraiders.wiki/w/images/a/aa/Burletta-Level1.png',
  'Burletta III': 'https://arcraiders.wiki/w/images/a/aa/Burletta-Level1.png',
  'Burletta IV': 'https://arcraiders.wiki/w/images/a/aa/Burletta-Level1.png',
  
  'Venator': 'https://arcraiders.wiki/w/images/e/e4/Venator-Level1.png',
  'Venator I': 'https://arcraiders.wiki/w/images/e/e4/Venator-Level1.png',
  'Venator II': 'https://arcraiders.wiki/w/images/e/e4/Venator-Level1.png',
  'Venator III': 'https://arcraiders.wiki/w/images/e/e4/Venator-Level1.png',
  'Venator IV': 'https://arcraiders.wiki/w/images/e/e4/Venator-Level1.png',

  // Hand Cannons
  'Anvil': 'https://arcraiders.wiki/w/images/0/0b/Anvil-Level1.png',
  'Anvil I': 'https://arcraiders.wiki/w/images/0/0b/Anvil-Level1.png',
  'Anvil II': 'https://arcraiders.wiki/w/images/0/0b/Anvil-Level1.png',
  'Anvil III': 'https://arcraiders.wiki/w/images/0/0b/Anvil-Level1.png',
  'Anvil IV': 'https://arcraiders.wiki/w/images/0/0b/Anvil-Level1.png',

  // Light Machine Guns
  'Torrente': 'https://arcraiders.wiki/w/images/1/1e/Torrente-Level1.png',
  'Torrente I': 'https://arcraiders.wiki/w/images/1/1e/Torrente-Level1.png',
  'Torrente II': 'https://arcraiders.wiki/w/images/1/1e/Torrente-Level1.png',
  'Torrente III': 'https://arcraiders.wiki/w/images/1/1e/Torrente-Level1.png',
  'Torrente IV': 'https://arcraiders.wiki/w/images/1/1e/Torrente-Level1.png',

  // Sniper Rifles
  'Osprey': 'https://arcraiders.wiki/w/images/a/a6/Osprey-Level1.png',
  'Osprey I': 'https://arcraiders.wiki/w/images/a/a6/Osprey-Level1.png',
  'Osprey II': 'https://arcraiders.wiki/w/images/a/a6/Osprey-Level1.png',
  'Osprey III': 'https://arcraiders.wiki/w/images/a/a6/Osprey-Level1.png',
  'Osprey IV': 'https://arcraiders.wiki/w/images/a/a6/Osprey-Level1.png',
  
  'Jupiter': 'https://arcraiders.wiki/w/images/0/04/Jupiter-Level1.png',

  // Special
  'Hullcracker': 'https://arcraiders.wiki/w/images/7/7f/Hullcracker-Level1.png',
  'Hullcracker I': 'https://arcraiders.wiki/w/images/7/7f/Hullcracker-Level1.png',
  'Hullcracker II': 'https://arcraiders.wiki/w/images/7/7f/Hullcracker-Level1.png',
  'Hullcracker III': 'https://arcraiders.wiki/w/images/7/7f/Hullcracker-Level1.png',
  'Hullcracker IV': 'https://arcraiders.wiki/w/images/7/7f/Hullcracker-Level1.png',
  
  'Equalizer': 'https://arcraiders.wiki/w/images/8/8c/Equalizer-Level1.png',

  // Trigger Grenade (Custom)
  'Trigger Grenade': 'https://arcraiders.wiki/w/images/f/f2/Trigger_Grenade-Level1.png',
};

/**
 * Obtiene la URL de imagen para un arma específica
 * @param {string} weaponName - Nombre del arma
 * @returns {string|null} URL de la imagen o null si no existe
 */
function getWeaponImageUrl(weaponName) {
  return weaponImageMap[weaponName] || null;
}

/**
 * Enriquece un arma con su imagen del wiki
 * @param {Object} weapon - Objeto del arma
 * @returns {Object} Arma con imagen agregada
 */
function enrichWeaponWithImage(weapon) {
  const imageUrl = getWeaponImageUrl(weapon.name);
  return {
    ...weapon,
    wiki_image_url: imageUrl,
    image_urls: {
      ...weapon.image_urls,
      wiki: imageUrl
    }
  };
}

/**
 * Enriquece un array de armas con imágenes del wiki
 * @param {Array} weapons - Array de armas
 * @returns {Array} Armas con imágenes
 */
function enrichWeaponsWithImages(weapons) {
  return weapons.map(weapon => enrichWeaponWithImage(weapon));
}

export default {
  getWeaponImageUrl,
  enrichWeaponWithImage,
  enrichWeaponsWithImages,
  weaponImageMap
};
