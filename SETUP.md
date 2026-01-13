# 🎮 Arc Raiders - Resumen del Sistema

## ✅ Estado Actual

### Backend (Puerto 3001)

- ✅ Express server configurado
- ✅ Conectado a MongoDB Atlas
- ✅ Integración con MetaForge API lista
- ✅ Sistema de sincronización implementado

### Frontend (Puerto 5175)

- ✅ React + TypeScript + Vite
- ✅ Conectado al backend
- ✅ Componentes de visualización listos

### Base de Datos

- ✅ MongoDB Atlas configurado
- ✅ Credenciales de usuario configuradas
- ✅ Cluster: Conectado
- ✅ IP autorizada

## 📡 Integración MetaForge

### Endpoints de Sincronización

```bash
# Sincronizar items/weapons
curl -X POST http://localhost:3001/api/sync/items

# Sincronizar quests
curl -X POST http://localhost:3001/api/sync/quests

# Sincronizar TODO
curl -X POST http://localhost:3001/api/sync/all

# Ver estadísticas
curl http://localhost:3001/api/sync/stats
```

### Datos que se Sincronizan

**Items/Weapons desde MetaForge:**

- Nombre, tipo, stats (damage, dps, fire_rate, etc.)
- Rareza, descripción, imagen
- Se almacenan en collection: `weapons`

**Quests desde MetaForge:**

- Nombre, tipo, nivel
- Descripción, objetivos, recompensas
- Localización
- Se almacenan en collection: `quests`

## 🚀 Cómo Usar

### 1. Iniciar Backend

```bash
cd /home/rodrigotapia/Arc001/backend
npm start
```

### 2. Iniciar Frontend

```bash
cd /home/rodrigotapia/Arc001
npm run dev
```

### 3. Sincronizar Datos (primera vez)

```bash
cd /home/rodrigotapia/Arc001/backend
node test-sync.js
```

O manualmente:

```bash
curl -X POST http://localhost:3001/api/sync/all
```

### 4. Verificar en el Frontend

- Abre http://localhost:5175
- Ve a "Weapons Database" para ver las armas sincronizadas
- Los datos se cargan automáticamente desde MongoDB

## 🔧 Archivos Importantes

### Backend

- `server.js` - Servidor principal
- `services/metaforge.js` - Cliente API de MetaForge
- `services/sync.js` - Lógica de sincronización
- `test-sync.js` - Script de prueba
- `.env` - Credenciales (NO subir a git)

### Frontend

- `src/lib/mongodb.ts` - Cliente API del backend
- `src/components/WeaponsDatabase.tsx` - Vista de armas
- `src/components/Marketplace.tsx` - Vista de marketplace
- `.env` - Configuración frontend

## 🎯 Próximos Pasos Recomendados

1. **Ejecutar sincronización inicial**

   ```bash
   node backend/test-sync.js
   ```

2. **Verificar datos en la UI**

   - Navegar a http://localhost:5175

3. **Configurar sincronización automática**

   - Agregar cron job o intervalo para sync periódico

4. **Personalizar transformación de datos**

   - Ajustar `metaforge.js` según estructura real de la API

5. **Agregar más endpoints de MetaForge**
   - Map data
   - ARCs
   - Traders

## 📚 Documentación API

- **MetaForge**: https://api.metaforge.gg/
- **MongoDB**: https://www.mongodb.com/docs/atlas/
- **Backend README**: `/backend/README.md`

## 🐛 Troubleshooting

**Backend no conecta a MongoDB:**

- Verificar IP en Network Access
- Verificar usuario en Database Access
- Revisar contraseña en `.env`

**Frontend no carga datos:**

- Verificar que backend esté corriendo en puerto 3001
- Verificar CORS en backend
- Revisar consola del navegador

**Sincronización falla:**

- Verificar que MetaForge API esté disponible
- Revisar logs del backend
- Ajustar transformación de datos si estructura cambió
