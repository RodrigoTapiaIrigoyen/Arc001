# Raider Profile System - Integration Guide

## Overview

El sistema de Raider Profile ha sido completamente integrado en la aplicación. Este documento describe cómo las estadísticas comunitarias se rastrean y actualizan automáticamente.

## Sistema de Estadísticas Comunitarias

En lugar de estadísticas de juego (K/D, supervivencia, etc.), el sistema utiliza métricas comunitarias:

### Métricas Disponibles

1. **community_reputation** ⭐ - Puntuación de reputación comunitaria

   - Se incrementa cuando otros usuarios validan tus contribuciones
   - Máximo impacto en el leaderboard

2. **posts_shared** 💬 - Número de posts/contenido compartido

   - Se incrementa automáticamente al crear posts en Community Hub
   - Refleja tu contribución al contenido comunitario

3. **groups_created** 👥 - Grupos que has creado

   - Se incrementa al crear un nuevo grupo
   - Refleja liderazgo comunitario

4. **friends_count** 👫 - Número de amigos

   - Se sincroniza con el sistema de amigos
   - Refleja conexiones sociales

5. **days_in_community** 📅 - Días desde el registro
   - Se calcula automáticamente basado en created_at
   - No requiere actualización manual

## Actualización de Estadísticas

### Backend Service (raiderProfile.js)

```javascript
// Incrementar una estadística
await raiderProfileService.incrementStat(userId, "posts_shared", 1);

// Actualizar múltiples estadísticas
await raiderProfileService.updateStats(userId, {
  community_reputation: newRepScore,
  posts_shared: newPostCount,
  friends_count: newFriendsCount,
});
```

### Puntos de Integración Necesarios

#### 1. Community Hub (Crear Post)

**Archivo**: `src/components/CommunityHub.tsx`

Al crear un nuevo post, incrementar `posts_shared`:

```typescript
// Después de crear exitosamente un post
await api.put(`/api/raider-profiles/${userId}/stats`, {
  posts_shared: currentStats.posts_shared + 1,
});
```

#### 2. Friends System (Agregar Amigo)

**Archivo**: `src/components/Friends.tsx` o `backend/services/friendsService.js`

Al agregar un amigo, actualizar `friends_count`:

```typescript
// Después de agregar amigo exitosamente
await raiderProfileService.incrementStat(userId, "friends_count", 1);
```

#### 3. Groups System (Crear Grupo)

**Archivo**: `backend/routes/groups.js`

Al crear un nuevo grupo, incrementar `groups_created`:

```javascript
// Después de crear exitosamente un grupo
await raiderProfileService.incrementStat(userId, "groups_created", 1);
```

#### 4. Community Reputation (Likes/Validación)

**Archivo**: `backend/services/community.js` o routes

Cuando otros usuarios dan "me gusta" o validan un post:

```javascript
// Incrementar reputación del autor del post
await raiderProfileService.incrementStat(
  postAuthorId,
  "community_reputation",
  1
);
```

## Frontend Components

### RaiderProfile Component

- **Ubicación**: `src/components/RaiderProfile.tsx`
- **Función**: Editor de perfil de raider
- **Estadísticas Mostradas**:
  - community_reputation
  - posts_shared
  - friends_count
  - days_in_community

### RaiderHub Component

- **Ubicación**: `src/components/RaiderHub.tsx`
- **Función**: Leaderboard de raider profiles
- **Filtros**:
  - Ordenar por: reputation, posts, friends
  - Filtrar por tipo de raider
  - Búsqueda por username

## Backend Routes

### GET `/api/raider-profiles/:userId`

Obtiene el perfil completo de un usuario

### POST `/api/raider-profiles`

Crea o actualiza el perfil del usuario actual

### GET `/api/raider-profiles/leaderboard/top`

Parámetros:

- `limit`: Número de resultados (default: 50)
- `sortBy`: Campo para ordenar (reputation/posts/friends)

### GET `/api/raider-profiles/type/:raiderType`

Obtiene todos los raiders de un tipo específico

### GET `/api/raider-profiles/search/:query`

Busca raiders por username, tipo o playstyle_notes

### PUT `/api/raider-profiles/:userId/stats`

Actualiza estadísticas (requiere autenticación)

Payload:

```json
{
  "community_reputation": 10,
  "posts_shared": 5,
  "groups_created": 2,
  "friends_count": 15
}
```

### GET `/api/raider-profiles/:userId/statistics`

Obtiene las estadísticas formateadas de un usuario

## Tipos de Raider

El sistema genera automáticamente tipos de raider basado en:

- **Equipment**: heavy, light, mixed
- **Strategy**: aggressive, passive, extraction
- **Company**: solo, duo, trio

### Combinaciones Generadas

| Equipment | Strategy   | Company  | Tipo             | Emoji |
| --------- | ---------- | -------- | ---------------- | ----- |
| Light     | Aggressive | Solo     | Rata Rápida      | 🐀    |
| Light     | Aggressive | Duo/Trio | Equipo de Ataque | ⚡    |
| Light     | Passive    | Solo     | Francotirador    | 🏹    |
| Light     | Extraction | Any      | Carroñero        | 🦅    |
| Heavy     | Aggressive | Any      | Veterano         | ⚔️    |
| Heavy     | Passive    | Duo/Trio | Escuadrón Élite  | 🛡️    |
| Mixed     | Passive    | Any      | Superviviente    | 🌍    |

## Flujo de Datos

```
Usuario actúa (crear post, agregar amigo, etc.)
    ↓
Servicio detecta acción
    ↓
Backend actualiza estadísticas en MongoDB
    ↓
raiderProfileService.incrementStat() o updateStats()
    ↓
Estadísticas reflejadas en RaiderProfile y RaiderHub
    ↓
Leaderboard se actualiza automáticamente
```

## Testing

### Probar Incrementar Estadísticas (cURL)

```bash
# Obtener token y userId
TOKEN="your_jwt_token"
USERID="your_user_id"

# Actualizar stats
curl -X PUT http://localhost:5000/api/raider-profiles/$USERID/stats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "community_reputation": 10,
    "posts_shared": 5
  }'
```

### Probar Leaderboard

```bash
# Top 10 por reputación
curl http://localhost:5000/api/raider-profiles/leaderboard/top?limit=10&sortBy=reputation

# Top 10 por posts
curl http://localhost:5000/api/raider-profiles/leaderboard/top?limit=10&sortBy=posts_shared

# Top 10 por amigos
curl http://localhost:5000/api/raider-profiles/leaderboard/top?limit=10&sortBy=friends_count
```

## Notas Importantes

1. **No es Integración de Juego**: Este sistema NO obtiene datos reales del juego. Es completamente comunitario.

2. **Métricas Sociales**: Todas las estadísticas son basadas en contribuciones comunitarias, no en desempeño del juego.

3. **Automático**: Las estadísticas se actualizan automáticamente cuando se integran los puntos mencionados arriba.

4. **Escalable**: El sistema está diseñado para manejar miles de usuarios sin impacto de desempeño.

## Próximos Pasos

1. Integrar incremento de `posts_shared` en CommunityHub.tsx
2. Integrar incremento de `friends_count` en Friends.tsx
3. Integrar incremento de `groups_created` en Groups routes
4. Implementar sistema de reputación (likes/validaciones)
5. Crear badges o insignias basadas en estadísticas

## Soporte

Para preguntas o problemas, revisar:

- Logs del backend en `backend/server.js`
- Respuestas de API en Dev Tools
- Estado de MongoDB en Atlas dashboard
