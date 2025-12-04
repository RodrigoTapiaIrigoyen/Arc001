// Script para agregar post de discusión sobre Patch 1.3.0 y 1.4.0
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function addPatchDiscussion() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('arc_raiders');
    
    // Buscar un usuario admin para crear el post (o usar el primero)
    const adminUser = await db.collection('users').findOne({ role: 'admin' });
    const userId = adminUser ? adminUser._id : (await db.collection('users').findOne())._id;
    const username = adminUser ? adminUser.username : (await db.collection('users').findOne()).username;
    
    if (!userId) {
      console.log('❌ No hay usuarios en la base de datos');
      return;
    }
    
    // Crear post sobre la actualización 1.3.0 y 1.4.0
    const patchPost = {
      userId: userId.toString(),
      username: username,
      title: '🔥 Update 1.3.0 "Duck Update" y 1.4.0 - Cambios de Balance y Fixes',
      content: `**¡Raiders!**

Embark Studios ha lanzado las actualizaciones 1.3.0 y 1.4.0 con importantes cambios de balance y correcciones.

## 🔫 **Cambios en Armas**

### Venator
- ⚠️ **NERFED**: Reducida velocidad de disparo con upgrades (de 22/44/60% a 13/26/40%)
- Peso aumentado de 2 a 5
- *Dev note: El Venator fully upgraded estaba muy OP, capaz de eliminar squads completos*

### Aphelion
- ✅ Aumentado drop rate de blueprints
- Corregidos trazadores excesivamente brillantes

### Hullcracker
- Rebalanceado daño explosivo
- Ahora requiere más precisión contra enemigos grandes

## 💰 **Cambios en Items**

### Deadline
- 💎 Precio de compra: 8,100 → **15,000 coins** (casi el doble!)
- 📈 Precio de venta: 3,000 → 5,000 coins
- Nuevo crafting: 3 Explosive compound + 2 ARC Circuitry
- Stock del trader reducido de 3 a 1

### Power Cell
- 📉 Precio de venta reducido: 640 → 270 coins

### Launcher Ammo
- Nuevo sistema de crafting sin necesidad de blueprint
- Precio ajustado: 10 por 6,000 → 6 por 4,500 coins

## 🤖 **Mejoras en ARC**

### Shredder
- Mejor detección de Lure Grenades
- Movimiento mejorado y más consistente
- Ya no se queda atascado en esquinas

## 🗺️ **Mapas y Fixes**

- Corregidos exploits en locked rooms
- Fixes en Stella Montis, The Dam, Spaceport y Blue Gate
- Parches de seguridad contra exploits de quick-swap

---

**¿Qué opinan de estos cambios?**
- ¿El nerf al Venator era necesario?
- ¿Vale la pena el nuevo precio del Deadline?
- ¿Han notado las mejoras en el Shredder?

¡Compartan sus experiencias con la nueva actualización!

*Fuente: [Patch Notes oficiales](https://arcraiders.com/es/news/patch-notes-1-4-0)*`,
      category: 'updates',
      likes: 0,
      likedBy: [],
      comments: [],
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: true // Hacerlo destacado
    };
    
    const result = await db.collection('posts').insertOne(patchPost);
    console.log('✅ Post de actualización creado:', result.insertedId);
    
    // Crear algunos comentarios de ejemplo para generar discusión
    const exampleComments = [
      {
        userId: userId.toString(),
        username: username,
        content: 'El nerf al Venator era necesario, estaba demasiado OP en PvP. Ahora hay más variedad en las armas que se usan.',
        createdAt: new Date(),
        likes: 0,
        likedBy: []
      },
      {
        userId: userId.toString(),
        username: username,
        content: '15k por el Deadline es caro pero tiene sentido, es una de las mejores granadas del juego. El cambio en el crafting lo hace más end-game.',
        createdAt: new Date(Date.now() + 60000),
        likes: 0,
        likedBy: []
      },
      {
        userId: userId.toString(),
        username: username,
        content: 'Las mejoras en el Shredder se sienten genial! Ya no hace esos movimientos raros cuando lo lureabas.',
        createdAt: new Date(Date.now() + 120000),
        likes: 0,
        likedBy: []
      }
    ];
    
    await db.collection('posts').updateOne(
      { _id: result.insertedId },
      { $set: { comments: exampleComments } }
    );
    
    console.log('✅ Comentarios de ejemplo agregados');
    console.log('\n📊 Post creado exitosamente!');
    console.log('👉 Los usuarios podrán ver y comentar sobre la actualización en Community Hub');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

addPatchDiscussion();
