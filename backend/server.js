import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cron from 'node-cron';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import SyncService from './services/sync.js';
import SeedService from './services/seed.js';
import EnemiesService from './services/enemies.js';
import CommunityService from './services/community.js';
import MarketplaceService from './services/marketplace.js';
import TrackerService from './services/trackers.js';
import MarkerService from './services/markers.js';
import NotificationService from './services/notifications.js';
import MessageService from './services/messages.js';
import ProfileService from './services/profiles.js';
import WishlistService from './services/wishlist.js';
import AdminService from './services/admin.js';
import SocketService from './services/socketService.js';
import FriendsService from './services/friendsService.js';
import arcforge from './services/arcforge.js';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler, validateEnv } from './middleware/errorHandler.js';
import { 
  authenticateToken, 
  optionalAuth, 
  requireRole, 
  loginLimiter, 
  registerLimiter, 
  apiLimiter,
  postLimiter,
  tradeLimiter 
} from './middleware/auth.js';
import GroupsService from './services/groups.js';
import createGroupsRouter from './routes/groups.js';
import createFriendsRouter from './routes/friends.js';
import createRaiderProfileRouter from './routes/raiderProfiles.js';
import RaiderProfileService from './services/raiderProfile.js';
import createClansRouter from './routes/clans.js';

dotenv.config();

