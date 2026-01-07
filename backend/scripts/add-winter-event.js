import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function addWinterEventPost() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const posts = db.collection('community_posts');
    const users = db.collection('users');
    const adminUser = await users.findOne({ role: { $in: ['admin', 'moderator'] } }) || await users.findOne({});
    if (!adminUser) throw new Error('No admin user found');

    // Evitar duplicados
    const exists = await posts.findOne({ title: /Winter hits the Rust Belt/i });
    if (exists) {
      console.log('Ya existe el post del evento de invierno');
      return;
    }

    const post = {
      title: '❄️ Winter hits the Rust Belt: ¡Evento especial de invierno!',
      content: `¡El invierno ha llegado a ARC Raiders!\n\n- Nuevos efectos de clima y ambientación nevada\n- Misiones y recompensas exclusivas por tiempo limitado\n- Skins y cosméticos de edición especial\n- ¡Participa en los desafíos diarios y gana premios!\n\nMás detalles en la [noticia oficial](https://arcraiders.com/news/whats-coming-in-the-december-update).\n\n¿Ya desbloqueaste algún cosmético de invierno? ¡Comparte tu captura!`,
      category: 'news',
      tags: ['evento', 'invierno', 'skins', 'desafíos', 'nieve'],
      author_name: adminUser.username,
      author_id: adminUser._id,
      author_avatar: adminUser.avatar || '',
      upvotes: 0,
      downvotes: 0,
      comment_count: 0,
      views: 0,
      pinned: true,
      locked: false,
      created_at: new Date('2025-12-15T10:00:00Z'),
      updated_at: new Date('2025-12-15T10:00:00Z')
    };
    const result = await posts.insertOne(post);
    console.log('Post creado:', result.insertedId);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

addWinterEventPost();
