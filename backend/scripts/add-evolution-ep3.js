// Script para agregar contenido del Episodio 3: Building ARC Machines
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function addEvolutionEpisode3() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('arc_raiders');
    
    // Buscar un usuario admin para crear el post
    const adminUser = await db.collection('users').findOne({ role: 'admin' });
    const userId = adminUser ? adminUser._id : (await db.collection('users').findOne())._id;
    const username = adminUser ? adminUser.username : (await db.collection('users').findOne()).username;
    
    if (!userId) {
      console.log('❌ No hay usuarios en la base de datos');
      return;
    }
    
    // Crear post sobre Evolution of ARC Raiders EP3
    const evolutionPost = {
      userId: userId.toString(),
      username: username,
      title: '🎬 The Evolution of ARC Raiders EP3: Building ARC Machines',
      content: `**¡Nuevo episodio del documental oficial de Arc Raiders!**

Embark Studios acaba de anunciar el **Episodio 3** de su serie documental "The Evolution of ARC Raiders", que se estrena **MAÑANA** (5 de diciembre).

## 🤖 ¿De qué trata este episodio?

Este episodio explora cómo se crearon las temibles **máquinas ARC** que todos conocemos (y odiamos 😅):

### 🔧 **Nueva Tecnología**
El equipo de desarrollo muestra cómo usaron tecnología pionera para entrenar a los primeros robots ARC. Desde bloques básicos en el engine hasta las máquinas letales que vemos hoy.

### 🎨 **Diseño de Enemigos**
- ¿Cómo se diseñaron los enemigos más icónicos?
- ¿Qué propósito tiene cada tipo de ARC?
- Del concepto a la implementación final

### 🧠 **Inteligencia Artificial**
Lo más interesante: cómo los devs usaron **machine learning** para simular:
- Inteligencia real en combate
- Pensamiento táctico
- Comportamiento adaptativo

## 📺 ¿Dónde ver?

El episodio completo estará disponible en:
- [Sitio oficial de Arc Raiders](https://arcraiders.com/es/news/evolution-of-arc-raiders-episode-3)
- Canal de YouTube de Embark Studios

---

**Episodios anteriores:**
- EP1: Early Development
- EP2: The Life of a Raider

**¿Qué opinan?**
- ¿Han visto los episodios anteriores?
- ¿Qué enemigo ARC les gustaría conocer más a fondo?
- ¿Qué les parece el uso de IA para entrenar a los enemigos?

¡Compartan sus pensamientos y teorías sobre el desarrollo del juego! 🎮

*Estreno: 5 de diciembre de 2025*`,
      category: 'updates',
      likes: 0,
      likedBy: [],
      comments: [],
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: true // Hacerlo destacado
    };
    
    const result = await db.collection('posts').insertOne(evolutionPost);
    console.log('✅ Post del Episodio 3 creado:', result.insertedId);
    
    // Crear comentarios iniciales para generar discusión
    const exampleComments = [
      {
        userId: userId.toString(),
        username: username,
        content: 'El uso de machine learning para los enemigos ARC es fascinante! Explica por qué se sienten tan inteligentes y adaptativos en combate.',
        createdAt: new Date(),
        likes: 0,
        likedBy: []
      },
      {
        userId: userId.toString(),
        username: username,
        content: 'Me encantaría ver más sobre el Shredder y el Bastion. Son los enemigos más desafiantes y sus patrones de ataque son increíbles.',
        createdAt: new Date(Date.now() + 60000),
        likes: 0,
        likedBy: []
      },
      {
        userId: userId.toString(),
        username: username,
        content: 'Los episodios anteriores estaban increíbles. Ver el behind-the-scenes te hace apreciar más el trabajo que hay detrás del juego.',
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
    console.log('👉 Visible en Community Hub con categoría "Updates"');
    console.log('📌 Marcado como pinned para máxima visibilidad');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

addEvolutionEpisode3();
