# 🔐 SECURITY ALERT - Credenciales Comprometidas

## Fecha: 26 de Enero, 2026

### Problema

GitGuardian detectó credenciales de MongoDB expuestas en el historial de git:

- Usuario MongoDB: `staioirish_db_user`
- Contraseña anterior: **COMPROMETIDA** (ver historial de git)
- Base de datos: `arc001.1tlrpac.mongodb.net`

### Acciones Tomadas

1. ✅ **Credenciales Rotadas**

   - Se cambió la contraseña en MongoDB Atlas
   - Se generó nueva contraseña segura

2. ✅ **Archivos de Configuración Limpiados**

   - `.env` agregado a `.gitignore` (ya lo estaba)
   - Creado `.env.example` sin credenciales
   - Creado `backend/.env.example` sin credenciales

3. ⚠️ **Historial de Git**
   - Las credenciales antiguas están en el historial de git
   - Fueron rotadas y ya no son válidas
   - El repositorio es público, por lo que el historial es visible

### Próximos Pasos

1. **En Render**: Actualizar `MONGODB_URI` con la nueva contraseña
2. **En MongoDB Atlas**: Verificar el acceso y revisar logs
3. **En desarrollo local**: Actualizar `.env` con la nueva contraseña

### Mejores Prácticas

- ✅ Nunca hacer commit de `.env`
- ✅ Siempre usar `.env.example` sin credenciales
- ✅ Revisar `.gitignore` antes de hacer commits
- ✅ Usar variables de entorno en producción
- ✅ Rotar credenciales regularmente

## Referencias

- [Guía de Seguridad](./SECURITY.md)
- [Configuración de Producción](./PRODUCTION_CHECKLIST.md)
