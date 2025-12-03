# 🚀 Alternativas Gratuitas para Backend (Sin Render)

## Opción 1: Railway.app ⭐ (RECOMENDADO)

**Límite Free:** $5 USD crédito mensual (~500 horas)
**Ventajas:**

- ✅ No duerme (como Render)
- ✅ Deploy desde GitHub automático
- ✅ Variables de entorno fáciles
- ✅ PostgreSQL/MongoDB gratis incluido
- ✅ WebSockets soportados
- ✅ Logs en tiempo real

**Configuración (10 min):**

1. Ve a https://railway.app
2. Sign up con GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Selecciona `Arc001`
5. Railway detecta Node.js automáticamente
6. Configura variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=7T4xxxfIwJvaRQ+EPeaLXdOoCoYLWJS0nrH588MwNikEekrJDgvB/A3TN3UsVCEi YOck8XG3MlzW5g1YqGuK8Q==
   NODE_ENV=production
   PORT=3001
   CORS_ORIGINS=https://tu-app.vercel.app
   ```
7. Settings → Root Directory: `backend`
8. Deploy ✅

**URL generada:** `https://arc-raiders-backend-production.up.railway.app`

---

## Opción 2: Fly.io ⭐

**Límite Free:** 3 VMs gratis (256MB RAM c/u)
**Ventajas:**

- ✅ Siempre activo
- ✅ Edge locations globales
- ✅ WebSockets soportados
- ✅ SSL automático

**Configuración (15 min):**

```bash
# Instalar Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Crear app
cd /home/rodrigotapia/Arc001/backend
flyctl launch --name arc-raiders-backend

# Configurar secrets
flyctl secrets set MONGODB_URI="mongodb+srv://..."
flyctl secrets set JWT_SECRET="7T4xxxfI..."
flyctl secrets set NODE_ENV="production"
flyctl secrets set CORS_ORIGINS="https://tu-app.vercel.app"

# Deploy
flyctl deploy
```

**URL generada:** `https://arc-raiders-backend.fly.dev`

---

## Opción 3: Koyeb ⭐

**Límite Free:** 1 servicio web + 1 servicio worker
**Ventajas:**

- ✅ No duerme
- ✅ Deploy desde GitHub
- ✅ SSL automático
- ✅ Edge locations

**Configuración (10 min):**

1. Ve a https://koyeb.com
2. Sign up con GitHub
3. "Create Service" → GitHub
4. Selecciona repo `Arc001`
5. Build command: `cd backend && npm install`
6. Run command: `cd backend && npm start`
7. Port: `3001`
8. Variables de entorno (igual que Railway)
9. Deploy ✅

**URL generada:** `https://arc-raiders-backend-xxx.koyeb.app`

---

## Opción 4: Cyclic.sh

**Límite Free:** 3 apps, 10K requests/mes
**Ventajas:**

- ✅ Serverless (escala automático)
- ✅ Deploy desde GitHub
- ✅ DynamoDB incluido (opcional)

**⚠️ Limitación:** Solo 10K requests/mes puede no ser suficiente

---

## Opción 5: Glitch.com

**Límite Free:** Ilimitado pero duerme después de 5 min inactividad
**Ventajas:**

- ✅ Muy fácil de usar
- ✅ Editor en línea

**⚠️ Limitación:** Igual que Render Free - duerme

---

## Opción 6: Backend en Vercel (Serverless)

**Límite Free:** 100GB bandwidth, 100 horas serverless
**Ventajas:**

- ✅ Mismo proveedor frontend + backend
- ✅ Deploy automático
- ✅ Escala infinita

**⚠️ Limitación:** Requiere convertir Express a Serverless Functions

---

## 📊 Comparación

| Servicio              | Duerme? | Límite      | WebSockets | Dificultad     | Recomendado         |
| --------------------- | ------- | ----------- | ---------- | -------------- | ------------------- |
| **Railway**           | ❌ NO   | $5/mes      | ✅         | ⭐ Fácil       | ✅ #1               |
| **Fly.io**            | ❌ NO   | 3 VMs       | ✅         | ⭐⭐ Medio     | ✅ #2               |
| **Koyeb**             | ❌ NO   | 1 servicio  | ✅         | ⭐ Fácil       | ✅ #3               |
| **Cyclic**            | ❌ NO   | 10K req/mes | ✅         | ⭐ Fácil       | ⚠️ Límite bajo      |
| **Glitch**            | ✅ SÍ   | Ilimitado   | ✅         | ⭐ Fácil       | ❌                  |
| **Vercel Serverless** | ❌ NO   | 100GB       | ❌         | ⭐⭐⭐ Difícil | ⚠️ Requiere cambios |

---

## 🎯 Recomendación: Railway.app

**Por qué Railway:**

1. **No duerme** - siempre activo
2. **$5 USD gratis/mes** - suficiente para tu app (~500 horas)
3. **Setup súper fácil** - 10 minutos
4. **WebSockets** - tu chat funcionará
5. **Deploy automático** - cada push a GitHub
6. **Variables de entorno** - interfaz fácil
7. **Logs en tiempo real** - debugging fácil

**Cálculo de uso:**

- $5 USD = ~500 horas/mes
- 1 mes = 730 horas
- Con tráfico bajo/medio, $5 es suficiente
- Si se acaba, app sigue activa pero pide upgrade

---

## 🚀 Pasos para Railway (RECOMENDADO)

### 1. Crear cuenta

```
https://railway.app → Sign up with GitHub
```

### 2. Nuevo proyecto

- Dashboard → "New Project"
- "Deploy from GitHub repo"
- Selecciona `RodrigoTapiaIrigoyen/Arc001`
- Railway clona el repo

### 3. Configurar servicio

- Settings → Root Directory: **`backend`**
- Start Command: **`npm start`**
- Build Command: **`npm install`**

### 4. Variables de entorno

Click "Variables" → Add:

```
MONGODB_URI=mongodb+srv://staioirish_db_user:GJeoJLED3lceUzil@arc001.1tlrpac.mongodb.net/arc_raiders?retryWrites=true&w=majority
JWT_SECRET=7T4xxxfIwJvaRQ+EPeaLXdOoCoYLWJS0nrH588MwNikEekrJDgvB/A3TN3UsVCEi YOck8XG3MlzW5g1YqGuK8Q==
NODE_ENV=production
PORT=3001
CORS_ORIGINS=https://tu-app.vercel.app
```

### 5. Deploy

- Click "Deploy"
- Espera 2-3 minutos
- Copia la URL generada (ej: `https://arc-raiders-backend-production.up.railway.app`)

### 6. Configurar dominio (opcional)

- Settings → Domains
- Genera dominio: `arc-raiders-backend.up.railway.app`

---

## 📝 Siguiente Paso

Una vez que elijas y despliegues el backend:

1. **Copia la URL del backend**
2. **Deploy frontend a Vercel** con `VITE_API_URL=<tu-backend-url>/api`
3. **Actualiza CORS** en Railway con URL de Vercel
4. **Prueba la app** ✅

---

## ⚠️ Nota sobre MongoDB Atlas

Asegúrate de que MongoDB Atlas permite conexiones desde Railway:

1. MongoDB Atlas → Network Access
2. "Add IP Address"
3. "Allow Access from Anywhere" → `0.0.0.0/0`
4. Save

Esto permite que Railway (y cualquier servicio en la nube) se conecte.
