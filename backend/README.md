# Arc Raiders Backend - MetaForge Integration

## 🚀 Sincronización con MetaForge API

Este backend se conecta a **MetaForge** para obtener datos actualizados de Arc Raiders y almacenarlos en MongoDB.

## 📡 Endpoints Disponibles

### Sincronización

#### `POST /api/sync/items`

Sincroniza items/weapons desde MetaForge

```bash
curl -X POST http://localhost:3001/api/sync/items
```

#### `POST /api/sync/quests`

Sincroniza quests/misiones desde MetaForge

```bash
curl -X POST http://localhost:3001/api/sync/quests
```

#### `POST /api/sync/all`

Sincroniza TODO (items + quests)

```bash
curl -X POST http://localhost:3001/api/sync/all
```

#### `GET /api/sync/stats`

Obtiene estadísticas de sincronización

```bash
curl http://localhost:3001/api/sync/stats
```

### Datos

#### `GET /api/weapons`

Obtiene todas las armas

```bash
curl http://localhost:3001/api/weapons
```

#### `GET /api/quests`

Obtiene todas las misiones

```bash
curl http://localhost:3001/api/quests
```

#### `GET /api/marketplace`

Obtiene listings del marketplace

```bash
curl http://localhost:3001/api/marketplace
```

## 🔧 Uso desde el Frontend

```typescript
// Sincronizar datos
const syncAll = async () => {
  const response = await fetch("http://localhost:3001/api/sync/all", {
    method: "POST",
  });
  const result = await response.json();
  console.log("Sync result:", result);
};

// Obtener datos sincronizados
const getWeapons = async () => {
  const response = await fetch("http://localhost:3001/api/weapons");
  const weapons = await response.json();
  return weapons;
};
```

## 📦 Estructura de Datos

### Weapon

```javascript
{
  name: "Plasma Rifle",
  type: "Rifle",
  damage: 85,
  dps: 425,
  fire_rate: 5,
  magazine_size: 30,
  rarity: "Legendary",
  description: "...",
  metaforge_id: "...",
  source: "metaforge",
  synced_at: Date
}
```

### Quest

```javascript
{
  name: "First Strike",
  type: "Main",
  level: 5,
  description: "...",
  objectives: [...],
  rewards: {...},
  location: "Frozen Wastes",
  metaforge_id: "...",
  source: "metaforge",
  synced_at: Date
}
```

## 🎯 Próximos Pasos

1. Ejecutar sincronización inicial:

   ```bash
   curl -X POST http://localhost:3001/api/sync/all
   ```

2. Verificar datos:

   ```bash
   curl http://localhost:3001/api/sync/stats
   ```

3. Configurar sincronización automática (cron job o intervalos)

## 🔗 APIs Externas

- **MetaForge**: https://api.metaforge.gg/
  - Items: `/items`
  - Quests: `/quests`
  - Map Data: `/map-data`
  - ARCs: `/arcs`
  - Traders: `/traders`
