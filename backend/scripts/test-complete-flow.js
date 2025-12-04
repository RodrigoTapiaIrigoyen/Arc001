// Script de testing completo para Arc Raiders App
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'https://arc-raiders-backend-production.up.railway.app/api';
const testUser1 = {
  username: `test_user_${Date.now()}`,
  email: `test${Date.now()}@example.com`,
  password: 'Test123456',
  fullName: 'Test User 1'
};

const testUser2 = {
  username: `test_user2_${Date.now()}`,
  email: `test2${Date.now()}@example.com`,
  password: 'Test123456',
  fullName: 'Test User 2'
};

let user1Token, user2Token, user1Id, user2Id;
let friendshipId, conversationId, postId, listingId, tradeId;

console.log('🧪 Iniciando testing completo de Arc Raiders App\n');
console.log(`📡 API URL: ${API_URL}\n`);

// Helper para hacer requests
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`${response.status}: ${data.error || 'Error desconocido'}`);
  }
  
  return data;
}

// 1. TEST: REGISTRO
async function testRegistration() {
  console.log('📝 1. Testing Registro...');
  
  try {
    const result1 = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser1)
    });
    
    user1Token = result1.token;
    user1Id = result1.user.userId;
    console.log(`   ✅ Usuario 1 registrado: ${testUser1.username} (ID: ${user1Id})`);
    
    const result2 = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser2)
    });
    
    user2Token = result2.token;
    user2Id = result2.user.userId;
    console.log(`   ✅ Usuario 2 registrado: ${testUser2.username} (ID: ${user2Id})\n`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Error en registro: ${error.message}\n`);
    return false;
  }
}

// 2. TEST: LOGIN
async function testLogin() {
  console.log('🔐 2. Testing Login...');
  
  try {
    const result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: testUser1.username,
        password: testUser1.password
      })
    });
    
    console.log(`   ✅ Login exitoso: Token recibido\n`);
    return true;
  } catch (error) {
    console.log(`   ❌ Error en login: ${error.message}\n`);
    return false;
  }
}

// 3. TEST: AGREGAR AMIGO
async function testFriendRequest() {
  console.log('👥 3. Testing Sistema de Amigos...');
  
  try {
    // Usuario 1 envía solicitud a Usuario 2
    await request(`/friends/request/${user2Id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });
    console.log(`   ✅ Solicitud de amistad enviada`);
    
    // Usuario 2 obtiene solicitudes pendientes
    const requests = await request('/friends/requests/pending', {
      headers: { 'Authorization': `Bearer ${user2Token}` }
    });
    
    if (requests.requests && requests.requests.length > 0) {
      friendshipId = requests.requests[0]._id;
      console.log(`   ✅ Solicitud recibida (ID: ${friendshipId})`);
      
      // Usuario 2 acepta la solicitud
      await request(`/friends/respond/${friendshipId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user2Token}` },
        body: JSON.stringify({ action: 'accept' })
      });
      console.log(`   ✅ Solicitud aceptada - Ahora son amigos\n`);
      
      return true;
    } else {
      console.log(`   ❌ No se recibió la solicitud\n`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error en sistema de amigos: ${error.message}\n`);
    return false;
  }
}

// 4. TEST: MENSAJERÍA
async function testMessaging() {
  console.log('💬 4. Testing Mensajería...');
  
  try {
    // Usuario 1 envía mensaje a Usuario 2
    const result = await request('/messages/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${user1Token}` },
      body: JSON.stringify({
        receiverId: user2Id,
        content: '¡Hola! Este es un mensaje de prueba 🎮'
      })
    });
    
    console.log(`   ✅ Mensaje enviado`);
    
    // Usuario 2 lee sus conversaciones
    const conversations = await request('/messages/conversations', {
      headers: { 'Authorization': `Bearer ${user2Token}` }
    });
    
    if (conversations.conversations && conversations.conversations.length > 0) {
      conversationId = conversations.conversations[0].conversationId;
      console.log(`   ✅ Conversación creada (ID: ${conversationId})`);
      
      // Usuario 2 lee los mensajes
      const messages = await request(`/messages/conversation/${conversationId}`, {
        headers: { 'Authorization': `Bearer ${user2Token}` }
      });
      
      if (messages.messages && messages.messages.length > 0) {
        console.log(`   ✅ ${messages.messages.length} mensaje(s) recibido(s)`);
        console.log(`   📨 Contenido: "${messages.messages[0].content}"\n`);
        return true;
      }
    }
    
    console.log(`   ❌ No se encontraron mensajes\n`);
    return false;
  } catch (error) {
    console.log(`   ❌ Error en mensajería: ${error.message}\n`);
    return false;
  }
}

// 5. TEST: COMMUNITY HUB
async function testCommunityHub() {
  console.log('📢 5. Testing Community Hub...');
  
  try {
    // Crear post
    const post = await request('/community/posts', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${user1Token}` },
      body: JSON.stringify({
        title: 'Post de prueba automática',
        content: 'Este es un post creado por el sistema de testing automático',
        category: 'general'
      })
    });
    
    postId = post.post._id;
    console.log(`   ✅ Post creado (ID: ${postId})`);
    
    // Agregar comentario
    await request(`/community/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${user2Token}` },
      body: JSON.stringify({
        content: 'Comentario de prueba'
      })
    });
    console.log(`   ✅ Comentario agregado`);
    
    // Dar like
    await request(`/community/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${user2Token}` }
    });
    console.log(`   ✅ Like dado al post\n`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Error en Community Hub: ${error.message}\n`);
    return false;
  }
}

