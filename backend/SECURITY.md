# Guía de Seguridad - Arc Raiders Backend

## ✅ Implementado

### 1. **Autenticación JWT**

- ✅ Tokens JWT con expiración de 7 días
- ✅ Cookies HttpOnly para mayor seguridad
- ✅ Verificación de tokens en cada request protegido
- ✅ Middleware `authenticateToken` para rutas protegidas
- ✅ Middleware `optionalAuth` para rutas que permiten usuarios anónimos

### 2. **Rate Limiting**

- ✅ **Login**: 5 intentos cada 15 minutos
- ✅ **Registro**: 3 intentos cada hora
- ✅ **API General**: 100 requests cada 15 minutos
- ✅ **Posts/Comments**: 20 por hora
- ✅ **Trades/Offers**: 10 por hora

### 3. **Encriptación de Contraseñas**

- ✅ bcrypt con salt rounds de 10
- ✅ Nunca devolver contraseñas en respuestas API

### 4. **Protección de Rutas**

- ✅ Community: Posts, comments, votos requieren autenticación
- ✅ Marketplace: Trades, ofertas, ratings requieren autenticación
- ✅ Trackers: CRUD requiere autenticación
- ✅ Admin: Pin/Lock posts, aprobar contribuciones requieren rol de admin/moderator

### 5. **CORS Configurado**

- ✅ Whitelist de orígenes permitidos
- ✅ Credentials habilitados
- ✅ Configurable por variables de entorno

### 6. **Validación de Entrada**

- ✅ Validación básica de campos requeridos
- ⚠️ **PENDIENTE**: Sanitización de HTML/XSS

## ⚠️ Recomendaciones para Producción

### Crítico

1. **Cambiar JWT_SECRET**

   ```bash
   # Generar un secret seguro
   openssl rand -base64 64
   ```

2. **HTTPS Obligatorio**

   - Usar certificados SSL (Let's Encrypt gratis)
   - Forzar HTTPS en todas las conexiones
   - Configurar `secure: true` en cookies

3. **Variables de Entorno**

   - Nunca commitear `.env` al repositorio
   - Usar servicios como AWS Secrets Manager o HashiCorp Vault en producción

4. **MongoDB**
   - Usar MongoDB Atlas con IP whitelist
   - Habilitar auditoría de accesos
   - Backups automáticos diarios

### Importante

5. **Helmet.js** - Headers de seguridad HTTP

   ```bash
   npm install helmet
   ```

   ```javascript
   import helmet from "helmet";
   app.use(helmet());
   ```

6. **Express Validator** - Validación robusta

   ```bash
   npm install express-validator
   ```

7. **XSS Protection**

   ```bash
   npm install xss-clean
   ```

8. **MongoDB Injection Protection**

   ```bash
   npm install express-mongo-sanitize
   ```

9. **Logs Estructurados**

   ```bash
   npm install winston
   ```

10. **Monitoreo de Errores**
    - Sentry.io para tracking de errores
    - New Relic o DataDog para performance

### Recomendado

11. **Renovación de Tokens**

    - Implementar refresh tokens
    - Tokens de corta duración (15 min) + refresh token (30 días)

12. **2FA (Two-Factor Authentication)**

    - Usar TOTP (Google Authenticator)
    - SMS o Email como alternativa

13. **Email Verification**

    - Verificar emails antes de activar cuenta
    - Prevenir spam y cuentas falsas

14. **Captcha**

    - reCAPTCHA en registro y login
    - Prevenir bots y ataques automatizados

15. **Session Management**
    - Redis para sesiones distribuidas
    - Logout remoto de todas las sesiones

## 🔒 Checklist Pre-Producción

- [ ] JWT_SECRET único y complejo (min 64 caracteres)
- [ ] HTTPS habilitado en servidor
- [ ] CORS configurado con dominio de producción
- [ ] Rate limiting ajustado según tráfico esperado
- [ ] Helmet.js instalado y configurado
- [ ] Logs centralizados (Winston + CloudWatch/ELK)
- [ ] Monitoreo de errores (Sentry)
- [ ] Backups automáticos de MongoDB
- [ ] IP whitelist en MongoDB Atlas
- [ ] Variables de entorno en servicio seguro
- [ ] Health check endpoint monitoreado
- [ ] SSL/TLS configurado
- [ ] Firewall configurado (solo puertos 80, 443, 3001)
- [ ] Actualizaciones de dependencias (npm audit fix)

## 🚨 Incidentes de Seguridad

### Si detectas una vulnerabilidad:

1. **NO publicar** detalles públicamente
2. Contactar al equipo por email privado
3. Documentar steps para reproducir
4. Esperar confirmación y fix antes de disclosure

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
