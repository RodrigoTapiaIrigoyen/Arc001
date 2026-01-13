import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsers() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('arc_raiders');
    const usersCollection = db.collection('users');
    
    const totalUsers = await usersCollection.countDocuments();
    const usersList = await usersCollection.find({}, { projection: { username: 1, email: 1, role: 1, createdAt: 1 } }).toArray();
    
    console.log('📊 ESTADO DE USUARIOS\n');
    console.log(`Total de usuarios: ${totalUsers}\n`);
    console.log('Usuarios registrados:');
    usersList.forEach((u, i) => {
      console.log(`  ${i+1}. ${u.username} (${u.email}) - Role: ${u.role || 'user'}`);
    });
    
    // Estadísticas por rol
    const adminCount = await usersCollection.countDocuments({ role: 'admin' });
    const modCount = await usersCollection.countDocuments({ role: 'moderator' });
    const regularCount = await usersCollection.countDocuments({ role: { $ne: 'admin', $ne: 'moderator' } });
    
    console.log(`\n📈 Distribución por rol:`);
    console.log(`  Admins: ${adminCount}`);
    console.log(`  Moderadores: ${modCount}`);
    console.log(`  Usuarios regulares: ${regularCount}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkUsers();
