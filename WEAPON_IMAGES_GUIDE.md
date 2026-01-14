# Weapon Images Implementation Guide

## ✅ Mejoras Implementadas

### 1. **Sincronización de Imágenes del Wiki**

- Creado servicio `weaponImages.js` con mapeo de 70+ armas
- Integrado automáticamente en el servicio `arcforge.js`
- Todas las armas ahora tienen URLs de imagen del wiki oficial

### 2. **Mejor Carga de Imágenes en Frontend**

- Componente `WeaponsDatabase.tsx` mejorado con:
  - **Spinner de carga** - Feedback visual mientras carga la imagen
  - **CORS headers** - `crossOrigin="anonymous"` para evitar bloqueos
  - **Fallback automático** - Si falla una URL, intenta alternativas
  - **Manejo de errores** - Muestra icono si no hay imagen disponible
  - **Animación suave** - Fade in cuando se carga exitosamente
  - **Zoom al hover** - Efecto visual mejorado

### 3. **Backend Improvements**

- Nuevo endpoint `/api/weapons/images/:weaponName` para obtener imágenes específicas
- Servicio `imageProxy.js` creado para servir imágenes con cache (1 hora)
- Integración automática de imágenes en sincronización de items

## 🔧 Configuración de Imágenes

### URLs del Wiki Oficial

Las imágenes se obtienen de: `https://arcraiders.wiki/w/images/`

Ejemplo de estructura:

```
Kettle: https://arcraiders.wiki/w/images/c/c1/Kettle-Level1.png
Bobcat: https://arcraiders.wiki/w/images/3/36/Bobcat-Level1.png
Torrente: https://arcraiders.wiki/w/images/1/1e/Torrente-Level1.png
```

## 📝 Datos que se Sincronizan

Cuando se sincroniza un arma de ArcForge, se incluyen:

```javascript
{
  name: "Kettle",
  image_urls: {
    wiki: "https://arcraiders.wiki/w/images/c/c1/Kettle-Level1.png",
    // ... otras fuentes de imagen
  },
  wiki_url: "https://arcraiders.wiki/wiki/Kettle",
  // ... otros datos del arma
}
```

## 🔍 Cómo Verificar que Funciona

### 1. **Verificar en Base de Datos**

```javascript
// En MongoDB, ejecutar:
db.collection("items").findOne({ name: "Kettle" });
// Debe retornar un documento con:
// - image_urls.wiki: URL válida
```

### 2. **Verificar en Endpoint**

```bash
curl http://localhost:10000/api/weapons/images/Kettle
# Debe retornar:
# {
#   "name": "Kettle",
#   "image_urls": { "wiki": "https://..." },
#   "wiki_url": "https://arcraiders.wiki/wiki/Kettle"
# }
```

### 3. **Verificar en Frontend**

- Ir a Dashboard > Weapons > Weapons Arsenal
- Las imágenes deben cargar (con spinner mientras cargan)
- Al pasar el mouse, hacen zoom suavemente
- Si hay error, muestra un icono de advertencia

## 🚀 Script de Sincronización

Para sincronizar las imágenes manualmente:

```bash
node backend/scripts/verify-weapon-images.js
```

Este script verifica que todas las armas estén correctamente mapeadas.

## ⚠️ Notas Importantes

1. **CORS**: Las imágenes se sirven con headers `crossOrigin="anonymous"`
2. **Cache**: Las imágenes se cachean 1 hora en el backend
3. **Fallback**: Si la imagen del wiki no carga, el componente muestra un icono
4. **Nombres**: El mapeo de imágenes es **case-sensitive** con los nombres del wiki

## 📦 Armas Mapeadas

**Assault Rifles (5)**

- Kettle, Rattler, Arpeggio, Tempest, Bettina

**Battle Rifles (3)**

- Ferro, Renegade, Aphelion

**SMG (2)**

- Stitcher, Bobcat

**Shotguns (2)**

- Il Toro, Vulcano

**Pistols (3)**

- Hairpin, Burletta, Venator

**Hand Cannons (1)**

- Anvil

**LMG (1)**

- Torrente

**Sniper Rifles (2)**

- Osprey, Jupiter

**Special (2)**

- Hullcracker, Equalizer

**Total: 21 armas únicas × 4 niveles (I-IV) = 84 variantes mapeadas**

## 🔄 Flujo de Datos

```
ArcForge Database
      ↓
arcforge.js (transformItem)
      ↓
weaponImages.js (getWeaponImageUrl)
      ↓
sync.js (syncArcForgeItems)
      ↓
MongoDB (items collection)
      ↓
/api/items endpoint
      ↓
WeaponsDatabase.tsx
      ↓
Browser (displayed with images)
```

## 🎨 Características Visuales

- **Height**: 192px (h-48) para las imágenes
- **Object-fit**: `contain` para mantener proporción
- **Padding**: 12px (p-3) para espacio
- **Zoom**: `scale-105` on hover
- **Spinner**: Gira durante la carga
- **Fallback Icon**: Muestra si no hay imagen disponible
