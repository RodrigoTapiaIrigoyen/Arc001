# 🚀 Configuración de CI/CD Automático

## Opción 1: Vercel Auto-Deploy (Recomendado) ⭐

Esta es la opción más simple - Vercel detecta cambios automáticamente.

### Configuración (5 minutos):

1. **Conecta tu repo a Vercel:**

   - Ve a https://vercel.com/new
   - Importa tu repositorio `Arc001`
   - Vercel detecta que es un proyecto Vite
   - Configuración automática ✅

2. **Variables de entorno en Vercel:**

   - En tu proyecto → Settings → Environment Variables
   - Agrega:
     ```
     VITE_API_URL = https://tu-backend.onrender.com/api
     ```

3. **¡Listo!** 🎉
   - Cada `git push` a `main` = deploy automático
   - Preview deployments en cada Pull Request
   - Rollback instantáneo si algo falla
   - CDN global con Vercel Edge Network

### Configuración de Vercel:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

**Esto se configura automáticamente.**

---

## Opción 2: GitHub Actions (Manual)

Si prefieres más control, usa el archivo que creamos:

### Configuración:

1. **Obtener tokens de Vercel:**

   ```bash
   # Instalar Vercel CLI
   npm i -g vercel

   # Login
   vercel login

   # Link tu proyecto
   cd /home/rodrigotapia/Arc001
   vercel link
   ```

2. **Obtener IDs:**

   ```bash
   # Ver .vercel/project.json
   cat .vercel/project.json
   ```

   Te dará:

   ```json
   {
     "orgId": "team_xxxxx",
     "projectId": "prj_xxxxx"
   }
   ```

3. **Agregar Secrets en GitHub:**

   - Ve a tu repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Agrega:
     - `VERCEL_TOKEN`: Tu token de Vercel (https://vercel.com/account/tokens)
     - `VERCEL_ORG_ID`: El orgId de .vercel/project.json
     - `VERCEL_PROJECT_ID`: El projectId de .vercel/project.json
     - `VITE_API_URL`: https://tu-backend.onrender.com/api

4. **El workflow ya está creado:**
   - `.github/workflows/deploy.yml` ✅
   - Se ejecutará automáticamente en cada push a main

---

## Opción 3: Render Auto-Deploy (Backend)

Para el backend en Render:

### Configuración:

1. **En tu proyecto de Render:**

   - Settings → Auto-Deploy
   - ✅ **Activar**: "Yes"
   - Branch: `main`

2. **¡Listo!**
   - Cada push a `main` redeploys el backend automáticamente
   - Tarda ~5 minutos
   - Logs en tiempo real

---

## 🎯 Flujo de Trabajo Recomendado

### Opción Simple (Vercel + Render Auto):

```bash
# 1. Hacer cambios
git add .
git commit -m "Nueva feature"
git push origin main

# 2. Vercel detecta el push
# 3. Build automático (2-3 min)
# 4. Deploy a producción ✅

# 5. Render detecta el push
# 6. Backend se actualiza (5 min)
# 7. Backend en producción ✅
```

**Sin configuración adicional necesaria** - Todo automático.

---

## Configuración Adicional: Preview Deployments

Vercel crea deployments de preview automáticamente para:

- ✅ Pull Requests
- ✅ Branches diferentes a main

### Ejemplo de flujo:

```bash
# Crear feature branch
git checkout -b feature/nueva-funcionalidad

# Hacer cambios
git add .
git commit -m "WIP: Nueva funcionalidad"
git push origin feature/nueva-funcionalidad

# Crear Pull Request en GitHub
# Vercel automáticamente crea preview URL:
# https://arc-raiders-git-feature-nueva-funcionalidad.vercel.app
```

Puedes probar el preview antes de mergear a producción.

---

## Monitoreo de Deployments

### Vercel Dashboard:

- Ve a https://vercel.com/dashboard
- Click en tu proyecto
- Verás:
  - ✅ Último deployment
  - 📊 Build logs
  - 🌐 URLs de preview
  - 📈 Analytics

### Render Dashboard:

- Ve a https://dashboard.render.com
- Click en tu servicio
- Verás:
  - ✅ Deploy history
  - 📋 Logs en tiempo real
  - 📊 Métricas de uso

---

## Rollback Rápido

Si algo sale mal:

### Vercel:

1. Dashboard → Deployments
2. Click en deployment anterior
3. Click "Promote to Production"
4. ✅ Rollback en 30 segundos

### Render:

1. Dashboard → Deploy history
2. Click en deployment anterior
3. "Redeploy"
4. ✅ Rollback en 5 minutos

---

## Notificaciones de Deploy

### Configurar en Vercel:

1. Settings → Git Integration
2. Comentarios en Pull Requests ✅
3. Notificaciones en Slack (opcional)
4. Webhooks personalizados (opcional)

### Configurar en Render:

1. Settings → Notifications
2. Email on deploy ✅
3. Slack webhook (opcional)
4. Discord webhook (opcional)

---

## 📊 Resumen de Opciones

| Método             | Dificultad   | Tiempo Setup | Velocidad Deploy | Recomendado  |
| ------------------ | ------------ | ------------ | ---------------- | ------------ |
| **Vercel Auto**    | ⭐ Fácil     | 5 min        | 2-3 min          | ✅ SÍ        |
| **GitHub Actions** | ⭐⭐⭐ Medio | 20 min       | 3-5 min          | Para equipos |
| **Render Auto**    | ⭐ Fácil     | 2 min        | 5-10 min         | ✅ SÍ        |

---

## 🎯 Siguiente Paso

**Opción Recomendada: Vercel Auto + Render Auto**

1. Sigue `DEPLOYMENT_FREE.md`
2. Al conectar Vercel, **activa Auto-Deploy** ✅
3. Al configurar Render, **activa Auto-Deploy** ✅
4. Listo - push y olvídate

**Resultado:**

```bash
git push origin main
# ⏳ Espera 5-10 minutos
# ✅ Frontend actualizado en Vercel
# ✅ Backend actualizado en Render
# 🎉 Producción actualizada
```

---

## ⚠️ Importante: Secrets

**NUNCA** hagas commit de:

- ❌ `.env` (ya está en .gitignore)
- ❌ Tokens de Vercel
- ❌ MongoDB URI con password
- ❌ JWT_SECRET

**SIEMPRE** usa variables de entorno en:

- ✅ Vercel Dashboard
- ✅ Render Dashboard
- ✅ GitHub Secrets (para Actions)

---

## 🧪 Testing Antes de Deploy

```bash
# Local testing
npm run build
npm run preview
# Abrir http://localhost:4173

# Verificar:
# - PWA funciona
# - Service Worker registrado
# - Manifest correcto
# - App se puede instalar
# - Iconos correctos
```

Una vez verificado localmente → Push a GitHub → Deploy automático ✅
