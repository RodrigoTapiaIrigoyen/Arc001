import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const POSTS = [
  {
    title: /1.7.0/i,
    extra: '\n\n💬 ¿Qué arma te parece más OP tras el parche? ¿Ya probaste alguna build nueva? ¡Comenta tu experiencia y comparte tu mejor jugada!'
  },
  {
    title: /Winter hits the Rust Belt/i,
    extra: '\n\n⛄ ¿Ya conseguiste algún cosmético de invierno? ¿Con quién armaste grupo para los desafíos? ¡Deja tu ID y encuentra compañeros aquí!'
  },
  {
    title: /Novedades de diciembre/i,
    extra: '\n\n🗳️ ¿Participaste en la encuesta? ¿Qué producto te gustaría ver en la tienda? ¡Comenta tus ideas y vota las mejores!'
  }
];

async function updatePosts() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const posts = db.collection('community_posts');
    for (const { title, extra } of POSTS) {
      const post = await posts.findOne({ title });
      if (post && !post.content.includes(extra.trim())) {
        await posts.updateOne(
          { _id: post._id },
          { $set: { content: post.content + extra } }
        );
        console.log('Post actualizado:', post.title);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

updatePosts();
