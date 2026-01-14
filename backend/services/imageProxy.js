/**
 * Servicio para servir imágenes de armas como proxy
 * Evita problemas de CORS al acceder a imágenes del wiki
 */

import fetch from 'node-fetch';
import NodeCache from 'node-cache';

// Cache de 1 hora para imágenes
const imageCache = new NodeCache({ stdTTL: 3600 });

/**
 * Obtiene una imagen desde el wiki y la retorna como stream
 * @param {string} imageName - Nombre de la imagen (ej: "Kettle-Level1.png")
 * @returns {Promise<Buffer>} Buffer de la imagen
 */
async function getWeaponImage(imageName) {
  // Verificar cache
  const cached = imageCache.get(imageName);
  if (cached) {
    return cached;
  }

  try {
    // Construir URL del wiki basada en el nombre
    // Ejemplo: "Kettle-Level1.png" -> "https://arcraiders.wiki/w/images/c/c1/Kettle-Level1.png"
    const imageUrl = constructImageUrl(imageName);
    
    if (!imageUrl) {
      return null;
    }

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Arc Raiders App (+https://arc-raiders.vercel.app)'
      },
      timeout: 10000
    });

    if (!response.ok) {
      console.warn(`⚠️ No se pudo obtener imagen: ${imageName} (${response.status})`);
      return null;
    }

    const buffer = await response.buffer();
    
    // Cachear la imagen
    imageCache.set(imageName, buffer);
    
    return buffer;
  } catch (error) {
    console.error(`❌ Error obteniendo imagen ${imageName}:`, error.message);
    return null;
  }
}

/**
 * Mapeo de nombres de archivos a rutas del wiki
 * Basado en la estructura de directorios del wiki
 */
const imageUrlMap = {
  // Assault Rifles
  'Kettle-Level1.png': 'https://arcraiders.wiki/w/images/c/c1/Kettle-Level1.png',
  'Rattler-Level1.png': 'https://arcraiders.wiki/w/images/5/54/Rattler-Level1.png',
  'Arpeggio-Level1.png': 'https://arcraiders.wiki/w/images/d/dd/Arpeggio-Level1.png',
  'Tempest-Level1.png': 'https://arcraiders.wiki/w/images/e/e7/Tempest-Level1.png',
  'Bettina-Level1.png': 'https://arcraiders.wiki/w/images/6/6d/Bettina-Level1.png',
  
  // Battle Rifles
  'Ferro-Level1.png': 'https://arcraiders.wiki/w/images/1/1a/Ferro-Level1.png',
  'Renegade-Level1.png': 'https://arcraiders.wiki/w/images/5/5c/Renegade-Level1.png',
  'Aphelion-Level1.png': 'https://arcraiders.wiki/w/images/1/1f/Aphelion-Level1.png',
  
  // SMG
  'Stitcher-Level1.png': 'https://arcraiders.wiki/w/images/4/43/Stitcher-Level1.png',
  'Bobcat-Level1.png': 'https://arcraiders.wiki/w/images/3/36/Bobcat-Level1.png',
  
  // Shotguns
  'Il_Toro-Level1.png': 'https://arcraiders.wiki/w/images/9/9a/Il_Toro-Level1.png',
  'Vulcano-Level1.png': 'https://arcraiders.wiki/w/images/b/ba/Vulcano-Level1.png',
  
  // Pistols
  'Hairpin-Level1.png': 'https://arcraiders.wiki/w/images/2/29/Hairpin-Level1.png',
  'Burletta-Level1.png': 'https://arcraiders.wiki/w/images/a/aa/Burletta-Level1.png',
  'Venator-Level1.png': 'https://arcraiders.wiki/w/images/e/e4/Venator-Level1.png',
  
  // Hand Cannons
  'Anvil-Level1.png': 'https://arcraiders.wiki/w/images/0/0b/Anvil-Level1.png',
  
  // LMG
  'Torrente-Level1.png': 'https://arcraiders.wiki/w/images/1/1e/Torrente-Level1.png',
  
  // Sniper Rifles
  'Osprey-Level1.png': 'https://arcraiders.wiki/w/images/a/a6/Osprey-Level1.png',
  'Jupiter-Level1.png': 'https://arcraiders.wiki/w/images/0/04/Jupiter-Level1.png',
  
  // Special
  'Hullcracker-Level1.png': 'https://arcraiders.wiki/w/images/7/7f/Hullcracker-Level1.png',
  'Equalizer-Level1.png': 'https://arcraiders.wiki/w/images/8/8c/Equalizer-Level1.png',
};

/**
 * Construye la URL de una imagen basada en su nombre
 * @param {string} imageName - Nombre de la imagen
 * @returns {string|null} URL completa o null
 */
function constructImageUrl(imageName) {
  return imageUrlMap[imageName] || null;
}

/**
 * Retorna todas las URLs de imágenes disponibles
 * @returns {Object} Mapa de nombres a URLs
 */
function getAllImageUrls() {
  return imageUrlMap;
}

export default {
  getWeaponImage,
  constructImageUrl,
  getAllImageUrls,
  imageUrlMap
};
