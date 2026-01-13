# 🚂 Deploy a Railway.app - Guía Paso a Paso

## 📋 Pre-requisitos

✅ Cuenta de GitHub con repo `Arc001`
✅ MongoDB URI listo
✅ JWT_SECRET generado: `[REPLACED - Generate a new secure secret with: openssl rand -base64 64]`

---

## 🚀 Paso 1: Crear Cuenta en Railway (2 min)

1. Ve a **https://railway.app**
2. Click en **"Login"**
3. Selecciona **"Login with GitHub"**
4. Autoriza Railway a acceder a tu GitHub
5. ✅ Estás dentro del Dashboard

---

## 🎯 Paso 2: Crear Nuevo Proyecto (3 min)

1. En el Dashboard, click **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Busca y selecciona **`RodrigoTapiaIrigoyen/Arc001`**
4. Railway comenzará a analizar el repo
5. Verás que detecta **Node.js** automáticamente

---

## ⚙️ Paso 3: Configurar el Servicio (5 min)

### 3.1 Configurar Root Directory

1. Click en tu servicio (debería decir "arc001" o similar)
2. Ve a pestaña **"Settings"**
3. Busca **"Root Directory"**
4. Escribe: **`backend`**
5. Click "Update"

### 3.2 Configurar Variables de Entorno

1. Ve a pestaña **"Variables"**
2. Click **"+ New Variable"**
3. Agrega las siguientes variables **UNA POR UNA**:

```bash
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string_here

# JWT Secret (IMPORTANTE: Usar el generado)
JWT_SECRET=your_secure_jwt_secret_here

# Environment
NODE_ENV=production

# Puerto (Railway lo asigna automáticamente, pero por si acaso)
PORT=3001

# CORS Origins (ACTUALIZAR DESPUÉS con URL de Vercel)
CORS_ORIGINS=http://localhost:5173,https://arc-raiders.vercel.app
```

### 3.3 Configurar Comandos (Opcional)

Railway debería detectar automáticamente, pero si no:

1. Settings → **"Build Command"**: `npm install`
2. Settings → **"Start Command"**: `npm start`

---

## 🌐 Paso 4: Generar Dominio Público (2 min)

1. Ve a pestaña **"Settings"**
2. Busca sección **"Networking"** o **"Domains"**
3. Click **"Generate Domain"**
4. Railway creará algo como: **`arc-raiders-backend-production.up.railway.app`**
5. **📝 COPIA ESTA URL** - la necesitarás para Vercel

---

## 🚀 Paso 5: Deploy (2 min)

1. Railway debería deployar automáticamente
2. Ve a pestaña **"Deployments"**
3. Verás el progreso del build
4. Espera a que diga **"Success"** (2-3 minutos)
5. Click en **"View Logs"** para ver el output

**Deberías ver:**

```
🚀 Server running on port 3001
✅ Connected to MongoDB Atlas
Socket.io listening on port 3001
Admin service initialized
```

---

## ✅ Paso 6: Verificar que Funciona (1 min)

1. Copia tu URL de Railway (ej: `https://arc-raiders-backend-production.up.railway.app`)
2. En tu navegador, abre: `https://tu-url.railway.app/api/health`
3. Deberías ver algo como:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-12-02T..."
   }
   ```

Si ves esto, **¡el backend está funcionando!** ✅

---

## 🎨 Paso 7: Deploy Frontend a Vercel (5 min)

### 7.1 Preparar Variable de Entorno

Antes de deployar a Vercel, necesitas la URL de Railway:

**Tu URL de Railway:** `https://arc-raiders-backend-production.up.railway.app`

### 7.2 Deploy a Vercel

1. Ve a **https://vercel.com**
2. Login con GitHub
3. Click **"Add New Project"**
4. Importa **`Arc001`**
5. Vercel detecta **Vite** automáticamente
6. En **"Environment Variables"**, agrega:
   ```
   Name: VITE_API_URL
   Value: https://tu-url.railway.app/api
   ```
7. Click **"Deploy"**
8. Espera 2-3 minutos
9. **📝 COPIA la URL de Vercel** (ej: `https://arc-raiders.vercel.app`)

---

## 🔄 Paso 8: Actualizar CORS en Railway (2 min)

Ahora que tienes la URL de Vercel, actualiza CORS:

1. Vuelve a **Railway Dashboard**
2. Tu servicio → pestaña **"Variables"**
3. Busca **`CORS_ORIGINS`**
4. Actualiza a:
   ```
   https://arc-raiders.vercel.app,https://arc-raiders-git-*.vercel.app
   ```
   (Incluye el wildcard para preview deployments)
