# Keep Render Backend Active

Este archivo contiene instrucciones para mantener tu backend de Render activo y evitar que "duerma".

## Opción 1: UptimeRobot (Recomendado) ⭐

1. Ve a https://uptimerobot.com
2. Crea una cuenta gratuita
3. Click en **"+ Add New Monitor"**
4. Configuración:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Arc Raiders Backend
   - **URL**: `https://tu-backend.onrender.com/api/stats`
   - **Monitoring Interval**: 5 minutes
5. Click en **"Create Monitor"**

¡Listo! UptimeRobot hará ping cada 5 minutos y tu backend nunca dormirá.

## Opción 2: Cron-job.org

1. Ve a https://cron-job.org
2. Crea una cuenta gratuita
3. Click en **"Create cronjob"**
4. Configuración:
   - **Title**: Keep Arc Raiders Alive
   - **Address**: `https://tu-backend.onrender.com/api/stats`
   - **Schedule**: Every 5 minutes
5. Click en **"Create"**

## Opción 3: GitHub Actions (Avanzado)

Crea `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Backend Alive

on:
  schedule:
    # Ejecutar cada 5 minutos
    - cron: "*/5 * * * *"
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Backend
        run: |
          curl -f https://tu-backend.onrender.com/api/stats || exit 0
```

**Nota**: GitHub Actions tiene un límite de 2000 minutos/mes en el plan gratuito.

## ¿Por qué es necesario?

Render Free tiene estas limitaciones:

- El servicio "duerme" después de 15 minutos de inactividad
- Tarda ~30 segundos en despertar cuando recibe una petición
- Esto puede dar una mala experiencia de usuario

Al hacer ping cada 5 minutos, el servicio NUNCA duerme y siempre responde rápido.

## Monitoreo Adicional

UptimeRobot también te envía alertas por email si tu backend cae, lo cual es muy útil para detectar problemas rápidamente.
