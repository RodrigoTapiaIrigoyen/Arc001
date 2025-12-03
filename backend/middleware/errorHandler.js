// Middleware de manejo de errores global
import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Error no manejado:', err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId
  });

  // No exponer detalles del error en producción
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const statusCode = err.statusCode || 500;
  const message = isDevelopment ? err.message : 'Error interno del servidor';
  
  res.status(statusCode).json({
    error: message,
    ...(isDevelopment && { stack: err.stack })
  });
};

// Middleware para rutas no encontradas
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.url
  });
};

// Validar variables de entorno críticas
export const validateEnv = () => {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.error('Variables de entorno faltantes:', { missing });
    throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
  }
  
  // Advertencias
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET.length < 32) {
      logger.warn('JWT_SECRET es muy corto. Se recomienda al menos 32 caracteres.');
    }
    if (!process.env.CORS_ORIGINS || process.env.CORS_ORIGINS.includes('localhost')) {
      logger.warn('CORS_ORIGINS contiene localhost en producción.');
    }
  }
  
  logger.success('Variables de entorno validadas correctamente');
};