5. El servicio se redeploya automáticamente (30 segundos)

---

## 🗄️ Paso 9: Verificar MongoDB Atlas (2 min)

Asegúrate de que MongoDB Atlas permite conexiones desde Railway:

1. Ve a **https://cloud.mongodb.com**
2. Tu cluster → **"Network Access"**
3. Verifica que existe: **`0.0.0.0/0`** (Allow access from anywhere)
4. Si no existe:
   - Click **"Add IP Address"**
   - **"Allow Access from Anywhere"**
   - IP: `0.0.0.0/0`
   - Click **"Confirm"**

---

## 🎉 Paso 10: Probar la App Completa (5 min)

1. Abre tu app en Vercel: `https://arc-raiders.vercel.app`
2. Prueba:
   - ✅ **Registro de usuario**
   - ✅ **Login**
   - ✅ **Crear post en comunidad**
   - ✅ **Publicar en Marketplace**
   - ✅ **Enviar mensaje**
   - ✅ **Instalar PWA** (click en banner)
   - ✅ **Modo offline** (desconecta WiFi y recarga)

---

## 🔧 Troubleshooting

### Error: "Cannot connect to MongoDB"

- Verifica que `MONGODB_URI` esté correcta en Railway Variables
- Verifica que MongoDB Atlas permita `0.0.0.0/0`
- Check logs en Railway: Deployments → View Logs

### Error: "CORS blocked"

- Verifica que `CORS_ORIGINS` incluya tu URL de Vercel
- Formato correcto: `https://tu-app.vercel.app` (sin barra al final)
- Redeploya backend en Railway si cambias CORS

### Error: "502 Bad Gateway"

- El backend puede estar iniciando (tarda 30-60 segundos la primera vez)
- Espera 1 minuto y recarga
- Check logs en Railway

### WebSockets no funcionan (chat)

- Railway soporta WebSockets por defecto
- Verifica que frontend use `wss://` en producción (no `ws://`)
- Check console del navegador para errores

---

## 📊 Monitoreo

### Railway Dashboard

- **Deployments**: Ver historial de deploys
- **Metrics**: CPU, RAM, Network usage
- **Logs**: Logs en tiempo real
- **Settings**: Cambiar variables, reiniciar servicio

### Vercel Dashboard

- **Deployments**: Ver historial
- **Analytics**: Visitas, performance
- **Logs**: Function logs

---

## 💰 Costos y Límites

### Railway Free Tier

- **$5 USD/mes grátis** (~500 horas)
- Si se acaba, app sigue activa pero pide upgrade
- Monitorea uso en Dashboard → Usage

### Vercel Free Tier

- **100GB bandwidth/mes**
- **Unlimited deployments**
- Suficiente para miles de usuarios

---

## 🔄 Deploy Automático

### Railway

- **Auto-deploy activado** por defecto
- Cada `git push` a `main` = redeploy automático
- Tarda ~2-3 minutos

### Vercel

- **Auto-deploy activado** por defecto
- Cada `git push` a `main` = redeploy automático
- Preview deployments en cada PR
- Tarda ~2-3 minutos

### Workflow Completo

```bash
# 1. Hacer cambios
git add .
git commit -m "Nueva feature"
git push origin main

# 2. Railway detecta push → backend se actualiza (2-3 min)
# 3. Vercel detecta push → frontend se actualiza (2-3 min)
# 4. App actualizada en producción ✅
```

---

## ✅ Checklist Final

- [ ] Backend deployado en Railway
- [ ] Frontend deployado en Vercel
- [ ] CORS actualizado con URL de Vercel
- [ ] MongoDB Atlas permite 0.0.0.0/0
- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] Posts en comunidad funcionan
- [ ] Marketplace funciona
- [ ] Mensajes funcionan
- [ ] WebSockets conectados
- [ ] PWA se puede instalar
- [ ] Modo offline funciona
- [ ] Admin panel accesible

---

## 🎯 URLs Finales

**Backend (Railway):**

```
https://arc-raiders-backend-production.up.railway.app
```

**Frontend (Vercel):**

```
https://arc-raiders.vercel.app
```

**API Endpoints:**

```
POST https://tu-railway.app/api/auth/register
POST https://tu-railway.app/api/auth/login
GET  https://tu-railway.app/api/community/posts
...
```

---

## 🚀 ¡Listo para Lanzar!

Tu app está 100% deployada y lista para usuarios reales:

- ✅ Backend siempre activo (Railway)
- ✅ Frontend en CDN global (Vercel)
- ✅ PWA instalable en móviles
- ✅ Deploy automático configurado
- ✅ $0 de costo mensual

**¡Comparte tu app con el mundo!** 🎉
