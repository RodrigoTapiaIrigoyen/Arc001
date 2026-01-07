import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function addNewsSummaryPost() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const posts = db.collection('community_posts');
    const users = db.collection('users');
    const adminUser = await users.findOne({ role: { $in: ['admin', 'moderator'] } }) || await users.findOne({});
    if (!adminUser) throw new Error('No admin user found');

    // Evitar duplicados
    const exists = await posts.findOne({ title: /Novedades de diciembre/i });
    if (exists) {
      console.log('Ya existe el post de novedades de diciembre');
      return;
    }

    const post = {
      title: '📰 Novedades de diciembre: ¡Encuesta de mapas y tienda oficial!',
      content: `¡ARC Raiders sigue trayendo sorpresas!\n\n- Participa en la [encuesta oficial de mapas](https://arcraiders.com/news/complete-the-arc-raiders-map-survey) y ayuda a mejorar el juego.\n- Ya está disponible la [tienda oficial de merch](https://arcraiders.com/news/browse-the-arc-raiders-store) con productos exclusivos.\n\n¿Ya votaste en la encuesta? ¿Te gustaría ver algún producto en la tienda? ¡Comenta tus ideas!`,
      category: 'news',
      tags: ['novedades', 'encuesta', 'merch', 'diciembre'],
      author_name: adminUser.username,
      author_id: adminUser._id,
      author_avatar: adminUser.avatar || '',
      upvotes: 0,
      downvotes: 0,
      comment_count: 0,
      views: 0,
      pinned: false,
      locked: false,
      created_at: new Date('2025-12-10T10:00:00Z'),
      updated_at: new Date('2025-12-10T10:00:00Z')
    };
    const result = await posts.insertOne(post);
    console.log('Post creado:', result.insertedId);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

addNewsSummaryPost();
