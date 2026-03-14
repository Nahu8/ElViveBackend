# ElVive Backend - Despliegue en Render

Guía paso a paso para desplegar en Render sin problemas.

## Flujo de deploy

1. **GitHub Actions** construye la imagen Docker (con más memoria que Render Free)
2. La imagen se sube a `ghcr.io/Nahu8/elvivebackend:latest`
3. **Render** descarga y ejecuta la imagen (no construye)

---

## Paso 1: Configurar Render

### 1.1 Crear nuevo Web Service

1. En [Render Dashboard](https://dashboard.render.com) → **+ New** → **Web Service**
2. **Importante:** En "Source", selecciona **Docker** y luego **Deploy an existing image**
3. **Image URL:** `ghcr.io/nahu8/elvivebackend:latest`
4. Si el repo es privado: agregar credenciales de GitHub Container Registry
5. **Name:** ElViveBackend
6. **Region:** Oregon (US West) o la más cercana

### 1.2 Variables de entorno

En **Environment** → **Add Environment Variable**, agrega:

| Variable | Valor |
|----------|-------|
| `APP_ENV` | production |
| `APP_DEBUG` | false |
| `APP_KEY` | Ejecutar local: `php artisan key:generate --show` |
| `APP_URL` | `https://elvivebackend.onrender.com` (ajustar tras el deploy) |
| `JWT_SECRET` | Generar: `php artisan tinker` → `Str::random(64)` |
| `DB_CONNECTION` | mysql |
| `DB_HOST` | elvivemysql-nahuelalderete08-09c9.g.aivencloud.com |
| `DB_PORT` | 11430 |
| `DB_DATABASE` | defaultdb |
| `DB_USERNAME` | avnadmin |
| `DB_PASSWORD` | (tu contraseña de Aiven) |
| `DB_SSL_VERIFY` | false |
| `SESSION_DRIVER` | database |
| `CACHE_STORE` | database |
| `QUEUE_CONNECTION` | database |

### 1.3 Configuración avanzada

- **Health Check Path:** `/up`
- **Instance Type:** Free (o Starter si quieres que no se apague)

### 1.4 Deploy Hook (opcional)

Para que Render haga deploy automático cuando GitHub Actions termine:

1. En Render → tu servicio → **Settings** → **Deploy Hook**
2. Copia la URL
3. En GitHub → repo → **Settings** → **Secrets** → **Actions**
4. Nuevo secret: `RENDER_DEPLOY_HOOK_URL` = (pegar URL)

---

## Paso 2: Primer deploy

1. Haz push a `main`: `git push origin main`
2. Espera que GitHub Actions termine (tab Actions)
3. En Render → **Manual Deploy** → **Deploy latest**
4. Cuando termine, actualiza `APP_URL` con la URL real de tu servicio

---

## API Endpoints

Base URL: `https://tu-app.onrender.com`

### Health
- `GET /up` - Health check Laravel
- `GET /api/health` - Health API

### Públicos (Frontend)
- `GET /public/config/home`
- `GET /public/config/contact`
- `GET /public/config/layout`
- `GET /public/config/ministries`
- `GET /public/config/ministries/{id}`
- `GET /public/config/meeting-days`
- `GET /public/events/upcoming`
- `GET /public/events/calendar`

### Auth
- `POST /auth/login` - Login (retorna JWT)
- `POST /auth/users` - Crear usuario (requiere JWT)

### BackOffice (requiere JWT en header: `Authorization: Bearer <token>`)

**Home:** `GET/PUT/PATCH /api/home`, `/api/home/hero`, `/api/home/video`, etc.
**Meeting Days:** `GET/PUT/PATCH /api/meeting-days`, etc.
**Ministries:** `GET/PUT/PATCH /api/ministries-content`, etc.
**Ministry Media:** `GET/POST/DELETE /api/ministry/{id}/icon`, `/api/ministry/{id}/photo`, etc.
**Contact:** `GET/PUT/PATCH /api/contact-info`
**Layout:** `GET/PUT/PATCH /api/layout`
**Events:** `GET/POST/PUT/DELETE /api/events`, `/api/events/{id}`
**Ministries CRUD:** `GET/POST/PUT/DELETE /api/ministries`, `/api/ministries/{id}`
**Contact Messages:** `GET/POST/DELETE /api/contact`, `/api/contact/{id}`
**Media:** `GET/POST/DELETE /api/media`, `/api/media/{id}`

---

## Solución de problemas

- **Build falla en Render:** Asegúrate de usar **imagen existente**, no build desde repo.
- **Error symfony/error-handler:** Solo ocurre si Render intenta hacer build. Usa la imagen de ghcr.io.
- **Migración falla (columna existe):** Las migraciones son idempotentes. Si persiste, revisa la base de datos.
- **502 Bad Gateway:** El servicio puede tardar ~50s en iniciar (instancia Free). Espera y recarga.
