import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

console.log('🔍 Probando conexión a MongoDB Atlas...');
console.log('URI:', uri.replace(/:[^:@]+@/, ':****@')); // Oculta password

const client = new MongoClient(uri);

try {
  await client.connect();
  console.log('✅ Conexión exitosa!');
  
  const db = client.db(process.env.DB_NAME);
  const collections = await db.listCollections().toArray();
  console.log('📦 Colecciones disponibles:', collections.map(c => c.name));
  
  await client.close();
  process.exit(0);
} catch (error) {
  console.error('❌ Error de conexión:', error.message);
  console.log('\n💡 Verifica:');
  console.log('1. Network Access: 189.172.221.0 o 0.0.0.0/0 autorizada');
  console.log('2. Database Access: Usuario "staioirish_db_user" activo');
  console.log('3. Contraseña correcta: GJeoJLED3lceUzil');
  process.exit(1);
}
