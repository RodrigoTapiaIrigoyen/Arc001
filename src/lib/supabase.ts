import { MongoClient } from 'mongodb';

const uri = import.meta.env.VITE_MONGODB_URI || 'mongodb://localhost:27017';
const dbName = import.meta.env.VITE_MONGODB_DB || 'arc_raiders';

let client: MongoClient | null = null;

export const connectDB = async () => {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
};

export const getDB = () => {
  if (!client) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return client.db(dbName);
};
