# ElVive Backend - Despliegue en Render

Guía paso a paso para desplegar en Render (Node.js).

## Flujo de deploy

1. **GitHub Actions** construye la imagen Docker
2. La imagen se sube a `ghcr.io/Nahu8/elvivebackend:latest`
3. **Render** descarga y ejecuta la imagen (no construye)

---

## Paso 1: Configurar Render

### 1.1 Crear nuevo Web Service

1. En [Render Dashboard](https://dashboard.render.com) → **+ New** → **Web Service**
2. **IMPORTANTE:** Selecciona **"Deploy an existing image"** (NO "Build from Git")
3. **Image URL:** `ghcr.io/nahu8/elvivebackend:latest`
4. Si el repo es privado: agregar credenciales de GitHub Container Registry
5. **Name:** ElViveBackend
6. **Region:** Oregon (US West) o la más cercana

### 1.2 Variables de entorno

En **Environment** → **Add Environment Variable**, agrega:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `mysql://USER:PASSWORD@HOST:PORT/DATABASE?ssl-mode=REQUIRED` |
| `JWT_SECRET` | Generar: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `PORT` | 8000 |
| `NODE_ENV` | production |

**Ejemplo DATABASE_URL (Aiven):**
```
mysql://avnadmin:tu_password@elvivemysql-xxx.g.aivencloud.com:11430/defaultdb?ssl-mode=REQUIRED
```

### 1.3 Configuración avanzada

- **Health Check Path:** `/up`
- **Instance Type:** Free (o Starter si quieres que no se apague)

### 1.4 Deploy Hook (opcional)

Para deploy automático tras GitHub Actions:

1. Render → tu servicio → **Settings** → **Deploy Hook** → copiar URL
2. GitHub → repo → **Settings** → **Secrets** → Nuevo: `RENDER_DEPLOY_HOOK_URL`

---

## Paso 2: Primer deploy

1. Push a `main`: `git push origin main`
2. Espera que GitHub Actions termine
3. Render → **Manual Deploy** → **Deploy latest**
4. Crear usuario inicial (opcional): ejecutar `node scripts/seed-user.js` localmente con DATABASE_URL de producción, o usar el endpoint `POST /auth/users` con un superadmin existente.

---

## API Endpoints

Base URL: `https://tu-app.onrender.com`

### Health
- `GET /up` - Health check
- `GET /api/health` - Estado API

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
- `POST /auth/users` - Crear usuario (requiere JWT superadmin)

### BackOffice (requiere JWT: `Authorization: Bearer <token>`)

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

- **Build falla en Render:** Usa **imagen existente**, no build desde repo.
- **502 Bad Gateway:** La instancia Free puede tardar ~50s en iniciar.
- **Error de conexión a BD:** Verifica que DATABASE_URL sea correcta y que el host Aiven permita conexiones desde Render.
