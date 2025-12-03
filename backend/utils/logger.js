// Simple logger que puede ser expandido con Winston en el futuro
class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  info(message, ...args) {
    console.log(`ℹ️ [INFO] ${new Date().toISOString()}:`, message, ...args);
  }

  success(message, ...args) {
    console.log(`✅ [SUCCESS] ${new Date().toISOString()}:`, message, ...args);
  }

  warn(message, ...args) {
    console.warn(`⚠️ [WARN] ${new Date().toISOString()}:`, message, ...args);
  }

  error(message, error, ...args) {
    console.error(`❌ [ERROR] ${new Date().toISOString()}:`, message);
    if (error) {
      console.error('Error details:', {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        ...args
      });
    }
  }

  debug(message, ...args) {
    if (this.isDevelopment) {
      console.log(`🐛 [DEBUG] ${new Date().toISOString()}:`, message, ...args);
    }
  }
}

export default new Logger();
