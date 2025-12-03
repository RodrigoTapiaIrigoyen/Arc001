# 🚀 Despliegue Gratuito - Vercel + Render

## 📋 Requisitos Previos

- Cuenta en GitHub (ya tienes el repo)
- Cuenta en Vercel (https://vercel.com) - GRATIS
- Cuenta en Render (https://render.com) - GRATIS
- Cuenta en MongoDB Atlas (ya la tienes) - GRATIS

---

## 🎯 PASO 1: Preparar el Backend para Render

### 1.1 Crear archivo `render.yaml` en la raíz del proyecto

```yaml
services:
  - type: web
    name: arc-raiders-backend
    env: node
    region: oregon
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: CORS_ORIGINS
        sync: false
```

### 1.2 Generar JWT_SECRET seguro

Ejecuta en tu terminal:

```bash
openssl rand -base64 64
```

Copia el resultado, lo necesitarás en Render.

---

## 🌐 PASO 2: Desplegar Backend en Render

### 2.1 Conectar Repositorio

1. Ve a https://render.com y crea una cuenta (usa GitHub)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio `Arc001`
4. Configuración:
   - **Name**: `arc-raiders-backend`
   - **Region**: Oregon (USA)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

### 2.2 Configurar Variables de Entorno

En la sección **Environment**, agrega:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://tu_usuario:tu_password@cluster.mongodb.net/arc_raiders?retryWrites=true&w=majority
JWT_SECRET=tu_jwt_secret_generado_con_openssl
CORS_ORIGINS=https://tu-app.vercel.app
RATE_LIMIT_MAX_REQUESTS=50
```

**⚠️ IMPORTANTE**:

- Reemplaza `MONGODB_URI` con tu URI real de MongoDB Atlas
- Usa el `JWT_SECRET` que generaste con openssl
- Por ahora deja `CORS_ORIGINS` como está, lo actualizaremos después

### 2.3 Desplegar

1. Click en **"Create Web Service"**
2. Espera 5-10 minutos (primera vez es más lento)
3. Copia la URL que te da (ejemplo: `https://arc-raiders-backend.onrender.com`)

### 2.4 Configurar MongoDB Atlas IP Whitelist

1. Ve a MongoDB Atlas → Network Access
2. Click en **"Add IP Address"**
3. Click en **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click en **"Confirm"**

**Nota**: En Render Free, la IP cambia, por eso necesitas permitir todas.

---

## 💻 PASO 3: Preparar Frontend para Vercel

### 3.1 Crear archivo `.env.production` en la raíz

```env
VITE_API_URL=https://arc-raiders-backend.onrender.com/api
```

Reemplaza con la URL real que te dio Render.

### 3.2 Actualizar `vite.config.ts`

Ya está configurado, pero verifica que tenga:

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
```

---

## 🎨 PASO 4: Desplegar Frontend en Vercel

### 4.1 Preparar el Proyecto

1. Asegúrate de que todos los cambios estén en GitHub:

```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### 4.2 Conectar con Vercel

1. Ve a https://vercel.com y crea una cuenta (usa GitHub)
2. Click en **"Add New..."** → **"Project"**
3. Importa tu repositorio `Arc001`
4. Configuración automática:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (raíz)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 4.3 Configurar Variables de Entorno

En **Environment Variables**, agrega:

```
VITE_API_URL=https://arc-raiders-backend.onrender.com/api
```

Marca las 3 opciones: Production, Preview, Development

### 4.4 Desplegar

1. Click en **"Deploy"**
2. Espera 2-3 minutos
3. ¡Listo! Tu app está en vivo
4. Copia la URL (ejemplo: `https://arc-raiders.vercel.app`)

---

## 🔄 PASO 5: Actualizar CORS en Backend

### 5.1 Actualizar Variable en Render

1. Ve a tu servicio en Render
2. Click en **"Environment"**
3. Edita `CORS_ORIGINS` y cambia a:

```
https://arc-raiders.vercel.app
```

(Usa la URL real que te dio Vercel)

4. Click en **"Save Changes"**
5. El backend se reiniciará automáticamente

---

## ✅ PASO 6: Verificar que Todo Funcione

### 6.1 Pruebas Básicas

1. Abre tu app en Vercel: `https://tu-app.vercel.app`
2. Prueba registrar un usuario nuevo
3. Prueba iniciar sesión
4. Verifica que carguen las armas/items
5. Prueba el chat en tiempo real
6. Crea una publicación en Community
7. Crea un artículo en Marketplace

### 6.2 Si algo falla:

**Backend logs en Render**:

- Ve a tu servicio → "Logs"
- Revisa errores de conexión a MongoDB

**Frontend logs en Vercel**:

- Abre la consola del navegador (F12)
- Revisa errores de CORS o API

---

## 📊 Limitaciones del Plan Gratuito

### Render Free:

- ⏰ El servicio "duerme" después de 15 minutos de inactividad
- 🐌 Primera petición tarda ~30 segundos en despertar
- 💾 750 horas/mes (suficiente si no tienes mucho tráfico)
- 🔄 Se reinicia automáticamente cada mes

**Solución**: Usar un servicio de "keep-alive" como:

- UptimeRobot (https://uptimerobot.com) - hace ping cada 5 minutos
- Cron-job.org (https://cron-job.org) - GRATIS

### Vercel Free:

- ✅ 100 GB ancho de banda/mes
- ✅ Despliegues ilimitados
- ✅ SSL automático
- ✅ CDN global
- ⚠️ Solo sitios públicos (no privados)

### MongoDB Atlas Free:

- ✅ 512 MB almacenamiento
- ✅ Suficiente para ~500-1000 usuarios
- ⚠️ Backups manuales

---

## 🔧 Comandos Útiles

### Actualizar Backend:

```bash
git add .
git commit -m "Update backend"
git push origin main
```

Render detecta el cambio y redespliega automáticamente.

### Actualizar Frontend:

```bash
git add .
git commit -m "Update frontend"
git push origin main
```

Vercel detecta el cambio y redespliega automáticamente.

### Ver logs en tiempo real:

- **Render**: Dashboard → Logs
- **Vercel**: Dashboard → Deployments → View Function Logs

---

## 🎯 Siguientes Pasos (Post-Lanzamiento)

1. **Configurar Dominio Personalizado** (Opcional):

   - Compra dominio en Namecheap (~$10/año)
   - Configura DNS en Vercel (automático)
   - Actualiza CORS_ORIGINS en Render

2. **Monitoreo**:

   - Configura UptimeRobot para mantener backend activo
   - Configura alertas en Render para downtime

3. **Analytics** (Opcional):

   - Google Analytics
   - Plausible Analytics (más privado)

4. **SEO Básico**:
   - Agregar meta tags en `index.html`
   - Crear sitemap.xml
   - Agregar robots.txt

---

## 🆘 Problemas Comunes

### "502 Bad Gateway" en Frontend

- El backend está durmiendo (espera 30 seg)
- O CORS_ORIGINS mal configurado

### "Connection Refused" en Backend

- MongoDB IP no está en whitelist
- MONGODB_URI incorrecta

### WebSockets no conectan

- Render Free soporta WebSockets ✅
- Verifica que uses `wss://` en producción

### Primera carga muy lenta

- Normal en Render Free (backend durmiendo)
- Configura UptimeRobot para solucionar

---

## 💰 Costo Total: **$0.00/mes**

Todo es 100% gratuito mientras tengas:

- Menos de 100GB tráfico/mes en Vercel
- Menos de 750 horas/mes en Render
- Menos de 512MB datos en MongoDB

Para una app nueva, esto es más que suficiente para los primeros meses.

---

## 🚀 ¡Listo para Lanzar!

Una vez completados todos los pasos, tu app estará:

- ✅ En producción
- ✅ Con SSL (HTTPS)
- ✅ Con dominio público
- ✅ Disponible 24/7 (con pequeñas pausas en Render)
- ✅ Completamente GRATIS

¡Comparte tu URL con tus primeros usuarios beta! 🎉
