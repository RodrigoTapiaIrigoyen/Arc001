# 🚀 Guía de Deployment para Producción

## Pre-requisitos

- Node.js 20.x o superior
- MongoDB Atlas configurado
- Dominio con DNS configurado
- Servidor con Ubuntu/Debian (recomendado) o similar

---

## 1. Configuración del Backend

### 1.1 Clonar repositorio en el servidor

```bash
git clone https://github.com/tu-usuario/arc-raiders.git
cd arc-raiders/backend
```

### 1.2 Instalar dependencias

```bash
npm install --production
```

### 1.3 Configurar variables de entorno

```bash
cp .env.production.example .env
nano .env
```

Configurar:

- `MONGODB_URI`: Tu string de conexión de MongoDB Atlas
- `JWT_SECRET`: Generar con `openssl rand -base64 64`
- `CORS_ORIGINS`: Tu dominio de frontend (ej: `https://arcraiders.com`)
- `NODE_ENV=production`

### 1.4 Instalar PM2 (Process Manager)

```bash
npm install -g pm2
```

### 1.5 Iniciar servidor con PM2

```bash
pm2 start server.js --name arc-raiders-api
pm2 startup  # Configurar inicio automático
pm2 save     # Guardar configuración
```

### 1.6 Ver logs

```bash
pm2 logs arc-raiders-api
pm2 monit
```

---

## 2. Configuración del Frontend

### 2.1 Build de producción

```bash
cd ../  # Volver a la raíz del proyecto
npm install
npm run build
```

### 2.2 Configurar variables de entorno

Crear `.env.production`:

```bash
VITE_API_URL=https://api.tu-dominio.com
```

### 2.3 Deploy en Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

O conectar repositorio en [vercel.com](https://vercel.com)

### Alternativa: Deploy en Netlify

1. Conectar repositorio en [netlify.com](https://netlify.com)
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Environment variables: `VITE_API_URL`

---

## 3. Configuración de Nginx (Backend en VPS)

### 3.1 Instalar Nginx

```bash
sudo apt update
sudo apt install nginx
```

### 3.2 Configurar reverse proxy

```bash
sudo nano /etc/nginx/sites-available/arc-raiders-api
```

Contenido:

```nginx
server {
    listen 80;
    server_name api.tu-dominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 3.3 Activar configuración

```bash
sudo ln -s /etc/nginx/sites-available/arc-raiders-api /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuración
sudo systemctl restart nginx
```

### 3.4 Configurar SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.tu-dominio.com
```

---

## 4. Configuración de MongoDB Atlas

### 4.1 IP Whitelist

- Ir a MongoDB Atlas Dashboard
- Network Access → Add IP Address
- Agregar IP del servidor backend
- O usar `0.0.0.0/0` (menos seguro)

### 4.2 Configurar Backup Automático

- Database → Clusters → Backup
- Habilitar automated backups

### 4.3 Índices

Los índices se crean automáticamente al iniciar el servidor.

---

## 5. Monitoreo

### 5.1 PM2 Monitoring

```bash
pm2 install pm2-logrotate  # Rotar logs automáticamente
pm2 set pm2-logrotate:max_size 10M
```

### 5.2 Uptime Monitoring (Opcional)

- [UptimeRobot](https://uptimerobot.com) (gratuito)
- [Pingdom](https://www.pingdom.com)

### 5.3 Error Tracking (Opcional)

- [Sentry](https://sentry.io) para tracking de errores
- [LogRocket](https://logrocket.com) para session replay

---

## 6. Checklist Final

- [ ] Variables de entorno configuradas correctamente
- [ ] JWT_SECRET generado con openssl
- [ ] CORS_ORIGINS sin localhost
- [ ] MongoDB Atlas con IP whitelist
- [ ] SSL configurado (HTTPS)
- [ ] PM2 configurado con auto-restart
- [ ] Nginx configurado como reverse proxy
- [ ] Logs funcionando correctamente
- [ ] WebSockets funcionando
- [ ] Build de frontend desplegado
- [ ] DNS configurado correctamente
- [ ] Backup de MongoDB configurado

---

## 7. Comandos Útiles

### Backend

```bash
# Ver logs en tiempo real
pm2 logs arc-raiders-api --lines 100

# Reiniciar servidor
pm2 restart arc-raiders-api

# Ver estado
pm2 status

# Detener servidor
pm2 stop arc-raiders-api

# Ver uso de recursos
pm2 monit
```

### Nginx

```bash
# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs de error
sudo tail -f /var/log/nginx/error.log
```

### MongoDB

```bash
# Conectarse a MongoDB Atlas
mongosh "mongodb+srv://cluster.mongodb.net/arc_raiders" --apiVersion 1 --username usuario

# Backup manual
mongodump --uri="mongodb+srv://..." --out=./backup

# Restaurar backup
mongorestore --uri="mongodb+srv://..." ./backup
```

---

## 8. Troubleshooting

### El servidor no inicia

1. Verificar logs: `pm2 logs`
2. Verificar variables de entorno: `cat .env`
3. Verificar conexión a MongoDB: Test desde mongosh

### CORS errors

1. Verificar `CORS_ORIGINS` en `.env`
2. No incluir trailing slash en URLs
3. Verificar que frontend esté usando HTTPS si backend usa HTTPS

### WebSockets no conectan

1. Verificar configuración de Nginx (Upgrade headers)
2. Verificar que puerto 3001 esté abierto
3. Verificar firewall: `sudo ufw status`

### 502 Bad Gateway

1. Verificar que el backend esté corriendo: `pm2 status`
2. Verificar Nginx: `sudo nginx -t`
3. Verificar logs de Nginx

---

## 9. Actualizar en Producción

```bash
cd arc-raiders
git pull origin main

# Backend
cd backend
npm install --production
pm2 restart arc-raiders-api

# Frontend
cd ..
npm install
npm run build
# Re-deploy en Vercel/Netlify (automático si está conectado con Git)
```

---

## 10. Rollback en Caso de Error

```bash
# Ver commits
git log --oneline

# Volver a commit anterior
git checkout [commit-hash]

# Reiniciar servicios
pm2 restart arc-raiders-api
```

---

**Última actualización**: Diciembre 2, 2025
**Soporte**: [GitHub Issues](https://github.com/tu-usuario/arc-raiders/issues)
