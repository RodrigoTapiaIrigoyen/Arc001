import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function deleteExpeditionProjectPost() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const postsCollection = db.collection('community_posts');
    const result = await postsCollection.deleteMany({ title: { $regex: /Expedition Project/i } });
    console.log(`Eliminados: ${result.deletedCount}`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

deleteExpeditionProjectPost();