// 6. TEST: MARKETPLACE
async function testMarketplace() {
  console.log('🏪 6. Testing Marketplace...');
  
  try {
    // Crear listing
    const listing = await request('/marketplace/listings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${user1Token}` },
      body: JSON.stringify({
        itemName: 'Venator Pistol',
        itemType: 'weapon',
        rarity: 'legendary',
        description: 'Venator con upgrades completos - Post testing',
        itemsWanted: ['ARC Circuitry', 'Explosive Compound'],
        itemsOffered: ['Venator Blueprint', 'Power Cell x5']
      })
    });
    
    listingId = listing.listing._id;
    console.log(`   ✅ Listing creado (ID: ${listingId})`);
    
    // Buscar listings
    const listings = await request('/marketplace', {
      headers: { 'Authorization': `Bearer ${user2Token}` }
    });
    
    console.log(`   ✅ ${listings.length} listing(s) en marketplace\n`);
    return true;
  } catch (error) {
    console.log(`   ❌ Error en Marketplace: ${error.message}\n`);
    return false;
  }
}

// 7. TEST: TRADING
async function testTrading() {
  console.log('💱 7. Testing Sistema de Trading...');
  
  try {
    // Usuario 2 hace oferta en el listing de Usuario 1
    const offer = await request(`/marketplace/listings/${listingId}/offers`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${user2Token}` },
      body: JSON.stringify({
        offeredItems: ['ARC Circuitry x3', 'Metal Parts x10'],
        message: 'Oferta de prueba automática'
      })
    });
    
    console.log(`   ✅ Oferta creada`);
    
    // Usuario 1 ve sus ofertas
    const offers = await request(`/marketplace/listings/${listingId}/offers`, {
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });
    
    if (offers.offers && offers.offers.length > 0) {
      const offerId = offers.offers[0]._id;
      console.log(`   ✅ Oferta recibida (ID: ${offerId})`);
      
      // Usuario 1 acepta la oferta
      await request(`/marketplace/listings/${listingId}/offers/${offerId}/respond`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user1Token}` },
        body: JSON.stringify({ action: 'accept' })
      });
      console.log(`   ✅ Oferta aceptada - Trade completado\n`);
      
      return true;
    }
    
    console.log(`   ❌ No se encontraron ofertas\n`);
    return false;
  } catch (error) {
    console.log(`   ❌ Error en Trading: ${error.message}\n`);
    return false;
  }
}

// 8. TEST: NOTIFICACIONES
async function testNotifications() {
  console.log('🔔 8. Testing Notificaciones...');
  
  try {
    const notifications = await request('/notifications', {
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });
    
    if (notifications.notifications && notifications.notifications.length > 0) {
      console.log(`   ✅ ${notifications.notifications.length} notificación(es) recibida(s)`);
      console.log(`   📬 Última: "${notifications.notifications[0].message}"\n`);
    } else {
      console.log(`   ℹ️  Sin notificaciones pendientes\n`);
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ Error en Notificaciones: ${error.message}\n`);
    return false;
  }
}

// EJECUTAR TODOS LOS TESTS
async function runAllTests() {
  const results = {
    registration: false,
    login: false,
    friends: false,
    messaging: false,
    community: false,
    marketplace: false,
    trading: false,
    notifications: false
  };
  
  try {
    results.registration = await testRegistration();
    results.login = await testLogin();
    results.friends = await testFriendRequest();
    results.messaging = await testMessaging();
    results.community = await testCommunityHub();
    results.marketplace = await testMarketplace();
    results.trading = await testTrading();
    results.notifications = await testNotifications();
    
  } catch (error) {
    console.log(`\n❌ Error general: ${error.message}`);
  }
  
  // RESUMEN
  console.log('═══════════════════════════════════════════');
  console.log('📊 RESUMEN DE TESTING');
  console.log('═══════════════════════════════════════════\n');
  
  const tests = [
    { name: '1. Registro', result: results.registration },
    { name: '2. Login', result: results.login },
    { name: '3. Sistema de Amigos', result: results.friends },
    { name: '4. Mensajería', result: results.messaging },
    { name: '5. Community Hub', result: results.community },
    { name: '6. Marketplace', result: results.marketplace },
    { name: '7. Trading', result: results.trading },
    { name: '8. Notificaciones', result: results.notifications }
  ];
  
  let passed = 0;
  let failed = 0;
  
  tests.forEach(test => {
    const status = test.result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}  ${test.name}`);
    test.result ? passed++ : failed++;
  });
  
  console.log('\n═══════════════════════════════════════════');
  console.log(`✅ Tests exitosos: ${passed}/${tests.length}`);
  console.log(`❌ Tests fallidos: ${failed}/${tests.length}`);
  console.log(`📈 Tasa de éxito: ${((passed/tests.length)*100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════\n');
  
  if (failed === 0) {
    console.log('🎉 ¡TODOS LOS TESTS PASARON! La app está lista para producción.\n');
  } else {
    console.log('⚠️  Algunos tests fallaron. Revisa los errores arriba.\n');
  }
}

// EJECUTAR
runAllTests().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
