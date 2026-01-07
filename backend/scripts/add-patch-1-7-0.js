import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function addPatch170Post() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const posts = db.collection('community_posts');
    const users = db.collection('users');
    const adminUser = await users.findOne({ role: { $in: ['admin', 'moderator'] } }) || await users.findOne({});
    if (!adminUser) throw new Error('No admin user found');

    // Evitar duplicados
    const exists = await posts.findOne({ title: /1.7.0/i });
    if (exists) {
      console.log('Ya existe el post del parche 1.7.0');
      return;
    }

    const post = {
      title: '🧊 Patch Notes 1.7.0: ¡Actualización de Invierno!',
      content: `¡Ya está aquí la actualización 1.7.0!\n\n**Novedades principales:**\n\n- Evento de invierno: "Winter hits the Rust Belt"\n- Nuevos cosméticos y skins temáticos de nieve\n- Cambios de balance en armas y enemigos\n- Mejoras de rendimiento y corrección de bugs\n- Nuevas misiones y desafíos diarios\n\nConsulta las notas completas en la [web oficial](https://arcraiders.com/news/cold-snap-patch-notes).\n\n¿Ya probaste el evento? ¡Cuéntanos tu experiencia en los comentarios!`,
      category: 'news',
      tags: ['patch', 'update', 'invierno', 'evento', '1.7.0'],
      author_name: adminUser.username,
      author_id: adminUser._id,
      author_avatar: adminUser.avatar || '',
      upvotes: 0,
      downvotes: 0,
      comment_count: 0,
      views: 0,
      pinned: true,
      locked: false,
      created_at: new Date('2025-12-16T10:00:00Z'),
      updated_at: new Date('2025-12-16T10:00:00Z')
    };
    const result = await posts.insertOne(post);
    console.log('Post creado:', result.insertedId);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

addPatch170Post();