// Validar variables de entorno al inicio
try {
  validateEnv();
} catch (error) {
  console.error('❌ Error en configuración:', error.message);
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar multer para subir avatares
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads', 'avatars');
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generar nombre único: userId-timestamp.ext
    const uniqueName = `${req.user.userId}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Solo permitir imágenes
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WEBP)'));
    }
  }
});

const app = express();

// IMPORTANTE: Configurar trust proxy para Railway/Vercel
app.set('trust proxy', 1); // Confiar en el primer proxy (Railway)

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'arc-raiders-secret-key-change-in-production';

// Importar helmet y compression
import helmet from 'helmet';
import compression from 'compression';

// Middleware
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'];

// Agregar dominios de producción
const productionOrigins = [
  'https://arc001.vercel.app',
  'https://arc-raiders.vercel.app',
  'https://www.arc001.vercel.app'
];

// Combinar orígenes permitidos
const allAllowedOrigins = [...allowedOrigins, ...productionOrigins];

console.log('✅ CORS configurado para orígenes:', allAllowedOrigins);

// Middleware de seguridad (helmet)
app.use(helmet({
  contentSecurityPolicy: false, // Desactivar CSP para desarrollo, configurar en producción
  crossOriginEmbedderPolicy: false
}));

// Comprimir respuestas
app.use(compression());

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);
    
    // Verificar si está en la lista de orígenes permitidos
    if (allAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Permitir cualquier URL de Vercel (para previews y subdominio genérico)
    if (origin && (origin.includes('.vercel.app') || origin.includes('vercel.app'))) {
      console.log('✅ CORS permitido para Vercel origin:', origin);
      return callback(null, true);
    }
    
    // Permitir localhost en desarrollo (incluyendo 127.0.0.1)
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      console.log('✅ CORS permitido para localhost origin:', origin);
      return callback(null, true);
    }
    
    console.warn('⚠️ CORS rechazado para origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Servir archivos estáticos (avatares)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
let db;
let syncService;
let seedService;
let enemiesService;
let communityService;
let marketplaceService;
let trackerService;
let markerService;
let notificationService;
let messageService;
let profileService;
let wishlistService;
let adminService;
let friendsService;
let groupsService;
let socketService;
let useMockData = false;
const client = new MongoClient(process.env.MONGODB_URI);

// Mock data mientras resolvemos la conexión
const mockDB = {
  weapons: [
    { id: 1, name: 'Plasma Rifle', type: 'Rifle', damage: 85, dps: 425, fire_rate: 5, magazine_size: 30, rarity: 'Legendary' },
    { id: 2, name: 'Steel Shotgun', type: 'Shotgun', damage: 120, dps: 360, fire_rate: 3, magazine_size: 8, rarity: 'Rare' },
  ],
  rarities: [],
  marketplace_listings: []
};

async function connectDB() {
  try {
    await client.connect();
    db = client.db(process.env.DB_NAME);
    syncService = new SyncService(db);
    seedService = new SeedService(db);
    enemiesService = new EnemiesService(db);
    communityService = new CommunityService(db);
    marketplaceService = new MarketplaceService(db);
    trackerService = new TrackerService(db);
    markerService = new MarkerService(db);
    notificationService = new NotificationService(db);
    messageService = new MessageService(db);
    profileService = new ProfileService(db);
    wishlistService = new WishlistService(db);
    adminService = new AdminService(db);
    friendsService = new FriendsService(db);
    groupsService = new GroupsService(db);
    
    // Crear índices
    await messageService.createIndexes();
    await profileService.createIndexes();
    await wishlistService.createIndexes();
    await adminService.createIndexes();
    
    console.log('✅ Connected to MongoDB Atlas');
    useMockData = false;
  } catch (error) {
    console.warn('⚠️ MongoDB connection failed, usando datos mock:', error.message);
    console.log('💡 Verifica: 1) Usuario activo, 2) IP autorizada, 3) Contraseña correcta');
    useMockData = true;
    // Retornar normalmente para que el .then() se ejecute incluso sin DB
    return;
  }
}

// Aplicar rate limiting global a todas las rutas API
app.use('/api/', apiLimiter);

// Routes

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', registerLimiter, async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Validación
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Validación estricta de email
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Por favor ingresa un email válido' });
    }

    // Verificar que el dominio no sea temporal/desechable
    const emailDomain = email.split('@')[1]?.toLowerCase();
    const disposableEmails = [
      'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'throwaway.email',
      'mailinator.com', 'trashmail.com', 'temp-mail.org', 'fakeinbox.com',
      'yopmail.com', 'maildrop.cc', 'getnada.com', 'mohmal.com'
    ];
    
    if (disposableEmails.includes(emailDomain)) {
      return res.status(400).json({ error: 'Por favor usa un email permanente válido' });
    }

    // Verificar que tenga al menos un punto en el dominio
    if (!emailDomain || !emailDomain.includes('.')) {
      return res.status(400).json({ error: 'El dominio del email no es válido' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await db.collection('users').findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.username === username 
          ? 'Username already exists' 
          : 'Email already exists'
      });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verificar si es el primer usuario (será admin)
    const userCount = await db.collection('users').countDocuments();
    const userRole = userCount === 0 ? 'admin' : 'user';

    // Crear usuario
    const newUser = {
      username,
      email,
      password: hashedPassword,
      fullName: fullName || username,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: userRole,
      isActive: true
    };

    const result = await db.collection('users').insertOne(newUser);

    // Crear token JWT
    const token = jwt.sign(
      { userId: result.insertedId, username, email, role: userRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Enviar token en cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        userId: result.insertedId.toString(),
        username,
        email,
        fullName: newUser.fullName,
        role: userRole
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Login
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Buscar usuario (por username o email)
    const user = await db.collection('users').findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Crear token JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Enviar token en cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login successful',
      user: {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { _id: req.user.userId },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Error fetching user data' });
  }
});

// Verify token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      userId: req.user.userId,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// ============ END AUTH ROUTES ============

// Weapons
app.get('/api/weapons', async (req, res) => {
  try {
    if (useMockData) {
      return res.json(mockDB.weapons);
    }
    const weapons = await db.collection('weapons').find().toArray();
    res.json(weapons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/weapons', async (req, res) => {
  try {
    const result = await db.collection('weapons').insertOne(req.body);
    res.json({ success: true, id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rarities
app.get('/api/rarities', async (req, res) => {
  try {
    if (useMockData) {
      return res.json(mockDB.rarities);
    }
    const rarities = await db.collection('rarities').find().toArray();
    res.json(rarities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marketplace Listings
app.get('/api/marketplace', async (req, res) => {
  try {
    if (useMockData) {
      return res.json(mockDB.marketplace_listings);
    }
    const listings = await db.collection('marketplace_listings').find().toArray();
    res.json(listings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stats endpoint for Dashboard
app.get('/api/stats', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const [weaponsCount, itemsCount, tradersCount, enemiesCount, usersCount, postsStats] = await Promise.all([
      db.collection('weapons').countDocuments(),
      db.collection('items').countDocuments(),
      db.collection('traders').countDocuments(),
      db.collection('enemies').countDocuments(),
      db.collection('users').countDocuments(),
      communityService.getStats()
    ]);

    // Obtener posts recientes para "Recent Updates"
    const recentPosts = await communityService.getRecentPosts(4);

    res.json({
      weapons: weaponsCount,
      items: itemsCount,
      traders: tradersCount,
      enemies: enemiesCount,
      users: usersCount,
      community: postsStats,
      recentUpdates: recentPosts
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Items (ArcForge)
app.get('/api/items', async (req, res) => {
  try {
    if (useMockData) {
      return res.json([]);
    }
    const items = await db.collection('items')
      .find({})
      .sort({ name: 1 })
      .toArray();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Maps - Aggregate items by location (using infobox_full.location)
app.get('/api/maps', async (req, res) => {
  try {
    if (useMockData) {
      return res.json([]);
    }
    
    const items = await db.collection('items')
      .find({ 'infobox_full.location': { $exists: true, $ne: null, $ne: '' } })
      .toArray();
    
    // Group items by location
    const locationMap = {};
    items.forEach(item => {
      const location = item.infobox_full?.location;
      if (!location) return;
      
      if (!locationMap[location]) {
        locationMap[location] = {
          name: location,
          items: [],
          keys: [],
          materials: [],
          equipment: [],
          totalItems: 0,
        };
      }
      
      locationMap[location].items.push(item);
      locationMap[location].totalItems++;
      
      // Categorize by type
      const itemType = item.infobox_full?.type?.toLowerCase() || '';
      if (itemType.includes('key') || item.arcforge_name?.toLowerCase().includes('key')) {
        locationMap[location].keys.push(item);
      } else if (itemType.includes('material') || itemType.includes('resource') || itemType.includes('component')) {
        locationMap[location].materials.push(item);
      } else {
        locationMap[location].equipment.push(item);
      }
    });
    
    // Convert to array and add metadata
    const locations = Object.values(locationMap).map(loc => {
      // Count rarities
      const rarities = {};
      loc.items.forEach(item => {
        const rarity = item.infobox_full?.rarity || 'Common';
        rarities[rarity] = (rarities[rarity] || 0) + 1;
      });
      
      return {
        ...loc,
        keysCount: loc.keys.length,
        rarityBreakdown: rarities,
      };
    });
    
    // Sort by total items descending
    locations.sort((a, b) => b.totalItems - a.totalItems);
    
    res.json(locations);
  } catch (error) {
    console.error('Error fetching maps:', error);
    res.status(500).json({ error: error.message });
  }
});

// Missions (legacy)
app.get('/api/missions', async (req, res) => {
  try {
    if (useMockData) {
      return res.json([]);
    }
    const missions = await db.collection('missions').find().toArray();
    res.json(missions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Projects
app.get('/api/projects', async (req, res) => {
  try {
    if (useMockData) {
      return res.json([]);
    }
    const projects = await db.collection('projects').find().toArray();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Traders
app.get('/api/traders', async (req, res) => {
  try {
    if (useMockData) {
      return res.json([]);
    }
    const traders = await db.collection('traders').find().toArray();
    res.json(traders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== SYNC ROUTES - MetaForge Integration =====

// Sincronizar Items completos desde ArcForge (485+ items)
app.post('/api/sync/items', async (req, res) => {
  try {
    if (useMockData) {
      return res.json({ error: 'MongoDB not connected' });
    }
    const result = await syncService.syncArcForgeItems();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sincronizar Weapons desde ARDB (legacy - mantener para armas específicas)
app.post('/api/sync/weapons', async (req, res) => {
  try {
    if (useMockData) {
      return res.json({ error: 'MongoDB not connected' });
    }
    const result = await syncService.syncItems();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sincronizar Quests desde MetaForge
app.post('/api/sync/quests', async (req, res) => {
  try {
    if (useMockData) {
      return res.json({ error: 'MongoDB not connected' });
    }
    const result = await syncService.syncQuests();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sincronizar Missions desde RaidTheory
app.post('/api/sync/missions', async (req, res) => {
  try {
    if (useMockData) {
      return res.json({ error: 'MongoDB not connected' });
    }
    const result = await syncService.syncMissions();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sincronizar Projects desde RaidTheory
app.post('/api/sync/projects', async (req, res) => {
  try {
    if (useMockData) {
      return res.json({ error: 'MongoDB not connected' });
    }
    const result = await syncService.syncProjects();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sincronizar Traders desde RaidTheory
app.post('/api/sync/traders', async (req, res) => {
  try {
    if (useMockData) {
      return res.json({ error: 'MongoDB not connected' });
    }
    const result = await syncService.syncTraders();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sincronizar TODO desde MetaForge
app.post('/api/sync/all', async (req, res) => {
  try {
    if (useMockData) {
      return res.json({ error: 'MongoDB not connected' });
    }
    const result = await syncService.syncAll();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener estadísticas de sincronización
app.get('/api/sync/stats', async (req, res) => {
  try {
    if (useMockData) {
      return res.json({ weapons: 0, quests: 0, last_sync: null });
    }
    const stats = await syncService.getSyncStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quests endpoints - Proxy to ARDB API
app.get('/api/quests', async (req, res) => {
  try {
    const response = await fetch('https://ardb.app/api/quests');
    const quests = await response.json();
    res.json(quests);
  } catch (error) {
    console.error('Error fetching quests from ARDB:', error);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
});

// ===== SEED ROUTES - Datos iniciales =====

// Seed weapons
app.post('/api/seed/weapons', async (req, res) => {
  try {
    if (useMockData) {
      return res.json({ error: 'MongoDB not connected' });
    }
    const result = await seedService.seedWeapons();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed quests
app.post('/api/seed/quests', async (req, res) => {
  try {
    if (useMockData) {
      return res.json({ error: 'MongoDB not connected' });
    }
    const result = await seedService.seedQuests();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed rarities
app.post('/api/seed/rarities', async (req, res) => {
  try {
    if (useMockData) {
      return res.json({ error: 'MongoDB not connected' });
    }
    const result = await seedService.seedRarities();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed ALL
app.post('/api/seed/all', async (req, res) => {
  try {
    if (useMockData) {
      return res.json({ error: 'MongoDB not connected' });
    }
    const result = await seedService.seedAll();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Variables para auto-sync
let autoSyncEnabled = true;
let lastSyncTime = null;
let syncInProgress = false;

// ============================================
// ENEMIES ENDPOINTS
// ============================================

// Obtener todos los enemigos
app.get('/api/enemies', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const enemies = await enemiesService.getAllEnemies();
    res.json(enemies);
  } catch (error) {
    console.error('Error fetching enemies:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener enemigo por ID
app.get('/api/enemies/:id', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const enemy = await enemiesService.getEnemyById(req.params.id);
    if (!enemy) {
      return res.status(404).json({ error: 'Enemy not found' });
    }
    res.json(enemy);
  } catch (error) {
    console.error('Error fetching enemy:', error);
    res.status(500).json({ error: error.message });
  }
});

// Seed inicial de enemigos
app.post('/api/enemies/seed', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const result = await enemiesService.seedEnemies();
    res.json(result);
  } catch (error) {
    console.error('Error seeding enemies:', error);
    res.status(500).json({ error: error.message });
  }
});

// Contribuir actualización de stats
app.post('/api/enemies/:id/contribute', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const { type, old_value, new_value, user_name, evidence, auto_approve } = req.body;
    
    const result = await enemiesService.contributeEnemyStats(req.params.id, {
      type,
      old_value,
      new_value,
      user_name,
      evidence,
      auto_approve: auto_approve || false,
    });
    
    res.json({ success: true, contribution_id: result.insertedId });
  } catch (error) {
    console.error('Error contributing enemy stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener contribuciones pendientes
app.get('/api/contributions/pending', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const contributions = await enemiesService.getPendingContributions();
    res.json(contributions);
  } catch (error) {
    console.error('Error fetching contributions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Votar contribución
app.post('/api/contributions/:id/vote', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const { vote } = req.body; // 'up' or 'down'
    await enemiesService.voteContribution(req.params.id, vote);
    
    // Generar notificación al autor de la contribución
    try {
      const contribution = await db.collection('contributions').findOne({ _id: new ObjectId(req.params.id) });
      if (contribution && contribution.author_id?.toString() !== req.user.userId) {
        await notificationService.notifyVote(
          contribution.author_id,
          req.user.userId,
          req.params.id,
          contribution.data?.name || 'una contribución',
          vote
        );
      }
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error voting contribution:', error);
    res.status(500).json({ error: error.message });
  }
});

// Aprobar contribución manualmente
app.post('/api/contributions/:id/approve', authenticateToken, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    await enemiesService.approveContribution(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error approving contribution:', error);
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas de enemigos
app.get('/api/enemies/stats/summary', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const stats = await enemiesService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching enemy stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// COMMUNITY ENDPOINTS
// ============================================

// Obtener todos los posts (con filtros)
app.get('/api/community/posts', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { page, limit, category, sort, search } = req.query;
    const result = await communityService.getAllPosts({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      category,
      sort,
      search,
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo post
app.post('/api/community/posts', authenticateToken, postLimiter, async (req, res) => {
  try {
    console.log('📝 CREATE POST - Usuario autenticado:', req.user);
    console.log('📝 CREATE POST - Body:', req.body);
    
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { title, content, category, tags } = req.body;
    
    if (!title || !content || !category) {
      console.log('❌ Faltan campos requeridos');
      return res.status(400).json({ error: 'Title, content, and category are required' });
    }
    
    // Obtener perfil del usuario para obtener avatar
    const userProfile = await profileService.getProfile(req.user.userId);
    
    console.log('✅ Creando post...');
    const post = await communityService.createPost({
      title,
      content,
      category,
      author_name: req.user.username,
      author_id: req.user.userId,
      author_avatar: userProfile.avatar || '',
      tags: tags || [],
    });
    
    console.log('✅ Post creado:', post._id);
    res.json(post);
  } catch (error) {
    console.error('❌ Error creating post:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener post por ID
app.get('/api/community/posts/:id', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const post = await communityService.getPostById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar post
app.delete('/api/community/posts/:id', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const post = await communityService.getPostById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Verificar que el usuario es el autor o admin
    if (post.author_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este post' });
    }
    
    await communityService.deletePost(req.params.id);
    res.json({ success: true, message: 'Post eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: error.message });
  }
});

// Votar post
app.post('/api/community/posts/:id/vote', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { vote } = req.body; // 'up' or 'down'
    const postId = req.params.id;
    
    // Obtener el post para saber quién es el autor
    const post = await communityService.getPostById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }
    
    await communityService.votePost(postId, vote);
    
    // Incrementar reputación del autor solo si es un voto positivo
    if (vote === 'up' && post.author_id && post.author_id !== 'anonymous') {
      try {
        // Usar RaiderProfileService para incrementar reputation
        const raiderProfileService = new RaiderProfileService(db);
        await raiderProfileService.incrementStat(post.author_id, 'community_reputation', 1);
      } catch (err) {
        console.log('Raider profile not found, skipping reputation update:', err.message);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error voting post:', error);
    res.status(500).json({ error: error.message });
  }
});

// Editar post
app.put('/api/community/posts/:id', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    await communityService.updatePost(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar post
app.delete('/api/community/posts/:id', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    await communityService.deletePost(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener comentarios de un post
app.get('/api/community/posts/:id/comments', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { sort } = req.query;
    const comments = await communityService.getCommentsByPostId(req.params.id, { sort });
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Agregar comentario
app.post('/api/community/posts/:id/comments', authenticateToken, postLimiter, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { content, author_name, parent_comment_id } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const comment = await communityService.addComment(req.params.id, {
      content,
      author_name,
      parent_comment_id,
    });
    
    // Generar notificación
    try {
      const post = await communityService.getPostById(req.params.id);
      
      if (parent_comment_id) {
        // Es una respuesta a un comentario
        const parentComment = post.comments?.find(c => c._id.toString() === parent_comment_id);
        if (parentComment && parentComment.author_id?.toString() !== req.user.userId) {
          await notificationService.notifyReply(
            parentComment.author_id,
            req.user.userId,
            req.params.id,
            post.title
          );
        }
      } else {
        // Es un comentario nuevo en el post
        if (post.user_id?.toString() !== req.user.userId) {
          await notificationService.notifyComment(
            post.user_id,
            req.user.userId,
            req.params.id,
            post.title
          );
        }
      }
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // No fallar si la notificación falla
    }
    
    res.json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Votar comentario
app.post('/api/community/comments/:id/vote', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { vote } = req.body;
    const commentId = req.params.id;
    
    // Obtener el comentario para saber quién es el autor
    const comment = await communityService.getCommentById(commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }
    
    await communityService.voteComment(commentId, vote);
    
    // Incrementar reputación del autor solo si es un voto positivo
    if (vote === 'up' && comment.author_id && comment.author_id !== 'anonymous') {
      try {
        const raiderProfileService = new RaiderProfileService(db);
        await raiderProfileService.incrementStat(comment.author_id, 'community_reputation', 1);
      } catch (err) {
        console.log('Raider profile not found, skipping reputation update:', err.message);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error voting comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener posts populares
app.get('/api/community/posts/featured/popular', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const posts = await communityService.getPopularPosts(10);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching popular posts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener posts recientes
app.get('/api/community/posts/featured/recent', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const posts = await communityService.getRecentPosts(10);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching recent posts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar posts
app.get('/api/community/search', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const posts = await communityService.searchPosts(q);
    res.json(posts);
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas de community
app.get('/api/community/stats', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const stats = await communityService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching community stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pin/Unpin post (admin)
app.post('/api/community/posts/:id/pin', authenticateToken, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const result = await communityService.togglePinPost(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error pinning post:', error);
    res.status(500).json({ error: error.message });
  }
});

// Lock/Unlock post (admin)
app.post('/api/community/posts/:id/lock', authenticateToken, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const result = await communityService.toggleLockPost(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error locking post:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MARKETPLACE ENDPOINTS - Trading System + Discussions
// =====================================================

// === SEARCH ===
// Buscar items del juego (weapons, items, traders, enemies)
app.get('/api/marketplace/search', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { q = '', type = '' } = req.query;
    const results = await marketplaceService.searchGameItems(q, type);
    res.json(results);
  } catch (error) {
    console.error('Error searching items:', error);
    res.status(500).json({ error: error.message });
  }
});

// === TRADE LISTINGS ===
// Obtener todos los trades con filtros
app.get('/api/marketplace/trades', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const options = {
      status: req.query.status || 'active',
      item_type: req.query.item_type || '',
      search: req.query.search || '',
      sort: req.query.sort || 'recent',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await marketplaceService.getAllTradeListings(options);
    res.json(result);
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo trade listing
app.post('/api/marketplace/trades', authenticateToken, tradeLimiter, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const listing = await marketplaceService.createTradeListing(req.body);
    res.json(listing);
  } catch (error) {
    console.error('Error creating trade:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener un trade específico
app.get('/api/marketplace/trades/:id', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const trade = await marketplaceService.getTradeListingById(req.params.id);
    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    res.json(trade);
  } catch (error) {
    console.error('Error fetching trade:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener trades de un usuario
app.get('/api/marketplace/traders/:name/trades', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const trades = await marketplaceService.getTradeListingsByTrader(req.params.name);
    res.json(trades);
  } catch (error) {
    console.error('Error fetching trader listings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estado de trade
app.patch('/api/marketplace/trades/:id/status', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { status } = req.body;
    await marketplaceService.updateTradeListingStatus(req.params.id, status);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating trade status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar trade
app.delete('/api/marketplace/trades/:id', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    await marketplaceService.deleteTradeListingById(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting trade:', error);
    res.status(500).json({ error: error.message });
  }
});

// === TRADE OFFERS ===
// Crear oferta de intercambio
app.post('/api/marketplace/trades/:id/offers', authenticateToken, tradeLimiter, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    console.log('Creating offer for listing:', req.params.id);
    console.log('Offer data:', req.body);
    console.log('User ID:', req.user.userId);

    const offer = await marketplaceService.createTradeOffer({
      ...req.body,
      listing_id: req.params.id
    });
    
    console.log('Offer created:', offer);
    
    // Generar notificación al dueño del trade
    try {
      const listing = await marketplaceService.getTradeListingById(req.params.id);
      if (listing && listing.username) {
        // Obtener el usuario dueño del listing
        const ownerUser = await db.collection('users').findOne({ username: listing.username });
        
        if (ownerUser && ownerUser._id.toString() !== req.user.userId) {
          // Obtener username del que hace la oferta
          const offerUser = await db.collection('users').findOne({ _id: new ObjectId(req.user.userId) });
          
          // Crear notificación
          const notification = await notificationService.createNotification({
            userId: ownerUser._id.toString(),
            type: 'trade',
            title: 'Nueva oferta de intercambio',
            message: `${offerUser?.username || 'Alguien'} hizo una oferta por "${listing.offering?.item_name || 'tu item'}"`,
            link: '/marketplace',
            relatedId: offer._id.toString(),
            senderId: req.user.userId
          });
          
          // Emitir notificación por WebSocket
          socketService.emitToUser(ownerUser._id.toString(), 'notification', {
            ...notification,
            _id: notification._id.toString()
          });
        }
      }
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }
    
    res.json(offer);
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener ofertas de un trade
app.get('/api/marketplace/trades/:id/offers', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    console.log('Getting offers for listing:', req.params.id);
    const { status } = req.query;
    const offers = await marketplaceService.getOffersByListingId(req.params.id, status);
    console.log('Found offers:', offers.length);
    res.json(offers);
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener ofertas de un usuario
app.get('/api/marketplace/traders/:name/offers', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { status } = req.query;
    const offers = await marketplaceService.getOffersByTrader(req.params.name, status);
    res.json(offers);
  } catch (error) {
    console.error('Error fetching trader offers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estado de oferta (aceptar/rechazar)
app.patch('/api/marketplace/offers/:id/status', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { status } = req.body;
    await marketplaceService.updateOfferStatus(req.params.id, status);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating offer status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar oferta
app.delete('/api/marketplace/offers/:id', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    await marketplaceService.deleteOfferById(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({ error: error.message });
  }
});

// === DISCUSSIONS ===
// Obtener todas las discusiones con filtros
app.get('/api/marketplace/discussions', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const options = {
      item_type: req.query.item_type || '',
      item_id: req.query.item_id || '',
      search: req.query.search || '',
      sort: req.query.sort || 'recent',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await marketplaceService.getAllDiscussions(options);
    res.json(result);
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crear nueva discusión sobre un item
app.post('/api/marketplace/discussions', authenticateToken, postLimiter, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const discussion = await marketplaceService.createDiscussion(req.body);
    res.json(discussion);
  } catch (error) {
    console.error('Error creating discussion:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener una discusión específica
app.get('/api/marketplace/discussions/:id', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const discussion = await marketplaceService.getDiscussionById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }
    res.json(discussion);
  } catch (error) {
    console.error('Error fetching discussion:', error);
    res.status(500).json({ error: error.message });
  }
});

// Votar una discusión
app.post('/api/marketplace/discussions/:id/vote', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { vote } = req.body;
    const discussion = await marketplaceService.voteDiscussion(req.params.id, vote);
    res.json(discussion);
  } catch (error) {
    console.error('Error voting discussion:', error);
    res.status(500).json({ error: error.message });
  }
});

// Agregar comentario a una discusión
app.post('/api/marketplace/discussions/:id/comments', authenticateToken, postLimiter, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const comment = await marketplaceService.addComment(req.params.id, req.body);
    res.json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener comentarios de una discusión
app.get('/api/marketplace/discussions/:id/comments', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const comments = await marketplaceService.getCommentsByDiscussionId(req.params.id);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Votar un comentario
app.post('/api/marketplace/comments/:id/vote', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { vote } = req.body;
    const success = await marketplaceService.voteComment(req.params.id, vote);
    res.json({ success });
  } catch (error) {
    console.error('Error voting comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar discusión (admin)
app.delete('/api/marketplace/discussions/:id', authenticateToken, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const success = await marketplaceService.deleteDiscussion(req.params.id);
    res.json({ success });
  } catch (error) {
    console.error('Error deleting discussion:', error);
    res.status(500).json({ error: error.message });
  }
});

// === STATISTICS ===
// Obtener estadísticas del marketplace
app.get('/api/marketplace/stats', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const stats = await marketplaceService.getMarketplaceStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching marketplace stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== OFERTAS Y COMENTARIOS MEJORADOS =====

// Obtener ofertas de un listing (endpoint alternativo)
app.get('/api/marketplace/trades/:listingId/offers', async (req, res) => {
  try {
    if (useMockData) {
      return res.json([]);
    }

    const offers = await marketplaceService.getOffersByListing(req.params.listingId);
    res.json(offers);
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Responder a una oferta (solo dueño del listing)
app.post('/api/marketplace/offers/:offerId/reply', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const result = await marketplaceService.replyToOffer(req.params.offerId, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error replying to offer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Aceptar oferta y crear transacción
app.post('/api/marketplace/offers/:offerId/accept', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { listing_owner } = req.body;
    const result = await marketplaceService.acceptOffer(req.params.offerId, listing_owner);
    
    // Enviar notificación al comprador
    if (result.transaction && result.transaction.buyer) {
      try {
        const buyerUser = await db.collection('users').findOne({ username: result.transaction.buyer });
        if (buyerUser) {
          await notificationService.createNotification(
            buyerUser._id.toString(),
            'trade_accepted',
            `¡Tu oferta fue aceptada! Puedes calificar al vendedor.`,
            {
              transaction_id: result.transaction._id.toString(),
              seller: listing_owner
            },
            '/marketplace'
          );
          
          // Emitir por WebSocket
          socketService.emitToUser(buyerUser._id.toString(), 'notification', {
            type: 'trade_accepted',
            message: `¡Tu oferta fue aceptada!`,
            data: result.transaction
          });
        }
      } catch (notifError) {
        console.error('Error enviando notificación:', notifError);
      }
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error accepting offer:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== SISTEMA DE CALIFICACIONES =====

// Obtener información de transacción para calificar
app.get('/api/marketplace/transactions/:transactionId', async (req, res) => {
  try {
    if (useMockData) {
      return res.status(404).json({ error: 'Database not available' });
    }

    const transaction = await marketplaceService.getTransactionById(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verificar si un usuario puede calificar
app.get('/api/marketplace/transactions/:transactionId/can-rate/:username', async (req, res) => {
  try {
    if (useMockData) {
      return res.json({ can_rate: false, reason: 'Database not available' });
    }

    const { transactionId, username } = req.params;
    const result = await marketplaceService.canUserRate(transactionId, username);
    res.json(result);
  } catch (error) {
    console.error('Error checking rating permission:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crear calificación de usuario
app.post('/api/marketplace/ratings', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const rating = await marketplaceService.createUserRating(req.body);
    res.status(201).json(rating);
  } catch (error) {
    console.error('Error creating rating:', error);
    res.status(400).json({ error: error.message });
  }
});

// Obtener calificaciones de un usuario
app.get('/api/marketplace/users/:username/ratings', async (req, res) => {
  try {
    if (useMockData) {
      return res.json({ 
        ratings: [],
        stats: {
          username: req.params.username,
          total_trades: 0,
          average_rating: 0,
          reputation: 'Nuevo'
        }
      });
    }

    const result = await marketplaceService.getUserRatings(req.params.username);
    res.json(result);
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener estadísticas de usuario
app.get('/api/marketplace/users/:username/stats', async (req, res) => {
  try {
    if (useMockData) {
      return res.json({
        username: req.params.username,
        total_trades: 0,
        average_rating: 0,
        reputation: 'Nuevo'
      });
    }

    const stats = await marketplaceService.getUserStats(req.params.username);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== TRACKER ENDPOINTS =====

// Get predefined achievements
app.get('/api/trackers/achievements', async (req, res) => {
  try {
    const achievements = await trackerService.getAchievements();
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new tracker
app.post('/api/trackers', authenticateToken, async (req, res) => {
  try {
    const tracker = await trackerService.createTracker(req.body);
    res.status(201).json(tracker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's trackers
app.get('/api/trackers/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { category, completed, sort, page, limit } = req.query;
    
    const result = await trackerService.getUserTrackers(username, {
      category,
      completed,
      sort,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tracker by ID
app.get('/api/trackers/:id', async (req, res) => {
  try {
    const tracker = await trackerService.getTrackerById(req.params.id);
    if (!tracker) {
      return res.status(404).json({ error: 'Tracker not found' });
    }
    res.json(tracker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update tracker progress
app.put('/api/trackers/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { progress, username } = req.body;
    const tracker = await trackerService.updateProgress(
      req.params.id,
      progress,
      username
    );
    res.json(tracker);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Increment tracker progress
app.post('/api/trackers/:id/increment', authenticateToken, async (req, res) => {
  try {
    const { amount, username } = req.body;
    const tracker = await trackerService.incrementProgress(
      req.params.id,
      amount || 1,
      username
    );
    res.json(tracker);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete tracker
app.delete('/api/trackers/:id', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;
    const result = await trackerService.deleteTracker(req.params.id, username);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user statistics
app.get('/api/trackers/user/:username/stats', async (req, res) => {
  try {
    const stats = await trackerService.getUserStats(req.params.username);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MAP MARKERS ENDPOINTS
// ============================================

// Obtener todos los marcadores de un usuario
app.get('/api/markers', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const markers = await markerService.getAllUserMarkers(req.user.userId.toString());
    res.json(markers);
  } catch (error) {
    console.error('Error fetching markers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener marcadores de un mapa específico
app.get('/api/markers/:mapName', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const markers = await markerService.getUserMarkersForMap(
      req.user.userId.toString(),
      req.params.mapName
    );
    res.json(markers);
  } catch (error) {
    console.error('Error fetching map markers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo marcador
app.post('/api/markers', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const markerData = {
      ...req.body,
      user_id: req.user.userId.toString()
    };

    const marker = await markerService.createMarker(markerData);
    res.status(201).json(marker);
  } catch (error) {
    console.error('Error creating marker:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar marcador
app.put('/api/markers/:id', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    await markerService.updateMarker(
      req.params.id,
      req.user.userId.toString(),
      req.body
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating marker:', error);
    res.status(400).json({ error: error.message });
  }
});

// Eliminar marcador
app.delete('/api/markers/:id', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const result = await markerService.deleteMarker(
      req.params.id,
      req.user.userId.toString()
    );
    res.json(result);
  } catch (error) {
    console.error('Error deleting marker:', error);
    res.status(400).json({ error: error.message });
  }
});

// Eliminar todos los marcadores de un mapa
app.delete('/api/markers/map/:mapName', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const result = await markerService.deleteAllUserMarkersForMap(
      req.user.userId.toString(),
      req.params.mapName
    );
    res.json(result);
  } catch (error) {
    console.error('Error deleting markers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener marcadores públicos de un mapa
app.get('/api/markers/public/:mapName', async (req, res) => {
  try {
    if (useMockData) {
      return res.json([]);
    }

    const markers = await markerService.getPublicMarkersForMap(req.params.mapName);
    res.json(markers);
  } catch (error) {
    console.error('Error fetching public markers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Migrar marcadores desde localStorage
app.post('/api/markers/migrate', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const result = await markerService.migrateFromLocalStorage(
      req.user.userId.toString(),
      req.body.markers
    );
    res.json(result);
  } catch (error) {
    console.error('Error migrating markers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener estadísticas de marcadores
app.get('/api/markers/stats/me', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const stats = await markerService.getUserMarkerStats(req.user.userId.toString());
    res.json(stats);
  } catch (error) {
    console.error('Error fetching marker stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Exportar marcadores (backup)
app.get('/api/markers/export/all', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const exportData = await markerService.exportUserMarkers(req.user.userId.toString());
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting markers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Importar marcadores (desde backup)
app.post('/api/markers/import', authenticateToken, async (req, res) => {
  try {
    if (useMockData) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const result = await markerService.importUserMarkers(
      req.user.userId.toString(),
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Error importing markers:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ NOTIFICATIONS ENDPOINTS ============

// Get user notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { limit, skip, unreadOnly } = req.query;
    
    const notifications = await notificationService.getUserNotifications(
      req.user.userId,
      {
        limit: limit ? parseInt(limit) : 50,
        skip: skip ? parseInt(skip) : 0,
        unreadOnly: unreadOnly === 'true'
      }
    );
    
    res.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
app.get('/api/notifications/unread/count', authenticateToken, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.userId);
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
app.post('/api/notifications/read/:id', authenticateToken, async (req, res) => {
  try {
    const success = await notificationService.markAsRead(
      req.params.id,
      req.user.userId
    );
    
    if (success) {
      res.json({ message: 'Notification marked as read' });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
app.post('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const count = await notificationService.markAllAsRead(req.user.userId);
    res.json({ message: `${count} notifications marked as read`, count });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete notification
app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
  try {
    const success = await notificationService.deleteNotification(
      req.params.id,
      req.user.userId
    );
    
    if (success) {
      res.json({ message: 'Notification deleted' });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete all read notifications
app.delete('/api/notifications/read/all', authenticateToken, async (req, res) => {
  try {
    const count = await notificationService.deleteReadNotifications(req.user.userId);
    res.json({ message: `${count} read notifications deleted`, count });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ END NOTIFICATIONS ENDPOINTS ============

// TEST: Create demo notifications
app.post('/api/notifications/test', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = [];

    // Crear notificación de comentario
    notifications.push(await notificationService.createNotification({
      userId,
      type: 'comment',
      title: 'Nuevo comentario',
      message: 'Alguien comentó en tu publicación "Mejores armas para PvP"',
      link: '/community',
      relatedId: null,
      senderId: null
    }));

    // Crear notificación de respuesta
    notifications.push(await notificationService.createNotification({
      userId,
      type: 'reply',
      title: 'Nueva respuesta',
      message: 'Alguien respondió a tu comentario en "Guía de The Dam"',
      link: '/community',
      relatedId: null,
      senderId: null
    }));

    // Crear notificación de trade
    notifications.push(await notificationService.createNotification({
      userId,
      type: 'trade',
      title: 'Nueva oferta de intercambio',
      message: 'Recibiste una oferta por "Plasma Rifle"',
      link: '/marketplace',
      relatedId: null,
      senderId: null
    }));

    // Crear notificación de voto
    notifications.push(await notificationService.createNotification({
      userId,
      type: 'vote',
      title: 'Voto en tu contribución',
      message: '👍 Tu contribución "Steel Armor Mk2" recibió un voto positivo',
      link: '/weapons',
      relatedId: null,
      senderId: null
    }));

    // Crear notificación de mención
    notifications.push(await notificationService.createNotification({
      userId,
      type: 'mention',
      title: 'Te mencionaron',
      message: `Te mencionaron en "Estrategias para The Dig"`,
      link: '/community',
      relatedId: null,
      senderId: null
    }));

    // Crear notificación del sistema
    notifications.push(await notificationService.createNotification({
      userId,
      type: 'system',
      title: 'Actualización del sistema',
      message: '🎉 Nuevo sistema de notificaciones disponible. Ahora recibirás actualizaciones en tiempo real.',
      link: null,
      relatedId: null,
      senderId: null
    }));

    res.json({ 
      message: `${notifications.length} notificaciones de prueba creadas`,
      notifications 
    });
  } catch (error) {
    console.error('Error creating test notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Endpoint para forzar sincronización manual
app.post('/api/sync/manual', async (req, res) => {
  if (useMockData) {
    return res.status(503).json({ error: 'Sync not available in mock mode' });
  }

  if (syncInProgress) {
    return res.status(409).json({ error: 'Sync already in progress' });
  }

  syncInProgress = true;

  try {
    const results = {
      items: await syncService.syncItems(),
      traders: await syncService.syncTraders(),
      timestamp: new Date(),
    };

    lastSyncTime = results.timestamp;
    
    // Guardar timestamp en la base de datos
    await db.collection('sync_metadata').updateOne(
      { _id: 'last_sync' },
      { 
        $set: { 
          timestamp: lastSyncTime,
          items: results.items.inserted || 0,
          traders: results.traders.inserted || 0,
          manual: true
        }
      },
      { upsert: true }
    );
    
    syncInProgress = false;

    res.json({
      success: true,
      message: 'Manual sync completed',
      results: {
        items: results.items,
        traders: results.traders,
      },
      timestamp: lastSyncTime,
    });
  } catch (error) {
    syncInProgress = false;
    console.error('Manual sync failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener estado de sincronización
app.get('/api/sync/status', async (req, res) => {
  try {
    const lastSync = await db.collection('sync_metadata').findOne({ _id: 'last_sync' });
    
    res.json({
      autoSyncEnabled,
      syncInProgress,
      lastSyncTime: lastSync?.timestamp || lastSyncTime,
      lastSyncStats: lastSync ? {
        items: lastSync.items,
        weapons: lastSync.weapons,
        traders: lastSync.traders
      } : null,
      nextSyncTime: autoSyncEnabled ? 'Daily at 2:00 AM' : 'Disabled',
      mockMode: useMockData,
      counts: {
        weapons: await db.collection('weapons').countDocuments(),
        items: await db.collection('items').countDocuments(),
        traders: await db.collection('traders').countDocuments(),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para activar/desactivar auto-sync
app.post('/api/sync/toggle', (req, res) => {
  const { enabled } = req.body;
  
  if (typeof enabled === 'boolean') {
    autoSyncEnabled = enabled;
    res.json({
      success: true,
      autoSyncEnabled,
      message: `Auto-sync ${enabled ? 'enabled' : 'disabled'}`,
    });
  } else {
    res.status(400).json({ error: 'Invalid enabled parameter (expected boolean)' });
  }
});

// Función para cron job de sincronización automática
function scheduleAutoSync() {
  // Ejecutar diariamente a las 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    if (!autoSyncEnabled || syncInProgress || useMockData) {
      console.log('⏭️ Auto-sync skipped (disabled, in progress, or mock mode)');
      return;
    }

    console.log('🔄 Starting automated daily sync...');
    syncInProgress = true;

    try {
      const itemsResult = await syncService.syncItems();
      console.log(`✅ Items synced: ${itemsResult.inserted} new, ${itemsResult.updated} updated`);

      const tradersResult = await syncService.syncTraders();
      console.log(`✅ Traders synced: ${tradersResult.inserted} new, ${tradersResult.updated} updated`);

      lastSyncTime = new Date();
      
      // Guardar timestamp en la base de datos
      await db.collection('sync_metadata').updateOne(
        { _id: 'last_sync' },
        { 
          $set: { 
            timestamp: lastSyncTime,
            items: itemsResult.inserted || 0,
            traders: tradersResult.inserted || 0,
            auto: true
          }
        },
        { upsert: true }
      );
      
      console.log(`✅ Auto-sync completed at ${lastSyncTime.toISOString()}`);
    } catch (error) {
      console.error('❌ Auto-sync failed:', error);
    } finally {
      syncInProgress = false;
    }
  });

  console.log('⏰ Auto-sync scheduled: Daily at 2:00 AM');
}

// ============ MESSAGES ROUTES ============

// Enviar mensaje
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    // Convertir senderId a string si es ObjectId
    const senderId = req.user.userId.toString ? req.user.userId.toString() : req.user.userId;

    console.log('📨 POST /api/messages - receiverId:', receiverId, 'content length:', content?.length, 'senderId:', senderId);

    if (!receiverId || !content) {
      console.error('❌ Parámetros faltantes - receiverId:', receiverId, 'content:', content);
      return res.status(400).json({ error: 'receiverId y content son requeridos' });
    }

    if (content.trim().length === 0) {
      console.error('❌ Contenido vacío');
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    if (content.length > 1000) {
      console.error('❌ Contenido demasiado largo');
      return res.status(400).json({ error: 'El mensaje es demasiado largo (máximo 1000 caracteres)' });
    }

    console.log('📨 Enviando mensaje de', senderId, 'a', receiverId);
    const message = await messageService.sendMessage(senderId, receiverId, content);
    console.log('✅ Mensaje enviado:', message._id);

    // Crear notificación para el receptor
    await notificationService.createNotification(
      receiverId,
      'message',
      `Nuevo mensaje de ${req.user.username}`,
      {
        senderId: senderId,
        senderUsername: req.user.username,
        messageId: message._id,
        preview: content.substring(0, 50) + (content.length > 50 ? '...' : '')
      }
    );

    res.status(201).json({ message });
  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener conversaciones del usuario
app.get('/api/messages/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversations = await messageService.getConversations(userId);
    res.json({ conversations });
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener mensajes de una conversación específica
app.get('/api/messages/conversation/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otherUserId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const messages = await messageService.getConversationMessages(
      userId, 
      otherUserId, 
      parseInt(limit), 
      parseInt(skip)
    );

    res.json({ messages });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Marcar mensaje como leído
app.patch('/api/messages/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const updated = await messageService.markAsRead(messageId, userId);
    
    if (!updated) {
      return res.status(404).json({ error: 'Mensaje no encontrado o ya leído' });
    }

    res.json({ success: true, message: 'Mensaje marcado como leído' });
  } catch (error) {
    console.error('Error al marcar mensaje como leído:', error);
    res.status(500).json({ error: error.message });
  }
});

// Marcar toda una conversación como leída
app.patch('/api/messages/conversation/:otherUserId/read', authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.userId;

    const count = await messageService.markConversationAsRead(userId, otherUserId);

    res.json({ 
      success: true, 
      message: `${count} mensaje(s) marcado(s) como leído(s)`,
      count 
    });
  } catch (error) {
    console.error('Error al marcar conversación como leída:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener contador de mensajes no leídos
app.get('/api/messages/unread/count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await messageService.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error al contar mensajes no leídos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar mensaje
app.delete('/api/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const deleted = await messageService.deleteMessage(messageId, userId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Mensaje no encontrado o no tienes permiso' });
    }

    res.json({ success: true, message: 'Mensaje eliminado' });
  } catch (error) {
    console.error('Error al eliminar mensaje:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar usuarios para iniciar conversación
app.get('/api/messages/users/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.userId;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Query debe tener al menos 2 caracteres' });
    }

    const users = await messageService.searchUsers(q, userId);
    res.json({ users });
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ PROFILE ROUTES ============

// Obtener perfil de usuario
app.get('/api/users/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await profileService.getProfile(userId);
    res.json({ profile });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(404).json({ error: error.message });
  }
});

// Subir avatar
app.post('/api/users/:userId/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Solo el propio usuario puede subir su avatar
    if (userId !== req.user.userId) {
      return res.status(403).json({ error: 'No puedes editar el perfil de otro usuario' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    // Generar URL del avatar
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    // Obtener el avatar anterior para eliminarlo
    const currentProfile = await profileService.getProfile(userId);
    const oldAvatar = currentProfile.avatar;
    
    // Actualizar el perfil con el nuevo avatar
    const profile = await profileService.updateProfile(userId, { avatar: avatarUrl });
    
    // Eliminar el avatar anterior si existe y no es una URL externa
    if (oldAvatar && oldAvatar.startsWith('/uploads/')) {
      const oldAvatarPath = path.join(__dirname, oldAvatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }
    
    res.json({ 
      profile, 
      avatarUrl,
      message: 'Avatar actualizado correctamente' 
    });
  } catch (error) {
    console.error('Error al subir avatar:', error);
    
    // Si hubo error, eliminar el archivo subido
    if (req.file) {
      const filePath = path.join(__dirname, 'uploads', 'avatars', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Actualizar perfil propio
app.patch('/api/users/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Solo el propio usuario puede actualizar su perfil
    if (userId !== req.user.userId) {
      return res.status(403).json({ error: 'No puedes editar el perfil de otro usuario' });
    }

    const { fullName, bio, avatar } = req.body;
    const profile = await profileService.updateProfile(userId, { fullName, bio, avatar });
    
    res.json({ profile, message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener estadísticas de usuario
app.get('/api/users/:userId/stats', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await profileService.getUserStats(userId);
    res.json({ stats });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener actividad reciente de usuario
app.get('/api/users/:userId/activity', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;
    const activity = await profileService.getUserActivity(userId, parseInt(limit));
    res.json({ activity });
  } catch (error) {
    console.error('Error al obtener actividad:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar usuarios
app.get('/api/users/search/public', authenticateToken, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Query debe tener al menos 2 caracteres' });
    }

    const users = await profileService.searchUsers(q, parseInt(limit));
    res.json({ users });
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    res.status(500).json({ error: error.message });
  }
});

// Listar usuarios (con paginación)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const { skip = 0, limit = 20, sortBy = 'createdAt' } = req.query;
    const result = await profileService.getUsers(
      parseInt(skip), 
      parseInt(limit), 
      sortBy
    );
    res.json(result);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ ACTIVITY FEED ROUTES ============

// Obtener feed de actividades
app.get('/api/activity', authenticateToken, async (req, res) => {
  try {
    const { type = 'all', timeRange = '24h' } = req.query;
    
    // Calcular fecha límite según timeRange
    const now = new Date();
    const timeLimit = new Date();
    if (timeRange === '24h') {
      timeLimit.setHours(now.getHours() - 24);
    } else if (timeRange === '7d') {
      timeLimit.setDate(now.getDate() - 7);
    } else if (timeRange === '30d') {
      timeLimit.setDate(now.getDate() - 30);
    }

    const activities = [];

    // Obtener posts recientes
    if (type === 'all' || type === 'post') {
      const posts = await db.collection('community_posts')
        .find({ created_at: { $gte: timeLimit } })
        .sort({ created_at: -1 })
        .limit(20)
        .toArray();

      for (const post of posts) {
        let user = null;
        try {
          // Intentar convertir author_id a ObjectId si es string
          const authorId = typeof post.author_id === 'string' 
            ? new ObjectId(post.author_id) 
            : post.author_id;
          user = await db.collection('users').findOne({ _id: authorId });
        } catch (error) {
          // Usuario no encontrado
        }

        activities.push({
          _id: post._id,
          type: 'post',
          user: {
            userId: post.author_id?.toString() || post.author_id,
            username: post.author_name || 'Unknown',
            avatar: user?.avatar || '',
          },
          content: {
            title: post.title,
            description: post.content,
            category: post.category,
          },
          metadata: {
            likes: post.upvotes || 0,
            comments: post.comment_count || 0,
            views: post.views || 0,
          },
          createdAt: post.created_at,
          refId: post._id.toString(),
        });
      }
    }

    // Obtener trades recientes
    if (type === 'all' || type === 'trade') {
      const trades = await db.collection('trade_listings')
        .find({ created_at: { $gte: timeLimit } })
        .sort({ created_at: -1 })
        .limit(20)
        .toArray();

      for (const trade of trades) {
        let user = null;
        try {
          const userId = typeof trade.user_id === 'string' 
            ? new ObjectId(trade.user_id) 
            : trade.user_id;
          user = await db.collection('users').findOne({ _id: userId });
        } catch (error) {
          // Usuario no encontrado
        }

        activities.push({
          _id: trade._id,
          type: 'trade',
          user: {
            userId: trade.user_id?.toString() || trade.user_id,
            username: trade.username || user?.username || 'Unknown',
            avatar: user?.avatar || '',
          },
          content: {
            itemName: trade.item_name,
            description: trade.description,
            price: trade.price,
            category: trade.category,
          },
          metadata: {},
          createdAt: trade.created_at,
          refId: trade._id.toString(),
        });
      }
    }

    // Ordenar por fecha
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Limitar resultados
    const limitedActivities = activities.slice(0, 50);

    console.log(`✅ Activity Feed - Total actividades: ${activities.length}, devolviendo: ${limitedActivities.length}`);

    res.json({ activities: limitedActivities, total: activities.length });
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ END ACTIVITY FEED ROUTES ============

// ============ ADVANCED TRADING ROUTES ============

// === SISTEMA DE OFERTAS ===

// Crear oferta en un listing
app.post('/api/marketplace/listings/:id/offer', authenticateToken, async (req, res) => {
  try {
    const offerData = {
      ...req.body,
      buyer_id: req.user.userId,
      buyer_username: req.user.username
    };

    const offer = await marketplaceService.createOffer(req.params.id, offerData);
    
    // Notificar en tiempo real al dueño del listing
    const socketService = req.app.get('socketService');
    if (socketService && offer.seller_id) {
      socketService.notifyNewOffer(offer.seller_id.toString(), {
        offerId: offer._id,
        buyerUsername: req.user.username,
        itemName: offer.item_name || 'Item',
        offerItems: offer.offer_items
      });
    }
    
    res.json(offer);
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(400).json({ error: error.message });
  }
});

// Obtener ofertas de un listing
app.get('/api/marketplace/listings/:id/offers', authenticateToken, async (req, res) => {
  try {
    const offers = await marketplaceService.getOffersByListing(req.params.id);
    res.json(offers);
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener ofertas del usuario (recibidas o enviadas)
app.get('/api/marketplace/my-offers', authenticateToken, async (req, res) => {
  try {
    const type = req.query.type || 'received'; // 'received' o 'sent'
    const offers = await marketplaceService.getOffersForUser(req.user.userId, type);
    res.json(offers);
  } catch (error) {
    console.error('Error fetching user offers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Aceptar oferta
app.put('/api/marketplace/offers/:id/accept', authenticateToken, async (req, res) => {
  try {
    const result = await marketplaceService.acceptOffer(req.params.id, req.user.userId);
    
    // Notificar en tiempo real al comprador
    const socketService = req.app.get('socketService');
    if (socketService && result.buyer_id) {
      socketService.notifyOfferUpdate(result.buyer_id.toString(), {
        type: 'accepted',
        offerId: req.params.id,
        message: 'Tu oferta fue aceptada',
        itemName: result.item_name
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error accepting offer:', error);
    res.status(400).json({ error: error.message });
  }
});

// Rechazar oferta
app.put('/api/marketplace/offers/:id/reject', authenticateToken, async (req, res) => {
  try {
    const result = await marketplaceService.rejectOffer(req.params.id, req.user.userId);
    
    // Notificar en tiempo real al comprador
    const socketService = req.app.get('socketService');
    if (socketService && result.buyer_id) {
      socketService.notifyOfferUpdate(result.buyer_id.toString(), {
        type: 'rejected',
        offerId: req.params.id,
        message: 'Tu oferta fue rechazada',
        itemName: result.item_name
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error rejecting offer:', error);
    res.status(400).json({ error: error.message });
  }
});

// Contraoferta
app.put('/api/marketplace/offers/:id/counter', authenticateToken, async (req, res) => {
  try {
    const result = await marketplaceService.counterOffer(
      req.params.id,
      req.user.userId,
      req.body
    );
    
    // Notificar en tiempo real al comprador
    const socketService = req.app.get('socketService');
    if (socketService && result.buyer_id) {
      socketService.notifyOfferUpdate(result.buyer_id.toString(), {
        type: 'countered',
        offerId: req.params.id,
        message: 'Recibiste una contraoferta',
        itemName: result.item_name,
        counterItems: req.body.counter_items
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error creating counter offer:', error);
    res.status(400).json({ error: error.message });
  }
});

// === HISTORIAL DE INTERCAMBIOS ===

// Obtener historial de intercambios de un item
app.get('/api/marketplace/trade-history/:itemName', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const history = await marketplaceService.getTradeHistory(req.params.itemName, days);
    res.json(history);
  } catch (error) {
    console.error('Error fetching trade history:', error);
    res.status(500).json({ error: error.message });
  }
});

// === WISHLIST ===

// Agregar item a wishlist
app.post('/api/marketplace/wishlist', authenticateToken, async (req, res) => {
  try {
    const item = await marketplaceService.addToWishlist(req.user.userId, req.body);
    res.json(item);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(400).json({ error: error.message });
  }
});

// Obtener wishlist del usuario
app.get('/api/marketplace/wishlist', authenticateToken, async (req, res) => {
  try {
    const wishlist = await marketplaceService.getWishlist(req.user.userId);
    res.json(wishlist);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar item de wishlist
app.delete('/api/marketplace/wishlist/:id', authenticateToken, async (req, res) => {
  try {
    const result = await marketplaceService.removeFromWishlist(req.user.userId, req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(400).json({ error: error.message });
  }
});

// === SISTEMA DE REPUTACIÓN ===

// Calificar usuario
app.post('/api/marketplace/rate-user', authenticateToken, async (req, res) => {
  try {
    const rating = await marketplaceService.rateUser(
      req.body.rated_user_id,
      req.user.userId,
      req.body
    );
    res.json(rating);
  } catch (error) {
    console.error('Error rating user:', error);
    res.status(400).json({ error: error.message });
  }
});

// Obtener reputación de usuario
app.get('/api/users/:userId/reputation', async (req, res) => {
  try {
    const reputation = await marketplaceService.getUserReputation(req.params.userId);
    res.json(reputation);
  } catch (error) {
    console.error('Error fetching reputation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener calificaciones de usuario
app.get('/api/users/:userId/ratings', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const ratings = await marketplaceService.getUserRatings(req.params.userId, page, limit);
    res.json(ratings);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ END GROUPS ROUTES ============

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception - El servidor se reiniciará:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
});

// Start server
connectDB().then(() => {
  console.log('🔄 connectDB() completado, db =', db ? 'CONNECTED' : 'UNDEFINED');
  
  // Crear los routers DESPUÉS de que DB esté listo
  if (db) {
    try {
      const groupsRouter = createGroupsRouter(db);
      app.use('/api/groups', groupsRouter);
      console.log('✅ Groups router registered');
      
      const friendsRouter = createFriendsRouter(db);
      app.use('/api/friends', friendsRouter);
      console.log('✅ Friends router registered');
      
      const raiderProfileRouter = createRaiderProfileRouter(db);
      app.use('/api/raider-profiles', raiderProfileRouter);
      console.log('✅ Raider Profile router registered');
      
      const clansRouter = createClansRouter(db);
      app.use('/api/clans', clansRouter);
      console.log('✅ Clans router registered');
    } catch (error) {
      console.error('❌ Error registering routers:', error);
    }
  } else {
    console.warn('⚠️ Routers de groups y friends no registrados (sin conexión a DB)');
  }

  // Middleware de rutas no encontradas (debe ir DESPUÉS de todos los routers)
  app.use(notFoundHandler);

  // Middleware global de manejo de errores (debe ir al FINAL)
  app.use(errorHandler);

  // Crear servidor HTTP explícito
  const httpServer = createServer(app);

  // Inicializar Socket.io ANTES de que el servidor empiece a escuchar
  socketService = new SocketService(httpServer, messageService, notificationService);
  console.log('⚡ WebSocket server initialized');

  // Hacer socketService disponible globalmente para usar en endpoints
  app.set('socketService', socketService);

  // Iniciar servidor
  httpServer.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    
    if (!useMockData) {
      scheduleAutoSync();
    } else {
      console.log('⚠️ Auto-sync disabled in mock mode');
    }
  });
});
