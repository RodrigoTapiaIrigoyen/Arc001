import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'arc-raiders-super-secret-key-change-in-production-2024';

// Middleware de autenticación
export const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    
    // Convertir userId a ObjectId si es necesario
    if (req.user.userId && typeof req.user.userId === 'string') {
      try {
        req.user.userId = new ObjectId(req.user.userId);
      } catch (err) {
        console.error('Error converting userId to ObjectId:', err);
      }
    }
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Por favor inicia sesión nuevamente.' });
    }
    res.status(403).json({ error: 'Token inválido.' });
  }
};

// Middleware opcional de autenticación (agrega user si existe token, pero no falla)
export const optionalAuth = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (token) {
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      req.user = verified;
      
      // Convertir userId a ObjectId si es necesario
      if (req.user.userId && typeof req.user.userId === 'string') {
        try {
          req.user.userId = new ObjectId(req.user.userId);
        } catch (err) {
          console.error('Error converting userId to ObjectId:', err);
        }
      }
    } catch (error) {
      // Token inválido pero seguimos adelante
    }
  }
  
  next();
};

// Middleware de verificación de rol
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida.' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta acción.' });
    }
    
    next();
  };
};

// Middleware para verificar que el usuario es dueño del recurso
export const requireOwnership = (getUserIdFromRequest) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida.' });
    }
    
    const resourceUserId = getUserIdFromRequest(req);
    
    if (req.user.userId.toString() !== resourceUserId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No puedes modificar recursos de otros usuarios.' });
    }
    
    next();
  };
};

// Rate limiters por tipo de acción
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros
  message: 'Demasiados registros desde esta IP. Intenta nuevamente en 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 requests (para desarrollo)
  message: 'Demasiadas peticiones desde esta IP. Intenta nuevamente más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 posts/comments
  message: 'Límite de publicaciones alcanzado. Intenta nuevamente en 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const tradeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 listings/offers
  message: 'Límite de intercambios alcanzado. Intenta nuevamente en 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
});
