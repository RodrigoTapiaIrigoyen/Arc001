import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde el directorio backend
dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI no está definida en las variables de entorno');
  process.exit(1);
}

async function addExpeditionProjectPost() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db();
    const postsCollection = db.collection('community_posts');
    const usersCollection = db.collection('users');
    
    // Buscar un usuario admin o el primer usuario disponible
    const adminUser = await usersCollection.findOne({ 
      role: { $in: ['admin', 'moderator'] } 
    }) || await usersCollection.findOne({});
    
    if (!adminUser) {
      console.error('❌ No se encontró ningún usuario en la base de datos');
      return;
    }
    
    console.log(`📝 Usando usuario: ${adminUser.username}`);
    
    // Verificar si ya existe un post sobre Expedition Project
    const existingPost = await postsCollection.findOne({
      title: { $regex: /Expedition Project/i }
    });
    
    if (existingPost) {
      console.log('⚠️  Ya existe un post sobre Expedition Project');
      console.log(`   Post ID: ${existingPost._id}`);
      return;
    }
    
    // Crear el nuevo post
    const newPost = {
      userId: adminUser._id,
      username: adminUser.username,
      avatar: adminUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminUser.username}`,
      title: '🚀 ¡The Expedition Project! Sistema de Reinicio Opcional (17-22 Dic)',
      content: `## ¿Por qué te convertiste en Raider?

Tal vez Speranza siempre ha sido demasiado pequeña para ti. Quizás sea la emoción del peligro, el aire fresco en tu piel, o la promesa de riqueza que solo está disponible en la Superficie.

Sea cual sea tu razón, todos los Raiders comparten una cosa en común: **el espíritu de aventura**.

## 🎯 The Expedition Project

La Expedición tuvo un pequeño retraso, y la ventana ahora se abrirá el **17 de diciembre**. Tendrás un período de **seis días** en el que tu Raider puede elegir abandonar The Rust Belt para siempre.

Al partir en la Caravana que has construido en el Expedition Project, **reiniciarás tu viaje con ciertos buffs y ventajas**.

### 📅 Fechas Importantes
- **Ventana de inscripción:** 17-22 de diciembre
- **Partida automática:** 22 de diciembre (todos al mismo tiempo)
- **Próxima ventana:** En un par de meses

## 🎁 Recompensas por Partir

### Desbloqueos Permanentes:
- ✨ Outfit **Patchwork Raider**
- 🧢 **Scrappy Janitor Cap**
- 🏅 Ícono de indicador **Expeditions**
- 🎯 **Puntos de habilidad** (basados en el valor del Stash)
- 📦 **+12 espacios de Stash**

*Nota: 1 millón de Coins de valor = 1 punto de habilidad extra*

### Buffs Temporales:
- 🔧 **+10% buff de reparación**
- ⭐ **+5% boost de XP**
- 🛠️ **+6% más materiales de Scrappy**

Los buffs temporales **expiran** si no partes en la siguiente expedición, pero **aumentan de poder** en tus próximas 3 expediciones.

## 🔄 ¿Qué se Reinicia?

Cuando partes, **se reinicia:**
- Árbol de habilidades
- Nivel del personaje
- Stash e inventario
- Workshop y mejoras
- Habilidades de crafteo
- Blueprints

**NO se reinicia:**
- El onboarding inicial (mapas disponibles desde el inicio)
- Mejoras de workshop disponibles inmediatamente
- Progreso hacia la construcción de Caravana (si no partes)

## 💭 ¿Por Qué Este Sistema?

Los wipes de progresión son notoriamente difíciles de balancear en juegos multijugador online. Los **wipes globales obligatorios** tienen beneficios obvios: los jugadores altamente invertidos pueden re-experimentar el grind inicial una vez más y, por un tiempo, el campo de juego se nivela.

El **Expedition Project opcional** es nuestra solución a algunos de los problemas que inevitablemente surgen con wipes obligatorios - específicamente, **respetando tu inversión de tiempo** en el juego.

### Tu Elección:
- 🏗️ **¿No has completado tanto como te gustaría?** Sigue raideando, construyendo y creciendo
- 🚀 **¿Listo para un nuevo desafío?** Parte en la Expedición y recibe buffs, recompensas y derechos de presumir

**La historia es tuya para escribir** - ¡no podemos esperar a ver qué decides!

---

*Fuente: [Anuncio oficial](https://arcraiders.com/es/news/the-expedition-project-is-departing-soon) - 6 de diciembre de 2025*`,
      category: 'announcement',
      isPinned: true,
      votes: 0,
      commentsCount: 0,
      shares: 0,
      media: [],
      createdAt: new Date('2024-12-06T10:00:00Z'),
      updatedAt: new Date('2024-12-06T10:00:00Z')
    };
    
    const result = await postsCollection.insertOne(newPost);
    console.log(`✅ Post creado exitosamente con ID: ${result.insertedId}`);
    
    // Agregar comentarios de ejemplo
    const comments = [
      {
        postId: result.insertedId,
        userId: adminUser._id,
        username: adminUser.username,
        avatar: adminUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminUser.username}`,
        content: '¡Me encanta que sea opcional! Llevo semanas construyendo mi stash y no quería perder todo el progreso. Terminaré de farmear y partiré en la próxima expedición 💪',
        votes: 8,
        createdAt: new Date('2024-12-06T10:30:00Z')
      },
      {
        postId: result.insertedId,
        userId: adminUser._id,
        username: 'VeteranRaider',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=VeteranRaider',
        content: 'Los +12 espacios de stash permanentes son un game changer. Y los buffs temporales que aumentan de poder en las siguientes 3 expediciones... esto recompensa a los jugadores dedicados 🎯',
        votes: 12,
        createdAt: new Date('2024-12-06T11:15:00Z')
      },
      {
        postId: result.insertedId,
        userId: adminUser._id,
        username: 'NewbieLooter',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NewbieLooter',
        content: '¿Alguien sabe cuánto vale aproximadamente 1M de coins en items? Quiero calcular cuántos skill points puedo conseguir antes del 22 de diciembre 🤔',
        votes: 5,
        createdAt: new Date('2024-12-06T14:20:00Z')
      }
    ];
    
    const commentsCollection = db.collection('comments');
    await commentsCollection.insertMany(comments);
    console.log(`✅ ${comments.length} comentarios agregados`);
    
    // Actualizar el contador de comentarios en el post
    await postsCollection.updateOne(
      { _id: result.insertedId },
      { $set: { commentsCount: comments.length } }
    );
    console.log('✅ Contador de comentarios actualizado');
    
    console.log('\n🎉 ¡Post del Expedition Project agregado exitosamente!');
    console.log('📌 El post está marcado como pinned y aparecerá en la parte superior');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar el script
addExpeditionProjectPost();
