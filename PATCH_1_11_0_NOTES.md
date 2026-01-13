# 🎮 PARCHE 1.11.0 - ACTUALIZACIONES ARC RAIDERS

**Fecha:** 13 de Enero de 2026

---

## 🎉 NOVEDADES PRINCIPALES

### 📦 NUEVO SET COSMÉTICO: ABYSS

- **Descripción:** Highly anticipated Abyss cosmetic set
- **Disponibilidad:** Todos los sistemas
- **Incluye:** Outfit, backpack, charms, gestures

### 🎁 HITO: 12 MILLONES DE COPIAS VENDIDAS

- Se alcanzó el hito de 12 millones de copias vendidas
- **Regalo especial:** Gilded Pickaxe Raider Tool (para todos los que iniciaron sesión antes del 13 de Enero 11:59 PM CET / 2:59 PM PST / 5:59 PM EST)
- Celebración por pasar los 10 millones de jugadores durante las vacaciones

---

## 🔧 CAMBIOS Y BALANCING

### ⚔️ **KETTLE** (Marksman Rifle)

- **Cambio:** Reduced fire rate
  - Antes: 600
  - Después: 450
- **Razón:** La velocidad de fuego anterior solo era alcanzable por jugadores usando macros, creando dinámicas injustas que favorecen software de terceros
- **Impacto:** PVP más justo y balanceado

### 💣 **TRIGGER 'NADE** (Grenade)

**Cambios:**

1. **Delay de detonación:** Aumentado de 0.7s a 1.5s
   - Da más tiempo a los jugadores para reaccionar
   - Dificulta el timing de detonación en aire
2. **Daño (Damage Falloff):**
   - Concentra más daño en el centro de la explosión
   - Menos daño en áreas alejadas del centro

**Razón:**

- Dominaba los encuentros PVP
- Los jugadores la preferían sobre todas las otras granadas
- Este nerf la hace menos efectiva como "trigger-in-air grenade"
- Mantiene su utilidad como sticky bomb

**Impacto:** Mayor variedad de opciones tácticas en PVP

---

## 🐛 CORRECCIONES DE BUGS

### 🔑 **Exploit de Tarjeta de Acceso (CORREGIDO)**

- **Problema:** Los jugadores podían mantener llaves de habitación después de usarlas
- **Estado:** Solucionado
- **Importancia:** Previene abuso de acceso a áreas restrictas

### 💡 **Mejoras de Iluminación (Stella Montis Night Raid)**

- **Cambio:** Iluminación reducida en algunas áreas
- **Impacto:** Las linternas y la escucha activa ahora son más relevantes y necesarias
- **Gameplay:** Aumenta la dificultad táctica en modo nocturno

---

## 📊 RESUMEN DE CAMBIOS

| Elemento                   | Antes         | Después      | Impacto                        |
| -------------------------- | ------------- | ------------ | ------------------------------ |
| **Kettle Fire Rate**       | 600           | 450          | 🟢 Menos macro abuse           |
| **Trigger 'Nade Delay**    | 0.7s          | 1.5s         | 🟢 Mayor reacción de jugadores |
| **Key Card Exploit**       | ✗ Existente   | ✅ Corregido | 🟢 Seguridad mejorada          |
| **Stella Montis Lighting** | Más brillante | Más oscuro   | 🟢 Gameplay más desafiante     |

---

## 🎯 IMPACTO EN LA COMUNIDAD

### Positivos:

✅ **PVP más justo** - Sin ventaja de macros
✅ **Gameplay más táctico** - Granadas requieren más habilidad
✅ **Exploración más atmosférica** - Linternas tienen propósito
✅ **Cosmética nueva** - Set Abyss atractivo

### Consideraciones:

⚠️ **Kettle menos viable** - Usuarios de fire-rate alto necesitan ajustarse
⚠️ **Trigger 'Nade cambio de meta** - Requiere reaprendizaje de timings

---

## 🚀 APLICACIONES INTEGRADAS

### En Arc001 (Tu App):

✅ **Kettle y Trigger 'Nade agregadas** a `backend/data/seed.js`
✅ **Información del parche** documentada en cambios
✅ **Stats actualizadas** en la base de datos

### Cómo acceder:

```javascript
// Los datos del parche se sincronizarán cuando:
// 1. Las APIs externas actualicen (ARDB, ArcForge)
// 2. Ejecutes el script de sincronización
// 3. Los usuarios accedan a los endpoints de armas

GET /api/weapons      // Ver todas las armas
GET /api/weapons/search?q=kettle  // Buscar Kettle
GET /api/weapons/search?q=trigger // Buscar Trigger Grenade
```

---

## 📝 NOTAS DE DESARROLLO

**De Ossen (Dev Lead):**

> "Update 1.11.0 is rolling out on all platforms and it brings the highly anticipated Abyss cosmetic set along with some fixes and balancing changes to the Trigger 'Nade and Kettle."

**Filosofía de Balance:**

- Penalizar abuso de terceros (macros) sin eliminar armas
- Mantener viabilidad táctica mientras reduces dominancia
- Mejorar la experiencia ambiental del juego

---

## 🔮 PRÓXIMAS FECHAS IMPORTANTES

- **12 de Enero 2026:** Anuncio del parche
- **13 de Enero 2026:** Lanzamiento en todas las plataformas (HOY)
- **13 de Enero 11:59 PM CET:** Límite para reclamar Gilded Pickaxe

---

## 📞 RECURSOS

- **Documentación oficial:** https://arcraiders.com/es/news/patch-notes-1-11-0
- **Discord oficial:** https://discord.com/invite/arcraiders
- **Twitch drops:** https://arcraiders.com/twitch-drops
- **Creator Program:** https://arcraiders.com/creator-program

---

**Última actualización:** 13 de Enero 2026
**Estado:** ✅ Implementado en Arc001
**Próxima sincronización:** Bajo demanda vía APIs externas
